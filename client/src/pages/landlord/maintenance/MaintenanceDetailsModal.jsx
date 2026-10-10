import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCategoryDisplayName, getPriorityDisplayName } from "@/lib/maintenanceApi";
import axios from "@/lib/axios";
import API_ENDPOINTS from "@/lib/apiEndpoints";
import { maintenanceApi } from "@/lib/maintenanceApi";
import { SendIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import InvoicesModal from "./InvoicesModal";
import { Skeleton } from "@/components/ui/skeleton";

// Move outside to prevent recreation on every render
const ImageWithShimmer = React.memo(function ImageWithShimmer({ src, alt }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className="h-28 w-40 relative flex-shrink-0 snap-start">
            {!loaded && (
                <div className="h-full w-full rounded-md bg-gray-200 dark:bg-gray-800 shimmer-container">
                    <div className="shimmer-bar" />
                </div>
            )}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={`h-28 w-40 rounded-md object-cover border absolute inset-0 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
        </div>
    );
});

const MessagesSkeleton = () => (
    <div className="space-y-3 px-2">
        <Skeleton className="h-4 w-32" />
        {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="flex">
                <Skeleton className="w-full rounded-xl" />
            </div>
        ))}
    </div>
);

const MaintenanceDetailsModal = ({ request, open, onClose }) => {
    const { user } = useAuthStore();
    const currentUserId = user?.id;
    const sliderRef = useRef(null);
    const canScroll = (request?.images || []).length > 1;
    const scrollBy = 220;
    const scrollLeft = useCallback(() => sliderRef.current?.scrollBy({ left: -scrollBy, behavior: "smooth" }), []);
    const scrollRight = useCallback(() => sliderRef.current?.scrollBy({ left: scrollBy, behavior: "smooth" }), []);

    // Translate vertical mouse wheel to horizontal scroll on the images strip only
    const handleWheel = (e) => {
        const el = sliderRef.current;
        if (!el) return;
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            const before = el.scrollLeft;
            el.scrollLeft += e.deltaY;
            if (el.scrollLeft !== before) e.preventDefault();
        }
    };

    useEffect(() => {
        // Reset scroll position when modal opens so first image isn't clipped
        if (open && sliderRef.current) {
            sliderRef.current.scrollLeft = 0;
        }
    }, [open]);

    const imageUrls = useMemo(
        () => (request?.images || []).map((img) => img.url || img),
        [request]
    );
    const [resolvedUrls, setResolvedUrls] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [messageBody, setMessageBody] = useState("");
    const messagesEndRef = useRef(null);
    const [showInvoicesModal, setShowInvoicesModal] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function resolveUrls() {
            if (!imageUrls.length) {
                setResolvedUrls([]);
                return;
            }
            try {
                const results = await Promise.all(
                    imageUrls.map(async (rawUrl) => {
                        const url = typeof rawUrl === "string" ? rawUrl : String(rawUrl);
                        // Try to derive S3 key from URL to request a signed download URL if needed
                        try {
                            const u = new URL(url);
                            // key is everything after the first '/'
                            const key = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
                            if (!key) return url;
                            const resp = await axios.get(`${API_ENDPOINTS.UPLOADS.BASE}/s3-download-url`, {
                                params: { key },
                            });
                            const signed = resp.data?.data?.downloadURL || resp.data?.downloadURL;
                            return signed || encodeURI(url);
                        } catch (e) {
                            // Fallback to original URL (works for public buckets)
                            return encodeURI(url);
                        }
                    })
                );
                if (!cancelled) setResolvedUrls(results);
            } catch {
                if (!cancelled) setResolvedUrls(imageUrls);
            }
        }
        resolveUrls();
        return () => {
            cancelled = true;
        };
    }, [imageUrls]);

    // Memoize resolved URLs to prevent recalculation on every render
    const stableResolvedUrls = useMemo(() => resolvedUrls, [resolvedUrls]);

    useEffect(() => {
        if (!open || !request?.id) {
            // Clear messages when modal closes
            setMessages([]);
            return;
        }
        // Load messages immediately when modal opens
        setLoadingMessages(true);
        (async () => {
            try {
                const res = await maintenanceApi.getMessages(request.id);
                const msgs = res.data || res;
                setMessages(Array.isArray(msgs) ? msgs : []);
            } catch (_) {
                setMessages([]);
            } finally {
                setLoadingMessages(false);
            }
        })();
    }, [open, request?.id]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = useCallback(async () => {
        if (!messageBody.trim() || sending) return;
        
        const messageText = messageBody.trim();
        const tempId = `temp-${Date.now()}`;
        
        // Create optimistic message immediately
        const optimisticMessage = {
            id: tempId,
            body: messageText,
            senderId: currentUserId,
            createdAt: new Date().toISOString(),
            sender: {
                firstName: user?.firstName || '',
                lastName: user?.lastName || ''
            }
        };
        
        // Add optimistic message to UI immediately
        setMessages((prev) => [...prev, optimisticMessage]);
        setMessageBody("");
        setSending(true);
        
        try {
            // Send message in background
            const res = await maintenanceApi.sendMessage(request.id, messageText);
            const msg = res.data || res;
            
            // Replace optimistic message with real one
            setMessages((prev) => 
                prev.map(m => m.id === tempId ? msg : m)
            );
        } catch (error) {
            // On error, remove the optimistic message
            setMessages((prev) => prev.filter(m => m.id !== tempId));
            // Optionally restore the message body
            setMessageBody(messageText);
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    }, [messageBody, sending, request?.id, currentUserId, user]);

    if (!request) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
            <DialogContent className="bg-background rounded-xl p-4 md:p-8">
                <DialogHeader className="px-2 pt-3">
                    <DialogTitle className="text-base md:text-lg text-left">Maintenance Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-3 w-full max-w-xl max-h-[90vh] overflow-y-auto px-2">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <div className="text-sm">{request.title}</div>
                    </div>

                    <div className="grid gap-4 grid-cols-1">
                        <div>
                            <label className="block text-sm font-medium mb-1">Property</label>
                            <div className="text-sm">{request.listing?.title || "Unknown Property"}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Priority</label>
                                <div className="text-sm">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${request.priority === "URGENT"
                                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                            : request.priority === "HIGH"
                                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            }`}
                                    >
                                        {getPriorityDisplayName(request.priority)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <div className="text-sm">{getCategoryDisplayName(request.category)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-md p-4 bg-primary-foreground">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <div className="text-sm whitespace-pre-wrap">{request.description}</div>
                    </div>

                    {stableResolvedUrls.length > 0 && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium mb-1">Image(s)</label>
                                {canScroll && (
                                    <div className="flex items-center gap-2">
                                        <Button type="button" variant="outline" size="sm" onClick={scrollLeft} className="rounded-2xl">◀</Button>
                                        <Button type="button" variant="outline" size="sm" onClick={scrollRight} className="rounded-2xl">▶</Button>
                                    </div>
                                )}
                            </div>
                            <div
                                ref={sliderRef}
                                className="flex gap-3 overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth snap-x snap-mandatory py-2 px-1 w-full"
                                style={{ overscrollBehaviorX: "contain", touchAction: "pan-x" }}
                                onWheel={handleWheel}
                            >
                                {stableResolvedUrls.map((url) => (
                                    <ImageWithShimmer key={url} src={url} alt="maintenance" />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Invoices Button */}
                    <div className="mt-6">
                        <Button
                            type="button"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-2.5 font-medium flex items-center justify-center gap-2"
                            onClick={() => setShowInvoicesModal(true)}
                        >
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="w-5 h-5" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth={2} 
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                                />
                            </svg>
                            View Invoices
                        </Button>
                    </div>

                    <div className="mt-8">
                        <div className="flex flex-col gap-2 bg-primary-foreground p-3 rounded-sm border border-gray-300">

                            <p className="text-[14px]  text-semibold mb-2">Messages</p>
                            <div className="max-h-56 w-full">
                                {loadingMessages ? (
                                    <MessagesSkeleton />
                                ) : messages.length === 0 ? (
                                    <p className="text-xs text-muted-foreground p-2">No messages yet.</p>
                                ) : (
                                    <div className="max-h-56 overflow-y-auto space-y-2 px-2">
                                        {messages.map((m) => {
                                            const isSent = m.senderId === currentUserId;
                                            return (
                                                <div
                                                    key={m.id}
                                                    className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div
                                                        className={`text-sm p-3 rounded-2xl max-w-[70%] ${
                                                            isSent
                                                                ? "bg-blue-500 text-white rounded-br-none"
                                                                : "bg-gray-200 dark:bg-gray-700 rounded-bl-none"
                                                        }`}
                                                    >
                                                        {!isSent && (
                                                            <p className="font-medium text-xs mb-1 opacity-80">
                                                                {m.sender?.firstName} {m.sender?.lastName}
                                                            </p>
                                                        )}
                                                        <p className={isSent ? "text-white" : ""}>{m.body}</p>
                                                        <p className={`text-[8px] mt-2 ${isSent ? "text-blue-100" : "text-muted-foreground"}`}>
                                                            {new Date(m.createdAt).toLocaleString([], {
                                                                dateStyle: "short",
                                                                timeStyle: "short",
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    className="flex-1 border rounded-md px-3 py-2 text-sm bg-primary-foreground"
                                    placeholder="Write a message..."
                                    value={messageBody}
                                    onChange={(e) => setMessageBody(e.target.value)}
                                />
                                <Button
                                    disabled={sending || !messageBody.trim()}
                                    onClick={handleSendMessage}
                                    className="rounded-2xl"
                                >
                                    <SendIcon className="size-4" />
                                    Send
                                </Button>
                            </div>
                        </div>

                        <DialogFooter className="flex flex-row justify-end gap-3 pt-2 mt-4">
                            <Button className="rounded-2xl border w-auto md:w-auto" variant="secondary" onClick={onClose}>Close</Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>

            {/* Invoices Modal */}
            <InvoicesModal
                open={showInvoicesModal}
                onClose={() => setShowInvoicesModal(false)}
                maintenanceRequest={request}
            />
        </Dialog>
    );
};

export default MaintenanceDetailsModal;


