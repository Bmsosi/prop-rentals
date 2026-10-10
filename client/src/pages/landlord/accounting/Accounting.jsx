import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/lib/apiEndpoints';
import { toast } from 'sonner';
import PageHeader from '@/components/shared/PageHeader';
import Pagination from '@/components/shared/Pagination';
import AccountingSearchBar from './AccountingSearchBar';
import SummaryCards from './SummaryCards';
import TransactionTable from './TransactionTable';
import FilterDialog from './FilterDialog';
import ReceiptReviewModal from './ReceiptReviewModal';
import { Skeleton } from '@/components/ui/skeleton';

const PaymentTableSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={`payment-skeleton-${index}`}
        className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 border border-gray-200 rounded-2xl p-3 items-center bg-card"
      >
        <div className="space-y-2">
          <Skeleton className="h-4 w-40 rounded-lg" />
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
        <div className="space-y-2 border-l border-gray-100 pl-4">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
        <div className="border-l border-gray-100 pl-4">
          <Skeleton className="h-4 w-24 rounded-lg" />
        </div>
        <div className="border-l border-gray-100 pl-4 pr-4 text-right">
          <Skeleton className="h-4 w-28 rounded-lg ml-auto" />
        </div>
        <div className="border-l border-gray-100 pl-4">
          <Skeleton className="h-4 w-28 rounded-lg" />
        </div>
        <div className="border-l border-gray-100 pl-4 flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="border-l border-gray-100 pl-4 flex justify-end gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    ))}
  </div>
);

