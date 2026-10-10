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
} from "../services/requestApplicationService.js";
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
    const isSubmitted = 
      application.status !== "PENDING" ||
      (application.fullName && application.fullName !== "N/A" && application.email && application.email !== "na@example.com");

    if (isSubmitted) {
      return res
        .status(403)
        .json({ 
          message: "This application has already been submitted. You cannot submit it again.",
          status: application.status,
        });
    }

    const updatedApplication = await prisma.RequestApplication.update({
      where: { publicId },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        currentAddress: data.currentAddress || null,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
        monthlyIncome: data.monthlyIncome || null,
        message: data.message || null,
        documents: data.documents || null,
        references: data.references || null,
        status: ApplicationStatus.NEW,
      },
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
