import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const PropertyDescription = ({ description }) => {
    const [isTruncated, setIsTruncated] = useState(false);
    const [showFullDialog, setShowFullDialog] = useState(false);
    const descriptionRef = useRef(null);

    useEffect(() => {
        if (descriptionRef.current) {
            // Check if content exceeds 3 lines (approximately 72px with line-height)
            const lineHeight = 24; // Approximate line height
            const maxLines = 3;
            const maxHeight = lineHeight * maxLines;
            
            if (descriptionRef.current.scrollHeight > maxHeight) {
                setIsTruncated(true);
            }
        }
    }, [description]);

    return (
        <>
            <div className="bg-card rounded-2xl p-6">
                <h2 className="text-lg sm:text-xl md:text-[24px] font-bold mb-4 text-primary">Description</h2>
                <div className="relative">
                    <p 
                        ref={descriptionRef}
                        className={`text-gray-700 leading-relaxed text-sm sm:text-base md:text-[16px] ${
                            isTruncated ? 'line-clamp-3' : ''
                        }`}
                    >
                        {description}
                    </p>
                    {isTruncated && (
                        <button
                            onClick={() => setShowFullDialog(true)}
                            className="text-blue-600 hover:text-blue-700 font-medium mt-2 text-sm sm:text-base md:text-[16px]"
                        >
                            Read more...
                        </button>
                    )}
                </div>
            </div>

            {/* Full Description Dialog */}
            <Dialog open={showFullDialog} onOpenChange={setShowFullDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl md:text-[24px] font-bold">Full Description</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base md:text-[16px] whitespace-pre-wrap">
                            {description}
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PropertyDescription;