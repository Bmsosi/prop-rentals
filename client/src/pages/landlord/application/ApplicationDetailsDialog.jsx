import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";

const ApplicationDetailsDialog = ({ open, onClose, application }) => {
    const [signedDocUrls, setSignedDocUrls] = useState({});
    const [loadingDocs, setLoadingDocs] = useState(true);

    const getCount = (value) => {
        if (value === null || value === undefined || value === "") return "Not provided";
        if (typeof value === "object") return value.count ?? value.number ?? "Not provided";
        return value;
    };

    const formatDate = (value, fallback = "Not provided") => {
        if (!value) return fallback;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
    };

    // Fetch signed URLs for S3 documents
    useEffect(() => {
        if (!open || !application) {
            setSignedDocUrls({});
            setLoadingDocs(true);
            return;
        }

        const fetchSignedUrls = async () => {
            setLoadingDocs(true);
            const urlMap = {};

            try {
                // Fetch signed URLs for employment proof documents
                if (Array.isArray(application.employmentInfo)) {
                    for (const job of application.employmentInfo) {
                        if (job.proofDocument) {
                            try {
                                const url = new URL(job.proofDocument);
                                const isS3 = url.hostname.includes('s3.') || url.hostname.includes('amazonaws.com');
                                
                                if (isS3) {
                                    const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                                    const response = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, {
                                        params: { key }
                                    });
                                    urlMap[job.proofDocument] = response.data?.data?.downloadURL || response.data?.downloadURL || job.proofDocument;
                                } else {
                                    urlMap[job.proofDocument] = job.proofDocument;
                                }
                            } catch {
                                urlMap[job.proofDocument] = job.proofDocument;
                            }
                        }
                    }
                }

                // Fetch signed URLs for application documents
                if (Array.isArray(application.documents)) {
                    for (const docUrl of application.documents) {
                        try {
                            const url = new URL(docUrl);
                            const isS3 = url.hostname.includes('s3.') || url.hostname.includes('amazonaws.com');
                            
                            if (isS3) {
                                const key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
                                const response = await api.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, {
                                    params: { key }
                                });
                                urlMap[docUrl] = response.data?.data?.downloadURL || response.data?.downloadURL || docUrl;
                            } else {
                                urlMap[docUrl] = docUrl;
                            }
                        } catch {
                            urlMap[docUrl] = docUrl;
                        }
                    }
                }

                setSignedDocUrls(urlMap);
            } catch (error) {
                console.error('Error fetching signed URLs:', error);
            } finally {
                setLoadingDocs(false);
            }
        };

        fetchSignedUrls();
    }, [open, application]);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent
                onInteractOutside={(e) => e.preventDefault()}
                className="max-h-[90vh] overflow-y-auto sm:max-w-4xl lg:max-w-5xl p-8"
            >
                <DialogHeader>
                    <DialogTitle className="text-2xl mb-4">Application Details</DialogTitle>
                </DialogHeader>

                {!application ? (
                    <p className="text-gray-500">No data loaded</p>
                ) : (
                    <div className="space-y-6 text-gray-800">

                        {/* TOP SECTION: 2-COLUMN BALANCED LAYOUT */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="flex flex-col justify-between h-full space-y-8">
                                {/* Listing Info */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg text-gray-900">Listing Information</h3>
                                    <div className="ml-4 border-l-2 pl-3 border-l-gray-300">
                                        <p><b>Title:</b> {application?.listing?.title}</p>
                                        <p><b>Address:</b> {application?.listing?.streetAddress}</p>
                                    </div>
                                </div>

                                {/* Rental Info */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg text-gray-900">Rental Details</h3>
                                    <div className="ml-4 border-l-2 pl-3 border-l-gray-300">
                                        <p><b>Move-in Date:</b> {formatDate(application.moveInDate, "Not selected")}</p>
                                        <p><b>Occupants:</b> {getCount(application.occupants ?? application.occupantsCount)}</p>
                                        <p><b>Pets:</b> {getCount(application.pets ?? application.petsCount)}</p>
                                        <p><b>Monthly Income:</b> {application.monthlyIncome ?? "Not provided"}</p>
                                        <p><b>Payment Method:</b> {application.paymentMethod ?? "Not provided"}</p>
                                        <p><b>Status:</b> {application.status}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="flex flex-col justify-between h-full space-y-4">
                                {/* Applicant Info */}
                                <div className="space-y-2">
                                    <h3 className="font-semibold text-lg text-gray-900">Applicant Information</h3>
                                    <div className="ml-4 border-l-2 pl-3 border-l-gray-300">
                                        <p><b>Name:</b> {application.fullName}</p>
                                        <p><b>Email:</b> {application.email}</p>
                                        <p><b>Phone:</b> {application.phone || "No phone provided"}</p>
                                        <p><b>Date of Birth:</b> {formatDate(application.dateOfBirth)}</p>
                                        <p><b>Current Address:</b> {application.currentAddress ?? "Not provided"}</p>
                                        <p><b>Current Landlord:</b> {application.currentLandlord ?? "Not provided"}</p>
                                        <p><b>Landlord Contact:</b> {application.currentLandlordContact ?? "Not provided"}</p>
                                        <p><b>Current Job:</b> {application.currentJob ?? "Not provided"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {application.message && !application.message.startsWith("{") && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-gray-900">Message from Tenant</h3>
                                <p className="rounded-lg bg-gray-50 border p-4 whitespace-pre-wrap">{application.message}</p>
                            </div>
                        )}

                        {(application.contractUrl || application.signedContractUrl) && (
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-gray-900">Residential Tenancy Agreement</h3>
                                <p className="text-sm text-gray-600">Agreement status: <span className="font-semibold">{application.contractStatus || "SENT"}</span></p>
                                <div className="flex flex-wrap gap-3">
                                    {application.contractUrl && <a className="text-primary underline text-sm" href={application.contractUrl} target="_blank" rel="noreferrer">Download landlord agreement</a>}
                                    {application.signedContractUrl && <a className="text-primary underline text-sm" href={application.signedContractUrl} target="_blank" rel="noreferrer">View signed agreement</a>}
                                </div>
                                {application.contractFeedback && <p className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">Feedback: {application.contractFeedback}</p>}
                            </div>
                        )}

                        {/* BOTTOM SECTION: Employment History */}
                        {Array.isArray(application.employmentInfo) && application.employmentInfo.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg text-gray-900">Employment History</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                                    {application.employmentInfo.map((job, idx) => (
                                        <div key={idx} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-700">Employer</p>
                                                        <p className="text-sm text-gray-900">{job.employerName || "Not provided"}</p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Job Title</p>
                                                    <p className="text-sm text-gray-900">{job.jobTitle || "Not provided"}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Duration</p>
                                                        <p className="text-sm text-gray-900">{job.duration || "Not provided"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Income</p>
                                                        <p className="text-sm text-gray-900">
                                                            {job.income ? `$${Number(job.income).toLocaleString()}` : "Not provided"}
                                                        </p>
                                                    </div>
                                                </div>
                                                {job.address && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Address</p>
                                                        <p className="text-sm text-gray-900 break-words">{job.address}</p>
                                                    </div>
                                                )}
                                                {job.proofDocument && (
                                                    <div className="pt-2 border-t border-gray-200">
                                                        {loadingDocs ? (
                                                            <span className="text-gray-500 text-sm">Loading document...</span>
                                                        ) : (
                                                            <a
                                                                href={signedDocUrls[job.proofDocument] || job.proofDocument}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 underline text-sm inline-flex items-center gap-1"
                                                            >
                                                                View Proof Document
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* BOTTOM SECTION: Documents */}
                        {Array.isArray(application.documents) && application.documents.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Documents</h3>
                                <div className="space-y-2">
                                    {loadingDocs ? (
                                        <p className="text-sm text-gray-500">Loading documents...</p>
                                    ) : (
                                        application.documents.map((url, index) => {
                                            const filename = url.split("/").pop();
                                            const signedUrl = signedDocUrls[url] || url;
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between border rounded-lg p-2 bg-gray-50"
                                                >
                                                    <a
                                                        href={signedUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 underline text-sm break-all"
                                                    >
                                                        {filename}
                                                    </a>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-end mt-6">
                    <Button className="rounded-xl" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ApplicationDetailsDialog;