const Accounting = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'ALL',
    type: 'ALL',
    tenantId: 'ALL',
    listingId: 'ALL',
  });
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const queryClient = useQueryClient();

  // Reset page when search term or filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters]);

  // Fetch payments with filters
  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
      if (filters.type && filters.type !== 'ALL') params.append('type', filters.type);

      const response = await api.get(`${API_ENDPOINTS.PAYMENTS.BASE}?${params.toString()}`);
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  // Fetch properties/listings for filter
  const { data: propertiesData } = useQuery({
    queryKey: ['properties-for-filter'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.LISTINGS.GET_ALL);
      return response.data?.listing || response.data || [];
    },
  });


  // Mark as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ paymentId, paymentDetails }) => {
      const response = await api.post(
        API_ENDPOINTS.PAYMENTS.MARK_PAID(paymentId),
        paymentDetails
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Payment marked as paid successfully');
      queryClient.invalidateQueries(['payments']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to mark payment as paid');
    },
  });

  // Approve receipt mutation
  const approveReceiptMutation = useMutation({
    mutationFn: async (paymentId) => {
      const response = await api.post(API_ENDPOINTS.PAYMENTS.APPROVE_RECEIPT(paymentId));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
    },
    onError: (error) => {
      throw error;
    },
  });

  // Reject receipt mutation
  const rejectReceiptMutation = useMutation({
    mutationFn: async ({ paymentId, reason }) => {
      const response = await api.post(API_ENDPOINTS.PAYMENTS.REJECT_RECEIPT(paymentId), { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
    },
    onError: (error) => {
      throw error;
    },
  });

  const handleViewProof = (payment) => {
    if (!payment.proofUrl) {
      toast.info('No receipt uploaded yet');
      return;
    }
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleApproveReceipt = async (paymentId) => {
    return approveReceiptMutation.mutateAsync(paymentId);
  };

  const handleRejectReceipt = async (paymentId, reason) => {
    return rejectReceiptMutation.mutateAsync({ paymentId, reason });
  };

  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setShowFilterDialog(false);
  };

  const handleClearFilter = (filterKey) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: 'ALL',
    }));
  };

  // Extract unique tenants from payments
  const uniqueTenants = useMemo(() => {
    const payments = data?.payments || [];
    const tenantsMap = new Map();
    
    payments.forEach((payment) => {
      if (payment.tenant && payment.tenant.id) {
        tenantsMap.set(payment.tenant.id, payment.tenant);
      }
    });
    
    return Array.from(tenantsMap.values());
  }, [data?.payments]);

  // Apply client-side filtering
  const filteredPayments = useMemo(() => {
    let filtered = data?.payments || [];

    const searchValue = searchTerm.trim().toLowerCase();
    if (searchValue) {
      filtered = filtered.filter((payment) => {
        const tenantName = payment.tenant
          ? `${payment.tenant.firstName || ''} ${payment.tenant.lastName || ''}`.toLowerCase()
          : '';
        const listing = payment.lease?.listing || payment.customLease?.listing;
        const propertyTitle = listing?.title?.toLowerCase() || '';
        const propertyAddress = listing
          ? `${listing.streetAddress || ''} ${listing.city || ''} ${listing.state || ''}`.toLowerCase()
          : '';
        const paymentType = payment.type?.toLowerCase() || '';
        const paymentStatus = payment.status?.toLowerCase() || '';
        const paymentReference = payment.reference?.toLowerCase() || '';
        const paymentNotes = payment.notes?.toLowerCase() || '';
        const amountString = payment.amount ? payment.amount.toString() : '';

        return (
          tenantName.includes(searchValue) ||
          propertyTitle.includes(searchValue) ||
          propertyAddress.includes(searchValue) ||
          paymentType.includes(searchValue) ||
          paymentStatus.includes(searchValue) ||
          paymentReference.includes(searchValue) ||
          paymentNotes.includes(searchValue) ||
          amountString.includes(searchValue)
        );
      });
    }

    // Filter by tenant
    if (filters.tenantId && filters.tenantId !== 'ALL') {
      filtered = filtered.filter((payment) => payment.tenantId === filters.tenantId);
    }

    // Filter by property/listing
    if (filters.listingId && filters.listingId !== 'ALL') {
      filtered = filtered.filter((payment) => {
        // Check lease listing
        if (payment.lease?.listing?.id === filters.listingId) return true;
        // Check custom lease listing
        if (payment.customLease?.listing?.id === filters.listingId) return true;
        // Check invoice maintenance request listing
        if (payment.invoice?.maintenanceRequest?.listing?.id === filters.listingId) return true;
        return false;
      });
    }

    return filtered;
  }, [data?.payments, filters.tenantId, filters.listingId, searchTerm]);

  // Calculate summary from filtered payments
  const filteredSummary = useMemo(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const calculateBreakdown = (payments) => {
      const breakdown = { rent: 0, deposit: 0, maintenance: 0, other: 0 };
      payments.forEach((payment) => {
        const type = payment.type.toLowerCase();
        const amount = payment.amount || 0;
        if (type === 'rent') breakdown.rent += amount;
        else if (type === 'deposit') breakdown.deposit += amount;
        else if (type === 'maintenance') breakdown.maintenance += amount;
        else breakdown.other += amount;
      });
      return breakdown;
    };

    // Outstanding (PENDING)
    const outstandingPayments = filteredPayments.filter(p => p.status === 'PENDING');
    const outstandingBreakdown = calculateBreakdown(outstandingPayments);
    const outstandingTotal = Object.values(outstandingBreakdown).reduce((sum, val) => sum + val, 0);

    // Overdue (PENDING with past due date)
    const overduePayments = filteredPayments.filter(p => 
      p.status === 'PENDING' && p.dueDate && new Date(p.dueDate) < now
    );
    const overdueBreakdown = calculateBreakdown(overduePayments);
    const overdueTotal = Object.values(overdueBreakdown).reduce((sum, val) => sum + val, 0);

    // Paid this month
    const paidPayments = filteredPayments.filter(p => 
      p.status === 'PAID' && p.paidDate && new Date(p.paidDate) >= firstDayOfMonth
    );
    const paidBreakdown = calculateBreakdown(paidPayments);
    const paidTotal = Object.values(paidBreakdown).reduce((sum, val) => sum + val, 0);

    return {
      outstanding: { total: outstandingTotal, breakdown: outstandingBreakdown },
      overdue: { total: overdueTotal, breakdown: overdueBreakdown },
      paid: { total: paidTotal, breakdown: paidBreakdown },
    };
  }, [filteredPayments]);

  // Pagination logic
  const totalPayments = filteredPayments.length;
  const totalPages = Math.ceil(totalPayments / limit);

  const paginatedPayments = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredPayments.slice(startIndex, endIndex);
  }, [filteredPayments, page, limit]);

  return (
    <div className="px-4 md:px-8 py-4">
      <div>
        <div className="hidden md:block">
          <PageHeader
            title="Accounting"
            subtitle="Track payments, outstanding balances, and manage financial records"
          />
        </div>

        <AccountingSearchBar
          searchQuery={searchTerm}
          setSearchQuery={setSearchTerm}
          onFilter={() => setShowFilterDialog(true)}
          filters={filters}
          tenants={uniqueTenants}
          properties={propertiesData || []}
          onClearFilter={handleClearFilter}
        />
      </div>

      <div className="flex flex-col">
        {/* Summary Cards - Always visible */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
                <div className="h-9 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded"></div>
                  <div className="h-4 bg-gray-100 rounded"></div>
                  <div className="h-4 bg-gray-100 rounded"></div>
                  <div className="h-4 bg-gray-100 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SummaryCards summary={filteredSummary} />
        )}

        {/* Transaction Table */}
        <div className="flex flex-col">
          {/* Table Header - Desktop */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4">
            <div className="">Tenant</div>
            <div className="border-l border-primary-foreground/20 pl-4">Property</div>
            <div className="border-l border-primary-foreground/20 pl-4">Category</div>
            <div className="border-l border-primary-foreground/20 pl-4 pr-4 text-right">Amount</div>
            <div className="border-l border-primary-foreground/20 pl-4">Date</div>
            <div className="border-l border-primary-foreground/20 pl-4">Status</div>
            <div className="border-l border-primary-foreground/20 pl-4">Action</div>
          </div>

          {/* Table Header - Mobile: Tenant and Amount */}
          <div className="md:hidden grid grid-cols-[1fr_auto] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4">
            <div className="">Tenant</div>
            <div className="text-right pr-2">Amount</div>
          </div>

          {/* Table Body */}
          <div>
            {isLoading ? (
              <PaymentTableSkeleton />
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">Failed to load payments</p>
              </div>
            ) : paginatedPayments.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-300 p-12 text-center">
                <p className="text-gray-500 text-[16px]">No payments found</p>
              </div>
            ) : (
              <TransactionTable
                payments={paginatedPayments}
                onViewProof={handleViewProof}
                isLoading={false}
                hideHeader={true}
              />
            )}
          </div>
        </div>

        {/* Pagination */}
        {!isLoading && !error && totalPayments > 0 && (
          <div className="flex-shrink-0 mt-4">
            <Pagination
              page={page}
              totalPages={totalPages || 1}
              totalItems={totalPayments}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        filters={filters}
        onApplyFilters={applyFilters}
        tenants={uniqueTenants}
        properties={propertiesData || []}
      />

      {/* Receipt Review Modal */}
      <ReceiptReviewModal
        open={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onApprove={handleApproveReceipt}
        onReject={handleRejectReceipt}
      />
    </div>
  );
};

export default Accounting;

