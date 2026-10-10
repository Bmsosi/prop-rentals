import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, DollarSign, FileText, User, Home, Clock, XCircle } from "lucide-react";
import { differenceInCalendarDays } from "date-fns";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import api from "@/lib/axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import TerminateLeaseDialog from "./TerminateLeaseDialog";
import { useAuthStore } from "@/store/authStore";

// Component to handle property thumbnail with S3 signed URL
const PropertyThumbnail = ({ image, alt }) => {
    const [resolvedSrc, setResolvedSrc] = useState();
    const [loading, setLoading] = useState(true);
    const [errored, setErrored] = useState(false);

    const rawSrc = image?.url || image;

    useEffect(() => {
        let cancelled = false;
        async function resolve() {
            if (!rawSrc) {
                setResolvedSrc(undefined);
                setLoading(false);
                return;
            }
            try {
                const u = new URL(rawSrc);
                const isS3Unsigned = u.hostname.includes('s3.') && !rawSrc.includes('X-Amz-Signature');
                if (!isS3Unsigned) {
                    if (!cancelled) {
                        setResolvedSrc(encodeURI(rawSrc));
                        setLoading(false);
                    }
                    return;
                }
                const key = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                if (!key) {
                    if (!cancelled) {
                        setResolvedSrc(encodeURI(rawSrc));
                        setLoading(false);
                    }
                    return;
                }
                const resp = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { params: { key } });
                const signed = resp.data?.data?.downloadURL || resp.data?.downloadURL;
                if (!cancelled) {
                    setResolvedSrc(signed || encodeURI(rawSrc));
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setResolvedSrc(encodeURI(rawSrc));
                    setLoading(false);
                }
            }
        }
        setLoading(true);
        setErrored(false);
        resolve();
        return () => { cancelled = true; };
    }, [rawSrc]);

    if (!rawSrc || errored) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center">
                <Home className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-xs font-medium">No Image</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full rounded-lg overflow-hidden">
            {loading && (
                <div className="absolute inset-0 animate-pulse bg-gray-200 rounded-lg" />
            )}
            <img
                src={resolvedSrc}
                alt={alt}
                className="w-full h-full object-cover rounded-lg"
                onLoad={() => setLoading(false)}
                onError={() => { setErrored(true); setLoading(false); }}
            />
        </div>
    );
};

