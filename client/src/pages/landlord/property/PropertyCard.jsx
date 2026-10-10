import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Home, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { getPropertyCategory, PROPERTY_CATEGORY_NAMES, PROPERTY_OPTIONS } from '@/constants/propertyTypes';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import API_ENDPOINTS from '@/lib/apiEndpoints';
import { Checkbox } from '@/components/ui/checkbox';

// Thumbnail with signed URL resolving + shimmer and graceful fallback
const ListingThumbnail = ({ images, alt }) => {
    const [resolvedSrc, setResolvedSrc] = useState();
    const [loading, setLoading] = useState(true);
    const [errored, setErrored] = useState(false);

    // Derive raw source from various shapes
    const rawSrc = (() => {
        if (!images) return undefined;
        if (typeof images === 'string') return images;
        if (Array.isArray(images) && images.length > 0) {
            const first = images[0];
            if (typeof first === 'string') return first;
            if (first && typeof first === 'object') {
                if (first instanceof File) return undefined;
                return first.url || first.fileUrl || first.src || undefined;
            }
        }
        return undefined;
    })();

    useEffect(() => {
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
                        // Keep loading true until image actually loads
                    }
                    return;
                }
                const key = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
                if (!key) {
                    if (!cancelled) {
                        setResolvedSrc(encodeURI(rawSrc));
                        // Keep loading true until image actually loads
                    }
                    return;
                }
                const resp = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { params: { key } });
                const signed = resp.data?.data?.downloadURL || resp.data?.downloadURL;
                if (!cancelled) {
                    setResolvedSrc(signed || encodeURI(rawSrc));
                    // Keep loading true until image actually loads
                }
            } catch {
                if (!cancelled) {
                    setResolvedSrc(encodeURI(rawSrc));
                    // Keep loading true until image actually loads
                }
            }
        }
        setLoading(true);
        setErrored(false);
        resolve();
        return () => { cancelled = true; };
    }, [rawSrc]);

    if (!rawSrc || errored) {
        return (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <Home className="w-12 h-12 text-gray-400" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Shimmer Loading State */}
            {loading && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 shimmer-container z-10">
                    <div className="shimmer-bar" />
                </div>
            )}
            {/* Image with Smooth Fade-in */}
            {resolvedSrc && (
                <img
                    src={resolvedSrc}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-500 ease-out ${
                        loading ? 'opacity-0' : 'opacity-100'
                    }`}
                    onLoad={() => setLoading(false)}
                    onError={() => { setErrored(true); setLoading(false); }}
                />
            )}
        </div>
    );
};

const PropertyCard = ({ property }) => {
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    
    const handleClick = () => {
        navigate(`/landlord/portfolio/${property.id}`);
    };

    const handleDropdownClick = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // Truncate title for mobile
    const truncateTitle = (text, maxLength = 35) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <Card onClick={handleClick} className="p-0 border border-gray-300 hover:shadow-md transition-shadow overflow-hidden">
            {/* Mobile: Collapsed Row View */}
            <div className="md:hidden">
                <div className="flex items-center p-3 gap-3">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 bg-gray-100 flex-shrink-0 rounded-lg overflow-hidden">
                        <ListingThumbnail images={property?.images} alt={property.title || property.name || 'Listing image'} />
                    </div>

                    {/* Title and Description (stacked) */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                        <h3 
                            className="font-semibold text-sm mb-0.5" 
                            title={property.title}
                        >
                            {truncateTitle(property.title)}
                        </h3>
                        <p 
                            className="text-xs text-gray-600 truncate"
                            title={property.streetAddress}
                        >
                            {property.streetAddress}
                        </p>
                    </div>

                    {/* Dropdown Icon */}
                    <button
                        onClick={handleDropdownClick}
                        className="flex-shrink-0 p-1"
                        aria-label="Toggle details"
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                    </button>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                    <div className="px-6  pb-3 border-gray-200 border-t-0 space-y-3 pt-3">
                        <div>
                            <p className="text-xs text-gray-600 mb-1">{property.zipCode}</p>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Left Column: Financial Info */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0">
                                        <DollarSign className="w-3 h-3" />
                                    </div>
                                    <p className="text-xs font-semibold">Financial</p>
                                </div>
                                <p className="text-xs">
                                    <span className="font-bold">Rent:</span> $ {property.rentAmount}
                                </p>
                                <p className="text-xs">
                                    <span className="font-bold">Deposit:</span> $ {property.securityDeposit}
                                </p>
                                {property.petDeposit > 0 && (
                                    <p className="text-xs">
                                        <span className="font-bold">Pet Deposit:</span> $ {property.petDeposit}
                                    </p>
                                )}
                            </div>

                            {/* Right Column: Property Type */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                        <Home className="w-4 h-4" />
                                    </div>
                                    <p className="text-xs font-semibold">Property</p>
                                </div>
                                <p className="text-xs">
                                    <span className="font-bold">
                                        {PROPERTY_CATEGORY_NAMES[getPropertyCategory(property.propertyType)]}:{" "}
                                    </span>
                                    {
                                        Object.values(PROPERTY_OPTIONS)
                                            .flat()
                                            .find((t) => t.value === property.propertyType)?.label || property.propertyType
                                    }
                                </p>
                                <p className="text-xs">
                                    <span className="font-bold">Size:</span> {property.totalSquareFeet} sq ft
                                </p>
                                {property.bedrooms && (
                                    <p className="text-xs">
                                        {property.bedrooms} Bedroom | {property.bathrooms} Bath
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex flex-row gap-4">
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    property.status === 'ACTIVE' 
                                        ? 'bg-green-500' 
                                        : 'bg-green-500/30'
                                }`}></div>
                                <span>listed</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                    property.status === 'RENTED' 
                                        ? 'bg-orange-500' 
                                        : 'bg-orange-500/30'
                                }`}></div>
                                <span>occupied</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop: Original Layout */}
            <div className="hidden md:flex flex-col md:flex-row">
                <div className="w-full md:w-48 h-28 bg-gray-100 flex-shrink-0 overflow-hidden">
                    <ListingThumbnail images={property?.images} alt={property.title || property.name || 'Listing image'} />
                </div>

                {/* Property Details */}
                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center p-4 gap-4 md:gap-6">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1">{property.title}</h3>
                        <p className="text-xs text-gray-600">{property.streetAddress}</p>
                        <p className="text-xs text-gray-600">{property.zipCode}</p>
                    </div>

                    {/* Financial Info */}
                    <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:justify-start">
                        <div className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm whitespace-nowrap">
                                <span className="font-bold">Rent:</span> $ {property.rentAmount}
                            </p>
                            <p className="text-sm whitespace-nowrap">
                                <span className="font-bold">Deposit:</span> $ {property.securityDeposit}
                            </p>
                            {property.petDeposit > 0 && (
                                <p className="text-sm whitespace-nowrap">
                                    <span className="font-bold">Pet Deposit:</span> $ {property.petDeposit}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Property Type */}
                    <div className="flex items-center gap-3 w-full md:w-auto md:flex-1 md:justify-start">
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            <Home className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm whitespace-nowrap">
                                <span className="font-bold">
                                    {PROPERTY_CATEGORY_NAMES[getPropertyCategory(property.propertyType)]}:{" "}
                                </span>
                                {
                                    // Find the matching label for this propertyType
                                    Object.values(PROPERTY_OPTIONS)
                                        .flat()
                                        .find((t) => t.value === property.propertyType)?.label || property.propertyType
                                }
                            </p>


                            <p className="text-sm whitespace-nowrap">
                                <span className="font-bold">Size:</span> {property.totalSquareFeet} sq ft
                            </p>
                            {property.bedrooms && (
                                <p className="text-sm whitespace-nowrap">
                                    {property.bedrooms} Bedroom | {property.bathrooms} Bath
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex flex-row md:flex-col gap-3 md:gap-2 w-full md:w-auto md:flex-1 md:justify-center">
                        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                property.status === 'ACTIVE' 
                                    ? 'bg-green-600' 
                                    : 'bg-green-500/10'
                            }`}></div>
                            <span>listed</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm whitespace-nowrap">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                property.status === 'RENTED' 
                                    ? 'bg-orange-600' 
                                    : 'bg-orange-500/10'
                            }`}></div>
                            <span>occupied</span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default PropertyCard;
