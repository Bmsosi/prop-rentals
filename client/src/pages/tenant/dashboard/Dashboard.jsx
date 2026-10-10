import { useState } from "react";
import { useAuthStore } from "../../../store/authStore";
import { Button } from "../../../components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { Badge } from "@/components/ui/badge";
import { Upload, Bell, Check, FileText, Eye, CheckCircle } from "lucide-react";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { getAllInsurances } from "@/services/insuranceService";
import PolicyDocumentViewer from "@/pages/landlord/insurance/components/PolicyDocumentViewer";

const Dashboard = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [viewingInsurance, setViewingInsurance] = useState(null);

  // Get current month and year
  const currentMonth = format(new Date(), 'MMMM');
  const currentYear = format(new Date(), 'yyyy');

  // Fetch tenant's payments
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['tenant-payments-dashboard'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.PAYMENTS.BASE);
      const data = response.data;
      
      // Handle different response structures
      if (Array.isArray(data)) return data;
      if (data.data && Array.isArray(data.data)) return data.data;
      if (data.payments && Array.isArray(data.payments)) return data.payments;
      
      return [];
    },
    enabled: !!user,
  });

  // Fetch tenant's leases to detect terminated status
  const { data: allLeases = [], isLoading: loadingLeases } = useQuery({
    queryKey: ['tenant-all-leases-dashboard'],
    queryFn: async () => {
      // Standard leases
      const standardResponse = await api.get(API_ENDPOINTS.TENANT_LEASES.BASE);
      const standardData = standardResponse.data;
      const standardLeases = Array.isArray(standardData)
        ? standardData
        : (standardData?.data || standardData?.leases || []);

      // Custom leases
      const customResponse = await api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
      const customData = customResponse.data;
      const customLeases = Array.isArray(customData)
        ? customData
        : (customData?.data || customData?.leases || []);

      // Filter custom leases for this tenant (backend should already filter, but double-check)
      const tenantCustomLeases = customLeases.filter(
        (lease) => lease.tenantId === user?.id
      );

      return [...standardLeases, ...tenantCustomLeases];
    },
    enabled: !!user,
  });

  const hasTerminatedLease = allLeases.some(
    (lease) => lease.leaseStatus === 'TERMINATED'
  );

  // Find current month's rent payment
  const currentMonthRent = (() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return payments.find((payment) => {
      if (payment.type !== 'RENT') return false;

      const dueDate = new Date(payment.dueDate);

      const isCurrentMonth =
        dueDate >= startOfMonth &&
        dueDate <= endOfMonth;

      const isPendingOrInTransit =
        payment.status === 'PENDING' || payment.status === 'IN_TRANSIT';

      return isCurrentMonth && isPendingOrInTransit;
    });
  })();

  // Fetch tenant's maintenance requests
  const { data: maintenanceRequests = [], isLoading: loadingMaintenance } = useQuery({
    queryKey: ['tenant-maintenance'],
    queryFn: async () => {
      const response = await api.get(API_ENDPOINTS.MAINTENANCE.BASE);
      const data = response.data;
      
      // Handle different response structures
      if (Array.isArray(data)) return data;
      if (data.data && Array.isArray(data.data)) return data.data;
      if (data.requests && Array.isArray(data.requests)) return data.requests;
      
      return [];
    },
    enabled: !!user,
  });

  // Get most recent maintenance requests (max 3)
  const recentMaintenance = maintenanceRequests
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  // Fetch tenant's insurance records
  const { data: insuranceData = {}, isLoading: loadingInsurance } = useQuery({
    queryKey: ['tenant-insurances-dashboard'],
    queryFn: async () => {
      const data = await getAllInsurances();
      return data;
    },
    enabled: !!user,
  });

  const insurances = insuranceData.insurances || [];
  
  // Get first one or two insurance records, sorted by expiry date (soonest first)
  const displayedInsurances = insurances
    .filter(ins => ins.status === 'VERIFIED' || ins.status === 'PENDING')
    .sort((a, b) => {
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    })
    .slice(0, 2);

  const getInsuranceStatusText = (insurance) => {
    if (insurance.status === 'PENDING') {
      return 'Pending';
    }
    if (insurance.status === 'REJECTED') {
      return 'Rejected';
    }
    if (!insurance.expiryDate) {
      return 'Active';
    }
    const daysUntilExpiry = differenceInDays(new Date(insurance.expiryDate), new Date());
    if (daysUntilExpiry < 0) {
      return 'Expired';
    }
    if (daysUntilExpiry <= 30) {
      return `Expiring in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`;
    }
    return 'Active';
  };

  const getInsuranceStatusColor = (status, expiryDate) => {
    if (status === 'PENDING') {
      return 'text-yellow-600';
    }
    if (status === 'REJECTED') {
      return 'text-red-600';
    }
    if (!expiryDate) {
      return 'text-green-600';
    }
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    if (daysUntilExpiry < 0) {
      return 'text-red-600';
    }
    if (daysUntilExpiry <= 30) {
      return 'text-orange-600';
    }
    return 'text-green-600';
  };

  // Upload receipt mutation
  const uploadReceiptMutation = useMutation({
    mutationFn: async ({ paymentId, file }) => {
      // Get presigned URL
      const uploadUrlResponse = await api.get('/api/v1/upload/payment-receipt-upload-url', {
        params: {
          fileName: file.name,
          fileType: file.type,
        },
      });

      const { uploadURL, fileUrl } = uploadUrlResponse.data.data;

      // Upload to S3
      await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      // Update payment with proof URL
      const response = await api.post(`/api/v1/payments/${paymentId}/upload-receipt`, {
        proofUrl: fileUrl,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-payments-dashboard']);
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries(['payments-summary']);
      toast.success('Payment receipt uploaded successfully!');
      setUploadingReceipt(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload receipt');
      setUploadingReceipt(false);
    },
  });

  const handleFileSelect = (event) => {
    if (!currentMonthRent) {
      toast.error('No current month rent payment found');
      return;
    }

    const file = event.target.files?.[0];
    if (file) {
      setUploadingReceipt(true);
      uploadReceiptMutation.mutate({ paymentId: currentMonthRent.id, file });
    }
  };

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
        return 'bg-gray-200 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800'; // OPEN
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 md:px-8 py-4">
      <div className="flex-1 overflow-y-auto">
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">
          {currentMonth} Rent Summary
        </h1>

        {/* Outstanding Balance Card */}
        <div className="bg-card rounded-2xl p-6 md:p-8 mb-2">
          {loadingPayments || loadingLeases ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-12 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : hasTerminatedLease ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium">No outstanding balance</p>
              <p className="text-sm mt-2">
                Your lease has been terminated, so outstanding balance is no longer shown.
              </p>
            </div>
          ) : currentMonthRent ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg md:text-xl font-semibold mb-2">Outstanding balance</h2>
                <p className="text-4xl md:text-5xl font-bold">
                  ${Number(currentMonthRent.amount).toFixed(2)}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                  <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium">In transit</span>
                </div>
                <input
                  type="file"
                  id="rent-receipt-upload"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleFileSelect}
                  disabled={uploadingReceipt}
                />
                <Button
                  className="bg-black text-white hover:bg-gray-800 px-6 py-2 rounded-2xl"
                  onClick={() => document.getElementById('rent-receipt-upload').click()}
                  disabled={uploadingReceipt || currentMonthRent.proofUrl || !currentMonthRent}
                >
                  <Upload size={16} className="mr-2" />
                  {uploadingReceipt ? 'Uploading...' : 'Upload Payment Proof'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center gap-3">
                <CheckCircle size={48} className="text-green-500 mb-2" />
                <p className="text-lg font-medium">No rent payment due this month</p>
                <p className="text-sm mt-2">Your rent is paid or no payment scheduled</p>
              </div>
            </div>
          )}
        </div>

        {/* Two Column Section - Notice & Maintenance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 mb-2">
          {/* Notice Card */}
          <div className="bg-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-semibold">Notice</h2>
              <Bell size={24} className="text-black fill-black" />
            </div>
            
            <div className="flex flex-col gap-6">
              {loadingMaintenance ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-8 bg-gray-100 rounded w-24"></div>
                    </div>
                  ))}
                </>
              ) : recentMaintenance.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No recent notices</p>
                </div>
              ) : (
                recentMaintenance.map((request) => (
                  <div key={request.id}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm md:text-base flex-1">
                        Your maintenance request for <span className="font-bold">"{request.title}"</span> has been {request.status === 'COMPLETED' ? 'completed' : 'updated'}.
                      </p>
                    <Button variant="outline" size="sm" className="bg-gray-200 text-black hover:bg-gray-300 border-0 flex-shrink-0 rounded-2xl">
                      Maintenance
                    </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Maintenance Card */}
          <div className="bg-card rounded-2xl p-6">
            <h2 className="text-2xl md:text-3xl font-semibold mb-6">Maintenance</h2>
            <div className="flex flex-col gap-6">
              {loadingMaintenance ? (
                <>
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex justify-between mb-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-100 rounded w-20"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-full"></div>
                    </div>
                  ))}
                </>
              ) : recentMaintenance.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No maintenance requests</p>
                </div>
              ) : (
                recentMaintenance.map((request) => (
                  <div key={request.id}>
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-base">{request.listing?.streetAddress || 'Property'}</p>
                      <div className="flex items-center gap-4 text-xs whitespace-nowrap">
                        <span className="text-gray-400">
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true }).replace(' ago', '')}
                        </span>
                        <span className="font-semibold text-black">
                          {request.status === 'OPEN' ? 'New' : request.status === 'IN_PROGRESS' ? 'Ongoing' : 'Done'}
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-sm md:text-base mb-2">
                      {request.title}
                    </p>
                    <p className="text-gray-500 text-xs md:text-sm line-clamp-2">
                      {request.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Insurance Section */}
        <div className="bg-card rounded-2xl p-6">
          <h2 className="text-xl md:text-2xl font-semibold mb-6">Insurance</h2>

          {loadingInsurance ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
              {[1, 2].map((i) => (
                <div key={i} className="space-y-2 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-32"></div>
                </div>
              ))}
            </div>
          ) : displayedInsurances.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No insurance records</p>
              <p className="text-sm mt-2">Upload your insurance documents to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
              {displayedInsurances.map((insurance) => (
                <div key={insurance.id} className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Insurance Status:</span>{' '}
                    <span className={getInsuranceStatusColor(insurance.status, insurance.expiryDate)}>
                      {getInsuranceStatusText(insurance)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Provider:</span>{' '}
                    <span className="inline-block max-w-full truncate md:max-w-none md:inline">
                      {insurance.providerName || 'N/A'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Policy Number:</span> {insurance.policyNumber || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Coverage Type:</span> {insurance.coverageType || 'N/A'}
                  </p>
                  {insurance.expiryDate && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Expiration Date:</span>{' '}
                      {format(new Date(insurance.expiryDate), 'MMM dd, yyyy')}
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    {insurance.documentKey && (
                      <Button
                        variant="outline"
                        onClick={() => setViewingInsurance(insurance)}
                        className="flex-1 sm:flex-none"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Doc
                      </Button>
                    )}
                    <Button 
                      className="flex-1 sm:flex-none bg-black text-white hover:bg-gray-800 rounded-2xl"
                      onClick={() => window.location.href = '/tenant/insurance'}
                    >
                      View Policy
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Document Viewer Modal */}
        {viewingInsurance && (
          <PolicyDocumentViewer
            documentKey={viewingInsurance.documentKey}
            documentUrl={viewingInsurance.documentUrl}
            onClose={() => setViewingInsurance(null)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
