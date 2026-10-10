// SignLeasePage.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import SignaturePad from "react-signature-pad-wrapper";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { Button } from "@/components/ui/button";
import { FileEdit, CheckCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function SignLeasePage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user, isLoading } = useAuthStore();

    const sigPadRef = useRef(null);
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAlreadySigned, setIsAlreadySigned] = useState(false);
    const [isLoadingInvite, setIsLoadingInvite] = useState(true);
    const [leaseInfo, setLeaseInfo] = useState(null);
    const [signedPdfUrl, setSignedPdfUrl] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [pdfError, setPdfError] = useState(null);

    // Fetch lease info and check if already signed
    useEffect(() => {
        const fetchLeaseInfo = async () => {
            try {
                const res = await api.get(`${API_ENDPOINTS.LEASES_INVITE.BASE}/invite/${token}`);
                const invite = res.data.invite;
                
                if (invite?.signed) {
                    setIsAlreadySigned(true);
                    setIsLoadingInvite(false);
                    return;
                }
                
                setLeaseInfo(invite);
                
                // Get the PDF URL based on lease type
                let pdfUrl = null;
                if (invite.leaseType === "CUSTOM" && invite.lease?.fileUrl) {
                    pdfUrl = invite.lease.fileUrl;
                } else if (invite.leaseType === "STANDARD" && invite.lease?.contractPdfUrl) {
                    pdfUrl = invite.lease.contractPdfUrl;
                }
                
                // If we have a PDF URL, get signed URL if it's S3
                if (pdfUrl) {
                    try {
                        const url = new URL(pdfUrl);
                        const isS3 = url.hostname.includes('s3.') || url.hostname.includes('amazonaws.com');
                        
                        if (isS3) {
                            const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                            const signedRes = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, { 
                                params: { key } 
                            });
                            setSignedPdfUrl(signedRes.data?.data?.downloadURL || signedRes.data?.downloadURL);
                        } else {
                            setSignedPdfUrl(pdfUrl);
                        }
                    } catch (urlError) {
                        // Not a valid URL, use directly
                        setSignedPdfUrl(pdfUrl);
                    }
                }
                
            } catch (err) {
                // If error is about already signed, show that message
                if (err.response?.data?.message?.includes("already been signed")) {
                    setIsAlreadySigned(true);
                } else {
                    toast.error(err.response?.data?.message || "Failed to load lease information");
                }
            } finally {
                setIsLoadingInvite(false);
            }
        };

        if (token) {
            fetchLeaseInfo();
        }
    }, [token]);

    useEffect(() => {
        if (isLoading) return;

        if (!user) {
            navigate(`/signup?redirect=/leases-invite/sign/${token}`);
        }
    }, [isLoading, user, navigate, token]);

    const handleSubmit = async () => {
        if (!sigPadRef.current) {
            return toast.error("Signature pad not ready.");
        }

        if (sigPadRef.current.isEmpty()) {
            return toast.error("Please provide your signature.");
        }

        if (!user?.id) {
            return toast.error("You must be logged in to sign the lease.");
        }

        setIsSubmitting(true);

        try {
            // Get data URL of the signature
            const signatureDataURL = sigPadRef.current.toDataURL("image/png");

            // Send to backend with userId
            await api.post(`${API_ENDPOINTS.LEASES_INVITE.BASE}/sign/${token}`, {
                userId: user.id,
                signature: signatureDataURL,
            });

            toast.success("Lease signed successfully!");
            navigate("/signing/thank-you");
        } catch (err) {
            console.error("Sign error:", err);
            toast.error(err.response?.data?.message || "Failed to sign lease");
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearSignature = () => {
        sigPadRef.current?.clear();
    };

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
        setPdfLoaded(true);
        setPdfError(null);
    };

    const onDocumentLoadError = (error) => {
        console.error("Error loading PDF:", error);
        setPdfError("Failed to load PDF document");
        setPdfLoaded(false);
        toast.error("Failed to load PDF. Please try refreshing the page.");
    };

    const previousPage = () => {
        if (pageNumber > 1) {
            setPageNumber(pageNumber - 1);
        }
    };

    const nextPage = () => {
        if (pageNumber < numPages) {
            setPageNumber(pageNumber + 1);
        }
    };

    const zoomIn = () => {
        setScale((prevScale) => Math.min(prevScale + 0.25, 3.0));
    };

    const zoomOut = () => {
        setScale((prevScale) => Math.max(prevScale - 0.25, 0.5));
    };

    // Show already signed message
    if (isLoadingInvite) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center">
                <p className="text-sm text-gray-500">Loading lease information...</p>
            </div>
        );
    }

    if (isAlreadySigned) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center py-8 px-4">
                <Card className="max-w-md w-full text-center py-10 px-6">
                    <CardContent className="flex flex-col items-center gap-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <h1 className="text-2xl font-bold">Lease Already Signed</h1>
                        <p className="text-gray-700">
                            This lease has already been signed. You cannot sign it again.
                        </p>
                        <Button
                            className="mt-4 rounded-2xl"
                            onClick={() => navigate("/tenant/dashboard")}
                        >
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center py-8 px-4">
            {/* Lease Info Header */}
            {leaseInfo && (
                <div className="w-full max-w-3xl mb-4 bg-white rounded-lg border shadow-sm p-4">
                    <h2 className="text-xl font-bold mb-2">
                        {leaseInfo.leaseType === "CUSTOM" ? "Custom Lease Agreement" : "Standard Lease Agreement (BC RTB-1)"}
                    </h2>
                    {leaseInfo.lease && (
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-semibold">Rent:</span> ${leaseInfo.lease.rentAmount?.toLocaleString() || "N/A"}/month</p>
                            {leaseInfo.lease.startDate && (
                                <p><span className="font-semibold">Start Date:</span> {new Date(leaseInfo.lease.startDate).toLocaleDateString()}</p>
                            )}
                            {leaseInfo.lease.endDate && (
                                <p><span className="font-semibold">End Date:</span> {new Date(leaseInfo.lease.endDate).toLocaleDateString()}</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* PDF Viewer */}
            <div className="w-full max-w-3xl bg-white rounded border shadow mb-6 overflow-hidden">
                {signedPdfUrl ? (
                    <>
                        {/* PDF Controls */}
                        {numPages && (
                            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={previousPage}
                                        disabled={pageNumber <= 1}
                                        className="h-8"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-700 min-w-[100px] text-center">
                                        Page {pageNumber} of {numPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={nextPage}
                                        disabled={pageNumber >= numPages}
                                        className="h-8"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="outline" size="sm" onClick={zoomOut} className="h-8">
                                        <ZoomOut className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-700 w-16 text-center">
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <Button variant="outline" size="sm" onClick={zoomIn} className="h-8">
                                        <ZoomIn className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        
                        {/* PDF Display */}
                        <div className="h-[600px] overflow-auto bg-gray-100 flex items-center justify-center p-4">
                            {!pdfLoaded && !pdfError && (
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                                    <p className="mt-4 text-gray-600">Loading PDF...</p>
                                </div>
                            )}
                            
                            {pdfError ? (
                                <div className="text-center">
                                    <p className="text-red-600 mb-4">{pdfError}</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(signedPdfUrl, "_blank")}
                                    >
                                        Open PDF in New Tab
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-white shadow-lg">
                                    <Document
                                        file={signedPdfUrl}
                                        onLoadSuccess={onDocumentLoadSuccess}
                                        onLoadError={onDocumentLoadError}
                                        loading={
                                            <div className="text-center p-8">
                                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                                                <p className="mt-4 text-gray-600">Loading PDF...</p>
                                            </div>
                                        }
                                    >
                                        <Page
                                            pageNumber={pageNumber}
                                            scale={scale}
                                            renderTextLayer={true}
                                            renderAnnotationLayer={true}
                                        />
                                    </Document>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-[600px] flex items-center justify-center bg-gray-100">
                        <p className="text-gray-500">Loading lease document...</p>
                    </div>
                )}
            </div>

            {/* Signature Pad */}
            <div className="mb-6 w-full max-w-md mt-10">
                <div
                    style={{
                        width: "100%",
                        maxWidth: 400,
                        border: "1px solid #000",
                        borderRadius: 8,
                        overflow: "hidden",
                    }}
                >
                    <SignaturePad
                        ref={sigPadRef}
                        options={{
                            penColor: "black",
                            backgroundColor: "white",
                        }}
                        canvasProps={{
                            width: 400, // match the container width
                            height: 150,
                            style: { display: "block", width: "100%", height: "150px" }, // ensures it stretches correctly
                        }}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={clearSignature}
                    className="rounded-2xl"
                >
                    Clear
                </Button>

                <Button
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 flex items-center gap-2 disabled:opacity-70"
                >
                    <FileEdit size={18} />
                    {isSubmitting ? "Signing..." : "Sign Lease"}
                </Button>
            </div>
        </div>
    );
}
