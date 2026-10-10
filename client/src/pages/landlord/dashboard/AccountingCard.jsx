import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/apiEndpoints';
import LoadingState from '@/components/shared/LoadingState';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';

// Chart config for accounting data
const accountingChartConfig = {
    value: {
        label: "Amount",
    },
    outstanding: {
        label: "Outstanding Balances",
        color: "#8b5cf6",
    },
    overdue: {
        label: "Overdue",
        color: "var(--chart-1)",
    },
    paid: {
        label: "Paid (Month)",
        color: "var(--chart-3)",
    },
};

const AccountingCard = ({ showSkeleton = false }) => {
// Fetch payment summary
    const { data: summary, isLoading, isFetched } = useQuery({
        queryKey: ['payment-summary-dashboard'],
        queryFn: async () => {
            const response = await api.get(API_ENDPOINTS.PAYMENTS.SUMMARY);
            return response.data.data;
        },
    });

    const accountingData = useMemo(() => {
        if (!summary) return [];
        
        return [
            { 
                name: 'Outstanding Balances',
                displayName: ['Outstanding', 'Balances'],
                value: summary.outstanding.total || 0, 
                fill: 'var(--chart-2)' 
            },
            { 
                name: 'Overdue',
                displayName: ['Overdue'],
                value: summary.overdue.total || 0, 
                fill: 'var(--chart-1)' 
            },
            { 
                name: 'Paid (Month)',
                displayName: ['Paid (Month)'],
                value: summary.paid.total || 0, 
                fill: 'var(--chart-3)' 
            }
        ];
    }, [summary]);

    // Show loading only after first load
    const showLoading = isLoading && isFetched;

    return (
        <div className="bg-card rounded-2xl p-5 md:p-6 h-full overflow-hidden flex flex-col min-h-[350px]">
            <h3 className="text-3xl md:text-3xl lg:text-[32px] font-bold mb-2 flex-shrink-0 text-primary">Accounting</h3>
            {showSkeleton ? (
                <div className="flex flex-row items-center gap-3 md:gap-6 flex-1 min-h-0">
                    {/* Legend Skeleton - Left Side */}
                    <div className="w-auto flex-shrink-0 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center">
                                <Skeleton className="w-4 h-4 rounded-full mr-3" />
                                <div>
                                    <Skeleton className="h-5 w-32 mb-2" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Chart Skeleton - Right Side */}
                    <div className="flex-1 flex justify-center items-center">
                        <Skeleton className="w-48 h-48 rounded-full" />
                    </div>
                </div>
            ) : showLoading ? (
                <div className="flex-1 flex items-center justify-center min-h-[280px]">
                    <LoadingState message="Loading accounting data..." compact={true} />
                </div>
            ) : accountingData.length === 0 || accountingData.every(d => d.value === 0) ? (
                <div className="text-center text-sm text-gray-500 flex-1 flex flex-col items-center justify-center min-h-[280px] w-full">
                    {isLoading ? (
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center mb-6">
                            <FileText className="w-8 h-8 text-gray-400 mb-2" />
                            <span>No payment data available</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-row items-center gap-3 md:gap-6 flex-1 min-h-0 fade-in">
                    {/* Legend - Left Side */}
                    <div className="w-auto flex-shrink-0">
                        {accountingData.map((item) => (
                            <div key={item.name} className="mb-4 flex">
                                <div
                                    className="min-w-4 rounded-full mr-3 mt-1"
                                    style={{ backgroundColor: item.fill }}
                                ></div>
                                <div>
                                    <div className="text-base font-bold text-gray-900">
                                        {item.displayName.map((line, idx) => (
                                            <div key={idx}>{line}</div>
                                        ))}
                                    </div>
                                    <div className="text-sm text-gray-900">
                                        ${item.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Donut Chart - Right Side, Larger */}
                    <div className="flex-1 flex justify-center items-center overflow-hidden min-w-0">
                        <div className="w-full max-w-[240px] md:max-w-[260px] lg:max-w-[280px] aspect-square overflow-hidden">
                            <ChartContainer config={accountingChartConfig} className="w-full h-full overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={accountingData}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius="40%"
                                            outerRadius="80%"
                                        >
                                            {accountingData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <ChartTooltip
                                            content={<ChartTooltipContent 
                                                hideLabel
                                                formatter={(value, name, item) => {
                                                    const label = item.name;
                                                    const color = item.payload.fill;
                                                    return [
                                                        <div key={item.name} className="flex items-center gap-2">
                                                            <div 
                                                                className="w-3 h-3 rounded" 
                                                                style={{ backgroundColor: color }}
                                                            />
                                                            <span>{label}: ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>
                                                    ];
                                                }}
                                            />}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </ChartContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountingCard;