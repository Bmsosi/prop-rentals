import { prisma } from "../prisma/client.js";

/**
 * Create a notification
 */
async function createNotification(data) {
  const { userId, type, title, body, relatedId, metadata } = data;

  console.log(`📧 Creating notification:`, {
    userId,
    type,
    title,
    body: body?.substring(0, 50),
    relatedId,
  });

  try {
    const notification = await prisma.Notification.create({
      data: {
        userId,
        type,
        title,
        body,
        relatedId,
        metadata: metadata || {},
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log(`✅ Notification created successfully:`, {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
    });

    return notification;
  } catch (error) {
    console.error(`❌ Failed to create notification:`, {
      error: error.message,
      code: error.code,
      type,
      userId,
      title: title?.substring(0, 50),
    });
    
    // Check for specific Prisma errors
    if (error.code === 'P2003') {
      console.error(`❌ Foreign key constraint failed - userId ${userId} may not exist`);
    } else if (error.message && (error.message.includes('enum') || error.message.includes('NotificationType') || error.message.includes('invalid input value'))) {
      console.error(`❌ CRITICAL: Enum value '${type}' does not exist in NotificationType enum!`);
      console.error(`❌ This means migrations have not been applied.`);
      console.error(`❌ SOLUTION: Run migrations:`);
      console.error(`❌   cd server`);
      console.error(`❌   npx prisma migrate deploy`);
      console.error(`❌   OR for development:`);
      console.error(`❌   npx prisma migrate dev`);
    } else if (error.code === 'P2002') {
      console.error(`❌ Unique constraint violation`);
    }
    
    // Re-throw the error so calling code can handle it
    throw error;
  }
}

/**
 * Get all notifications for a user
 */
async function getUserNotifications(userId, options = {}) {
  const { isRead, limit = 50, offset = 0 } = options;

  const where = { userId };
  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const [notifications, total] = await Promise.all([
    prisma.Notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.Notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    limit,
    offset,
  };
}

/**
 * Get unread notification count for a user
 */
async function getUnreadCount(userId) {
  return prisma.Notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId, userId) {
  const notification = await prisma.Notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    const err = new Error("Notification not found");
    err.status = 404;
    throw err;
  }

  if (notification.userId !== userId) {
    const err = new Error("Unauthorized to mark this notification as read");
    err.status = 403;
    throw err;
  }

  if (notification.isRead) {
    return notification;
  }

  return prisma.Notification.update({
    where: { id: notificationId },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });
}

/**
 * Mark all notifications as read for a user
 */
async function markAllAsRead(userId) {
  const result = await prisma.Notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return result;
}

/**
 * Delete notification
 */
async function deleteNotification(notificationId, userId) {
  const notification = await prisma.Notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    const err = new Error("Notification not found");
    err.status = 404;
    throw err;
  }

  if (notification.userId !== userId) {
    const err = new Error("Unauthorized to delete this notification");
    err.status = 403;
    throw err;
  }

  return prisma.Notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Delete all read notifications for a user
 */
async function deleteAllRead(userId) {
  return prisma.Notification.deleteMany({
    where: {
      userId,
      isRead: true,
    },
  });
}

/**
 * Create maintenance request notification
 */
async function createMaintenanceRequestNotification(request, recipientUserId) {
  const listingName =
    request.listing?.streetAddress || request.listing?.title || "Property";
  const userName =
    request.user?.firstName && request.user?.lastName
      ? `${request.user.firstName} ${request.user.lastName}`
      : "Tenant";

  const title = request.title;
  const body = `New maintenance request from ${userName} at ${listingName}`;

  return createNotification({
    userId: recipientUserId,
    type: "MAINTENANCE_REQUEST",
    title,
    body,
    relatedId: request.id,
    metadata: {
      listingId: request.listingId,
      listingName,
      userName,
      priority: request.priority,
      category: request.category,
    },
  });
}

/**
 * Create maintenance message notification
 */
async function createMaintenanceMessageNotification(
  request,
  recipientUserId,
  unreadCount
) {
  const listingName =
    request.listing?.streetAddress || request.listing?.title || "Property";

  const title = request.title;
  const body = `You have ${unreadCount} new message${
    unreadCount > 1 ? "s" : ""
  } on this maintenance request`;

  return createNotification({
    userId: recipientUserId,
    type: "MAINTENANCE_MESSAGE",
    title,
    body,
    relatedId: request.id,
    metadata: {
      listingId: request.listingId,
      listingName,
      unreadCount,
    },
  });
}

/**
 * Create maintenance status update notification
 */
async function createMaintenanceStatusUpdateNotification(
  request,
  recipientUserId,
  oldStatus,
  newStatus
) {
  const listingName =
    request.listing?.streetAddress || request.listing?.title || "Property";

  // Determine notification message based on status change
  let statusMessage = "";
  if (newStatus === "IN_PROGRESS") {
    statusMessage = "has been accepted and is now in progress";
  } else if (newStatus === "COMPLETED") {
    statusMessage = "has been completed";
  } else {
    statusMessage = `status changed from ${oldStatus} to ${newStatus}`;
  }

  const title = request.title;
  const body = `Maintenance request "${title}" at ${listingName} ${statusMessage}`;

  return createNotification({
    userId: recipientUserId,
    type: "MAINTENANCE_MESSAGE", // Using MAINTENANCE_MESSAGE type for status updates
    title,
    body,
    relatedId: request.id,
    metadata: {
      listingId: request.listingId,
      listingName,
      oldStatus,
      newStatus,
      statusUpdate: true,
    },
  });
}

/**
 * Create application submitted notification (notify landlord)
 */
async function createApplicationSubmittedNotification(application, landlordId) {
  const listingName =
    application.listing?.streetAddress || application.listing?.title || "Property";
  const applicantName = application.fullName || "Applicant";

  const title = "New Application Submitted";
  const body = `${applicantName} has submitted an application for ${listingName}`;

  return createNotification({
    userId: landlordId,
    type: "APPLICATION_STATUS",
    title,
    body,
    relatedId: application.id,
    metadata: {
      applicationId: application.id,
      listingId: application.listingId,
      listingName,
      applicantName,
      applicantEmail: application.email,
      status: application.status,
    },
  });
}

/**
 * Create lease signed notification (notify landlord)
 */
async function createLeaseSignedNotification(lease, landlordId, tenantName) {
  const listingName =
    lease.listing?.streetAddress || 
    lease.listing?.title || 
    lease.propertyAddress || 
    "Property";

  const title = "Lease Signed";
  const body = `${tenantName} has successfully signed the lease for ${listingName}`;

  console.log("📧 Creating lease signed notification:", {
    userId: landlordId,
    type: "APPLICATION_STATUS",
    title,
    body: body.substring(0, 50),
    relatedId: lease.id,
    listingName,
    tenantName,
  });

  return createNotification({
    userId: landlordId,
    type: "APPLICATION_STATUS", // Using APPLICATION_STATUS type for lease signing
    title,
    body,
    relatedId: lease.id,
    metadata: {
      leaseId: lease.id,
      listingId: lease.listingId,
      listingName,
      tenantName,
      leaseStatus: lease.leaseStatus || "ACTIVE",
      leaseType: lease.leaseType || "STANDARD",
    },
  });
}

/**
 * Create payment receipt uploaded notification (notify landlord)
 */
async function createPaymentReceiptUploadedNotification(payment, recipientUserId) {
  const tenantName =
    payment.tenant?.firstName && payment.tenant?.lastName
      ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
      : payment.tenant?.email || "Tenant";

  const listing = payment.lease?.listing || payment.customLease?.listing;
  const propertyName =
    listing?.streetAddress || listing?.title || "Property";

  const paymentType = payment.type === 'RENT' ? 'rent' : 
                      payment.type === 'UTILITIES' ? 'utilities' : 
                      payment.type === 'MAINTENANCE' ? 'maintenance' : 
                      'payment';

  const title = "Payment Receipt Uploaded";
  const body = `${tenantName} uploaded a receipt for ${paymentType} payment ($${payment.amount.toFixed(2)}) at ${propertyName}`;

  return createNotification({
    userId: recipientUserId,
    type: "PAYMENT_RECEIPT_UPLOADED",
    title,
    body,
    relatedId: payment.id,
    metadata: {
      paymentId: payment.id,
      tenantName,
      propertyName,
      amount: payment.amount,
      paymentType: payment.type,
      listingId: listing?.id,
    },
  });
}

/**
 * Create payment receipt approved notification (notify tenant)
 */
async function createPaymentReceiptApprovedNotification(payment, tenantId) {
  const listing = payment.lease?.listing || payment.customLease?.listing;
  const propertyName =
    listing?.streetAddress || listing?.title || "Property";

  const paymentType = payment.type === 'RENT' ? 'rent' : 
                      payment.type === 'UTILITIES' ? 'utilities' : 
                      payment.type === 'MAINTENANCE' ? 'maintenance' : 
                      'payment';

  const title = "Payment Receipt Approved";
  const body = `Your ${paymentType} payment receipt ($${payment.amount.toFixed(2)}) for ${propertyName} has been approved by your landlord. The payment has been marked as paid.`;

  return createNotification({
    userId: tenantId,
    type: "PAYMENT_RECEIPT_APPROVED",
    title,
    body,
    relatedId: payment.id,
    metadata: {
      paymentId: payment.id,
      propertyName,
      amount: payment.amount,
      paymentType: payment.type,
      listingId: listing?.id,
      paidDate: payment.paidDate,
    },
  });
}

/**
 * Create payment receipt rejected notification (notify tenant)
 */
async function createPaymentReceiptRejectedNotification(payment, tenantId, rejectionReason = null) {
  const listing = payment.lease?.listing || payment.customLease?.listing;
  const propertyName =
    listing?.streetAddress || listing?.title || "Property";

  const paymentType = payment.type === 'RENT' ? 'rent' : 
                      payment.type === 'UTILITIES' ? 'utilities' : 
                      payment.type === 'MAINTENANCE' ? 'maintenance' : 
                      'payment';

  const reasonText = rejectionReason ? ` Reason: ${rejectionReason}` : '';
  const title = "Payment Receipt Rejected";
  const body = `Your ${paymentType} payment receipt ($${payment.amount.toFixed(2)}) for ${propertyName} has been rejected by your landlord.${reasonText} Please upload a new receipt with the correct information.`;

  return createNotification({
    userId: tenantId,
    type: "PAYMENT_RECEIPT_REJECTED",
    title,
    body,
    relatedId: payment.id,
    metadata: {
      paymentId: payment.id,
      propertyName,
      amount: payment.amount,
      paymentType: payment.type,
      listingId: listing?.id,
      rejectionReason,
    },
  });
}

/**
 * Create insurance uploaded notification (notify landlord)
 */
async function createInsuranceUploadedNotification(insurance, recipientUserId) {
  const tenantName =
    insurance.tenant?.firstName && insurance.tenant?.lastName
      ? `${insurance.tenant.firstName} ${insurance.tenant.lastName}`
      : insurance.tenant?.email || "Tenant";

  const propertyName =
    insurance.lease?.listing?.streetAddress ||
    insurance.lease?.propertyAddress ||
    insurance.customLease?.leaseName ||
    "Property";

  const title = "Renter's Insurance Uploaded";
  const body = `${tenantName} uploaded renter's insurance for ${propertyName}. Please review and verify or reject the insurance document.`;

  return createNotification({
    userId: recipientUserId,
    type: "INSURANCE_UPLOADED",
    title,
    body,
    relatedId: insurance.id,
    metadata: {
      insuranceId: insurance.id,
      tenantName,
      propertyName,
      providerName: insurance.providerName,
      policyNumber: insurance.policyNumber,
      expiryDate: insurance.expiryDate,
      listingId: insurance.lease?.listing?.id || insurance.customLease?.listingId,
    },
  });
}

async function createInsuranceExpiringNotification(insurance, recipientUserId) {
  const tenantName =
    insurance.tenant?.firstName && insurance.tenant?.lastName
      ? `${insurance.tenant.firstName} ${insurance.tenant.lastName}`
      : insurance.tenant?.email || "Tenant";

  const propertyName =
    insurance.lease?.listing?.streetAddress ||
    insurance.lease?.propertyAddress ||
    insurance.customLease?.leaseName ||
    "Property";

  const daysUntilExpiry = Math.floor(
    (new Date(insurance.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const title = "Renter's Insurance Expiring Soon";
  const body = `${tenantName}'s renter's insurance at ${propertyName} expires in ${daysUntilExpiry} days`;

  return createNotification({
    userId: recipientUserId,
    type: "INSURANCE_EXPIRING",
    title,
    body,
    relatedId: insurance.id,
    metadata: {
      insuranceId: insurance.id,
      tenantName,
      propertyName,
      expiryDate: insurance.expiryDate,
      daysUntilExpiry,
      providerName: insurance.providerName,
      policyNumber: insurance.policyNumber,
    },
  });
}

async function createInsuranceExpiredNotification(insurance, recipientUserId) {
  const tenantName =
    insurance.tenant?.firstName && insurance.tenant?.lastName
      ? `${insurance.tenant.firstName} ${insurance.tenant.lastName}`
      : insurance.tenant?.email || "Tenant";

  const propertyName =
    insurance.lease?.listing?.streetAddress ||
    insurance.lease?.propertyAddress ||
    insurance.customLease?.leaseName ||
    "Property";

  const title = "Renter's Insurance Expired";
  const body = `${tenantName}'s renter's insurance at ${propertyName} has expired`;

  return createNotification({
    userId: recipientUserId,
    type: "INSURANCE_EXPIRED",
    title,
    body,
    relatedId: insurance.id,
    metadata: {
      insuranceId: insurance.id,
      tenantName,
      propertyName,
      expiryDate: insurance.expiryDate,
      providerName: insurance.providerName,
      policyNumber: insurance.policyNumber,
    },
  });
}

async function createInsuranceVerifiedNotification(insurance, tenantId) {
  const propertyName =
    insurance.lease?.listing?.streetAddress ||
    insurance.lease?.propertyAddress ||
    insurance.customLease?.leaseName ||
    "Property";

  const title = "Renter's Insurance Verified";
  const body = `Your renter's insurance for ${propertyName} has been verified`;

  return createNotification({
    userId: tenantId,
    type: "INSURANCE_VERIFIED",
    title,
    body,
    relatedId: insurance.id,
    metadata: {
      insuranceId: insurance.id,
      propertyName,
      verifiedAt: insurance.verifiedAt,
      providerName: insurance.providerName,
      policyNumber: insurance.policyNumber,
    },
  });
}

async function createInsuranceRejectedNotification(insurance, tenantId) {
  const propertyName =
    insurance.lease?.listing?.streetAddress ||
    insurance.lease?.propertyAddress ||
    insurance.customLease?.leaseName ||
    "Property";

  const reasonText = insurance.rejectionReason ? ` Reason: ${insurance.rejectionReason}` : '';
  const title = "Renter's Insurance Rejected";
  const body = `Your renter's insurance for ${propertyName} has been rejected by your landlord.${reasonText} Please upload a new insurance document with the correct information.`;

  return createNotification({
    userId: tenantId,
    type: "INSURANCE_REJECTED",
    title,
    body,
    relatedId: insurance.id,
    metadata: {
      insuranceId: insurance.id,
      propertyName,
      rejectionReason: insurance.rejectionReason,
      providerName: insurance.providerName,
      policyNumber: insurance.policyNumber,
    },
  });
}

export {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  createMaintenanceRequestNotification,
  createMaintenanceMessageNotification,
  createMaintenanceStatusUpdateNotification,
  createApplicationSubmittedNotification,
  createLeaseSignedNotification,
  createPaymentReceiptUploadedNotification,
  createPaymentReceiptApprovedNotification,
  createPaymentReceiptRejectedNotification,
  createInsuranceUploadedNotification,
  createInsuranceExpiringNotification,
  createInsuranceExpiredNotification,
  createInsuranceVerifiedNotification,
  createInsuranceRejectedNotification,
};
