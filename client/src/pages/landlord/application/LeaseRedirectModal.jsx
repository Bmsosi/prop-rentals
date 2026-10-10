import React, { useState } from "react";
import { DialogTitle, DialogHeader, DialogDescription, Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const LeaseRedirectModal = ({ isOpen, onClose, redirectUrl, listingName }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (listingName) {
            try {
                await navigator.clipboard.writeText(listingName);
                setCopied(true);
                toast.success("Listing name copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                toast.error("Failed to copy listing name");
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md text-center space-y-4 p-8">
                <DialogHeader className="pt-4">
                    <DialogTitle className="text-xl items-center mx-auto">No Lease Found !</DialogTitle>
                </DialogHeader>
                <DialogDescription className="text-md px-6">
                    This listing doesn't have any lease attached. You need to create a lease
                    before sending.
                </DialogDescription>
                
                {listingName && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                            Listing Name:
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={listingName}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopy}
                                className="h-10 w-10 rounded-md"
                                title={copied ? "Copied!" : "Copy listing name"}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex justify-center gap-4 mt-4">
                    <Button
                        className="bg-gray-900 text-white rounded-2xl"
                        onClick={() => {
                            window.location.href = redirectUrl;
                        }}
                    >
                        Go to Leases
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="rounded-2xl"
                    >
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default LeaseRedirectModal;
