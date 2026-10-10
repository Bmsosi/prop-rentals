import {
  createNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} from "../services/notificationService.js";
import {
  SuccessResponse,
  ErrorResponse,
  HandleError,
} from "../utils/httpResponse.js";
import {
  getFromCache,
  setInCache,
  generateCacheKey,
  invalidateEntityCache,
  CACHE_TTL,
} from "../utils/cache.js";

/**
 * Get all notifications for the authenticated user
 */
export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { isRead, limit = 50, offset = 0 } = req.query;

    const options = {
      isRead: isRead === "true" ? true : isRead === "false" ? false : undefined,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    };

    // Generate cache key with query parameters
    const cacheKey = generateCacheKey("notifications", userId, {
      query: options,
    });

    // Try to get from cache (shorter TTL for notifications - 1 minute)
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const result = await getUserNotifications(userId, options);

    const response = {
      success: true,
      message: "Notifications retrieved successfully",
      data: result,
    };

    // Cache for 1 minute (notifications change frequently)
    await setInCache(cacheKey, response, CACHE_TTL.SHORT);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return HandleError(res, error);
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(req, res) {
  try {
    const userId = req.user.id;

    // Generate cache key for unread count
    const cacheKey = generateCacheKey("notifications:unread", userId);

    // Try to get from cache (very short TTL - 30 seconds)
    const cachedData = await getFromCache(cacheKey);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }

    const count = await getUnreadCount(userId);

    const response = {
      success: true,
      message: "Unread count retrieved successfully",
      data: { count },
    };

    // Cache for 30 seconds (unread count changes frequently)
    await setInCache(cacheKey, response, 30);

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return HandleError(res, error);
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await markAsRead(id, userId);

    // Invalidate notifications cache
    await invalidateEntityCache("notifications", userId);
    await invalidateEntityCache("notifications:unread", userId);

    return SuccessResponse(
      res,
      200,
      "Notification marked as read",
      notification
    );
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return HandleError(res, error);
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(req, res) {
  try {
    const userId = req.user.id;
    const result = await markAllAsRead(userId);

    // Invalidate notifications cache
    await invalidateEntityCache("notifications", userId);
    await invalidateEntityCache("notifications:unread", userId);

    return SuccessResponse(res, 200, "All notifications marked as read", {
      count: result.count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return HandleError(res, error);
  }
}

/**
 * Delete notification
 */
export async function deleteNotificationById(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await deleteNotification(id, userId);
    
    // Invalidate notifications cache
    await invalidateEntityCache('notifications', userId);
    await invalidateEntityCache('notifications:unread', userId);

    return SuccessResponse(res, 200, "Notification deleted successfully");
  } catch (error) {
    console.error("Error deleting notification:", error);
    return HandleError(res, error);
  }
}

/**
 * Delete all read notifications
 */
export async function deleteAllReadNotifications(req, res) {
  try {
    const userId = req.user.id;
    const result = await deleteAllRead(userId);
    
    // Invalidate notifications cache
    await invalidateEntityCache("notifications", userId);
    await invalidateEntityCache("notifications:unread", userId);

    return SuccessResponse(
      res,
      200,
      "Read notifications deleted successfully",
      { count: result.count }
    );
  } catch (error) {
    console.error("Error deleting all read notifications:", error);
    return HandleError(res, error);
  }
}
