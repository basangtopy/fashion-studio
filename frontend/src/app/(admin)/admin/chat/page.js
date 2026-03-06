"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, ArrowLeft, MessageSquare, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { SkeletonCard } from "@/components/shared/Skeleton";

export default function AdminChatInboxPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [message, setMessage] = useState("");
    const messagesEndRef = useRef(null);

    // Get all chat threads (admin inbox)
    const { data: inbox, isLoading } = useQuery({
        queryKey: ["admin-chat-inbox"],
        queryFn: async () => {
            const { data } = await api.get("/chat/admin/inbox");
            return data.data?.threads || data.data || [];
        },
    });

    // Get messages for selected order
    const { data: messages } = useQuery({
        queryKey: ["admin-chat", selectedOrderId],
        queryFn: async () => {
            const { data } = await api.get(`/chat/${selectedOrderId}`);
            return data.data?.messages || data.data || [];
        },
        enabled: !!selectedOrderId,
        refetchInterval: selectedOrderId ? 5000 : false,
    });

    // Mark as read
    useEffect(() => {
        if (selectedOrderId) {
            api.put(`/chat/${selectedOrderId}/read`).catch(() => { });
        }
    }, [selectedOrderId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMsg = useMutation({
        mutationFn: async (msg) => {
            const { data } = await api.post(`/chat/${selectedOrderId}`, { message: msg });
            return data;
        },
        onSuccess: () => {
            setMessage("");
            queryClient.invalidateQueries({ queryKey: ["admin-chat", selectedOrderId] });
            queryClient.invalidateQueries({ queryKey: ["admin-chat-inbox"] });
        },
    });

    const threads = Array.isArray(inbox) ? inbox : [];
    const chatMessages = Array.isArray(messages) ? messages : [];
    const selectedThread = threads.find((t) => t.orderId === selectedOrderId);

    return (
        <div className="pb-20 lg:pb-0">
            <h1 className="text-2xl font-bold text-[#0D0D0D] mb-6">Chat Inbox</h1>

            <div className="flex gap-0 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
                {/* Thread list */}
                <div className={`w-full lg:w-[340px] border-r border-[rgba(0,0,0,0.06)] flex flex-col shrink-0 ${selectedOrderId ? "hidden lg:flex" : "flex"}`}>
                    <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.06)]">
                        <p className="text-sm font-semibold text-[#0D0D0D]">Conversations</p>
                        <p className="text-xs text-[#999]">{threads.length} thread{threads.length !== 1 ? "s" : ""}</p>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-3 space-y-2">
                                {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
                            </div>
                        ) : threads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                <MessageSquare size={28} className="text-[#999] mb-2" />
                                <p className="text-sm text-[#555]">No conversations yet</p>
                            </div>
                        ) : (
                            threads.map((thread) => (
                                <button
                                    key={thread.orderId}
                                    onClick={() => setSelectedOrderId(thread.orderId)}
                                    className={`w-full text-left px-4 py-3 border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAFA] transition-colors ${selectedOrderId === thread.orderId ? "bg-[#F8E8F0]/40" : ""}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                                            {thread.client?.fullName?.charAt(0) || "?"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-[#0D0D0D] truncate">{thread.client?.fullName || "Client"}</p>
                                                {thread.unreadCount > 0 && (
                                                    <span className="bg-[#C2185B] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{thread.unreadCount}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[#999] truncate">{thread.lastMessage || thread.orderNumber}</p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat panel */}
                <div className={`flex-1 flex flex-col ${selectedOrderId ? "flex" : "hidden lg:flex"}`}>
                    {!selectedOrderId ? (
                        <div className="flex-1 flex items-center justify-center text-center px-6">
                            <div>
                                <MessageSquare size={40} className="text-[#E0E0E0] mx-auto mb-3" />
                                <p className="text-sm text-[#999]">Select a conversation to start chatting</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.06)] flex items-center gap-3">
                                <button onClick={() => setSelectedOrderId(null)} className="lg:hidden text-[#999] hover:text-[#0D0D0D]">
                                    <ArrowLeft size={18} />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs">
                                    {selectedThread?.client?.fullName?.charAt(0) || "?"}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#0D0D0D]">{selectedThread?.client?.fullName || "Client"}</p>
                                    <p className="text-[10px] text-[#999]">{selectedThread?.orderNumber}</p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                                {chatMessages.map((msg) => {
                                    const isAdmin = msg.senderRole !== "CLIENT";
                                    return (
                                        <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${isAdmin
                                                ? "bg-[#C2185B] text-white rounded-br-sm"
                                                : "bg-[#F4F0F8] text-[#0D0D0D] rounded-bl-sm"
                                                }`}>
                                                <p>{msg.message}</p>
                                                <p className={`text-[10px] mt-1 ${isAdmin ? "text-white/60" : "text-[#999]"}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <div className="px-4 py-3 border-t border-[rgba(0,0,0,0.06)] flex gap-2">
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && message.trim() && sendMsg.mutate(message)}
                                    placeholder="Type a message..."
                                    className="flex-1 h-10 px-3 text-sm border border-[#E0E0E0] rounded-md focus:border-[#C2185B] outline-none"
                                />
                                <button
                                    onClick={() => message.trim() && sendMsg.mutate(message)}
                                    disabled={!message.trim() || sendMsg.isPending}
                                    className="h-10 w-10 rounded-md bg-[#C2185B] text-white flex items-center justify-center hover:bg-[#A01548] disabled:opacity-50 transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
