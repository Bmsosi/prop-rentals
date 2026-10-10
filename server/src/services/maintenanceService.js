import { prisma } from "../prisma/client.js";
import {
  createMaintenanceRequestNotification,
  createMaintenanceMessageNotification,
  createMaintenanceStatusUpdateNotification,
} from "./notificationService.js";

const dedupe = (arr) => Array.from(new Set(arr));

async function getTenantActiveListing(tenantId) {
  const lease = await prisma.lease.findFirst({
    where: {
      tenantId,
      leaseStatus: "ACTIVE"
    },
    select: {
      listingId: true,
    },
  });

  return lease?.listingId || null;
}

async function createMaintenanceRequest(userId, userRole, data) {
  let leaseId = null;
  let customLeaseId = null;
  let listingId = data.listingId; // fallback

  // TENANT → get listingId from active lease (standard or custom)
  if (userRole === "TENANT") {
    const lease = await prisma.lease.findFirst({
      where: { tenantId: userId, leaseStatus: "ACTIVE" },
    });

    if (lease) {
      leaseId = lease.id;
      listingId = lease.listingId;
    } else {
      const customLease = await prisma.customLease.findFirst({
        where: { tenantId: userId, leaseStatus: "ACTIVE" },
      });

      if (!customLease) {
        const err = new Error("No active lease found for this tenant");
        err.status = 403;
        throw err;
      }

      customLeaseId = customLease.id;
      listingId = customLease.listingId;
    }
  }

  // ADMIN → check ownership
  if (userRole === "ADMIN") {
    if (!listingId) {
      const err = new Error("listingId is required");
      err.status = 400;
      throw err;
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.landlordId !== userId) {
      const err = new Error("You do not own this property");
      err.status = 403;
      throw err;
    }

    const activeLease = await prisma.lease.findFirst({
      where: { listingId, leaseStatus: "ACTIVE" },
    });

    if (activeLease) leaseId = activeLease.id;
  }

  if (!listingId) {
    const err = new Error("listingId could not be determined");
    err.status = 400;
    throw err;
  }

  // Process images
  const images = dedupe((data.images || []).map((u) => u.trim()).filter(Boolean));

  // Create maintenance request
  const maintenanceRequest = await prisma.maintenanceRequest.create({
    data: {
      user: { connect: { id: userId } },
      listing: { connect: { id: listingId } },
      lease: leaseId ? { connect: { id: leaseId } } : undefined,
      customLease: customLeaseId ? { connect: { id: customLeaseId } } : undefined,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.priority || "MEDIUM",
      images:
        images.length > 0 ? { create: images.map((url) => ({ url })) } : undefined,
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      listing: { 
        select: { 
          id: true, 
          title: true, 
          streetAddress: true, 
          city: true, 
          state: true,
          landlordId: true // Ensure landlordId is included for notifications
        } 
      },
      images: true,
      ...(leaseId && { lease: { include: { tenant: true } } }),
      ...(customLeaseId && { customLease: true }),
    },
  });

  // Create notification for the other party (tenant → landlord, landlord → tenant)
  try {
    if (userRole === "TENANT") {
      // Notify landlord about new maintenance request
      const landlordId = maintenanceRequest.listing?.landlordId;
      if (landlordId) {
        console.log(`📧 Creating maintenance request notification for landlord: ${landlordId}`);
        const notification = await createMaintenanceRequestNotification(maintenanceRequest, landlordId);
        console.log(`✅ Maintenance request notification created successfully for landlord: ${landlordId}, notificationId: ${notification?.id}`);
      } else {
        console.error("⚠️ No landlordId found for maintenance request notification");
      }
    } else if (userRole === "ADMIN") {
      // Notify tenant(s) about new maintenance request from landlord
      // Get all active tenants for this listing
      const activeLeases = await prisma.lease.findMany({
        where: {
          listingId,
          leaseStatus: "ACTIVE",
        },
        select: { tenantId: true },
      });
      
      // Also check custom leases
      const activeCustomLeases = await prisma.customLease.findMany({
        where: {
          listingId,
          leaseStatus: "ACTIVE",
        },
        select: { tenantId: true },
      });

      // Get unique tenant IDs
      const tenantIds = [...new Set([
        ...activeLeases.map(l => l.tenantId),
        ...activeCustomLeases.map(l => l.tenantId),
      ])];

      console.log(`📧 Creating maintenance request notifications for ${tenantIds.length} tenant(s):`, tenantIds);

      // Create notifications for all tenants
      for (const tenantId of tenantIds) {
        try {
          const notification = await createMaintenanceRequestNotification(maintenanceRequest, tenantId);
          console.log(`✅ Maintenance request notification created successfully for tenant: ${tenantId}, notificationId: ${notification?.id}`);
        } catch (error) {
          console.error(`❌ Error creating notification for tenant ${tenantId}:`, error);
        }
      }
    }
  } catch (error) {
    // Log error but don't fail the request creation
    console.error("Error creating maintenance request notification:", error);
    console.error("Error stack:", error.stack);
  }

  return maintenanceRequest;
}

