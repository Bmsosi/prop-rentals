import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const FilterCustomLeaseDialog = ({ isOpen, onClose, onApply, initialFilters }) => {
    const [status, setStatus] = useState("");
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Initialize filters when dialog opens or when initialFilters change
    useEffect(() => {
        if (isOpen && initialFilters) {
            setStatus(initialFilters.status || "");
            setStartDate(initialFilters.startDate ? new Date(initialFilters.startDate) : null);
            setEndDate(initialFilters.endDate ? new Date(initialFilters.endDate) : null);
        }
    }, [isOpen, initialFilters]);

    const resetFilters = () => {
        setStatus("");
        setStartDate(null);
        setEndDate(null);
        onApply({ status: "", startDate: "", endDate: "" });
        onClose();
    };

    const applyFilters = () => {
        const adjustedEnd = endDate
            ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1)
            : "";

        onApply({
            status,
            startDate: startDate ? startDate.toISOString() : "",
            endDate: adjustedEnd ? adjustedEnd.toISOString() : ""
        });

        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-sm space-y-4 pt-8 px-8 pb-4 rounded-xl">
                <DialogHeader>
                    <DialogTitle className="text-[18px] text-primary">Filter Custom Leases</DialogTitle>
                </DialogHeader>

                {/* Status */}
                <div className="space-y-2">
                    <label className="text-sm text-gray-600">Status</label>
                    <Select
                        value={status || "ALL"}
                        onValueChange={(value) => setStatus(value === "ALL" ? "" : value)}
                    >
                        <SelectTrigger className="w-full border rounded-md">
                            <SelectValue placeholder="All" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="EXPIRED">Expired</SelectItem>
                            <SelectItem value="TERMINATED">Terminated</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Range */}
                <div className="flex items-start gap-3">
                    {/* Start Date */}
                    <div className="space-y-2 w-1/2">
                        <label className="text-sm text-gray-600">Start Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal bg-primary-foreground px-3 ${!startDate ? "text-gray-400" : ""
                                        }`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={startDate}
                                    onSelect={(date) => {
                                        setStartDate(date);
                                        if (endDate && date > endDate) {
                                            setEndDate(null);
                                        }
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* End Date */}
                    <div className="space-y-2 w-1/2">
                        <label className="text-sm text-gray-600">End Date</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-start text-left font-normal bg-primary-foreground px-3 ${!endDate ? "text-gray-400" : ""
                                        }`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={endDate}
                                    onSelect={setEndDate}
                                    disabled={(date) => startDate && date < startDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-between gap-3 pt-3">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-1/2 rounded-xl bg-primary-foreground"
                    >
                        Reset
                    </Button>

                    <Button
                        onClick={applyFilters}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 w-1/2 rounded-xl"
                    >
                        Apply
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default FilterCustomLeaseDialog;

