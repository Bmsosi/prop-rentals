import React, { useEffect, useState } from "react";
import { fetchAllLeases } from "../../../services/leaseService";

const TenantRentalInfo = () => {
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLease = async () => {
      try {
        const data = await fetchAllLeases();
        if (Array.isArray(data) && data.length > 0) {
          setLease(data[0]); // just show first lease
        } else {
          setError("No leases found");
        }
      } catch (err) {
        setError("Failed to fetch lease data");
      } finally {
        setLoading(false);
      }
    };
    loadLease();
  }, []);

  if (loading) return <p className="p-10 text-gray-500">Loading...</p>;
  if (error) return <p className="p-10 text-red-500">{error}</p>;
  if (!lease) return <p className="p-10 text-gray-500">No active lease found</p>;

  return (
    <div className="p-10 min-h-screen bg-white">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Rental Payments</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Lease and property details */}
        <div className="border border-gray-300 rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-sm mb-3">
            Lease And Property Details
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Square Footage: {lease.listing?.size || "N/A"} sq ft <br />
            Address: {lease.listing?.address || "N/A"} <br />
            City: {lease.listing?.city || "N/A"},{" "}
            {lease.listing?.state || "N/A"} <br />
            Rent: ${lease.rentAmount || "N/A"} / month <br />
            Deposit: ${lease.securityDeposit || "N/A"} <br />
            Lease Start:{" "}
            {lease.startDate
              ? new Date(lease.startDate).toLocaleDateString()
              : "N/A"}{" "}
            <br />
            Lease End:{" "}
            {lease.endDate
              ? new Date(lease.endDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>

        {/* Tenancy History */}
        <div className="border border-gray-300 rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-sm mb-2">
            Tenancy History And Contacts
          </h2>
          <p className="font-semibold text-sm mb-2">Your Tenancy Timeline</p>
          <p className="text-sm text-gray-700">
            Lease Status: {lease.leaseStatus || "N/A"}
          </p>
        </div>

        {/* View Active Lease */}
        <div className="flex justify-center md:justify-start">
          <button
            className="mt-6 bg-gray-900 text-white text-sm font-medium rounded-[15px]
                       hover:bg-gray-800 transition
                       w-[245px] h-[50px] px-[40px] py-[14px]
                       whitespace-nowrap flex items-center justify-center"
          >
            View Active Lease
          </button>
        </div>

        {/* Landlord Info */}
        <div className="border border-gray-300 rounded-lg p-6 shadow-sm">
          <h2 className="font-semibold text-sm mb-3">Landlord Contact Info</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Name:{" "}
            {lease.landlord
              ? `${lease.landlord.firstName} ${lease.landlord.lastName}`
              : "N/A"}
            <br />
            Email: {lease.landlord?.email || "N/A"}
          </p>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="flex justify-end mt-10">
        <button
          className="bg-gray-900 text-white text-sm font-medium rounded-[15px]
                     hover:bg-gray-800 transition
                     w-[260px] h-[50px] px-[40px] py-[14px]
                     whitespace-nowrap flex items-center justify-center"
        >
          View Full Maintenance History
        </button>
      </div>

      <hr className="mt-12 border-gray-300" />
    </div>
  );
};

export default TenantRentalInfo;