async function getAllMaintenanceRequests(userId, userRole, filters = {}) {
  const { status, priority, category, listingId } = filters;

  let whereClause = {};

  if (userRole === "TENANT") {
    // whereClause.userId = userId;
    const activeLease = await prisma.lease.findFirst({
      where: {
        tenantId: userId,
        leaseStatus: "ACTIVE",
      },
      select: { listingId: true },
    });

    const activeCustomLease = await prisma.customLease.findFirst({
      where: {
        tenantId: userId,
        leaseStatus: "ACTIVE",
      },
      select: { listingId: true },
    });

    const tenantListingId =
      activeLease?.listingId || activeCustomLease?.listingId;

    if (!tenantListingId) {
      return []; // tenant has no active lease, nothing to show
    }

    whereClause.listingId = tenantListingId;

  } else if (userRole === "ADMIN") {
    // If listingId is provided, filter by both landlordId and listingId
    if (listingId) {
      whereClause.listingId = listingId;
      whereClause.listing = {
        landlordId: userId,
      };
    } else {
      // If no listingId, just filter by landlordId
      whereClause.listing = {
        landlordId: userId,
      };
    }
  }

  if (status) whereClause.status = status;
  if (priority) whereClause.priority = priority;
  if (category) whereClause.category = category;

  const maintenanceRequests = await prisma.maintenanceRequest.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
        },
      },
      images: true,
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          state: true,
        },
      },
      lease: {
        select: {
          id: true,
          tenantId: true,
        },
      },
      invoices: {
        select: {
          id: true,
          amount: true,
          status: true,
        },
      },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  // Calculate total cost for each maintenance request
  const maintenanceWithCosts = maintenanceRequests.map(request => ({
    ...request,
    totalCost: request.invoices.reduce((sum, invoice) => sum + invoice.amount, 0),
  }));

  // Debug logging
  if (listingId) {
    console.log(`📍 Fetching maintenance for listingId: ${listingId}, found ${maintenanceWithCosts.length} records`);
  }

  return maintenanceWithCosts;
}

async function getMaintenanceRequestById(requestId, userId, userRole) {
  const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
        },
      },
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
      lease: {
        select: {
          id: true,
          tenantId: true,
        },
      },
      images: true,
    },
  });

  if (!maintenanceRequest) {
    const err = new Error("Maintenance request not found");
    err.status = 404;
    throw err;
  }

  const isLandlord = maintenanceRequest.listing.landlordId === userId;
  const isCreator = maintenanceRequest.userId === userId;
  const isTenantOfLease = maintenanceRequest.lease?.tenantId === userId;

  if (!isLandlord && !isCreator && !isTenantOfLease) {
    const err = new Error("Unauthorized to view this maintenance request");
    err.status = 403;
    throw err;
  }

  return maintenanceRequest;
}

