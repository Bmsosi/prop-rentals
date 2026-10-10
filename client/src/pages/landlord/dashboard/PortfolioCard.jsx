import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { Skeleton } from '@/components/ui/skeleton';
import { Home } from 'lucide-react';

const PortfolioCard = ({ showSkeleton = false }) => {
    // Fetch all listings
    const { data: listings = [], isLoading } = useQuery({
        queryKey: ['listings-dashboard'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.LISTINGS.BASE);
            const data = response.data;
            return Array.isArray(data) ? data : data.listing || data.data || [];
        },
    });

    const chartData = useMemo(() => {
        if (!listings || !Array.isArray(listings) || listings.length === 0) {
            return {
                listed: 0,
                occupied: 0,
            };
        }

        // Listed = all listings (ACTIVE status)
        const listed = listings.filter(l => l.status === 'ACTIVE').length || 0;
        
        // Occupied = rented properties (RENTED status) 
        const occupied = listings.filter(l => l.status === 'RENTED').length || 0;

        return {
            listed: Number(listed) || 0,
            occupied: Number(occupied) || 0,
        };
    }, [listings]);

    const totalListed = chartData.listed;
    const totalOccupied = chartData.occupied;
    const totalProperties = totalListed + totalOccupied;
    const hasData = !isLoading && totalProperties > 0;

    if (showSkeleton || isLoading) {
        return (
            <div className="bg-card rounded-2xl p-5 md:p-6 pb-4 md:pb-5 flex flex-col self-start">
                <h2 className="text-3xl md:text-3xl lg:text-[32px] font-bold mb-2 text-primary">Portfolio</h2>
                
                {/* Category Labels Skeleton */}
                <div className="relative mb-1">
                    <div className="flex justify-between">
                        <div className="flex items-center">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="w-2.5 h-2.5 ml-1.5" />
                        </div>
                        <div className="flex items-center">
                            <Skeleton className="w-2.5 h-2.5 mr-1.5" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>

                {/* Stacked Bar Chart Skeleton */}
                <div className="h-10 my-3 flex items-center">
                    <Skeleton className="w-full h-8 rounded-full" />
                </div>

                {/* Legend Skeleton */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm my-2.5">
                    <div>
                        <div className="flex items-center gap-1.5">
                            <Skeleton className="w-3 h-3 rounded" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-3 w-32 ml-4.5 mt-0" />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <Skeleton className="w-3 h-3 rounded" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="h-3 w-36 ml-4.5 mt-0" />
                    </div>
                </div>
            </div>
        );
    }

    if (!hasData) {
        return (
            <div className="bg-card rounded-2xl p-5 md:p-6 pb-4 md:pb-5 flex flex-col self-start min-h-[200px]">
                <h2 className="text-3xl md:text-3xl lg:text-[32px] font-bold mb-2 text-primary">Portfolio</h2>
                <div className="text-center text-sm text-gray-500 flex-1 flex flex-col items-center justify-center">
                    <Home className="w-8 h-8 text-gray-400 mb-2" />
                    <span>No properties in portfolio</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-5 md:p-6 pb-4 md:pb-8 flex flex-col self-start fade-in">
            <h2 className="text-3xl md:text-3xl lg:text-[32px] font-bold mb-2 text-primary">Portfolio</h2>
            
            {/* Category Labels with Markers */}
            <div className="relative mb-1 overflow-visible">
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center flex-shrink-0"><span className="text-sm font-semibold">Listed</span><span className="text-sm font-semibold ml-1">({totalListed})</span><svg className="ml-1.5" width="10" height="10" viewBox="0 0 12 12"><polygon points="6,0 12,12 0,12" fill="var(--chart-1)" /></svg></div>
                    <div className="flex items-center flex-shrink-0 ml-auto"><svg className="mr-1.5" width="10" height="10" viewBox="0 0 12 12"><polygon points="6,0 12,12 0,12" fill="var(--chart-3)" /></svg><span className="text-sm font-semibold">Occupied</span><span className="text-sm font-semibold ml-1">({totalOccupied})</span></div>
                </div>
            </div>

            {/* Stacked Bar Chart - CSS Based */}
            <div className="h-10 mb-1 flex items-center">
                <div className="w-full h-6 flex rounded-full overflow-hidden bg-gray-100">
                    {/* Listed (Vacant) */}
                    {chartData.listed > 0 && (
                        <div 
                            className="h-full flex items-center justify-center text-white text-xs font-semibold transition-all"
                            // Accent base
                            role="presentation"
                            aria-hidden="true"
                            // Inline style for color to leverage CSS variables
                            // eslint-disable-next-line react/no-unknown-property
                            data-color="chart-1"
                            /* Use CSS var for background to match Insured range */
                            // @ts-ignore
                            // React accepts style prop below
                            // We intentionally keep it inline to ensure runtime theming
                            // via CSS variables without extra classes
                            // prettier-ignore
                            // eslint-disable-next-line react/style-prop-object
                            style={{ width: `${(chartData.listed / totalProperties) * 100}%`, background: 'var(--chart-1)' }}
                            title={`Listed: ${chartData.listed}`}
                        >
                            {chartData.listed}
                        </div>
                    )}
                    
                    {/* Occupied (Rented) */}
                    {chartData.occupied > 0 && (
                        <div 
                            className="h-full flex items-center justify-center text-white text-xs font-semibold transition-all"
                            style={{ width: `${(chartData.occupied / totalProperties) * 100}%`, background: 'var(--chart-3)' }}
                            title={`Occupied: ${chartData.occupied}`}
                        >
                            {chartData.occupied}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-sm mb-2.5">
                {/* Listed Section */}
                <div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ background: 'var(--chart-1)' }}></div>
                        <span className="font-semibold text-sm">Listed ({chartData.listed})</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-4.5">Available listings</p>
                </div>

                {/* Occupied Section */}
                <div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded" style={{ background: 'var(--chart-3)' }}></div>
                        <span className="font-semibold text-sm">Occupied ({chartData.occupied})</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-4.5">Rented properties</p>
                </div>
            </div>
        </div>
    );
};

export default PortfolioCard;

