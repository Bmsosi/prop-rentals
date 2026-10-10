import {
  createInsurance,
  getInsuranceById,
  getAllInsurances,
  updateInsurance,
  verifyInsurance,
  rejectInsurance,
} from "../services/insuranceService.js";
import {
  generateUploadUrl,
  generateDownloadUrl,
} from "../services/fileStorageService.js";
import { extractInsuranceData } from "../services/ocrService.js";
import { SuccessResponse, HandleError } from "../utils/httpResponse.js";
import {
  createInsuranceUploadedNotification,
  createInsuranceVerifiedNotification,
  createInsuranceRejectedNotification,
} from "../services/notificationService.js";
import {
  sendInsuranceVerifiedEmail,
  sendInsuranceRejectedEmail,
} from "../services/emailService.js";

export async function getPresignedUploadUrl(req, res) {
  try {
    const { fileName, fileType } = req.query;
    const tenantId = req.user.id;

    if (!fileName || !fileType) {
      return res.status(400).json({
        success: false,
        message: "Missing fileName or fileType",
      });
    }

    const result = await generateUploadUrl(
      fileName,
      fileType,
      `insurance/${tenantId}`
    );

    return SuccessResponse(
      res,
      200,
      "Upload URL generated successfully",
      result
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getPresignedDownloadUrl(req, res) {
  try {
    const { key } = req.query;

    if (!key) {
      return res.status(400).json({
        success: false,
        message: "Missing file key",
      });
    }

    const downloadURL = await generateDownloadUrl(key);

    return SuccessResponse(res, 200, "Download URL generated successfully", {
      downloadURL,
    });
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function createInsuranceController(req, res) {
  try {
    const tenantId = req.user.id;
    const insuranceData = {
      ...req.body,
      tenantId,
    };

    const insurance = await createInsurance(insuranceData);

    // Create notification for landlord about insurance upload
    try {
      // Get landlordId from the insurance (from lease or customLease)
      const landlordId = insurance.lease?.landlordId || insurance.customLease?.landlordId;
      
      if (!landlordId) {
        console.error("❌ Error: No landlordId found for insurance", insurance.id);
      } else {
        console.log("📧 Creating insurance uploaded notification for landlord:", {
          landlordId,
          insuranceId: insurance.id,
          tenantId: insurance.tenantId,
          hasTenant: !!insurance.tenant,
          tenantName: insurance.tenant ? `${insurance.tenant.firstName} ${insurance.tenant.lastName}` : 'N/A',
          hasLease: !!insurance.lease,
          hasCustomLease: !!insurance.customLease,
          listingAddress: insurance.lease?.listing?.streetAddress || insurance.customLease?.leaseName || 'N/A',
          providerName: insurance.providerName,
          policyNumber: insurance.policyNumber,
        });
        
        const notification = await createInsuranceUploadedNotification(insurance, landlordId);
        
        console.log("✅ Insurance uploaded notification created successfully:", {
          notificationId: notification?.id,
          userId: notification?.userId,
          type: notification?.type,
          title: notification?.title,
        });
        
        if (!notification || !notification.id) {
          console.error("⚠️ Warning: Notification creation returned null or missing ID");
        }
      }
    } catch (error) {
      // Log error but don't fail the insurance creation
      console.error("❌ Error creating insurance uploaded notification:", error);
      console.error("Error details:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }

    return SuccessResponse(
      res,
      201,
      "Insurance record created successfully",
      insurance
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getInsuranceByIdController(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const insurance = await getInsuranceById(id);

    if (userRole === "TENANT" && insurance.tenantId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this insurance record",
      });
    }

    if (userRole === "ADMIN") {
      const isLandlord =
        insurance.lease?.landlordId === userId ||
        insurance.customLease?.landlordId === userId;

      if (!isLandlord) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized to view this insurance record",
        });
      }
    }

    return SuccessResponse(
      res,
      200,
      "Insurance record retrieved successfully",
      insurance
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function getAllInsurancesController(req, res) {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, leaseId, customLeaseId, page, limit } = req.query;

    const filters = {
      status,
      leaseId,
      customLeaseId,
      page,
      limit,
    };

    if (userRole === "TENANT") {
      filters.tenantId = userId;
    } else if (userRole === "ADMIN" || userRole === "LANDLORD") {
      filters.landlordId = userId;
    }

    const result = await getAllInsurances(filters);

    return SuccessResponse(
      res,
      200,
      "Insurance records retrieved successfully",
      result
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function updateInsuranceController(req, res) {
  try {
    const { id } = req.params;
    const tenantId = req.user.id;
    const updateData = req.body;

    const updatedInsurance = await updateInsurance(id, tenantId, updateData);

    return SuccessResponse(
      res,
      200,
      "Insurance record updated successfully",
      updatedInsurance
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function verifyInsuranceController(req, res) {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;

    const verifiedInsurance = await verifyInsurance(id, landlordId);

    const tenantName = verifiedInsurance.tenant?.firstName && verifiedInsurance.tenant?.lastName
      ? `${verifiedInsurance.tenant.firstName} ${verifiedInsurance.tenant.lastName}`
      : "Tenant";

    // Send notification to tenant about verification
    try {
      if (verifiedInsurance.tenantId) {
        console.log("📧 Creating insurance verified notification for tenant:", {
          tenantId: verifiedInsurance.tenantId,
          insuranceId: verifiedInsurance.id,
          tenantName,
          propertyName: verifiedInsurance.lease?.listing?.streetAddress || verifiedInsurance.customLease?.leaseName || 'N/A',
        });
        const notification = await createInsuranceVerifiedNotification(
          verifiedInsurance,
          verifiedInsurance.tenantId
        );
        console.log("✅ Insurance verified notification created successfully:", {
          notificationId: notification?.id,
          userId: notification?.userId,
          type: notification?.type,
          title: notification?.title,
        });
        
        if (!notification || !notification.id) {
          console.error("⚠️ Warning: Notification creation returned null or missing ID");
        }
      } else {
        console.warn("⚠️ No tenantId found for insurance, skipping notification");
      }
    } catch (error) {
      // Log error but don't fail the insurance verification
      console.error("❌ Error creating insurance verified notification:", error);
      console.error("Error details:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }

    // Send email asynchronously - don't fail verification if email fails
    sendInsuranceVerifiedEmail(
      verifiedInsurance,
      verifiedInsurance.tenant.email,
      tenantName
    ).catch((error) => {
      console.error("Failed to send insurance verified email:", error);
      // Email failure shouldn't prevent verification
    });

    return SuccessResponse(
      res,
      200,
      "Insurance record verified successfully",
      verifiedInsurance
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function rejectInsuranceController(req, res) {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const rejectedInsurance = await rejectInsurance(
      id,
      landlordId,
      rejectionReason
    );

    const tenantName = rejectedInsurance.tenant?.firstName && rejectedInsurance.tenant?.lastName
      ? `${rejectedInsurance.tenant.firstName} ${rejectedInsurance.tenant.lastName}`
      : "Tenant";

    // Send notification to tenant about rejection
    try {
      if (rejectedInsurance.tenantId) {
        console.log("📧 Creating insurance rejected notification for tenant:", {
          tenantId: rejectedInsurance.tenantId,
          insuranceId: rejectedInsurance.id,
          tenantName,
          propertyName: rejectedInsurance.lease?.listing?.streetAddress || rejectedInsurance.customLease?.leaseName || 'N/A',
          rejectionReason,
        });
        const notification = await createInsuranceRejectedNotification(
          rejectedInsurance,
          rejectedInsurance.tenantId
        );
        console.log("✅ Insurance rejected notification created successfully:", {
          notificationId: notification?.id,
          userId: notification?.userId,
          type: notification?.type,
          title: notification?.title,
        });
        
        if (!notification || !notification.id) {
          console.error("⚠️ Warning: Notification creation returned null or missing ID");
        }
      } else {
        console.warn("⚠️ No tenantId found for insurance, skipping notification");
      }
    } catch (error) {
      // Log error but don't fail the insurance rejection
      console.error("❌ Error creating insurance rejected notification:", error);
      console.error("Error details:", error.message);
      if (error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }

    // Send email asynchronously - don't fail rejection if email fails
    sendInsuranceRejectedEmail(
      rejectedInsurance,
      rejectedInsurance.tenant.email,
      tenantName
    ).catch((error) => {
      console.error("Failed to send insurance rejected email:", error);
      // Email failure shouldn't prevent rejection
    });

    return SuccessResponse(
      res,
      200,
      "Insurance record rejected",
      rejectedInsurance
    );
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function sendReminderController(req, res) {
  try {
    const { id } = req.params;
    const landlordId = req.user.id;
    const { message } = req.body;

    const insurance = await getInsuranceById(id);

    const isLandlord =
      insurance.lease?.landlordId === landlordId ||
      insurance.customLease?.landlordId === landlordId;

    if (!isLandlord) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to send reminder for this insurance record",
      });
    }

    return SuccessResponse(res, 200, "Reminder sent successfully", {
      insuranceId: id,
      tenantEmail: insurance.tenant.email,
    });
  } catch (error) {
    return HandleError(res, error);
  }
}

export async function extractInsuranceDataController(req, res) {
  try {
    const { documentUrl, fileType } = req.body;

    if (!documentUrl) {
      return res.status(400).json({
        success: false,
        message: "Document URL is required",
      });
    }

    const result = await extractInsuranceData(documentUrl, fileType || "application/pdf");

    if (!result.success) {
      return SuccessResponse(
        res,
        200,
        "OCR completed with warnings. Please verify and fill in missing fields.",
        result.data
      );
    }

    return SuccessResponse(
      res,
      200,
      "Insurance data extracted successfully",
      result.data
    );
  } catch (error) {
    console.error("Error in extractInsuranceDataController:", error);
    return HandleError(res, error);
  }
}

