"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ArrowRight, ArrowUpDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonCard } from "@/components/shared/Skeleton";
import OrderListItem from "@/components/shared/OrderListItem";
import { Button } from "@/components/ui/button";

const TABS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
];

export default function ClientOrdersPage() {
    const [tab, setTab] = useState("all");
    const [sortNewest, setSortNewest] = useState(true);

    const { data, isLoading } = useQuery({
        queryKey: ["client-orders"],
        queryFn: async () => {
            const { data } = await api.get("/orders");
            return data.data?.orders || data.data || [];
        },
    });

    const orders = Array.isArray(data) ? data : [];

    // Count per tab
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
                <h1 className="text-2xl font-bold text-[#0D0D0D]">My Orders</h1>
                <Link
                    href="/catalog/styles"
                    className="hidden sm:flex items-center gap-1 px-4 py-2 rounded-md bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors"
                >
                    <ShoppingBag size={14} />
                    New Order
                </Link>
            </div>

            {/* Tab bar with count badges */}
            <div className="flex items-center justify-between gap-3 mb-6 w-full max-w-full">
                <div className="flex-1 overflow-x-auto no-scrollbar pb-1 min-w-0">
                    <div className="flex gap-2 w-max pr-2">
                        {TABS.map((t) => (
                            <Button
                                key={t.value}
                                variant="ghost"
                                onClick={() => setTab(t.value)}
                                className={`relative h-auto px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors hover:bg-[#E0E0E0] ${tab === t.value
                                    ? "bg-[#1A1A2E] text-white hover:text-white hover:bg-[#1A1A2E]"
                                    : "bg-[#F4F0F8] text-[#555] hover:text-[#555]"
                                    }`}
                            >
                                {t.label}
                                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold ${tab === t.value
                                    ? "bg-white/20 text-white"
                                    : "bg-[#E0E0E0] text-[#555]"
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
                    className="flex items-center gap-1 h-auto px-3 py-2 rounded-lg text-xs font-medium text-[#555] bg-[#F4F0F8] hover:bg-[#E0E0E0] transition-colors shrink-0"
                >
                    <ArrowUpDown size={12} />
                    <span className="hidden sm:inline">{sortNewest ? "Newest" : "Oldest"}</span>
                    <span className="sm:hidden">{sortNewest ? "Newest" : "Oldest"}</span>
                </Button>
            </div>

            {/* Orders List */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={ShoppingBag}
                    title="No orders found"
                    description={tab === "all" ? "You haven't placed any orders yet." : `No ${tab} orders.`}
                    action={
                        <Link
                            href="/catalog/styles"
                            className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors"
                        >
                            Explore Styles <ArrowRight size={14} />
                        </Link>
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

            {/* Mobile FAB */}
            <Link
                href="/catalog/styles"
                className="sm:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-[#C2185B] text-white shadow-lg flex items-center justify-center hover:bg-[#A01548] transition-colors"
            >
                <ShoppingBag size={20} />
            </Link>
        </div>
    );
}
