import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const TERMINATION_REASONS = [
    { value: "NON_PAYMENT", label: "Non-payment of Rent" },
    { value: "LATE_PAYMENT", label: "Repeated Late Payments" },
    { value: "LEASE_VIOLATION", label: "Lease Violation" },
    { value: "PROPERTY_DAMAGE", label: "Property Damage" },
    { value: "NOISE_COMPLAINTS", label: "Noise/Disturbance Complaints" },
    { value: "UNAUTHORIZED_OCCUPANTS", label: "Unauthorized Occupants" },
    { value: "ILLEGAL_ACTIVITY", label: "Illegal Activity" },
    { value: "MUTUAL_AGREEMENT", label: "Mutual Agreement" },
    { value: "LANDLORD_NEEDS", label: "Landlord Needs Property" },
    { value: "OTHER", label: "Other" },
];

const TerminateLeaseDialog = ({ open, onClose, lease, onConfirm, isLoading }) => {
    const [reason, setReason] = useState("");
    const [notes, setNotes] = useState("");

    const handleSubmit = () => {
        if (!reason) {
            return;
        }
        onConfirm({ reason, notes });
    };

    const handleClose = () => {
        setReason("");
        setNotes("");
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md p-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold text-primary">Terminate Lease</DialogTitle>
                    <DialogDescription>
                        You are about to terminate the lease for{" "}
                        <span className="font-semibold">
                            {lease?.listing?.title || lease?.propertyAddress}
                        </span>
                        . This action will change the lease status to TERMINATED.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Reason Selection */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">
                            Reason for Termination <span className="text-red-500">*</span>
                        </Label>
                        <Select value={reason} onValueChange={setReason}>
                            <SelectTrigger className={`w-full ${!reason ? 'border-red-300' : ''}`}>
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {TERMINATION_REASONS.map((r) => (
                                    <SelectItem key={r.value} value={r.value}>
                                        {r.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {!reason && (
                            <p className="text-xs text-red-500">Please select a termination reason</p>
                        )}
                    </div>

                    {/* Additional Notes */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Additional Notes (Optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Provide any additional details about the termination..."
                            className="min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Warning Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                            <span className="font-semibold">Warning:</span> Terminating a lease is a serious action. 
                            Make sure you have proper documentation and have followed all legal requirements.
                        </p>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!reason || isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? "Terminating..." : "Terminate Lease"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TerminateLeaseDialog;