const LeaseDetailPage = () => {
    const { id, type } = useParams(); // type can be 'standard' or 'custom'
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    const [signedPdfUrl, setSignedPdfUrl] = useState(null);
    const [signedLeaseDocUrl, setSignedLeaseDocUrl] = useState(null);
    const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
    const [isTerminating, setIsTerminating] = useState(false);

    // Fetch lease data based on type
    const { data: lease, isLoading, error } = useQuery({
        queryKey: ["lease-detail", id, type],
        queryFn: async () => {
            const endpoint = type === "custom" 
                ? API_ENDPOINTS.CUSTOM_LEASES.BY_ID(id)
                : API_ENDPOINTS.LEASES.BY_ID(id);
            
            const res = await api.get(endpoint);
            return res.data?.data || res.data || null;
        },
    });

    // Get signed URL for contract PDF (standard lease)
    useEffect(() => {
        const getSignedUrl = async () => {
            if (!lease?.contractPdfUrl) {
                setSignedPdfUrl(null);
                return;
            }

            try {
                // Extract S3 key from URL
                const url = new URL(lease.contractPdfUrl);
                const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                
                // Get signed download URL
                const res = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { 
                    params: { key } 
                });
                const signedUrl = res.data?.data?.downloadURL || res.data?.downloadURL;
                setSignedPdfUrl(signedUrl);
            } catch (err) {
                console.error('Failed to get signed URL:', err);
                setSignedPdfUrl(null);
            }
        };

        getSignedUrl();
    }, [lease?.contractPdfUrl]);

    // Get signed URL for custom lease document
    useEffect(() => {
        const getSignedLeaseDocUrl = async () => {
            if (!lease?.fileUrl || type !== "custom") {
                setSignedLeaseDocUrl(null);
                return;
            }

            try {
                // Check if it's a valid URL
                let url;
                try {
                    url = new URL(lease.fileUrl);
                } catch (urlError) {
                    // Not a valid URL (might be a relative path), use directly
                    setSignedLeaseDocUrl(lease.fileUrl);
                    return;
                }
                
                // Check if it's an S3 URL
                const isS3 = url.hostname.includes('s3.') || url.hostname.includes('amazonaws.com');
                
                if (isS3) {
                    // Extract S3 key from URL
                    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                    
                    // Get signed download URL
                    const res = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { 
                        params: { key } 
                    });
                    const signedUrl = res.data?.data?.downloadURL || res.data?.downloadURL;
                    setSignedLeaseDocUrl(signedUrl);
                } else {
                    // Not an S3 URL, use directly
                    setSignedLeaseDocUrl(lease.fileUrl);
                }
            } catch (err) {
                console.error('Failed to get signed URL for custom lease:', err);
                // Fallback to original URL
                setSignedLeaseDocUrl(lease.fileUrl);
            }
        };

        getSignedLeaseDocUrl();
    }, [lease?.fileUrl, type]);

    // Mutation to regenerate PDF
    const regeneratePdfMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(API_ENDPOINTS.LEASES.REGENERATE_PDF(id));
            return res.data;
        },
        onSuccess: (data) => {
            toast.success("Contract PDF generated successfully!");
            // Refetch lease data to get the new PDF URL
            queryClient.invalidateQueries(["lease-detail", id, type]);
        },
        onError: (error) => {
            console.error("Failed to generate PDF:", error);
            toast.error(error.response?.data?.message || "Failed to generate contract PDF");
        },
    });

    // Handle lease termination
    const handleTerminate = async ({ reason, notes }) => {
        setIsTerminating(true);
        try {
            const endpoint = type === "custom" 
                ? API_ENDPOINTS.CUSTOM_LEASES.BY_ID(id)
                : API_ENDPOINTS.LEASES.BY_ID(id);
            
            await api.put(endpoint, {
                leaseStatus: "TERMINATED",
                terminationDate: new Date().toISOString(),
                terminationReason: reason,
                terminationNotes: notes,
                terminatedBy: user?.id,
            });
            
            toast.success("Lease terminated successfully");
            setTerminateDialogOpen(false);
            // Refetch lease data
            queryClient.invalidateQueries(["lease-detail", id, type]);
            // Also invalidate lease lists
            queryClient.invalidateQueries(["leases"]);
            queryClient.invalidateQueries(["customleases"]);
        } catch (error) {
            console.error("Termination error:", error);
            toast.error(error.response?.data?.message || "Failed to terminate lease");
        } finally {
            setIsTerminating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-full overflow-y-auto bg-background">
                <div className="px-4 md:px-8 py-4 space-y-4">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                    <Skeleton className="h-10 w-full rounded-2xl" />
                    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
                        <div className="space-y-4">
                            <Skeleton className="h-64 w-full rounded-3xl" />
                            <Skeleton className="h-40 w-full rounded-3xl" />
                            <Skeleton className="h-56 w-full rounded-3xl" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-36 w-full rounded-3xl" />
                            <Skeleton className="h-32 w-full rounded-3xl" />
                            <Skeleton className="h-40 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !lease) {
        return (
            <div className="h-full overflow-y-auto bg-background">
                <div className="px-4 md:px-8 py-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/landlord/leases")}
                        className="mb-4"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="md:hidden">Back</span>
                        <span className="hidden md:inline">Back to Leases</span>
                    </Button>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <p className="text-red-600">Failed to load lease details</p>
                    </div>
                </div>
            </div>
        );
    }

    // Format date helper
    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount) return "$0";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount);
    };

    // Status badge color
    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case "ACTIVE":
                return "bg-green-100 text-green-700 border-green-300";
            case "EXPIRED":
                return "bg-red-100 text-red-700 border-red-300";
            case "TERMINATED":
                return "bg-gray-100 text-gray-700 border-gray-300";
            case "DRAFT":
                return "bg-yellow-100 text-yellow-700 border-yellow-300";
            default:
                return "bg-blue-100 text-blue-700 border-blue-300";
        }
    };

    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="px-4 md:px-8 py-4">
                {/* Header with Back Button */}
                <div className="mb-4">
                    <div className="flex flex-col gap-3 mb-4">
                        <h1 className="text-xl md:text-2xl font-bold text-primary">
                            {type === "custom" ? lease.leaseName : "Standard Lease"}
                        </h1>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {type === "custom" ? "Custom Lease Agreement" : "Standard Lease Agreement"}
                        </p>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <Badge className={`${getStatusColor(lease.leaseStatus)} px-3 py-1.5 text-sm font-medium border`}>
                                {lease.leaseStatus}
                            </Badge>
                            {lease.leaseStatus === "ACTIVE" && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setTerminateDialogOpen(true)}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-2xl"
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Terminate Lease
                                </Button>
                            )}
                        </div>
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm"
                            onClick={() => navigate("/landlord/leases")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            <span className="md:hidden">Back</span>
                            <span className="hidden md:inline">Back to Leases</span>
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid - Lease Terms Left, Tenant/Property Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-stretch">
                    {/* Left Column - Lease Terms */}
                    <div className="flex flex-col">
                        {/* Lease Terms - Stretch to match right column height */}
                        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5 h-full flex flex-col">
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="w-5 h-5 text-gray-700" />
                                <h2 className="text-lg font-semibold text-primary">Lease Terms</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-shrink-0">
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Start Date</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(lease.startDate)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">End Date</p>
                                    <p className="text-sm font-medium text-gray-900">{formatDate(lease.endDate)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Rent Amount</p>
                                    <p className="text-lg font-bold text-gray-900">{formatCurrency(lease.rentAmount)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 mb-0.5">Payment Frequency</p>
                                    <p className="text-sm font-medium text-gray-900 capitalize">
                                        {lease.paymentFrequency?.toLowerCase().replace(/_/g, ' ') || "N/A"}
                                    </p>
                                </div>
                                {lease.securityDeposit !== undefined && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Security Deposit</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatCurrency(lease.securityDeposit)}
                                        </p>
                                    </div>
                                )}
                                {lease.depositAmount !== undefined && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Deposit Amount</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatCurrency(lease.depositAmount)}
                                        </p>
                                    </div>
                                )}
                                {type === "custom" && lease.paymentDay && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Payment Day</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            Day {lease.paymentDay} of each month
                                        </p>
                                    </div>
                                )}
                                {type === "custom" && lease.paymentMethod && (
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Payment Method</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {lease.paymentMethod.replace(/_/g, " ")}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Lease Duration & Contract Section */}
                            <div className="mt-4 pt-4 border-t space-y-6">
                                {/* Lease Expiration Progress - Compact */}
                                <div>
                                    {(() => {
                                        const now = new Date();
                                        const startDate = new Date(lease.startDate);
                                        const endDate = new Date(lease.endDate);
                                        const totalDays = Math.max(0, differenceInCalendarDays(endDate, startDate));
                                        
                                        // Check if lease has started
                                        const hasStarted = now >= startDate;
                                        
                                        if (!hasStarted) {
                                            // Lease hasn't started yet
                                            const daysUntilStart = Math.max(0, differenceInCalendarDays(startDate, now));
                                            return (
                                                <div className="max-w-sm">
                                                    <div className="flex items-baseline gap-2 mb-2">
                                                        <p className="text-sm font-semibold text-primary">Lease Starts In</p>
                                                        <p className="text-xl font-bold text-blue-600">
                                                            {daysUntilStart === 0 ? "Today" : `${daysUntilStart} Days`}
                                                        </p>
                                                    </div>
                                                    
                                                    {/* Placeholder Progress Bar - Empty/Not Started */}
                                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
                                                        <div 
                                                            className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                                                            style={{ width: '0%' }}
                                                        />
                                                    </div>
                                                    
                                                    {/* Duration Stats */}
                                                    <div className="flex justify-between gap-4 text-xs text-gray-500 mt-1.5">
                                                        <span>{daysUntilStart === 0 ? "Starts today" : "Not started"}</span>
                                                        <span>{totalDays} days total</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        
                                        // Lease has started - show normal progress
                                        const remainingDays = Math.max(0, differenceInCalendarDays(endDate, now));
                                        const elapsedDays = Math.max(0, totalDays - remainingDays);
                                        const progressPercentage = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
                                        
                                        return (
                                            <div className="max-w-sm">
                                                    <div className="flex items-baseline gap-2 mb-2">
                                                        <p className="text-sm font-semibold text-primary">Lease Expire In</p>
                                                        <p className="text-xl font-bold text-gray-900">{remainingDays} Days</p>
                                                </div>
                                                
                                                {/* Progress Bar */}
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden border border-gray-300">
                                                    <div 
                                                        className="bg-gray-700 h-full transition-all duration-300 rounded-full"
                                                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                
                                                {/* Duration Stats */}
                                                <div className="flex justify-between gap-4 text-xs text-gray-500 mt-1.5">
                                                    <span>{elapsedDays} days elapsed</span>
                                                    <span>{totalDays} days total</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Created Date & Contract PDF / Lease Document */}
                                <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                                    {lease.createdAt && (
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-500 mb-0.5">Lease Created</p>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(lease.createdAt)}</p>
                                        </div>
                                    )}

                                    {/* View Contract Link for Standard Lease */}
                                    {type === "standard" && (
                                        <div className="flex-1">
                                            {lease.contractPdfUrl ? (
                                                <div className="flex flex-col gap-2">
                                                    {signedPdfUrl ? (
                                                        <a 
                                                            href={signedPdfUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm inline-flex items-center gap-1"
                                                        >
                                                            <FileText className="w-4 h-4" />
                                                            View Contract PDF
                                                        </a>
                                                    ) : (
                                                        <span className="text-xs text-gray-500">Loading PDF...</span>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => regeneratePdfMutation.mutate()}
                                                        disabled={regeneratePdfMutation.isPending}
                                                        className="w-fit bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
                                                    >
                                                        {regeneratePdfMutation.isPending ? "Regenerating..." : "Regenerate PDF"}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => regeneratePdfMutation.mutate()}
                                                    disabled={regeneratePdfMutation.isPending}
                                                    className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
                                                >
                                                    {regeneratePdfMutation.isPending ? "Generating..." : "Generate Contract PDF"}
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* View Lease Document for Custom Lease */}
                                    {type === "custom" && lease.fileUrl && (
                                        <div className="flex-1">
                                            {signedLeaseDocUrl ? (
                                                <a 
                                                    href={signedLeaseDocUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-sm inline-flex items-center gap-1"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    View Lease Document
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-500">Loading document...</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column - Property & Tenant Info Stacked */}
                    <div className="flex flex-col gap-4">
                        {/* Property Information */}
                        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Home className="w-5 h-5 text-gray-700" />
                                <h2 className="text-lg font-semibold text-primary">Property Information</h2>
                            </div>
                            <div className="space-y-3">
                                {/* Property Thumbnail and Info - Compact */}
                                <div className="flex gap-3">
                                    {/* Thumbnail */}
                                    {lease.listing?.images && lease.listing.images.length > 0 && (
                                        <div className="w-32 h-24 flex-shrink-0">
                                            <PropertyThumbnail 
                                                image={lease.listing.images.find(img => img.isPrimary) || lease.listing.images[0]}
                                                alt="Property thumbnail"
                                            />
                                        </div>
                                    )}
                                    {/* Property Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-primary mb-1">
                                            {lease.listing?.title || lease.propertyAddress || "N/A"}
                                        </p>
                                        {lease.listing && (
                                            <>
                                                <div className="flex items-start gap-1.5 mb-2">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-gray-600">
                                                        {lease.listing.streetAddress}, {lease.listing.city}, {lease.listing.state} {lease.listing.zipCode}
                                                    </p>
                                                </div>
                                                <div className="flex gap-4 text-sm text-gray-600">
                                                    <span>{lease.listing.bedrooms || 0} beds</span>
                                                    <span>•</span>
                                                    <span>{lease.listing.bathrooms || 0} baths</span>
                                                    <span>•</span>
                                                    <span>{lease.listing.totalSquareFeet ? `${lease.listing.totalSquareFeet.toLocaleString()} sqft` : "N/A"}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tenant Information - Compact */}
                        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-5 h-5 text-gray-700" />
                                <h2 className="text-lg font-semibold text-primary">Tenant</h2>
                            </div>
                            {lease.tenant ? (
                                <div className="space-y-2.5">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-0.5">Name</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {lease.tenant.firstName} {lease.tenant.lastName}
                                        </p>
                                    </div>
                                    {lease.tenant.email && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Email</p>
                                            <p className="text-sm text-gray-900 break-all">{lease.tenant.email}</p>
                                        </div>
                                    )}
                                    {lease.tenant.phone && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                                            <p className="text-sm text-gray-900">{lease.tenant.phone}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center flex-1 py-8 bg-gray-50 rounded-lg">
                                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                                        <User className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">No tenant assigned</p>
                                    <p className="text-xs text-gray-400 mt-1">Tenant will be assigned when lease is signed</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Terminate Lease Dialog */}
            <TerminateLeaseDialog
                open={terminateDialogOpen}
                onClose={() => setTerminateDialogOpen(false)}
                lease={lease}
                onConfirm={handleTerminate}
                isLoading={isTerminating}
            />
        </div>
    );
};

export default LeaseDetailPage;

