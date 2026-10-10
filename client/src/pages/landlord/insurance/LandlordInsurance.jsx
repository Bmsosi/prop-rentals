import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Search, FileText, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/shared/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { getAllInsurances } from "@/services/insuranceService";
import { format } from "date-fns";
import InsuranceDetailsModal from "./InsuranceDetailsModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import Pagination from "@/components/shared/Pagination";
import { useQuery } from "@tanstack/react-query";

const LandlordInsurance = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Reset page when search or status filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  // Fetch insurances with pagination
  const { data: insuranceData, isLoading: loading, error } = useQuery({
    queryKey: ["insurances", page, limit, statusFilter],
    queryFn: async () => {
      const filters = {
        page,
        limit,
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      };
      const data = await getAllInsurances(filters);
      return data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  const insurances = insuranceData?.insurances || [];
  const pagination = insuranceData || { page: 1, limit: 10, total: 0, totalPages: 1 };

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
    return "N/A";
  };

  // Client-side filtering for search (since search is not in backend yet)
  const filteredInsurances = useMemo(() => {
    if (!searchQuery) return insurances;
    
    const query = searchQuery.toLowerCase();
    return insurances.filter(
      (ins) =>
        ins.tenant?.firstName?.toLowerCase().includes(query) ||
        ins.tenant?.lastName?.toLowerCase().includes(query) ||
        ins.policyNumber?.toLowerCase().includes(query) ||
        ins.providerName?.toLowerCase().includes(query) ||
        getPropertyName(ins).toLowerCase().includes(query)
    );
  }, [insurances, searchQuery]);

  const getTenantName = (insurance) => {
    if (insurance.tenant?.firstName && insurance.tenant?.lastName) {
      return `${insurance.tenant.firstName} ${insurance.tenant.lastName}`;
    }
    return insurance.tenant?.email || "Unknown Tenant";
  };

  const handleViewDetails = (insurance) => {
    setSelectedInsurance(insurance);
    setShowDetailsModal(true);
  };

  const handleModalClose = () => {
    setShowDetailsModal(false);
    setSelectedInsurance(null);
  };

  const getStatusCount = (status) => {
    // Use total from pagination for ALL, otherwise would need separate query
    if (status === "ALL") return pagination.total || 0;
    // For other statuses, we'd need to fetch separately or use client-side count
    // For now, return 0 as we don't have per-status totals
    return 0;
  };

  // Truncate text for mobile
  const truncateText = (text, maxLength = 35) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Get status text color and label
  const getStatusTextColor = (status) => {
    const statusColors = {
      PENDING: "text-yellow-600",
      VERIFIED: "text-green-600",
      REJECTED: "text-red-600",
      EXPIRING_SOON: "text-orange-600",
      EXPIRED: "text-gray-600",
    };
    return statusColors[status] || "text-gray-600";
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      PENDING: "Pending",
      VERIFIED: "Active",
      REJECTED: "Rejected",
      EXPIRING_SOON: "Expiring Soon",
      EXPIRED: "Expired",
    };
    return statusLabels[status] || status;
  };

  // Insurance Row Component
  const InsuranceRow = ({ insurance }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const tenantName = getTenantName(insurance);
    const propertyName = getPropertyName(insurance);

    const handleDropdownClick = (e) => {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
    };

    return (
      <Card 
        className="border border-gray-300 hover:shadow-md cursor-default transition-shadow mb-1 p-0 md:p-3"
      >
        {/* Mobile: Collapsed Row View */}
        <div className="md:hidden">
          <div className="flex items-center p-3 gap-3">
            {/* Title and Description (stacked) */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h3 
                  className="font-semibold text-sm" 
                  title={tenantName}
                >
                  {truncateText(tenantName)}
                </h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-mono text-gray-900">
                    {insurance.policyNumber || "N/A"}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p 
                  className="text-xs text-gray-600 truncate"
                  title={propertyName}
                >
                  {truncateText(propertyName)}
                </p>
                <span className={`text-xs flex-shrink-0 font-medium ${getStatusTextColor(insurance.status)}`}>
                  {getStatusLabel(insurance.status)}
                </span>
              </div>
            </div>

            {/* Dropdown Icon */}
            <button
              onClick={handleDropdownClick}
              className="flex-shrink-0 p-1 self-center flex items-center justify-center"
              aria-label="Toggle details"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="px-4 pb-4 border-gray-200 border-t space-y-4 pt-4">
              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left Column: Tenant Info */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Tenant</p>
                    <p className="text-xs text-gray-900 font-medium">{tenantName}</p>
                    {insurance.providerName && (
                      <p className="text-xs text-gray-500 mt-1">{insurance.providerName}</p>
                    )}
                    <div className="mt-1.5">
                      <StatusBadge status={insurance.status} className="text-[10px] px-2 py-0.5" />
                    </div>
                  </div>
                </div>

                {/* Right Column: Property */}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Property</p>
                    <p className="text-xs text-gray-900 font-medium">{propertyName}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Submitted</p>
                    <p className="text-xs text-gray-900">{format(new Date(insurance.createdAt), "MMM d, yyyy")}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails(insurance);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Eye className="w-3 h-3 mr-1" /> View Details
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop: Full View */}
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_120px] gap-4 items-center">
          {/* Tenant */}
          <div className="text-[16px] text-gray-700 truncate">
            <div className="font-semibold text-gray-900">{tenantName}</div>
            <div className="text-sm font-normal text-gray-600 text-wrap">
              {insurance.providerName || "N/A"}
            </div>
          </div>

          {/* Property */}
          <div className="text-[16px] font-semibold text-gray-900 truncate border-l border-gray-300 pl-4">
            <div className="truncate">{propertyName}</div>
          </div>

          {/* Policy ID */}
          <div className="text-[16px] font-mono text-gray-900 truncate border-l border-gray-300 pl-4">
            {insurance.policyNumber || "N/A"}
          </div>

          {/* Status */}
          <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
            <StatusBadge status={insurance.status} />
          </div>

          {/* Submitted */}
          <div className="text-[16px] text-gray-900 border-l border-gray-300 pl-4">
            {format(new Date(insurance.createdAt), "MMM d, yyyy")}
          </div>

          {/* Actions */}
          <div className="flex justify-end border-l border-gray-300 pl-4">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails(insurance);
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground rounded-xl"
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Skeleton Component
  const InsuranceTableSkeleton = () => (
    <div className="space-y-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={`insurance-skeleton-${index}`}
          className="border border-gray-200 rounded-2xl p-0 bg-card overflow-hidden"
        >
          {/* Mobile: Collapsed Row View */}
          <div className="md:hidden">
            <div className="flex items-center p-3 gap-3">
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-full rounded-full" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
              </div>
              <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
            </div>
          </div>
          {/* Desktop: Full View */}
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_120px] gap-4 p-3 items-center">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40 rounded-lg" />
              <Skeleton className="h-3 w-28 rounded-md" />
            </div>
            <div className="border-l border-gray-100 pl-4">
              <Skeleton className="h-4 w-32 rounded-lg" />
            </div>
            <div className="border-l border-gray-100 pl-4">
              <Skeleton className="h-4 w-28 rounded-lg" />
            </div>
            <div className="border-l border-gray-100 pl-4 flex items-center gap-2">
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="border-l border-gray-100 pl-4">
              <Skeleton className="h-4 w-24 rounded-lg" />
            </div>
            <div className="border-l border-gray-100 pl-4 flex justify-end gap-2">
              <Skeleton className="h-9 w-24 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 md:px-8 py-4">
        <div className="hidden md:block">
          <PageHeader
            title="Renter's Insurance"
            subtitle="Manage and track your tenants' insurance status"
            total={searchQuery ? filteredInsurances.length : (pagination.total || 0)}
          />
        </div>

      <div className="pb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative md:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by tenant name, policy number, property..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-primary-foreground border-gray-300 text-xs md:text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 bg-primary-foreground border-gray-300">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                All ({getStatusCount("ALL")})
              </SelectItem>
              <SelectItem value="PENDING">
                Pending ({getStatusCount("PENDING")})
              </SelectItem>
              <SelectItem value="VERIFIED">
                Active ({getStatusCount("VERIFIED")})
              </SelectItem>
              <SelectItem value="EXPIRING_SOON">
                Expiring Soon ({getStatusCount("EXPIRING_SOON")})
              </SelectItem>
              <SelectItem value="EXPIRED">
                Expired ({getStatusCount("EXPIRED")})
              </SelectItem>
              <SelectItem value="REJECTED">
                Rejected ({getStatusCount("REJECTED")})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Table Header - Desktop */}
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_120px] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4 flex-shrink-0">
          <div>Tenant</div>
          <div className="border-l border-primary-foreground/20 pl-4">Property</div>
          <div className="border-l border-primary-foreground/20 pl-4">Policy ID</div>
          <div className="border-l border-primary-foreground/20 pl-4">Status</div>
          <div className="border-l border-primary-foreground/20 pl-4">Submitted</div>
          <div className="border-l border-primary-foreground/20 pl-4">Actions</div>
        </div>

        {/* Table Header - Mobile */}
        <div className="md:hidden grid grid-cols-[1fr_auto] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4 flex-shrink-0">
          <div>Tenant</div>
          <div className="text-right pr-2">Policy ID</div>
        </div>

        {/* Table Body */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <InsuranceTableSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">Failed to load insurance records</p>
            </div>
          ) : filteredInsurances.length === 0 ? (
            <div className="bg-card rounded-2xl border border-gray-300 p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-primary mb-2">
                No Insurance Records Found
              </h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== "ALL"
                  ? "Try adjusting your search or filters"
                  : "No tenants have submitted insurance yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredInsurances.map((insurance) => (
                <InsuranceRow key={insurance.id} insurance={insurance} />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!loading && !error && (searchQuery ? filteredInsurances.length > 0 : pagination.total > 0) && (
          <div className="flex-shrink-0 mt-4">
            <Pagination
              page={pagination.page}
              totalPages={searchQuery ? 1 : (pagination.totalPages || 1)}
              totalItems={searchQuery ? filteredInsurances.length : pagination.total}
              onPageChange={(newPage) => {
                if (!searchQuery) {
                  setPage(newPage);
                }
                // When search is applied, pagination is disabled since we're filtering current page's data
              }}
            />
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedInsurance && (
        <InsuranceDetailsModal
          insurance={selectedInsurance}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default LandlordInsurance;

