import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  maintenanceApi,
  MAINTENANCE_STATUS,
  MAINTENANCE_PRIORITY,
  getStatusDisplayName,
} from "@/lib/maintenanceApi";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MaintenanceSearchBar from "@/pages/landlord/maintenance/MaintanenceSearchBar";
import PageHeader from "@/components/shared/PageHeader";
import { toast } from "sonner";
import TenantMaintenanceForm from "./TenantMaintenanceForm";
import { MaintenanceColumn } from "@/pages/landlord/maintenance";
import { isPast } from "date-fns";

function Maintenance() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [properties, setProperties] = useState([]);
  const [saving, setSaving] = useState(false);
  const [chips, setChips] = useState(["Urgent", "Request in 30 days"]);
  const [filters] = useState({
    status: "",
    priority: "",
    category: "",
    listingId: "",
  });
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    listingId: "",
    category: "",
    priority: MAINTENANCE_PRIORITY.MEDIUM,
    description: "",
    image: null,
  });

  const [updatingActions, setUpdatingActions] = useState({}); // { [requestId]: action }
  const [hasActiveRental, setHasActiveRental] = useState(false);

  const token = useAuthStore((state) => state.token);
  const { user } = useAuthStore();

  // Fetch properties and check for active rental (same logic as RentalInfo page)
  useEffect(() => {
    console.log('🔍 TENANT MAINTENANCE useEffect - START');
    console.log('Token:', !!token, 'User ID:', user?.id, 'Role:', user?.role);
    
    if (!token || !user?.id || user?.role !== 'TENANT') {
      console.log('⚠️ Not a tenant or missing data - hiding button');
      setHasActiveRental(false);
      return;
    }

    const fetchListings = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.LISTINGS.GET_ALL);
        const data = response.data;
        const listings = Array.isArray(data) ? data : data.listing || [];
        setProperties(listings);
      } catch (err) {
        console.error("Error fetching listings:", err);
        setProperties([]);
      }
    };

    const checkActiveRental = async () => {
      console.log('🔍 Checking active rental for tenant:', user.id);
      setHasActiveRental(false); // Start with hidden
      
      try {
        // Fetch standard leases
        const standardResponse = await api.get(API_ENDPOINTS.TENANT_LEASES.BASE);
        const standardData = standardResponse.data;
        const standardLeases = Array.isArray(standardData) 
          ? standardData 
          : (standardData?.data || standardData?.leases || []);
        
        // Fetch custom leases
        const customResponse = await api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
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
        
        console.log('📋 Total leases found:', allLeases.length);
        console.log('📋 Lease statuses:', allLeases.map(l => ({ id: l.id?.substring(0, 8), status: l.leaseStatus, endDate: l.endDate })));
        
        // Check for ACTIVE leases with valid end date (same logic as RentalInfo page)
        const activeLeases = allLeases.filter(lease => {
          const isActive = lease.leaseStatus === 'ACTIVE';
          const hasValidEndDate = !lease.endDate || !isPast(new Date(lease.endDate));
          return isActive && hasValidEndDate;
        });
        
        const hasActive = activeLeases.length > 0;
        
        console.log('✅ Active leases found:', activeLeases.length);
        console.log('✅ Has active rental:', hasActive);
        
        setHasActiveRental(hasActive);
      } catch (err) {
        console.error("❌ Error checking active rental:", err);
        setHasActiveRental(false);
      }
    };

    fetchListings();
    checkActiveRental();
  }, [token, user?.id, user?.role]);


  // Fetch maintenance requests using React Query
  const { data: maintenanceData, isLoading: loading, refetch: refetchMaintenance } = useQuery({
    queryKey: ['maintenance-requests', user?.id, filters],
    queryFn: async () => {
      if (!token) return [];
      const data = await maintenanceApi.getAllRequests(filters);
      return data.data || data;
    },
    enabled: !!token && !!user?.id,
  });

  const maintenanceRequests = maintenanceData || [];

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData({
      ...formData,
      [name]: files ? files[0] : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); // start saving

    try {
      const requestData = {
        title: formData.title,
        listingId: formData.listingId,
        priority: formData.priority,
        category: formData.category,
        description: formData.description,
        image:null
      };

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
      });

      const updatedRequests = await maintenanceApi.getAllRequests(filters);
      setMaintenanceRequests(updatedRequests.data || updatedRequests);
    } catch (error) {
      console.error("Error submitting request:", error);
      toast.error("Failed to create request");
    } finally {
      setSaving(false); // stop saving
    }
  };

  const handleStatusUpdate = async (requestId, actionName, newStatus) => {
    try {
      // set updating action for this request
      setUpdatingActions({ ...updatingActions, [requestId]: actionName });

      await maintenanceApi.updateStatus(requestId, newStatus);

      // Invalidate query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });

      toast.success(`Request ${newStatus.replace(/_/g, " ").toLowerCase()} successfully!`);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(`Error updating request: ${error.message}`);
    } finally {
      // clear updating action
      const updated = { ...updatingActions };
      delete updated[requestId];
      setUpdatingActions(updated);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm("Are you sure you want to delete this maintenance request?")) return;

    try {
      // set updating action for delete
      setUpdatingActions({ ...updatingActions, [requestId]: "Trash" });

      await maintenanceApi.deleteRequest(requestId);

      // Invalidate query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });

      toast.success("Request deleted successfully!");
    } catch (error) {
      console.error("Error deleting request:", error);
      toast.error(`Error deleting request: ${error.message}`);
    } finally {
      const updated = { ...updatingActions };
      delete updated[requestId];
      setUpdatingActions(updated);
    }
  };

  const getRequestsByStatus = (status) =>
    maintenanceRequests.filter((request) => request.status === status);

  const getFilteredRequests = (requests) => {
    if (!search) return requests;
    return requests.filter(
      (request) =>
        request.title.toLowerCase().includes(search.toLowerCase()) ||
        request.description.toLowerCase().includes(search.toLowerCase()) ||
        request.listing?.title?.toLowerCase().includes(search.toLowerCase()) ||
        request.user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        request.user?.lastName?.toLowerCase().includes(search.toLowerCase())
    );
  };

  const columns = [
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
  ];

  const handleActionClick = (action, requestId) => {
    if (action === "Accept") {
      handleStatusUpdate(requestId, action, MAINTENANCE_STATUS.IN_PROGRESS);
    } else if (action === "Cancel") {
      handleStatusUpdate(requestId, action, MAINTENANCE_STATUS.CANCELLED);
    } else if (action === "Finish") {
      handleStatusUpdate(requestId, action, MAINTENANCE_STATUS.COMPLETED);
    } else if (action === "Trash") {
      handleDeleteRequest(requestId);
    } else if (action === "Reply") {
      toast("Reply functionality coming soon!");
    } else if (action === "View") {
      toast("View details functionality coming soon!");
    }
  };

  return (
    <div className="px-4 md:px-8 py-4">
      <PageHeader
        title="Maintenance"
        subtitle="Track and manage all property maintenance tasks"
      />

      <MaintenanceSearchBar
        search={search}
        setSearch={setSearch}
        onFilter={() => console.log("Filter clicked")}
        onNewRequest={() => setShowModal(true)}
        chips={chips}
        removeChip={(label) => setChips((prev) => prev.filter((c) => c !== label))}
        showCreateButton={hasActiveRental}
      />
      
      {/* Debug logging */}
      {(() => {
        console.log('🎨 RENDER - hasActiveRental:', hasActiveRental, 'showCreateButton:', hasActiveRental);
        return null;
      })()}

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
              updatingActions={updatingActions} // pass down updatingActions
            />
          );
        })}
      </div>

      {showModal && (
        <TenantMaintenanceForm
          formData={formData}
          properties={properties}
          onChange={handleChange}
          onSubmit={handleSubmit}
          open={showModal}
          setOpen={setShowModal}
          saving={saving}
        />
      )}
    </div>
  );
}

export default Maintenance;
