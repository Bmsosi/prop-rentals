import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";

const Pagination = ({ page, totalPages, totalItems, onPageChange }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2 sm:gap-2 mb-4">
            <div className="text-gray-600 font-semibold text-xs sm:text-sm md:text-md text-center sm:text-left">
                Showing page {page} of {totalPages} — Total: {totalItems}
            </div>
            <div className="flex gap-1.5 sm:gap-2 items-center">
                <Button
                    className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-2xl disabled:opacity-50 ${page > 1 ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Previous</span>
                </Button>

                <span className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium">
                    {page} / {totalPages}
                </span>

                <Button
                    className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm rounded-2xl disabled:opacity-50 ${page < totalPages ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                >
                    <span className="hidden sm:inline">Next </span><ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
            </div>
        </div>
    );
};

export default Pagination;
