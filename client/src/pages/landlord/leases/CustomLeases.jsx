import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import api from "@/lib/axios";
import CustomLeaseCard from "./CustomLeaseCard";
import { Skeleton } from "@/components/ui/skeleton";
import CustomLeaseSearchBar from "./CustomLeaseSearchBar";
import FilterCustomLeaseDialog from "./FilterCustomLeaseDialog";
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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateLeaseModal from "./lease-modal/CreateLeaseModal";

const CustomLeases = ({ onTotalChange }) => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({ status: "", startDate: "", endDate: "" });
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedLease, setSelectedLease] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [viewFileOpen, setViewFileOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedItems, setSelectedItems] = useState(new Set());

    const queryClient = useQueryClient();

    // Fetch custom leases
    const { data: customLeases = [], isLoading, refetch } = useQuery({
        queryKey: ["customleases"],
        queryFn: async () => {
            const res = await api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
            const leases = res.data.data || res.data || [];
            
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

    // Filter custom leases by search and filters (frontend filtering)
    const filteredLeases = customLeases.filter((lease) => {
        // Search filter
        const matchSearch =
            !searchQuery.trim() ||
            lease.leaseName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.listing?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.listing?.streetAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.tenant?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lease.tenant?.lastName?.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchStatus = !filters.status || lease.leaseStatus === filters.status;

        // Date range filter (based on createdAt)
        let matchDateRange = true;
        if (filters.startDate || filters.endDate) {
            const leaseDate = new Date(lease.createdAt);
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
    const apiTotal = customLeases.length;

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
        mutationFn: async (id) => {
            const res = await api.delete(API_ENDPOINTS.CUSTOM_LEASES.BY_ID(id));
            return res.data;
        },
        onSuccess: () => {
            toast.success("Custom lease deleted successfully");
            queryClient.invalidateQueries(["customleases"]);
            setDeleteDialogOpen(false);
            setSelectedLease(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete custom lease");
        },
    });

    const handleDelete = (lease) => {
        setSelectedLease(lease);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (selectedLease) {
            deleteMutation.mutate(selectedLease.id);
        }
    };

    const handleViewDetails = (lease) => {
        navigate(`/landlord/leases/custom/${lease.id}`);
    };

    const handleViewFile = (lease) => {
        setSelectedLease(lease);
        setViewFileOpen(true);
    };

    const handleEdit = (lease) => {
        setSelectedLease(lease);
        setEditDialogOpen(true);
    };

    const handleClearSelection = () => {
        setSelectedItems(new Set());
    };

    // Handle bulk delete
    const bulkDeleteMutation = useMutation({
        mutationFn: async (ids) => {
            // Delete multiple custom leases one by one
            const deletePromises = ids.map((id) => api.delete(API_ENDPOINTS.CUSTOM_LEASES.BY_ID(id)));
            await Promise.all(deletePromises);
            return { message: `Successfully deleted ${ids.length} custom lease(s)` };
        },
        onSuccess: (data) => {
            const count = selectedItems.size;
            toast.success(data.message || `Successfully deleted ${count} custom lease(s)`);
            setSelectedItems(new Set());
            queryClient.invalidateQueries(["customleases"]);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to delete custom leases");
        },
    });

    const handleBulkDelete = (ids) => {
        bulkDeleteMutation.mutate(Array.from(ids));
    };

    return (
        <div className="relative flex flex-col h-full">
            <CustomLeaseSearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onCreateNew={() => setShowCreateModal(true)}
                onFilter={() => setFilterModalOpen(true)}
            />

            <div className="rounded overflow-hidden flex-1 flex flex-col min-h-0">
                {/* Table Header - Desktop */}
                <div className={`hidden md:grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4 flex-shrink-0`}>
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            className="data-[state=checked]:bg-white data-[state=checked]:border-white"
                        />
                    </div>
                    <div className="">Lease Name</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Listing Info</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Tenant</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Status</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Actions</div>
                </div>

                {/* Table Header - Mobile: Only Lease Name */}
                <div className={`md:hidden grid grid-cols-[auto_1fr] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4 flex-shrink-0`}>
                    <div className="flex items-center justify-center">
                        <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                            ref={(el) => {
                                if (el) el.indeterminate = someSelected;
                            }}
                            className="data-[state=checked]:bg-white data-[state=checked]:border-white"
                        />
                    </div>
                    <div className="">Lease Name</div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    {isLoading ? (
                        <div className="space-y-1">
                            {[...Array(4)].map((_, idx) => (
                                <div key={`custom-lease-skeleton-${idx}`} className="flex items-center gap-3">
                                    <Skeleton className="h-5 w-5 rounded-md" />
                                    <div className="flex-1">
                                        <div className="border border-gray-200 rounded-2xl p-0 bg-card overflow-hidden">
                                            {/* Mobile: Collapsed Row View */}
                                            <div className="md:hidden">
                                                <div className="flex items-center p-3 gap-3">
                                                    <div className="flex-1 min-w-0 overflow-hidden">
                                                        <Skeleton className="h-4 w-3/4 rounded-full mb-1" />
                                                        <Skeleton className="h-3 w-full rounded-full" />
                                                    </div>
                                                    <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
                                                </div>
                                            </div>
                                            {/* Desktop: Full View */}
                                            <div className="hidden md:block p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <Skeleton className="h-4 w-1/3 rounded-full" />
                                                    <Skeleton className="h-4 w-16 rounded-full" />
                                                </div>
                                                <Skeleton className="h-5 w-1/2 rounded-full mb-3" />
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <Skeleton className="h-3 w-3/4 rounded-full" />
                                                    <Skeleton className="h-3 w-1/2 rounded-full" />
                                                    <Skeleton className="h-3 w-2/3 rounded-full" />
                                                    <Skeleton className="h-3 w-1/3 rounded-full" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : paginatedLeases.length > 0 ? (
                        paginatedLeases.map((lease) => (
                            <CustomLeaseCard
                                key={lease.id}
                                lease={lease}
                                onViewDetails={handleViewDetails}
                                onViewFile={handleViewFile}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isSelected={selectedItems.has(lease.id)}
                                onSelectionChange={handleSelectionChange}
                            />
                        ))
                    ) : (
                        <div className="p-4 text-center text-gray-500">No custom leases found.</div>
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
                            // When explicit filters are applied, pagination is disabled since we only have current page data
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
                    resourceName="custom leases"
                    isDeleting={bulkDeleteMutation.isPending}
                />
            )}

            {/* Filter Dialog */}
            <FilterCustomLeaseDialog
                isOpen={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                onApply={(data) => setFilters(data)}
                initialFilters={filters}
            />

            {/* Create/Edit Modal */}
            <CreateLeaseModal
                open={showCreateModal || editDialogOpen}
                onClose={() => {
                    setShowCreateModal(false);
                    setEditDialogOpen(false);
                    setSelectedLease(null);
                }}
                leaseId={selectedLease?.id}
                isEdit={editDialogOpen}
            />

            {/* View File Dialog */}
            {selectedLease && (
                <Dialog open={viewFileOpen} onOpenChange={setViewFileOpen}>
                    <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle className="text-primary">View Lease Document</DialogTitle>
                            <DialogDescription>
                                {selectedLease.leaseName}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="w-full h-[70vh]">
                            <iframe
                                src={selectedLease.fileUrl}
                                className="w-full h-full border rounded"
                                title="Lease Document"
                            />
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setViewFileOpen(false)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-primary">Delete Custom Lease</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedLease?.leaseName}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-red-500 hover:bg-red-600 rounded-2xl"
                            disabled={deleteMutation.isPending}
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
        </div>
    );
};

export default CustomLeases;

