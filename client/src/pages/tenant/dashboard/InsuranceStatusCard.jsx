import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllInsurances } from "@/services/insuranceService";
import { format } from "date-fns";
import StatusBadge from "@/components/shared/StatusBadge";

const InsuranceStatusCard = () => {
  const navigate = useNavigate();
  const [insurance, setInsurance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsurance = async () => {
      try {
        const data = await getAllInsurances();
        // Get the most recent insurance record
        if (data.insurances && data.insurances.length > 0) {
          setInsurance(data.insurances[0]);
        }
      } catch (error) {
        console.error("Error fetching insurance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsurance();
  }, []);

  const getDaysUntilExpiry = () => {
    if (!insurance) return null;
    const today = new Date();
    const expiry = new Date(insurance.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusIcon = () => {
    if (!insurance) return <Shield className="h-8 w-8 text-gray-400" />;

    switch (insurance.status) {
      case "VERIFIED":
        return <CheckCircle className="h-8 w-8 text-green-500" />;
      case "EXPIRING_SOON":
        return <AlertCircle className="h-8 w-8 text-orange-500" />;
      case "EXPIRED":
        return <XCircle className="h-8 w-8 text-red-500" />;
      case "PENDING":
        return <Clock className="h-8 w-8 text-blue-500" />;
      case "REJECTED":
        return <XCircle className="h-8 w-8 text-red-500" />;
      default:
        return <Shield className="h-8 w-8 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    if (!insurance) {
      return {
        title: "No Insurance on File",
        message: "Upload your renter's insurance to complete your profile",
        action: "Upload Insurance",
      };
    }

    const daysUntilExpiry = getDaysUntilExpiry();

    switch (insurance.status) {
      case "VERIFIED":
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          return {
            title: "Insurance Expiring Soon",
            message: `Your insurance expires in ${daysUntilExpiry} days. Please renew and upload new documentation.`,
            action: "Upload Renewal",
          };
        }
        return {
          title: "Insurance Active",
          message: `Your insurance is verified and active until ${format(
            new Date(insurance.expiryDate),
            "MMM dd, yyyy"
          )}`,
          action: "View Details",
        };
      case "EXPIRING_SOON":
        return {
          title: "Action Required",
          message: `Your insurance expires in ${daysUntilExpiry} days. Renew your policy now.`,
          action: "Upload Renewal",
        };
      case "EXPIRED":
        return {
          title: "Insurance Expired",
          message: "Your insurance has expired. Please upload updated documentation immediately.",
          action: "Upload Now",
        };
      case "PENDING":
        return {
          title: "Under Review",
          message: "Your insurance submission is pending landlord verification.",
          action: "View Status",
        };
      case "REJECTED":
        return {
          title: "Action Required",
          message: "Your insurance was rejected. Please review and resubmit.",
          action: "View Details",
        };
      default:
        return {
          title: "Insurance Status",
          message: "Check your insurance details",
          action: "View Details",
        };
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusMessage();

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate("/tenant/insurance")}
    >
      <div className="flex items-start justify-between mb-4">
        {getStatusIcon()}
        {insurance && <StatusBadge status={insurance.status} />}
      </div>

      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {statusInfo.title}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{statusInfo.message}</p>

      {insurance && (
        <div className="mb-4 text-xs text-gray-500">
          <p className="truncate max-w-full">
            Provider: <span className="inline-block max-w-[150px] truncate md:max-w-none md:inline">{insurance.providerName}</span>
          </p>
          <p>Policy: {insurance.policyNumber}</p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={(e) => {
          e.stopPropagation();
          navigate("/tenant/insurance");
        }}
      >
        {statusInfo.action}
      </Button>
    </div>
  );
};

export default InsuranceStatusCard;

