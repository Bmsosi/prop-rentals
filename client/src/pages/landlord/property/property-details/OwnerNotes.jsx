import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/shared/Pagination';

const OwnerNotes = ({ notes, propertyId, activeCard, onCardChange, showOnlyMaintenance = false }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Fetch maintenance requests for this property
    const { data: maintenanceData, isLoading: loadingMaintenance, refetch } = useQuery({
        queryKey: ['property-maintenance', propertyId],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.MAINTENANCE.BASE, {
                params: { listingId: propertyId }
            });
            return response.data?.data || response.data || [];
        },
        enabled: !!propertyId && (activeCard === 'maintenance' || showOnlyMaintenance),
        staleTime: 0, // Always consider data stale
        cacheTime: 0, // Don't cache the data
        refetchOnMount: true, // Refetch when component mounts
        refetchOnWindowFocus: true, // Refetch when window regains focus
    });

    // Refetch when maintenance card becomes active
    useEffect(() => {
        if ((activeCard === 'maintenance' || showOnlyMaintenance) && refetch) {
            refetch();
        }
    }, [activeCard, showOnlyMaintenance, refetch]);

    const maintenanceRequests = useMemo(() => {
        if (!Array.isArray(maintenanceData)) return [];
        console.log(`📍 Maintenance requests for property ${propertyId}:`, maintenanceData.length, 'records');
        
        // Debug: Check if invoices and totalCost are present
        maintenanceData.forEach((req, idx) => {
            console.log(`  [${idx}] ${req.title}:`, {
                invoices: req.invoices?.length || 0,
                totalCost: req.totalCost,
                calculatedCost: req.invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0
            });
        });
        
        // Sort by creation date (newest first)
        return [...maintenanceData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [maintenanceData, propertyId]);

    // Pagination for maintenance
    const paginatedMaintenance = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return maintenanceRequests.slice(startIndex, startIndex + itemsPerPage);
    }, [maintenanceRequests, currentPage]);

    const totalPages = Math.ceil(maintenanceRequests.length / itemsPerPage);

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'URGENT':
                return 'bg-red-100 text-red-800';
            case 'HIGH':
                return 'bg-orange-100 text-orange-800';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800';
            case 'LOW':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-yellow-100 text-yellow-800'; // OPEN
        }
    };

    const cards = [
        {
            id: 'listing',
            title: 'Listing Details',
            subtitle: 'Per Property',
            description: 'View your listing details from rental info to amenities',
        },
        {
            id: 'maintenance',
            title: 'Maintenance Info',
            subtitle: 'Per Property',
            description: 'View all maintenance requests and history for this property',
        },
        {
            id: 'tenancy',
            title: 'Tenancy Info',
            subtitle: 'Per Property',
            description: 'Monitor occupancy, current tenant info, tenant turnover, and lease duration',
        }
    ];

    const handleCardClick = (cardId) => {
        onCardChange(cardId);
        setCurrentPage(1); // Reset to first page when switching tabs
        
        // Refetch maintenance data when maintenance card is clicked
        if (cardId === 'maintenance' && refetch) {
            refetch();
        }
    };

    // If showOnlyMaintenance is true, only render the maintenance table
    if (showOnlyMaintenance) {
        return (
            <div className="max-h-[500px]">
                <h3 className="text-xl font-semibold mb-4 text-primary">Maintenance History</h3>
                
                {loadingMaintenance ? (
                    <div className="space-y-1">
                        {[...Array(4)].map((_, idx) => (
                            <Card key={`maintenance-skeleton-${idx}`} className="border border-gray-200 p-3">
                                <div className="grid grid-cols-6 gap-4 items-center animate-pulse">
                                    <Skeleton className="h-3 w-24 rounded-lg" />
                                    <Skeleton className="h-3 w-36 rounded-lg" />
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                    <Skeleton className="h-3 w-20 rounded-lg justify-self-end" />
                                    <Skeleton className="h-3 w-24 rounded-lg justify-self-center" />
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : maintenanceRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white border border-gray-300 rounded-lg">
                        <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <p>No maintenance requests for this property</p>
                    </div>
                ) : (
                    <>
                        {/* Table Header */}
                        <div className="grid grid-cols-6 gap-4 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl mb-3">
                            <div>Title</div>
                            <div className="border-l border-primary-foreground/20 pl-4">Description</div>
                            <div className="border-l border-primary-foreground/20 pl-4">Priority</div>
                            <div className="border-l border-primary-foreground/20 pl-4">Status</div>
                            <div className="border-l border-primary-foreground/20 pl-4 text-right">Cost</div>
                            <div className="border-l border-primary-foreground/20 pl-4 text-center">Date</div>
                        </div>

                        {/* Table Rows - Scrollable Container with fixed height */}
                        <div className="space-y-3 h-[350px] overflow-y-auto pr-2 rounded-2xl p-2 bg-card">
                            {paginatedMaintenance.map((request) => (
                                <Card key={request.id} className="bg-card rounded-2xl hover:shadow-md transition-shadow p-3">
                                    <div className="grid grid-cols-6 gap-4 items-center">
                                        {/* Title */}
                                        <div className="font-semibold text-primary truncate" title={request.title}>
                                            {request.title}
                                        </div>

                                        {/* Description */}
                                        <div className="text-sm text-gray-600 truncate" title={request.description}>
                                            {request.description}
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <Badge className={`${getPriorityColor(request.priority)} text-xs px-2 py-1`}>
                                                {request.priority}
                                            </Badge>
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <Badge className={`${getStatusColor(request.status)} text-xs px-2 py-1`}>
                                                {request.status}
                                            </Badge>
                                        </div>

                                        {/* Cost */}
                                        <div className="text-sm font-semibold text-gray-900 text-right">
                                            ${(request.totalCost || request.invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0).toFixed(2)}
                                        </div>

                                        {/* Date */}
                                        <div className="text-sm text-gray-600 text-center">
                                            {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {maintenanceRequests.length > 0 && (
                            <div className="mt-6">
                                <Pagination
                                    page={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                    totalItems={maintenanceRequests.length}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="mt-8 p-6">
            <h2 className="text-[32px] font-bold mb-2">Owner Notes (Private Section)</h2>
            <p className="text-[16px] text-gray-600 mb-6">{ notes }</p>
            <p className="text-[16px] text-gray-700 mb-6">
                Here you can review your property's tenancy history and maintenance history; these details are private and will not be shared with applicants or tenants when the listing is published.
            </p>
            
            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        onClick={() => handleCardClick(card.id)}
                        className={`rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
                            activeCard === card.id
                                ? 'bg-black text-white'
                                : 'bg-white border border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <h3 className="text-[28px] font-bold mb-1">{card.title}</h3>
                        <p className={`text-[16px] mb-3 ${activeCard === card.id ? 'text-gray-300' : 'text-gray-600'}`}>
                            {card.subtitle}
                        </p>
                        <p className={`text-[13px] ${activeCard === card.id ? 'text-gray-300' : 'text-gray-600'}`}>
                            {card.description}
                        </p>
                    </div>
                ))}
            </div>

            {/* Maintenance Table - Only show when maintenance card is active */}
            {activeCard === 'maintenance' && (
                <div className="max-h-[500px]">
                    <h3 className="text-xl font-semibold mb-4">Maintenance History</h3>
                    
                    {loadingMaintenance ? (
                        <div className="space-y-1">
                            {[...Array(4)].map((_, idx) => (
                                <Card key={`maintenance-skeleton-${idx}`} className="border border-gray-200 p-3">
                                    <div className="grid grid-cols-6 gap-4 items-center animate-pulse">
                                        <Skeleton className="h-3 w-24 rounded-lg" />
                                        <Skeleton className="h-3 w-36 rounded-lg" />
                                        <Skeleton className="h-4 w-16 rounded-md" />
                                        <Skeleton className="h-4 w-16 rounded-md" />
                                        <Skeleton className="h-3 w-20 rounded-lg justify-self-end" />
                                        <Skeleton className="h-3 w-24 rounded-lg justify-self-center" />
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : maintenanceRequests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white border border-gray-300 rounded-lg">
                            <Wrench className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p>No maintenance requests for this property</p>
                        </div>
                    ) : (
                    <>
                        {/* Table Header */}
                        <div className="grid grid-cols-6 gap-4 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl mb-3">
                            <div>Title</div>
                            <div className="border-l border-primary-foreground/20 pl-4">Description</div>
                            <div className="border-l border-primary-foreground/20 pl-4">Priority</div>
                            <div className="border-l border-primary-foreground/20 pl-4">Status</div>
                            <div className="border-l border-primary-foreground/20 pl-4 text-right">Cost</div>
                            <div className="border-l border-primary-foreground/20 pl-4 text-center">Date</div>
                        </div>

                        {/* Table Rows - Scrollable Container with fixed height */}
                        <div className="space-y-1 h-[350px] overflow-y-auto pr-2 border border-gray-200 rounded-lg p-2">
                            {paginatedMaintenance.map((request) => (
                                <Card key={request.id} className="border border-gray-300 hover:shadow-md transition-shadow p-3">
                                    <div className="grid grid-cols-6 gap-4 items-center">
                                            {/* Title */}
                                            <div className="font-semibold text-gray-900 truncate" title={request.title}>
                                                {request.title}
                                            </div>

                                            {/* Description */}
                                            <div className="text-sm text-gray-600 truncate" title={request.description}>
                                                {request.description}
                                            </div>

                                            {/* Priority */}
                                            <div>
                                                <Badge className={`${getPriorityColor(request.priority)} text-xs px-2 py-1`}>
                                                    {request.priority}
                                                </Badge>
                                            </div>

                                            {/* Status */}
                                            <div>
                                                <Badge className={`${getStatusColor(request.status)} text-xs px-2 py-1`}>
                                                    {request.status}
                                                </Badge>
                                            </div>

                                            {/* Cost */}
                                            <div className="text-sm font-semibold text-gray-900 text-right">
                                                ${(request.totalCost || request.invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0).toFixed(2)}
                                            </div>

                                            {/* Date */}
                                            <div className="text-sm text-gray-600 text-center">
                                                {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            {maintenanceRequests.length > 0 && (
                                <div className="mt-6">
                                    <Pagination
                                        page={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        totalItems={maintenanceRequests.length}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Tenancy Info - Placeholder */}
            {activeCard === 'tenancy' && (
                <div className="text-center py-12 text-gray-500 bg-card rounded-2xl">
                    <p>No tenancy records available for this property yet.</p>
                </div>
            )}
        </div>
    );
};

export default OwnerNotes;