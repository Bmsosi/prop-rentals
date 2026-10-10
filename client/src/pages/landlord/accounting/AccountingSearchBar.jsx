import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AccountingSearchBar = ({
  searchQuery,
  setSearchQuery,
  onFilter,
  filters,
  tenants,
  properties = [],
  onClearFilter,
}) => {
  // Get filter display values
  const getStatusLabel = (status) => {
    if (status === 'ALL') return null;
    return status.charAt(0) + status.slice(1).toLowerCase();
  };

  const getTypeLabel = (type) => {
    if (type === 'ALL') return null;
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  const getTenantName = (tenantId) => {
    if (tenantId === 'ALL') return null;
    const tenant = tenants.find(t => t.id === tenantId);
    return tenant ? `${tenant.firstName} ${tenant.lastName}` : null;
  };

  const getPropertyName = (listingId) => {
    if (listingId === 'ALL') return null;
    const property = properties.find(p => p.id === listingId);
    return property ? property.title : null;
  };

  const statusLabel = getStatusLabel(filters.status);
  const typeLabel = getTypeLabel(filters.type);
  const tenantName = getTenantName(filters.tenantId);
  const propertyName = getPropertyName(filters.listingId);

  const hasActiveFilters = statusLabel || typeLabel || tenantName || propertyName;

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search + Filter Icon */}
      <div className="flex gap-3 items-center flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search.."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-primary-foreground border-gray-300 text-xs md:text-sm"
          />
        </div>

        {/* Filter Icon */}
        <Button
          variant="outline"
          size="icon"
          className="border-gray-200 bg-primary-foreground"
          onClick={onFilter}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </Button>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex gap-2 items-center flex-wrap">
            {statusLabel && (
              <Badge className="bg-gray-900 text-white px-3 py-1 flex items-center gap-2">
                Status: {statusLabel}
                <button
                  onClick={() => onClearFilter('status')}
                  className="hover:bg-gray-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {typeLabel && (
              <Badge className="bg-gray-900 text-white px-3 py-1 flex items-center gap-2">
                Type: {typeLabel}
                <button
                  onClick={() => onClearFilter('type')}
                  className="hover:bg-gray-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {tenantName && (
              <Badge className="bg-gray-900 text-white px-3 py-1 flex items-center gap-2">
                Tenant: {tenantName}
                <button
                  onClick={() => onClearFilter('tenantId')}
                  className="hover:bg-gray-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {propertyName && (
              <Badge className="bg-gray-900 text-white px-3 py-1 flex items-center gap-2">
                Property: {propertyName}
                <button
                  onClick={() => onClearFilter('listingId')}
                  className="hover:bg-gray-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingSearchBar;

