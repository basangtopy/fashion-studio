"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, ArrowUpDown, Plus, Sparkles, X, Shirt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
import OrderListItem from "@/components/shared/OrderListItem";
import { Button } from "@/components/ui/button";
import NewOrderDialog from "@/components/shared/NewOrderDialog";

const TABS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

// ── Animated speed-dial FAB ──────────────────────────────────────────────────

const FAB_OPTIONS = [
    {
        label: "Browse Styles",
        icon: Shirt,
        href: "/catalog/styles",
        color: 'var(--color-brand-primary)',
        bg: "#FFF5F8",
    },
    {
        label: "Custom Style",
        icon: Sparkles,
        href: "/client/orders/new?mode=custom",
        color: 'var(--color-status-info)',
        bg: "#EFF6FF",
    },
];

function SpeedDial() {
    const [open, setOpen] = useState(false);

    return (
        <div className="sm:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
            {/* Sub-buttons */}
            <AnimatePresence>
                {open &&
                    FAB_OPTIONS.map((opt, i) => {
                        const Icon = opt.icon;
                        return (
                            <motion.div
                                key={opt.label}
                                initial={{ opacity: 0, y: 12, scale: 0.85 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.85 }}
                                transition={{
                                    delay: open ? (FAB_OPTIONS.length - 1 - i) * 0.06 : i * 0.04,
                                    duration: 0.22,
                                    ease: [0.16, 1, 0.3, 1],
                                }}
                                className="flex items-center gap-2"
                            >
                                {/* Label chip */}
                                <div className="bg-white text-foreground text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-[rgba(0,0,0,0.08)]">
                                    {opt.label}
                                </div>
                                {/* Icon button */}
                                <Link
                                    href={opt.href}
                                    onClick={() => setOpen(false)}
                                    className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform active:scale-95"
                                    style={{ background: opt.bg, border: `2px solid ${opt.color}22` }}
                                >
                                    <Icon size={18} style={{ color: opt.color }} />
                                </Link>
                            </motion.div>
                        );
                    })}
            </AnimatePresence>

            {/* Main FAB */}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all duration-200 active:scale-95"
                aria-label="New order"
            >
                <motion.div
                    animate={{ rotate: open ? 45 : 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                    <Plus size={24} />
                </motion.div>
            </button>

            {/* Backdrop to close */}
            {open && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setOpen(false)}
                />
            )}
        </div>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClientOrdersPage() {
    return (
        <Suspense fallback={null}>
            <ClientOrdersContent />
        </Suspense>
    );
}

function ClientOrdersContent() {
    const [tab, setTab] = useState("all");
    const [sortNewest, setSortNewest] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["client-orders"],
        queryFn: async () => {
            const { data } = await api.get("/orders");
            return data.data?.orders || data.data || [];
        },
    });

    const orders = Array.isArray(data) ? data : [];

    const counts = {
        all: orders.length,
        active: orders.filter((o) => !["COMPLETED", "CANCELLED"].includes(o.status)).length,
        completed: orders.filter((o) => o.status === "COMPLETED").length,
        cancelled: orders.filter((o) => o.status === "CANCELLED").length,
    };

    const filtered = orders
        .filter((order) => {
            if (tab === "active") return !["COMPLETED", "CANCELLED"].includes(order.status);
            if (tab === "completed") return order.status === "COMPLETED";
            if (tab === "cancelled") return order.status === "CANCELLED";
            return true;
        })
        .sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortNewest ? dateB - dateA : dateA - dateB;
        });

    return (
        <div className="pb-[80px] lg:pb-[160px] overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
                <Button
                    onClick={() => setDialogOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 h-auto rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                    <Plus size={15} />
                    New Order
                </Button>
            </div>

            {/* Tab bar */}
            <div className="flex items-center justify-between gap-3 mb-6 w-full max-w-full">
                <div className="flex-1 overflow-x-auto no-scrollbar pb-1 min-w-0">
                    <div className="flex gap-2 w-max pr-2">
                        {TABS.map((t) => (
                            <Button
                                key={t.value}
                                variant="ghost"
                                onClick={() => setTab(t.value)}
                                className={`relative h-auto px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors hover:bg-[#E0E0E0] ${tab === t.value
                                    ? "bg-secondary text-white hover:text-white hover:bg-secondary"
                                    : "bg-muted text-muted-foreground hover:text-muted-foreground"
                                    }`}
                            >
                                {t.label}
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.value
                                    ? "bg-white/20 text-white"
                                    : "bg-[#E0E0E0] text-muted-foreground"
                                    }`}>
                                    {counts[t.value]}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Sort toggle */}
                <Button
                    variant="ghost"
                    onClick={() => setSortNewest(!sortNewest)}
                    className="flex items-center gap-1 h-auto px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground bg-muted hover:bg-[#E0E0E0] transition-colors shrink-0"
                >
                    <ArrowUpDown size={12} />
                    <span>{sortNewest ? "Newest" : "Oldest"}</span>
                </Button>
            </div>

            {/* Orders list */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="No orders found"
                    description={tab === "all" ? "You haven't placed any orders yet." : `No ${tab} orders.`}
                    action={
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Place New Order <ArrowRight size={14} />
                        </button>
                    }
                />
            ) : (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={tab + sortNewest}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {filtered.map((order, i) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                            >
                                <OrderListItem order={order} />
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}

            {/* Animated speed-dial FAB (mobile) */}
            <SpeedDial />

            {/* New Order Dialog */}
            <NewOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}
