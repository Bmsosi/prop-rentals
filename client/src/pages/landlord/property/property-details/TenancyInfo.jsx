import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow, differenceInMonths } from 'date-fns';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { getRentCycleLabel } from '@/constants/rentCycles';

const statusColors = {
    ACTIVE: 'bg-green-100 text-green-800',
    DRAFT: 'bg-yellow-100 text-yellow-800',
    EXPIRED: 'bg-gray-200 text-gray-700',
    TERMINATED: 'bg-red-100 text-red-800',
};

const fetchTenancyData = async (listingId) => {
    const [standardRes, customRes] = await Promise.all([
        api.get(API_ENDPOINTS.LEASES.BASE, {
            params: { listingId, limit: 100, page: 1 },
        }),
        api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE, {
            params: { listingId },
        }),
    ]);

    const standardLeases = standardRes.data?.data || standardRes.data || [];
    const customLeases = customRes.data?.data || customRes.data || [];

    return { standardLeases, customLeases };
};

const formatTenantName = (lease) => {
    if (lease.tenantFullName) return lease.tenantFullName;
    const first = lease.tenant?.firstName || '';
    const last = lease.tenant?.lastName || '';
    const combined = `${first} ${last}`.trim();
    return combined || 'No tenant assigned';
};

const formatRent = (amount, frequency) => {
    if (!amount) return '—';
    const labeledFrequency = frequency ? getRentCycleLabel(frequency) : '';
    return `$${Number(amount).toLocaleString()}${labeledFrequency ? ` / ${labeledFrequency}` : ''}`;
};

const formatTerm = (start, end) => {
    if (!start && !end) return '—';
    const startLabel = start ? format(new Date(start), 'MMM d, yyyy') : 'N/A';
    const endLabel = end ? format(new Date(end), 'MMM d, yyyy') : 'Present';
    return `${startLabel} - ${endLabel}`;
};

const formatDuration = (start, end) => {
    if (!start) return '—';
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    if (isNaN(startDate) || isNaN(endDate)) return '—';

    const totalMonths = Math.max(differenceInMonths(endDate, startDate), 0);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;

    const parts = [];
    if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);

    if (!parts.length) return '<1 mo';
    return parts.join(' ');
};

