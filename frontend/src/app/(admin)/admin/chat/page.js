"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, MessageSquare, ExternalLink, X, Paperclip, Check, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function AdminChatInboxPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [message, setMessage] = useState("");
    const [chatAttachment, setChatAttachment] = useState(null);
    const [chatAttachmentPreview, setChatAttachmentPreview] = useState(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Get all chat threads (admin inbox)
    const { data: inbox, isLoading } = useQuery({
        queryKey: ["admin-chat-inbox"],
        queryFn: async () => {
            const { data } = await api.get("/chat/admin/inbox");
            return data.data?.inbox || data.data || [];
        },
        staleTime: 0,
    });

    // Get messages for selected order
    const { data: chatMsgs } = useQuery({
        queryKey: ["admin-chat", selectedOrderId],
        queryFn: async () => {
            const { data } = await api.get(`/chat/${selectedOrderId}`);
            return data.data?.messages || data.data || [];
        },
        enabled: !!selectedOrderId,
        staleTime: 0,
        refetchInterval: selectedOrderId ? 60000 : false,
    });

    const threads = Array.isArray(inbox) ? inbox : [];
    const chatMessages = Array.isArray(chatMsgs) ? chatMsgs : [];
    const selectedThread = threads.find((t) => t.id === selectedOrderId);

    // Sort: unread first, then by most recent message
    const sortedThreads = [...threads].sort((a, b) => {
        if ((a.unreadCount || 0) > 0 && (b.unreadCount || 0) === 0) return -1;
        if ((a.unreadCount || 0) === 0 && (b.unreadCount || 0) > 0) return 1;
        const aTime = new Date(a.latestMessage?.createdAt || a.updatedAt || 0);
        const bTime = new Date(b.latestMessage?.createdAt || b.updatedAt || 0);
        return bTime - aTime;
    });

    // Mark as read when thread opens
    useEffect(() => {
        if (selectedOrderId) {
            const thread = threads.find((t) => t.id === selectedOrderId);
            if (thread && thread.unreadCount > 0) {
                api.put(`/chat/${selectedOrderId}/read`).catch(() => { });
                queryClient.invalidateQueries({ queryKey: ["admin-chat-inbox"] });
            }
        }
    }, [selectedOrderId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
                }
            }, 10);
        }
    }, [chatMsgs, selectedOrderId]);

    const sendMsg = useMutation({
        mutationFn: async ({ msg, file }) => {
            if (file) {
                const formData = new FormData();
                if (msg) formData.append("message", msg);
                formData.append("attachments", file);
                const { data } = await api.post(`/chat/${selectedOrderId}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
                return data;
            }
            const { data } = await api.post(`/chat/${selectedOrderId}`, { message: msg });
            return data;
        },
        onSuccess: () => {
            setMessage("");
            setChatAttachment(null);
            setChatAttachmentPreview(null);
            queryClient.invalidateQueries({ queryKey: ["admin-chat", selectedOrderId] });
            queryClient.invalidateQueries({ queryKey: ["admin-chat-inbox"] });
        },
    });

    const handleSendMessage = () => {
        const msg = message.trim();
        if (!msg && !chatAttachment) return;
        sendMsg.mutate({ msg: msg || null, file: chatAttachment });
    };

    const handleChatFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setChatAttachment(file);
        setChatAttachmentPreview(URL.createObjectURL(file));
        e.target.value = "";
    };

    // Relative time helper
    const relativeTime = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const secs = Math.floor((now - d) / 1000);
        if (secs < 60) return "now";
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d`;
        return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
    };

    return (
        <div className="pb-20 lg:pb-0">
            <h1 className="text-2xl font-bold text-foreground mb-6">Chat Inbox</h1>

            <div className="flex gap-0 rounded-xl border border-border bg-white overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
                {/* ─── Left Panel — Conversation List (360px) ─── */}
                <div className={`w-full lg:w-[360px] border-r border-border flex flex-col shrink-0 ${selectedOrderId ? "hidden lg:flex" : "flex"}`}>
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-foreground">Conversations</p>
                        <p className="text-xs text-text-light">{threads.length} thread{threads.length !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-3 space-y-2">
                                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-[72px] rounded-lg" />)}
                            </div>
                        ) : threads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                <MessageSquare size={28} className="text-[#E0E0E0] mb-2" />
                                <p className="text-sm text-muted-foreground">No conversations yet</p>
                                <p className="text-xs text-text-light mt-1">Conversations will appear when clients send messages.</p>
                            </div>
                        ) : (
                            sortedThreads.map((thread) => {
                                const isActive = selectedOrderId === thread.id;
                                const hasUnread = (thread.unreadCount || 0) > 0;
                                return (
                                    <button
                                        key={thread.id}
                                        onClick={() => setSelectedOrderId(thread.id)}
                                        className={`w-full text-left px-4 py-3.5 border-b border-[rgba(0,0,0,0.04)] transition-colors relative ${isActive
                                            ? "bg-primary/5 border-l-[3px] border-l-[#C2185B]"
                                            : "hover:bg-surface-2"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative shrink-0">
                                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                                                    {thread.client?.fullName?.charAt(0) || "?"}
                                                </div>
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${thread.client?.isOnline ? "bg-status-success" : "bg-[#E0E0E0]"
                                                    }`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                                                        {thread.client?.fullName || "Client"}
                                                    </p>
                                                    <span className="text-[10px] text-text-light shrink-0">
                                                        {relativeTime(thread.latestMessage?.createdAt || thread.updatedAt)}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-mono-data text-text-light">{thread.orderNumber}</p>
                                                <div className="flex items-center justify-between gap-2 mt-0.5">
                                                    <p className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-text-light"}`}>
                                                        {thread.latestMessage?.message || "No messages"}
                                                    </p>
                                                    {hasUnread && (
                                                        <span className="bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shrink-0">
                                                            {thread.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ─── Right Panel — Active Conversation ─── */}
                <div className={`flex-1 flex flex-col ${selectedOrderId ? "flex" : "hidden lg:flex"}`}>
                    {!selectedOrderId ? (
                        <div className="flex-1 flex items-center justify-center text-center px-6">
                            <div>
                                <MessageSquare size={40} className="text-[#E0E0E0] mx-auto mb-3" />
                                <p className="text-sm text-text-light">Select a conversation to start chatting</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="px-4 py-3 border-b border-border flex items-center gap-3 bg-white">
                                <button onClick={() => setSelectedOrderId(null)} className="lg:hidden text-text-light hover:text-foreground transition-colors">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="relative shrink-0">
                                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                                        {selectedThread?.client?.fullName?.charAt(0) || "?"}
                                    </div>
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${selectedThread?.client?.isOnline ? "bg-status-success" : "bg-[#E0E0E0]"
                                        }`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-foreground truncate">{selectedThread?.client?.fullName || "Client"}</p>
                                        <span className="text-[10px] text-text-light">{selectedThread?.client?.isOnline ? "Online" : ""}</span>
                                    </div>
                                    <p className="text-[10px] font-mono-data text-text-light">{selectedThread?.orderNumber}</p>
                                </div>
                                <Link href={`/admin/orders/${selectedOrderId}`}
                                    className="flex items-center gap-1 text-xs text-primary font-semibold hover:underline shrink-0">
                                    View Order <ExternalLink size={12} />
                                </Link>
                            </div>

                            {/* Messages */}
                            <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-surface-2">
                                {chatMessages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <MessageSquare size={24} className="text-[#E0E0E0] mb-2" />
                                        <p className="text-sm text-text-light">No messages yet.</p>
                                    </div>
                                ) : (
                                    chatMessages.map((msg, idx) => {
                                        const isAdmin = msg.senderRole !== "CLIENT";
                                        const msgDate = new Date(msg.createdAt).setHours(0, 0, 0, 0);
                                        const prevDate = idx > 0 ? new Date(chatMessages[idx - 1].createdAt).setHours(0, 0, 0, 0) : null;
                                        const showDateSep = msgDate !== prevDate;

                                        return (
                                            <div key={msg.id} className="flex flex-col gap-3">
                                                {showDateSep && (
                                                    <div className="flex items-center justify-center my-1">
                                                        <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-semibold text-text-light tracking-wider uppercase">
                                                            {new Date(msg.createdAt).toLocaleDateString("en-NG", {
                                                                weekday: "short", day: "numeric", month: "short",
                                                            })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm ${isAdmin
                                                        ? "bg-secondary text-white rounded-br-md"
                                                        : "bg-white text-foreground rounded-bl-md shadow-sm border border-border"
                                                        }`}>
                                                        {/* Image attachments */}
                                                        {msg.attachments?.length > 0 && (
                                                            <div className="mb-2 grid gap-1">
                                                                {msg.attachments.map((img, i) => (
                                                                    <button key={i} onClick={() => setLightboxImage(typeof img === "string" ? img : img.url)}
                                                                        className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                                                                        <Image src={typeof img === "string" ? img : img.url} alt="" fill className="object-cover" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {!msg.attachments?.length && msg.images?.length > 0 && (
                                                            <div className="mb-2 grid gap-1">
                                                                {msg.images.map((img, i) => (
                                                                    <button key={i} onClick={() => setLightboxImage(img)}
                                                                        className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted hover:opacity-80 transition-opacity">
                                                                        <Image src={img} alt="" fill className="object-cover" />
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

                            {/* Input */}
                            <div className="px-4 py-3 border-t border-border bg-white flex gap-2 items-end">
                                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChatFileSelect} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="h-10 w-10 rounded-full flex items-center justify-center text-text-light hover:bg-muted transition-colors shrink-0">
                                    <Paperclip size={16} />
                                </button>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && (message.trim() || chatAttachment) && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 h-10 px-3.5 text-sm border border-input rounded-full focus:border-ring outline-none bg-surface-2"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={(!message.trim() && !chatAttachment) || sendMsg.isPending}
                                    className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ─── Image Lightbox ─── */}
            <AnimatePresence>
                {lightboxImage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setLightboxImage(null)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            className="relative max-w-3xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setLightboxImage(null)}
                                className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                                <X size={16} className="text-foreground" />
                            </button>
                            <div className="relative w-full h-[70vh] rounded-xl overflow-hidden bg-black">
                                <Image src={lightboxImage} alt="" fill className="object-contain" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
