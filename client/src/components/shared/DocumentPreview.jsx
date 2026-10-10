import React, { useState, useRef, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable Document Preview Component
 * Supports both images and PDFs with horizontal slider
 * 
 * @param {Array} files - Array of File objects or file URLs
 * @param {Function} onRemove - Callback when a file is removed
 * @param {Function} onFileClick - Callback when file area is clicked (to trigger file input)
 * @param {string} inputId - ID for the hidden file input
 */
const DocumentPreview = ({ files = [], onRemove, onFileClick, inputId }) => {
  const [previewUrls, setPreviewUrls] = useState([]);
  const sliderRef = useRef(null);

  useEffect(() => {
    // Create preview URLs for files
    const urls = files.map((file) => {
      if (typeof file === 'string') {
        // Already a URL
        return { url: file, name: file, type: 'url' };
      } else {
        // File object - create object URL
        return {
          url: URL.createObjectURL(file),
          name: file.name,
          type: file.type,
          file: file,
        };
      }
    });

    setPreviewUrls(urls);

    // Cleanup function
    return () => {
      urls.forEach((item) => {
        if (item.type !== 'url' && item.url) {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [files]);

  const handleRemove = (index) => {
    const item = previewUrls[index];
    if (item && item.type !== 'url' && item.url) {
      URL.revokeObjectURL(item.url);
    }
    if (onRemove) {
      onRemove(index);
    } else {
      // If no onRemove callback, just remove from preview
      setPreviewUrls((prev) => {
        const newUrls = [...prev];
        const removed = newUrls.splice(index, 1)[0];
        if (removed && removed.type !== 'url' && removed.url) {
          URL.revokeObjectURL(removed.url);
        }
        return newUrls;
      });
    }
  };

  const canScroll = previewUrls.length > 1;
  const scrollBy = 220;

  const scrollLeft = () => {
    sliderRef.current?.scrollBy({ left: -scrollBy, behavior: "smooth" });
  };

  const scrollRight = () => {
    sliderRef.current?.scrollBy({ left: scrollBy, behavior: "smooth" });
  };

  if (previewUrls.length === 0) {
    return null;
  }

  const isImage = (type) => {
    if (typeof type === 'string') {
      return type.startsWith('image/');
    }
    // For URLs, try to detect from extension or assume image if no extension
    return true; // Default to image for URLs
  };

  const isPDF = (type, name) => {
    if (typeof type === 'string') {
      return type === 'application/pdf';
    }
    // For URLs, check extension
    return name?.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Scroll buttons */}
        {canScroll && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
              onClick={scrollLeft}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white"
              onClick={scrollRight}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Preview slider */}
        <div
          ref={sliderRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          onClick={(e) => {
            if (onFileClick && e.target === e.currentTarget) {
              onFileClick();
            }
          }}
        >
          {previewUrls.map((item, index) => (
            <div
              key={index}
              className="relative flex-shrink-0 w-52 h-36 border rounded-lg overflow-hidden bg-gray-100 group"
              onClick={(e) => {
                e.stopPropagation();
                if (onFileClick) {
                  onFileClick();
                }
              }}
            >
              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 z-10 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* Preview content */}
              {isImage(item.type) ? (
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover cursor-pointer"
                />
              ) : isPDF(item.type, item.name) ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 px-2 text-center truncate w-full">
                    {item.name}
                  </p>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View PDF
                  </a>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
                  <FileText className="h-12 w-12 text-gray-400 mb-2" />
                  <p className="text-xs text-gray-600 px-2 text-center truncate w-full">
                    {item.name}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* File names list */}
      <div className="text-sm text-gray-600">
        <p className="font-medium mb-1">Selected files ({previewUrls.length}):</p>
        <ul className="list-disc list-inside space-y-1">
          {previewUrls.map((item, index) => (
            <li key={index} className="text-xs">
              {item.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default DocumentPreview;

