import { prisma } from "../prisma/client.js";
import { generateLeaseContractPDF } from "./pdfGenerationService.js";

export const createLease = async (landlordId, data) => {
  console.log('=== createLease called with data ===');
  console.log('unitNumber:', data.unitNumber, '| Type:', typeof data.unitNumber, '| Length:', data.unitNumber?.length);
  console.log('Full data:', JSON.stringify(data, null, 2));
  
  const listing = await prisma.listing.findUnique({
    where: { id: data.listingId },
    include: { landlord: true },
  });

  if (!listing) {
    const err = new Error("Listing not found");
    err.status = 404;
    throw err;
  }

  if (listing.landlordId !== landlordId) {
    const err = new Error("Unauthorized: You do not own this property");
    err.status = 403;
    throw err;
  }

  // Tenant validation - only if tenantId is provided
  if (data.tenantId) {
    const tenant = await prisma.user.findUnique({
      where: { id: data.tenantId },
    });

    if (!tenant) {
      const err = new Error("Tenant not found");
      err.status = 404;
      throw err;
    }
  }

  const lease = await prisma.lease.create({
    data: {
      listingId: data.listingId,
      tenantId: data.tenantId || null,
      landlordId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      rentAmount: data.rentAmount,
      paymentFrequency: data.paymentFrequency,
      securityDeposit: data.securityDeposit,
      paymentMethod: data.paymentMethod,
      leaseStatus: data.leaseStatus || "DRAFT",
      leaseDocument: data.leaseDocument,
      signedContract: data.signedContract,
      notes: data.notes,
      
      // Standard lease form fields
      landlordFullName: data.landlordFullName,
      landlordPhone: data.landlordPhone,
      landlordEmail: data.landlordEmail,
      landlordAddress: data.landlordAddress,
      additionalLandlords: data.additionalLandlords,
      tenantFullName: data.tenantFullName,
      tenantEmail: data.tenantEmail,
      tenantPhone: data.tenantPhone,
      tenantOtherPhone: data.tenantOtherPhone,
      tenantOtherEmail: data.tenantOtherEmail,
      additionalTenants: data.additionalTenants,
      unitNumber: data.unitNumber,
      propertyAddress: data.propertyAddress,
      propertyCity: data.propertyCity,
      propertyState: data.propertyState,
      propertyZipCode: data.propertyZipCode,
      leaseTermType: data.leaseTermType,
      periodicBasis: data.periodicBasis,
      periodicOther: data.periodicOther,
      fixedEndCondition: data.fixedEndCondition,
      vacateReason: data.vacateReason,
      paymentDay: data.paymentDay,
      petDeposit: data.petDeposit,
      petDepositDueDate: data.petDepositDueDate,
      securityDepositDueDate: data.securityDepositDueDate,
      includedServices: data.includedServices,
      parkingSpaces: data.parkingSpaces,
    },
    include: {
      tenant: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      landlord: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          state: true,
          country: true,
        },
      },
    },
  });

  // Generate contract PDF and upload to S3
  try {
    console.log('Generating contract PDF for lease:', lease.id);
    
    // Build tenant info - prioritize form data, fallback to tenant relation
    let tenantFullName = data.tenantFullName;
    let tenantEmail = data.tenantEmail;
    let tenantPhone = data.tenantPhone;
    
    if (lease.tenant && !tenantFullName) {
      tenantFullName = `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim();
    }
    if (lease.tenant && !tenantEmail) {
      tenantEmail = lease.tenant.email;
    }
    if (lease.tenant && !tenantPhone) {
      tenantPhone = lease.tenant.phone;
    }

    // Build landlord info
    let landlordFullName = data.landlordFullName;
    let landlordEmail = data.landlordEmail;
    let landlordPhone = data.landlordPhone;
    
    if (listing.landlord && !landlordFullName) {
      landlordFullName = `${listing.landlord.firstName || ''} ${listing.landlord.lastName || ''}`.trim();
    }
    if (!landlordEmail) {
      landlordEmail = listing.landlord.email;
    }
    if (listing.landlord && !landlordPhone) {
      landlordPhone = listing.landlord.phone;
    }
    
    console.log('About to generate PDF with unitNumber:', lease.unitNumber);
    console.log('Type:', typeof lease.unitNumber, 'Value:', JSON.stringify(lease.unitNumber));
    console.log('Lease object unitNumber:', lease.unitNumber);
    
    const contractPdfUrl = await generateLeaseContractPDF({
      unitNumber: lease.unitNumber,
      propertyAddress: lease.propertyAddress || listing.streetAddress,
      propertyCity: lease.propertyCity || listing.city,
      propertyState: lease.propertyState || listing.state,
      propertyZipCode: lease.propertyZipCode || listing.zipCode,
      landlordFullName,
      landlordAddress: lease.landlordAddress,
      landlordPhone,
      landlordEmail,
      tenantFullName,
      tenantPhone,
      tenantEmail,
      tenantOtherPhone: lease.tenantOtherPhone,
      tenantOtherEmail: lease.tenantOtherEmail,
      startDate: lease.startDate,
      endDate: lease.endDate,
      rentAmount: lease.rentAmount,
      paymentFrequency: lease.paymentFrequency,
      paymentDay: lease.paymentDay,
      securityDeposit: lease.securityDeposit,
      securityDepositDueDate: lease.securityDepositDueDate,
      petDeposit: lease.petDeposit,
      petDepositDueDate: lease.petDepositDueDate,
      parkingSpaces: lease.parkingSpaces,
      includedServices: lease.includedServices,
      // Lease term type fields
      leaseTermType: lease.leaseTermType,
      periodicBasis: lease.periodicBasis,
      periodicOther: lease.periodicOther,
      fixedEndCondition: lease.fixedEndCondition,
      vacateReason: lease.vacateReason,
    });

    // Update lease with the PDF URL
    const updatedLease = await prisma.lease.update({
      where: { id: lease.id },
      data: { contractPdfUrl },
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        landlord: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            country: true,
          },
        },
      },
    });

    console.log('Contract PDF generated successfully:', contractPdfUrl);
    return updatedLease;
  } catch (pdfError) {
    console.error('Failed to generate contract PDF:', pdfError);
    // Return lease without PDF if generation fails
    return lease;
  }
};

export const getAllLeases = async (userId, userRole, filters = {}) => {
  try {
    console.log("🟢 getAllLeases() called with:", {
      userId,
      userRole,
      filters,
    });

    const where = {};

    if (userRole === "LANDLORD" || userRole === "ADMIN") {
      where.landlordId = userId;
    } else if (userRole === "TENANT") {
      where.tenantId = userId;
    }

    if (filters.leaseStatus) {
      where.leaseStatus = filters.leaseStatus;
    }
    if (filters.listingId) {
      where.listingId = filters.listingId;
    }

    console.log("📘 Prisma Query WHERE:", where);

    const leases = await prisma.lease.findMany({
      where,
      include: {
        tenant: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            country: true,
            images: {
              select: {
                id: true,
                url: true,
                isPrimary: true,
              },
              orderBy: [
                { isPrimary: 'desc' },
                { createdAt: 'asc' },
              ],
            },
          },
        },
      },
      orderBy: { id: "asc" },
    });

    // Auto-update expired leases
    const now = new Date();
    const leasesToUpdate = [];
    
    for (const lease of leases) {
      const endDate = new Date(lease.endDate);
      // If lease is ACTIVE but end date has passed, mark it as EXPIRED
      if (lease.leaseStatus === "ACTIVE" && endDate < now) {
        leasesToUpdate.push(lease.id);
      }
    }

    // Batch update expired leases
    if (leasesToUpdate.length > 0) {
      await prisma.lease.updateMany({
        where: { id: { in: leasesToUpdate } },
        data: { leaseStatus: "EXPIRED" },
      });
      
      // Refetch to get updated data
      const updatedLeases = await prisma.lease.findMany({
        where,
        include: {
          tenant: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          listing: {
            select: {
              id: true,
              title: true,
              streetAddress: true,
              city: true,
              state: true,
              country: true,
              images: {
                select: {
                  id: true,
                  url: true,
                  isPrimary: true,
                },
                orderBy: [
                  { isPrimary: 'desc' },
                  { createdAt: 'asc' },
                ],
              },
            },
          },
        },
        orderBy: { id: "asc" },
      });
      
      console.log(`✅ Auto-updated ${leasesToUpdate.length} expired lease(s)`);
      return updatedLeases;
    }

    console.log("✅ Query successful, found leases:", leases.length);
    return leases;
  } catch (error) {
    console.error("🔥 Prisma error in getAllLeases():", error);
    throw new Error("Internal server error from leaseService");
  }
};

export const getLeaseById = async (leaseId, userId, userRole) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      landlord: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          state: true,
          country: true,
          zipCode: true,
          bedrooms: true,
          bathrooms: true,
          totalSquareFeet: true,
          images: {
            select: {
              id: true,
              url: true,
              isPrimary: true,
            },
            orderBy: [
              { isPrimary: 'desc' },
              { createdAt: 'asc' },
            ],
          },
        },
      },
      maintenanceRequests: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lease) {
    const err = new Error("Lease not found");
    err.status = 404;
    throw err;
  }

  if (userRole === "LANDLORD" && lease.landlordId !== userId) {
    const err = new Error("Unauthorized: You do not have access to this lease");
    err.status = 403;
    throw err;
  }

  if (userRole === "TENANT" && lease.tenantId !== userId) {
    const err = new Error("Unauthorized: You do not have access to this lease");
    err.status = 403;
    throw err;
  }

  return lease;
};

export const updateLeaseById = async (leaseId, userId, data) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
  });

  if (!lease) {
    const err = new Error("Lease not found");
    err.status = 404;
    throw err;
  }

  console.log("🔍 Authorization check:", {
    leaseId,
    leaseLandlordId: lease.landlordId,
    requestUserId: userId,
    match: lease.landlordId === userId
  });

  if (lease.landlordId !== userId) {
    const err = new Error(`Unauthorized: This lease belongs to landlord ${lease.landlordId}, but you are user ${userId}. Please logout and login again if you recently re-seeded the database.`);
    err.status = 403;
    throw err;
  }

  // Prepare update data
  const updateData = {};
  
  if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
  if (data.rentAmount !== undefined) updateData.rentAmount = data.rentAmount;
  if (data.paymentFrequency !== undefined) updateData.paymentFrequency = data.paymentFrequency;
  if (data.securityDeposit !== undefined) updateData.securityDeposit = data.securityDeposit;
  if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
  if (data.leaseStatus !== undefined) updateData.leaseStatus = data.leaseStatus;
  if (data.leaseDocument !== undefined) updateData.leaseDocument = data.leaseDocument;
  if (data.signedContract !== undefined) updateData.signedContract = data.signedContract;
  if (data.notes !== undefined) updateData.notes = data.notes;
  
  // Termination fields
  if (data.terminationDate !== undefined) updateData.terminationDate = new Date(data.terminationDate);
  if (data.terminationReason !== undefined) updateData.terminationReason = data.terminationReason;
  if (data.terminationNotes !== undefined) updateData.terminationNotes = data.terminationNotes;
  if (data.terminatedBy !== undefined) updateData.terminatedBy = data.terminatedBy;

  const updatedLease = await prisma.lease.update({
    where: { id: leaseId },
    data: updateData,
    include: {
      tenant: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      landlord: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          state: true,
          country: true,
        },
      },
    },
  });

  // When a lease transitions to TERMINATED, reopen the underlying listing for future leases/applications
  if (updateData.leaseStatus === "TERMINATED" && lease.listingId) {
    try {
      await prisma.listing.update({
        where: { id: lease.listingId },
        data: { status: "ACTIVE" },
      });
    } catch (listingError) {
      console.error(
        `Failed to reset listing ${lease.listingId} to ACTIVE after terminating lease ${leaseId}:`,
        listingError
      );
    }
  }

  return updatedLease;
};

export const deleteLeaseById = async (leaseId, userId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
  });

  if (!lease) {
    const err = new Error("Lease not found");
    err.status = 404;
    throw err;
  }

  if (lease.landlordId !== userId) {
    const err = new Error("Unauthorized: you cannot delete this lease");
    err.status = 403;
    throw err;
  }

  if (lease.leaseStatus === "ACTIVE") {
    const err = new Error(
      "Cannot delete an active lease. Please terminate it first."
    );
    err.status = 400;
    throw err;
  }

  await prisma.lease.delete({
    where: { id: leaseId },
  });

  return { message: "Lease deleted successfully" };
};

export const getLeaseByListingId = async (listingId, landlordId) => {
  const lease = await prisma.lease.findFirst({
    where: {
      listingId,
      landlordId,
    },
    include: {
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      landlord: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          state: true,
          country: true,
          zipCode: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return lease;
};
