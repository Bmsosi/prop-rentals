import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, MapPin, Calendar, DollarSign, X, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/axios";
import { toast } from "sonner";

const ReceiptReviewModal = ({ open, onClose, payment, onApprove, onReject }) => {
    const [receiptImageUrl, setReceiptImageUrl] = useState(null);
    const [loadingReceipt, setLoadingReceipt] = useState(true);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && payment?.proofUrl) {
            fetchReceiptUrl();
        }
    }, [open, payment]);

    const fetchReceiptUrl = async () => {
        try {
            setLoadingReceipt(true);
            const response = await api.get('/api/v1/upload/payment-receipt-download-url', {
                params: { fileUrl: payment.proofUrl },
            });
            setReceiptImageUrl(response.data.data.downloadURL);
        } catch (error) {
            console.error('Failed to load receipt:', error);
            toast.error('Failed to load receipt');
        } finally {
            setLoadingReceipt(false);
        }
    };

    const handleApprove = async () => {
        setIsSubmitting(true);
        try {
            await onApprove(payment.id);
            toast.success('Receipt approved! Payment marked as paid.');
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve receipt');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        setIsSubmitting(true);
        try {
            await onReject(payment.id, rejectionReason);
            toast.success('Receipt rejected. Tenant will be notified.');
            setRejectionReason("");
            setShowRejectForm(false);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject receipt');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!payment) return null;

    const listing = payment.lease?.listing || payment.customLease?.listing;
    const tenant = payment.tenant;

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden rounded-xl">
                {/* Header */}
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg">Review Payment Receipt</DialogTitle>
                                <p className="text-sm text-gray-500 mt-1">
                                    Payment ID: {payment.id.slice(-8)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 rounded-2xl"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                    {/* Left: Payment Info */}
                    <div className="space-y-4">
                        {/* Payment Details Card */}
                        <div className="bg-card p-4 rounded-lg space-y-3">
                            <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
                            
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Amount</p>
                                    <p className="text-xl font-bold text-gray-900">
                                        ${Number(payment.amount).toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                <div>
                                    <p className="text-sm text-gray-500">Due Date</p>
                                    <p className="text-sm font-medium text-gray-900">
                                        {payment.dueDate ? format(new Date(payment.dueDate), "MMM d, yyyy") : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 mb-1">Type</p>
                                <Badge className="bg-gray-900 text-white capitalize">
                                    {payment.type.toLowerCase()}
                                </Badge>
                            </div>
                        </div>

                        {/* Tenant Info */}
                        {tenant && (
                            <div className="bg-card p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-3">Tenant Information</h3>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="text-gray-500">Name:</span>{' '}
                                        <span className="font-medium text-gray-900">
                                            {tenant.firstName} {tenant.lastName}
                                        </span>
                                    </p>
                                    <p className="text-sm">
                                        <span className="text-gray-500">Email:</span>{' '}
                                        <span className="font-medium text-gray-900">{tenant.email}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Property Info */}
                        {listing && (
                            <div className="bg-card p-4 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {listing.streetAddress}
                                            {listing.city && `, ${listing.city}`}
                                            {listing.state && `, ${listing.state}`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {payment.notes && (
                            <div className="bg-card p-4 rounded-lg">
                                <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                                <p className="text-sm text-gray-700">{payment.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Receipt Image */}
                    <div className="space-y-4">
                        <div className="bg-card p-4 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3">Payment Receipt</h3>
                            
                            {loadingReceipt ? (
                                <div className="aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center animate-pulse">
                                    <p className="text-gray-400">Loading receipt...</p>
                                </div>
                            ) : receiptImageUrl ? (
                                <div className="border border-gray-300 rounded-lg overflow-hidden">
                                    <img
                                        src={receiptImageUrl}
                                        alt="Payment Receipt"
                                        className="w-full h-auto"
                                    />
                                </div>
                            ) : (
                                <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                                    <p className="text-gray-400">No receipt available</p>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(receiptImageUrl, '_blank')}
                                disabled={!receiptImageUrl}
                                className="w-full mt-3 rounded-2xl"
                            >
                                Open in New Tab
                            </Button>
                        </div>

                        {/* Rejection Form */}
                        {showRejectForm && (
                            <div className="bg-card p-4 rounded-lg border border-red-200">
                                <Label htmlFor="rejection-reason" className="text-sm font-medium text-gray-900 mb-2 block">
                                    Rejection Reason
                                </Label>
                                <Textarea
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Explain why this receipt is rejected..."
                                    className="min-h-[100px] mb-3"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setShowRejectForm(false);
                                            setRejectionReason("");
                                        }}
                                        className="flex-1 rounded-2xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleReject}
                                        disabled={isSubmitting}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-2xl"
                                    >
                                        {isSubmitting ? "Rejecting..." : "Confirm Reject"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                {!showRejectForm && (
                    <div className="flex justify-between gap-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="px-6 rounded-2xl bg-primary-foreground"
                        >
                            Close
                        </Button>
                        
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowRejectForm(true)}
                                disabled={isSubmitting}
                                className="px-6 text-red-600 border-red-600 hover:bg-red-50 rounded-2xl"
                            >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={isSubmitting}
                                className="px-6 bg-gray-900 hover:bg-gray-800 text-white rounded-2xl"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                {isSubmitting ? "Approving..." : "Approve"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ReceiptReviewModal;

