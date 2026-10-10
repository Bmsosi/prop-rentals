import {
  createLease,
  getAllLeases,
  getLeaseById,
  updateLeaseById,
  deleteLeaseById,
  getLeaseByListingId,
} from "../services/leaseService.js";
import {
  createLeaseSchema,
  updateLeaseSchema,
} from "../validations/leaseValidation.js";
import {
  SuccessResponse,
  HandleError,
  CreatedResponse,
} from "../utils/httpResponse.js";
import { prisma } from "../prisma/client.js";
import { generateLeaseContractPDF } from "../services/pdfGenerationService.js";

export const createLeaseController = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const body = createLeaseSchema.parse(req.body);
    const lease = await createLease(landlordId, body);
    return CreatedResponse(res, "Lease created successfully", lease);
  } catch (error) {
    return HandleError(res, error);
  }
};

export const getAllLeasesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      search: req.query.search,
      listingId: req.query.listingId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const leases = await getAllLeases(userId, userRole, filters);
    return SuccessResponse(res, 200, "Leases retrieved successfully", leases);
  } catch (error) {
    return HandleError(res, error);
  }
};

export const getLeaseByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const lease = await getLeaseById(id, userId, userRole);
    return SuccessResponse(res, 200, "Lease retrieved successfully", lease);
  } catch (error) {
    return HandleError(res, error);
  }
};

export const updateLeaseController = async (req, res) => {
  try {
    const { id } = req.params;
    const body = updateLeaseSchema.parse(req.body);
    const userId = req.user.id;

    const updatedLease = await updateLeaseById(id, userId, body);
    return SuccessResponse(
      res,
      200,
      "Lease updated successfully",
      updatedLease
    );
  } catch (error) {
    return HandleError(res, error);
  }
};

export const deleteLeaseController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await deleteLeaseById(id, userId);
    return SuccessResponse(res, 200, result.message);
  } catch (error) {
    return HandleError(res, error);
  }
};

export const bulkDeleteLeasesController = async (req, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "Invalid lease IDs provided" });
    }

    const leases = await prisma.lease.findMany({
      where: {
        id: { in: ids },
        landlordId: userId,
      },
    });

    if (leases.length !== ids.length) {
      return res
        .status(403)
        .json({
          message: "Unauthorized: Some leases do not belong to you",
        });
    }

    await prisma.lease.deleteMany({
      where: {
        id: { in: ids },
        landlordId: userId,
      },
    });

    return SuccessResponse(
      res,
      200,
      `Successfully deleted ${ids.length} lease(s)`
    );
  } catch (error) {
    return HandleError(res, error);
  }
};

export const getTenantLeasesController = async (req, res) => {
  try {
    const tenantId = req.user.id;
    console.log('Fetching leases for tenant:', tenantId);

    const leases = await prisma.lease.findMany({
      where: { tenantId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            country: true,
            zipCode: true,
            images: true,
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
      },
      orderBy: { createdAt: "desc" },
    });

    console.log('Found leases:', leases.length);
    if (leases.length > 0) {
      console.log('Lease statuses:', leases.map(l => ({ id: l.id, status: l.leaseStatus, tenantId: l.tenantId })));
    }

    return SuccessResponse(res, 200, "Tenant leases retrieved", leases);
  } catch (error) {
    console.error('Error fetching tenant leases:', error);
    return HandleError(res, error);
  }
};

export const getLeaseByListingIdController = async (req, res) => {
  try {
    const { listingId } = req.params;
    const lease = await getLeaseByListingId(listingId, req.user.id);
    return SuccessResponse(res, 200, "Lease retrieved successfully", { lease });
  } catch (error) {
    return HandleError(res, error);
  }
};

// NEW: Regenerate contract PDF for existing lease
export const regenerateContractPdfController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get the lease
    const lease = await prisma.lease.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            landlord: true,
          },
        },
        tenant: true,
        landlord: true,
      },
    });

    if (!lease) {
      return res.status(404).json({ message: "Lease not found" });
    }

    // Check authorization
    if (userRole !== "ADMIN" && lease.landlordId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Generate PDF
    console.log('Regenerating contract PDF for lease:', lease.id);
    
    // Build tenant info - prioritize form data, fallback to tenant relation
    let tenantFullName = lease.tenantFullName;
    let tenantEmail = lease.tenantEmail;
    let tenantPhone = lease.tenantPhone;
    
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
    let landlordFullName = lease.landlordFullName;
    let landlordEmail = lease.landlordEmail;
    let landlordPhone = lease.landlordPhone;
    
    if (lease.landlord && !landlordFullName) {
      landlordFullName = `${lease.landlord.firstName || ''} ${lease.landlord.lastName || ''}`.trim();
    }
    if (!landlordEmail) {
      landlordEmail = lease.landlord?.email;
    }
    if (lease.landlord && !landlordPhone) {
      landlordPhone = lease.landlord.phone;
    }
    
    const contractPdfUrl = await generateLeaseContractPDF({
      unitNumber: lease.unitNumber,
      propertyAddress: lease.propertyAddress || lease.listing?.streetAddress,
      propertyCity: lease.propertyCity || lease.listing?.city,
      propertyState: lease.propertyState || lease.listing?.state,
      propertyZipCode: lease.propertyZipCode || lease.listing?.zipCode,
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
      where: { id },
      data: { contractPdfUrl },
    });

    console.log('Contract PDF regenerated successfully:', contractPdfUrl);
    return SuccessResponse(res, 200, "Contract PDF regenerated successfully", {
      contractPdfUrl,
    });
  } catch (error) {
    console.error('Failed to regenerate contract PDF:', error);
    return HandleError(res, error);
  }
};
