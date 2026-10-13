import { prisma } from "../prisma/client.js";
import { generatePublicId } from "../utils/generatePublicId.js";
import { createNotification } from "./notificationService.js";

export async function createTenantInterest(tenant, listingId, message) {
  const listing = await prisma.Listing.findUnique({
    where: { id: listingId },
    include: { landlord: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!listing || listing.status !== "ACTIVE") {
    const error = new Error("Property is not available");
    error.status = 404;
    throw error;
  }

  const existing = await prisma.RequestApplication.findFirst({
    where: { listingId, tenantId: tenant.id, status: { in: ["NEW", "PENDING"] } },
  });

  if (existing) return existing;

  const application = await prisma.RequestApplication.create({
    data: {
      publicId: generatePublicId(),
      listingId,
      landlordId: listing.landlordId,
      tenantId: tenant.id,
      fullName: `${tenant.firstName || ""} ${tenant.lastName || ""}`.trim(),
      email: tenant.email,
      phone: tenant.phone || null,
      message: message?.trim() || "I am interested in this property.",
      status: "NEW",
    },
  });

  await createNotification({
    userId: listing.landlordId,
    type: "APPLICATION_STATUS",
    title: "New tenant interest",
    body: `${application.fullName || tenant.email} is interested in ${listing.title}.`,
    relatedId: application.id,
    metadata: { listingId, applicationId: application.id },
  });

  if (application.tenantId) {
    await createNotification({
      userId: application.tenantId,
      type: "APPLICATION_STATUS",
      title: "Application link ready",
      body: `Your application link for ${application.listing?.title || "the property"} is ready.`,
      relatedId: application.id,
      metadata: {
        applicationId: application.id,
        publicId: application.publicId,
        action: "COMPLETE_APPLICATION",
      },
    });
  }

  return application;
}

export async function createApplication(landlordId, data) {
  const listing = await prisma.Listing.findUnique({
    where: { id: data.listingId },
  });

  if (!listing) {
    const err = new Error("Listing not found");
    err.status = 404;
    throw err;
  }

  if (listing.landlordId !== landlordId) {
    const err = new Error(
      "You do not have permission to create applications for this listing"
    );
    err.status = 403;
    throw err;
  }

  let tenantId = data.tenantId || null;
  if (!tenantId && data.tenantEmail) {
    const tenant = await prisma.user.findFirst({
      where: { email: data.tenantEmail.toLowerCase(), role: "TENANT" },
      select: { id: true },
    });
    if (!tenant) {
      const error = new Error("No tenant account was found for that email");
      error.status = 404;
      throw error;
    }
    tenantId = tenant.id;
  }
  const publicId = generatePublicId();
  const employmentInfoData = data.employmentInfo
    ? data.employmentInfo.map((info) => ({
        employerName: info.employerName,
        jobTitle: info.jobTitle,
        income: info.income,
        duration: info.duration,
        address: info.address,
        proofDocument: info.proofDocument,
      }))
    : [];
  const application = await prisma.RequestApplication.create({
    data: {
      publicId,
      listingId: data.listingId,
      landlordId,
      tenantId,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      monthlyIncome: data.monthlyIncome || null,
      currentAddress: data.currentAddress || null,
      moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
      occupants: data.occupants || null,
      pets: data.pets || null,
      documents: data.documents || null,
      references: data.references || null,
      message: data.message || null,
      expirationDate: data.expirationDate
        ? new Date(data.expirationDate)
        : null,
      employmentInfo:
        employmentInfoData.length > 0
          ? { create: employmentInfoData }
          : undefined,
    },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          state: true,
          rentAmount: true,
        },
      },
      employmentInfo: true,
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  return application;
}

export async function getAllApplicationsByLandlord(
  landlordId,
  filters = {},
  skip = 0,
  limit = 10
) {
  const { status, listingId } = filters;

  // Get listing IDs that have active or terminated leases
  const activeLeases = await prisma.lease.findMany({
    where: {
      landlordId,
      leaseStatus: 'ACTIVE',
    },
    select: { listingId: true },
  });

  const terminatedLeases = await prisma.lease.findMany({
    where: {
      landlordId,
      leaseStatus: 'TERMINATED',
    },
    select: { listingId: true },
  });

  const activeCustomLeases = await prisma.customLease.findMany({
    where: {
      landlordId,
      leaseStatus: 'ACTIVE',
    },
    select: { listingId: true },
  });

  const terminatedCustomLeases = await prisma.customLease.findMany({
    where: {
      landlordId,
      leaseStatus: 'TERMINATED',
    },
    select: { listingId: true },
  });

  // Combine all listing IDs that should be excluded
  const excludedListingIds = [
    ...activeLeases.map(l => l.listingId).filter(Boolean),
    ...terminatedLeases.map(l => l.listingId).filter(Boolean),
    ...activeCustomLeases.map(l => l.listingId).filter(Boolean),
    ...terminatedCustomLeases.map(l => l.listingId).filter(Boolean),
  ];

  const whereClause = {
    landlordId,
    // Only include applications for listings with ACTIVE status
    listing: {
      status: 'ACTIVE',
    },
    // Exclude applications for listings with active or terminated leases
    ...(excludedListingIds.length > 0 && {
      listingId: {
        notIn: excludedListingIds,
      },
    }),
  };

  if (status) {
    whereClause.status = status;
  }

  if (listingId) {
    whereClause.listingId = listingId;
  }

  // Get total count first
  const total = await prisma.RequestApplication.count({
    where: whereClause,
  });

  // Get paginated data
  const applications = await prisma.RequestApplication.findMany({
    where: whereClause,
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          state: true,
          status: true,
          rentAmount: true,
        },
      },
      employmentInfo: true,
      tenant: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      lease: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          leaseStatus: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: limit,
  });

  return { applications, total };
}

