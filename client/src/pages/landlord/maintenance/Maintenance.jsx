import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  maintenanceApi,
  MAINTENANCE_STATUS,
  MAINTENANCE_PRIORITY,
  getStatusDisplayName,
} from "@/lib/maintenanceApi";
import axios from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MaintenanceForm from "./MaintenanceForm";
import MaintenanceColumn from "./MaintenanceColumn";
import MaintenanceSearchBar from "./MaintanenceSearchBar";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";
import MaintenanceDetailsModal from "./MaintenanceDetailsModal";
import { Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function Maintenance() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [properties, setProperties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [chips, setChips] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    category: "",
    listingId: "",
  });
  const queryClient = useQueryClient();
  const [within7Days, setWithin7Days] = useState(false);
  const [within30Days, setWithin30Days] = useState(false);
  const [withinToday, setWithinToday] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    listingId: "",
    category: "",
    priority: MAINTENANCE_PRIORITY.MEDIUM,
    description: "",
    image: null,
    images: [],
  });

  const [updatingActions, setUpdatingActions] = useState({}); // { [requestId]: action }
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [hasTerminatedLease, setHasTerminatedLease] = useState(false);
  const [checkingLeaseStatus, setCheckingLeaseStatus] = useState(true); // Start as true to prevent flash

  const token = useAuthStore((state) => state.token);
  const { user } = useAuthStore();

  const loadListings = useCallback(async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.LISTINGS.GET_ALL);
        const data = response.data;
        const listings = Array.isArray(data) ? data : data.listing || [];

        if (user.role === "TENANT" && listings.length > 0) {
        setFormData((prev) => ({ ...prev, listingId: listings[0].id }));
        }

        setProperties(listings);
      } catch (err) {
        console.error("Error fetching listings:", err);
        toast.error("Failed to fetch properties.");
      }
  }, [user.role]);

  useEffect(() => {
    if (!token) return;
    loadListings();
  }, [token, loadListings]);

  // Check if tenant has terminated lease
  const checkTerminatedLease = useCallback(async () => {
    if (!token || !user?.id || user?.role !== "TENANT") {
      setHasTerminatedLease(false);
      setCheckingLeaseStatus(false);
      return;
    }

    setCheckingLeaseStatus(true);
    try {
      // Fetch standard leases
      const standardResponse = await axios.get(API_ENDPOINTS.TENANT_LEASES.BASE);
      const standardData = standardResponse.data;
      const standardLeases = Array.isArray(standardData) 
        ? standardData 
        : (standardData?.data || standardData?.leases || []);
      
      // Fetch custom leases
      const customResponse = await axios.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
      const customData = customResponse.data;
      const allCustomLeases = Array.isArray(customData) 
        ? customData 
        : (customData?.data || customData?.leases || []);
      
      // Filter custom leases for this tenant
      const tenantCustomLeases = allCustomLeases.filter(
        lease => lease.tenantId === user.id
      );
      
      // Combine all leases
      const allLeases = [...standardLeases, ...tenantCustomLeases];
      
      // Check if any lease has TERMINATED status
      const hasTerminated = allLeases.some(lease => lease.leaseStatus === "TERMINATED");
      
      setHasTerminatedLease(hasTerminated);
    } catch (err) {
      console.error("Error checking terminated lease:", err);
      setHasTerminatedLease(false);
    } finally {
      setCheckingLeaseStatus(false);
    }
  }, [token, user?.id, user?.role]);

  useEffect(() => {
    if (user?.role === "TENANT") {
      checkTerminatedLease();
    } else {
      // For non-tenants, we don't need to check, so set checking to false
      setCheckingLeaseStatus(false);
    }
  }, [user?.role, checkTerminatedLease]);

  // Fetch maintenance requests using React Query
  const { data: maintenanceData, isLoading: loading, refetch: refetchMaintenance } = useQuery({
    queryKey: ['maintenance-requests', user?.id, filters],
    queryFn: async () => {
      if (!token) return { data: [] };
      const data = await maintenanceApi.getAllRequests(filters);
      return data.data || data;
    },
    enabled: !!token && !!user?.id,
  });

  const maintenanceRequests = maintenanceData || [];

  const handleChange = useCallback((e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? (name === "images" ? Array.from(files) : files[0]) : value,
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSaving(true); // start saving

    try {
      // Upload images if any and collect their URLs
      const imageFiles = Array.isArray(formData.images) ? formData.images : [];
      const uploadedImageUrls = [];

      for (const file of imageFiles) {
        try {
          const presignRes = await axios.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-url`, {
            params: { fileName: file.name, fileType: file.type, category: "maintenance" },
          });
          const { uploadURL, fileUrl } = presignRes.data.data || presignRes.data;

          const putRes = await fetch(uploadURL, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!putRes.ok) throw new Error(`Upload failed for ${file.name}`);

          uploadedImageUrls.push(fileUrl);
        } catch (uploadErr) {
          console.error("Image upload error:", uploadErr);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      const requestData = {
        title: formData.title,
        listingId:
          user.role === "TENANT"
            ? properties[0]?.id
            : formData.listingId,
        priority: formData.priority,
        category: formData.category,
        description: formData.description,
        images: uploadedImageUrls,
      };

      if (user.role === "TENANT") {
        delete requestData.listingId;
      }

      await maintenanceApi.createRequest(requestData);

      toast.success("Maintenance request created successfully!");
      setShowModal(false);
      setFormData({
        title: "",
        listingId: "",
        category: "",
        priority: MAINTENANCE_PRIORITY.MEDIUM,
        description: "",
        image: null,
        images: [],
      });

      await refetchMaintenance();
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to create request");
    } finally {
      setSaving(false); // stop saving
    }
  }, [formData, user.role, properties, refetchMaintenance]);

  const handleStatusUpdate = useCallback(async (requestId, actionName, newStatus) => {
    try {
      setUpdatingActions((prev) => ({ ...prev, [requestId]: actionName }));

      await maintenanceApi.updateStatus(requestId, newStatus);

      // Invalidate query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });

      toast.success(`Request ${newStatus.replace(/_/g, " ").toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(`Error updating request: ${error.message}`);
    } finally {
      setUpdatingActions((prev) => {
        const updated = { ...prev };
        delete updated[requestId];
        return updated;
      });
    }
  }, [queryClient]);

  const handleDeleteRequest = useCallback(async () => {
    if (!requestToDelete) return;

    try {
      setUpdatingActions((prev) => ({ ...prev, [requestToDelete]: "Trash" }));

      await maintenanceApi.deleteRequest(requestToDelete);

      // Invalidate query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });

      toast.success("Request deleted successfully!");
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error(`Error deleting request: ${error.message}`);
    } finally {
      setUpdatingActions((prev) => {
        const updated = { ...prev };
        delete updated[requestToDelete];
        return updated;
      });
    }
  }, [requestToDelete]);

  const getRequestsByStatus = useCallback(
    (status) => maintenanceRequests.filter((request) => request.status === status),
    [maintenanceRequests]
  );

  const lowerSearch = useMemo(() => search.trim().toLowerCase(), [search]);
  const getFilteredRequests = useCallback(
    (requests) => {
      const base = !lowerSearch
        ? requests
        : requests.filter((request) => {
        const inTitle = request.title?.toLowerCase().includes(lowerSearch);
        const inDesc = request.description?.toLowerCase().includes(lowerSearch);
        const inListing = request.listing?.title?.toLowerCase().includes(lowerSearch);
        const inFirst = request.user?.firstName?.toLowerCase().includes(lowerSearch);
        const inLast = request.user?.lastName?.toLowerCase().includes(lowerSearch);
        return inTitle || inDesc || inListing || inFirst || inLast;
      });
      if (!within7Days && !within30Days && !withinToday) return base;
      const now = new Date();
      const nowMs = now.getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const in7 = (t) => nowMs - t <= 7 * dayMs;
      const in30 = (t) => nowMs - t <= 30 * dayMs;
      const isToday = (d) => {
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
      };

      return base.filter((r) => {
        const d = new Date(r.createdAt);
        const t = d.getTime();
        if (Number.isNaN(t)) return false;
        const matches7 = within7Days && in7(t);
        const matches30 = within30Days && in30(t);
        const matchesToday = withinToday && isToday(d);
        // If multiple chips active, show items matching ANY of them
        return matches7 || matches30 || matchesToday;
      });
    },
    [lowerSearch, within7Days, within30Days, withinToday]
  );

  const columns = useMemo(
    () => [
    {
      title: getStatusDisplayName(MAINTENANCE_STATUS.OPEN),
      status: MAINTENANCE_STATUS.OPEN,
      actions: ["Cancel", "Accept"],
    },
    {
      title: getStatusDisplayName(MAINTENANCE_STATUS.IN_PROGRESS),
      status: MAINTENANCE_STATUS.IN_PROGRESS,
      actions: ["Reply", "Finish"],
    },
    {
      title: getStatusDisplayName(MAINTENANCE_STATUS.COMPLETED),
      status: MAINTENANCE_STATUS.COMPLETED,
      actions: ["Trash", "View"],
    },
    ],
    []
  );

  const handleActionClick = useCallback((action, requestId) => {
    if (action === "Accept") {
      handleStatusUpdate(requestId, action, MAINTENANCE_STATUS.IN_PROGRESS);
    } else if (action === "Cancel") {
      handleStatusUpdate(requestId, action, MAINTENANCE_STATUS.CANCELLED);
    } else if (action === "Finish") {
      handleStatusUpdate(requestId, action, MAINTENANCE_STATUS.COMPLETED);
    } else if (action === "Trash") {
      setRequestToDelete(requestId);
      setDeleteDialogOpen(true);
    } else if (action === "Reply" || action === "View") {
      // Find the request and open details modal
      const request = maintenanceRequests.find((r) => r.id === requestId);
      if (request) {
        setSelectedRequest(request);
      }
    }
  }, [handleStatusUpdate, maintenanceRequests]);

  const handleOpenModal = useCallback(() => {
    if (user.role === "TENANT" && properties.length > 0) {
      setFormData((prev) => ({
        ...prev,
        listingId: properties[0].id,
      }));
    }
    setShowModal(true);
  }, [user.role, properties]);

  const handleSearchFilter = useCallback((payload) => {
    if (!payload) return;
    if (Object.prototype.hasOwnProperty.call(payload, "priority") || Object.prototype.hasOwnProperty.call(payload, "category")) {
      setFilters((prev) => ({
        ...prev,
        ...(payload.priority !== undefined ? { priority: payload.priority } : {}),
        ...(payload.category !== undefined ? { category: payload.category } : {}),
      }));
    }
    if (payload.chip) {
      if (payload.chip === "Urgent") {
        setFilters((prev) => ({ ...prev, priority: payload.active ? "URGENT" : "" }));
      }
      if (payload.chip === "Requests in 7 days") {
        setWithin7Days(!!payload.active);
      }
      if (payload.chip === "Requests in 30 days") {
        setWithin30Days(!!payload.active);
      }
      if (payload.chip === "Today") {
        setWithinToday(!!payload.active);
      }
    }
  }, []);

  const handleOpenDetails = useCallback((request) => {
    setSelectedRequest(request);
  }, []);
  const handleCloseDetails = useCallback(() => setSelectedRequest(null), []);


  return (
    <div className="px-4 md:px-8 py-4">
      <div className="hidden md:block">
        <PageHeader
          title="Maintenance"
          subtitle="Track and manage all property maintenance tasks"
        />
      </div>

      <MaintenanceSearchBar
        search={search}
        setSearch={setSearch}
        onFilter={handleSearchFilter}
        onNewRequest={handleOpenModal}
        chips={chips}
        removeChip={(label) => setChips((prev) => prev.filter((c) => c !== label))}
        currentFilters={filters}
        showCreateButton={user?.role === "TENANT" 
          ? (!checkingLeaseStatus && !hasTerminatedLease)
          : true}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((col) => {
          const requests = getFilteredRequests(getRequestsByStatus(col.status));
          return (
            <MaintenanceColumn
              key={col.title}
              title={col.title}
              requests={requests}
              loading={loading}
              actions={col.actions}
              onActionClick={handleActionClick}
              updatingActions={updatingActions} 
              user={user}
              onCardClick={handleOpenDetails}
            />
          );
        })}
      </div>

      {showModal && (
        <MaintenanceForm
          formData={formData}
          properties={properties}
          onChange={handleChange}
          onSubmit={handleSubmit}
          open={showModal}
          setOpen={setShowModal}
          saving={saving}
          userRole={user.role}
        />
      )}

      {selectedRequest && (
        <MaintenanceDetailsModal
          request={selectedRequest}
          open={!!selectedRequest}
          onClose={handleCloseDetails}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Maintenance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl" onClick={() => {
              setDeleteDialogOpen(false);
              setRequestToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="rounded-2xl bg-red-600 hover:bg-red-700" 
              onClick={handleDeleteRequest}
              disabled={updatingActions[requestToDelete] === "Trash"}
            >
              {updatingActions[requestToDelete] === "Trash" ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating New Request button for mobile */}
      {(user?.role === "TENANT" 
        ? (!checkingLeaseStatus && !hasTerminatedLease)
        : true) && (
        <button
          onClick={handleOpenModal}
          disabled={user?.role === "TENANT" && hasTerminatedLease}
          className="md:hidden fixed bottom-20 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer w-14 h-14 flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={user?.role === "TENANT" && hasTerminatedLease ? "Your lease has been terminated. Maintenance requests are no longer available." : "New Request"}
        >
          <Plus size={24} />
        </button>
      )}
    </div>
  );
}

export default Maintenance;
