import { prisma } from "../prisma/client.js";
import { generatePublicId } from "../utils/generatePublicId.js";

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
      tenantId: data.tenantId || null,
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

  if (application.status !== "NEW") {
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

  return result;
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
