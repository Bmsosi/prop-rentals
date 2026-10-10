import React from "react";
import { Calendar, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";

const LeaseCard = ({ data = {} }) => {
  const {
    propertyName = "",
    address = "",
    postalCode = "",
    rent = 0,
    deposit = 0,
    petDeposit = 0,
    startDate,
    endDate,
    daysLeft = 0,
  } = data;

  return (
    <Card className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 mb-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition">
      {/* Left section */}
      <div className="flex items-center gap-4 min-w-[260px] md:w-[320px]">
        <div className="w-[120px] h-[80px] bg-gray-200 rounded-md flex items-center justify-center text-[10px] font-medium text-gray-500 uppercase text-center leading-tight">
          image of <br /> property
        </div>

        <div className="flex flex-col">
          <h3 className="font-semibold text-[15px] text-primary leading-tight">
            {propertyName}
          </h3>
          <p className="text-[13px] text-gray-700 leading-snug mt-0.5">
            {address} <br /> {postalCode}
          </p>
        </div>
      </div>

      {/* Rent Info */}
      <div className="flex items-center gap-3 text-[13px] text-gray-700 md:w-[180px]">
        <DollarSign size={22} className="text-gray-700 flex-shrink-0" />
        <div className="flex flex-col justify-center leading-tight">
          <span>
            <span className="font-semibold">Rent:</span> ${rent} / Month
          </span>
          <span>
            <span className="font-semibold">Deposit:</span> ${deposit}
          </span>
          <span>
            <span className="font-semibold">Pet Deposit:</span> ${petDeposit}
          </span>
        </div>
      </div>

      {/* Lease Dates */}
      <div className="flex items-center gap-3 text-[13px] text-gray-700 md:w-[180px]">
        <Calendar size={22} className="text-gray-700 flex-shrink-0" />
        <div className="flex flex-col justify-center leading-tight">
          <span className="font-semibold mb-0.5">Lease Dates</span>
          <p>
            <span className="font-semibold">Start:</span>{" "}
            {startDate ? new Date(startDate).toLocaleDateString("en-GB") : "-"}
          </p>
          <p>
            <span className="font-semibold">End:</span>{" "}
            {endDate ? new Date(endDate).toLocaleDateString("en-GB") : "-"}
          </p>
        </div>
      </div>

      {/* Expiry */}
      <div className="flex flex-col text-[13px] text-gray-700 md:w-[130px] text-left md:text-right">
        <p className="font-semibold">Lease expire in</p>
        <p className="text-gray-600 mt-0.5">{daysLeft} Days</p>
      </div>
    </Card>
  );
};

export default LeaseCard;
