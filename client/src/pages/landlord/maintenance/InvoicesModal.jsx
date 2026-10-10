import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import InvoicesTable from "./InvoicesTable";
import { useAuthStore } from "@/store/authStore";

const demoInvoiceItems = [
    { description: "Leak detection & repair labor (2 hrs)", amount: 220 },
    { description: "Capacitor replacement & tune-up", amount: 165 },
    { description: "Appliance service call", amount: 80 },
    { description: "Replacement P-trap & fittings", amount: 48 },
    { description: "Door seal replacement kit", amount: 54 },
    { description: "HVAC diagnostic visit", amount: 95 },
    { description: "Emergency after-hours fee", amount: 120 },
];

const InvoicesModal = ({ open, onClose, maintenanceRequest }) => {
    const [invoiceItems, setInvoiceItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({
        description: "",
        amount: "",
    });
    const { user } = useAuthStore();
    const isTenantUser = user?.role === "TENANT";
    const [shareWithCounterparty, setShareWithCounterparty] = useState(isTenantUser ? false : true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [invoiceRefreshTrigger, setInvoiceRefreshTrigger] = useState(0);

    // Reset when modal opens
    useEffect(() => {
        if (open && maintenanceRequest) {
            setInvoiceItems([]);
            setCurrentItem({
                description: "",
                amount: "",
            });
            setShareWithCounterparty(isTenantUser ? false : true);
        }
    }, [open, maintenanceRequest, isTenantUser]);

    if (!maintenanceRequest) return null;

    const handleCurrentItemChange = (field, value) => {
        setCurrentItem((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddItem = () => {
        if (!currentItem.description.trim()) {
            toast.error("Please enter a description");
            return;
        }
        if (!currentItem.amount || parseFloat(currentItem.amount) <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setInvoiceItems((prev) => [
            ...prev,
            {
                id: Date.now(),
                description: currentItem.description.trim(),
                amount: parseFloat(currentItem.amount),
            },
        ]);

        // Reset current item
        setCurrentItem({
            description: "",
            amount: "",
        });
    };

    const handleRemoveItem = (itemId) => {
        setInvoiceItems((prev) => prev.filter((item) => item.id !== itemId));
    };

    const handleSaveAll = async () => {
        if (invoiceItems.length === 0) {
            toast.error("Please add at least one invoice item");
            return;
        }

        setIsSubmitting(true);

        try {
            const promises = invoiceItems.map((item) =>
                api.post(API_ENDPOINTS.INVOICES.BASE, {
                    maintenanceRequestId: maintenanceRequest.id,
                    description: item.description,
                    amount: item.amount,
                    ...(isTenantUser
                        ? { sharedWithLandlord: shareWithCounterparty }
                        : { sharedWithTenant: shareWithCounterparty }),
                })
            );

            await Promise.all(promises);

            toast.success(`${invoiceItems.length} invoice(s) created successfully!`);
            
            // Reset form and refresh table
            setInvoiceItems([]);
            setCurrentItem({ description: "", amount: "" });
            setInvoiceRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error("Error creating invoices:", error);
            toast.error(error.response?.data?.message || "Failed to create invoices");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.amount, 0);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col [&>button]:hidden rounded-xl">
                <DialogHeader className="flex-shrink-0 pb-4 border-b">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <DialogTitle className="text-2xl font-bold">Invoice</DialogTitle>
                            <Button
                                type="button"
                                className="bg-blue-50/70 text-blue-700 hover:bg-blue-100 border border-blue-100 rounded-2xl text-sm"
                                onClick={() => {
                                    const sample =
                                        demoInvoiceItems[Math.floor(Math.random() * demoInvoiceItems.length)];
                                    setCurrentItem({
                                        description: sample.description,
                                        amount: sample.amount.toString(),
                                    });
                                }}
                            >
                                Demo Autofill
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="share-toggle" className="text-sm font-medium cursor-pointer whitespace-nowrap">
                                {isTenantUser ? "Share with landlord" : "Share with tenant"}
                            </Label>
                            <Switch
                                id="share-toggle"
                                checked={shareWithCounterparty}
                                onCheckedChange={setShareWithCounterparty}
                                className="data-[state=checked]:!bg-primary"
                            />
                        </div>
                    </div>
                    <div className="mt-3 space-y-1">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Property:</span> {maintenanceRequest?.listing?.title}
                        </p>
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Request:</span> {maintenanceRequest?.title}
                        </p>
                        {!shareWithCounterparty && (
                            <p className="text-xs text-orange-600 mt-2 italic">
                                {isTenantUser
                                    ? "⚠️ Invoices will be visible only to you until you share with the landlord."
                                    : "⚠️ Invoices will be visible only to you until you share with the tenant."}
                            </p>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
                    {/* Add Invoice Form (Always Visible) */}
                    <div className="space-y-4">
                        {/* Add Item Form */}
                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">
                                    Description
                                </Label>
                                <Textarea
                                    id="description"
                                    value={currentItem.description}
                                    onChange={(e) => handleCurrentItemChange("description", e.target.value)}
                                    placeholder="Enter invoice item description..."
                                    className="min-h-[80px] resize-none text-sm bg-white"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            e.preventDefault();
                                            handleAddItem();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex gap-3 items-end">
                                <div className="flex-1 space-y-2">
                                    <Label htmlFor="amount" className="text-sm font-medium">
                                        Cost
                                    </Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={currentItem.amount}
                                            onChange={(e) => handleCurrentItemChange("amount", e.target.value)}
                                            placeholder="0.00"
                                            className="pl-7 text-sm bg-white"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddItem();
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                
                                <Button
                                    type="button"
                                    onClick={handleAddItem}
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 p-0 rounded-full flex items-center justify-center"
                                    title="Add item"
                                >
                                    <Plus className="h-5 w-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Invoice Items List */}
                        {invoiceItems.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Invoice Items ({invoiceItems.length})</Label>
                                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-white">
                                    {invoiceItems.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-900 line-clamp-2">{item.description}</p>
                                                <p className="text-sm font-semibold text-gray-900 mt-1">${item.amount.toFixed(2)}</p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveItem(item.id)}
                                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
                                                title="Remove item"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Total and Save Button */}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="text-sm font-semibold text-gray-700">Total: ${totalAmount.toFixed(2)}</span>
                                    <Button
                                        type="button"
                                        onClick={handleSaveAll}
                                        disabled={isSubmitting || invoiceItems.length === 0}
                                        className="bg-gray-900 hover:bg-gray-800 text-white px-6"
                                        size="sm"
                                    >
                                        {isSubmitting ? "Saving..." : `Save (${invoiceItems.length})`}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Existing Invoices Table */}
                    <div>
                        <InvoicesTable
                            maintenanceRequestId={maintenanceRequest.id}
                            maintenanceRequest={maintenanceRequest}
                            refreshTrigger={invoiceRefreshTrigger}
                        />
                    </div>
                </div>

                <div className="flex-shrink-0 flex justify-end pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="px-6 rounded-2xl"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InvoicesModal;

