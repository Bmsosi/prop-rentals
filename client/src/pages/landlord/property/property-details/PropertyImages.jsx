import React, { useState, useEffect } from 'react';
import { Home, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Component to handle individual image with S3 signed URL resolution
const PropertyImage = ({ imageData, alt, className, overlayOpacity = 0, isPlaceholder = false }) => {
    const [resolvedSrc, setResolvedSrc] = useState();
    const [loading, setLoading] = useState(true);
    const [errored, setErrored] = useState(false);

    // Extract URL from various data shapes
    const rawSrc = (() => {
        if (!imageData) return undefined;
        if (typeof imageData === 'string') return imageData;
        if (typeof imageData === 'object') {
            return imageData.url || imageData.fileUrl || imageData.src || undefined;
        }
        return undefined;
    })();

    useEffect(() => {
        // Skip resolution for placeholder
        if (isPlaceholder) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        async function resolve() {
            if (!rawSrc) {
                setResolvedSrc(undefined);
                setLoading(false);
                return;
            }
            try {
                const u = new URL(rawSrc);
                const isS3Unsigned = u.hostname.includes('s3.') && !rawSrc.includes('X-Amz-Signature');
                if (!isS3Unsigned) {
                    if (!cancelled) {
                        setResolvedSrc(encodeURI(rawSrc));
                        setLoading(false);
                    }
                    return;
                }
                const key = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                if (!key) {
                    if (!cancelled) {
                        setResolvedSrc(encodeURI(rawSrc));
                        setLoading(false);
                    }
                    return;
                }
                const resp = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { params: { key } });
                const signed = resp.data?.data?.downloadURL || resp.data?.downloadURL;
                if (!cancelled) {
                    setResolvedSrc(signed || encodeURI(rawSrc));
                    setLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setResolvedSrc(encodeURI(rawSrc));
                    setLoading(false);
                }
            }
        }
        setLoading(true);
        setErrored(false);
        resolve();
        return () => { cancelled = true; };
    }, [rawSrc, isPlaceholder]);

    // Placeholder card design
    if (isPlaceholder || !rawSrc || errored) {
        return (
            <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center ${className}`}>
                <Home className="w-16 h-16 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm font-medium">No Image</p>
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full ${className}`}>
            {loading && (
                <div className="absolute inset-0 animate-pulse bg-gray-200" />
            )}
            <img
                src={resolvedSrc}
                alt={alt}
                className="w-full h-full object-cover"
                onLoad={() => setLoading(false)}
                onError={() => { setErrored(true); setLoading(false); }}
            />
            {overlayOpacity > 0 && (
                <div className="absolute inset-0" style={{ backgroundColor: `rgba(255, 255, 255, ${overlayOpacity})` }}></div>
            )}
        </div>
    );
};

