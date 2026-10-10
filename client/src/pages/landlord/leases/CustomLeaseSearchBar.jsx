import React from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CustomLeaseSearchBar = ({
    searchQuery,
    setSearchQuery,
    onCreateNew,
    onFilter
}) => (
    <div className="flex flex-col gap-3 mb-6 pt-2">
        {/* Top Row */}
        <div className="flex flex-col md:flex-row md:justify-between items-center">
            {/* Search + Filter */}
            <div className="flex justify-between md:justify-start gap-4 md:gap-3 w-full md:max-w-md items-center flex-wrap">
                <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search by lease name, listing, or tenant..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-primary-foreground border-gray-300 text-xs md:text-sm"
                    />
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="border-gray-200 bg-primary-foreground flex-shrink-0"
                    onClick={onFilter}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                </Button>
            </div>

            {/* Right side button */}
            <div className="flex gap-2 w-full md:w-auto justify-end">
                <Button
                    className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                    onClick={onCreateNew}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Lease
                </Button>
            </div>
        </div>
    </div>
);

export default CustomLeaseSearchBar;