export async function getApplicationByPublicId(publicId) {
  try {
    if (!publicId || typeof publicId !== "string") {
      const err = new Error("Invalid application ID");
      err.status = 400;
      throw err;
    }

    const application = await prisma.RequestApplication.findUnique({
      where: { publicId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            rentAmount: true,
            securityDeposit: true,
            bedrooms: true,
            bathrooms: true,
            description: true,
            images: {
              take: 5,
            },
          },
        },
        employmentInfo: true,
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
    });

    if (!application) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    // Check expiration
    if (application.expirationDate) {
      const now = new Date();
      const expiration = new Date(application.expirationDate);
      console.log("Current time:", now.toISOString());
      console.log("Expiration time:", expiration.toISOString());
      if (now > expiration) {
        const err = new Error("This application link has expired.");
        err.status = 403;
        throw err;
      }
    }

    return application;
  } catch (error) {
    // If it's already our custom error, rethrow it
    if (error.status) {
      throw error;
    }
    // Otherwise, wrap it in a 500 error
    console.error("Database error in getApplicationByPublicId:", error);
    const err = new Error("Failed to retrieve application");
    err.status = 500;
    throw err;
  }
}

export async function updateApplicationStatus(applicationId, landlordId, data) {
  const application = await prisma.RequestApplication.findUnique({
    where: { id: applicationId },
    include: {
      listing: true,
    },
  });

  if (!application) {
    const err = new Error("Application not found");
    err.status = 404;
    throw err;
  }

  if (application.landlordId !== landlordId) {
    const err = new Error(
      "You do not have permission to update this application"
    );
    err.status = 403;
    throw err;
  }

  const allowedStatuses = data.status === "PRE_APPROVED"
    ? ["NEW", "PENDING"]
    : data.status === "REJECTED"
      ? ["NEW", "PENDING", "PRE_APPROVED", "DEPOSIT_REQUESTED", "DEPOSIT_SUBMITTED"]
      : data.status === "APPROVED"
        ? ["DEPOSIT_SUBMITTED"]
        : ["NEW", "PENDING"];

  if (!allowedStatuses.includes(application.status)) {
    const err = new Error(
      `Cannot update application with status: ${application.status}`
    );
    err.status = 400;
    throw err;
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedApplication = await tx.requestApplication.update({
      where: { id: applicationId },
      data: {
        status: data.status,
        reviewedBy: landlordId,
        reviewedAt: new Date(),
        decisionNotes: data.decisionNotes || null,
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            streetAddress: true,
            city: true,
            state: true,
            rentAmount: true,
          },
        },
        employmentInfo: true,
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
    let lease = null;
    if (data.status === "APPROVED" && application.tenantId) {
      const moveInDate = application.moveInDate || new Date();
      const leaseEndDate = new Date(moveInDate);
      leaseEndDate.setFullYear(leaseEndDate.getFullYear() + 1);

      lease = await tx.lease.create({
        data: {
          listingId: application.listingId,
          tenantId: application.tenantId,
          landlordId: application.landlordId,
          startDate: moveInDate,
          endDate: leaseEndDate,
          rentAmount: application.listing.rentAmount,
          paymentFrequency: application.listing.rentCycle || "MONTHLY",
          securityDeposit: application.listing.securityDeposit || 0,
          leaseStatus: "DRAFT",
          notes: `Auto-generated from application ${application.publicId}`,
        },
      });

      await tx.requestApplication.update({
        where: { id: applicationId },
        data: { leaseId: lease.id },
      });
    }

    return { application: updatedApplication, lease };
  });

  if (application.tenantId) {
    const notificationText = {
      PRE_APPROVED: ["Application pre-approved", "Your application has been pre-approved. Complete the application form to continue.", { applicationId, publicId: application.publicId, action: "COMPLETE_APPLICATION" }],
      REJECTED: ["Application not approved", "The landlord has declined your application.", { applicationId }],
      APPROVED: ["Tenant approved", "Your deposit receipt was approved and your tenancy has been approved.", { applicationId }],
    }[data.status];
    if (notificationText) {
      await createNotification({
        userId: application.tenantId,
        type: "APPLICATION_STATUS",
        title: notificationText[0],
        body: notificationText[1],
        relatedId: application.id,
        metadata: notificationText[2],
      });
    }
  }

  return result;
}

