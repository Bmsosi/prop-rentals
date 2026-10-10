import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Eye, FileText, ChevronDown, ChevronUp, Calendar, Tag, DollarSign, FileText as FileTextIcon } from 'lucide-react';
import InvoiceDetailsModal from '@/components/shared/InvoiceDetailsModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const TenantPaymentSkeleton = () => (
  <div className="space-y-1">
    {Array.from({ length: 5 }).map((_, index) => (
      <Card
        key={index}
        className="border border-gray-300 rounded-2xl p-0 md:p-3 shadow-sm"
      >
        {/* Mobile Skeleton */}
        <div className="md:hidden p-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        </div>
        {/* Desktop Skeleton */}
        <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 items-center">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="border-l border-gray-200 pl-4 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="border-l border-gray-200 pl-4 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="border-l border-gray-200 pl-4 pr-4">
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
          <div className="border-l border-gray-200 pl-4">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="border-l border-gray-200 pl-4 flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const getStatusBadgeClass = (status, dueDate, hasReceipt) => {
  const baseClasses = 'px-3 py-1 rounded-full text-[14px] font-medium';
  
  if (status === 'PAID') {
    return `${baseClasses} bg-gray-200 text-gray-800`;
  }
  
  if (status === 'PENDING') {
    // If receipt uploaded, show as "Under Review"
    if (hasReceipt) {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    }
    
    // Otherwise check if overdue
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) {
      return `${baseClasses} bg-red-100 text-red-800`; // Overdue
    }
    return `${baseClasses} bg-yellow-100 text-yellow-800`; // Outstanding
  }
  
  return `${baseClasses} bg-gray-200 text-gray-800`;
};

const getStatusText = (status, dueDate, hasReceipt) => {
  if (status === 'PAID') return 'Paid';
  if (status === 'PENDING') {
    // If receipt uploaded, show "Under Review"
    if (hasReceipt) return 'Under Review';
    
    // Otherwise check if overdue
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) return 'Overdue';
    return 'Outstanding';
  }
  return status;
};

