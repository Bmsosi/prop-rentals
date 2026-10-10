// components/maintenance/MaintenanceSearchBar.jsx
import { Search, SlidersHorizontal, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import React, { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAINTENANCE_PRIORITY, MAINTENANCE_CATEGORY } from "@/lib/maintenanceApi";

export default function MaintenanceSearchBar({
    search,
    setSearch,
    onFilter,
    onNewRequest,
    chips = [],
    removeChip,
    currentFilters = {},
    disabled = false,
    showCreateButton = true
}) {
    // Debug logging
    console.log('MaintenanceSearchBar - showCreateButton prop:', showCreateButton);
    console.log('MaintenanceSearchBar - will render button?', showCreateButton);
    
    // local modal state (lightweight, instant open)
    const [open, setOpen] = useState(false);
    const [priority, setPriority] = useState("");
    const [category, setCategory] = useState("");

    // Treat incoming chips as initially active chips
    const initialActive = useMemo(() => new Set(chips), [chips]);
    const [activeChips, setActiveChips] = useState(initialActive);

    const toggleChip = (label) => {
        setActiveChips((prev) => {
            const next = new Set(prev);
            const willActivate = !next.has(label);
            if (willActivate) {
                next.add(label);
            } else {
                next.delete(label);
            }
            // Defer parent callbacks out of the setState to avoid updating parent during render
            queueMicrotask(() => {
                if (!willActivate) {
                    if (typeof removeChip === "function") removeChip(label);
                }
                if (typeof onFilter === "function") onFilter({ chip: label, active: willActivate });
            });
            return next;
        });
    };

    const resetChipsToDefault = () => {
        setActiveChips(new Set());
        queueMicrotask(() => {
            // Only reset chip-related filters; preserve modal select state until explicit Reset
            if (typeof onFilter === "function") {
                onFilter({ chip: "Requests in 7 days", active: false });
                onFilter({ chip: "Requests in 30 days", active: false });
                onFilter({ chip: "Today", active: false });
            }
        });
    };
    return (
        <>
        <div className="flex flex-col gap-3 mb-6">

            {/* Top Row */}
            <div className="flex flex-col md:flex-row gap-3 md:justify-between items-start md:items-center">

                {/* Search + Filter + Chips */}
                <div className="flex flex-col md:flex-row gap-3 flex-1 w-full">
                    {/* Search + Filter on one line for mobile, all together on desktop */}
                    <div className="flex justify-between md:justify-start gap-4 md:gap-3 w-full md:w-auto items-center">
                        {/* Search */}
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Search.."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-primary-foreground border-gray-300 text-xs md:text-sm"
                            />
                        </div>

                        {/* Filter */}
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-gray-200 bg-primary-foreground flex-shrink-0"
                            onClick={() => {
                                // Clear any active chips when opening modal
                                resetChipsToDefault();
                                // initialize from current filters
                                const cf = currentFilters || {};
                                setPriority(cf.priority || "");
                                setCategory(cf.category || "");
                                setOpen(true);
                            }}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                        </Button>

                        {/* Chips on same line for desktop */}
                        <div className="hidden md:flex gap-2 items-center flex-nowrap overflow-x-auto">
                            {/* Toggle Chips */}
                            {["Today", "Requests in 7 days", "Requests in 30 days"].map((label) => {
                                const active = activeChips.has(label);
                                return (
                                    <Badge
                                        key={label}
                                        variant={active ? "default" : "secondary"}
                                        className={`px-3 py-2 cursor-pointer whitespace-nowrap flex-shrink-0 border ${active ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                                        onClick={() => {
                                            // toggling a chip calls onFilter for chip only
                                            toggleChip(label);
                                        }}
                                    >
                                        {label}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>

                    {/* Chips on next line for mobile only */}
                    <div className="flex md:hidden gap-2 items-center flex-nowrap overflow-x-auto">
                        {/* Toggle Chips */}
                        {["Today", "Requests in 7 days", "Requests in 30 days"].map((label) => {
                            const active = activeChips.has(label);
                            return (
                                <Badge
                                    key={label}
                                    variant={active ? "default" : "secondary"}
                                    className={`px-3 py-2 cursor-pointer whitespace-nowrap flex-shrink-0 border ${active ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}
                                    onClick={() => {
                                        // toggling a chip calls onFilter for chip only
                                        toggleChip(label);
                                    }}
                                >
                                    {label}
                                </Badge>
                            );
                        })}
                    </div>
                </div>

                {/* Right side button */}
                {showCreateButton && (
                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        <Button
                            className="hidden md:flex rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90"
                            onClick={onNewRequest}
                            disabled={disabled}
                            title={disabled ? "Your lease has been terminated. Maintenance requests are no longer available." : ""}
                        >
                            <Plus className="w-4 h-4 mr-2 text-primary-foreground" />
                            New Request
                        </Button>
                    </div>
                )}
            </div>
        </div>
        {/* Filter Modal (simple, no loading) */}
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="bg-background rounded-xl pt-8 px-8 pb-6">
                <DialogHeader>
                    <DialogTitle>Filters</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 mt-2">
                    <div>
                        <label className="block text-sm font-medium mb-1">Priority</label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Any priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANY">Any</SelectItem>
                                <SelectItem value={MAINTENANCE_PRIORITY.URGENT}>Urgent</SelectItem>
                                <SelectItem value={MAINTENANCE_PRIORITY.HIGH}>Important</SelectItem>
                                <SelectItem value={MAINTENANCE_PRIORITY.MEDIUM}>Normal</SelectItem>
                                <SelectItem value={MAINTENANCE_PRIORITY.LOW}>Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Any category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ANY">Any</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.PLUMBING}>Plumbing</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.ELECTRICAL}>Electrical</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.HVAC}>HVAC</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.APPLIANCE}>Appliance</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.STRUCTURAL}>Structural</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.PEST_CONTROL}>Pest Control</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.CLEANING}>Cleaning</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.LANDSCAPING}>Landscaping</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.SECURITY}>Security</SelectItem>
                                <SelectItem value={MAINTENANCE_CATEGORY.OTHER}>Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => {
                            setPriority("");
                            setCategory("");
                            if (typeof onFilter === "function") onFilter({ priority: "", category: "" });
                            setOpen(false);
                        }}
                        className="rounded-2xl bg-primary-foreground"
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={() => {
                            const normalized = {
                                priority: priority === "ANY" ? "" : priority,
                                category: category === "ANY" ? "" : category,
                            };
                            if (typeof onFilter === "function") onFilter(normalized);
                            setOpen(false);
                        }}
                        className="rounded-2xl"
                    >
                        Apply
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
