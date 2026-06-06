"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    MessageSquare,
    CreditCard,
    CheckCircle2,
    XCircle,
    Send,
    Check,
    CheckCheck,
    Paperclip,
    ChevronRight,
    Package,
    Upload,
    X,
    ArrowUp,
    Ruler,
    AlertCircle,
    ImageIcon,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES, PAYMENT_STATUS } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import PaymentInfoCard from "@/components/shared/PaymentInfoCard";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";

/* ─── Lifecycle stages for vertical timeline ─── */
const TIMELINE_STAGES_CUSTOM = [
    { key: "PENDING_REVIEW", label: "Review", maxStep: 0, description: "Order submitted — under admin review" },
    { key: "AWAITING_CLIENT_RESPONSE", label: "Agreement", maxStep: 1, description: "Quote sent — awaiting your response" },
    { key: "AGREED_AWAITING_PAYMENT", label: "Payment", maxStep: 2, description: "Quote accepted — make your payment" },
    { key: "IN_PROGRESS", label: "Production", maxStep: 6, description: "Your order is being crafted" },
    { key: "READY_FOR_PICKUP", label: "Delivery", maxStep: 8, description: "Ready for pickup or delivery" },
    { key: "COMPLETED", label: "Complete", maxStep: 9, description: "Order completed — enjoy!" },
];

const TIMELINE_STAGES_RTW = [
    { key: "PENDING_REVIEW", label: "Order Placed", maxStep: 0, description: "Order received" },
    { key: "AGREED_AWAITING_PAYMENT", label: "Payment", maxStep: 2, description: "Awaiting payment" },
    { key: "READY_FOR_PICKUP", label: "Delivery", maxStep: 8, description: "Ready for pickup or delivery" },
    { key: "COMPLETED", label: "Complete", maxStep: 9, description: "Order completed — enjoy!" },
];