export async function requestDeposit(applicationId, landlordId, data) {
  const application = await prisma.RequestApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.landlordId !== landlordId) {
    const error = new Error("Application not found");
    error.status = 404;
    throw error;
  }
  if (application.status !== "PRE_APPROVED" && application.status !== "PENDING") {
    const error = new Error("The application is not ready for a deposit request");
    error.status = 400;
    throw error;
  }
  const updated = await prisma.RequestApplication.update({
    where: { id: applicationId },
    data: {
      status: "DEPOSIT_REQUESTED",
      depositAmount: Number(data.amount),
      depositMethod: data.method,
      depositInstructions: data.instructions,
    },
  });
  if (application.tenantId) {
    await createNotification({
      userId: application.tenantId,
      type: "APPLICATION_STATUS",
      title: "Deposit instructions available",
      body: "The landlord has requested your deposit. Open the application to view the instructions.",
      relatedId: application.id,
      metadata: { applicationId: application.id, publicId: application.publicId, action: "PAY_DEPOSIT" },
    });
  }
  return updated;
}

export async function submitDepositReceipt(applicationId, tenantId, receiptUrl) {
  const application = await prisma.RequestApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.tenantId !== tenantId) {
    const error = new Error("Application not found");
    error.status = 404;
    throw error;
  }
  if (application.status !== "DEPOSIT_REQUESTED") {
    const error = new Error("A deposit has not been requested for this application");
    error.status = 400;
    throw error;
  }
  const updated = await prisma.RequestApplication.update({
    where: { id: applicationId },
    data: { status: "DEPOSIT_SUBMITTED", depositReceiptUrl: receiptUrl, depositSubmittedAt: new Date() },
  });
  await createNotification({
    userId: application.landlordId,
    type: "APPLICATION_STATUS",
    title: "Deposit receipt submitted",
    body: "A tenant has submitted a deposit receipt for your review.",
    relatedId: application.id,
    metadata: { applicationId: application.id, action: "REVIEW_DEPOSIT" },
  });
  return updated;
}

