import React from 'react';

const TenantPaymentSummary = ({ summary }) => {
    const outstandingBalance = summary?.outstandingBalance || 0;
    const overduePayments = summary?.overduePayments || 0;
    const paidThisMonth = summary?.paidThisMonth || 0;
    const totalPaid = summary?.totalPaid || 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Outstanding Balance */}
            <div className="bg-white p-5 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Outstanding Balance</div>
                <div className="text-2xl font-bold text-gray-900">
                    ${outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">Total pending payments</div>
            </div>

            {/* Overdue Payments */}
            <div className="bg-white p-5 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Overdue</div>
                <div className="text-2xl font-bold text-red-600">
                    ${overduePayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">Past due payments</div>
            </div>

            {/* Paid This Month */}
            <div className="bg-white p-5 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Paid This Month</div>
                <div className="text-2xl font-bold text-green-700">
                    ${paidThisMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">Current month payments</div>
            </div>

            {/* Total Paid */}
            <div className="bg-white p-5 rounded-lg border border-gray-300">
                <div className="text-sm text-gray-600 mb-1">Total Paid</div>
                <div className="text-2xl font-bold text-gray-900">
                    ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500 mt-1">All-time payments</div>
            </div>
        </div>
    );
};

export default TenantPaymentSummary;

