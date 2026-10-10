import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersVertical, X } from "lucide-react";

const MaintenanceFilters = ({ search, onSearchChange, onFilterClick }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center border rounded-md px-3 h-12 w-90">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search"
            className="border-0 focus-visible:ring-0 h-full"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-12 flex items-center justify-center"
          onClick={() => onFilterClick("filters")}
        >
          <SlidersVertical className="size-4 mr-2" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => onFilterClick("urgent")}
        >
          Urgent <X className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => onFilterClick("property")}
        >
          Property Title <X className="w-3 h-3" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => onFilterClick("recent")}
        >
          Requests in 30 days <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default MaintenanceFilters;