export async function sendApplicationRequirements(applicationId, landlordId) {
  const application = await prisma.RequestApplication.findUnique({
    where: { id: applicationId },
    include: { listing: { select: { title: true } } },
  });
  if (!application || application.landlordId !== landlordId) {
    const error = new Error("Application not found");
    error.status = 404;
    throw error;
  }
  if (application.status !== "PENDING" || !application.tenantId) {
    const error = new Error("The tenant must submit the pre-approval form before requirements can be sent");
    error.status = 400;
    throw error;
  }

  const updated = await prisma.RequestApplication.update({
    where: { id: applicationId },
    data: {
      requirementsSentAt: new Date(),
      message: JSON.stringify({
        photoId: true,
        proofOfIncome: true,
        landlordRef: true,
        ConsentForBackgroundCheck: true,
        ConsentForCreditCheck: true,
      }),
    },
  });
  await createNotification({
    userId: application.tenantId,
    type: "APPLICATION_STATUS",
    title: "Complete your application requirements",
    body: `Upload the required documents and consents for ${application.listing.title}.`,
    relatedId: application.id,
    metadata: { applicationId: application.id, publicId: application.publicId, action: "COMPLETE_REQUIREMENTS" },
  });
  return updated;
}

export async function createApplicationContract(applicationId, landlordId, contractUrl) {
  const application = await prisma.RequestApplication.findUnique({
    where: { id: applicationId },
    include: { listing: { select: { title: true } } },
  });
  if (!application || application.landlordId !== landlordId) {
    const error = new Error("Application not found");
    error.status = 404;
    throw error;
  }
  if (!contractUrl) {
    const error = new Error("A tenancy agreement file is required");
    error.status = 400;
    throw error;
  }

  const updated = await prisma.RequestApplication.update({
    where: { id: applicationId },
    data: {
      contractUrl,
      signedContractUrl: null,
      contractStatus: "SENT",
      contractFeedback: null,
    },
  });

  if (application.tenantId) {
    await createNotification({
      userId: application.tenantId,
      type: "APPLICATION_STATUS",
      title: "Tenancy agreement ready to sign",
      body: `Review, sign, and return the tenancy agreement for ${application.listing.title}.`,
      relatedId: application.id,
      metadata: { applicationId: application.id, publicId: application.publicId, action: "SIGN_CONTRACT" },
    });
  }
  return updated;
}

export async function submitSignedApplicationContract(applicationId, tenantId, signedContractUrl) {
  const application = await prisma.RequestApplication.findUnique({
    where: { id: applicationId },
    include: { listing: { select: { title: true } } },
  });
  if (!application || application.tenantId !== tenantId) {
    const error = new Error("Application not found");
    error.status = 404;
    throw error;
  }
  if (!["SENT", "RESEND_REQUESTED"].includes(application.contractStatus)) {
    const error = new Error("The landlord has not requested a signed agreement");
    error.status = 400;
    throw error;
  }
  if (!signedContractUrl) {
    const error = new Error("A signed agreement file is required");
    error.status = 400;
    throw error;
  }

  const updated = await prisma.RequestApplication.update({
    where: { id: applicationId },
    data: { signedContractUrl, contractStatus: "SIGNED", contractFeedback: null },
  });
  await createNotification({
    userId: application.landlordId,
    type: "APPLICATION_STATUS",
    title: "Signed tenancy agreement received",
    body: `The tenant returned the signed tenancy agreement for ${application.listing.title}.`,
    relatedId: application.id,
    metadata: { applicationId: application.id, status: "SIGNED_CONTRACT" },
  });
  return updated;
}

