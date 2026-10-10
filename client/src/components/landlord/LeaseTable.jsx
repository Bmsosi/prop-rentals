import { useEffect, useState } from "react";
import { ChevronUp, Eye, Pencil, Copy, Trash2, Info } from "lucide-react";
import { fetchAllLeases } from "../../services/leaseService";

export default function LeaseTable() {
  const [leases, setLeases] = useState([]);

  useEffect(() => {
    async function loadLeases() {
      const data = await fetchAllLeases();
      setLeases(data);
    }
    loadLeases();
  }, []);

  return (
    <div className="mt-5 overflow-hidden rounded-md border border-gray-200">
      {/* Table Header */}
      <div className="grid grid-cols-12 items-center bg-gray-800 text-white text-sm font-medium">
        <HeaderCell className="col-span-3">
          Lease Name <ChevronUp className="ml-1 h-3 w-3 inline-block" />
        </HeaderCell>
        <HeaderCell className="col-span-4">
          Description <ChevronUp className="ml-1 h-3 w-3 inline-block" />
        </HeaderCell>
        <HeaderCell className="col-span-2">
          Term Period <ChevronUp className="ml-1 h-3 w-3 inline-block" />
        </HeaderCell>
        <HeaderCell className="col-span-2">
          Property Type <ChevronUp className="ml-1 h-3 w-3 inline-block" />
        </HeaderCell>
        <HeaderCell className="col-span-1 flex items-center justify-between pr-4">
          <span className="flex items-center">
            <Info className="mr-2 h-4 w-4 text-white" />
            Region
          </span>
        </HeaderCell>
      </div>

      {/* Table Body */}
      {leases.length > 0 ? (
        leases.map((lease) => (
          <div
            key={lease.id}
            className="grid grid-cols-12 items-center text-sm border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
          >
            <BodyCell className="col-span-3 font-semibold">
              {lease.listing?.title || "—"}
            </BodyCell>
            <BodyCell className="col-span-4 text-gray-700">
              {lease.notes || "—"}
            </BodyCell>
            <BodyCell className="col-span-2">
              {lease.paymentFrequency || "—"}
            </BodyCell>
            <BodyCell className="col-span-2">
              {lease.listing?.category || "—"}
            </BodyCell>
            <div className="col-span-1 flex items-center justify-between pr-4">
              <span className="text-gray-700">
                {lease.listing?.state || "—"}
              </span>
              <div className="ml-3 flex items-center gap-3 text-gray-700">
                <Eye className="h-4 w-4" />
                <Pencil className="h-4 w-4" />
                <Copy className="h-4 w-4" />
                <Trash2 className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm">
          No leases found.
        </div>
      )}
    </div>
  );
}

function HeaderCell({ children, className = "" }) {
  return (
    <div
      className={`px-4 py-3 border-r border-gray-700 last:border-r-0 ${className}`}
    >
      <span className="text-white">{children}</span>
    </div>
  );
}

function BodyCell({ children, className = "" }) {
  return (
    <div
      className={`px-4 py-3 border-r border-gray-200 last:border-r-0 ${className}`}
    >
      {children}
    </div>
  );
}
