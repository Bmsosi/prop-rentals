// client/src/pages/tenant/components/ReceiptModal.jsx
import { X } from "lucide-react";

export default function ReceiptModal({ open, onClose, proofUrl }) {
  if (!open || !proofUrl) return null;

  const isPDF = proofUrl.endsWith(".pdf");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center">
      <div className="relative bg-white w-[720px] rounded-[18px] shadow-xl p-10">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded hover:bg-gray-100"
          aria-label="close"
        >
          <X size={18} />
        </button>

        <h3 className="text-[24px] font-semibold text-center mb-6">
          Payment Receipt
        </h3>

        {isPDF ? (
          <embed
            src={proofUrl}
            type="application/pdf"
            className="w-full h-[500px] rounded-md border"
          />
        ) : (
          <img
            src={proofUrl}
            alt="Proof of payment"
            className="w-full max-h-[500px] object-contain rounded-md border"
          />
        )}

        <div className="mt-6 text-center">
          <a
            href={proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline text-sm"
          >
            Open in new tab
          </a>
        </div>
      </div>
    </div>
  );
}
