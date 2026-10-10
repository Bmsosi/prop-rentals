import React from "react";
import { Search, Plus, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const StandardLeaseSearchBar = ({
    searchQuery,
    setSearchQuery,
    onNewLease,
    onFilterClick,
    filters,
    onResetFilters
}) => {
    const hasActiveFilters = filters.status || filters.startDate || filters.endDate;

    return (
        <div className="flex flex-col gap-3 mb-6 pt-2">
            {/* Top Row */}
            <div className="flex flex-col md:flex-row md:justify-between items-center">
                {/* Search + Filter */}
                <div className="flex justify-between md:justify-start gap-4 md:gap-3 w-full md:max-w-md items-center flex-wrap">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by property, tenant, or landlord..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-primary-foreground border-gray-300 text-xs md:text-sm"
                        />
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        className="border-gray-200 bg-primary-foreground flex-shrink-0"
                        onClick={onFilterClick}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                    </Button>
                </div>

                {/* Right side button */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <Button
                        className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                        onClick={onNewLease}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Lease
                    </Button>
                </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-600">Active filters:</span>
                    {filters.status && (
                        <Badge variant="secondary" className="gap-1">
                            Status: {filters.status}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => onResetFilters()}
                            />
                        </Badge>
                    )}
                    {filters.startDate && (
                        <Badge variant="secondary" className="gap-1">
                            From: {new Date(filters.startDate).toLocaleDateString()}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => onResetFilters()}
                            />
                        </Badge>
                    )}
                    {filters.endDate && (
                        <Badge variant="secondary" className="gap-1">
                            To: {new Date(filters.endDate).toLocaleDateString()}
                            <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => onResetFilters()}
                            />
                        </Badge>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onResetFilters}
                        className="h-6 text-xs"
                    >
                        Clear all
                    </Button>
                </div>
            )}
        </div>
    );
};

export default StandardLeaseSearchBar;

