import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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

const CustomLeaseCard = ({
    lease,
    onViewFile,
    onViewDetails,
    onEdit,
    onDelete,
    isSelected = false,
    onSelectionChange,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const tenantName = lease.tenant
        ? `${lease.tenant.firstName || ""} ${lease.tenant.lastName || ""}`.trim()
        : "No tenant assigned";
    
    const listingInfo = lease.listing
        ? lease.listing.title || lease.listing.streetAddress || "N/A"
        : "No listing";

    const listingAddress = lease.listing?.streetAddress
        ? `${lease.listing.streetAddress}${lease.listing.city ? `, ${lease.listing.city}` : ""}${lease.listing.state ? `, ${lease.listing.state}` : ""}`
        : "";

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
        <Card className="border border-gray-300 hover:shadow-md cursor-default transition-shadow mb-0.5 p-0 md:p-3">
            {/* Mobile: Collapsed Row View */}
            <div className="md:hidden">
                <div className="flex items-center p-3 gap-3">
                    {/* Checkbox */}
                    <div className="flex items-center justify-center flex-shrink-0">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                                onSelectionChange?.(lease.id, checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="!border-black"
                        />
                    </div>

                    {/* Title and Description (stacked) */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 
                            className="font-semibold text-sm mb-0.5" 
                            title={lease.leaseName}
                        >
                            {truncateText(lease.leaseName)}
                        </h3>
                        <p 
                            className="text-xs text-gray-600 truncate"
                            title={listingInfo}
                        >
                            {truncateText(listingInfo)}
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
                            {/* Left Column: Lease Info */}
                            <div className="space-y-1">
                                <div className="mb-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Lease</p>
                                    <p className="text-xs text-gray-900">{lease.leaseName}</p>
                                    {lease.createdAt && (
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            Created {formatDistanceToNow(new Date(lease.createdAt), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Listing</p>
                                    <p className="text-xs text-gray-900">{listingInfo}</p>
                                    {listingAddress && (
                                        <p className="text-xs text-gray-600 mt-0.5">{listingAddress}</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Tenant & Status */}
                            <div className="space-y-1">
                                <div className="mb-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Tenant</p>
                                    <p className="text-xs text-gray-900">{tenantName}</p>
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
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop: Original Layout */}
            <div className="hidden md:grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                {/* Checkbox for bulk selection */}
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                            onSelectionChange?.(lease.id, checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="!border-black"
                    />
                </div>

                {/* Column 1: Lease Name */}
                <div className="text-[16px] text-gray-700 truncate">
                    <div className="font-semibold text-primary">{lease.leaseName}</div>
                    {lease.createdAt && (
                        <div className="text-sm font-normal text-gray-600 text-wrap">
                            Created {formatDistanceToNow(new Date(lease.createdAt), { addSuffix: true })}
                        </div>
                    )}
                </div>

                {/* Column 2: Listing Info */}
                <div className="text-[16px] font-semibold text-gray-900 truncate border-l border-gray-300 pl-4">
                    <div className="truncate">{listingInfo}</div>
                    {listingAddress && (
                        <div className="text-sm font-normal text-gray-600 truncate">
                            {listingAddress}
                        </div>
                    )}
                </div>

                {/* Column 3: Tenant */}
                <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
                    <div className="text-center">
                        <div className="text-[16px] font-semibold text-gray-900">{tenantName}</div>
                    </div>
                </div>

                {/* Column 4: Status */}
                <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
                    <Badge className={`${getStatusColor(lease.leaseStatus)} whitespace-nowrap text-xs px-2 py-1 text-gray-900 border-0`}>
                        {getStatusDisplayName(lease.leaseStatus)}
                    </Badge>
                </div>

                {/* Column 5: Actions */}
                <div className="flex gap-6 justify-center mr-auto border-l border-gray-300 pl-4">
                    <div className="flex gap-2 justify-center">
                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails?.(lease);
                            }}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                            title="View Details"
                            variant="ghost"
                            size="icon"
                        >
                            <Eye className="w-5 h-5 text-primary-foreground" />
                        </Button>

                        <Button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(lease);
                            }}
                            className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                            title="Delete"
                            variant="ghost"
                            size="icon"
                        >
                            <Trash2 className="w-5 h-5 text-white" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default CustomLeaseCard;