// Component for lightbox - displays full-size images
const LightboxImage = ({ imageData, alt }) => {
    const [resolvedSrc, setResolvedSrc] = useState();
    const [urlLoading, setUrlLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [errored, setErrored] = useState(false);

    const rawSrc = (() => {
        if (!imageData) return undefined;
        if (typeof imageData === 'string') return imageData;
        if (typeof imageData === 'object') {
            return imageData.url || imageData.fileUrl || imageData.src || undefined;
        }
        return undefined;
    })();

    useEffect(() => {
        let cancelled = false;
        setImageLoaded(false);
        
        async function resolve() {
            if (!rawSrc) {
                setResolvedSrc(undefined);
                setUrlLoading(false);
                return;
            }
            try {
                const u = new URL(rawSrc);
                const isS3Unsigned = u.hostname.includes('s3.') && !rawSrc.includes('X-Amz-Signature');
                if (!isS3Unsigned) {
                    if (!cancelled) {
                        setResolvedSrc(encodeURI(rawSrc));
                        setUrlLoading(false);
                    }
                    return;
                }
                const key = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                if (!key) {
                    if (!cancelled) {
                        setResolvedSrc(encodeURI(rawSrc));
                        setUrlLoading(false);
                    }
                    return;
                }
                const resp = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { params: { key } });
                const signed = resp.data?.data?.downloadURL || resp.data?.downloadURL;
                if (!cancelled) {
                    setResolvedSrc(signed || encodeURI(rawSrc));
                    setUrlLoading(false);
                }
            } catch {
                if (!cancelled) {
                    setResolvedSrc(encodeURI(rawSrc));
                    setUrlLoading(false);
                }
            }
        }
        setUrlLoading(true);
        setErrored(false);
        resolve();
        return () => { cancelled = true; };
    }, [rawSrc]);

    if (!rawSrc || errored) {
        return (
            <div className="flex items-center justify-center bg-gray-800 rounded-lg w-full max-w-[900px] h-[200px] sm:h-[400px] md:h-[600px]">
                <Home className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 text-gray-400" />
            </div>
        );
    }

    const isLoading = urlLoading || !imageLoaded;

    return (
        <div className="relative w-full max-w-[900px] h-[200px] sm:h-[400px] md:h-[600px] flex items-center justify-center">
            {/* Shimmer shown while loading */}
            {isLoading && (
                <div className="shimmer-container absolute inset-0 bg-gray-800 rounded-lg">
                    <div className="shimmer-bar" style={{
                        backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)'
                    }}/>
                </div>
            )}
            
            {/* Image - hidden until loaded */}
            {resolvedSrc && (
                <img
                    src={resolvedSrc}
                    alt={alt}
                    className={`max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300 ${
                        isLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => { 
                        setErrored(true); 
                        setUrlLoading(false); 
                        setImageLoaded(true); 
                    }}
                />
            )}
        </div>
    );
};

const PropertyImages = ({ images = [] }) => {
  // Get first 3 images max from uploaded images
  const imageArray = Array.isArray(images) ? images.slice(0, 3) : [];
  const totalCount = Array.isArray(images) ? images.length : 0;
  const allImages = Array.isArray(images) ? images : [];

  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Create array of 3 items, marking which are placeholders
  const displayImages = [
    { data: imageArray[0], isPlaceholder: !imageArray[0] },
    { data: imageArray[1], isPlaceholder: !imageArray[1] },
    { data: imageArray[2], isPlaceholder: !imageArray[2] },
  ];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? totalCount - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === totalCount - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
    if (e.key === 'Escape') setShowLightbox(false);
  };

  return (
    <>
      <div className="relative h-full w-full">
        {/* Third image - Bottom layer */}
        <div 
          className="absolute top-0 right-0 w-[85%] h-[100%] rounded-2xl overflow-hidden border-4 border-white"
          style={{ zIndex: 1 }}
        >
          <PropertyImage 
            imageData={displayImages[2].data} 
            alt="Property interior" 
            overlayOpacity={0.5}
            isPlaceholder={displayImages[2].isPlaceholder}
          />
        </div>

        {/* Second image - Middle layer */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-[100%] rounded-2xl overflow-hidden border-4 border-white"
          style={{ zIndex: 2 }}
        >
          <PropertyImage 
            imageData={displayImages[1].data} 
            alt="Property view" 
            overlayOpacity={0.5}
            isPlaceholder={displayImages[1].isPlaceholder}
          />
        </div>

        {/* First image - Top layer */}
        <div 
          className="absolute top-0 left-0 w-[85%] h-[100%] rounded-2xl overflow-hidden border-4 border-white"
          style={{ zIndex: 3 }}
        >
          <PropertyImage 
            imageData={displayImages[0].data} 
            alt="Property exterior" 
            overlayOpacity={0}
            isPlaceholder={displayImages[0].isPlaceholder}
          />
        </div>

        {/* Image count badge - clickable to open gallery */}
        {totalCount > 0 && (
          <button
            onClick={() => {
              setCurrentImageIndex(0);
              setShowLightbox(true);
            }}
            className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white px-3 py-1.5 rounded-full text-sm font-medium z-10 transition-colors cursor-pointer"
          >
            {totalCount} {totalCount === 1 ? 'Photo' : 'Photos'}
          </button>
        )}
      </div>

      {/* Photo Gallery Lightbox */}
      {totalCount > 0 && (
        <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
          <DialogContent 
            className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:w-full sm:max-w-[1100px] bg-black/85 border-0 p-4 sm:p-6 md:p-10 pb-6 sm:pb-8 md:pb-12 rounded-xl"
            showCloseButton={false}
          >
            <div className="flex flex-col items-center gap-2 sm:gap-4" onKeyDown={handleKeyDown}>
              {/* Top controls */}
              <div className="flex items-center justify-between w-full">
                {/* Image counter */}
                <div className="bg-white/10 text-white px-2 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm font-medium">
                  {currentImageIndex + 1} / {totalCount}
                </div>
                
                {/* Close button */}
                <button
                  onClick={() => setShowLightbox(false)}
                  className="bg-white/10 hover:bg-white/20 text-white p-1.5 sm:p-2 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Image area with navigation */}
              <div className="flex items-center justify-center gap-2 sm:gap-4 w-full">
                {/* Previous button */}
                {totalCount > 1 && (
                  <button
                    onClick={handlePrevImage}
                    className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white p-2 sm:p-3 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  </button>
                )}

                {/* Current image */}
                <div className="flex-1 flex items-center justify-center min-w-0">
                  <LightboxImage
                    imageData={allImages[currentImageIndex]}
                    alt={`Property image ${currentImageIndex + 1}`}
                  />
                </div>

                {/* Next button */}
                {totalCount > 1 && (
                  <button
                    onClick={handleNextImage}
                    className="flex-shrink-0 bg-white/10 hover:bg-white/20 text-white p-2 sm:p-3 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 md:w-8 md:h-8" />
                  </button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PropertyImages;