export async function reviewApplicationContract(applicationId, landlordId, decision, feedback) {
  const application = await prisma.RequestApplication.findUnique({ where: { id: applicationId } });
  if (!application || application.landlordId !== landlordId) {
    const error = new Error("Application not found");
    error.status = 404;
    throw error;
  }
  if (application.contractStatus !== "SIGNED") {
    const error = new Error("A signed agreement is required before it can be reviewed");
    error.status = 400;
    throw error;
  }

  const normalizedDecision = String(decision || "").toUpperCase();
  const contractStatus = normalizedDecision === "APPROVE" ? "APPROVED" : normalizedDecision === "RESEND" ? "RESEND_REQUESTED" : "REJECTED";
  const updated = await prisma.RequestApplication.update({
    where: { id: applicationId },
    data: {
      contractStatus,
      contractFeedback: feedback || null,
      ...(contractStatus === "APPROVED" ? { status: "APPROVED" } : {}),
    },
  });

  if (application.tenantId) {
    const approved = contractStatus === "APPROVED";
    await createNotification({
      userId: application.tenantId,
      type: "APPLICATION_STATUS",
      title: approved ? "Tenancy agreement approved" : "Tenancy agreement needs attention",
      body: approved
        ? "Your signed tenancy agreement was approved. Your application is now approved."
        : `The landlord asked you to review and resend the tenancy agreement${feedback ? `: ${feedback}` : "."}`,
      relatedId: application.id,
      metadata: { applicationId: application.id, publicId: application.publicId, action: approved ? "CONTRACT_APPROVED" : "SIGN_CONTRACT" },
    });
  }
  return updated;
}

export async function deleteApplication(applicationId, landlordId) {
  const application = await prisma.RequestApplication.findUnique({
    where: { id: applicationId },
  });

  if (!application) {
    const err = new Error("Application not found");
    err.status = 404;
    throw err;
  }

  if (application.landlordId !== landlordId) {
    const err = new Error(
      "You do not have permission to delete this application"
    );
    err.status = 403;
    throw err;
  }
  if (application.status === "APPROVED" && application.leaseId) {
    const err = new Error(
      "Cannot delete approved application with an active lease"
    );
    err.status = 400;
    throw err;
  }

  await prisma.RequestApplication.delete({
    where: { id: applicationId },
  });

  return { message: "Application deleted successfully" };
}

/**
 * Bulk delete applications
 */
export async function bulkDeleteApplications(applicationIds, landlordId) {
  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    const err = new Error(
      "Application IDs array is required and must not be empty"
    );
    err.status = 400;
    throw err;
  }

  // Verify all applications belong to the landlord and can be deleted
  const applications = await prisma.RequestApplication.findMany({
    where: {
      id: { in: applicationIds },
    },
  });

  if (applications.length !== applicationIds.length) {
    const err = new Error("Some applications were not found");
    err.status = 404;
    throw err;
  }

  // Check permissions and validation
  const errors = [];
  for (const app of applications) {
    if (app.landlordId !== landlordId) {
      errors.push(
        `Application ${app.id}: You do not have permission to delete this application`
      );
    }
    if (app.status === "APPROVED" && app.leaseId) {
      errors.push(
        `Application ${app.id}: Cannot delete approved application with an active lease`
      );
    }
  }

  if (errors.length > 0) {
    const err = new Error(errors.join("; "));
    err.status = 400;
    throw err;
  }

  // Delete all applications
  const result = await prisma.RequestApplication.deleteMany({
    where: {
      id: { in: applicationIds },
      landlordId, // Extra safety check
    },
  });

  return {
    message: `Successfully deleted ${result.count} application(s)`,
    deletedCount: result.count,
  };
}
