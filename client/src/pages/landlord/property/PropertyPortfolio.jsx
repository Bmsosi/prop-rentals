import React, { useMemo, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../store/authStore';
import { useLocation } from 'react-router-dom';
import PropertyTabs from './PropertyTabs';
import PropertySearchBar from './PropertySearchBar';
import PropertyList from './PropertyList';
import ErrorState from '../../../components/shared/ErrorState';
import EmptyState from '../../../components/shared/EmptyState';
import NewListingModal from './NewListingModal';
import api from '../../../lib/axios';
import API_ENDPOINTS from '../../../lib/apiEndpoints';
import PageHeader from '@/components/shared/PageHeader';
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '@/components/shared/Pagination';
import BulkDeleteActionBar from '@/components/shared/BulkDeleteActionBar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

const PropertyPortfolio = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("listings");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuthStore();

  // Check if we should open the modal from navigation state
  useEffect(() => {
    if (location.state?.openListingModal) {
      setIsModalOpen(true);
      // Clear the state to prevent reopening on re-render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const {
    data: properties = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["listings", user?.id],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.LISTINGS.BASE);
      const data = response.data;
      return Array.isArray(data) ? data : data.listing || data.data || [];
    },
  });

  const filteredProperties = properties.filter((prop) => {
    const q = searchQuery.toLowerCase();

    // Filter by search query
    const matchesSearch =
      prop.name?.toLowerCase().includes(q) ||
      prop.title?.toLowerCase().includes(q) ||
      prop.address?.toLowerCase().includes(q) ||
      prop.location?.toLowerCase().includes(q) ||
      prop.propertyName?.toLowerCase().includes(q);

    // Filter by status based on activeTab
    let matchesStatus = true;
    if (activeTab === "listings") {
      matchesStatus = prop.status === "ACTIVE"; // Default listings
    } else if (activeTab === "rentals") {
      matchesStatus = prop.status === "RENTED"; // Rentals tab
    }

    return matchesSearch && matchesStatus;
  });


  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const displayTotal = filteredProperties.length;
  const displayTotalPages = Math.max(1, Math.ceil(displayTotal / limit));
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProperties.slice(start, start + limit);
  }, [filteredProperties, page, limit]);

  // Selection / Bulk delete
  const [selectedItems, setSelectedItems] = useState(new Set());
  const onSelectionChange = (id, checked) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(new Set(paginated.map((p) => p.id)));
    } else {
      setSelectedItems(new Set());
    }
  };
  const allSelected = paginated.length > 0 && paginated.every((p) => selectedItems.has(p.id));
  const someSelected = !allSelected && paginated.some((p) => selectedItems.has(p.id));

  const handleBulkDelete = async (idsParam) => {
    const ids = Array.isArray(idsParam) && idsParam.length > 0 ? idsParam : Array.from(selectedItems);
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        await api.delete(API_ENDPOINTS.LISTINGS.BY_ID(id));
      }
      toast.success('Listings deleted');
      setSelectedItems(new Set());
      // Invalidate queries to refresh the table
      queryClient.invalidateQueries(['listings']);
    } catch (e) {
      toast.error('Failed to delete listings');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 md:px-8 py-4 bg-background">
      <div className="flex-shrink-0">
        <div className="mb-6 hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-primary mb-1">
              Portfolio {displayTotal !== undefined && (
                <span className="text-primary font-semibold text-xl sm:text-2xl md:text-[28px]">({displayTotal})</span>
              )}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-primary">Per Property</p>
          </div>
        </div>

        <PropertyTabs activeTab={activeTab} setActiveTab={setActiveTab} />
        <PropertySearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNewListing={() => setIsModalOpen(true)}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading && (
          <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={`portfolio-skeleton-${idx}`} className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-md" />
                <div className="flex-1">
                  <div className="border border-gray-200 rounded-2xl p-0 bg-card overflow-hidden">
                    {/* Mobile: Collapsed Row View */}
                    <div className="md:hidden">
                      <div className="flex items-center p-3 gap-3">
                        <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <Skeleton className="h-4 w-3/4 rounded-full mb-1" />
                          <Skeleton className="h-3 w-full rounded-full" />
                        </div>
                        <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
                      </div>
                    </div>
                    {/* Desktop: Full View */}
                    <div className="hidden md:flex flex-row">
                      {/* Image placeholder */}
                      <div className="w-48 h-28 bg-gray-200 dark:bg-gray-800 shimmer-container flex-shrink-0">
                        <div className="shimmer-bar" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 flex flex-col md:flex-row items-start md:items-center p-4 gap-4 md:gap-6">
                        <div className="flex-1 min-w-0">
                          <Skeleton className="h-5 w-1/2 rounded-full mb-2" />
                          <Skeleton className="h-3 w-3/4 rounded-full mb-1" />
                          <Skeleton className="h-3 w-1/2 rounded-full" />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:justify-start">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-4 w-28 rounded-full" />
                            <Skeleton className="h-4 w-32 rounded-full" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:justify-start">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-32 rounded-full" />
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-4 w-28 rounded-full" />
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col gap-3 md:gap-2 w-full md:w-auto md:flex-1 md:justify-center">
                          <Skeleton className="h-4 w-16 rounded-full" />
                          <Skeleton className="h-4 w-20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {isError && <ErrorState message={error.message} />}
        {!isLoading && !isError && filteredProperties.length === 0 && (
          <EmptyState message="No properties available" />
        )}
        {!isLoading && !isError && filteredProperties.length > 0 && (
          <>
            {/* Header row for select all */}
            <div className="flex items-center gap-3 mb-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                className="!border-black"
              />
              <span className="text-xs sm:text-sm text-gray-700">Select all</span>
            </div>

            <PropertyList
              properties={paginated}
              selectedItems={selectedItems}
              onSelectionChange={onSelectionChange}
            />
          </>
        )}
      </div>

      <div className="flex-shrink-0 mt-4">
        <Pagination
          page={page}
          totalPages={displayTotalPages}
          totalItems={displayTotal}
          onPageChange={setPage}
        />
      </div>

      <BulkDeleteActionBar
        selectedItems={Array.from(selectedItems)}
        onDelete={handleBulkDelete}
        onClearSelection={() => setSelectedItems(new Set())}
        resourceName="listings"
        isDeleting={false}
        confirmMessage="Delete selected listings? This cannot be undone."
      />

      <NewListingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Floating New Listing button for mobile */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer w-14 h-14 flex items-center justify-center hover:bg-primary/90 transition-colors"
      >
        <Plus size={24} />
      </button>
    </div>
  );
};

export default PropertyPortfolio;
