import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import api from "@/lib/axios";
import StandardLeaseCard from "./StandardLeaseCard";
import { Skeleton } from "@/components/ui/skeleton";
import StandardLeaseSearchBar from "./StandardLeaseSearchBar";
import FilterStandardLeaseDialog from "./FilterStandardLeaseDialog";
import Pagination from "@/components/shared/Pagination";
import BulkDeleteActionBar from "@/components/shared/BulkDeleteActionBar";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
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
import CreateLeaseModal from "./lease-modal/CreateLeaseModal";

const StandardLeases = ({ onTotalChange }) => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ status: "", startDate: "", endDate: "" });
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedLease, setSelectedLease] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    const queryClient = useQueryClient();

    // Fetch standard leases
    const { data: standardLeases = [], isLoading, refetch } = useQuery({
        queryKey: ["leases"],
        queryFn: async () => {
            const res = await api.get(API_ENDPOINTS.LEASES.BASE);
            const data = res.data;
            const leases = Array.isArray(data) ? data : data.data || [];
            
            // Sort by status priority (DRAFT > ACTIVE > TERMINATED/EXPIRED), then by date
            const statusPriority = {
                'DRAFT': 1,      // Highest priority - needs action
                'ACTIVE': 2,     // Second priority - currently running
                'TERMINATED': 3, // Lower priority - ended
                'EXPIRED': 4,    // Lowest priority - expired
            };
            
            return leases.sort((a, b) => {
                // First, sort by status priority
                const priorityDiff = (statusPriority[a.leaseStatus] || 99) - (statusPriority[b.leaseStatus] || 99);
                if (priorityDiff !== 0) return priorityDiff;
                
                // Within same status, sort by start date (most recent first)
                return new Date(b.startDate) - new Date(a.startDate);
            });
        },
    });

    // Filter standard leases by search and filters (frontend filtering)
    const filteredLeases = standardLeases.filter((lease) => {
        // Search filter
        const tenantName = `${lease.tenant?.firstName || ''} ${lease.tenant?.lastName || ''}`.toLowerCase();
        const landlordName = `${lease.landlord?.firstName || ''} ${lease.landlord?.lastName || ''}`.toLowerCase();
        const matchSearch =
            !searchQuery.trim() ||
            tenantName.includes(searchQuery.toLowerCase()) ||
            landlordName.includes(searchQuery.toLowerCase()) ||
            lease.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.listing?.streetAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.propertyAddress?.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchStatus = !filters.status || lease.leaseStatus === filters.status;

        // Date range filter (based on startDate)
        let matchDateRange = true;
        if (filters.startDate || filters.endDate) {
            const leaseDate = new Date(lease.startDate);
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                matchDateRange = matchDateRange && leaseDate >= startDate;
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                matchDateRange = matchDateRange && leaseDate <= endDate;
            }
        }

        return matchSearch && matchStatus && matchDateRange;
    });

    // Check if user has applied explicit filters (search or filter criteria)
    const hasExplicitFilters = searchQuery.trim() !== "" || 
        filters.status !== "" || 
        filters.startDate !== "" || 
        filters.endDate !== "";

    // Calculate pagination totals
    const filteredTotal = filteredLeases.length;
    const apiTotal = standardLeases.length;

    // For display: use filtered count when filters are active, otherwise use API total
    const displayTotal = hasExplicitFilters ? filteredTotal : apiTotal;
    const displayTotalPages = Math.ceil(displayTotal / limit);
    const displayPage = hasExplicitFilters ? 1 : page;

    // Notify parent of total change
    useEffect(() => {
        if (onTotalChange) {
            onTotalChange(displayTotal);
        }
    }, [displayTotal, onTotalChange]);

    // Paginate filtered leases
    const paginatedLeases = filteredLeases.slice((displayPage - 1) * limit, displayPage * limit);

    // Clear selection and reset page when filters or search change
    useEffect(() => {
        setSelectedItems(new Set());
        setPage(1);
    }, [searchQuery, filters]);
    
    // Clear selection when page changes
    useEffect(() => {
        setSelectedItems(new Set());
    }, [page]);

    // Handle selection
    const handleSelectionChange = (leaseId, checked) => {
        setSelectedItems((prev) => {
            const newSet = new Set(prev);
            if (checked) {
                newSet.add(leaseId);
            } else {
                newSet.delete(leaseId);
            }
            return newSet;
        });
    };

    // Handle select all
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedItems(new Set(paginatedLeases.map((lease) => lease.id)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const allSelected = paginatedLeases.length > 0 && paginatedLeases.every((lease) => selectedItems.has(lease.id));
    const someSelected = paginatedLeases.some((lease) => selectedItems.has(lease.id)) && !allSelected;

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (leaseId) => {
            await api.delete(`${API_ENDPOINTS.LEASES.BASE}/${leaseId}`);
        },
        onSuccess: () => {
            toast.success("Lease deleted successfully");
            queryClient.invalidateQueries(["leases"]);
            setDeleteDialogOpen(false);
            setSelectedLease(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete lease");
        },
    });

    // Bulk delete mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: async (leaseIds) => {
            await api.post(API_ENDPOINTS.LEASES.BULK_DELETE, { ids: leaseIds });
        },
        onSuccess: () => {
            toast.success(`${selectedItems.size} lease(s) deleted successfully`);
            queryClient.invalidateQueries(["leases"]);
            setSelectedItems(new Set());
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete leases");
        },
    });

    // Handlers
    const handleViewDetails = (lease) => {
        navigate(`/landlord/leases/standard/${lease.id}`);
    };

    const handleDelete = (lease) => {
        setSelectedLease(lease);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (selectedLease) {
            deleteMutation.mutate(selectedLease.id);
        }
    };

    const handleBulkDelete = () => {
        bulkDeleteMutation.mutate(Array.from(selectedItems));
    };

    const handleClearSelection = () => {
        setSelectedItems(new Set());
    };

    const handleApplyFilters = (newFilters) => {
        setFilters(newFilters);
        setFilterModalOpen(false);
    };

    const handleResetFilters = () => {
        setFilters({ status: "", startDate: "", endDate: "" });
    };

    return (
        <>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Search Bar */}
                <div className="flex-shrink-0 mb-4">
                    <StandardLeaseSearchBar
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        onFilterClick={() => setFilterModalOpen(true)}
                        onNewLease={() => setShowCreateModal(true)}
                        filters={filters}
                        onResetFilters={handleResetFilters}
                    />
                </div>

                {/* Select All Checkbox */}
                <div className="flex-shrink-0 flex items-center gap-3 mb-2">
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={handleSelectAll}
                        className="!border-black"
                        indeterminate={someSelected || undefined}
                    />
                    <span className="text-sm text-gray-600">
                        {allSelected ? "Deselect all" : "Select all"}
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {isLoading ? (
                        <div className="space-y-1">
                            {[...Array(4)].map((_, idx) => (
                                <div key={`standard-lease-skeleton-${idx}`} className="flex items-center gap-3 mb-1">
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
                                                <div className="flex-1 flex flex-col md:flex-row items-center p-4 gap-6">
                                                    <div className="w-full md:w-64 flex-shrink-0 min-w-0">
                                                        <Skeleton className="h-5 w-3/4 rounded-full mb-2" />
                                                        <Skeleton className="h-3 w-full rounded-full mb-1" />
                                                        <Skeleton className="h-3 w-2/3 rounded-full" />
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full md:w-48 flex-shrink-0">
                                                        <Skeleton className="h-8 w-8 rounded-full" />
                                                        <div className="space-y-1">
                                                            <Skeleton className="h-4 w-24 rounded-full" />
                                                            <Skeleton className="h-4 w-28 rounded-full" />
                                                            <Skeleton className="h-4 w-32 rounded-full" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 w-full md:w-48 flex-shrink-0">
                                                        <Skeleton className="h-8 w-8 rounded-full" />
                                                        <div className="space-y-1">
                                                            <Skeleton className="h-3 w-20 rounded-full" />
                                                            <Skeleton className="h-4 w-28 rounded-full" />
                                                            <Skeleton className="h-4 w-28 rounded-full" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center w-full md:w-44 flex-shrink-0">
                                                        <div className="space-y-1">
                                                            <Skeleton className="h-4 w-24 rounded-full" />
                                                            <Skeleton className="h-3 w-32 rounded-full" />
                                                            <Skeleton className="h-3 w-28 rounded-full" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-center w-full md:w-20 flex-shrink-0">
                                                        <Skeleton className="h-6 w-16 rounded-full" />
                                                    </div>
                                                    <div className="flex gap-1.5 w-full md:w-auto flex-shrink-0 items-center justify-center">
                                                        <Skeleton className="h-9 w-9 rounded-xl" />
                                                        <Skeleton className="h-9 w-9 rounded-xl" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : paginatedLeases.length > 0 ? (
                        paginatedLeases.map((lease) => (
                            <StandardLeaseCard
                                key={lease.id}
                                lease={lease}
                                onViewDetails={handleViewDetails}
                                onDelete={handleDelete}
                                isSelected={selectedItems.has(lease.id)}
                                onSelectionChange={handleSelectionChange}
                                onRefresh={refetch}
                            />
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500">No standard leases found.</div>
                    )}
                </div>

                {/* Pagination - Inside table container */}
                <div className="flex-shrink-0 mt-4">
                    <Pagination
                        page={displayPage}
                        totalPages={displayTotalPages}
                        totalItems={displayTotal}
                        onPageChange={(newPage) => {
                            if (!hasExplicitFilters) {
                                setPage(newPage);
                            }
                        }}
                    />
                </div>
            </div>

            {/* Bulk Delete Action Bar */}
            {selectedItems.size > 0 && (
                <BulkDeleteActionBar
                    selectedItems={Array.from(selectedItems)}
                    onDelete={handleBulkDelete}
                    onClearSelection={handleClearSelection}
                    resourceName="leases"
                    isDeleting={bulkDeleteMutation.isPending}
                />
            )}

            {/* Filter Dialog */}
            <FilterStandardLeaseDialog
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                filters={filters}
                onApply={handleApplyFilters}
            />

            {/* Create Lease Modal */}
            <CreateLeaseModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={() => {
                    refetch();
                    setShowCreateModal(false);
                }}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary">Delete Lease</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this lease? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-red-600 hover:bg-red-700 rounded-2xl"
                        >
                            {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Floating Create Lease button for mobile */}
            <button
                onClick={() => setShowCreateModal(true)}
                className="md:hidden fixed bottom-20 right-4 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer w-14 h-14 flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
                <Plus size={24} />
            </button>
        </>
    );
};

export default StandardLeases;