async function updateMaintenanceRequest(requestId, userId, userRole, updates) {
  const existingRequest = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: {
      listing: true,
      lease: true,
      customLease: true,
    },
  });

  if (!existingRequest) {
    const err = new Error("Maintenance request not found");
    err.status = 404;
    throw err;
  }

  const isLandlord = existingRequest.listing.landlordId === userId;
  const isCreator = existingRequest.userId === userId;
  const isTenantOfLease = existingRequest.lease?.tenantId === userId;
  const isTenantOfCustomLease = existingRequest.customLease?.tenantId === userId;

  // Fallback: tenant has an active (standard/custom) lease on this listing even if the request doesn't store lease linkage
  let isTenantOfListingActiveLease = false;
  if (userRole === "TENANT" && !isTenantOfLease && !isTenantOfCustomLease) {
    const [activeLease, activeCustomLease] = await Promise.all([
      prisma.lease.findFirst({
        where: { listingId: existingRequest.listingId, tenantId: userId, leaseStatus: "ACTIVE" },
        select: { id: true },
      }),
      prisma.customLease.findFirst({
        where: { listingId: existingRequest.listingId, tenantId: userId, leaseStatus: "ACTIVE" },
        select: { id: true },
      }),
    ]);
    isTenantOfListingActiveLease = Boolean(activeLease || activeCustomLease);
  }

  if (!isLandlord && !isCreator && !isTenantOfLease && !isTenantOfCustomLease && !isTenantOfListingActiveLease) {
    const err = new Error("Unauthorized to update this maintenance request");
    err.status = 403;
    throw err;
  }

  let allowedUpdates = {};

  // if (userRole === "TENANT") {
  //   if (updates.description) allowedUpdates.description = updates.description;
  //   if (updates.priority) allowedUpdates.priority = updates.priority;
  // } else if (userRole === "ADMIN") {
  //   if (updates.status) allowedUpdates.status = updates.status;
  //   if (updates.priority) allowedUpdates.priority = updates.priority;
  //   if (updates.description) allowedUpdates.description = updates.description;
  // }

  // suppose to allow updating for both roles (ADMIN and TENANT)
  if (updates.status) allowedUpdates.status = updates.status;
  if (updates.priority) allowedUpdates.priority = updates.priority;
  if (updates.description) allowedUpdates.description = updates.description;

  const updatedRequest = await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: allowedUpdates,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      },
      listing: {
        select: {
          id: true,
          title: true,
          streetAddress: true,
          city: true,
          landlordId: true,
        },
      },
      lease: {
        select: {
          id: true,
          tenantId: true,
        },
      },
      customLease: {
        select: {
          id: true,
          tenantId: true,
        },
      },
      images: true,
    },
  });

  // Create notification for status changes (ACCEPTED/IN_PROGRESS or COMPLETED/FINISHED)
  try {
    const oldStatus = existingRequest.status;
    const newStatus = updatedRequest.status;

    // Only notify if status actually changed
    if (oldStatus !== newStatus) {
      console.log(`📧 Maintenance request status changed: ${oldStatus} -> ${newStatus}`);

      // Determine recipients based on who made the change
      if (userRole === "ADMIN" && (newStatus === "IN_PROGRESS" || newStatus === "COMPLETED")) {
        // Landlord accepted/finished - notify tenant(s)
        const tenantIds = [];
        
        if (updatedRequest.lease?.tenantId) {
          tenantIds.push(updatedRequest.lease.tenantId);
        }
        if (updatedRequest.customLease?.tenantId) {
          tenantIds.push(updatedRequest.customLease.tenantId);
        }

        // Also check for active tenants on the listing
        const activeLeases = await prisma.lease.findMany({
          where: { listingId: updatedRequest.listingId, leaseStatus: "ACTIVE" },
          select: { tenantId: true },
        });
        const activeCustomLeases = await prisma.customLease.findMany({
          where: { listingId: updatedRequest.listingId, leaseStatus: "ACTIVE" },
          select: { tenantId: true },
        });
        
        const allTenantIds = [...new Set([
          ...tenantIds,
          ...activeLeases.map(l => l.tenantId),
          ...activeCustomLeases.map(l => l.tenantId),
        ])];

        console.log(`📧 Notifying ${allTenantIds.length} tenant(s) about status change:`, allTenantIds);

        for (const tenantId of allTenantIds) {
          try {
            await createMaintenanceStatusUpdateNotification(updatedRequest, tenantId, oldStatus, newStatus);
            console.log(`✅ Status update notification created for tenant: ${tenantId}`);
          } catch (error) {
            console.error(`❌ Error creating status notification for tenant ${tenantId}:`, error);
          }
        }
      } else if (userRole === "TENANT" && (newStatus === "IN_PROGRESS" || newStatus === "COMPLETED")) {
        // Tenant marked as in progress/completed - notify landlord
        const landlordId = updatedRequest.listing?.landlordId;
        if (landlordId) {
          console.log(`📧 Notifying landlord about status change: ${landlordId}`);
          try {
            await createMaintenanceStatusUpdateNotification(updatedRequest, landlordId, oldStatus, newStatus);
            console.log(`✅ Status update notification created for landlord: ${landlordId}`);
          } catch (error) {
            console.error(`❌ Error creating status notification for landlord:`, error);
          }
        }
      }
    }
  } catch (error) {
    // Log error but don't fail the update
    console.error("Error creating maintenance status update notification:", error);
    console.error("Error stack:", error.stack);
  }

  return updatedRequest;
}

