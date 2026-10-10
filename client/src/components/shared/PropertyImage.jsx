import { useState, useEffect } from "react";
import { Home } from "lucide-react";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";

const PropertyImage = ({ image, alt = "Property", className = "" }) => {
    const [resolvedSrc, setResolvedSrc] = useState();
    const [loading, setLoading] = useState(true);
    const [errored, setErrored] = useState(false);

    const rawSrc = image?.url || image;

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
            <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center ${className}`}>
                <Home className="w-12 h-12 text-gray-400" />
            </div>
        );
    }

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
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

export default PropertyImage;

