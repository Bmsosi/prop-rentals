import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";

export default function PhotoUploadSection({ images = [], onImagesChange, disabled }) {
    const fileInputRef = useRef(null);
    const sliderRef = useRef(null);
    const [previewUrls, setPreviewUrls] = useState([]);

    // Handle both File objects and URLs with S3 URL resolution
    useEffect(() => {
        let cancelled = false;
        const objectUrlsToRevoke = [];

        async function processImages() {
            const processedUrls = await Promise.all(
                images.map(async (img) => {
            if (img instanceof File) {
                        const objectUrl = URL.createObjectURL(img);
                        objectUrlsToRevoke.push(objectUrl);
                        return { url: objectUrl, file: img, type: 'file' };
            } else if (typeof img === 'string') {
                        // Check if it's an S3 URL that needs signing
                        try {
                            const u = new URL(img);
                            const isS3Unsigned = u.hostname.includes('s3.') && !img.includes('X-Amz-Signature');
                            if (isS3Unsigned) {
                                const key = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                                if (key && !cancelled) {
                                    try {
                                        const resp = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { params: { key } });
                                        const signed = resp.data?.data?.downloadURL || resp.data?.downloadURL;
                                        return { url: signed || img, file: null, type: 'url' };
                                    } catch (error) {
                                        console.error('Error resolving S3 URL:', error);
                                        return { url: img, file: null, type: 'url' };
                                    }
                                }
                            }
                        } catch (error) {
                            // Not a valid URL, use as-is
                        }
                return { url: img, file: null, type: 'url' };
                    } else if (img && typeof img === 'object') {
                        // Handle image objects with url property
                        const url = img.url || img.fileUrl || img.src;
                        if (url && typeof url === 'string') {
                            // Check if it's an S3 URL that needs signing
                            try {
                                const u = new URL(url);
                                const isS3Unsigned = u.hostname.includes('s3.') && !url.includes('X-Amz-Signature');
                                if (isS3Unsigned) {
                                    const key = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                                    if (key && !cancelled) {
                                        try {
                                            const resp = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { params: { key } });
                                            const signed = resp.data?.data?.downloadURL || resp.data?.downloadURL;
                                            return { url: signed || url, file: null, type: 'url' };
                                        } catch (error) {
                                            console.error('Error resolving S3 URL:', error);
                                            return { url: url, file: null, type: 'url' };
                                        }
                                    }
                                }
                            } catch (error) {
                                // Not a valid URL, use as-is
                            }
                            return { url: url, file: null, type: 'url' };
                        }
                    }
                    return null;
                })
            );

            if (!cancelled) {
                setPreviewUrls(processedUrls.filter(Boolean));
            }
        }

        processImages();

        // Cleanup function
        return () => {
            cancelled = true;
            // Revoke all object URLs created in this effect
            objectUrlsToRevoke.forEach((url) => {
                URL.revokeObjectURL(url);
            });
        };
    }, [images]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Limit to maximum 3 files
        const MAX_FILES = 3;
        const currentCount = images.length;
        const remainingSlots = MAX_FILES - currentCount;
        
        if (remainingSlots <= 0) {
            // Already at max, don't add more
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const filesToAdd = files.slice(0, remainingSlots);
        const newImages = [...images, ...filesToAdd];
        onImagesChange(newImages);

        // Reset input to allow selecting same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemove = (index) => {
        const item = previewUrls[index];
        if (item && item.type === 'file' && item.url) {
            URL.revokeObjectURL(item.url);
        }

        // Remove from images array
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
    };

    const canScroll = previewUrls.length > 1;
    const scrollBy = 220;
    const scrollLeft = () => sliderRef.current?.scrollBy({ left: -scrollBy, behavior: "smooth" });
    const scrollRight = () => sliderRef.current?.scrollBy({ left: scrollBy, behavior: "smooth" });

    return (
        <div className="w-full space-y-4">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                id="property-photo-input"
                name="photos"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
                multiple
                disabled={disabled}
            />

            {/* Upload placeholder - shown when no images or when under max */}
            {previewUrls.length < 3 && (
                <label
                    htmlFor="property-photo-input"
                    className="border-2 border-dashed border-gray-400 rounded-lg flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-gray-50 transition-colors bg-card"
                >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600">Click to upload photos (Max 3)</span>
                    {previewUrls.length > 0 && (
                        <span className="text-xs text-gray-500 mt-1">
                            {previewUrls.length} of 3 uploaded
                        </span>
                    )}
                </label>
            )}

            {/* Image preview slider - shown when images exist */}
            {previewUrls.length > 0 && (
                <div className="relative">
                    {/* Left scroll button */}
                    {canScroll && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-primary-foreground shadow-md"
                            onClick={scrollLeft}
                            disabled={disabled}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Image slider */}
                    <div
                        ref={sliderRef}
                        className={`flex gap-4 overflow-x-auto scrollbar-hide ${canScroll ? 'px-10' : ''}`}
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {previewUrls.map((item, index) => (
                            <div
                                key={index}
                                className="relative flex-shrink-0 w-52 h-36 border rounded-lg overflow-hidden bg-gray-100 group"
                                onClick={() => {
                                    if (!disabled && fileInputRef.current) {
                                        fileInputRef.current.click();
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
                                    disabled={disabled}
                                >
                                    <X className="h-3 w-3" />
                                </Button>

                                {/* Image preview */}
                                <img
                                    src={item.url}
                                    alt={`Property photo ${index + 1}`}
                                    className="w-full h-full object-cover cursor-pointer"
                                />
                            </div>
                        ))}
                    </div>

                    {/* Right scroll button */}
                    {canScroll && (
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-primary-foreground text-primary shadow-md"
                            onClick={scrollRight}
                            disabled={disabled}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}

                    {/* Add more photos button */}
                    {previewUrls.length < 3 && (
                    <div className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                                disabled={disabled || previewUrls.length >= 3}
                            className="w-full bg-card"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                                Add More Photos ({previewUrls.length}/3)
                        </Button>
                    </div>
                    )}
                    {previewUrls.length >= 3 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            Maximum of 3 photos reached.
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}