const TenantPaymentRow = ({
    payment,
    listing,
    hasReceipt,
    status,
    isPaid,
    displayDate,
    dateLabel,
    noteText,
    categoryText,
    truncateText,
    handleViewInvoice,
    handleViewReceipt,
    handleFileSelect,
    uploadingId,
    getStatusBadgeClass,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleDropdownClick = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    return (
        <Card className="border border-gray-300 hover:shadow-md transition-shadow mb-1 p-0 md:p-3">
            {/* Mobile: Collapsed Row View */}
            <div className="md:hidden">
                <div className="flex items-center p-3 gap-3">
                    {/* Title and Description (stacked) */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                            <h3 
                                className="font-semibold text-sm" 
                                title={noteText}
                            >
                                {truncateText(noteText)}
                            </h3>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-sm font-semibold text-gray-900">
                                    ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                            <p 
                                className="text-xs text-gray-600 truncate"
                                title={categoryText}
                            >
                                {truncateText(categoryText)}
                            </p>
                            {displayDate && (
                                <span className={`text-xs flex-shrink-0 font-medium ${
                                    isPaid 
                                        ? 'text-green-600' 
                                        : payment.status === 'PENDING' && new Date(displayDate) < new Date()
                                        ? 'text-red-600'
                                        : 'text-yellow-600'
                                }`}>
                                    {dateLabel}: {format(new Date(displayDate), 'MMM d')}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Dropdown Icon */}
                    <button
                        onClick={handleDropdownClick}
                        className="flex-shrink-0 p-1 self-center flex items-center justify-center"
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
                    <div className="px-4 pb-4 border-gray-200 border-t space-y-4 pt-4 bg-gray-50/50">
                        {/* Status - Above Note */}
                        <div className="mb-4 flex items-center gap-1.5">
                            <span className="text-[10px] text-gray-600 font-medium">Status:</span>
                            <span style={{fontSize: '10px'}} className={`${getStatusBadgeClass(payment.status, payment.dueDate, hasReceipt)}`}>
                                {status}
                            </span>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left Column: Note & Category */}
                            <div className="space-y-3">
                                {/* Note Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileTextIcon className="w-4 h-4 text-gray-600" />
                                        <p className="text-xs font-semibold text-gray-700">Note</p>
                                    </div>
                                    {payment.notes ? (
                                        <p className="text-xs text-gray-900 font-medium">{payment.notes}</p>
                                    ) : listing ? (
                                        <>
                                            <p className="text-xs text-gray-900 font-medium">{listing.title}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {listing.streetAddress}, {listing.city}
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-500">No note</p>
                                    )}
                                </div>

                                {/* Category Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-4 h-4 text-gray-600" />
                                        <p className="text-xs font-semibold text-gray-700">Category</p>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs text-gray-900 font-medium capitalize">{categoryText}</p>
                                        {payment.invoice && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewInvoice(payment);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 transition-colors p-0.5"
                                                title="View Invoice Details"
                                            >
                                                <FileText className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Amount, Date, Status */}
                            <div className="space-y-3">
                                {/* Amount Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="w-4 h-4 text-gray-600" />
                                        <p className="text-xs font-semibold text-gray-700">Amount</p>
                                    </div>
                                    <p className="text-sm text-gray-900 font-bold">
                                        ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>

                                {/* Date Section */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-600" />
                                        <p className="text-xs font-semibold text-gray-700">Date</p>
                                    </div>
                                    {displayDate ? (
                                        <>
                                            <p className="text-xs text-gray-900 font-medium">
                                                {format(new Date(displayDate), 'MMM d, yyyy')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">{dateLabel}</p>
                                        </>
                                    ) : (
                                        <p className="text-xs text-gray-500">N/A</p>
                                    )}
                                </div>

                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-300">
                            {hasReceipt ? (
                                <Button
                                    size="sm"
                                    variant={isPaid ? "outline" : "default"}
                                    onClick={() => handleViewReceipt(payment.proofUrl)}
                                    className={`text-xs px-3 py-1.5 rounded-xl ${!isPaid ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                                >
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Receipt
                                </Button>
                            ) : (
                                <>
                                    <input
                                        type="file"
                                        id={`receipt-${payment.id}`}
                                        className="hidden"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => handleFileSelect(payment.id, e)}
                                        disabled={uploadingId === payment.id}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => document.getElementById(`receipt-${payment.id}`).click()}
                                        disabled={uploadingId === payment.id}
                                        className="text-xs px-3 py-1.5 bg-black text-white hover:bg-gray-800 rounded-xl"
                                    >
                                        {uploadingId === payment.id ? (
                                            'Uploading...'
                                        ) : (
                                            <>
                                                <Upload className="w-3 h-3 mr-1" />
                                                Upload Receipt
                                            </>
                                        )}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop: Original Grid Layout */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr] gap-4 items-center">
                {/* Date */}
                <div>
                    <div className="text-[16px] font-semibold text-gray-900">
                        {displayDate ? format(new Date(displayDate), 'MMM dd, yyyy') : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">{dateLabel}</div>
                </div>

                {/* Note */}
                <div className="text-[16px] text-gray-900 border-l border-gray-300 pl-4 min-w-0">
                    {payment.notes ? (
                        <div className="truncate" title={payment.notes}>{payment.notes}</div>
                    ) : listing ? (
                        <div className="min-w-0">
                            <div className="truncate font-semibold" title={listing.title}>{listing.title}</div>
                            <div className="text-sm font-normal text-gray-600 truncate" title={`${listing.streetAddress}, ${listing.city}`}>
                                {listing.streetAddress}, {listing.city}
                            </div>
                        </div>
                    ) : (
                        <span className="text-gray-500 text-sm">No note</span>
                    )}
                </div>

                {/* Category */}
                <div className="border-l border-gray-300 pl-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[16px] font-semibold text-gray-900 capitalize">
                            {payment.type.toLowerCase()}
                        </span>
                        {payment.invoice && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewInvoice(payment);
                                }}
                                className="p-1.5 rounded-2xl text-gray-600 hover:text-white hover:bg-gray-900 transition-all cursor-pointer"
                                title="View Invoice Details"
                            >
                                <FileText className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div className="text-[16px] font-semibold text-gray-900 border-l border-gray-300 pl-4 pr-4 text-right">
                    ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                {/* Status */}
                <div className="flex items-center border-l border-gray-300 pl-4">
                    <span className={getStatusBadgeClass(payment.status, payment.dueDate, hasReceipt)}>
                        {status}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                    {hasReceipt ? (
                        <Button
                            size="sm"
                            variant={isPaid ? "outline" : "default"}
                            onClick={() => handleViewReceipt(payment.proofUrl)}
                            className={`text-xs rounded-2xl ${!isPaid ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}`}
                        >
                            <Eye className="w-3 h-3 mr-1" />
                            View Receipt
                        </Button>
                    ) : (
                        <>
                            <input
                                type="file"
                                id={`receipt-${payment.id}`}
                                className="hidden"
                                accept="image/*,application/pdf"
                                onChange={(e) => handleFileSelect(payment.id, e)}
                                disabled={uploadingId === payment.id}
                            />
                            <Button
                                size="sm"
                                onClick={() => document.getElementById(`receipt-${payment.id}`).click()}
                                disabled={uploadingId === payment.id}
                                className="text-xs bg-black text-white hover:bg-gray-800 rounded-2xl"
                            >
                                {uploadingId === payment.id ? (
                                    'Uploading...'
                                ) : (
                                    <>
                                        <Upload className="w-3 h-3 mr-1" />
                                        Upload Receipt
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </Card>
    );
};

const TenantPaymentTable = ({ payments, isLoading }) => {
    const [uploadingId, setUploadingId] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const queryClient = useQueryClient();

    const handleViewInvoice = (payment) => {
        console.log('🧾 View Invoice clicked for payment:', payment.id);
        console.log('   Invoice data:', payment.invoice);
        console.log('   Maintenance Request:', payment.invoice?.maintenanceRequest);
        setSelectedPayment(payment);
        setInvoiceModalOpen(true);
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
            queryClient.invalidateQueries(['tenant-payments']);
            toast.success('Payment receipt uploaded successfully!');
            setUploadingId(null);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to upload receipt');
            setUploadingId(null);
        },
    });

    const handleFileSelect = (paymentId, event) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadingId(paymentId);
            uploadReceiptMutation.mutate({ paymentId, file });
        }
    };

    const handleViewReceipt = async (proofUrl) => {
        try {
            const response = await api.get('/api/v1/upload/payment-receipt-download-url', {
                params: { fileUrl: proofUrl },
            });
            const { downloadURL } = response.data.data;
            window.open(downloadURL, '_blank');
        } catch (error) {
            toast.error('Failed to load receipt');
        }
    };

    // Ensure payments is an array
    const paymentList = Array.isArray(payments) ? payments : [];

    // Debug: Log payments with invoices
    React.useEffect(() => {
        const paymentsWithInvoices = paymentList.filter(p => p.invoice);
        if (paymentsWithInvoices.length > 0) {
            console.log(`\n💳 ${paymentsWithInvoices.length} payments have invoices:`);
            paymentsWithInvoices.forEach((p, idx) => {
                console.log(`  [${idx}] ${p.type} - $${p.amount} - Invoice ID: ${p.invoice?.id?.slice(-8)}`);
            });
        }
    }, [paymentList]);

    // Truncate text for mobile
    const truncateText = (text, maxLength = 35) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="h-full flex flex-col">
            {/* Table Header - Desktop only */}
            <div className="hidden md:grid grid-cols-[1fr_1.5fr_1fr_1fr_1fr_1fr] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4 flex-shrink-0">
                <div>Date</div>
                <div className="border-l border-primary-foreground/20 pl-4">Note</div>
                <div className="border-l border-primary-foreground/20 pl-4">Category</div>
                <div className="border-l border-primary-foreground/20 pl-4 pr-4 text-right">Amount</div>
                <div className="border-l border-primary-foreground/20 pl-4">Status</div>
                <div className="border-l border-primary-foreground/20 pl-4">Actions</div>
            </div>

            {/* Mobile Table Header */}
            <div className="md:hidden grid grid-cols-[1fr_auto] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4 flex-shrink-0">
                <div>Payment</div>
                <div className="pr-2">Amount</div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-y-auto min-h-0">
                {isLoading ? (
                    <TenantPaymentSkeleton />
                ) : paymentList.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No payment records found</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                    {paymentList.map((payment) => {
                    const listing = payment.lease?.listing || payment.customLease?.listing;
                    const hasReceipt = !!payment.proofUrl;
                    const status = getStatusText(payment.status, payment.dueDate, hasReceipt);
                    const isPaid = payment.status === 'PAID';
                    const displayDate = isPaid ? payment.paidDate : payment.dueDate;
                    const dateLabel = isPaid ? 'Paid' : 'Due';
                    
                    // For mobile collapsed view
                    const noteText = payment.notes || (listing ? listing.title : 'No note');
                    const categoryText = payment.type.toLowerCase();

                    return (
                        <TenantPaymentRow
                            key={payment.id}
                            payment={payment}
                            listing={listing}
                            hasReceipt={hasReceipt}
                            status={status}
                            isPaid={isPaid}
                            displayDate={displayDate}
                            dateLabel={dateLabel}
                            noteText={noteText}
                            categoryText={categoryText}
                            truncateText={truncateText}
                            handleViewInvoice={handleViewInvoice}
                            handleViewReceipt={handleViewReceipt}
                            handleFileSelect={handleFileSelect}
                            uploadingId={uploadingId}
                            getStatusBadgeClass={getStatusBadgeClass}
                        />
                    );
                    })}
                    </div>
                )}
            </div>
            
            {/* Invoice Details Modal */}
            <InvoiceDetailsModal
                open={invoiceModalOpen}
                onClose={() => setInvoiceModalOpen(false)}
                payment={selectedPayment}
            />
        </div>
    );
};

export default TenantPaymentTable;

