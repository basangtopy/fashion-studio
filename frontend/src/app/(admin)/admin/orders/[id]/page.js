"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    MessageSquare,
    Send,
    Ruler,
    CreditCard,
    CheckCircle2,
    XCircle,
    ChevronDown,
    Save,
    Upload,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminOrderDetailPage() {
    const { id } = useParams();
    const toast = useToast();
    const { isSuperAdmin } = useAuth();
    const queryClient = useQueryClient();
    const [quoteAmount, setQuoteAmount] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [chatMessage, setChatMessage] = useState("");
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

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
        refetchInterval: 5000,
    });

    const sendQuote = useMutation({
        mutationFn: async () => {
            const { data } = await api.put(`/admin/orders/${id}/quote`, {
                adminQuote: Number(quoteAmount),
                adminNote,
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Quote sent!", "The client will be notified.");
            setQuoteAmount("");
            setAdminNote("");
            queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to send quote."),
    });

    const updateStatus = useMutation({
        mutationFn: async (status) => {
            const { data } = await api.put(`/admin/orders/${id}/status`, { status });
            return data;
        },
        onSuccess: () => {
            toast.success("Status updated!");
            setShowStatusDropdown(false);
            queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to update."),
    });

    const sendMsg = useMutation({
        mutationFn: async (message) => {
            const { data } = await api.post(`/chat/${id}`, { message });
            return data;
        },
        onSuccess: () => {
            setChatMessage("");
            queryClient.invalidateQueries({ queryKey: ["chat", id] });
        },
    });

    if (isLoading) {
        return <div className="space-y-4"><div className="skeleton h-8 w-40" /><div className="skeleton h-[400px] rounded-xl" /></div>;
    }

    if (!order) {
        return <div className="text-center py-12"><p className="text-[#555]">Order not found.</p></div>;
    }

    const statusConfig = ORDER_STATUS[order.status] || {};
    const typeConfig = ORDER_TYPES[order.orderType] || {};
    const messages = Array.isArray(chatMessages) ? chatMessages : [];
    const canSendQuote = order.status === "PENDING_REVIEW";

    return (
        <div className="pb-20 lg:pb-0">
            <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#C2185B] mb-6 transition-colors">
                <ArrowLeft size={14} /> All Orders
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Header */}
                    <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-xs font-mono-data text-[#999] mb-1">{order.orderNumber}</p>
                                <h1 className="text-xl font-bold text-[#0D0D0D]">{order.style?.name || typeConfig.label || "Order"}</h1>
                                <p className="text-sm text-[#555] mt-1">{typeConfig.label} · {order.client?.fullName || "Client"}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <StatusPill status={order.status} />
                                {/* Status update dropdown */}
                                <div className="relative">
                                    <button onClick={() => setShowStatusDropdown(!showStatusDropdown)} className="w-8 h-8 rounded-md border border-[#E0E0E0] flex items-center justify-center hover:bg-[#F4F0F8]">
                                        <ChevronDown size={14} />
                                    </button>
                                    {showStatusDropdown && (
                                        <div className="absolute right-0 top-10 z-20 w-56 bg-white rounded-xl border border-[rgba(0,0,0,0.06)] shadow-lg p-2">
                                            {Object.entries(ORDER_STATUS).map(([key, val]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => updateStatus.mutate(key)}
                                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${key === order.status ? "bg-[#F4F0F8] font-medium" : "hover:bg-[#FAFAFA]"
                                                        }`}
                                                >
                                                    {val.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Timeline - simple progress */}
                        <div className="w-full h-1.5 rounded-full bg-[#F4F0F8]">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.max(5, ((statusConfig.step || 0) / 10) * 100)}%`,
                                    backgroundColor: statusConfig.text || "#C2185B",
                                }}
                            />
                        </div>
                    </div>

                    {/* Quote Form */}
                    {canSendQuote && (
                        <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Send Quote</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Amount (₦)</label>
                                    <Input type="number" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} placeholder="e.g. 25000" className="h-10 font-mono-data bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Note (optional)</label>
                                    <Input type="text" value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Any notes for client" className="h-10 bg-white" />
                                </div>
                            </div>
                            <Button onClick={() => sendQuote.mutate()} disabled={!quoteAmount || sendQuote.isPending} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1">
                                <Send size={14} /> {sendQuote.isPending ? "Sending..." : "Send Quote"}
                            </Button>
                        </div>
                    )}

                    {/* Chat */}
                    <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden">
                        <div className="px-5 py-3 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-2">
                            <MessageSquare size={16} className="text-[#C2185B]" />
                            <h3 className="text-sm font-semibold text-[#0D0D0D]">Chat with Client</h3>
                        </div>
                        <div className="h-[300px] overflow-y-auto custom-scrollbar p-4 space-y-3">
                            {messages.length === 0 ? (
                                <p className="text-sm text-[#999] text-center py-8">No messages yet.</p>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.senderRole !== "CLIENT" ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${msg.senderRole !== "CLIENT" ? "bg-[#1A1A2E] text-white rounded-br-sm" : "bg-[#F4F0F8] text-[#0D0D0D] rounded-bl-sm"}`}>
                                            <p>{msg.message}</p>
                                            <p className={`text-[10px] mt-1 ${msg.senderRole !== "CLIENT" ? "text-white/60" : "text-[#999]"}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="px-4 py-3 border-t border-[rgba(0,0,0,0.06)] flex gap-2">
                            <Input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && chatMessage.trim() && sendMsg.mutate(chatMessage)} placeholder="Type a message..." className="h-10 bg-white" />
                            <Button onClick={() => chatMessage.trim() && sendMsg.mutate(chatMessage)} disabled={!chatMessage.trim()} className="h-10 w-10 p-0 bg-[#1A1A2E] text-white hover:bg-[#2A2A40] shrink-0"><Send size={16} /></Button>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { l: "Client", v: order.client?.fullName || "—" },
                                { l: "Email", v: order.client?.email || "—" },
                                { l: "Type", v: typeConfig.label },
                                { l: "Style", v: order.style?.name || "—" },
                                { l: "Quote", v: order.adminQuote ? formatCurrency(order.adminQuote) : "—" },
                                { l: "Agreed Fee", v: order.agreedFee ? formatCurrency(order.agreedFee) : "—" },
                                { l: "Total Paid", v: formatCurrency(order.totalPaid || 0) },
                                { l: "Balance", v: order.agreedFee ? formatCurrency(order.agreedFee - (order.totalPaid || 0)) : "—" },
                                { l: "Created", v: new Date(order.createdAt).toLocaleDateString("en-NG") },
                            ].map(({ l, v }) => (
                                <div key={l} className="flex items-center justify-between">
                                    <span className="text-[#999]">{l}</span>
                                    <span className="font-medium text-[#0D0D0D] text-right truncate ml-2 max-w-[140px]">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Client measurements link */}
                    {order.client?.id && (
                        <Link href={`/admin/clients/${order.client.id}`} className="flex items-center gap-2 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[#C2185B]/30 transition-colors">
                            <Ruler size={16} className="text-[#C2185B]" />
                            <span className="text-sm font-medium text-[#0D0D0D]">View Client Profile</span>
                        </Link>
                    )}

                    {/* Style image */}
                    {order.style?.images?.[0] && (
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#F4F0F8]">
                            <Image src={order.style.images[0]} alt={order.style.name} fill className="object-cover" />
                        </div>
                    )}

                    {/* Client notes */}
                    {order.clientNotes && (
                        <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Client Notes</h3>
                            <p className="text-sm text-[#555] leading-relaxed">{order.clientNotes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
