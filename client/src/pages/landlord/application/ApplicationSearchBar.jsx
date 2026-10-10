import React from "react";
import { Search, Plus, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ApplicationSearchBar = ({
    searchQuery,
    setSearchQuery,
    onGenerateLink,
    onFilter
}) => (
    <div className="flex flex-col md:flex-row gap-3 mb-6 md:justify-between">
        {/* Search + Filter */}
        <div className="flex gap-3 flex-1 md:max-w-md">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder="Search.."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-primary-foreground border-gray-300 text-xs md:text-sm"
                />
            </div>

            <Button
                variant="outline"
                size="icon"
                className="border-gray-200 bg-primary-foreground"
                onClick={onFilter}
            >
                <SlidersHorizontal className="w-4 h-4" />
            </Button>

        </div>

        {/* Generate Link button */}
        <Button
            className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            onClick={onGenerateLink}
        >
            <Plus className="w-4 h-4 mr-2" />
            Create Application Link
        </Button>
    </div>
);

export default ApplicationSearchBar;
