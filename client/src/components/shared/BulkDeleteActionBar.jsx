import React from "react";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Reusable Bulk Delete Action Bar Component
 * 
 * @param {Object} props
 * @param {Array} props.selectedItems - Array of selected item IDs
 * @param {Function} props.onDelete - Function to call when delete is confirmed
 * @param {Function} props.onClearSelection - Function to clear selection
 * @param {string} props.resourceName - Name of the resource (e.g., "applications", "maintenance requests")
 * @param {boolean} props.isDeleting - Loading state for delete operation
 * @param {string} props.confirmMessage - Custom confirmation message
 */
const BulkDeleteActionBar = ({
  selectedItems = [],
  onDelete,
  onClearSelection,
  resourceName = "items",
  isDeleting = false,
  confirmMessage,
}) => {
  const [open, setOpen] = React.useState(false);

  const handleDelete = () => {
    onDelete(selectedItems);
    setOpen(false);
  };

  const selectedCount = selectedItems.length;
  const displayMessage =
    confirmMessage ||
    `Are you sure you want to delete ${selectedCount} ${resourceName}? This action cannot be undone.`;

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed z-50 left-0 right-0 bottom-20 md:left-[220px] md:right-0 md:max-w-[calc(100vw-220px)] md:bottom-[60px]">
        <div className="flex justify-center items-center px-4 md:px-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 rounded-lg shadow-lg px-4 py-3 flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedCount} {selectedCount === 1 ? resourceName.slice(0, -1) : resourceName} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
                disabled={isDeleting}
                className="rounded-lg text-xs sm:text-sm px-2 sm:px-3"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setOpen(true)}
                disabled={isDeleting}
                className="rounded-lg text-xs sm:text-sm px-2 sm:px-3"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                Delete {selectedCount}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:w-full sm:max-w-lg rounded-2xl sm:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">{displayMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="rounded-2xl text-xs sm:text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90 rounded-2xl text-xs sm:text-sm"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkDeleteActionBar;

