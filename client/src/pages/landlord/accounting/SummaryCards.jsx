import React from 'react';

const SummaryCard = ({ title, total, breakdown }) => {
  return (
    <div className="bg-card rounded-2xl p-4 md:p-6">
      <h3 className="text-[18px] font-semibold text-primary mb-2 md:mb-3">{title}</h3>
      <div className="text-2xl md:text-[36px] font-bold text-primary mb-3 md:mb-4">
        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <div className="space-y-1.5 md:space-y-2">
        <div className="flex justify-between text-[14px]">
          <span className="text-gray-600">Rent:</span>
          <span className="font-medium text-gray-900">
            ${breakdown.rent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-gray-600">Deposit:</span>
          <span className="font-medium text-gray-900">
            ${breakdown.deposit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-gray-600">Maintenance:</span>
          <span className="font-medium text-gray-900">
            ${breakdown.maintenance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-gray-600">Other:</span>
          <span className="font-medium text-gray-900">
            ${breakdown.other.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

const SummaryCards = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
      <SummaryCard
        title="Outstanding Balances"
        total={summary.outstanding.total}
        breakdown={summary.outstanding.breakdown}
      />
      <SummaryCard
        title="Overdue Payments"
        total={summary.overdue.total}
        breakdown={summary.overdue.breakdown}
      />
      <SummaryCard
        title="Paid This Month"
        total={summary.paid.total}
        breakdown={summary.paid.breakdown}
      />
    </div>
  );
};

export default SummaryCards;

