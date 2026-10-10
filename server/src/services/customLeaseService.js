import { prisma } from "../prisma/client.js";

export const createCustomLease = async (landlordId, data) => {
    // console.log('this is data' + data)
    const listing = await prisma.listing.findUnique({
        where: { id: data.listingId },
    });

    if (!listing) {
        throw Object.assign(new Error("Listing not found"), { status: 404 });
    }

    if (listing.landlordId !== landlordId) {
        throw Object.assign(new Error("Unauthorized: You do not own this property"), { status: 403 });
    }

    return prisma.customLease.create({
        data: {
            listingId: data.listingId || null,
            tenantId: data.tenantId || null,
            landlordId,
            leaseName: data.leaseName,
            description: data.description,
            propertyType: data.propertyType,
            fileUrl: data.fileUrl,
            // Accounting fields
            rentAmount: data.rentAmount || null,
            paymentFrequency: data.paymentFrequency || null,
            startDate: data.startDate || null,
            endDate: data.endDate || null,
            paymentDay: data.paymentDay || null,
            securityDeposit: data.securityDeposit || null,
            depositAmount: data.depositAmount || null,
            paymentMethod: data.paymentMethod || null,
            accountingNotes: data.accountingNotes || null,
        },
    });
};

export const getAllCustomLeases = async (userId, role, filters = {}) => {
    console.log('getAllCustomLeases called - userId:', userId, 'role:', role, 'filters:', filters);
    
    const include = {
        listing: {
            select: {
                id: true,
                title: true,
                streetAddress: true,
                city: true,
                state: true,
                country: true,
                images: true,
            },
        },
        tenant: {
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
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
    };

    const where = {};

    if (role === "LANDLORD" || role === "ADMIN") {
        where.landlordId = userId;
    } else if (role === "TENANT") {
        where.tenantId = userId;
    }

    if (filters.listingId) {
        where.listingId = filters.listingId;
    }

    const leases = await prisma.customLease.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
    });

    console.log('Custom leases fetched:', leases.length);
    if (leases.length > 0) {
        console.log('Lease statuses snapshot:', leases.slice(0, 3).map(l => ({ id: l.id, status: l.leaseStatus, listingId: l.listingId })));
    }
    return leases;
};

export const getCustomLeaseById = (id) => {
    return prisma.customLease.findUnique({
        where: { id },
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
        },
    });
};

export const updateCustomLeaseById = async (id, userId, data) => {
    const lease = await prisma.customLease.findUnique({ where: { id } });

    if (!lease) throw Object.assign(new Error("Lease not found"), { status: 404 });

    if (lease.landlordId !== userId)
        throw Object.assign(new Error("Unauthorized"), { status: 403 });

    const updatedLease = await prisma.customLease.update({
        where: { id },
        data,
    });

    if (data.leaseStatus === "TERMINATED" && lease.listingId) {
        try {
            await prisma.listing.update({
                where: { id: lease.listingId },
                data: { status: "ACTIVE" },
            });
        } catch (listingError) {
            console.error(
                `Failed to reset listing ${lease.listingId} to ACTIVE after terminating custom lease ${id}:`,
                listingError
            );
        }
    }

    return updatedLease;
};

export const deleteCustomLeaseById = async (id, userId) => {
    const lease = await prisma.customLease.findUnique({ where: { id } });

    if (!lease) throw Object.assign(new Error("Lease not found"), { status: 404 });

    if (lease.landlordId !== userId)
        throw Object.assign(new Error("Unauthorized"), { status: 403 });

    await prisma.customLease.delete({ where: { id } });

    return { message: "Custom lease deleted successfully" };
};
