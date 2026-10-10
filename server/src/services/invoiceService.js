import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create a new invoice for a maintenance request
 * Automatically creates a MAINTENANCE payment when invoice is created
 */
export const createInvoice = async (data, userId, userRole) => {
  const {
    maintenanceRequestId,
    description,
    amount,
    sharedWithTenant = true,
    sharedWithLandlord = true,
  } = data;

  // Verify maintenance request exists and user has access
  const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
    where: { id: maintenanceRequestId },
    include: {
      listing: {
        include: {
          leases: {
            where: { leaseStatus: "ACTIVE" },
            include: { tenant: true },
          },
          customLeases: {
            where: { leaseStatus: "ACTIVE" },
            include: { tenant: true },
          },
        },
      },
      user: true,
    },
  });

  if (!maintenanceRequest) {
    throw new Error("Maintenance request not found");
  }

  const creatorRole = userRole === "ADMIN" ? "LANDLORD" : userRole;
  const isLandlord = maintenanceRequest.listing.landlordId === userId;

  const tenantHasActiveLease =
    maintenanceRequest.listing.leases.some(
      (lease) => lease.tenantId === userId
    ) ||
    maintenanceRequest.listing.customLeases.some(
      (lease) => lease.tenantId === userId
    );

  const isTenantRequestOwner = maintenanceRequest.userId === userId;

  if (creatorRole === "LANDLORD") {
    if (!isLandlord && userRole !== "ADMIN") {
      throw new Error("Unauthorized to create invoice for this maintenance request");
    }
  } else if (creatorRole === "TENANT") {
    if (!isTenantRequestOwner && !tenantHasActiveLease) {
      throw new Error("Unauthorized to create invoice for this maintenance request");
    }
  } else {
    throw new Error("Unsupported role for invoice creation");
  }

  // Get tenant from active lease (standard or custom)
  const activeLease = maintenanceRequest.listing.leases[0] || maintenanceRequest.listing.customLeases[0];
  const tenantId = activeLease?.tenantId || maintenanceRequest.userId;
  const leaseId = maintenanceRequest.listing.leases[0]?.id || null;
  const customLeaseId = maintenanceRequest.listing.customLeases[0]?.id || null;

  let result;

  if (creatorRole === "LANDLORD") {
    result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          type: "MAINTENANCE",
          amount: parseFloat(amount),
          status: "PENDING",
          dueDate: new Date(),
          landlordId: maintenanceRequest.listing.landlordId,
          tenantId: tenantId,
          leaseId: leaseId,
          customLeaseId: customLeaseId,
          notes: description,
        },
      });

      const invoice = await tx.invoice.create({
        data: {
          maintenanceRequestId,
          description,
          amount: parseFloat(amount),
          status: "PENDING",
          sharedWithTenant: Boolean(sharedWithTenant),
          sharedWithLandlord: true,
          paymentId: payment.id,
          createdById: userId,
          createdByRole: creatorRole,
        },
        include: {
          maintenanceRequest: {
            include: {
              listing: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          payment: true,
        },
      });

      return invoice;
    });
  } else {
    result = await prisma.invoice.create({
      data: {
        maintenanceRequestId,
        description,
        amount: parseFloat(amount),
        status: "PENDING",
        sharedWithTenant: true,
        sharedWithLandlord: Boolean(sharedWithLandlord),
        createdById: userId,
        createdByRole: creatorRole,
      },
      include: {
        maintenanceRequest: {
          include: {
            listing: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
    });
  }

  // Debug logging
  console.log(`\n🧾 INVOICE CREATED:`);
  console.log(`  Invoice ID: ${result.id}`);
  console.log(`  Payment ID: ${result.paymentId}`);
  console.log(`  Creator Role: ${creatorRole}`);
  console.log(`  Created By: ${userId}`);
  console.log(`  Tenant ID: ${tenantId}`);
  console.log(`  Amount: $${amount}`);
  console.log(`  sharedWithTenant: ${result.sharedWithTenant}`);
  console.log(`  sharedWithLandlord: ${result.sharedWithLandlord}`);
  if (!result.sharedWithTenant) {
    console.log(`   🔒 This invoice is NOT shared - payment will be HIDDEN from tenant`);
  } else {
    console.log(`   ✅ This invoice IS shared - payment will be VISIBLE to tenant`);
  }
  if (creatorRole === "TENANT") {
    if (!result.sharedWithLandlord) {
      console.log(`   🔒 This invoice is NOT shared with landlord yet`);
    } else {
      console.log(`   ✅ This invoice IS shared with landlord`);
    }
  }

  return result;
};

/**
 * Get all invoices for a maintenance request
 */
export const getInvoicesByMaintenanceRequest = async (maintenanceRequestId, userId, userRole) => {
  // Verify maintenance request exists and user has access
  const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
    where: { id: maintenanceRequestId },
    include: {
      listing: true,
    },
  });

  if (!maintenanceRequest) {
    throw new Error("Maintenance request not found");
  }

  // Check authorization
  const isLandlord = maintenanceRequest.listing.landlordId === userId;
  const isRequestOwner = maintenanceRequest.userId === userId;
  
  // For tenants, check if they have an active lease for this listing
  let tenantHasActiveLease = false;
  if (userRole === "TENANT") {
    const activeLease = await prisma.lease.findFirst({
      where: {
        listingId: maintenanceRequest.listingId,
        tenantId: userId,
        leaseStatus: "ACTIVE",
      },
    });
    
    const activeCustomLease = await prisma.customLease.findFirst({
      where: {
        listingId: maintenanceRequest.listingId,
        tenantId: userId,
        leaseStatus: "ACTIVE",
      },
    });
    
    tenantHasActiveLease = !!(activeLease || activeCustomLease);
  }
  
  const tenantHasAccess = isRequestOwner || tenantHasActiveLease;

  if (
    userRole !== "ADMIN" &&
    !isLandlord &&
    !(userRole === "TENANT" && tenantHasAccess)
  ) {
    throw new Error("Unauthorized to view invoices for this maintenance request");
  }

  const whereClause = {
    maintenanceRequestId,
  };

  if (userRole === "TENANT") {
    whereClause.OR = [
      { createdById: userId },
      { sharedWithTenant: true },
    ];
  } else if (isLandlord) {
    whereClause.OR = [
      { createdById: userId }, // Landlord-created invoices (old + new)
      { sharedWithLandlord: { not: false } }, // includes true or null
    ];
  }

  const invoices = await prisma.invoice.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      maintenanceRequest: {
        include: {
          listing: true,
        },
      },
      payment: true,
    },
  });

  // Debug logging
  console.log(`\n📋 GET INVOICES BY MAINTENANCE REQUEST:`);
  console.log(`  Maintenance ID: ${maintenanceRequestId}`);
  console.log(`  User ID: ${userId}`);
  console.log(`  User Role: ${userRole}`);
  console.log(`  Is Landlord: ${isLandlord}`);
  console.log(`  Is Request Owner: ${isRequestOwner}`);
  console.log(`  Tenant Has Active Lease: ${tenantHasActiveLease}`);
  console.log(`  Found ${invoices.length} invoices`);
  invoices.forEach((inv, idx) => {
    console.log(
      `    [${idx}] Amount: $${inv.amount}, SharedWithTenant: ${inv.sharedWithTenant}, SharedWithLandlord: ${inv.sharedWithLandlord}, Creator: ${inv.createdByRole}`
    );
  });

  return invoices;
};

