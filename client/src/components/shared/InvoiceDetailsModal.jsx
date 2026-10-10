import { FileText, X, MapPin, Wrench } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const InvoiceDetailsModal = ({ open, onClose, payment }) => {
    if (!payment || !payment.invoice) return null;

    const invoice = payment.invoice;
    const maintenanceRequest = invoice.maintenanceRequest;
    const listing = maintenanceRequest?.listing;

    // Debug: Log invoice data structure
    console.log('📋 Invoice Details Modal opened');
    console.log('  Full invoice object:', invoice);
    console.log('  invoice.createdAt:', invoice.createdAt);
    console.log('  Type of createdAt:', typeof invoice.createdAt);
    console.log('  new Date(createdAt):', new Date(invoice.createdAt));
    console.log('  new Date(createdAt).toString():', new Date(invoice.createdAt).toString());
    console.log('  Is valid date?:', invoice.createdAt && new Date(invoice.createdAt).toString() !== 'Invalid Date');

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg [&>button]:hidden">
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
                            <p className="text-sm text-gray-500">
                                Maintenance Invoice #{invoice.id.slice(-8)}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-6 py-4">
                    {/* Status and Amount */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <Badge
                                className={`mt-1 ${
                                    invoice.status === "PAID"
                                        ? "bg-green-100 text-green-800"
                                        : invoice.status === "CANCELLED"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                                {invoice.status}
                            </Badge>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="text-2xl font-bold text-gray-900">
                                ${Number(invoice.amount).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Property Information */}
                    {listing && (
                        <div className="bg-card p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="font-medium text-gray-900">{listing.title}</p>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {listing.streetAddress}
                                        {listing.city && `, ${listing.city}`}
                                        {listing.state && `, ${listing.state}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Maintenance Request Info */}
                    {maintenanceRequest && (
                        <div className="bg-card p-4 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Wrench className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">
                                        {maintenanceRequest.title || "Maintenance Request"}
                                    </p>
                                    {maintenanceRequest.description && (
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {maintenanceRequest.description}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-2">
                                        Request ID: {maintenanceRequest.id.slice(-8)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Invoice Description */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                        <div className="bg-card border border-gray-200 rounded-lg p-4">
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {invoice.description}
                            </p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <p className="text-sm text-gray-500">Invoice Created</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">
                                {invoice.createdAt && new Date(invoice.createdAt).toString() !== 'Invalid Date' 
                                    ? format(new Date(invoice.createdAt), "MMM d, yyyy")
                                    : 'N/A'
                                }
                            </p>
                        </div>
                        {payment.paidDate && new Date(payment.paidDate).toString() !== 'Invalid Date' && (
                            <div>
                                <p className="text-sm text-gray-500">Paid Date</p>
                                <p className="text-sm font-medium text-gray-900 mt-1">
                                    {format(new Date(payment.paidDate), "MMM d, yyyy")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={onClose} variant="outline" className="px-6 rounded-2xl">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InvoiceDetailsModal;

