import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Eye, Send, Trash2, X, Copy, ChevronDown, ChevronUp, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

const getStatusColor = (status) => {
    switch (status) {
        case "APPROVED":
            return "bg-green-100 text-green-700 border border-green-300";
        case "REJECTED":
            return "bg-red-100 text-red-700 border border-red-300";
        case "CANCELLED":
            return "bg-gray-200 text-gray-700 border border-gray-300";
        default:
            return "bg-orange-100 text-blue-700 border border-blue-300";
    }
};

const ApplicationCard = ({ 
    app, 
    onApprove, 
    onReject, 
    onSendLease, 
    onDelete, 
    onView,
    isSelected = false,
    onSelectionChange,
}) => {
    const navigate = useNavigate();
    const [isSending, setIsSending] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // "APPROVE" | "REJECT" | "DELETE"
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const isPlaceholderApp = app.fullName === "N/A" && app.email === "na@example.com" && !app.tenantId;
    const canDeleteApplication = app.status === "REJECTED" || (app.status === "NEW" && isPlaceholderApp);

    // Reset dropdown state when pending action changes or component updates
    useEffect(() => {
        if (!pendingAction) {
            setIsDropdownOpen(false);
        }
    }, [pendingAction]);

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

    const handleSendLeaseClick = async (e) => {
        e.stopPropagation();
        setIsSending(true);
        try {
            await onSendLease?.(app); // Call parent handler
        } finally {
            setIsSending(false);
        }
    };

    const handleViewClick = (e) => {
        e.stopPropagation();
        onView?.(app);
    };

    return (
        <Card className="border border-gray-300 hover:shadow-md cursor-default transition-shadow mb-1 p-0 md:p-3">
            {/* Mobile: Collapsed Row View */}
            <div className="md:hidden">
                <div className="flex items-center p-3 gap-3">
                    {/* Checkbox */}
                    <div className="flex items-center justify-center flex-shrink-0">
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                                onSelectionChange?.(app.id, checked);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="!border-black"
                        />
                    </div>

                    {/* Title and Description (stacked) */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 
                            className="font-semibold text-sm mb-0.5" 
                            title={app.fullName}
                        >
                            {truncateText(app.fullName)}
                        </h3>
                        <p 
                            className="text-xs text-gray-600 truncate"
                            title={app.listing.title}
                        >
                            {truncateText(app.listing.title)}
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
                            {/* Left Column: Application Info */}
                            <div className="space-y-1">
                                <div className="mb-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Applicant</p>
                                    <p className="text-xs text-gray-900">{app.fullName}</p>
                                    {app.createdAt && (
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            Submitted {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Created</p>
                                    {app.createdAt ? (
                                        <>
                                            <p className="text-xs text-gray-900">{format(new Date(app.createdAt), "MMM d, yyyy")}</p>
                                            <p className="text-xs text-gray-600">{format(new Date(app.createdAt), "h:mm a")}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-400">—</p>
                                    )}
                                </div>
                            </div>

                            {/* Right Column: Listing Info */}
                            <div className="space-y-1">
                                <div className="mb-2">
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Listing</p>
                                    <p className="text-xs text-gray-900">{app.listing.title}</p>
                                    {app.listing.streetAddress && (
                                        <p className="text-xs text-gray-600 mt-0.5">{app.listing.streetAddress}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-1">Status</p>
                                    <Badge className={`${getStatusColor(app.status)} whitespace-nowrap text-[10px] px-2 py-0.5 text-gray-900 border-0`}>
                                        {app.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                            {/* View button - hide for NEW status on mobile (will show in View+Approve+Reject row) */}
                            {["PENDING", "APPROVED"].includes(app.status) && (
                                <>
                                    <Button
                                        onClick={handleViewClick}
                                        className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        <Eye className="w-3 h-3 mr-1" /> View
                                    </Button>
                                    {app.publicId && app.status === "PENDING" && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-xs px-3 py-1.5 rounded-xl border-gray-300"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(`${window.location.origin}/apply/${app.publicId}`);
                                                toast.success("Application link copied");
                                            }}
                                        >
                                            <Copy className="w-3 h-3 mr-1" />
                                            Copy Link
                                        </Button>
                                    )}
                                </>
                            )}

                            {/* View button for NEW status - desktop only */}
                            {app.status === "NEW" && (
                                <Button
                                    onClick={handleViewClick}
                                    className="hidden md:flex text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Eye className="w-3 h-3 mr-1" /> View
                                </Button>
                            )}

                            {app.status === "APPROVED" && (
                                <Button
                                    onClick={handleSendLeaseClick}
                                    className="text-xs px-3 py-1.5 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 border border-border"
                                    disabled={isSending}
                                >
                                    <Send className="w-3 h-3 mr-1" />
                                    {isSending ? "Sending..." : "Send Lease"}
                                </Button>
                            )}

                            {canDeleteApplication && (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPendingAction({ type: "DELETE", id: app.id });
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                                    disabled={isConfirming}
                                >
                                    <Trash2 className="w-3 h-3 mr-1" /> {isPlaceholderApp ? "Remove Link" : "Delete"}
                                </Button>
                            )}

                            {/* Approve/Reject buttons - for NEW status and other non-final statuses */}
                            {(app.status === "NEW" || (app.status !== "APPROVED" && app.status !== "REJECTED" && app.status !== "PENDING")) && (
                                <>
                                    {/* Mobile: View + Approve + Reject on one line */}
                                    <div className="flex gap-2 md:hidden w-full">
                                        <Button
                                            onClick={handleViewClick}
                                            className="text-xs px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                        >
                                            <Eye className="w-3 h-3 mr-1" /> View
                                        </Button>
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingAction({ type: "APPROVE", id: app.id });
                                            }}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            style={{ backgroundColor: '#008733' }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#006b28'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#008733'}
                                            disabled={isConfirming}
                                        >
                                            <Check className="w-3.5 h-3.5" />
                                            Approve
                                        </Button>

                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingAction({ type: "REJECT", id: app.id });
                                            }}
                                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                            disabled={isConfirming}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                            Reject
                                        </Button>
                                    </div>

                                    {/* Desktop: Dropdown menu */}
                                    <div className="hidden md:block relative">
                                        <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                    className="flex items-center gap-2 w-32 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    disabled={isConfirming}
                                                >
                                                    <MoreVertical />
                                                    Actions
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent 
                                                className="w-48 p-2 z-[9999]" 
                                                align="end"
                                                side="bottom"
                                                sideOffset={8}
                                                onOpenAutoFocus={(e) => e.preventDefault()}
                                                onEscapeKeyDown={() => setIsDropdownOpen(false)}
                                                onInteractOutside={(e) => {
                                                    // Allow closing on outside click
                                                }}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsDropdownOpen(false);
                                                            setTimeout(() => {
                                                                setPendingAction({ type: "APPROVE", id: app.id });
                                                            }, 0);
                                                        }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-md hover:bg-green-50 active:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        style={{ color: '#008733' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.color = '#006b28'}
                                                        onMouseLeave={(e) => e.currentTarget.style.color = '#008733'}
                                                        disabled={isConfirming}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setIsDropdownOpen(false);
                                                            setTimeout(() => {
                                                                setPendingAction({ type: "REJECT", id: app.id });
                                                            }, 0);
                                                        }}
                                                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-md hover:bg-red-50 active:bg-red-100 text-red-700 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                        disabled={isConfirming}
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Reject
                                                    </button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop: Original Layout */}
            <div className="hidden md:grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-4 items-center">
                {/* Checkbox for bulk selection */}
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                            onSelectionChange?.(app.id, checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="!border-black"
                    />
                </div>
                
                {/* Column 1: Applicant Info */}
                <div className="text-sm sm:text-base text-gray-700 truncate">
                    {app.fullName}
                    {app.createdAt && (
                        <div className="text-xs sm:text-sm font-normal text-gray-600 text-wrap">
                            Submitted {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                        </div>
                    )}
                </div>

                {/* Column 2: Listing Info */}
                <div className="text-sm sm:text-base font-semibold text-gray-900 truncate border-l border-gray-300 pl-4">
                    {app.listing.title}
                    {app.listing.streetAddress && (
                        <div className="text-xs sm:text-sm font-normal text-wrap text-gray-600">
                            {app.listing.streetAddress}
                        </div>
                    )}
                </div>

                {/* Column 3: Created */}
                <div className="text-sm sm:text-base text-gray-700 border-l border-gray-300 pl-4">
                    {app.createdAt ? (
                        <>
                            <div>{format(new Date(app.createdAt), "MMM d, yyyy")}</div>
                            <div className="text-xs text-gray-500">
                                {format(new Date(app.createdAt), "h:mm a")}
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-400">—</span>
                    )}
                </div>

                {/* Column 4: Status */}
                <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
                    <Badge className={`${getStatusColor(app.status)} whitespace-nowrap text-[11px] px-2.5 py-0.5 text-gray-900 border-0`}>
                        {app.status}
                    </Badge>
                </div>

                {/* Column 5: Actions */}
                <div className="flex gap-6 justify-center mr-auto border-l border-gray-300 pl-4 min-w-[280px]">
                    <div className="flex gap-3 justify-center">
                        {["PENDING", "NEW", "APPROVED"].includes(app.status) && (
                            <>
                                <Button
                                    onClick={handleViewClick}
                                    className="flex items-center gap-2 sm:w-28 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Eye /> View
                                </Button>
                                {app.publicId && app.status === "PENDING" && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex items-center gap-2 sm:w-32 rounded-xl border-gray-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(`${window.location.origin}/apply/${app.publicId}`);
                                            toast.success("Application link copied");
                                        }}
                                    >
                                        <Copy className="w-4 h-4" />
                                        Copy Link
                                    </Button>
                                )}
                            </>
                        )}

                        {app.status === "APPROVED" && (
                            <Button
                                onClick={handleSendLeaseClick}
                                className="flex items-center gap-2 sm:w-32 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 border border-border"
                                disabled={isSending}
                            >
                                <Send />
                                {isSending ? "Sending..." : "Send Lease"}
                            </Button>
                        )}

                        {canDeleteApplication && (
                            <Button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setPendingAction({ type: "DELETE", id: app.id });
                                }}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-500 sm:w-32 rounded-xl disabled:opacity-70"
                                disabled={isConfirming}
                            >
                                <Trash2 /> {isPlaceholderApp ? "Remove Link" : "Delete"}
                            </Button>
                        )}

                        {app.status !== "APPROVED" && app.status !== "REJECTED" && app.status !== "PENDING" && (
                            <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-2 sm:w-32 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={isConfirming}
                                    >
                                        <MoreVertical />
                                        Actions
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent 
                                    className="w-48 p-2" 
                                    align="end"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDropdownOpen(false);
                                                setPendingAction({ type: "APPROVE", id: app.id });
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-md hover:bg-green-50 text-green-700 hover:text-green-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isConfirming}
                                        >
                                            <Check className="w-4 h-4" />
                                            Approve
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsDropdownOpen(false);
                                                setPendingAction({ type: "REJECT", id: app.id });
                                            }}
                                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left rounded-md hover:bg-red-50 text-red-700 hover:text-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={isConfirming}
                                        >
                                            <X className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>
                </div>
            </div>

            <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && !isConfirming && setPendingAction(null)}>
                <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:w-full sm:max-w-lg rounded-2xl sm:rounded-lg">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-base sm:text-lg">
                            {pendingAction?.type === "APPROVE"
                                ? "Approve Application"
                                : pendingAction?.type === "DELETE"
                                ? isPlaceholderApp ? "Remove Application Link" : "Delete Application"
                                : "Reject Application"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            {pendingAction?.type === "DELETE"
                                ? isPlaceholderApp
                                    ? "This will remove the generated application link so you can create a new one."
                                    : `Are you sure you want to delete ${app.fullName}'s application? This action cannot be undone.`
                                : `Are you sure you want to ${
                                      pendingAction?.type === "APPROVE" ? "approve" : "reject"
                                  } ${app.fullName}'s application for ${app.listing.title}?`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isConfirming} className="rounded-2xl text-xs sm:text-sm">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            disabled={isConfirming}
                            className={`rounded-2xl text-xs sm:text-sm ${
                                pendingAction?.type === "APPROVE" 
                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                                    : pendingAction?.type === "REJECT"
                                    ? "bg-red-600 hover:bg-red-700 text-white"
                                    : "bg-red-600 hover:bg-red-700 text-white"
                            }`}
                            onClick={() => {
                                if (!pendingAction) return;
                                setIsConfirming(true);
                                const action =
                                    pendingAction.type === "APPROVE"
                                        ? onApprove
                                        : pendingAction.type === "REJECT"
                                        ? onReject
                                        : onDelete;
                                Promise.resolve(action?.(pendingAction.id))
                                    .finally(() => {
                                        setIsConfirming(false);
                                        setPendingAction(null);
                                    });
                            }}
                        >
                            {isConfirming ? "Processing..." : "Confirm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
};

export default ApplicationCard;