async function deleteMaintenanceRequest(requestId, userId, userRole) {
  const existingRequest = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: {
      listing: true,
      lease: true,
    },
  });

  if (!existingRequest) {
    const err = new Error("Maintenance request not found");
    err.status = 404;
    throw err;
  }

  const isLandlord = existingRequest.listing.landlordId === userId;
  const isCreator = existingRequest.userId === userId;

  if (!isLandlord && !isCreator) {
    const err = new Error("Unauthorized to delete this maintenance request");
    err.status = 403;
    throw err;
  }

  if (
    existingRequest.status !== "OPEN" &&
    existingRequest.status !== "CANCELLED" &&
    existingRequest.status !== "COMPLETED"
  ) {
    const err = new Error(
      "Cannot delete maintenance request in current status"
    );
    err.status = 400;
    throw err;
  }

  await prisma.maintenanceRequest.delete({
    where: { id: requestId },
  });

  return { message: "Maintenance request deleted successfully" };
}

async function getMaintenanceMessages(requestId, userId, userRole) {
  const req = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: { listing: true, lease: true, customLease: true },
  });
  if (!req) {
    const err = new Error("Maintenance request not found");
    err.status = 404;
    throw err;
  }
  const isLandlord = req.listing.landlordId === userId; // ADMIN role - owner of the listing
  const isCreator = req.userId === userId; // User who created the request (can be ADMIN or TENANT)
  const isTenantOfLease = req.lease?.tenantId === userId;
  const isTenantOfCustomLease = req.customLease?.tenantId === userId;

  // Fallback: tenant has an active (standard/custom) lease on this listing even if the request doesn't store lease linkage
  let isTenantOfListingActiveLease = false;
  if (userRole === "TENANT" && !isTenantOfLease && !isTenantOfCustomLease) {
    const [activeLease, activeCustomLease] = await Promise.all([
      prisma.lease.findFirst({
        where: { listingId: req.listingId, tenantId: userId, leaseStatus: "ACTIVE" },
        select: { id: true },
      }),
      prisma.customLease.findFirst({
        where: { listingId: req.listingId, tenantId: userId, leaseStatus: "ACTIVE" },
        select: { id: true },
      }),
    ]);
    isTenantOfListingActiveLease = Boolean(activeLease || activeCustomLease);
  }

  if (!isLandlord && !isCreator && !isTenantOfLease && !isTenantOfCustomLease && !isTenantOfListingActiveLease) {
    const err = new Error("Unauthorized to view messages");
    err.status = 403;
    throw err;
  }
  const messages = await prisma.maintenanceMessage.findMany({
    where: { maintenanceRequestId: requestId },
    include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return messages;
}

async function addMaintenanceMessage(requestId, userId, userRole, body) {
  if (!body || !body.trim()) {
    const err = new Error("Message body is required");
    err.status = 400;
    throw err;
  }
  const req = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: { listing: true, lease: true, customLease: true },
  });
  if (!req) {
    const err = new Error("Maintenance request not found");
    err.status = 404;
    throw err;
  }
  const isLandlord = req.listing.landlordId === userId; // ADMIN role - owner of the listing
  const isCreator = req.userId === userId; // User who created the request (can be ADMIN or TENANT)
  const isTenantOfLease = req.lease?.tenantId === userId;
  const isTenantOfCustomLease = req.customLease?.tenantId === userId;

  // Fallback: tenant has an active (standard/custom) lease on this listing even if the request doesn't store lease linkage
  let isTenantOfListingActiveLease = false;
  if (userRole === "TENANT" && !isTenantOfLease && !isTenantOfCustomLease) {
    const [activeLease, activeCustomLease] = await Promise.all([
      prisma.lease.findFirst({
        where: { listingId: req.listingId, tenantId: userId, leaseStatus: "ACTIVE" },
        select: { id: true },
      }),
      prisma.customLease.findFirst({
        where: { listingId: req.listingId, tenantId: userId, leaseStatus: "ACTIVE" },
        select: { id: true },
      }),
    ]);
    isTenantOfListingActiveLease = Boolean(activeLease || activeCustomLease);
  }

  if (!isLandlord && !isCreator && !isTenantOfLease && !isTenantOfCustomLease && !isTenantOfListingActiveLease) {
    const err = new Error("Unauthorized to add message");
    err.status = 403;
    throw err;
  }
  const message = await prisma.maintenanceMessage.create({
    data: {
      maintenanceRequestId: requestId,
      senderId: userId,
      body: body.trim(),
    },
    include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } },
  });

  // Create notification for the other party
  try {
    // Get all messages to determine unread count (after the new message is created)
    const allMessages = await prisma.maintenanceMessage.findMany({
      where: { maintenanceRequestId: requestId },
      select: { senderId: true },
    });
    
    console.log(`📨 Maintenance message created. Total messages: ${allMessages.length}, Sender: ${userId}, UserRole: ${userRole}`);

    // Determine recipients (landlord or tenant(s))
    const recipients = [];
    
    if (isLandlord) {
      // Landlord sent message, notify tenant(s)
      if (req.lease?.tenantId) {
        recipients.push(req.lease.tenantId);
      }
      if (req.customLease?.tenantId) {
        recipients.push(req.customLease.tenantId);
      }
      // Also check for active tenants on the listing
      const activeLeases = await prisma.lease.findMany({
        where: { listingId: req.listingId, leaseStatus: "ACTIVE" },
        select: { tenantId: true },
      });
      const activeCustomLeases = await prisma.customLease.findMany({
        where: { listingId: req.listingId, leaseStatus: "ACTIVE" },
        select: { tenantId: true },
      });
      const allTenantIds = [...new Set([
        ...activeLeases.map(l => l.tenantId),
        ...activeCustomLeases.map(l => l.tenantId),
      ])];
      recipients.push(...allTenantIds);
    } else {
      // Tenant sent message, notify landlord
      const landlordId = req.listing.landlordId;
      console.log(`📧 Tenant (${userId}) sent message. Notifying landlord: ${landlordId}`);
      if (landlordId) {
        recipients.push(landlordId);
      }
    }

    // Remove sender from recipients
    const uniqueRecipients = [...new Set(recipients.filter(id => id !== userId && id))];
    console.log(`📧 Recipients after filtering:`, uniqueRecipients);

    // Fetch full request data for notification (do this once outside the loop)
    const requestWithData = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        listing: true,
        user: true,
      },
    });

    // Get unread count for each recipient (messages not from them)
    for (const recipientId of uniqueRecipients) {
      if (!recipientId) {
        console.log(`⚠️ Skipping notification - recipientId is null/undefined`);
        continue;
      }
      
      const unreadCount = allMessages.filter(m => m.senderId !== recipientId).length;
      console.log(`📧 Creating maintenance message notification for recipient: ${recipientId}, unreadCount: ${unreadCount}, totalMessages: ${allMessages.length}`);
      
      // Always create notification when a new message is sent (unreadCount should be > 0 after new message)
      if (unreadCount > 0) {
        try {
          const notification = await createMaintenanceMessageNotification(requestWithData, recipientId, unreadCount);
          console.log(`✅ Maintenance message notification created successfully for recipient: ${recipientId}, notificationId: ${notification?.id}`);
        } catch (error) {
          console.error(`❌ Error creating maintenance message notification for ${recipientId}:`, error);
          console.error(`Error stack:`, error.stack);
        }
      } else {
        console.log(`⚠️ Skipping notification for ${recipientId} - unreadCount is 0 (this shouldn't happen after sending a message)`);
      }
    }
  } catch (error) {
    // Log error but don't fail the message creation
    console.error("Error creating maintenance message notification:", error);
  }

  return message;
}
export {
  createMaintenanceRequest,
  getAllMaintenanceRequests,
  getMaintenanceRequestById,
  updateMaintenanceRequest,
  deleteMaintenanceRequest,
  getMaintenanceMessages,
  addMaintenanceMessage,
};