const TenancyInfo = ({ listingId }) => {
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['property-tenancy', listingId],
        queryFn: () => fetchTenancyData(listingId),
        enabled: !!listingId,
        staleTime: 0,
        cacheTime: 0,
        refetchOnWindowFocus: false,
    });

    const tenancyRecords = useMemo(() => {
        if (!data) return [];

        const mapLease = (lease, type) => ({
            id: lease.id,
            type,
            typeLabel: type === 'standard' ? 'Standard Lease' : 'Custom Lease',
            tenantName: formatTenantName(lease),
            tenantEmail: lease.tenantEmail || lease.tenant?.email || '—',
            tenantPhone: lease.tenantPhone || lease.tenant?.phone || '—',
            status: lease.leaseStatus || 'N/A',
            rentAmount: lease.rentAmount,
            paymentFrequency: lease.paymentFrequency,
            startDate: lease.startDate,
            endDate: lease.endDate,
            updatedAt: lease.updatedAt || lease.createdAt,
            createdAt: lease.createdAt,
            leaseName: lease.leaseName || lease.listing?.title,
        });

        const standard = (data.standardLeases || []).map((lease) =>
            mapLease(lease, 'standard')
        );
        const custom = (data.customLeases || []).map((lease) =>
            mapLease(lease, 'custom')
        );

        const combined = [...standard, ...custom];
        const statusPriority = { ACTIVE: 1, DRAFT: 2, TERMINATED: 3, EXPIRED: 4 };

        return combined.sort((a, b) => {
            const diff =
                (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99);
            if (diff !== 0) return diff;

            const aDate = new Date(a.startDate || a.updatedAt || a.createdAt || 0);
            const bDate = new Date(b.startDate || b.updatedAt || b.createdAt || 0);
            return bDate - aDate;
        });
    }, [data]);

    const currentTenancy = tenancyRecords.find((record) => record.status === 'ACTIVE');

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-48 rounded-xl" />
                <Card className="border border-gray-200 p-5 animate-pulse">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32 rounded-lg" />
                            <Skeleton className="h-6 w-48 rounded-lg" />
                            <Skeleton className="h-4 w-64 rounded-lg" />
                        </div>
                        <div className="space-y-2 md:items-end flex flex-col w-full md:w-auto">
                            <Skeleton className="h-5 w-20 rounded-md" />
                            <Skeleton className="h-5 w-24 rounded-lg" />
                            <Skeleton className="h-4 w-28 rounded-lg" />
                        </div>
                    </div>
                </Card>
                <div className="grid grid-cols-7 gap-4 bg-gray-900/20 p-3 text-white font-semibold rounded-2xl opacity-70">
                    {Array.from({ length: 7 }).map((_, idx) => (
                        <div key={`tenancy-head-skeleton-${idx}`} className="h-4 bg-gray-900/20 rounded" />
                    ))}
                </div>
                <div className="space-y-1 h-[320px] overflow-hidden">
                    {[...Array(4)].map((_, idx) => (
                        <Card key={`tenancy-skeleton-${idx}`} className="border border-gray-200 p-3 animate-pulse">
                            <div className="grid grid-cols-7 gap-4 items-center">
                                <Skeleton className="h-4 w-24 rounded-lg" />
                                <Skeleton className="h-4 w-20 rounded-lg" />
                                <Skeleton className="h-5 w-16 rounded-md" />
                                <Skeleton className="h-4 w-16 rounded-md justify-self-end" />
                                <Skeleton className="h-4 w-28 rounded-lg" />
                                <Skeleton className="h-4 w-14 rounded-lg" />
                                <Skeleton className="h-4 w-20 rounded-lg justify-self-center" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-12 text-gray-500 bg-white border border-gray-300 rounded-lg">
                <p>Failed to load tenancy information.</p>
                <p className="text-sm text-gray-400 mt-2">{error?.message}</p>
            </div>
        );
    }

    if (!tenancyRecords.length) {
        return (
            <div className="text-center py-12 text-gray-500 bg-card rounded-2xl">
                <p>No tenancy records available for this property yet.</p>
            </div>
        );
    }

    return (
        <div className="max-h-[500px]">
            <h3 className="text-xl font-semibold mb-4">Tenancy Overview</h3>

            {/* Current Tenancy */}
            <Card className="border border-gray-300 p-5 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wide">
                            Current Tenancy
                        </p>
                        <h4 className="text-2xl font-bold mt-1">
                            {currentTenancy ? currentTenancy.tenantName : 'No active tenancy'}
                        </h4>
                        {currentTenancy ? (
                            <p className="text-sm text-gray-500 mt-1">
                                {currentTenancy.tenantEmail} · {currentTenancy.tenantPhone}
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 mt-1">
                                Send a lease to assign a tenant.
                            </p>
                        )}
                    </div>

                    {currentTenancy && (
                        <div className="flex flex-col md:items-end gap-2">
                            <Badge
                                className={`w-fit ${statusColors[currentTenancy.status] || 'bg-gray-100 text-gray-800'}`}
                            >
                                {currentTenancy.status}
                            </Badge>
                            <p className="text-sm font-semibold text-gray-900">
                                {formatRent(
                                    currentTenancy.rentAmount,
                                    currentTenancy.paymentFrequency
                                )}
                            </p>
                            <p className="text-xs text-gray-500">
                                {formatTerm(currentTenancy.startDate, currentTenancy.endDate)}
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Tenancy History */}
            <div>
                <div className="grid grid-cols-7 gap-4 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl mb-3">
                    <div>Tenant</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Lease</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Status</div>
                    <div className="border-l border-primary-foreground/20 pl-4 text-right">Rent</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Term</div>
                    <div className="border-l border-primary-foreground/20 pl-4">Duration</div>
                    <div className="border-l border-primary-foreground/20 pl-4 text-center">Updated</div>
                </div>

                <div className="space-y-1 h-[350px] overflow-y-auto pr-2 border border-gray-200 rounded-lg p-2">
                    {tenancyRecords.map((record) => (
                        <Card
                            key={record.id}
                            className={`border border-gray-300 hover:shadow-md transition-shadow p-3 ${record.status === 'ACTIVE' ? 'ring-2 ring-gray-900' : ''
                                }`}
                        >
                            <div className="grid grid-cols-7 gap-4 items-center">
                                <div className="truncate">
                                    <p className="font-semibold text-gray-900" title={record.tenantName}>
                                        {record.tenantName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {record.tenantEmail}
                                    </p>
                                </div>

                                <div className="border-l border-gray-100 pl-4">
                                    <p className="font-semibold text-gray-900">
                                        {record.typeLabel}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {record.leaseName || '—'}
                                    </p>
                                </div>

                                <div className="border-l border-gray-100 pl-4">
                                    <Badge
                                        className={`text-xs px-2 py-1 ${statusColors[record.status] || 'bg-gray-100 text-gray-800'}`}
                                    >
                                        {record.status}
                                    </Badge>
                                </div>

                                <div className="border-l border-gray-100 pl-4 text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {formatRent(record.rentAmount, record.paymentFrequency)}
                                    </p>
                                </div>

                                <div className="border-l border-gray-100 pl-4">
                                    <p className="text-sm text-gray-900">
                                        {formatTerm(record.startDate, record.endDate)}
                                    </p>
                                </div>

                                <div className="border-l border-gray-100 pl-4">
                                    <p className="text-sm text-gray-900">
                                        {formatDuration(record.startDate, record.endDate)}
                                    </p>
                                </div>

                                <div className="border-l border-gray-100 pl-4 text-center">
                                    <p className="text-xs text-gray-600">
                                        {record.updatedAt
                                            ? formatDistanceToNow(new Date(record.updatedAt), {
                                                addSuffix: true,
                                            })
                                            : '—'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TenancyInfo;

