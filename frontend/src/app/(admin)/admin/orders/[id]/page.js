"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft, MessageSquare, Send, Ruler, CreditCard, CheckCircle2, XCircle, Banknote,
    Save, User, Mail, Phone, FileText, Truck, StickyNote, Clock, AlertTriangle, X, Plus,
    Check, CheckCheck, Paperclip, ImageIcon, Package, Scissors, ShoppingBag,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ImageLightbox from "@/components/shared/ImageLightbox";

// Must match the backend's ORDER_STATUS_TRANSITIONS exactly
const ORDER_STATUS_TRANSITIONS = {
    PENDING_REVIEW: ["AWAITING_CLIENT_RESPONSE", "AGREED_AWAITING_PAYMENT", "CANCELLED"],
    AWAITING_CLIENT_RESPONSE: ["AGREED_AWAITING_PAYMENT", "CANCELLED"],
    AGREED_AWAITING_PAYMENT: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["CUTTING", "CANCELLED"],
    CUTTING: ["SEWING", "CANCELLED"],
    SEWING: ["FINISHING", "CANCELLED"],
    FINISHING: ["AWAITING_FINAL_PAYMENT", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
    AWAITING_FINAL_PAYMENT: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
    READY_FOR_PICKUP: ["COMPLETED", "CANCELLED"],
    OUT_FOR_DELIVERY: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
};

// Status steps for the visual stepper
const STATUS_STEPS = [
    "PENDING_REVIEW", "AWAITING_CLIENT_RESPONSE", "AGREED_AWAITING_PAYMENT",
    "IN_PROGRESS", "CUTTING", "SEWING", "FINISHING",
    "AWAITING_FINAL_PAYMENT", "READY_FOR_PICKUP", "COMPLETED",
];

export default function AdminOrderDetailPage() {
    const { id } = useParams();
    const toast = useToast();
    const { user, isSuperAdmin } = useAuth();
    const queryClient = useQueryClient();
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);

    const [quoteAmount, setQuoteAmount] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [chatMessage, setChatMessage] = useState("");
    const [chatAttachment, setChatAttachment] = useState(null);
    const [chatAttachmentPreview, setChatAttachmentPreview] = useState(null);
    const [mobileChatOpen, setMobileChatOpen] = useState(false);
    const [statusModal, setStatusModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [statusNote, setStatusNote] = useState("");
    const [cancelReason, setCancelReason] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [prevOrderData, setPrevOrderData] = useState(null);
    const [deliveryFee, setDeliveryFee] = useState("");
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [offlineModal, setOfflineModal] = useState(false);
    const [offlineAmount, setOfflineAmount] = useState("");
    const [offlineType, setOfflineType] = useState("INSTALLMENT");
    const [offlineNotes, setOfflineNotes] = useState("");
    const [lightboxImage, setLightboxImage] = useState(null);

    const { data: order, isLoading } = useQuery({
        queryKey: ["admin-order", id],
        queryFn: async () => {
            const { data } = await api.get(`/admin/orders/${id}`);
            return data.data?.order || data.data;
        },
    });

    const { data: chatMessages } = useQuery({
        queryKey: ["chat", id],
        queryFn: async () => {
            const { data } = await api.get(`/chat/${id}`);
            return data.data?.messages || data.data || [];
        },
        staleTime: 0,
        refetchInterval: 60000,
    });

    const { data: orderPayments } = useQuery({
        queryKey: ["order-payments", id],
        queryFn: async () => {
            const { data } = await api.get(`/payments/order/${id}`);
            return data.data?.payments || data.data || [];
        },
    });

    // Seed local admin-notes / delivery-fee state from the fetched order.
    // Uses React's documented "adjusting state during render" pattern
    // to avoid both setState-in-effect and ref-during-render violations.
    if (order && order !== prevOrderData) {
        setPrevOrderData(order);
        setAdminNotes(order.adminNotes || "");
        setDeliveryFee(order.deliveryFee ? String(order.deliveryFee) : "");
    }

    // Scroll chat to bottom (scroll the container, not the page)
    useEffect(() => {
        if (!chatContainerRef.current) return;
        // On mobile, only scroll when the chat panel is open.
        // On desktop (lg+), the chat is always visible — check via CSS media query
        // rather than window.innerWidth to be SSR-safe and respond to resize.
        const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
        if (!mobileChatOpen && !isDesktop) return;

        requestAnimationFrame(() => {
            if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
        });
    }, [chatMessages, mobileChatOpen]);

    const markMessagesRead = useMutation({
        mutationFn: async () => { await api.put(`/chat/${id}/read`); },
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["chat", id] }); queryClient.invalidateQueries({ queryKey: ["admin-chat"] }); },
    });

    // Intersection Observer — mark messages as read
    useEffect(() => {
        if (!chatMessages || chatMessages.length === 0) return;
        const hasUnread = chatMessages.some(m => !m.isRead && m.senderRole === "CLIENT");
        if (!hasUnread) return;
        const observer = new IntersectionObserver(
            (entries) => {
                let shouldMark = false;
                entries.forEach((entry) => {
                    if (entry.isIntersecting) { shouldMark = true; observer.unobserve(entry.target); }
                });
                if (shouldMark && !markMessagesRead.isPending) markMessagesRead.mutate();
            },
            { threshold: 0.5 }
        );
        const unreadNodes = document.querySelectorAll('.chat-msg-unread');
        unreadNodes.forEach((node) => observer.observe(node));
        return () => observer.disconnect();
    }, [chatMessages, mobileChatOpen]);

    const sendQuote = useMutation({
        mutationFn: async () => {
            const { data } = await api.put(`/admin/orders/${id}/quote`, {
                totalAgreedFee: Number(quoteAmount), adminNotes: adminNote,
            });
            return data;
        },
        onSuccess: () => { toast.success("Quote sent!", "The client will be notified."); setQuoteAmount(""); setAdminNote(""); queryClient.invalidateQueries({ queryKey: ["admin-order", id] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to send quote."),
    });

    const updateStatus = useMutation({
        mutationFn: async () => {
            const body = { status: selectedStatus };
            if (statusNote) body.note = statusNote;
            if (selectedStatus === "CANCELLED" && cancelReason) body.cancellationReason = cancelReason;
            const { data } = await api.put(`/admin/orders/${id}/status`, body);
            return data;
        },
        onSuccess: () => { toast.success("Status updated!"); setStatusModal(false); setSelectedStatus(null); setStatusNote(""); setCancelReason(""); queryClient.invalidateQueries({ queryKey: ["admin-order", id] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to update."),
    });

    const saveAdminNotesMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.put(`/admin/orders/${id}/admin-notes`, { adminNotes });
            return data;
        },
        onSuccess: () => { toast.success("Notes saved!"); queryClient.invalidateQueries({ queryKey: ["admin-order", id] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to save notes."),
    });

    const updateDeliveryFeeMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.put(`/admin/orders/${id}/delivery-fee`, { deliveryFee: Number(deliveryFee) });
            return data;
        },
        onSuccess: () => { toast.success("Delivery fee updated!"); queryClient.invalidateQueries({ queryKey: ["admin-order", id] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to update."),
    });

    const sendMsg = useMutation({
        mutationFn: async ({ message, file }) => {
            if (file) {
                const formData = new FormData();
                if (message) formData.append("message", message);
                formData.append("attachments", file);
                const { data } = await api.post(`/chat/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
                return data;
            }
            const { data } = await api.post(`/chat/${id}`, { message });
            return data;
        },
        onSuccess: () => { setChatMessage(""); setChatAttachment(null); setChatAttachmentPreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; }); queryClient.invalidateQueries({ queryKey: ["chat", id] }); },
    });



    const handleSendMessage = () => {
        const msg = chatMessage.trim();
        if (!msg && !chatAttachment) return;
        sendMsg.mutate({ message: msg || null, file: chatAttachment });
    };

    const handleChatFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setChatAttachment(file);
        setChatAttachmentPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
        });
        e.target.value = "";
    };

    const confirmPayment = useMutation({
        mutationFn: async (payId) => { const { data } = await api.put(`/admin/payments/${payId}/confirm`); return data; },
        onSuccess: () => { toast.success("Payment confirmed!"); queryClient.invalidateQueries({ queryKey: ["order-payments", id] }); queryClient.invalidateQueries({ queryKey: ["admin-order", id] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const rejectPayment = useMutation({
        mutationFn: async (payId) => { const { data } = await api.put(`/admin/payments/${payId}/reject`, { rejectionReason }); return data; },
        onSuccess: () => { toast.info("Payment rejected"); setRejectModal(null); setRejectionReason(""); queryClient.invalidateQueries({ queryKey: ["order-payments", id] }); queryClient.invalidateQueries({ queryKey: ["admin-order", id] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    if (isLoading) {
        return <div className="space-y-4"><div className="skeleton h-8 w-40" /><div className="skeleton h-[400px] rounded-xl" /></div>;
    }

    if (!order) {
        return <div className="text-center py-12"><p className="text-muted-foreground">Order not found.</p></div>;
    }

    const statusConfig = ORDER_STATUS[order.status] || {};
    const typeConfig = ORDER_TYPES[order.orderType] || {};
    const messages = Array.isArray(chatMessages) ? chatMessages : [];
    const payments = Array.isArray(orderPayments) ? orderPayments : [];
    const canSendQuote = ["PENDING_REVIEW", "AWAITING_CLIENT_RESPONSE"].includes(order.status);
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[order.status] || [];
    const currentStepIndex = STATUS_STEPS.indexOf(order.status);
    const isDeliveryOrder = order.fulfillmentMethod === "DELIVERY";
    const totalPaidCalc = order.totalPaid || 0;

    return (
        <div className="pb-20 lg:pb-0">
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-text-light hover:text-primary mb-6 transition-colors">
                <ArrowLeft size={14} /> All Orders
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ─── LEFT COLUMN ─── */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header + Status */}
                    <div className="p-6 rounded-xl border border-border bg-white">
                        <div className="hidden md:flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xs font-mono-data text-text-light mb-1">{order.orderNumber}</p>
                                <h1 className="text-xl font-bold text-foreground">{order.style?.name || typeConfig.label || "Order"}</h1>
                                <p className="text-sm text-muted-foreground mt-1">{typeConfig.label} · {order.client?.fullName || "Client"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusPill status={order.status} />
                                {allowedTransitions.length > 0 && (
                                    <Button onClick={() => setStatusModal(true)} variant="outline" className="h-8 text-xs gap-1">
                                        Update Status
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="md:hidden mb-4">
                            <div className="flex items-start justify-between">
                                <p className="text-xs font-mono-data text-text-light mb-1">{order.orderNumber}</p>
                                <div className="flex items-center gap-2">
                                    <StatusPill status={order.status} />
                                    {allowedTransitions.length > 0 && (
                                        <Button onClick={() => setStatusModal(true)} variant="outline" className="h-8 text-xs gap-1">
                                            Update Status
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <h1 className="text-xl font-bold text-foreground">{order.style?.name || typeConfig.label || "Order"}</h1>
                            <p className="text-sm text-muted-foreground mt-1">{typeConfig.label} · {order.client?.fullName || "Client"}</p>
                        </div>

                        {/* Visual stepper */}
                        <div className="flex items-center gap-1 overflow-x-auto pb-1.5">
                            {STATUS_STEPS.map((step, i) => {
                                const stepInfo = ORDER_STATUS[step] || {};
                                const isCurrentOrPast = i <= currentStepIndex;
                                const isCurrent = step === order.status;
                                return (
                                    <div key={step} className="flex items-center gap-1 shrink-0 mt-1">
                                        <div className={`w-2.5 h-2.5 rounded-full transition-colors ${isCurrent ? "ring-2 ring-offset-1" : ""}`}
                                            style={{
                                                backgroundColor: isCurrentOrPast ? (stepInfo.text || "#C2185B") : "#E0E0E0",
                                                ringColor: isCurrent ? (stepInfo.text || "#C2185B") : "transparent",
                                            }}
                                            title={stepInfo.label || step}
                                        />
                                        {i < STATUS_STEPS.length - 1 && (
                                            <div className={`w-4 sm:w-6 h-0.5 rounded-full ${i < currentStepIndex ? "bg-primary" : "bg-[#E0E0E0]"}`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        {order.status === "CANCELLED" && (
                            <div className="mt-3 flex items-center gap-2 bg-[#FFEBEE] px-3 py-2 rounded-lg">
                                <XCircle size={14} className="text-destructive shrink-0" />
                                <p className="text-xs text-destructive">This order has been cancelled{order.cancellationReason ? `: ${order.cancellationReason}` : "."}</p>
                            </div>
                        )}
                    </div>

                    {/* Quote Form */}
                    {canSendQuote && (
                        <div className="p-6 rounded-xl border border-border bg-white">
                            <h3 className="text-sm font-semibold text-foreground mb-1">Quote Management</h3>
                            {order.totalAgreedFee && (
                                <p className="text-xs text-text-light mb-3">Current proposed fee: <span className="font-mono-data font-semibold text-foreground">{formatCurrency(order.totalAgreedFee)}</span></p>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-text-light mb-1 block">Amount (₦)</label>
                                    <Input type="number" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} placeholder="e.g. 25000" min="1" className="h-10 font-mono-data bg-white" />
                                    {quoteAmount && Number(quoteAmount) <= 0 && (
                                        <p className="text-xs text-red-500 mt-1">Quote must be greater than ₦0</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs text-text-light mb-1 block">Note (optional)</label>
                                    <Input type="text" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Any notes for client" className="h-10 bg-white" />
                                </div>
                            </div>
                            <Button onClick={() => sendQuote.mutate()} disabled={!quoteAmount || Number(quoteAmount) <= 0 || sendQuote.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
                                <Send size={14} /> {sendQuote.isPending ? "Sending..." : "Send Quote to Client"}
                            </Button>

                            {/* Negotiation history from status history */}
                            {order.statusHistory?.filter(h => h.note).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border">
                                    <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">Negotiation History</p>
                                    <div className="space-y-2">
                                        {order.statusHistory.filter(h => h.note).map((h, i) => (
                                            <div key={i} className="text-xs text-muted-foreground bg-surface-2 px-3 py-2 rounded-lg">
                                                <span className="font-medium">{ORDER_STATUS[h.status]?.label || h.status}:</span> {h.note}
                                                <span className="text-text-light ml-2">{new Date(h.changedAt || h.createdAt).toLocaleDateString("en-NG")}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delivery Fee Card */}
                    {isDeliveryOrder && (
                        <div className="p-6 rounded-xl border border-border bg-white">
                            <div className="flex items-center gap-2 mb-3">
                                <Truck size={16} className="text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">Delivery Fee</h3>
                            </div>
                            {order.deliveryFee > 0 && (
                                <p className="text-xs text-text-light mb-3">Current: <span className="font-mono-data font-semibold text-foreground">{formatCurrency(order.deliveryFee)}</span></p>
                            )}
                            <div className="flex items-center gap-2">
                                <Input type="number" value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} placeholder="₦ Amount" className="h-9 font-mono-data bg-white w-40" />
                                <Button onClick={() => updateDeliveryFeeMutation.mutate()} disabled={!deliveryFee || updateDeliveryFeeMutation.isPending} variant="outline" className="h-9 gap-1 text-xs">
                                    <Save size={12} /> {updateDeliveryFeeMutation.isPending ? "..." : "Update"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Admin Notes Card */}
                    <div className="p-6 rounded-xl border border-border bg-white">
                        <div className="flex items-center gap-2 mb-3">
                            <StickyNote size={16} className="text-accent-purple" />
                            <h3 className="text-sm font-semibold text-foreground">Admin Notes</h3>
                            <span className="text-[9px] bg-muted text-accent-purple px-1.5 py-0.5 rounded font-semibold">PRIVATE</span>
                        </div>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add private notes about this order..."
                            className="w-full h-24 px-3 py-2 text-sm border border-[rgba(0,0,0,0.08)] rounded-lg bg-surface-2 focus:outline-none focus:ring-2 focus:ring-accent-purple/20 focus:border-accent-purple/40 resize-none transition-all"
                        />
                        <div className="flex justify-end mt-2">
                            <Button onClick={() => saveAdminNotesMutation.mutate()} disabled={saveAdminNotesMutation.isPending} variant="outline" className="h-8 text-xs gap-1">
                                <Save size={12} /> {saveAdminNotesMutation.isPending ? "Saving..." : "Save Notes"}
                            </Button>
                        </div>
                    </div>

                    {/* Chat — desktop inline, mobile full-screen overlay */}
                    <div
                        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none lg:block lg:z-auto transition-opacity duration-300 ${mobileChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'}`}
                        onClick={(e) => { if (e.target === e.currentTarget) setMobileChatOpen(false); }}
                    >
                        <div className={`absolute bottom-0 left-0 right-0 h-[100dvh] lg:static lg:h-[calc(100vh-145px)] flex flex-col rounded-t-2xl lg:rounded-xl border-0 lg:border border-border bg-background lg:overflow-hidden lg:sticky lg:top-[72px] transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileChatOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
                            {/* Chat header */}
                            <div className="px-5 py-3 border-b border-border flex items-center gap-2 bg-white shrink-0">
                                <MessageSquare size={16} className="text-primary" />
                                <h3 className="text-sm font-semibold text-foreground">Chat with Client</h3>
                                <span className="text-[10px] text-text-light ml-auto">{messages.length} messages</span>
                                <button className="lg:hidden ml-2 p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors" onClick={() => setMobileChatOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-surface-2">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <MessageSquare size={24} className="text-[#E0E0E0] mb-2" />
                                        <p className="text-sm text-text-light">No messages yet.</p>
                                        <p className="text-xs text-text-light mt-1">Send a message to start the conversation.</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const msgDate = new Date(msg.createdAt).setHours(0, 0, 0, 0);
                                        const prevMsgDate = idx > 0 ? new Date(messages[idx - 1].createdAt).setHours(0, 0, 0, 0) : null;
                                        const showDateSeparator = msgDate !== prevMsgDate;
                                        const isAdmin = msg.senderRole !== "CLIENT";

                                        return (
                                            <div key={msg.id} className="flex flex-col gap-3">
                                                {showDateSeparator && (
                                                    <div className="flex items-center justify-center my-1">
                                                        <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-semibold text-text-light tracking-wider uppercase">
                                                            {new Date(msg.createdAt).toLocaleDateString("en-NG", {
                                                                weekday: "short", day: "numeric", month: "short",
                                                                year: new Date(msg.createdAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div
                                                    className={`flex ${isAdmin ? "justify-end" : "justify-start"} ${!msg.isRead && msg.senderRole === "CLIENT" ? "chat-msg-unread" : ""}`}
                                                    data-unread={!msg.isRead && msg.senderRole === "CLIENT" ? "true" : "false"}
                                                >
                                                    <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${isAdmin
                                                        ? "bg-secondary text-white rounded-br-md"
                                                        : "bg-white text-foreground rounded-bl-md shadow-sm border border-border"
                                                        }`}>
                                                        {msg.attachments?.length > 0 && (
                                                            <div className="mb-2 grid gap-1">
                                                                {msg.attachments.map((img, i) => {
                                                                    const src = typeof img === "string" ? img : img.url;
                                                                    return (
                                                                        <button key={src}
                                                                            onClick={() => setLightboxImage(src)}
                                                                            className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                                                                            <Image src={src} alt="Chat Attachment" fill className="object-cover" />
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                        {!msg.attachments?.length && msg.images?.length > 0 && (
                                                            <div className="mb-2 grid gap-1">
                                                                {msg.images.map((img, i) => (
                                                                    <button key={img} onClick={() => setLightboxImage(img)}
                                                                        className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                                                                        <Image src={img} alt="Chat Image" fill className="object-cover" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                                                        <div className={`flex items-center justify-end gap-1 mt-1 ${isAdmin ? "text-white/50" : "text-text-light"}`}>
                                                            <span className="text-[10px]">
                                                                {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                            {isAdmin && (
                                                                msg.isRead || msg.readAt
                                                                    ? <CheckCheck size={14} />
                                                                    : <Check size={14} />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Attachment preview */}
                            {chatAttachmentPreview && (
                                <div className="px-3 pt-2 bg-white border-t border-border">
                                    <div className="relative inline-block">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted relative">
                                            <Image src={chatAttachmentPreview} alt="Attachment" fill className="object-cover" />
                                        </div>
                                        <button onClick={() => { setChatAttachment(null); setChatAttachmentPreview(null); }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-primary-foreground flex items-center justify-center">
                                            <X size={10} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Chat input */}
                            <div className="px-3 py-3 border-t border-border bg-white flex gap-2 items-end shrink-0">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChatFileSelect} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="h-10 w-10 rounded-full flex items-center justify-center text-text-light hover:bg-muted transition-colors shrink-0">
                                    <Paperclip size={16} />
                                </button>
                                <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (chatMessage.trim() || chatAttachment) && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 h-10 px-3.5 text-sm border border-input rounded-full focus:border-ring outline-none bg-surface-2" />
                                <button onClick={handleSendMessage} disabled={(!chatMessage.trim() && !chatAttachment) || sendMsg.isPending}
                                    className="h-10 w-10 rounded-full bg-secondary text-white flex items-center justify-center hover:bg-secondary/80 disabled:opacity-50 transition-colors shrink-0">
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT COLUMN ─── */}
                <div className="space-y-4">
                    {/* Client Info Card */}
                    <div className="p-5 rounded-xl border border-border bg-white">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Client Info</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shrink-0 overflow-hidden">
                                {order.client?.profilePicture ? (
                                    <Image src={order.client.profilePicture} alt={order.client?.fullName || "Client Profile"} width={48} height={48} className="w-full h-full object-cover" />
                                ) : (
                                    order.client?.fullName?.charAt(0) || "?"
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-foreground truncate">{order.client?.fullName || "—"}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-2 h-2 rounded-full ${order.client?.isOnline ? "bg-status-success animate-pulse" : "bg-[#E0E0E0]"}`} />
                                    <span className="text-[10px] text-text-light">{order.client?.isOnline ? "Online" : "Offline"}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                            {order.client?.email && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Mail size={13} className="text-text-light shrink-0" />
                                    <span className="truncate">{order.client.email}</span>
                                </div>
                            )}
                            {order.client?.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone size={13} className="text-text-light shrink-0" />
                                    <span>{order.client.phone}</span>
                                </div>
                            )}
                        </div>
                        {/* Measurements summary */}
                        {order.measurement ? (
                            <div className="mb-4 p-3 rounded-lg bg-muted">
                                <div className="flex items-center gap-1.5 mb-2">
                                    <Ruler size={12} className="text-accent-purple" />
                                    <span className="text-[10px] font-semibold text-accent-purple uppercase tracking-wider">Measurements</span>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                    {[["Bust", order.measurement.bust], ["Waist", order.measurement.waist], ["Hips", order.measurement.hips], ["Height", order.measurement.fullHeight]].filter(([, v]) => v).map(([label, val]) => (
                                        <span key={label} className="text-muted-foreground">{label}: <span className="font-mono font-semibold text-foreground">{val}cm</span></span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-[10px] text-text-light italic mb-4">No measurements on file</p>
                        )}
                        {order.client?.id && (
                            <Link href={`/admin/clients/${order.client.id}`}
                                className="block text-center text-xs font-semibold text-primary hover:underline py-2 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                                View Full Profile
                            </Link>
                        )}
                    </div>

                    {/* Order Details */}
                    <div className="p-5 rounded-xl border border-border bg-white">
                        <h3 className="text-sm font-semibold text-foreground mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { l: "Type", v: typeConfig.label },
                                { l: "Style", v: order.style?.name || (order.customStyleDescription ? "Custom Style" : "—") },
                                { l: "Fulfillment", v: order.fulfillmentMethod === "DELIVERY" ? "Home Delivery" : "Studio Pickup" },
                                { l: "Agreed Fee", v: order.totalAgreedFee ? formatCurrency(order.totalAgreedFee) : "—" },
                                { l: "Total Paid", v: formatCurrency(totalPaidCalc) },
                                { l: "Balance", v: order.totalAgreedFee ? formatCurrency(Math.max(0, order.totalAgreedFee - totalPaidCalc)) : "—" },
                                ...(isDeliveryOrder ? [{ l: "Delivery Fee", v: order.deliveryFee ? formatCurrency(order.deliveryFee) : "Not set" }, ...(order.deliveryAddress ? [{ l: "Delivery Address", v: order.deliveryAddress }] : [])] : []),
                                { l: "Created", v: new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" }) },
                            ].map(({ l, v }) => (
                                <div key={l} className="flex items-center justify-between">
                                    <span className="text-text-light">{l}</span>
                                    <span className="overflow-x-auto whitespace-nowrap no-scrollbar font-medium text-foreground text-right ml-2 max-w-[200px]">{v}</span>
                                </div>
                            ))}
                        </div>

                        {/* Custom description */}
                        {order.customStyleDescription && (
                            <div className="mt-4 pt-3 border-t border-border">
                                <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-1.5">Custom Description</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{order.customStyleDescription}</p>
                            </div>
                        )}

                        {/* Fabric notes */}
                        {order.fabricNotes && (
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-1.5">Fabric Notes</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">{order.fabricNotes}</p>
                            </div>
                        )}

                        {/* Model 3 order items */}
                        {order.orderType === "MODEL_3" && order.items?.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-border">
                                <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">Order Items</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-surface-2">
                                            <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                                                {item.readyToWear?.images?.[0] ? (
                                                    <Image src={item.readyToWear.images[0]} alt={item.readyToWear?.name || "Ready-to-Wear Item"} fill className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={14} className="text-[#BDBDBD]" /></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-foreground truncate">{item.readyToWear?.name || "Item"}</p>
                                                <p className="text-[10px] text-text-light">Size: {item.selectedSize} · Qty: {item.quantity}</p>
                                            </div>
                                            <span className="text-xs font-mono font-semibold text-foreground shrink-0">{formatCurrency(item.price || item.readyToWear?.price || 0)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Created By / Assigned To */}
                    {(order.createdByAdmin || order.assignedTo) && (
                        <div className="p-5 rounded-xl border border-border bg-white">
                            {order.createdByAdmin && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded font-medium">
                                        Created by: {order.createdByAdmin.fullName || "Admin"}
                                    </span>
                                </div>
                            )}
                            {order.assignedTo && (
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-[#E8F5E9] text-status-success px-2 py-0.5 rounded font-medium">
                                        Assigned to: {order.assignedTo.fullName || "Staff"}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Associated images */}
                    {order.style?.images?.[0] && (
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted">
                            {/* blurred background */}
                            <Image src={order.style.images[0]} alt={order.style.name} fill className="object-cover blur-xl scale-110 opacity-100" />
                            {/* overlay */}
                            <Image src={order.style.images[0]} alt={order.style.name} fill className="object-contain" />
                        </div>
                    )}
                    {order.customStyleImages?.length > 0 && (
                        <div className="p-5 rounded-xl border border-border bg-white">
                            <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">Custom Style Images</p>
                            <div className="grid grid-cols-3 gap-2">
                                {order.customStyleImages.map((img, i) => (
                                    <button key={i} onClick={() => setLightboxImage(img)} className="relative aspect-square rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                                        <Image src={img} alt="" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Client notes */}
                    {order.clientNotes && (
                        <div className="p-5 rounded-xl border border-border bg-white">
                            <h3 className="text-sm font-semibold text-foreground mb-2">Client Notes</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{order.clientNotes}</p>
                        </div>
                    )}



                    {/* Payment History */}
                    <div className="p-5 rounded-xl border border-border bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-foreground">Payment History</h3>
                            <button onClick={() => { setOfflineModal(true); setOfflineAmount(""); setOfflineType("INSTALLMENT"); setOfflineNotes(""); }}
                                className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-secondary text-white hover:bg-[#0D0D1A] transition-colors">
                                <Plus size={11} /> Log Offline Payment
                            </button>
                        </div>
                        {payments.length === 0 ? (
                            <p className="text-xs text-text-light text-center py-4">No payments yet.</p>
                        ) : (
                            <div className="space-y-2.5">
                                {payments.map((pay) => (
                                    <div key={pay.id} className="p-3 rounded-lg bg-surface-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-bold font-mono-data text-foreground">{formatCurrency(pay.amount)}</span>
                                            <StatusPill status={pay.status} size="small" />
                                        </div>
                                        <p className="text-[10px] text-text-light">
                                            {pay.paymentType?.replace(/_/g, " ")} · {new Date(pay.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                        </p>
                                        {/* Payment proof thumbnail */}
                                        {(pay.proofUrl || pay.proofImages?.length > 0) && (
                                            <div className="flex justify-center items-center gap-1.5 mt-2">
                                                {(pay.proofImages || [pay.proofUrl]).filter(Boolean).map((img, i) => (
                                                    <button key={i} onClick={() => setLightboxImage(img)}
                                                        className="cursor-pointer relative w-12 h-12 rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                                                        <Image src={img} alt="Proof" fill className="object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {pay.status === "PENDING" && (
                                            <div className="flex gap-1.5 mt-2">
                                                <Button size="sm" onClick={() => confirmPayment.mutate(pay.id)} disabled={confirmPayment.isPending}
                                                    className="h-7 text-[10px] bg-status-success text-white hover:bg-[#1B5E20] gap-1 flex-1">
                                                    <CheckCircle2 size={11} /> Confirm
                                                </Button>
                                                <Button size="sm" onClick={() => { setRejectModal(pay.id); setRejectionReason(""); }}
                                                    variant="outline" className="h-7 text-[10px] text-destructive border-[#C62828]/30 hover:bg-[#FFEBEE] gap-1 flex-1">
                                                    <XCircle size={11} /> Reject
                                                </Button>
                                            </div>
                                        )}
                                        {pay.status === "REJECTED" && pay.rejectionReason && (
                                            <p className="text-[10px] text-destructive mt-1 italic">Reason: {pay.rejectionReason}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ─── Mobile Sticky Bottom Bar ─── */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-border z-40 lg:hidden flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setMobileChatOpen(true)}
                    className="flex flex-1 items-center justify-center gap-2 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] bg-muted text-foreground font-semibold hover:bg-[#E8E4EC] transition-colors text-sm relative"
                >
                    <MessageSquare size={16} /> Chat
                    {messages.filter(m => !m.isRead && m.senderRole === "CLIENT").length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary"></span>
                    )}
                </button>
            </div>

            {/* ─── Status Update Modal ─── */}
            <AnimatePresence>
                {statusModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={() => setStatusModal(false)}>
                        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-foreground mb-1">Update Order Status</h3>
                            <p className="text-sm text-muted-foreground mb-4">Current: <StatusPill status={order.status} size="small" /></p>

                            {/* Selectable status options */}
                            <div className="space-y-2 mb-4">
                                <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider">Select new status</p>
                                {allowedTransitions.map((key) => {
                                    const val = ORDER_STATUS[key] || { label: key };
                                    const isCancelOption = key === "CANCELLED";
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedStatus(key)}
                                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium ${selectedStatus === key
                                                ? isCancelOption
                                                    ? "border-[#C62828] bg-[#FFEBEE] text-destructive"
                                                    : "border-primary bg-primary/5 text-primary"
                                                : "border-[rgba(0,0,0,0.08)] hover:border-[rgba(0,0,0,0.15)] text-foreground"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isCancelOption && <AlertTriangle size={14} />}
                                                {val.label}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Cancellation reason (required when CANCELLED is selected) */}
                            {selectedStatus === "CANCELLED" && (
                                <div className="mb-4">
                                    <label className="text-xs text-destructive font-medium mb-1 block">Cancellation Reason (required)</label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Why is this order being cancelled?"
                                        className="w-full h-20 px-3 py-2 text-sm border border-[#C62828]/30 rounded-lg bg-[#FFEBEE]/30 focus:outline-none focus:ring-2 focus:ring-[#C62828]/20 resize-none"
                                    />
                                </div>
                            )}

                            {/* Optional note */}
                            {selectedStatus && selectedStatus !== "CANCELLED" && (
                                <div className="mb-4">
                                    <label className="text-xs text-text-light mb-1 block">Note (optional)</label>
                                    <Input type="text" value={statusNote} onChange={(e) => setStatusNote(e.target.value)}
                                        placeholder="Add a note for this status change" className="h-9 bg-white" />
                                </div>
                            )}

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => { setStatusModal(false); setSelectedStatus(null); }} className="h-9">Cancel</Button>
                                <Button
                                    onClick={() => updateStatus.mutate()}
                                    disabled={!selectedStatus || (selectedStatus === "CANCELLED" && cancelReason.length < 3) || updateStatus.isPending}
                                    className={`h-9 gap-1.5 ${selectedStatus === "CANCELLED" ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"} text-primary-foreground`}
                                >
                                    {updateStatus.isPending ? "Updating..." : "Confirm Update"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Payment Rejection Modal ─── */}
            <AnimatePresence>
                {rejectModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
                        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-foreground mb-1">Reject Payment</h3>
                            <p className="text-sm text-muted-foreground mb-4">Provide a reason for rejection.</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Proof of payment is unclear..."
                                className="w-full h-24 px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none transition-all"
                            />
                            {rejectionReason.length > 0 && rejectionReason.length < 5 && (
                                <p className="text-xs text-destructive mt-1">Reason must be at least 5 characters</p>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setRejectModal(null)} className="h-9">Cancel</Button>
                                <Button onClick={() => rejectPayment.mutate(rejectModal)} disabled={rejectionReason.length < 5 || rejectPayment.isPending}
                                    className="h-9 bg-destructive text-primary-foreground hover:bg-destructive/90 gap-1.5">
                                    <XCircle size={14} /> {rejectPayment.isPending ? "Rejecting..." : "Reject"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Offline Payment Modal ─── */}
            <AnimatePresence>
                {offlineModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setOfflineModal(false)}>
                        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Banknote size={18} className="text-status-success" /> Log Offline Payment
                                </h3>
                                <button onClick={() => setOfflineModal(false)}><X size={18} className="text-text-light" /></button>
                            </div>
                            <p className="text-xs text-text-light mb-4">Record a cash or in-person payment. It will be automatically confirmed.</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-text-light mb-1 block">Amount (₦) *</label>
                                    <Input type="number" value={offlineAmount} onChange={(e) => setOfflineAmount(e.target.value)}
                                        placeholder="Enter amount" className="h-10 bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-text-light mb-2 block">Payment Type *</label>
                                    <div className="flex gap-2">
                                        {["INSTALLMENT", "FULL"].map(t => (
                                            <button key={t} onClick={() => setOfflineType(t)}
                                                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border-2 transition-colors ${offlineType === t
                                                    ? "border-[#2E7D32] bg-status-success/5 text-status-success"
                                                    : "border-input text-muted-foreground hover:border-[#2E7D32]/30"
                                                    }`}>
                                                {t === "FULL" ? "Full Payment" : "Installment"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-text-light mb-1 block">Notes (optional)</label>
                                    <textarea value={offlineNotes} onChange={(e) => setOfflineNotes(e.target.value)}
                                        placeholder="e.g. Cash payment received at studio"
                                        className="w-full h-20 px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/20 resize-none" />
                                </div>
                            </div>
                            <Button onClick={() => {
                                api.post('/admin/payments/offline', {
                                    orderId: id, amount: Number(offlineAmount), paymentType: offlineType, notes: offlineNotes || undefined
                                }).then(() => {
                                    toast.success('Offline payment logged and confirmed');
                                    setOfflineModal(false);
                                    queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
                                    queryClient.invalidateQueries({ queryKey: ['order-payments', id] });
                                }).catch(err => toast.error('Error', err.response?.data?.message || 'Failed to log payment'));
                            }} disabled={!offlineAmount || Number(offlineAmount) <= 0}
                                className="w-full mt-5 bg-status-success text-white hover:bg-[#1B5E20] h-10 gap-2">
                                <CheckCircle2 size={14} /> Log & Confirm Payment
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Image Lightbox ─── */}
            <ImageLightbox lightboxImage={lightboxImage} setLightboxImage={setLightboxImage} />
        </div>
    );
}