function getCurrentStageIndex(step, stages) {
    if (step < 0) return -1;
    for (let i = 0; i < stages.length; i++) {
        if (step <= stages[i].maxStep) return i;
    }
    return stages.length - 1;
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const proofInputRef = useRef(null);
    const [showPayForm, setShowPayForm] = useState(false);
    const [chatMessage, setChatMessage] = useState("");
    const [chatAttachment, setChatAttachment] = useState(null);
    const [chatAttachmentPreview, setChatAttachmentPreview] = useState(null);
    const [showNegotiateForm, setShowNegotiateForm] = useState(false);
    const [negotiateNote, setNegotiateNote] = useState("");
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [mobileChatOpen, setMobileChatOpen] = useState(() => searchParams.get("chat") === "true");

    // Payment form state
    const [payAmount, setPayAmount] = useState("");
    const [payType, setPayType] = useState("INSTALLMENT");
    const [payProof, setPayProof] = useState(null);
    const [payProofPreview, setPayProofPreview] = useState(null);
    const [payNotes, setPayNotes] = useState("");

    // ─── Back to top button ───
    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 400);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);



    // ─── Data fetching ───
    const { data: order, isLoading } = useQuery({
        queryKey: ["order", id],
        queryFn: async () => {
            const { data } = await api.get(`/orders/${id}`);
            return data.data?.order || data.data;
        },
    });

    const { data: chatMessages } = useQuery({
        queryKey: ["chat", id],
        queryFn: async () => {
            const { data } = await api.get(`/chat/${id}`);
            return data.data?.messages || data.data || [];
        },
        // SSE handles real-time; keep light polling as fallback
        refetchInterval: 15000,
    });

    // ─── Mutations ───
    const respondToQuote = useMutation({
        mutationFn: async ({ action, negotiationNote }) => {
            const endpoint = action === "ACCEPT"
                ? `/orders/${id}/accept-quote`
                : `/orders/${id}/decline-quote`;
            const body = action === "DECLINE" && negotiationNote ? { negotiationNote } : {};
            const { data } = await api.put(endpoint, body);
            return data;
        },
        onSuccess: (_, { action }) => {
            toast.success(action === "ACCEPT" ? "Quote accepted!" : "Quote declined — negotiation sent");
            setShowNegotiateForm(false);
            setNegotiateNote("");
            queryClient.invalidateQueries({ queryKey: ["order", id] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed"),
    });

    const sendMessage = useMutation({
        mutationFn: async ({ message, file }) => {
            if (file) {
                const formData = new FormData();
                if (message) formData.append("message", message);
                formData.append("attachments", file);
                const { data } = await api.post(`/chat/${id}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                return data;
            }
            const { data } = await api.post(`/chat/${id}`, { message });
            return data;
        },
        onSuccess: () => {
            setChatMessage("");
            setChatAttachment(null);
            setChatAttachmentPreview(null);
            queryClient.invalidateQueries({ queryKey: ["chat", id] });
        },
    });

    const markMessagesRead = useMutation({
        mutationFn: async () => {
            await api.put(`/chat/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat", id] });
            queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
            queryClient.invalidateQueries({ queryKey: ["client-orders"] });
        },
    });

    const submitPayment = useMutation({
        mutationFn: async (formData) => {
            const { data } = await api.post("/payments", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Payment submitted!", "It will be reviewed shortly.");
            setShowPayForm(false);
            setPayAmount("");
            setPayType("INSTALLMENT");
            setPayProof(null);
            setPayProofPreview(null);
            setPayNotes("");
            queryClient.invalidateQueries({ queryKey: ["order", id] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to submit payment."),
    });

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current && (mobileChatOpen || window.innerWidth >= 1024)) {
            // Slight delay to allow display:block to render layout before scrolling
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 10);
        }
    }, [chatMessages, mobileChatOpen]);

    // Intersection Observer to mark messages as read
    useEffect(() => {
        if (!chatMessages || chatMessages.length === 0) return;

        // Check if there are actually any unread messages from the other party
        const hasUnread = chatMessages.some(m => !m.isRead && m.senderRole !== "CLIENT");
        if (!hasUnread) return;

        const observer = new IntersectionObserver(
            (entries) => {
                let shouldMark = false;
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        shouldMark = true;
                        observer.unobserve(entry.target);
                    }
                });
                if (shouldMark && !markMessagesRead.isPending) {
                    markMessagesRead.mutate();
                }
            },
            { threshold: 0.5 }
        );

        // Attach observer to DOM elements with data-unread="true"
        const unreadNodes = document.querySelectorAll('.chat-msg-unread');
        unreadNodes.forEach((node) => observer.observe(node));

        return () => observer.disconnect();
    }, [chatMessages, markMessagesRead.isPending, markMessagesRead, mobileChatOpen]);

    // ─── Loading / not found ───
    if (isLoading) {
        return (
            <div className="pb-20 lg:pb-0">
                <div className="skeleton h-8 w-40 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-4">
                        <div className="skeleton h-[200px] rounded-xl" />
                        <div className="skeleton h-[160px] rounded-xl" />
                    </div>
                    <div className="lg:col-span-2">
                        <div className="skeleton h-[400px] rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-12">
                <p className="text-[#555]">Order not found.</p>
            </div>
        );
    }

    // ─── Computed Values ───
    const statusConfig = ORDER_STATUS[order.status] || {};
    const typeConfig = ORDER_TYPES[order.orderType] || {};
    const messages = Array.isArray(chatMessages) ? chatMessages : [];

    const isModel3 = order.orderType === "MODEL_3";
    const timelineStages = isModel3 ? TIMELINE_STAGES_RTW : TIMELINE_STAGES_CUSTOM;

    const currentStep = statusConfig.step ?? -1;
    const activeStageIdx = getCurrentStageIndex(currentStep, timelineStages);
    const isCancelled = order.status === "CANCELLED";

    const showQuoteActions = order.status === "AWAITING_CLIENT_RESPONSE" && order.totalAgreedFee;

    const agreedFee = Number(order.totalAgreedFee || 0);
    const totalPaid = Number(order.totalPaid || 0);
    const outstanding = Math.max(0, agreedFee - totalPaid);
    const paymentPercent = agreedFee > 0 ? Math.min(100, (totalPaid / agreedFee) * 100) : 0;

    const NON_PAYABLE = ["PENDING_REVIEW", "AWAITING_CLIENT_RESPONSE", "COMPLETED", "CANCELLED"];
    const isPayable = !NON_PAYABLE.includes(order.status) && outstanding > 0 && agreedFee > 0;

    const payments = order.payments || [];

    // Handlers
    const handleSubmitPayment = () => {
        const amount = parseFloat(payAmount);
        if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
        if (amount > outstanding) {
            toast.error(`Cannot pay more than the outstanding balance of ${formatCurrency(outstanding)}`);
            return;
        }

        const formData = new FormData();
        formData.append("orderId", id);
        formData.append("amount", amount);
        // Force FULL payment for Model 3
        formData.append("paymentType", isModel3 ? "FULL" : payType);
        if (payNotes) formData.append("notes", payNotes);
        if (payProof) formData.append("proof", payProof);
        submitPayment.mutate(formData);
    };

    const handleChatFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setChatAttachment(file);
            setChatAttachmentPreview(URL.createObjectURL(file));
        }
    };

    const handleProofFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setPayProof(file);
            setPayProofPreview(URL.createObjectURL(file));
        }
    };

    const handleSendMessage = () => {
        const msg = chatMessage.trim();
        if (!msg && !chatAttachment) return;
        sendMessage.mutate({ message: msg || null, file: chatAttachment });
    };

    return (
        <div className="pb-36 lg:pb-0">
            {/* ─── Breadcrumb: ← My Orders / ORD-2026-XXXX ─── */}
            <div className="flex items-center gap-1.5 text-sm mb-6">
                <Link
                    href="/client/orders"
                    className="inline-flex items-center gap-1 text-[#999] hover:text-[#C2185B] transition-colors"
                >
                    <ArrowLeft size={14} /> My Orders
                </Link>
                <ChevronRight size={12} className="text-[#E0E0E0]" />
                <span className="font-mono-data text-[#0D0D0D] font-medium">{order.orderNumber}</span>
            </div>

            {/* ─── Two-column layout: Left 65%, Right 35% ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* ═══ LEFT COLUMN ═══ */}
                <div className="lg:col-span-3 space-y-6">

                    {/* ── Order Status Card with Vertical Timeline ── */}
                    <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div className="min-w-0">
                                <p className="text-xs font-mono-data text-[#999] mb-1">{order.orderNumber}</p>
                                <h1 className="text-xl font-bold text-[#0D0D0D] truncate">
                                    {order.style?.name || order.items?.[0]?.readyToWear?.name || typeConfig.label || "Order"}
                                </h1>
                                <p className="text-sm text-[#555] mt-1">{typeConfig.label}</p>
                            </div>
                            <StatusPill status={order.status} />
                        </div>

                        {/* Vertical Timeline Stepper */}
                        <div className="space-y-0">
                            {timelineStages.map((stage, i) => {
                                const isCompleted = !isCancelled && i < activeStageIdx;
                                const isCurrent = !isCancelled && i === activeStageIdx;
                                const historyEntry = order.statusHistory?.find((h) => {
                                    const entryStep = ORDER_STATUS[h.status]?.step;
                                    return entryStep !== undefined && entryStep <= stage.maxStep && entryStep >= (i > 0 ? timelineStages[i - 1].maxStep + 1 : 0);
                                });

                                // Show detailed sub-status for the current stage
                                // Shows the actual backend status (e.g. "Cutting", "Out for Delivery") under the broader stage label
                                const actualStatusLabel = statusConfig.label || "";
                                const showDetailedStatus = isCurrent && actualStatusLabel && actualStatusLabel !== stage.label;

                                return (
                                    <div key={stage.key} className="flex gap-3">
                                        {/* Dot + line */}
                                        <div className="flex flex-col items-center">
                                            <div
                                                className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${isCompleted
                                                    ? "bg-[#2E7D32] border-[#2E7D32]"
                                                    : isCurrent
                                                        ? "bg-[#C2185B] border-[#C2185B]"
                                                        : "bg-white border-[#E0E0E0]"
                                                    }`}
                                            >
                                                {isCompleted && <Check size={10} className="text-white" />}
                                            </div>
                                            {i < timelineStages.length - 1 && (
                                                <div className={`w-0.5 flex-1 min-h-[32px] ${isCompleted ? "bg-[#2E7D32]" : "bg-[#E0E0E0]"}`} />
                                            )}
                                        </div>

                                        {/* Label + timestamp */}
                                        <div className={`pb-5 ${i === timelineStages.length - 1 ? "pb-0" : ""}`}>
                                            <p className={`text-sm font-medium ${isCurrent
                                                ? "text-[#C2185B]"
                                                : isCompleted
                                                    ? "text-[#0D0D0D]"
                                                    : "text-[#999]"
                                                }`}>
                                                {stage.label}
                                            </p>

                                            {showDetailedStatus && (
                                                <p className="text-[11px] font-bold text-[#C2185B] mt-0.5 uppercase tracking-wider">
                                                    Status: {actualStatusLabel}
                                                </p>
                                            )}

                                            {(isCurrent || isCompleted) && !showDetailedStatus && (
                                                <p className="text-xs text-[#999] mt-0.5">{stage.description}</p>
                                            )}

                                            {historyEntry && (
                                                <p className="text-[10px] text-[#999] mt-0.5 font-mono-data">
                                                    {new Date(historyEntry.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Admin status note */}
                        {order.statusHistory?.[order.statusHistory.length - 1]?.note && (
                            <div className="mt-4 p-3 rounded-lg bg-[#F4F0F8]">
                                <p className="text-xs text-[#555] italic">
                                    &ldquo;{order.statusHistory[0].note}&rdquo;
                                </p>
                            </div>
                        )}
                    </div>

                    {/* ── Quote Response (if AWAITING_CLIENT_RESPONSE) ── */}
                    {showQuoteActions && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 rounded-xl border-2 border-[#C2185B]/20 bg-[#F8E8F0]/30"
                        >
                            <h3 className="text-base font-semibold text-[#0D0D0D] mb-3">Quote from Studio</h3>
                            <p className="text-2xl font-bold font-mono-data text-[#C2185B] mb-4">
                                {formatCurrency(order.totalAgreedFee)}
                            </p>

                            <div className="flex gap-3 mb-3">
                                <button
                                    onClick={() => respondToQuote.mutate({ action: "ACCEPT" })}
                                    disabled={respondToQuote.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors text-sm"
                                >
                                    <CheckCircle2 size={16} /> Accept Quote
                                </button>
                                <button
                                    onClick={() => setShowNegotiateForm(!showNegotiateForm)}
                                    disabled={respondToQuote.isPending}
                                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] text-[#555] font-semibold hover:bg-[#F4F0F8] transition-colors text-sm"
                                >
                                    <XCircle size={16} /> Decline & Negotiate
                                </button>
                            </div>

                            <AnimatePresence>
                                {showNegotiateForm && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-3 border-t border-[rgba(0,0,0,0.06)]">
                                            <label className="text-xs font-medium text-[#555] mb-1.5 block">Your counteroffer or note</label>
                                            <textarea
                                                value={negotiateNote}
                                                onChange={(e) => setNegotiateNote(e.target.value)}
                                                placeholder="Explain why you'd like a different price, or suggest an alternative amount..."
                                                className="w-full h-20 px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg focus:border-[#C2185B] outline-none resize-none"
                                            />
                                            <button
                                                onClick={() => respondToQuote.mutate({ action: "DECLINE", negotiationNote: negotiateNote || "Client declined" })}
                                                disabled={respondToQuote.isPending}
                                                className="mt-2 px-4 py-2 rounded-lg bg-[#1A1A2E] text-white text-sm font-semibold hover:bg-[#2A2A40] transition-colors"
                                            >
                                                Send Negotiation
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* ── Order Details Card ── */}
                    <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { l: "Order Type", v: typeConfig.label },
                                { l: "Fulfillment", v: order.fulfillmentMethod === "DELIVERY" ? "Delivery" : "Pickup" },
                                // Model 1 & 2: style, measurements, custom description, fabric
                                (!isModel3) && { l: "Style", v: order.style?.name || "Custom design" },
                                (!isModel3) && {
                                    l: "Measurements",
                                    v: order.measurementId || order.measurement
                                        ? <span className="inline-flex items-center gap-1 text-[#2E7D32]"><CheckCircle2 size={12} /> Linked</span>
                                        : <span className="inline-flex items-center gap-1 text-[#E65100]"><AlertCircle size={12} /> Not linked</span>
                                },
                                order.deliveryAddress && { l: "Delivery Address", v: order.deliveryAddress },
                                order.deliveryFee && { l: "Delivery Fee", v: <span className="font-mono-data">{formatCurrency(order.deliveryFee)}</span> },
                                { l: "Created", v: new Date(order.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" }) },
                            ].filter(Boolean).map(({ l, v }) => (
                                <div key={l} className="flex items-start justify-between gap-4">
                                    <span className="text-[#999] shrink-0">{l}</span>
                                    <span className="overflow-x-auto whitespace-nowrap no-scrollbar font-medium text-[#0D0D0D] text-right ml-2 max-w-[200px]">{v}</span>
                                </div>
                            ))}
                        </div>

                        {/* Custom description */}
                        {order.customStyleDescription && (
                            <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.06)]">
                                <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Custom Description</p>
                                <p className="text-xs text-[#555] leading-relaxed">{order.customStyleDescription}</p>
                            </div>
                        )}

                        {/* Fabric notes */}
                        {order.fabricNotes && (
                            <div className="mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)]">
                                <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Fabric Notes</p>
                                <p className="text-xs text-[#555] leading-relaxed">{order.fabricNotes}</p>
                            </div>
                        )}

                        {/* Model 3 — order items list */}
                        {isModel3 && order.items?.length > 0 && (
                            <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)]">
                                <h4 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Order Items</h4>
                                <div className="space-y-3">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA]">
                                            {item.readyToWear?.images?.[0] && (
                                                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#F4F0F8] shrink-0">
                                                    <Image src={item.readyToWear.images[0]} alt={item.readyToWear?.name || ""} fill className="object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[#0D0D0D] truncate">{item.readyToWear?.name || "Item"}</p>
                                                <p className="text-xs text-[#999]">Size: {item.selectedSize} · Qty: {item.quantity}</p>
                                            </div>
                                            <span className="text-sm font-mono-data font-semibold text-[#0D0D0D]">
                                                {formatCurrency(item.priceAtPurchase)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Style image */}
                        {order.style?.images?.[0] && (
                            <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)]">
                                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#F4F0F8]">
                                    {/* blurred background */}
                                    <Image src={order.style.images[0]} alt={order.style.name} fill className="object-cover blur-xl scale-110 opacity-100" />
                                    <Image src={order.style.images[0]} alt={order.style.name} fill className="object-contain" />
                                </div>
                            </div>
                        )}

                        {/* Custom style images */}
                        {order.customStyleImages?.length > 0 && (
                            <div className="mt-5 pt-5 border-t border-[rgba(0,0,0,0.06)]">
                                <h4 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Reference Images</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {order.customStyleImages.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#F4F0F8] cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setLightboxImage(img)}>
                                            <Image src={img} alt={`Reference ${i + 1}`} fill className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Client notes */}
                    {order.clientNotes && (
                        <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Client Notes</h3>
                            <p className="text-sm text-[#555] leading-relaxed">{order.clientNotes}</p>
                        </div>
                    )}

                    {/* ── Payment History Card ── */}
                    <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Payment History</h3>

                        {/* Progress bar: paid vs agreed */}
                        {agreedFee > 0 && (
                            <div className="mb-5">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-[#999]">
                                        Paid <span className="font-mono-data font-semibold text-[#2E7D32]">{formatCurrency(totalPaid)}</span>
                                    </span>
                                    <span className="text-[#999]">
                                        of <span className="font-mono-data font-semibold text-[#0D0D0D]">{formatCurrency(agreedFee)}</span>
                                    </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-[#F4F0F8]">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${paymentPercent}%` }}
                                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                        className="h-full rounded-full bg-[#2E7D32]"
                                    />
                                </div>
                                {outstanding > 0 && (
                                    <p className="text-xs font-mono-data text-[#E65100] mt-1.5">
                                        {formatCurrency(outstanding)} outstanding
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Payment list */}
                        {payments.length === 0 ? (
                            <p className="text-sm text-[#999] text-center py-4">No payments recorded yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {payments.map((p) => {
                                    const pStatus = PAYMENT_STATUS[p.status] || {};
                                    return (
                                        <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA]">
                                            <div>
                                                <p className="text-sm font-mono-data font-semibold text-[#0D0D0D]">
                                                    {formatCurrency(p.amount)}
                                                </p>
                                                <p className="text-[10px] text-[#999] mt-0.5">
                                                    {p.paymentType === "FULL" ? "Full Payment" : "Installment"} · {new Date(p.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                                </p>
                                            </div>
                                            <StatusPill status={p.status} size="small" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Submit payment button */}
                        {isPayable && (
                            <button
                                onClick={() => setShowPayForm(true)}
                                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-lg bg-[#2E7D32] text-white font-semibold hover:bg-[#1B5E20] transition-colors text-sm"
                            >
                                <CreditCard size={16} /> Submit Payment
                            </button>
                        )}
                    </div>
                </div>

                {/* ═══ RIGHT COLUMN — Chat Panel ═══ */}
                <div className="lg:col-span-2 lg:space-y-6">
                    <div
                        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none lg:block lg:z-auto transition-opacity duration-300 ${mobileChatOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto'
                            }`}
                        onClick={(e) => {
                            // Close if clicked on the overlay background
                            if (e.target === e.currentTarget) setMobileChatOpen(false);
                        }}
                    >
                        <div
                            className={`absolute bottom-0 left-0 right-0 h-[100dvh] lg:static lg:h-[calc(100vh-145px)] flex flex-col rounded-t-2xl lg:rounded-xl border-0 lg:border border-[rgba(0,0,0,0.06)] bg-white lg:overflow-hidden lg:sticky lg:top-[72px] transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${mobileChatOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'
                                }`}
                        >
                            {/* Chat header */}
                            <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-2 bg-white shrink-0">
                                <MessageSquare size={16} className="text-[#C2185B]" />
                                <h3 className="text-sm font-semibold text-[#0D0D0D]">Order Chat</h3>
                                <span className="text-[10px] text-[#999] ml-auto">{messages.length} messages</span>
                                <button className="lg:hidden ml-2 p-1.5 rounded-full hover:bg-[#F4F0F8] text-[#555] transition-colors" onClick={() => setMobileChatOpen(false)}>
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-[#FAFAFA]">
                                {messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <MessageSquare size={24} className="text-[#E0E0E0] mb-2" />
                                        <p className="text-sm text-[#999]">No messages yet.</p>
                                        <p className="text-xs text-[#999] mt-1">Send a message to start the conversation.</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => {
                                        const msgDate = new Date(msg.createdAt).setHours(0, 0, 0, 0);
                                        const prevMsgDate = idx > 0 ? new Date(messages[idx - 1].createdAt).setHours(0, 0, 0, 0) : null;
                                        const showDateSeparator = msgDate !== prevMsgDate;

                                        return (
                                            <div key={msg.id} className="flex flex-col gap-3">
                                                {showDateSeparator && (
                                                    <div className="flex items-center justify-center my-1">
                                                        <span className="px-3 py-1 bg-[#F4F0F8] rounded-full text-[10px] font-semibold text-[#999] tracking-wider uppercase">
                                                            {new Date(msg.createdAt).toLocaleDateString("en-NG", {
                                                                weekday: "short",
                                                                day: "numeric",
                                                                month: "short",
                                                                year: new Date(msg.createdAt).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div
                                                    className={`flex ${msg.senderRole === "CLIENT" ? "justify-end" : "justify-start"} ${!msg.isRead && msg.senderRole !== "CLIENT" ? "chat-msg-unread" : ""}`}
                                                    data-unread={!msg.isRead && msg.senderRole !== "CLIENT" ? "true" : "false"}
                                                >
                                                    <div
                                                        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${msg.senderRole === "CLIENT"
                                                            ? "bg-[#C2185B] text-white rounded-br-md"
                                                            : "bg-white text-[#0D0D0D] rounded-bl-md shadow-sm border border-[rgba(0,0,0,0.06)]"
                                                            }`}
                                                    >
                                                        {/* Image attachments — clickable for lightbox */}
                                                        {msg.attachments?.length > 0 && (
                                                            <div className="mb-2 grid gap-1">
                                                                {msg.attachments.map((img, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setLightboxImage(img)}
                                                                        className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#F4F0F8] hover:opacity-80 transition-opacity"
                                                                    >
                                                                        <Image src={img} alt="" fill className="object-cover" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {/* Legacy images field fallback */}
                                                        {!msg.attachments?.length && msg.images?.length > 0 && (
                                                            <div className="mb-2 grid gap-1">
                                                                {msg.images.map((img, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setLightboxImage(img)}
                                                                        className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#F4F0F8] hover:opacity-80 transition-opacity"
                                                                    >
                                                                        <Image src={img} alt="" fill className="object-cover" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {msg.message && <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>}
                                                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.senderRole === "CLIENT" ? "text-white/70" : "text-[#999]"}`}>
                                                            <span className="text-[10px]">
                                                                {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                                                            </span>
                                                            {msg.senderRole === "CLIENT" && (
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
                                <div className="px-3 pt-2 bg-white border-t border-[rgba(0,0,0,0.06)]">
                                    <div className="relative inline-block">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F4F0F8]">
                                            <Image src={chatAttachmentPreview} alt="Attachment" fill className="object-cover" />
                                        </div>
                                        <button
                                            onClick={() => { setChatAttachment(null); setChatAttachmentPreview(null); }}
                                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C62828] text-white flex items-center justify-center"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Chat input */}
                            <div className="px-3 py-3 border-t border-[rgba(0,0,0,0.06)] bg-white flex gap-2 items-end">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleChatFileSelect}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="h-10 w-10 rounded-full flex items-center justify-center text-[#999] hover:bg-[#F4F0F8] transition-colors shrink-0"
                                >
                                    <Paperclip size={16} />
                                </button>
                                <input
                                    type="text"
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (chatMessage.trim() || chatAttachment) && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 h-10 px-3.5 text-sm border border-[#E0E0E0] rounded-full focus:border-[#C2185B] outline-none bg-[#FAFAFA]"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!chatMessage.trim() && !chatAttachment) || sendMessage.isPending}
                                    className="h-10 w-10 rounded-full bg-[#C2185B] text-white flex items-center justify-center hover:bg-[#A01548] disabled:opacity-50 transition-colors shrink-0"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <PaymentInfoCard orderNumber={order?.orderNumber} grandTotal={outstanding} />
                </div>
            </div>



            {/* ─── Mobile Sticky Bottom Action Bar ─── */}
            <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-[rgba(0,0,0,0.06)] z-40 lg:hidden flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button
                    onClick={() => setMobileChatOpen(true)}
                    className="flex flex-1 items-center justify-center gap-2 py-3 rounded-xl border border-[rgba(0,0,0,0.12)] bg-[#F4F0F8] text-[#0D0D0D] font-semibold hover:bg-[#E8E4EC] transition-colors text-sm relative"
                >
                    <MessageSquare size={16} /> Chat
                    {messages.filter(m => !m.isRead && m.senderRole !== "CLIENT").length > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#C2185B]"></span>
                    )}
                </button>
                {isPayable && (
                    <button
                        onClick={() => setShowPayForm(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#2E7D32] text-white font-semibold hover:bg-[#1B5E20] transition-colors text-sm shrink-0"
                    >
                        <CreditCard size={16} /> Pay
                    </button>
                )}
                {showQuoteActions && !isPayable && (
                    <button
                        onClick={() => respondToQuote.mutate({ action: "ACCEPT" })}
                        disabled={respondToQuote.isPending}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors text-sm"
                    >
                        <CheckCircle2 size={16} /> Accept Quote
                    </button>
                )}
            </div>

            {/* ─── Floating Back to Top ─── */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        className="fixed bottom-[160px] lg:bottom-8 right-4 z-30 w-10 h-10 rounded-full bg-[#1A1A2E] text-white shadow-lg flex items-center justify-center hover:bg-[#2A2A40] transition-colors"
                    >
                        <ArrowUp size={16} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ─── Image Lightbox ─── */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setLightboxImage(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-3xl max-h-[85vh] w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setLightboxImage(null)}
                                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center"
                            >
                                <X size={16} className="text-[#0D0D0D]" />
                            </button>
                            <div className="relative w-full h-[70vh] rounded-xl overflow-hidden bg-black">
                                <Image src={lightboxImage} alt="" fill className="object-contain" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Payment Modal ─── */}
            <AnimatePresence>
                {showPayForm && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPayForm(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between shrink-0 bg-white">
                                <h3 className="text-lg font-bold text-[#0D0D0D]">Submit Payment</h3>
                                <button
                                    onClick={() => setShowPayForm(false)}
                                    className="p-2 rounded-full hover:bg-[#F4F0F8] transition-colors text-[#555]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                <div className="space-y-5">
                                    {/* Outstanding balance highlight */}
                                    <div className="p-4 rounded-xl bg-[#F4F0F8] border border-[rgba(0,0,0,0.04)] text-center">
                                        <p className="text-xs text-[#555] mb-1">Outstanding Balance</p>
                                        <p className="text-2xl font-bold font-mono-data text-[#C2185B]">
                                            {formatCurrency(outstanding)}
                                        </p>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="text-sm font-medium text-[#0D0D0D] mb-1.5 flex justify-between">
                                            <span>Amount to Pay</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-mono-data text-[#999]">₦</span>
                                            <input
                                                type="number"
                                                max={outstanding}
                                                value={payAmount}
                                                onChange={(e) => setPayAmount(e.target.value)}
                                                placeholder={outstanding.toString()}
                                                className="w-full h-12 pl-10 pr-4 text-base font-mono-data border border-[#E0E0E0] rounded-xl focus:border-[#C2185B] outline-none transition-colors"
                                            />
                                        </div>
                                    </div>

                                    {/* Payment type — hide for Model 3 */}
                                    {!isModel3 && (
                                        <div>
                                            <label className="text-sm font-medium text-[#0D0D0D] mb-1.5 block">Payment Type</label>
                                            <div className="flex gap-3">
                                                {[{ v: "INSTALLMENT", l: "Installment" }, { v: "FULL", l: "Full Payment" }].map((t) => (
                                                    <button
                                                        key={t.v}
                                                        onClick={() => setPayType(t.v)}
                                                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-colors ${payType === t.v
                                                            ? "border-[#C2185B] bg-[#C2185B]/5 text-[#C2185B]"
                                                            : "border-[#E0E0E0] text-[#555] hover:bg-[#F4F0F8]"
                                                            }`}
                                                    >
                                                        {t.l}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Proof upload */}
                                    <div>
                                        <label className="text-sm font-medium text-[#0D0D0D] mb-1.5 block">Payment Receipt (Optional)</label>
                                        <input
                                            ref={proofInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleProofFileSelect}
                                            className="hidden"
                                        />
                                        {payProofPreview ? (
                                            <div className="relative w-full h-40 rounded-xl overflow-hidden bg-[#FAFAFA] border border-[#E0E0E0] group">
                                                <Image src={payProofPreview} alt="Proof" fill className="object-contain" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setPayProof(null); setPayProofPreview(null); }}
                                                        className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-[#C62828] hover:bg-gray-100 flex items-center gap-2"
                                                    >
                                                        <X size={16} /> Remove
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => proofInputRef.current?.click()}
                                                className="w-full py-8 rounded-xl border-2 border-dashed border-[#E0E0E0] hover:border-[#C2185B] hover:bg-[#C2185B]/5 text-[#999] hover:text-[#C2185B] flex flex-col items-center gap-2 transition-colors"
                                            >
                                                <Upload size={24} />
                                                <span className="text-sm font-medium">Upload Screenshot</span>
                                                <span className="text-xs opacity-70">JPG, PNG up to 5MB</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="text-sm font-medium text-[#0D0D0D] mb-1.5 block">Reference Note (Optional)</label>
                                        <input
                                            type="text"
                                            value={payNotes}
                                            onChange={(e) => setPayNotes(e.target.value)}
                                            placeholder="e.g. Transfer from GTBank..."
                                            className="w-full h-12 px-4 text-sm border border-[#E0E0E0] rounded-xl focus:border-[#C2185B] outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] shrink-0">
                                <button
                                    onClick={handleSubmitPayment}
                                    disabled={submitPayment.isPending || !payAmount || parseFloat(payAmount) > outstanding}
                                    className="w-full h-12 rounded-xl bg-[#2E7D32] text-white font-bold hover:bg-[#1B5E20] disabled:opacity-50 transition-colors text-base flex items-center justify-center gap-2"
                                >
                                    {submitPayment.isPending ? "Submitting..." : (
                                        <>
                                            Submit {payAmount ? formatCurrency(payAmount) : ""}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
