import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  FileText, 
  MapPin, 
  User,
  Clock,
  CheckCircle
} from "lucide-react";
import { format, differenceInCalendarDays, isPast } from "date-fns";
import { toast } from "sonner";
import PropertyImage from "@/components/shared/PropertyImage";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";

const RentalInfoSkeleton = () => (
  <div className="space-y-8">
    {/* Current rental skeleton */}
    <div>
      <Skeleton className="h-6 w-44 mb-4" />
      <Card className="border border-gray-300 p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 flex-shrink-0">
            {/* Show only 1 image to match actual content */}
            <Skeleton className="w-full h-32 rounded-xl" />
          </div>
          <div className="flex-1 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-44 rounded-2xl" />
          </div>
        </div>
      </Card>
    </div>

    {/* Rental history skeleton */}
    <div>
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx} className="border border-gray-300 p-5">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-40 flex-shrink-0">
                {/* Show only 1 image to match actual content */}
                <Skeleton className="w-full h-32 rounded-lg" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-48" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((__, infoIdx) => (
                    <div key={infoIdx} className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const RentalInfo = () => {
  const { user } = useAuthStore();

  // Fetch tenant's leases (both standard and custom)
  const { data: allLeases = [], isLoading } = useQuery({
    queryKey: ['tenant-all-leases'],
    queryFn: async () => {
      console.log('Starting lease fetch for user:', user?.id, 'role:', user?.role);
      
      // Fetch standard leases
      console.log('Calling API:', API_ENDPOINTS.TENANT_LEASES.BASE);
      const standardResponse = await api.get(API_ENDPOINTS.TENANT_LEASES.BASE);
      console.log('Standard Response:', standardResponse);
      const standardData = standardResponse.data;
      const standardLeases = Array.isArray(standardData) ? standardData : 
                            standardData.data || standardData.leases || [];
      
      console.log('Standard Leases Fetched:', standardLeases.length, standardLeases);
      
      // Fetch custom leases
      console.log('Calling API:', API_ENDPOINTS.CUSTOM_LEASES.BASE);
      const customResponse = await api.get(API_ENDPOINTS.CUSTOM_LEASES.BASE);
      console.log('Custom Response:', customResponse);
      const customData = customResponse.data;
      const customLeases = Array.isArray(customData) ? customData :
                          customData.data || customData.leases || [];
      
      console.log('Custom Leases Fetched:', customLeases.length, customLeases);
      
      // Filter custom leases for tenant (backend should already filter, but double-check)
      const tenantCustomLeases = customLeases.filter(lease => 
        lease.tenantId === user?.id
      );
      
      console.log('Tenant Custom Leases After Filter:', tenantCustomLeases.length);
      
      // Combine and add type identifier
      const all = [
        ...standardLeases.map(l => ({ ...l, leaseType: 'STANDARD' })),
        ...tenantCustomLeases.map(l => ({ ...l, leaseType: 'CUSTOM' })),
      ];
      
      console.log('Combined Leases:', all.length, all);
      
      return all;
    },
    enabled: !!user,
  });

  const leases = allLeases;

  // Debug: Log all fetched leases
  console.log('All Leases Fetched:', leases.length, leases);

  // Separate current and past leases
  // Current lease: ACTIVE or DRAFT status, prioritize ACTIVE
  // For ACTIVE: must not have passed end date
  // For DRAFT: show as current if no ACTIVE lease exists
  const activeLeases = leases.filter(lease => {
    const isActive = lease.leaseStatus === 'ACTIVE';
    const hasValidEndDate = !lease.endDate || !isPast(new Date(lease.endDate));
    console.log(`Lease ${lease.id}: status=${lease.leaseStatus}, endDate=${lease.endDate}, isPast=${lease.endDate ? isPast(new Date(lease.endDate)) : 'N/A'}`);
    return isActive && hasValidEndDate;
  });

  const draftLeases = leases.filter(lease => lease.leaseStatus === 'DRAFT');
  
  // Prioritize ACTIVE lease, fallback to most recent DRAFT
  const currentLease = activeLeases.length > 0 
    ? activeLeases[0] 
    : (draftLeases.length > 0 ? draftLeases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] : null);

  // Debug: Log current lease to help troubleshoot
  console.log('Current Lease Found:', currentLease ? {
    id: currentLease.id,
    leaseType: currentLease.leaseType,
    contractPdfUrl: currentLease.contractPdfUrl,
    fileUrl: currentLease.fileUrl,
    status: currentLease.leaseStatus,
    startDate: currentLease.startDate,
    endDate: currentLease.endDate,
    listingImages: currentLease.listing?.images
  } : 'None');

  const pastLeases = leases.filter(lease => {
    // Exclude current lease
    if (currentLease && lease.id === currentLease.id) return false;
    
    // Include terminated, expired, or past active leases
    return lease.leaseStatus === 'TERMINATED' || 
           lease.leaseStatus === 'EXPIRED' ||
           (lease.leaseStatus === 'ACTIVE' && lease.endDate && isPast(new Date(lease.endDate)));
  }).sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-gray-200 text-gray-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDaysRemaining = (endDate, startDate) => {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = new Date(endDate);

    if (start && now < start) {
      const daysUntilStart = differenceInCalendarDays(start, now);
      return Math.max(daysUntilStart, 0);
    }

    const days = differenceInCalendarDays(end, now);
    return Math.max(days, 0);
  };

  const handleViewContract = async (lease) => {
    try {
      const fileUrl = lease.contractPdfUrl || lease.fileUrl;
      
      if (!fileUrl) {
        toast.error('No contract file available');
        return;
      }

      // Check if it's an S3 URL (starts with https:// and contains amazonaws or s3)
      const isS3Url = fileUrl.startsWith('https://') && (fileUrl.includes('amazonaws') || fileUrl.includes('s3'));
      
      if (isS3Url) {
        try {
          // Extract the S3 key from the URL
          const url = new URL(fileUrl);
          const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
          
          if (!key) {
            toast.error('Invalid file URL');
            return;
          }
          
          // Fetch signed URL from backend using the key
          const response = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, {
            params: { key }
          });
          
          const signedUrl = response.data?.data?.downloadURL || response.data?.downloadURL;
          
          if (signedUrl) {
            window.open(signedUrl, '_blank');
          } else {
            toast.error('Failed to get download URL');
          }
        } catch (urlError) {
          console.error('Failed to process S3 URL:', urlError);
          // Fallback: try opening the URL directly
          window.open(fileUrl, '_blank');
        }
      } else {
        // For relative paths or other URLs, open directly
        window.open(fileUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to view contract:', error);
      toast.error('Failed to load contract file');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden px-4 md:px-8 py-4">
        <div className="hidden md:block">
          <PageHeader
            title="Rental Information"
            subtitle="View your current and past rental details"
            total={leases.length}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          <RentalInfoSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden px-4 md:px-8 py-4">
      <div className="flex-1 overflow-y-auto">
        <div className="hidden md:block">
          <PageHeader
            title="Rental Information"
            subtitle="View your current and past rental details"
            total={leases.length}
          />
        </div>

        {/* Current Rental Section */}
        {currentLease ? (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">Current Rental</h2>
            
            <Card className="border border-gray-300 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Property Image - First Image Only */}
                {currentLease.listing?.images && currentLease.listing.images.length > 0 && (
                  <div className="w-full md:w-48 flex-shrink-0">
                    <div className="w-full h-32 rounded-lg overflow-hidden">
                      <PropertyImage
                        image={currentLease.listing.images[0]}
                        alt={`${currentLease.listing?.title || 'Property'} - Image 1`}
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                )}

                {/* Right: Lease Details */}
                <div className="flex-1 space-y-6">
                {/* Property Title and Status */}
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                    <h3 className="font-semibold text-xl text-gray-900">
                      {currentLease.listing?.title || 'Property'}
                    </h3>
                    <Badge className={`${getStatusColor(currentLease.leaseStatus)} px-3 py-1 text-sm`}>
                      {currentLease.leaseStatus}
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p>
                      {currentLease.listing?.streetAddress}
                      {currentLease.listing?.city && `, ${currentLease.listing.city}`}
                      {currentLease.listing?.state && `, ${currentLease.listing.state}`}
                      {currentLease.listing?.country && `, ${currentLease.listing.country}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      {calculateDaysRemaining(currentLease.endDate, currentLease.startDate)} days remaining
                    </span>
                  </div>
                </div>

                {/* Lease Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 pt-4 border-t border-gray-200 text-sm">
                  <div>
                    <p className="text-gray-500">Monthly Rent</p>
                    <p className="font-semibold text-gray-900 text-base">
                      ${Number(currentLease.rentAmount).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(currentLease.startDate), "MMM d, yyyy")}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">End Date</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(currentLease.endDate), "MMM d, yyyy")}
                    </p>
                  </div>

                  {currentLease.securityDeposit && (
                    <div>
                      <p className="text-gray-500">Security Deposit</p>
                      <p className="font-semibold text-gray-900">
                        ${Number(currentLease.securityDeposit).toFixed(2)}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-500">Payment</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {currentLease.paymentFrequency?.toLowerCase() || 'Monthly'}
                    </p>
                  </div>
                </div>

                {/* Landlord Info */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">Landlord Contact</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-gray-900">
                      {currentLease.landlord ? 
                        `${currentLease.landlord.firstName} ${currentLease.landlord.lastName}` : 
                        currentLease.landlordFullName || 'N/A'
                      }
                    </p>
                    {(currentLease.landlord?.email || currentLease.landlordEmail) && (
                      <p className="text-gray-600">
                        {currentLease.landlord?.email || currentLease.landlordEmail}
                      </p>
                    )}
                    {(currentLease.landlord?.phone || currentLease.landlordPhone) && (
                      <p className="text-gray-600">
                        {currentLease.landlord?.phone || currentLease.landlordPhone}
                      </p>
                    )}
                  </div>
                </div>

                {/* View Contract Button */}
                <div className="pt-4 border-t border-gray-200">
                  <Button 
                    className="bg-gray-900 hover:bg-gray-800 text-white rounded-2xl"
                    onClick={() => handleViewContract(currentLease)}
                    disabled={!currentLease.contractPdfUrl && !currentLease.fileUrl}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Lease Contract
                  </Button>
                  {!currentLease.contractPdfUrl && !currentLease.fileUrl && (
                    <p className="text-xs text-gray-500 mt-2">
                      Contract document not available yet
                    </p>
                  )}
                </div>
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">Current Rental</h2>
            <Card className="border border-gray-300 p-12 text-center">
              <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No active rental</p>
              <p className="text-gray-400 text-sm mt-2">You don't have an active lease at the moment</p>
            </Card>
          </div>
        )}

        {/* Past Rentals Section - Always show */}
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-4">Rental History</h2>
          
          {pastLeases.length > 0 ? (
            <div className="space-y-4">
              {pastLeases.map((lease) => (
                <Card key={lease.id} className="border border-gray-300 p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Single Property Image */}
                    {lease.listing?.images && lease.listing.images.length > 0 && (
                      <div className="w-full md:w-48 flex-shrink-0">
                        <div className="w-full h-32 rounded-lg overflow-hidden">
                          <PropertyImage
                            image={lease.listing.images[0]}
                            alt={`${lease.listing?.title || 'Property'} - Image 1`}
                            className="w-full h-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* Right: Lease Details */}
                    <div className="flex-1 space-y-4">
                      {/* Title and Status */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {lease.listing?.title || 'Property'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>
                              {lease.listing?.streetAddress}
                              {lease.listing?.city && `, ${lease.listing.city}`}
                            </span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(lease.leaseStatus)} px-3 py-1`}>
                          {lease.leaseStatus}
                        </Badge>
                      </div>

                      {/* Lease Info Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Rent</p>
                          <p className="font-semibold text-gray-900">
                            ${Number(lease.rentAmount).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Start Date</p>
                          <p className="font-semibold text-gray-900">
                            {format(new Date(lease.startDate), "MMM d, yyyy")}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">End Date</p>
                          <p className="font-semibold text-gray-900">
                            {format(new Date(lease.endDate), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      {/* View Contract Button */}
                      {(lease.contractPdfUrl || lease.fileUrl) && (
                        <Button 
                          variant="outline"
                          size="sm"
                          className="rounded-2xl"
                          onClick={() => handleViewContract(lease)}
                        >
                          <FileText className="h-3 w-3 mr-2" />
                          View Contract
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border border-gray-300 p-12 text-center">
              <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No past rentals</p>
              <p className="text-gray-400 text-sm mt-2">Your rental history will appear here</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default RentalInfo;

