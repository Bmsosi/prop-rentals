import React from "react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function StandardLeaseStep4({
    standardLeaseData,
    onBack,
    onSubmit,
    isSubmitting = false,
}) {
    return (
        <>
            <DialogHeader>
                <DialogTitle className="text-center text-[20px] font-bold p-4 text-primary">
                    Review & Submit (Page 4 of 4)
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900 font-medium mb-2">Summary</p>
                    <div className="space-y-1 text-xs text-blue-800">
                        <p><span className="font-semibold">Landlord:</span> {standardLeaseData.landlordFirstName} {standardLeaseData.landlordLastName}</p>
                        <p><span className="font-semibold">Tenant:</span> {standardLeaseData.tenantFirstName} {standardLeaseData.tenantLastName}</p>
                        <p><span className="font-semibold">Property:</span> {standardLeaseData.streetAddress}, {standardLeaseData.city}</p>
                        <p><span className="font-semibold">Start Date:</span> {standardLeaseData.startMonth}/{standardLeaseData.startDay}/{standardLeaseData.startYear}</p>
                        <p><span className="font-semibold">Tenancy Type:</span> {standardLeaseData.tenancyType === "month-to-month" ? "Month-to-month" : standardLeaseData.tenancyType === "other-periodic" ? "Other periodic" : "Fixed term"}</p>
                        <p><span className="font-semibold">Rent:</span> ${standardLeaseData.rentAmount} per {standardLeaseData.rentFrequency}</p>
                        <p><span className="font-semibold">Security Deposit:</span> ${standardLeaseData.securityDeposit || "0"}</p>
                        {!standardLeaseData.petDepositNA && standardLeaseData.petDeposit && (
                            <p><span className="font-semibold">Pet Deposit:</span> ${standardLeaseData.petDeposit}</p>
                        )}
                        {standardLeaseData.includedServices.length > 0 && (
                            <p><span className="font-semibold">Included Services:</span> {standardLeaseData.includedServices.join(", ")}</p>
                        )}
                    </div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                    A PDF lease agreement will be generated with all the details you provided.
                </p>
            </div>

            {/* Back + Submit Buttons */}
            <div className="flex justify-between mt-6 gap-4">
                <Button
                    variant="outline"
                    className="flex-1 py-6 rounded-2xl"
                    onClick={onBack}
                >
                    Back
                </Button>

                <Button
                    className="flex-1 py-6 rounded-2xl"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        "Generate Lease"
                    )}
                </Button>
            </div>
        </>
    );
}

