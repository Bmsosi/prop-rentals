import { prisma } from "../prisma/client.js";

export async function createInsurance(data) {
  const {
    tenantId,
    leaseId,
    customLeaseId,
    providerName,
    policyNumber,
    coverageType,
    coverageAmount,
    monthlyCost,
    startDate,
    expiryDate,
    documentUrl,
    documentKey,
    notes,
  } = data;

  if (new Date(expiryDate) <= new Date(startDate)) {
    const error = new Error("Expiry date must be after start date");
    error.status = 400;
    throw error;
  }

  const insurance = await prisma.tenantInsurance.create({
    data: {
      tenantId,
      leaseId,
      customLeaseId,
      providerName,
      policyNumber,
      coverageType,
      coverageAmount,
      monthlyCost,
      startDate: new Date(startDate),
      expiryDate: new Date(expiryDate),
      documentUrl,
      documentKey,
      notes,
      status: "PENDING",
    },
    include: {
      tenant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lease: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              streetAddress: true,
            },
          },
        },
      },
      customLease: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              streetAddress: true,
            },
          },
        },
      },
    },
  });

  return insurance;
}

export async function getInsuranceById(insuranceId) {
  const insurance = await prisma.tenantInsurance.findUnique({
    where: { id: insuranceId },
    include: {
      tenant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
        },
      },
      lease: {
        select: {
          id: true,
          propertyAddress: true,
          landlordId: true,
          listing: {
            select: {
              title: true,
              streetAddress: true,
            },
          },
        },
      },
      customLease: {
        select: {
          id: true,
          leaseName: true,
          landlordId: true,
        },
      },
      verifier: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!insurance) {
    const error = new Error("Insurance record not found");
    error.status = 404;
    throw error;
  }

  return insurance;
}

