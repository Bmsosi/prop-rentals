import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { getAllInsurances } from '@/services/insuranceService';
import { Skeleton } from '@/components/ui/skeleton';

const RentersInsuranceCard = ({ showSkeleton = false }) => {
    const [insurances, setInsurances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInsurances = async () => {
            try {
                setLoading(true);
                const data = await getAllInsurances();
                const insuranceList = data.insurances || data || [];
                setInsurances(Array.isArray(insuranceList) ? insuranceList : []);
            } catch (error) {
                console.error('Error fetching insurances:', error);
                setInsurances([]);
            } finally {
                setLoading(false);
            }
        };

        fetchInsurances();
    }, []);

    // Calculate statistics from insurance data
    const calculateStats = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        thirtyDaysFromNow.setHours(23, 59, 59, 999); // End of day

        let expiringInThirty = 0;
        let notExpiring = 0;
        let notNotified = 0;
        let notified = 0;

        insurances.forEach((insurance) => {
            const status = insurance.status;
            const expiryDate = insurance.expiryDate ? new Date(insurance.expiryDate) : null;

            // Insured: VERIFIED or EXPIRING_SOON (but not EXPIRED)
            if (status === 'VERIFIED' || status === 'EXPIRING_SOON') {
                // Check if expiring within 30 days
                if (status === 'EXPIRING_SOON') {
                    // If status is EXPIRING_SOON, count it as expiring
                    expiringInThirty++;
                } else if (expiryDate) {
                    // For VERIFIED, check expiry date
                    const expiry = new Date(expiryDate);
                    expiry.setHours(0, 0, 0, 0);
                    
                    if (expiry >= today && expiry <= thirtyDaysFromNow) {
                        expiringInThirty++;
                    } else if (expiry > thirtyDaysFromNow) {
                        notExpiring++;
                    } else {
                        // Expired but status is still VERIFIED (shouldn't happen, but handle it)
                        notExpiring++;
                    }
                } else {
                    // VERIFIED but no expiry date - count as not expiring
                    notExpiring++;
                }
            } 
            // Uninsured: PENDING or REJECTED
            else if (status === 'PENDING') {
                notNotified++;
            } else if (status === 'REJECTED') {
                notified++;
            }
            // EXPIRED status is not counted in either category
        });

        const totalInsured = expiringInThirty + notExpiring;
        const totalUninsured = notNotified + notified;

        return {
            totalInsured,
            totalUninsured,
            expiringInThirty,
            notExpiring,
            notNotified,
            notified,
        };
    };

    const stats = calculateStats();
    // Ensure maxValue is at least 1 to show bars even when all values are 0
    const maxValue = Math.max(
        stats.totalInsured + stats.totalUninsured,
        1 // Ensure at least 1 so chart displays properly
    );

    // Chart data handling
    // When all buckets are zero, show equal segments purely for visual balance
    const allZero =
        stats.expiringInThirty === 0 &&
        stats.notExpiring === 0 &&
        stats.notNotified === 0 &&
        stats.notified === 0;

    const chartData = allZero
        ? [
            {
                category: "insurance",
                expiringInThirty: 1,
                notExpiring: 1,
                notNotified: 1,
                notified: 1,
            },
          ]
        : [
            {
                category: "insurance",
                // Use small minimums only for zero values so the bar remains visible
                expiringInThirty: stats.expiringInThirty > 0 ? stats.expiringInThirty : 0.05,
                notExpiring: stats.notExpiring > 0 ? stats.notExpiring : 0.05,
                notNotified: stats.notNotified > 0 ? stats.notNotified : 0.05,
                notified: stats.notified > 0 ? stats.notified : 0.05,
            },
          ];

    // Adjust maxValue to account for chartData values
    const adjustedMaxValue = allZero
        ? 4 // 1 + 1 + 1 + 1
        : Math.max(
            maxValue,
            (stats.expiringInThirty > 0 ? stats.expiringInThirty : 0.05) +
                (stats.notExpiring > 0 ? stats.notExpiring : 0.05) +
                (stats.notNotified > 0 ? stats.notNotified : 0.05) +
                (stats.notified > 0 ? stats.notified : 0.05),
            1
          );

    if (showSkeleton || loading) {
        return (
            <div className="bg-card rounded-2xl p-5 md:p-6 h-full flex flex-col overflow-hidden min-h-[350px]">
                <h2 className="text-3xl md:text-3xl lg:text-[32px] font-bold mb-2 text-primary">Renters Insurance</h2>
                
                <div className="flex flex-row items-center gap-3 md:gap-6 lg:gap-10 flex-1 min-h-[280px]">
                    {/* Chart Skeleton */}
                    <div className="w-28 sm:w-24 lg:w-32 h-56 sm:h-64 flex-shrink-0 -ml-1 sm:-ml-2">
                        <Skeleton className="w-full h-full rounded-xl" />
                    </div>

                    {/* Legend Skeleton */}
                    <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
                        {/* Insured Section Skeleton */}
                        <div>
                            <Skeleton className="h-5 w-32 mb-3" />
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-3.5 ml-3">
                                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                                    <Skeleton className="h-5 w-48" />
                                </div>
                                <div className="flex items-center gap-3.5 ml-3">
                                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                                    <Skeleton className="h-5 w-44" />
                                </div>
                            </div>
                        </div>

                        {/* Uninsured Section Skeleton */}
                        <div>
                            <Skeleton className="h-5 w-36 mb-3" />
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-3.5 ml-3">
                                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                                    <Skeleton className="h-5 w-32" />
                                </div>
                                <div className="flex items-center gap-3.5 ml-3">
                                    <Skeleton className="w-8 h-8 rounded-lg flex-shrink-0" />
                                    <Skeleton className="h-5 w-36" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl p-5 md:p-6 h-full flex flex-col overflow-hidden min-h-[350px]">
            <h2 className="text-3xl md:text-3xl lg:text-[32px] font-bold mb-2 text-primary">Renters Insurance</h2>
            
            <div className="flex flex-row items-center gap-3 md:gap-6 lg:gap-10 flex-1 min-h-[280px] fade-in">
                {/* Chart Container */}
                <div 
                    className="w-28 sm:w-24 lg:w-32 h-56 sm:h-64 flex-shrink-0 p-0 -ml-1 sm:-ml-2 rounded-xl overflow-hidden pt-2 sm:pt-3"
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                            <XAxis type="category" dataKey="category" hide />
                            <YAxis type="number" hide domain={[0, adjustedMaxValue]} />
                            <defs>
                                {/* Accent (insured) diagonal stripe pattern */}
                                <pattern id="patternAccent" patternUnits="userSpaceOnUse" width="8" height="8">
                                    <rect width="8" height="8" fill="var(--chart-1)" />
                                    <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="white" strokeWidth="2" strokeOpacity="0.35" />
                                </pattern>
                                {/* Secondary-foreground (uninsured) diagonal stripe pattern */}
                                <pattern id="patternSecondary" patternUnits="userSpaceOnUse" width="8" height="8">
                                    <rect width="8" height="8" fill="var(--chart-3)" />
                                    <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="white" strokeWidth="2" strokeOpacity="0.35" />
                                </pattern>
                            </defs>
                            <Bar 
                                dataKey="notified" 
                                stackId="a" 
                                radius={[0, 0, 24, 24]} 
                                fill="var(--chart-3)"
                                minPointSize={2}
                            />
                            <Bar 
                                dataKey="notNotified" 
                                stackId="a" 
                                fill="url(#patternSecondary)"
                                minPointSize={2}
                            />
                            <Bar 
                                dataKey="notExpiring" 
                                stackId="a" 
                                fill="var(--chart-1)"
                                minPointSize={0}
                            />
                            <Bar 
                                dataKey="expiringInThirty" 
                                stackId="a" 
                                radius={[24, 24, 0, 0]} 
                                fill="url(#patternAccent)"
                                minPointSize={2}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
                    {/* Insured Section */}
                    <div>
                        <h3 className="text-sm sm:text-base md:text-[17px] font-bold mb-2 sm:mb-3">Insured ({stats.totalInsured})</h3>
                        <div className="space-y-2 sm:space-y-2.5">
                            <div className="flex items-center gap-2 sm:gap-3.5 ml-2 sm:ml-3">
                                <div 
                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" 
                                    style={{
                                        background: `repeating-linear-gradient(
                                            45deg,
                                            var(--chart-1),
                                            var(--chart-1) 4.5px,
                                            rgba(255,255,255,0.35) 4px,
                                            rgba(255,255,255,0.35) 5px
                                        )`
                                    }} 
                                />
                                <span className="text-xs sm:text-sm md:text-[17px]">Expiring in 30 days ({stats.expiringInThirty})</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3.5 ml-2 sm:ml-3">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" style={{ background: 'var(--chart-1)' }} />
                                <span className="text-xs sm:text-sm md:text-[17px]">Not expiring soon ({stats.notExpiring})</span>
                            </div>
                        </div>
                    </div>

                    {/* Uninsured Section */}
                    <div>
                        <h3 className="text-sm sm:text-base md:text-[17px] font-bold mb-2 sm:mb-3">Uninsured ({stats.totalUninsured})</h3>
                        <div className="space-y-2 sm:space-y-2.5">
                            <div className="flex items-center gap-2 sm:gap-3.5 ml-2 sm:ml-3">
                                <div 
                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" 
                                    style={{
                                        background: `repeating-linear-gradient(
                                            45deg,
                                            var(--chart-3),
                                            var(--chart-3) 4.5px,
                                            rgba(255,255,255,0.2) 4px,
                                            rgba(255,255,255,0.2) 5px
                                        )`
                                    }} 
                                />
                                <span className="text-xs sm:text-sm md:text-[17px]">Pending ({stats.notNotified})</span>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3.5 ml-2 sm:ml-3">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex-shrink-0" style={{ background: 'var(--chart-3)' }} />
                                <span className="text-xs sm:text-sm md:text-[17px]">Rejected ({stats.notified})</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RentersInsuranceCard;
