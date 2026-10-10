// components/leases/LeaseSearchBar.jsx
import { Search, SlidersHorizontal, Plus, X, User2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function LeaseSearchBar({
    search,
    setSearch,
    onFilter,
    onNewLease,
    onMyLeases,
    chips = [],
    removeChip,
    buttonText = "New Lease"
}) {
    return (
        <div className="flex flex-col gap-3 my-4 pt-2">

            {/* Top Row */}
            <div className="flex flex-col md:flex-row gap-3 md:justify-between items-center">

                {/* Search + Filter + Chips */}
                <div className="flex gap-3 flex-1 md:max-w-md items-center flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search.."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-primary-foreground border-gray-300"
                        />
                    </div>

                    {/* Filter button */}
                    <Button variant="outline" size="icon" className="bg-primary-foreground" onClick={onFilter}>
                        <SlidersHorizontal className="w-4 h-4" />
                    </Button>

                    {/* Chips (now beside filter) */}
                    {chips.map((label) => (
                        <Badge
                            key={label}
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1"
                        >
                            {label}
                            <button
                                onClick={() => removeChip(label)}
                                className="rounded hover:bg-muted/60"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>

                {/* Right side buttons */}
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                        onClick={onMyLeases}
                    >
                        <User2 className="mr-2 h-4 w-4" />
                        My Leases
                    </Button>

                    <Button
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                        onClick={onNewLease}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {buttonText}
                    </Button>
                </div>
            </div>
        </div>
    );
}