export async function getAllInsurances(filters = {}) {
  const {
    tenantId,
    landlordId,
    status,
    leaseId,
    customLeaseId,
    expiringBefore,
    page: pageParam = 1,
    limit: limitParam = 50,
  } = filters;

  // Parse page and limit as integers
  const page = parseInt(pageParam, 10) || 1;
  const limit = parseInt(limitParam, 10) || 50;

  // Build base conditions (these apply to all queries)
  const baseConditions = {};

  if (tenantId) {
    baseConditions.tenantId = tenantId;
  }

  if (status) {
    baseConditions.status = status;
  }

  if (expiringBefore) {
    baseConditions.expiryDate = {
      lte: new Date(expiringBefore),
    };
  }

  // Construct the where clause
  let where = {};

  if (landlordId) {
    // When filtering by landlordId, we need to check if the lease or customLease belongs to this landlord
    // Do NOT use leaseId/customLeaseId filters when filtering by landlordId
    const landlordCondition = {
      OR: [
        {
          lease: {
            landlordId: landlordId,
          },
        },
        {
          customLease: {
            landlordId: landlordId,
          },
        },
      ],
    };

    // Combine base conditions with landlord condition using AND
    // Prisma requires explicit AND when combining multiple conditions with OR
    if (Object.keys(baseConditions).length > 0) {
      where = {
        AND: [
          baseConditions,
          landlordCondition,
        ],
      };
    } else {
      where = landlordCondition;
    }
    
    console.log(`🔍 getAllInsurances - Filtering by landlordId: ${landlordId}`);
    console.log(`🔍 getAllInsurances - Where clause:`, JSON.stringify(where, null, 2));
  } else {
    // No landlordId filter, can use leaseId/customLeaseId filters
    if (leaseId) {
      baseConditions.leaseId = leaseId;
    }

    if (customLeaseId) {
      baseConditions.customLeaseId = customLeaseId;
    }

    where = baseConditions;
  }

  const skip = (page - 1) * limit;

  // Debug: First, let's see ALL insurance records in the database
  const allInsurancesDebug = await prisma.tenantInsurance.findMany({
    take: 10,
    include: {
      lease: {
        select: {
          id: true,
          landlordId: true,
        },
      },
      customLease: {
        select: {
          id: true,
          landlordId: true,
        },
      },
    },
  });
  
  console.log(`📊 DEBUG - Total insurance records in DB: ${allInsurancesDebug.length}`);
  allInsurancesDebug.forEach((ins, idx) => {
    console.log(`  [${idx}] Insurance ID: ${ins.id}`);
    console.log(`      leaseId: ${ins.leaseId || 'null'}, customLeaseId: ${ins.customLeaseId || 'null'}`);
    console.log(`      lease: ${ins.lease ? `id=${ins.lease.id}, landlordId=${ins.lease.landlordId}` : 'null'}`);
    console.log(`      customLease: ${ins.customLease ? `id=${ins.customLease.id}, landlordId=${ins.customLease.landlordId}` : 'null'}`);
  });

  const [insurances, total] = await Promise.all([
    prisma.tenantInsurance.findMany({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        lease: {
          select: {
            id: true,
            propertyAddress: true,
            landlordId: true,
            listing: {
              select: {
                title: true,
                streetAddress: true,
              },
            },
          },
        },
        customLease: {
          select: {
            id: true,
            leaseName: true,
            landlordId: true,
          },
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.tenantInsurance.count({ where }),
  ]);

  console.log(`📊 getAllInsurances - Query result: ${insurances.length} records (total: ${total})`);
  if (landlordId) {
    console.log(`📊 Filtered by landlordId: ${landlordId}`);
    insurances.forEach((ins, idx) => {
      console.log(`  [${idx}] Insurance ID: ${ins.id}, leaseId: ${ins.leaseId}, customLeaseId: ${ins.customLeaseId}`);
    });
  }

  return {
    insurances,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateInsurance(insuranceId, tenantId, updateData) {
  const insurance = await prisma.tenantInsurance.findUnique({
    where: { id: insuranceId },
  });

  if (!insurance) {
    const error = new Error("Insurance record not found");
    error.status = 404;
    throw error;
  }

  if (insurance.tenantId !== tenantId) {
    const error = new Error("Unauthorized to update this insurance record");
    error.status = 403;
    throw error;
  }

  if (insurance.status !== "PENDING" && insurance.status !== "REJECTED") {
    const error = new Error(
      "Cannot update insurance that has been verified or is expired"
    );
    error.status = 400;
    throw error;
  }

  if (updateData.expiryDate && updateData.startDate) {
    if (new Date(updateData.expiryDate) <= new Date(updateData.startDate)) {
      const error = new Error("Expiry date must be after start date");
      error.status = 400;
      throw error;
    }
  }

  const allowedUpdates = {
    providerName: updateData.providerName,
    policyNumber: updateData.policyNumber,
    coverageType: updateData.coverageType,
    coverageAmount: updateData.coverageAmount,
    monthlyCost: updateData.monthlyCost,
    startDate: updateData.startDate
      ? new Date(updateData.startDate)
      : undefined,
    expiryDate: updateData.expiryDate
      ? new Date(updateData.expiryDate)
      : undefined,
    documentUrl: updateData.documentUrl,
    documentKey: updateData.documentKey,
    notes: updateData.notes,
  };

  Object.keys(allowedUpdates).forEach((key) => {
    if (allowedUpdates[key] === undefined) {
      delete allowedUpdates[key];
    }
  });

  const updatedInsurance = await prisma.tenantInsurance.update({
    where: { id: insuranceId },
    data: allowedUpdates,
    include: {
      tenant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lease: true,
      customLease: true,
    },
  });

  return updatedInsurance;
}

export async function verifyInsurance(insuranceId, landlordId) {
  const insurance = await prisma.tenantInsurance.findUnique({
    where: { id: insuranceId },
    include: {
      lease: {
        select: {
          landlordId: true,
        },
      },
      customLease: {
        select: {
          landlordId: true,
        },
      },
    },
  });

  if (!insurance) {
    const error = new Error("Insurance record not found");
    error.status = 404;
    throw error;
  }

  const isLandlord =
    insurance.lease?.landlordId === landlordId ||
    insurance.customLease?.landlordId === landlordId;

  if (!isLandlord) {
    const error = new Error("Unauthorized to verify this insurance record");
    error.status = 403;
    throw error;
  }

  const now = new Date();
  const expiryDate = new Date(insurance.expiryDate);
  const daysUntilExpiry = Math.floor(
    (expiryDate - now) / (1000 * 60 * 60 * 24)
  );

  let status = "VERIFIED";
  if (expiryDate < now) {
    status = "EXPIRED";
  } else if (daysUntilExpiry <= 30) {
    status = "EXPIRING_SOON";
  }

  const verifiedInsurance = await prisma.tenantInsurance.update({
    where: { id: insuranceId },
    data: {
      status,
      verifiedBy: landlordId,
      verifiedAt: now,
      rejectionReason: null,
    },
    include: {
      tenant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lease: true,
      customLease: true,
      verifier: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return verifiedInsurance;
}

export async function rejectInsurance(
  insuranceId,
  landlordId,
  rejectionReason
) {
  const insurance = await prisma.tenantInsurance.findUnique({
    where: { id: insuranceId },
    include: {
      lease: {
        select: {
          landlordId: true,
        },
      },
      customLease: {
        select: {
          landlordId: true,
        },
      },
    },
  });

  if (!insurance) {
    const error = new Error("Insurance record not found");
    error.status = 404;
    throw error;
  }

  const isLandlord =
    insurance.lease?.landlordId === landlordId ||
    insurance.customLease?.landlordId === landlordId;

  if (!isLandlord) {
    const error = new Error("Unauthorized to reject this insurance record");
    error.status = 403;
    throw error;
  }

  const rejectedInsurance = await prisma.tenantInsurance.update({
    where: { id: insuranceId },
    data: {
      status: "REJECTED",
      rejectionReason,
      verifiedBy: landlordId,
      verifiedAt: new Date(),
    },
    include: {
      tenant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lease: true,
      customLease: true,
      verifier: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return rejectedInsurance;
}

export async function getExpiringInsurances(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const insurances = await prisma.tenantInsurance.findMany({
    where: {
      expiryDate: {
        lte: futureDate,
        gte: new Date(),
      },
      status: {
        in: ["VERIFIED", "EXPIRING_SOON"],
      },
    },
    include: {
      tenant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lease: {
        select: {
          id: true,
          landlordId: true,
          landlord: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      customLease: {
        select: {
          id: true,
          landlordId: true,
          landlord: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return insurances;
}

export async function getExpiredInsurances() {
  const insurances = await prisma.tenantInsurance.findMany({
    where: {
      expiryDate: {
        lt: new Date(),
      },
      status: {
        not: "EXPIRED",
      },
    },
    include: {
      tenant: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      lease: {
        select: {
          id: true,
          landlordId: true,
          landlord: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      customLease: {
        select: {
          id: true,
          landlordId: true,
          landlord: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  return insurances;
}

export async function updateInsuranceStatus(insuranceId, status) {
  const updatedInsurance = await prisma.tenantInsurance.update({
    where: { id: insuranceId },
    data: { status },
  });

  return updatedInsurance;
}
