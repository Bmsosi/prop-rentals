import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Home, DollarSign, Calendar, AlertTriangle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow, isPast, format } from "date-fns";
import { toast } from "sonner";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import PropertyImage from "@/components/shared/PropertyImage";

const getStatusColor = (status) => {
    switch (status) {
        case "ACTIVE":
            return "bg-green-100 text-green-700 border border-green-300";
        case "DRAFT":
            return "bg-gray-200 text-gray-700 border border-gray-300";
        case "EXPIRED":
            return "bg-red-100 text-red-700 border border-red-300";
        case "TERMINATED":
            return "bg-orange-100 text-orange-700 border border-orange-300";
        default:
            return "bg-gray-100 text-gray-700 border border-gray-300";
    }
};

const StandardLeaseCard = ({
    lease,
    onViewDetails,
    onDelete,
    isSelected = false,
    onSelectionChange,
    onRefresh,
}) => {
    const [overduePayments, setOverduePayments] = useState(0);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    // Fetch payment status for this lease
    useEffect(() => {
        const fetchPaymentStatus = async () => {
            if (!lease.id || lease.leaseStatus !== "ACTIVE") return;
            
            setLoadingPayments(true);
            try {
                const response = await api.get(`${API_ENDPOINTS.PAYMENTS.BASE}?leaseId=${lease.id}`);
                let payments = response.data?.data || response.data || [];
                
                // Ensure payments is an array
                if (!Array.isArray(payments)) {
                    payments = [];
                }
                
                // Count overdue payments
                const now = new Date();
                const overdue = payments.filter(p => 
                    p.status === "PENDING" && 
                    p.dueDate && 
                    new Date(p.dueDate) < now
                ).length;
                
                setOverduePayments(overdue);
            } catch (error) {
                console.error("Failed to fetch payment status:", error);
                setOverduePayments(0);
            } finally {
                setLoadingPayments(false);
            }
        };

        fetchPaymentStatus();
    }, [lease.id, lease.leaseStatus]);

    const tenantName = lease.tenant
        ? `${lease.tenant.firstName || ""} ${lease.tenant.lastName || ""}`.trim()
        : lease.tenantFullName || "No tenant assigned";
    
    const landlordName = lease.landlord
        ? `${lease.landlord.firstName || ""} ${lease.landlord.lastName || ""}`.trim()
        : lease.landlordFullName || "N/A";

    const propertyInfo = lease.listing
        ? lease.listing.title || lease.listing.streetAddress || "N/A"
        : lease.propertyAddress || "N/A";

    const propertyAddress = lease.listing?.streetAddress
        ? `${lease.listing.streetAddress}${lease.listing.city ? `, ${lease.listing.city}` : ""}${lease.listing.state ? `, ${lease.listing.state}` : ""}`
        : lease.propertyAddress || "";

    const getStatusDisplayName = (status) => {
        switch (status) {
            case "ACTIVE":
                return "Active";
            case "DRAFT":
                return "Draft";
            case "EXPIRED":
                return "Expired";
            case "TERMINATED":
                return "Terminated";
            default:
                return status || "N/A";
        }
    };

    const formatDate = (date) => {
        if (!date) return "N/A";
        return new Date(date).toLocaleDateString();
    };

    // Calculate lease expiration
    const endDate = lease.endDate ? new Date(lease.endDate) : null;
    const isExpired = endDate && isPast(endDate);
    const expirationText = endDate ? formatDistanceToNow(endDate, { addSuffix: true }) : null;
    
    // Check for status mismatch (ACTIVE but expired)
    const hasStatusMismatch = lease.leaseStatus === "ACTIVE" && isExpired;

    // Handle marking lease as expired
    const handleMarkAsExpired = async (e) => {
        e.stopPropagation();
        try {
            await api.put(API_ENDPOINTS.LEASES.BY_ID(lease.id), {
                leaseStatus: "EXPIRED"
            });
            toast.success("Lease marked as expired");
            if (onRefresh) onRefresh();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update lease status");
        }
    };

    // Truncate text for mobile
    const truncateText = (text, maxLength = 35) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const handleDropdownClick = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <div className="flex items-center gap-3 mb-1">
            {/* Checkbox - outside card */}
            {onSelectionChange && (
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                        onSelectionChange(lease.id, Boolean(checked));
                    }}
                    className="!border-black"
                    onClick={(e) => e.stopPropagation()}
                />
            )}

            <Card className={`flex-1 p-0 border ${hasStatusMismatch || overduePayments > 0 ? 'border-orange-400 bg-orange-50/30' : 'border-gray-300'} hover:shadow-md transition-shadow overflow-hidden`}>
                {/* Mobile: Collapsed Row View */}
                <div className="md:hidden">
                    {/* Warning Banners - Mobile */}
                    {overduePayments > 0 && (
                        <div className="bg-red-100 border-b border-red-300 px-3 py-1.5">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-3 h-3 text-red-600" />
                                <span className="text-xs text-red-800 font-medium">
                                    {overduePayments} overdue payment{overduePayments > 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>
                    )}
                    
                    {hasStatusMismatch && !overduePayments && (
                        <div className="bg-orange-100 border-b border-orange-300 px-3 py-1.5">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-orange-600" />
                                <span className="text-xs text-orange-800 font-medium">
                                    Lease expired but marked ACTIVE
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center p-3 gap-3">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 bg-gray-100 flex-shrink-0 rounded-lg overflow-hidden">
                            <PropertyImage 
                                image={lease.listing?.images?.find(img => img.isPrimary) || lease.listing?.images?.[0]}
                                alt={propertyInfo}
                            />
                        </div>

                        {/* Title and Description (stacked) */}
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <h3 
                                className="font-semibold text-sm mb-0.5" 
                                title={propertyInfo}
                            >
                                {truncateText(propertyInfo)}
                            </h3>
                            <p 
                                className="text-xs text-gray-600 truncate"
                                title={tenantName}
                            >
                                {truncateText(tenantName)}
                            </p>
                        </div>

                        {/* Dropdown Icon */}
                        <button
                            onClick={handleDropdownClick}
                            className="flex-shrink-0 p-1"
                            aria-label="Toggle details"
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-600" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                            )}
                        </button>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                        <div className="px-6 pb-3 border-gray-200 border-t-0 space-y-3 pt-3">
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Left Column: Property & Financial Info */}
                                <div className="space-y-1">
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Property</p>
                                        <p className="text-xs text-gray-900">{propertyInfo}</p>
                                        {propertyAddress && (
                                            <p className="text-xs text-gray-600 mt-0.5">{propertyAddress}</p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Financial</p>
                                        <div className="flex items-center gap-2 mb-1">
                                            <DollarSign className="w-3 h-3" />
                                            <p className="text-xs text-gray-900">
                                                Rent: ${lease.rentAmount?.toLocaleString() || "N/A"}
                                            </p>
                                        </div>
                                        {overduePayments > 0 && (
                                            <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4 mt-0.5">
                                                {overduePayments} overdue
                                            </Badge>
                                        )}
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            Frequency: {lease.paymentFrequency?.toLowerCase() || "N/A"}
                                        </p>
                                        {lease.securityDeposit && (
                                            <p className="text-xs text-gray-600">
                                                Deposit: ${lease.securityDeposit?.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Tenant, Dates & Status */}
                                <div className="space-y-1">
                                    <div className="mb-2">
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Tenant</p>
                                        <p className="text-xs text-gray-900">{tenantName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Lease Dates</p>
                                        <div className="flex items-center gap-1 mb-0.5">
                                            <Calendar className="w-3 h-3" />
                                            <p className="text-xs text-gray-900">
                                                Start: {formatDate(lease.startDate)}
                                            </p>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            End: {formatDate(lease.endDate)}
                                        </p>
                                        {expirationText && (
                                            <p className="text-xs text-gray-600 mt-0.5">
                                                {isExpired ? 'Expired' : 'Expires'} {expirationText}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-700 mb-1">Status</p>
                                        <Badge className={`${getStatusColor(lease.leaseStatus)} whitespace-nowrap text-[10px] px-2 py-0.5 text-gray-900 border-0`}>
                                            {getStatusDisplayName(lease.leaseStatus)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewDetails?.(lease);
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Eye className="w-3 h-3 mr-1" /> View
                                </Button>
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete?.(lease);
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                                >
                                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                                </Button>
                                {hasStatusMismatch && !overduePayments && (
                                    <Button
                                        onClick={handleMarkAsExpired}
                                        className="text-xs px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white"
                                    >
                                        Mark as Expired
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop: Original Layout */}
                <div className="hidden md:block">
                {/* Warning Banner for Overdue Payments */}
                {overduePayments > 0 && (
                    <div className="bg-red-100 border-b border-red-300 px-4 py-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm text-red-800 font-medium">
                                {overduePayments} overdue payment{overduePayments > 1 ? 's' : ''}
                            </span>
                        </div>
                    </div>
                )}
                
                {/* Warning Banner for Status Mismatch */}
                {hasStatusMismatch && !overduePayments && (
                    <div className="bg-orange-100 border-b border-orange-300 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm text-orange-800 font-medium">
                                This lease has expired but is still marked as ACTIVE
                            </span>
                        </div>
                        <Button
                            onClick={handleMarkAsExpired}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7 px-3"
                        >
                            Mark as Expired
                        </Button>
                    </div>
                )}
                <div className="flex flex-col md:flex-row">
                    {/* Property Image */}
                    <div className="w-full md:w-48 h-28 flex-shrink-0 overflow-hidden">
                        <PropertyImage 
                            image={lease.listing?.images?.find(img => img.isPrimary) || lease.listing?.images?.[0]}
                            alt={propertyInfo}
                        />
                    </div>

                {/* Lease Details */}
                <div className="flex-1 flex flex-col md:flex-row items-center p-4 gap-6">
                    {/* Property Info - larger width */}
                    <div className="w-full md:w-64 flex-shrink-0 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate text-primary">{propertyInfo}</h3>
                        {propertyAddress && (
                            <p className="text-xs text-gray-600 truncate">{propertyAddress}</p>
                        )}
                        <p className="text-xs text-gray-600 mt-1 truncate">
                            <span className="font-semibold">Tenant:</span> {tenantName}
                        </p>
                    </div>

                    {/* Financial Info - larger width */}
                    <div className="flex items-center gap-2 w-full md:w-48 flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${overduePayments > 0 ? 'border-red-500 bg-red-50' : 'border-black'}`}>
                            <DollarSign className={`w-4 h-4 ${overduePayments > 0 ? 'text-red-600' : ''}`} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm whitespace-nowrap">
                                    <span className="font-bold">Rent:</span> ${lease.rentAmount?.toLocaleString() || "N/A"}
                                </p>
                                {overduePayments > 0 && (
                                    <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 h-4">
                                        {overduePayments} overdue
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm whitespace-nowrap">
                                <span className="font-bold">Frequency:</span> {lease.paymentFrequency?.toLowerCase() || "N/A"}
                            </p>
                            {lease.securityDeposit && (
                                <p className="text-sm whitespace-nowrap">
                                    <span className="font-bold">Deposit:</span> ${lease.securityDeposit?.toLocaleString()}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Lease Dates - larger width */}
                    <div className="flex items-center gap-2 w-full md:w-48 flex-shrink-0">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-gray-600 font-semibold">Lease Dates</p>
                            <p className="text-sm whitespace-nowrap">
                                <span className="font-bold">Start:</span> {formatDate(lease.startDate)}
                            </p>
                            <p className="text-sm whitespace-nowrap">
                                <span className="font-bold">End:</span> {formatDate(lease.endDate)}
                            </p>
                        </div>
                    </div>

                    {/* Lease Expiration Status - larger width */}
                    <div className="flex items-center w-full md:w-44 flex-shrink-0">
                        <div className="space-y-1">
                            {isExpired ? (
                                <>
                                    <p className="text-sm font-semibold text-red-600">Lease expired</p>
                                    <p className="text-xs text-gray-600">{expirationText}</p>
                                    <p className="text-xs text-gray-500">
                                        Created {lease.createdAt ? `${format(new Date(lease.createdAt), "MMM d, yyyy")} at ${format(new Date(lease.createdAt), "h:mm a")}` : "N/A"}
                                    </p>
                                </>
                            ) : expirationText ? (
                                <>
                                    <p className="text-sm font-semibold text-gray-900">Lease expires</p>
                                    <p className="text-xs text-gray-600">{expirationText}</p>
                                    <p className="text-xs text-gray-500">
                                        Created {lease.createdAt ? `${format(new Date(lease.createdAt), "MMM d, yyyy")} at ${format(new Date(lease.createdAt), "h:mm a")}` : "N/A"}
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600">No end date</p>
                                    <p className="text-xs text-gray-500">
                                        Created {lease.createdAt ? `${format(new Date(lease.createdAt), "MMM d, yyyy")} at ${format(new Date(lease.createdAt), "h:mm a")}` : "N/A"}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Lease Status - compact */}
                    <div className="flex items-center justify-center w-full md:w-20 flex-shrink-0">
                        <Badge className={`${getStatusColor(lease.leaseStatus)} whitespace-nowrap text-xs px-2 py-1 text-gray-900 border-0`}>
                            {getStatusDisplayName(lease.leaseStatus)}
                        </Badge>
                    </div>

                    {/* Actions - compact */}
                    <div className="flex gap-1.5 w-full md:w-auto flex-shrink-0 items-center justify-center">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails?.(lease);
                            }}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            title="View Details"
                            variant="ghost"
                            size="icon"
                        >
                            <Eye className="w-4 h-4 text-primary-foreground" />
                        </Button>

                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(lease);
                            }}
                            className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                            title="Delete"
                            variant="ghost"
                            size="icon"
                        >
                            <Trash2 className="w-4 h-4 text-white" />
                        </Button>
                    </div>
                </div>
                </div>
                </div>
            </Card>
        </div>
    );
};

export default StandardLeaseCard;
