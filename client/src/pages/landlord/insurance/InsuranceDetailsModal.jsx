import React, { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  X,
  Download,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  MapPin,
  FileText,
  Calendar,
  DollarSign,
  Building,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StatusBadge from "@/components/shared/StatusBadge";
import {
  verifyInsurance,
  rejectInsurance,
  getDownloadUrl,
} from "@/services/insuranceService";
import { format } from "date-fns";
import PolicyDocumentViewer from "./components/PolicyDocumentViewer";

const InsuranceDetailsModal = ({ insurance, onClose }) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);

  const getPropertyName = () => {
    if (insurance.lease?.listing?.streetAddress) {
      return insurance.lease.listing.streetAddress;
    }
    if (insurance.lease?.propertyAddress) {
      return insurance.lease.propertyAddress;
    }
    if (insurance.customLease?.leaseName) {
      return insurance.customLease.leaseName;
    }
    return "N/A";
  };

  const getTenantName = () => {
    if (insurance.tenant?.firstName && insurance.tenant?.lastName) {
      return `${insurance.tenant.firstName} ${insurance.tenant.lastName}`;
    }
    return "Unknown Tenant";
  };

  const handleVerify = async () => {
    if (loading) return;

    try {
      setLoading(true);
      await verifyInsurance(insurance.id);
      toast.success("Insurance verified successfully");
      // Invalidate and refetch insurances query to update the table
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
      onClose();
    } catch (error) {
      console.error("Error verifying insurance:", error);
      toast.error(error.response?.data?.message || "Failed to verify insurance");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setLoading(true);
      await rejectInsurance(insurance.id, rejectionReason);
      toast.success("Insurance rejected");
      // Invalidate and refetch insurances query to update the table
      queryClient.invalidateQueries({ queryKey: ["insurances"] });
      onClose();
    } catch (error) {
      console.error("Error rejecting insurance:", error);
      toast.error(error.response?.data?.message || "Failed to reject insurance");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const downloadUrl = await getDownloadUrl(insurance.documentKey);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const getDaysUntilExpiry = () => {
    const today = new Date();
    const expiry = new Date(insurance.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  return (
    <>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
        <div className="bg-background rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
          {/* Header */}
          <div className="sticky top-0 bg-background px-6 pb-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-xl font-bold text-gray-900 pt-8">
                {getTenantName()}'s Insurance Policy Details
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Policy #{insurance.policyNumber}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pt-6 pb-8 space-y-6">
            {/* Status */}
            <div className="flex items-center justify-between">
              <StatusBadge status={insurance.status} className="text-base px-4 py-2" />
              {daysUntilExpiry <= 30 && daysUntilExpiry > 0 && (
                <span className="text-sm text-orange-600 font-medium">
                  Expires in {daysUntilExpiry} days
                </span>
              )}
              {daysUntilExpiry < 0 && (
                <span className="text-sm text-red-600 font-medium">
                  Expired {Math.abs(daysUntilExpiry)} days ago
                </span>
              )}
            </div>

            {/* Tenant Information */}
            <div className="bg-card border border-gray-300 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="mr-2 h-5 w-5" />
                Tenant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {insurance.tenant?.email || "N/A"}
                    </p>
                  </div>
                </div>
                {insurance.tenant?.phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">
                        {insurance.tenant.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Insurance Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Property</p>
                  <p className="text-sm font-medium text-gray-900">
                    {getPropertyName()}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Provider</p>
                  <p className="text-sm font-medium text-gray-900">
                    {insurance.providerName}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Coverage Type</p>
                  <p className="text-sm font-medium text-gray-900">
                    {insurance.coverageType}
                  </p>
                </div>
              </div>

              {insurance.coverageAmount && (
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Coverage Amount</p>
                    <p className="text-sm font-medium text-gray-900">
                      ${insurance.coverageAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {insurance.monthlyCost && (
                <div className="flex items-start space-x-3">
                  <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Monthly Cost</p>
                    <p className="text-sm font-medium text-gray-900">
                      ${insurance.monthlyCost}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Effective Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(insurance.startDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Expiration Date</p>
                  <p className="text-sm font-medium text-gray-900">
                    {format(new Date(insurance.expiryDate), "MMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            {insurance.notes && (
              <div className="bg-card border border-gray-300 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                <p className="text-sm text-gray-700">{insurance.notes}</p>
              </div>
            )}

            {insurance.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 mb-2">
                  Rejection Reason
                </h3>
                <p className="text-sm text-red-700">{insurance.rejectionReason}</p>
              </div>
            )}

            {/* Document Actions */}
            <div className="pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Policy Document
              </h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => setShowDocumentViewer(true)} className="rounded-2xl bg-gray-100 hover:bg-gray-200">
                  <FileText className="mr-2 h-4 w-4" />
                  View Document
                </Button>
                <Button variant="outline" onClick={handleDownload} className="rounded-2xl bg-gray-100 hover:bg-gray-200">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6">
              {showRejectForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejecting this insurance..."
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason("");
                      }}
                      className="rounded-2xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={loading || !rejectionReason.trim()}
                      variant="destructive"
                      className="rounded-2xl"
                    >
                      Reject Insurance
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {insurance.status === "PENDING" && (
                    <>
                      <Button onClick={handleVerify} disabled={loading} className="rounded-2xl">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verify Insurance
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowRejectForm(true)}
                        disabled={loading}
                        className="rounded-2xl"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showDocumentViewer && (
        <PolicyDocumentViewer
          documentKey={insurance.documentKey}
          documentUrl={insurance.documentUrl}
          onClose={() => setShowDocumentViewer(false)}
        />
      )}
    </>
  );
};

export default InsuranceDetailsModal;

