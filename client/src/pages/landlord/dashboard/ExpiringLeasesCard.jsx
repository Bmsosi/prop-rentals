import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import LoadingState from '@/components/shared/LoadingState';
import { Skeleton } from '@/components/ui/skeleton';
import { FileCheck } from 'lucide-react';

// Chart config
const chartConfig = {
    expiring_leases: {
        label: "Expiring Leases",
        mobileLabel: ["Expiring", "Leases"],
    },
    draft: {
        label: "Draft Leases",
        mobileLabel: ["Draft", "Leases"],
        color: "var(--chart-1)",
    },
    active: {
        label: "Active Leases",
        mobileLabel: ["Active", "Leases"],
        color: "var(--chart-2)",
    },
    expiring_soon: {
        label: "Expiring Leases",
        mobileLabel: ["Expiring", "Leases"],
        color: "var(--chart-3)",
    },
};

const filters = [
    { id: '0-30', label: '0-30 Days' },
    { id: '31-60', label: '31-60 Days' },
    { id: '61-90', label: '61-90 Days' },
    { id: 'all', label: 'All' }
];

const ExpiringLeasesCard = ({ showSkeleton = false }) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768); // md breakpoint
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fetch standard leases
    const { data: standardLeases = [], isLoading: isLoadingStandard, isFetched: isFetchedStandard } = useQuery({
        queryKey: ['leases-dashboard'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.LEASES.BASE);
            return response.data.data || response.data || [];
        },
    });

    // Fetch custom leases
    const { data: customLeases = [], isLoading: isLoadingCustom, isFetched: isFetchedCustom } = useQuery({
        queryKey: ['customleases-dashboard'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
            return response.data.data || response.data || [];
        },
    });

    // Combine both standard and custom leases
    const leases = [...standardLeases, ...customLeases];
    const isLoading = isLoadingStandard || isLoadingCustom;
    const isFetched = isFetchedStandard && isFetchedCustom;

    // Calculate expiring leases by time period
    const chartData = useMemo(() => {
        if (!leases.length) return [];

        const now = new Date();
        
        // Filter out terminated and expired leases
        const validLeases = leases.filter(lease => {
            // Check both possible field names (leaseStatus or status)
            const status = lease.leaseStatus || lease.status;
            return status !== 'TERMINATED' && status !== 'EXPIRED';
        });

        // Separate draft leases - always show ALL draft leases regardless of date filter
        const allDraftLeases = validLeases.filter(lease => {
            // Check both possible field names (leaseStatus or status)
            const status = lease.leaseStatus || lease.status;
            return status === 'DRAFT';
        });

        // Filter non-draft leases by endDate and time period
        const filterNonDraftLeasesByDays = (minDays, maxDays) => {
            return validLeases.filter(lease => {
                // Check both possible field names (leaseStatus or status)
                const status = lease.leaseStatus || lease.status;
                
                // Skip draft leases (handled separately)
                if (status === 'DRAFT') {
                    return false;
                }
                
                // Skip leases without endDate
                if (!lease.endDate) {
                    return false;
                }
                
                const endDate = new Date(lease.endDate);
                const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                return daysUntilExpiry >= minDays && daysUntilExpiry <= maxDays;
            });
        };

        // Filter non-draft leases by time period
        let filteredNonDraftLeases = [];
        if (activeFilter === '0-30') {
            filteredNonDraftLeases = filterNonDraftLeasesByDays(0, 30);
        } else if (activeFilter === '31-60') {
            filteredNonDraftLeases = filterNonDraftLeasesByDays(31, 60);
        } else if (activeFilter === '61-90') {
            filteredNonDraftLeases = filterNonDraftLeasesByDays(61, 90);
        } else {
            // For "All" filter, include all non-draft leases with endDate within 365 days
            filteredNonDraftLeases = filterNonDraftLeasesByDays(0, 365);
        }

        // Combine draft leases (always included) with filtered non-draft leases
        const filteredLeases = [...allDraftLeases, ...filteredNonDraftLeases];

        // Categorize leases
        const draft = allDraftLeases.length;
        const active = filteredNonDraftLeases.filter(l => {
            const status = l.leaseStatus || l.status;
            return status === 'ACTIVE';
        }).length;
        const expiringSoon = filteredNonDraftLeases.filter(l => {
            if (!l.endDate) return false;
            const status = l.leaseStatus || l.status;
            const endDate = new Date(l.endDate);
            const daysUntilExpiry = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 30 && status === 'ACTIVE';
        }).length;

        // Use a minimal render value for zero counts to keep bars visible
        const toRenderValue = (value) => (value > 0 ? value : 0.05);
        return [
            { browser: "draft", expiring_leases: draft, render_value: toRenderValue(draft), fill: "var(--color-draft)" },
            { browser: "active", expiring_leases: active, render_value: toRenderValue(active), fill: "var(--color-active)" },
            { browser: "expiring_soon", expiring_leases: expiringSoon, render_value: toRenderValue(expiringSoon), fill: "var(--color-expiring_soon)" },
        ];
    }, [leases, activeFilter]);

    // Don't show loading indicator on first load
    const showLoading = isLoading && isFetched;

    return (
        <div className="bg-card rounded-2xl p-5 md:p-6 h-full flex flex-col overflow-hidden min-h-[350px]">
            <h3 className="text-3xl md:text-3xl lg:text-[32px] font-bold mb-6 text-primary">Expiring Leases</h3>
            {/* Filter Buttons */}
            <div className="flex gap-2 mb-3 justify-start flex-shrink-0">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold transition-colors ${activeFilter === filter.id
                            ? (filter.id === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-white')
                            : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {showSkeleton ? (
                <div className="flex-1 min-h-[220px] max-h-[220px] overflow-hidden">
                    <div className="h-full flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-4">
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-6 flex-1" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : showLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[220px]">
                    <LoadingState message="Loading leases..." compact={true} />
                </div>
            ) : chartData.length === 0 ? (
                <div className="text-center text-sm text-gray-500 flex-1 flex flex-col items-center justify-center min-h-[220px]">
                    {isLoading && !isFetched ? (
                        <div className="animate-pulse w-full space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-6 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <FileCheck className="w-8 h-8 text-gray-400 mb-2" />
                            <span>No leases expiring in this period</span>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex-1 min-h-[220px] max-h-[220px] overflow-hidden fade-in">
                    <ChartContainer config={chartConfig} className="h-full">
                        <BarChart
                            accessibilityLayer
                            data={chartData}
                            layout="vertical"
                            barCategoryGap="5%"
                            margin={{ top: 10, right: 0, bottom: 10, left: 35 }}
                        >
                            <YAxis
                                dataKey="browser"
                                type="category"
                                tickLine={false}
                                tickMargin={isMobile ? 60 : 120}
                                axisLine={true}
                                width={isMobile ? 60 : 120}
                                tick={(props) => {
                                    const { x, y, payload } = props;
                                    const config = chartConfig[payload.value];
                                    if (!config) return null;
                                    
                                    if (isMobile) {
                                        // Two-line labels for mobile
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={-2}
                                                    textAnchor="start"
                                                    fill="#000"
                                                    fontSize={12}
                                                >
                                                    {config.mobileLabel?.[0] || config.label.split(' ')[0]}
                                                </text>
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={10}
                                                    textAnchor="start"
                                                    fill="#000"
                                                    fontSize={12}
                                                >
                                                    {config.mobileLabel?.[1] || config.label.split(' ')[1] || ''}
                                                </text>
                                            </g>
                                        );
                                    } else {
                                        // Single-line labels for desktop
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <text
                                                    x={0}
                                                    y={0}
                                                    dy={4}
                                                    textAnchor="start"
                                                    fill="#000"
                                                    fontSize={14}
                                                >
                                                    {config.label}
                                                </text>
                                            </g>
                                        );
                                    }
                                }}
                            />
                            <XAxis dataKey="render_value" type="number" hide />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent
                                    hideLabel
                                    formatter={(value, name, item) => {
                                        const label = chartConfig[item.payload.browser]?.label || item.payload.browser;
                                        const color = item.payload.fill;
                                        return [
                                            <div key={item.payload.browser} className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded"
                                                    style={{ backgroundColor: color }}
                                                />
                                                <span>{label}: {item.payload.expiring_leases}</span>
                                            </div>
                                        ];
                                    }}
                                />}
                            />
                            <Bar dataKey="render_value" layout="vertical" radius={[0, 16, 16, 0]} barSize={28} />
                        </BarChart>
                    </ChartContainer>
                </div>
            )}
        </div>
    );
};

export default ExpiringLeasesCard;