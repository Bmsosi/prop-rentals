import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Plus, FileText, Calendar, DollarSign, Building, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { getAllInsurances } from "@/services/insuranceService";
import { format, isPast } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import UploadInsurance from "./UploadInsurance";
import { Skeleton } from "@/components/ui/skeleton";
import PolicyDocumentViewer from "@/pages/landlord/insurance/components/PolicyDocumentViewer";

const TenantInsurance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [showUpload, setShowUpload] = useState(false);
  const [viewingInsurance, setViewingInsurance] = useState(null);
  const prevLocationRef = useRef(location.pathname);

  // Fetch tenant's active leases
  const { data: allLeases = [] } = useQuery({
    queryKey: ['tenant-all-leases'],
    queryFn: async () => {
      // Fetch standard leases
      const standardResponse = await api.get(API_ENDPOINTS.TENANT_LEASES.BASE);
      const standardData = standardResponse.data;
      const standardLeases = Array.isArray(standardData) ? standardData : 
                            standardData.data || standardData.leases || [];
      
      // Fetch custom leases
      const customResponse = await api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
      const customData = customResponse.data;
      const customLeases = Array.isArray(customData) ? customData :
                          customData.data || customData.leases || [];
      
      // Filter custom leases for tenant
      const tenantCustomLeases = customLeases.filter(lease => 
        lease.tenantId === user?.id
      );
      
      // Combine and add type identifier
      return [
        ...standardLeases.map(l => ({ ...l, leaseType: 'STANDARD' })),
        ...tenantCustomLeases.map(l => ({ ...l, leaseType: 'CUSTOM' })),
      ];
    },
    enabled: !!user,
  });

  // Fetch tenant insurance data using React Query
  const { data: insuranceData, isLoading: loading, refetch: refetchInsurances } = useQuery({
    queryKey: ['tenant-insurances', user?.id],
    queryFn: async () => {
      const data = await getAllInsurances();
      return data.insurances || [];
    },
    enabled: !!user,
  });

  const insurances = insuranceData || [];

  // Find current active lease
  const activeLeases = allLeases.filter(lease => {
    const isActive = lease.leaseStatus === 'ACTIVE';
    const hasValidEndDate = !lease.endDate || !isPast(new Date(lease.endDate));
    return isActive && hasValidEndDate;
  });

  const draftLeases = allLeases.filter(lease => lease.leaseStatus === 'DRAFT');
  
  // Prioritize ACTIVE lease, fallback to most recent DRAFT
  const currentLease = activeLeases.length > 0 
    ? activeLeases[0] 
    : (draftLeases.length > 0 ? draftLeases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null);

  // Extract leaseId and customLeaseId
  const leaseId = currentLease?.leaseType === 'STANDARD' ? currentLease?.id : null;
  const customLeaseId = currentLease?.leaseType === 'CUSTOM' ? currentLease?.id : null;

  useEffect(() => {
    // Reset showUpload when component mounts (e.g., navigating to insurance page)
    setShowUpload(false);
  }, []);

  // Reset showUpload when location changes to insurance page
  useEffect(() => {
    if (location.pathname === "/tenant/insurance" && prevLocationRef.current !== location.pathname) {
      setShowUpload(false);
    }
    prevLocationRef.current = location.pathname;
  }, [location.pathname]);

  // Reset showUpload when location state changes (handles menu clicks on same route)
  useEffect(() => {
    if (location.pathname === "/tenant/insurance" && location.state?.timestamp) {
      setShowUpload(false);
    }
  }, [location.state]);

  const getPropertyName = (insurance) => {
    if (insurance.lease?.listing?.streetAddress) {
      return insurance.lease.listing.streetAddress;
    }
    if (insurance.lease?.propertyAddress) {
      return insurance.lease.propertyAddress;
    }
    if (insurance.customLease?.leaseName) {
      return insurance.customLease.leaseName;
    }
    return "Property";
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (showUpload) {
    return (
      <div className="h-full overflow-auto">
        <UploadInsurance
          onSuccess={() => {
            setShowUpload(false);
            refetchInsurances();
          }}
          onCancel={() => {
            setShowUpload(false);
          }}
          leaseId={leaseId}
          customLeaseId={customLeaseId}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 md:px-8 py-4">
      <div className="hidden md:block mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[32px] sm:text-3xl md:text-4xl font-extrabold text-primary mb-1">
            Renter's Insurance <span className="text-gray-600 font-semibold text-[28px]">({insurances.length})</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage and track your renter's insurance policies
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)} className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" />
          Upload Insurance
        </Button>
      </div>
      
      {/* Floating Upload Insurance Button - Mobile Only */}
      <button
        onClick={() => setShowUpload(true)}
        className="md:hidden fixed bottom-20 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer w-14 h-14 flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Plus size={24} />
      </button>
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="space-y-1">
            {[...Array(4)].map((_, idx) => (
              <div
                key={`tenant-insurance-skeleton-${idx}`}
                className="bg-card rounded-2xl border border-gray-200 p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48 rounded-lg" />
                    <Skeleton className="h-4 w-32 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((col) => (
                    <div key={col} className="space-y-2">
                      <Skeleton className="h-3 w-24 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-3 w-full rounded" />
              </div>
            ))}
          </div>
        ) : insurances.length === 0 ? (
          <div className="bg-card rounded-2xl border border-gray-200 p-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Insurance Records
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your renter's insurance certificate to get started
            </p>
            <Button onClick={() => setShowUpload(true)} className="rounded-2xl">
              <Plus className="mr-2 h-4 w-4" />
              Upload Insurance
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {insurances.map((insurance) => {
              const daysUntilExpiry = getDaysUntilExpiry(insurance.expiryDate);
              const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              const isExpired = daysUntilExpiry < 0;

              return (
                <div
                  key={insurance.id}
                  className="bg-card rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate max-w-[200px] md:max-w-none">
                          {insurance.providerName}
                        </h3>
                        <StatusBadge status={insurance.status} />
                      </div>
                      <p className="text-sm text-gray-600">
                        Policy #{insurance.policyNumber}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Property</p>
                        <p className="text-sm font-medium text-gray-900">
                          {getPropertyName(insurance)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Expiration Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(insurance.expiryDate), "MMM dd, yyyy")}
                        </p>
                        {isExpiringSoon && (
                          <p className="text-xs text-orange-600 mt-1">
                            Expires in {daysUntilExpiry} days
                          </p>
                        )}
                        {isExpired && (
                          <p className="text-xs text-red-600 mt-1">
                            Expired {Math.abs(daysUntilExpiry)} days ago
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Coverage Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {insurance.coverageType}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(insurance.coverageAmount || insurance.documentKey) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        {insurance.coverageAmount && (
                          <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Coverage Amount:{" "}
                              <span className="font-medium text-gray-900">
                                ${insurance.coverageAmount.toLocaleString()}
                              </span>
                            </span>
                            {insurance.monthlyCost && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">
                                  Monthly Cost:{" "}
                                  <span className="font-medium text-gray-900">
                                    ${insurance.monthlyCost}
                                  </span>
                                </span>
                              </>
                            )}
                          </div>
                        )}
                        {insurance.documentKey && (
                          <Button
                            variant="outline"
                            onClick={() => setViewingInsurance(insurance)}
                            size="sm"
                            className="rounded-2xl"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Doc
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {insurance.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700">
                        {insurance.rejectionReason}
                      </p>
                    </div>
                  )}

                  {insurance.status === "VERIFIED" && insurance.verifiedAt && (
                    <div className="mt-4 text-xs text-gray-500">
                      Verified on {format(new Date(insurance.verifiedAt), "MMM dd, yyyy")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Viewer Modal */}
      {viewingInsurance && (
        <PolicyDocumentViewer
          documentKey={viewingInsurance.documentKey}
          documentUrl={viewingInsurance.documentUrl}
          onClose={() => setViewingInsurance(null)}
        />
      )}
    </div>
  );
};

export default TenantInsurance;