/**
 * Get invoice by ID
 */
export const getInvoiceById = async (invoiceId, userId, userRole) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      maintenanceRequest: {
        include: {
          listing: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Check authorization
  const isTenant = invoice.maintenanceRequest.userId === userId;
  const isLandlord = invoice.maintenanceRequest.listing.landlordId === userId;

  if (userRole !== "ADMIN" && !isTenant && !isLandlord) {
    throw new Error("Unauthorized to view this invoice");
  }

  return invoice;
};

/**
 * Update invoice (general - can update sharedWithTenant, status, etc.)
 */
export const updateInvoice = async (invoiceId, updateData, userId, userRole) => {
  const { status, sharedWithTenant, sharedWithLandlord } = updateData;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      maintenanceRequest: {
        include: {
          listing: true,
        },
      },
      payment: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Only landlord can update invoice
  if (userRole !== "ADMIN" && invoice.maintenanceRequest.listing.landlordId !== userId) {
    throw new Error("Only the landlord can update invoice");
  }

  const updatePayload = {};
  if (status !== undefined) {
    updatePayload.status = status;
  }
  if (sharedWithTenant !== undefined) {
    updatePayload.sharedWithTenant = Boolean(sharedWithTenant);
  }
  if (sharedWithLandlord !== undefined) {
    updatePayload.sharedWithLandlord = Boolean(sharedWithLandlord);
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: updatePayload,
    include: {
      maintenanceRequest: {
        include: {
          listing: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      payment: true,
    },
  });

  // Log changes
  console.log(`🔄 Invoice ${invoiceId} updated:`, updatePayload);

  return updatedInvoice;
};

/**
 * Update invoice status and associated payment status
 */
export const updateInvoiceStatus = async (invoiceId, status, userId, userRole) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      maintenanceRequest: {
        include: {
          listing: true,
        },
      },
      payment: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Only landlord can update invoice status
  if (userRole !== "ADMIN" && invoice.maintenanceRequest.listing.landlordId !== userId) {
    throw new Error("Only the landlord can update invoice status");
  }

  // Map invoice status to payment status
  let paymentStatus = "PENDING";
  if (status === "PAID") {
    paymentStatus = "PAID";
  } else if (status === "CANCELLED") {
    paymentStatus = "CANCELLED";
  }

  // Update both invoice and payment in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update invoice
    const updatedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: { status },
      include: {
        maintenanceRequest: {
          include: {
            listing: true,
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    // Update associated payment if exists
    if (invoice.paymentId) {
      await tx.payment.update({
        where: { id: invoice.paymentId },
        data: {
          status: paymentStatus,
          paidDate: status === "PAID" ? new Date() : null,
        },
      });
    }

    return updatedInvoice;
  });

  return result;
};

/**
 * Delete invoice and associated payment
 */
export const deleteInvoice = async (invoiceId, userId, userRole) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      maintenanceRequest: {
        include: {
          listing: true,
        },
      },
      payment: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  // Only landlord can delete invoice
  if (userRole !== "ADMIN" && invoice.maintenanceRequest.listing.landlordId !== userId) {
    throw new Error("Only the landlord can delete invoices");
  }

  // Delete invoice and payment in transaction
  await prisma.$transaction(async (tx) => {
    // Delete invoice first (will set payment.invoiceId to null due to SetNull)
    await tx.invoice.delete({
      where: { id: invoiceId },
    });

    // Delete associated payment if exists
    if (invoice.paymentId) {
      await tx.payment.delete({
        where: { id: invoice.paymentId },
      });
    }
  });

  return { message: "Invoice and associated payment deleted successfully" };
};

/**
 * Get all invoices for a user (landlord or tenant)
 */
export const getAllInvoicesForUser = async (userId, userRole, filters = {}) => {
  let where = {};

  if (userRole === "TENANT") {
    where = {
      OR: [
        {
          maintenanceRequest: {
            userId,
          },
          sharedWithTenant: true,
        },
        {
          createdById: userId,
        },
      ],
    };
  } else if (userRole === "LANDLORD") {
    where = {
      maintenanceRequest: {
        listing: {
          landlordId: userId,
        },
      },
      OR: [
        {
          createdByRole: {
            in: ["LANDLORD", "ADMIN", null],
          },
        },
        {
          createdByRole: "TENANT",
          sharedWithLandlord: true,
        },
      ],
    };
  }

  // Apply status filter if provided
  if (filters.status) {
    where.status = filters.status;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      maintenanceRequest: {
        include: {
          listing: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      payment: true,
    },
  });

  return invoices;
};

