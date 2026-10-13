import {
  createApplicationSchema,
  updateApplicationStatusSchema,
} from "../validations/requestApplicationValidation.js";
import {
  createApplication,
  getAllApplicationsByLandlord,
  getApplicationByPublicId,
  updateApplicationStatus,
  deleteApplication,
  bulkDeleteApplications,
  requestDeposit,
  submitDepositReceipt,
  sendApplicationRequirements,
  createApplicationContract,
  submitSignedApplicationContract,
  reviewApplicationContract,
  ensureApplicationLease,
} from "../services/requestApplicationService.js";
import { createTenantInterest } from "../services/requestApplicationService.js";
import {
  CreatedResponse,
  SuccessResponse,
  ErrorResponse,
  HandleError,
} from "../utils/httpResponse.js";
import { prisma, ApplicationStatus } from "../prisma/client.js";

export async function createApplicationController(req, res) {
  try {
    const landlordId = req.user.id;
    const body = createApplicationSchema.parse(req.body);

    const application = await createApplication(landlordId, body);

    return CreatedResponse(
      res,
      "Application created successfully",
      application
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function createTenantInterestController(req, res) {
  try {
    const tenant = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    });

    if (!tenant) {
      return res.status(401).json({ success: false, message: "Tenant not found" });
    }

    const application = await createTenantInterest(
      tenant,
      req.body.listingId,
      req.body.message
    );
    return CreatedResponse(res, "Interest sent to the landlord", application);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getAllApplicationsController(req, res) {
  try {
    const landlordId = req.user.id;
    const filters = {
      status: req.query.status,
      listingId: req.query.listingId,
    };

    const page = parseInt(req.query.page, 10) || 1; // default page 1
    const limit = parseInt(req.query.limit, 10) || 10; // default 10 items per page
    const skip = (page - 1) * limit;

    const { applications, total } = await getAllApplicationsByLandlord(
      landlordId,
      filters,
      skip,
      limit
    );

    return SuccessResponse(res, 200, "Applications retrieved successfully", {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function submitPublicApplicationController(req, res) {
  try {
    const { publicId } = req.params;
    const data = req.body;


    const application = await prisma.RequestApplication.findUnique({
      where: { publicId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            landlordId: true,
          },
        },
      },
    });

    if (!application) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }


    if (application.expirationDate && new Date() > application.expirationDate) {
      return res
        .status(403)
        .json({ message: "This application link has expired." });
    }

    // Check if application has already been submitted
    // An application is considered submitted if:
    // 1. Status is not PENDING (e.g., NEW, APPROVED, REJECTED, etc.)
    // 2. OR it has real data (not placeholder data)
    const hasRealSubmittedData =
      application.fullName && application.fullName !== "N/A" &&
      application.email && application.email !== "na@example.com";
    const isRequirementsStage = application.status === "PENDING" && Boolean(application.requirementsSentAt);
    const isSubmitted =
      !(["PRE_APPROVED"].includes(application.status) || isRequirementsStage) ||
      (hasRealSubmittedData && !isRequirementsStage && application.status !== "PRE_APPROVED");

    if (isSubmitted) {
      return res
        .status(403)
        .json({ 
          message: "This application has already been submitted. You cannot submit it again.",
          status: application.status,
        });
    }

    // A requirements submission contains only documents/consents. Do not
    // overwrite the applicant and rental details collected in the first form.
    const applicationUpdateData = {
      status: ApplicationStatus.PENDING,
    };
    const hasField = (field) => Object.prototype.hasOwnProperty.call(data, field);
    const optionalFields = [
      "fullName",
      "email",
      "phone",
      "currentAddress",
      "currentLandlord",
      "currentLandlordContact",
      "currentJob",
      "monthlyIncome",
      "paymentMethod",
      "numberOfTenants",
      "message",
      "documents",
      "references",
      "occupants",
      "pets",
    ];
    optionalFields.forEach((field) => {
      if (hasField(field)) applicationUpdateData[field] = data[field];
    });
    if (hasField("dateOfBirth")) {
      applicationUpdateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    }
    if (hasField("moveInDate")) {
      applicationUpdateData.moveInDate = data.moveInDate ? new Date(data.moveInDate) : null;
    }

    const updatedApplication = await prisma.RequestApplication.update({
      where: { publicId },
      data: applicationUpdateData,
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            landlordId: true,
          },
        },
      },
    });

    // Optionally, create employmentInfo if provided
    if (data.employmentInfo && data.employmentInfo.length > 0) {
      await Promise.all(
        data.employmentInfo.map((info) =>
          prisma.employmentInfo.create({
            data: {
              applicationId: updatedApplication.id,
              employerName: info.employerName,
              jobTitle: info.jobTitle,
              income: info.income || null,
              duration: info.duration || null,
              address: info.address || null,
              proofDocument: info.proofDocument || null,
            },
          })
        )
      );
    }

    // Create notification for landlord about application submission
    try {
      console.log(`📧 Application submitted - Application ID: ${updatedApplication.id}`);
      console.log(`📧 Application data:`, {
        id: updatedApplication.id,
        fullName: updatedApplication.fullName,
        email: updatedApplication.email,
        listingId: updatedApplication.listingId,
        listing: updatedApplication.listing ? {
          id: updatedApplication.listing.id,
          title: updatedApplication.listing.title,
          streetAddress: updatedApplication.listing.streetAddress,
          landlordId: updatedApplication.listing.landlordId,
        } : null,
      });

      // Get landlordId from application (it's stored directly on RequestApplication model)
      const landlordId = application.landlordId || updatedApplication.landlordId;
      
      console.log(`📧 Landlord ID from application: ${landlordId}`);
      
      if (landlordId) {
        const { createApplicationSubmittedNotification } = await import("../services/notificationService.js");
        console.log(`📧 Creating application submitted notification for landlord: ${landlordId}`);
        const notification = await createApplicationSubmittedNotification(updatedApplication, landlordId);
        console.log(`✅ Application submitted notification created successfully for landlord: ${landlordId}, notificationId: ${notification?.id}`);
      } else {
        console.error("⚠️ No landlordId found for application notification");
        console.error("⚠️ Application landlordId:", application.landlordId);
        console.error("⚠️ Updated Application landlordId:", updatedApplication.landlordId);
        console.error("⚠️ Application listing data:", JSON.stringify(updatedApplication.listing, null, 2));
      }
    } catch (error) {
      // Log error but don't fail the application submission
      console.error("❌ Error creating application submitted notification:", error);
      console.error("❌ Error message:", error.message);
      console.error("❌ Error stack:", error.stack);
    }

    return SuccessResponse(
      res,
      200,
      "Application submitted successfully",
      updatedApplication
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getApplicationByPublicIdController(req, res) {
  try {
    const { publicId } = req.params;

    const application = await getApplicationByPublicId(publicId);

    return SuccessResponse(
      res,
      200,
      "Application retrieved successfully",
      application
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function updateApplicationStatusController(req, res) {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const body = updateApplicationStatusSchema.parse(req.body);

    const result = await updateApplicationStatus(id, landlordId, body);

    const message =
      body.status === "APPROVED"
        ? "Application approved and lease created"
        : `Application ${body.status.toLowerCase()} successfully`;

    return SuccessResponse(res, 200, message, result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function requestDepositController(req, res) {
  try {
    const result = await requestDeposit(req.params.id, req.user.id, req.body);
    return SuccessResponse(res, 200, "Deposit instructions sent to tenant", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function submitDepositReceiptController(req, res) {
  try {
    const result = await submitDepositReceipt(req.params.id, req.user.id, req.body.receiptUrl);
    return SuccessResponse(res, 200, "Deposit receipt submitted", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function sendApplicationRequirementsController(req, res) {
  try {
    const result = await sendApplicationRequirements(req.params.id, req.user.id);
    return SuccessResponse(res, 200, "Application requirements link sent to tenant", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function createApplicationContractController(req, res) {
  try {
    const result = await createApplicationContract(req.params.id, req.user.id, req.body.contractUrl);
    return SuccessResponse(res, 200, "Tenancy agreement sent to tenant", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function submitSignedApplicationContractController(req, res) {
  try {
    const result = await submitSignedApplicationContract(req.params.id, req.user.id, req.body.signedContractUrl);
    return SuccessResponse(res, 200, "Signed tenancy agreement submitted", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function reviewApplicationContractController(req, res) {
  try {
    const result = await reviewApplicationContract(req.params.id, req.user.id, req.body.decision, req.body.feedback);
    return SuccessResponse(res, 200, "Tenancy agreement review saved", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function ensureApplicationLeaseController(req, res) {
  try {
    const result = await ensureApplicationLease(req.params.id, req.user.id);
    return SuccessResponse(res, 200, "Lease prepared from application", result);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function deleteApplicationController(req, res) {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    const result = await deleteApplication(id, landlordId);

    return SuccessResponse(res, 200, result.message);
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function bulkDeleteApplicationsController(req, res) {
  try {
    const { ids } = req.body;
    const landlordId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      return ErrorResponse(res, 400, "Application IDs array is required and must not be empty");
    }

    const result = await bulkDeleteApplications(ids, landlordId);

    return SuccessResponse(res, 200, result.message, { deletedCount: result.deletedCount });
  } catch (error) {
    return HandleError(res, error);
  }
}
