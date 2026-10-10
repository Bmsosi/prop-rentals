import React, { useState } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronDown, ChevronUp, User, Home, Calendar, Tag, DollarSign, Mail } from 'lucide-react';
import InvoiceDetailsModal from '@/components/shared/InvoiceDetailsModal';
import { useAuthStore } from '@/store/authStore';

const getStatusBadgeClass = (status) => {
  const baseClasses = 'px-3 py-1 rounded-md text-[14px] font-medium';
  
  switch (status) {
    case 'PAID':
      return `${baseClasses} bg-gray-200 text-gray-800`;
    case 'PENDING':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'FAILED':
    case 'CANCELLED':
      return `${baseClasses} bg-red-100 text-red-800`;
    default:
      return `${baseClasses} bg-gray-200 text-gray-800`;
  }
};

const getStatusText = (status, dueDate) => {
  if (status === 'PAID') return 'Paid';
  if (status === 'PENDING') {
    const now = new Date();
    const due = new Date(dueDate);
    if (due < now) return 'Overdue';
    return 'Outstanding';
  }
  return status;
};

const TransactionRow = ({ payment, onViewProof, onViewInvoice, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuthStore();
  const tenant = payment.tenant;
  const listing = payment.lease?.listing || payment.customLease?.listing;
  const status = getStatusText(payment.status, payment.dueDate);
  const isPaid = payment.status === 'PAID';
  const hasInvoice = payment.invoice;

  // Determine which date to show
  const displayDate = isPaid ? payment.paidDate : payment.dueDate;
  const dateLabel = isPaid ? 'Paid' : 'Due';

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

  const tenantName = tenant ? `${tenant.firstName} ${tenant.lastName}` : 'N/A';
  const propertyTitle = listing?.title || (payment.type === 'MAINTENANCE' && payment.notes ? 'Property Maintenance' : 'N/A');
  
  // Check if payment is overdue
  const isOverdue = payment.status === 'PENDING' && payment.dueDate && new Date(payment.dueDate) < new Date();
  const tenantEmail = tenant?.email || '';
  
  // Handle send reminder email
  const handleSendReminder = (e) => {
    e.stopPropagation();
    if (!tenantEmail) {
      alert('Tenant email not available');
      return;
    }
    
    const paymentType = payment.type === 'RENT' ? 'rent' : payment.type === 'UTILITIES' ? 'utilities' : payment.type === 'MAINTENANCE' ? 'maintenance' : 'payment';
    const dueDateFormatted = format(new Date(payment.dueDate), 'MMMM d, yyyy');
    const amountFormatted = `$${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const subject = encodeURIComponent(`Payment Reminder: ${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} Payment Due`);
    const landlordName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Property Manager';
    
    const body = encodeURIComponent(`Dear ${tenantName},

This is a friendly reminder that your ${paymentType} payment is overdue.

Payment Details:
- Type: ${payment.type}
- Amount: ${amountFormatted}
- Due Date: ${dueDateFormatted}
${propertyTitle ? `- Property: ${propertyTitle}` : ''}

Please submit your payment at your earliest convenience. If you have already made this payment, please disregard this reminder.

If you have any questions or concerns, please don't hesitate to contact me.

Thank you for your prompt attention to this matter.

Best regards,
${landlordName}`);
    
    window.location.href = `mailto:${tenantEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <Card className="border border-gray-300 hover:shadow-md cursor-default transition-shadow mb-1 p-0 md:p-3">
      {/* Mobile: Collapsed Row View */}
      <div className="md:hidden">
        <div className="flex items-center p-3 gap-3">
          {/* Title and Description (stacked) */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <h3 
                className="font-semibold text-sm" 
                title={tenantName}
              >
                {truncateText(tenantName)}
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
                title={propertyTitle}
              >
                {truncateText(propertyTitle)}
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
          <div className="px-4 pb-4 border-gray-200 border-t space-y-4 pt-4">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column: Tenant & Property Info */}
              <div className="space-y-3">
                {/* Tenant Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-700">Tenant</p>
                  </div>
                  <p className="text-xs text-gray-900 font-medium">{tenantName}</p>
                  {payment.createdAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted {format(new Date(payment.createdAt), 'd')} days ago
                    </p>
                  )}
                </div>

                {/* Property Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Home className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-700">Property</p>
                  </div>
                  {listing ? (
                    <>
                      <p className="text-xs text-gray-900 font-medium">{listing.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {listing.streetAddress}, {listing.city}
                      </p>
                    </>
                  ) : payment.type === 'MAINTENANCE' && payment.notes ? (
                    <>
                      <p className="text-xs text-gray-900 font-medium">Property Maintenance</p>
                      <p className="text-xs text-gray-500 mt-1">{payment.notes}</p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">N/A</p>
                  )}
                </div>
              </div>

              {/* Right Column: Amount, Date, Status & Category */}
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

                {/* Category Section */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-semibold text-gray-700">Category</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-gray-900 font-medium capitalize">{payment.type.toLowerCase()}</p>
                    {hasInvoice && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewInvoice(payment);
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
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-300">
              {payment.proofUrl ? (
                // Has receipt - always show View Receipt for paid, Review Receipt for unpaid
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewProof(payment);
                  }}
                  className={`text-xs px-4 py-2 rounded-xl font-medium ${
                    isPaid 
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isPaid ? 'View Receipt' : 'Review Receipt'}
                </Button>
              ) : isPaid ? (
                // Payment is paid but no receipt uploaded
                <span className="text-xs text-gray-500 px-4 py-2">Payment completed</span>
              ) : isOverdue ? (
                <Button
                  onClick={handleSendReminder}
                  className="text-xs px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-700 font-medium"
                >
                  <Mail className="w-3 h-3 mr-1.5" />
                  Send Reminder
                </Button>
              ) : (
                <span className="text-xs text-gray-400 px-4 py-2">Awaiting payment</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop: Original Layout */}
      <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center">
        {/* Tenant */}
        <div className="text-[16px] text-gray-700 truncate">
          <div className="font-semibold text-gray-900">{tenant ? `${tenant.firstName} ${tenant.lastName}` : 'N/A'}</div>
          <div className="text-sm font-normal text-gray-600 text-wrap">
            Submitted {format(new Date(payment.createdAt), 'd')} days ago
          </div>
        </div>

        {/* Property */}
        <div className="text-[16px] font-semibold text-gray-900 truncate border-l border-gray-300 pl-4">
          {listing ? (
            <>
              <div className="truncate">{listing.title}</div>
              <div className="text-sm font-normal text-gray-600 truncate">
                {listing.streetAddress}, {listing.city}
              </div>
            </>
          ) : payment.type === 'MAINTENANCE' && payment.notes ? (
            <>
              <div className="truncate text-gray-700">Property Maintenance</div>
              <div className="text-sm font-normal text-gray-600 truncate">
                {payment.notes}
              </div>
            </>
          ) : (
            <span className="text-gray-500">N/A</span>
          )}
        </div>

        {/* Category */}
        <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
          <div className="text-center">
            <div className="flex items-center gap-2">
              <span className="text-[16px] font-semibold text-gray-900 capitalize">
                {payment.type.toLowerCase()}
              </span>
              {hasInvoice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewInvoice(payment);
                  }}
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  title="View Invoice Details"
                >
                  <FileText className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="border-l border-gray-300 pl-4 pr-4">
          <div className="text-right">
            <div className="text-[16px] font-semibold text-gray-900">
              ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
          <div className="text-center">
            {displayDate ? (
              <>
                <div className="text-[16px] font-semibold text-gray-900">
                  {format(new Date(displayDate), 'MMM d, yyyy')}
                </div>
                <div className="text-[12px] text-gray-500">{dateLabel}</div>
              </>
            ) : (
              <span className="text-gray-500">N/A</span>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
          <Badge className={`${getStatusBadgeClass(payment.status)} whitespace-nowrap text-xs px-2 py-1 text-gray-900 border-0`}>
            {status}
          </Badge>
        </div>

        {/* Action */}
        <div className="flex justify-center mr-auto border-l border-gray-300 pl-4">
          {payment.proofUrl ? (
            // Has receipt - always show View Receipt for paid, Review Receipt for unpaid
            <button
              onClick={() => onViewProof(payment)}
              className={`text-[14px] font-medium ${
                isPaid 
                  ? 'text-gray-900 hover:text-gray-700' 
                  : 'text-blue-600 hover:text-blue-800'
              }`}
            >
              {isPaid ? 'View Receipt' : 'Review Receipt'}
            </button>
          ) : isPaid ? (
            // Payment is paid but no receipt uploaded
            <span className="text-gray-500 text-[14px]">
              Payment completed
            </span>
          ) : isOverdue ? (
            // Overdue - show send reminder button
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSendReminder(e);
              }}
              className="text-orange-600 hover:text-orange-800 text-[14px] font-medium flex items-center gap-1"
            >
              <Mail className="w-4 h-4" />
              Send Reminder
            </button>
          ) : (
            // No receipt yet and not overdue
            <span className="text-gray-400 text-[14px]">
              Awaiting payment
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

const TransactionTable = ({ payments, onViewProof, isLoading, hideHeader = false }) => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  const handleViewInvoice = (payment) => {
    setSelectedPayment(payment);
    setInvoiceModalOpen(true);
  };

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-12 text-center">
        <p className="text-gray-500 text-[16px]">No payments found</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Table Header - Conditionally render */}
        {!hideHeader && (
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] mb-3 bg-primary p-3 text-primary-foreground font-semibold rounded-2xl gap-4 flex-shrink-0">
            <div className="">Tenant</div>
            <div className="border-l border-primary-foreground/20 pl-4">Property</div>
            <div className="border-l border-primary-foreground/20 pl-4">Category</div>
            <div className="border-l border-primary-foreground/20 pl-4 pr-4 text-right">Amount</div>
            <div className="border-l border-primary-foreground/20 pl-4">Date</div>
            <div className="border-l border-primary-foreground/20 pl-4">Status</div>
            <div className="border-l border-primary-foreground/20 pl-4">Action</div>
          </div>
        )}

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto min-h-0 space-y-1">
          {payments.map((payment) => (
            <TransactionRow
              key={payment.id}
              payment={payment}
              onViewProof={onViewProof}
              onViewInvoice={handleViewInvoice}
              isLoading={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        open={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        payment={selectedPayment}
      />
    </>
  );
};

export default TransactionTable;

