"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Check, CheckCheck, ShoppingBag, CreditCard, MessageSquare, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

const TYPE_ICONS = {
    ORDER_PLACED: ShoppingBag,
    ORDER_STATUS_UPDATED: ShoppingBag,
    PROJECT_STARTED: ShoppingBag,
    READY_FOR_PICKUP: ShoppingBag,
    PAYMENT_CONFIRMED: CreditCard,
    PAYMENT_REJECTED: CreditCard,
    NEW_MESSAGE: MessageSquare,
    MEASUREMENT_APPOINTMENT: Calendar,
    ACCOUNT_CREATED: Bell,
};

export default function NotificationDrawer({ open, onClose }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const drawerRef = useRef(null);

    const { data } = useQuery({
        queryKey: ["admin-notifications"],
        queryFn: async () => {
            const { data } = await api.get("/notifications");
            return data.data;
        },
        refetchInterval: 30000, // Poll every 30s
    });

    const notifications = data?.notifications || (Array.isArray(data) ? data : []);
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    const markRead = useMutation({
        mutationFn: (id) => api.put(`/notifications/${id}/read`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
    });

    const markAllRead = useMutation({
        mutationFn: () => api.put("/notifications/read-all"),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
    });

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handleClick = (e) => {
            if (drawerRef.current && !drawerRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open, onClose]);

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, [open, onClose]);

    const handleNotificationClick = (n) => {
        if (!n.isRead) markRead.mutate(n.id);
        if (n.relatedOrderId) {
            router.push(`/admin/orders/${n.relatedOrderId}`);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/20 z-50"
                    />
                    {/* Drawer */}
                    <motion.div
                        ref={drawerRef}
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        className="fixed top-0 right-0 h-full w-full max-w-[380px] bg-white shadow-xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 h-14 border-b border-[rgba(0,0,0,0.06)] shrink-0">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-[#0D0D0D]">Notifications</h3>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#C2185B] text-white font-bold min-w-[18px] text-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={() => markAllRead.mutate()}
                                        className="text-xs text-[#C2185B] font-medium hover:underline flex items-center gap-1"
                                    >
                                        <CheckCheck size={14} /> Read all
                                    </button>
                                )}
                                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F0F8] transition-colors">
                                    <X size={16} className="text-[#999]" />
                                </button>
                            </div>
                        </div>

                        {/* Notification list */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                                    <Bell size={32} className="text-[#E0E0E0] mb-3" />
                                    <p className="text-sm text-[#999]">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {notifications.map((n) => {
                                        const Icon = TYPE_ICONS[n.type] || Bell;
                                        return (
                                            <button
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                className={`w-full text-left flex items-start gap-3 px-5 py-3 hover:bg-[#FAFAFA] transition-colors ${!n.isRead ? "bg-[#FFF5F8]" : ""}`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!n.isRead ? "bg-[#C2185B]/10 text-[#C2185B]" : "bg-[#F4F0F8] text-[#999]"}`}>
                                                    <Icon size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm leading-snug ${!n.isRead ? "text-[#0D0D0D] font-medium" : "text-[#555]"}`}>
                                                        {n.title || n.message}
                                                    </p>
                                                    {n.message && n.title && (
                                                        <p className="text-xs text-[#999] mt-0.5 truncate">{n.message}</p>
                                                    )}
                                                    <p className="text-[10px] text-[#999] mt-1">
                                                        {formatRelativeTime(n.createdAt)}
                                                    </p>
                                                </div>
                                                {!n.isRead && (
                                                    <div className="w-2 h-2 rounded-full bg-[#C2185B] shrink-0 mt-2" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Also export the bell button + badge as a reusable piece
export function NotificationBellButton({ onClick, className = "" }) {
    const { data } = useQuery({
        queryKey: ["admin-notifications"],
        queryFn: async () => {
            const { data } = await api.get("/notifications?unreadOnly=true");
            return data.data;
        },
        refetchInterval: 30000,
    });

    const unreadCount = data?.unreadCount || (Array.isArray(data?.notifications || data) ? (data?.notifications || data).filter((n) => !n.isRead).length : 0);

    return (
        <button onClick={onClick} className={`relative w-9 h-9 rounded-lg bg-[#F4F0F8] flex items-center justify-center text-[#555] hover:bg-[#E8E4EC] transition-colors ${className}`}>
            <Bell size={16} />
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#C2185B] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                </span>
            )}
        </button>
    );
}

function formatRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now - then;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString("en-NG", { dateStyle: "medium" });
}
