import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { notificationApi } from "@/lib/notificationApi";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

const NotificationDropdown = () => {
  const { user, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertNotification, setAlertNotification] = useState(null);
  const prevNotificationIdsRef = useRef(new Set());
  const isInitializedRef = useRef(false);

  // Fetch notifications with React Query - automatically polls every 2.5 seconds
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: notificationsError,
  } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return { notifications: [], total: 0 };
      const response = await notificationApi.getAll({ limit: 50 });
      
      // Handle different response structures
      // Backend returns: { success: true, message: "...", data: { notifications: [...], total: ... } }
      // notificationApi.getAll() returns response.data, so response is already the API response object
      // We need response.data to get the inner data object
      const apiData = response?.data || response;
      const notificationsList = Array.isArray(apiData?.notifications) 
        ? apiData.notifications 
        : Array.isArray(apiData) 
          ? apiData 
          : [];
      const total = apiData?.total || notificationsList.length;
      
      console.log(`🔔 API Response:`, {
        hasResponse: !!response,
        hasData: !!apiData,
        hasNotifications: !!apiData?.notifications,
        notificationsIsArray: Array.isArray(notificationsList),
        notificationsLength: notificationsList.length,
        total: total,
        responseStructure: {
          response: typeof response,
          responseData: typeof response?.data,
          apiData: typeof apiData,
        },
      });
      
      return {
        notifications: notificationsList,
        total: total,
      };
    },
    enabled: !!user?.id && !authLoading, // Only fetch when user is available
    refetchInterval: 2000, // Poll every 2.5 seconds (between 2-3 seconds)
    refetchIntervalInBackground: true, // Continue polling even when tab is in background
    staleTime: 0, // Always consider data stale to ensure fresh fetches
    cacheTime: 0, // Don't cache to always get fresh data
  });

  // Fetch unread count separately
  const {
    data: unreadCountData,
  } = useQuery({
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0 };
      const response = await notificationApi.getUnreadCount();
      // Handle different response structures
      // Backend returns: { success: true, message: "...", data: { count: ... } }
      // notificationApi.getUnreadCount() returns response.data, so response is already the API response object
      // We need response.data to get the inner data object
      const apiData = response?.data || response;
      const count = apiData?.count || 0;
      return { count: count };
    },
    enabled: !!user?.id && !authLoading,
    refetchInterval: 2000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    cacheTime: 0,
  });

  // Extract notifications and calculate unread count
  const notifications = notificationsData?.notifications || [];
  const unreadCountFromAPI = unreadCountData?.count ?? 0;
  
  // Debug: Log notifications being fetched
  useEffect(() => {
    if (notifications.length > 0) {
      console.log(`🔔 Notifications fetched: ${notifications.length} total`);
      
      // Check for APPLICATION_STATUS notifications specifically
      const applicationNotifications = notifications.filter(n => n.type === 'APPLICATION_STATUS');
      console.log(`🔔 APPLICATION_STATUS notifications: ${applicationNotifications.length}`, applicationNotifications);
      
      // Log all unique notification types
      const uniqueTypes = [...new Set(notifications.map(n => n.type))];
      console.log(`🔔 Unique notification types:`, uniqueTypes);
      
      // Log first few notifications with their types
      const notificationTypes = notifications.slice(0, 5).map(n => ({
        id: n.id?.substring(0, 10) || 'no-id',
        type: n.type || 'no-type',
        title: n.title || 'no-title',
        isRead: n.isRead,
        userId: n.userId,
        createdAt: n.createdAt,
      }));
      console.log(`🔔 First 5 notifications:`, notificationTypes);
    }
  }, [notifications]);
  
  // Calculate unread count from notifications list as well (more reliable)
  const calculatedUnreadCount = useMemo(() => {
    return notifications.filter(n => {
      return n.isRead === false || n.isRead === undefined || n.isRead === null;
    }).length;
  }, [notifications]);

  // Use calculated count if available, otherwise fall back to API count
  const unreadCount = calculatedUnreadCount > 0 ? calculatedUnreadCount : unreadCountFromAPI;

  // Helper function to invalidate queries based on notification type
  const invalidateQueriesForNotification = useCallback((notification) => {
    const insuranceTypes = [
      "INSURANCE_UPLOADED",
      "INSURANCE_EXPIRING",
      "INSURANCE_EXPIRED",
      "INSURANCE_VERIFIED",
      "INSURANCE_REJECTED"
    ];
    
    const paymentTypes = [
      "PAYMENT_RECEIPT_UPLOADED",
      "PAYMENT_RECEIPT_APPROVED",
      "PAYMENT_RECEIPT_REJECTED",
      "PAYMENT_DUE",
      "PAYMENT_RECEIVED"
    ];
    
    const applicationTypes = [
      "APPLICATION_STATUS"
    ];
    
    const maintenanceTypes = [
      "MAINTENANCE_REQUEST",
      "MAINTENANCE_MESSAGE"
    ];
    
    if (insuranceTypes.includes(notification.type)) {
      // Invalidate insurance queries
      if (user?.role === "ADMIN") {
        queryClient.invalidateQueries({ queryKey: ["insurances"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["tenant-all-leases"] });
        queryClient.invalidateQueries({ queryKey: ["tenant-insurances"] });
      }
    } else if (paymentTypes.includes(notification.type)) {
      // Invalidate payment/accounting queries
      if (user?.role === "ADMIN") {
        queryClient.invalidateQueries({ queryKey: ["payments"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      }
    } else if (applicationTypes.includes(notification.type)) {
      // Invalidate applications queries
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    } else if (maintenanceTypes.includes(notification.type)) {
      // Invalidate maintenance queries
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
    }
  }, [user?.role, queryClient]);

  // Detect new notifications and show alert
  useEffect(() => {
    // Initialize on first load - don't show alert for existing notifications
    if (!isInitializedRef.current && notifications.length > 0) {
      prevNotificationIdsRef.current = new Set(notifications.map(n => n.id));
      isInitializedRef.current = true;
      return;
    }

    if (!notifications.length) {
      prevNotificationIdsRef.current.clear();
      return;
    }

    // Get current notification IDs
    const currentNotificationIds = new Set(notifications.map(n => n.id));
    const prevNotificationIds = prevNotificationIdsRef.current;
    
    // Find new unread notifications
    const newUnreadNotifications = notifications.filter(n => 
      !prevNotificationIds.has(n.id) && !n.isRead
    );
    
    // Automatically invalidate queries for all new notifications
    if (newUnreadNotifications.length > 0 && isInitializedRef.current) {
      newUnreadNotifications.forEach(notification => {
        invalidateQueriesForNotification(notification);
      });
    }
    
    // Show alert for the latest new notification
    if (newUnreadNotifications.length > 0 && isInitializedRef.current) {
      const latestNotification = newUnreadNotifications[0];
      setAlertNotification(latestNotification);
      setShowAlert(true);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 5000);
      
      // Update previous notification IDs
      prevNotificationIdsRef.current = new Set(currentNotificationIds);
      
      return () => clearTimeout(timer);
    }
    
    // Update previous notification IDs
    prevNotificationIdsRef.current = new Set(currentNotificationIds);
  }, [notifications, invalidateQueriesForNotification]);

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      return await notificationApi.markAsRead(notificationId);
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      return await notificationApi.markAllAsRead();
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // Refetch when popover opens
  useEffect(() => {
    if (open && user?.id) {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  }, [open, user?.id, queryClient]);

  const handleNotificationClick = async (notification, e) => {
    // Prevent event propagation to avoid double-firing
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Mark notification as read
    try {
      await markAsReadMutation.mutateAsync(notification.id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
    
    // Close popover
    setOpen(false);
    
    // Navigate based on notification type
    const insuranceTypes = [
      "INSURANCE_UPLOADED",
      "INSURANCE_EXPIRING",
      "INSURANCE_EXPIRED",
      "INSURANCE_VERIFIED",
      "INSURANCE_REJECTED"
    ];
    
    const paymentTypes = [
      "PAYMENT_RECEIPT_UPLOADED",
      "PAYMENT_RECEIPT_APPROVED",
      "PAYMENT_RECEIPT_REJECTED",
      "PAYMENT_DUE",
      "PAYMENT_RECEIVED"
    ];
    
    const applicationTypes = [
      "APPLICATION_STATUS"
    ];
    
    const maintenanceTypes = [
      "MAINTENANCE_REQUEST",
      "MAINTENANCE_MESSAGE"
    ];
    
    // Invalidate relevant queries based on notification type
    if (insuranceTypes.includes(notification.type)) {
      // Invalidate insurance queries
      if (user?.role === "ADMIN") {
        queryClient.invalidateQueries({ queryKey: ["insurances"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["tenant-all-leases"] });
        queryClient.invalidateQueries({ queryKey: ["tenant-insurances"] });
      }
      // Navigate to insurance page
      const insurancePath = user?.role === "ADMIN" ? "/landlord/insurance" : "/tenant/insurance";
      navigate(insurancePath);
    } else if (paymentTypes.includes(notification.type)) {
      // Invalidate payment/accounting queries
      if (user?.role === "ADMIN") {
        queryClient.invalidateQueries({ queryKey: ["payments"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["tenant-payments"] });
      }
      // Navigate to accounting page
      const accountingPath = user?.role === "ADMIN" ? "/landlord/accounting" : "/tenant/accounting";
      navigate(accountingPath);
    } else if (applicationTypes.includes(notification.type)) {
      // Invalidate applications queries
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      // Navigate to applications page
      const applicationsPath = user?.role === "ADMIN" ? "/landlord/applications" : "/tenant/applications";
      navigate(applicationsPath);
    } else if (maintenanceTypes.includes(notification.type)) {
      // Invalidate maintenance queries
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      // Navigate to maintenance page
      const maintenancePath = user?.role === "ADMIN" ? "/landlord/maintenance" : "/tenant/maintenance";
      navigate(maintenancePath);
    }
  };

  const handleReadAll = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      // Close popover
      setOpen(false);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateString).toLocaleDateString();
  };

  const handleAlertClick = () => {
    if (alertNotification) {
      handleNotificationClick(alertNotification, null);
      setShowAlert(false);
    }
  };

  return (
    <>
      {/* Notification Alert */}
      {showAlert && alertNotification && (
        <div
          className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top-5 fade-in duration-300"
          style={{
            maxWidth: '90%',
            width: '320px'
          }}
        >
          {/* Transparent top spacing */}
          <div className="h-14 bg-transparent"></div>
          <div
            className="bg-black/60 backdrop-blur-md rounded-lg p-4 border border-white/20 shadow-lg cursor-pointer hover:bg-black/70 transition-colors"
            onClick={handleAlertClick}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg
                  viewBox="0 0 31 31"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-white"
                >
                  <path
                    d="M15.5001 3.1C13.0335 3.1 10.6681 4.07982 8.92397 5.82391C7.17988 7.56799 6.20006 9.93349 6.20006 12.4V17.9583L5.10421 19.0541C4.88751 19.2709 4.73994 19.5471 4.68016 19.8477C4.62038 20.1483 4.65107 20.4599 4.76836 20.7431C4.88565 21.0263 5.08426 21.2684 5.3391 21.4387C5.59393 21.609 5.89355 21.6999 6.20006 21.7H24.8001C25.1066 21.6999 25.4062 21.609 25.661 21.4387C25.9159 21.2684 26.1145 21.0263 26.2318 20.7431C26.349 20.4599 26.3797 20.1483 26.32 19.8477C26.2602 19.5471 26.1126 19.2709 25.8959 19.0541L24.8001 17.9583V12.4C24.8001 9.93349 23.8202 7.56799 22.0762 5.82391C20.3321 4.07982 17.9666 3.1 15.5001 3.1ZM15.5001 27.9C14.2668 27.9 13.0841 27.4101 12.212 26.538C11.34 25.666 10.8501 24.4833 10.8501 23.25H20.1501C20.1501 24.4833 19.6602 25.666 18.7881 26.538C17.9161 27.4101 16.7333 27.9 15.5001 27.9Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white mb-1">
                  {alertNotification.title}
                </p>
                <p className="text-xs text-white/80 line-clamp-2">
                  {alertNotification.body}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAlert(false);
                }}
                className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative w-9 h-9 p-0 hover:bg-gray-100 rounded-full transition-colors"
          onClick={() => setOpen(!open)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Notification Icon */}
            <svg
              viewBox="0 0 31 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="!size-7 text-gray-700 hover:text-gray-900 transition-colors"
              style={{ width: '24px', height: '24px' }}
            >
              <path
                d="M15.5001 3.1C13.0335 3.1 10.6681 4.07982 8.92397 5.82391C7.17988 7.56799 6.20006 9.93349 6.20006 12.4V17.9583L5.10421 19.0541C4.88751 19.2709 4.73994 19.5471 4.68016 19.8477C4.62038 20.1483 4.65107 20.4599 4.76836 20.7431C4.88565 21.0263 5.08426 21.2684 5.3391 21.4387C5.59393 21.609 5.89355 21.6999 6.20006 21.7H24.8001C25.1066 21.6999 25.4062 21.609 25.661 21.4387C25.9159 21.2684 26.1145 21.0263 26.2318 20.7431C26.349 20.4599 26.3797 20.1483 26.32 19.8477C26.2602 19.5471 26.1126 19.2709 25.8959 19.0541L24.8001 17.9583V12.4C24.8001 9.93349 23.8202 7.56799 22.0762 5.82391C20.3321 4.07982 17.9666 3.1 15.5001 3.1ZM15.5001 27.9C14.2668 27.9 13.0841 27.4101 12.212 26.538C11.34 25.666 10.8501 24.4833 10.8501 23.25H20.1501C20.1501 24.4833 19.6602 25.666 18.7881 26.538C17.9161 27.4101 16.7333 27.9 15.5001 27.9Z"
                fill="currentColor"
              />
            </svg>
            {/* Badge Indicator */}
            {unreadCount > 0 && (
              <span
                className="absolute top-0 right-0 h-5 w-5 min-w-[20px] bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                style={{ zIndex: 10 }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex flex-col">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {isLoadingNotifications ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Loading...
              </div>
            ) : notificationsError ? (
              <div className="px-4 py-8 text-center text-sm text-red-500">
                Error loading notifications
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? "bg-blue-50/50" : ""
                  }`}
                  onClick={(e) => handleNotificationClick(notification, e)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={handleReadAll}
                disabled={markAllAsReadMutation.isPending}
              >
                {markAllAsReadMutation.isPending ? "Marking..." : "Read All"}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
};

export default NotificationDropdown;
