"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
    ShoppingBag,
    CreditCard,
    Ruler,
    Calendar,
    ArrowRight,
    Eye,
    MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, getGreeting, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import OrderListItem from "@/components/shared/OrderListItem";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
const LIFECYCLE_STEPS = [
    { label: "Review", maxStep: 0 },
    { label: "Agreement", maxStep: 1 },
    { label: "Payment", maxStep: 2 },
    { label: "Production", maxStep: 6 },    // IN_PROGRESS, CUTTING, SEWING, FINISHING
    { label: "Delivery", maxStep: 8 },       // AWAITING_FINAL_PAYMENT, READY_FOR_PICKUP, OUT_FOR_DELIVERY
    { label: "Complete", maxStep: 9 },
];

function getActiveStep(status) {
    const config = ORDER_STATUS[status];
    if (!config || config.step < 0) return -1; // cancelled
    const step = config.step;
    for (let i = 0; i < LIFECYCLE_STEPS.length; i++) {
        if (step <= LIFECYCLE_STEPS[i].maxStep) return i;
    }
    return LIFECYCLE_STEPS.length - 1;
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon: Icon, color, isCurrency, contextLine, delay = 0 }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
    const numericValue = typeof value === "number" ? value : parseInt(value) || 0;
    const animatedValue = useCountUp(numericValue, 800, isVisible);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 12 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay }}
            className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#999] uppercase tracking-wider">{label}</span>
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold font-mono-data text-[#0D0D0D]">
                {isCurrency ? formatCurrency(animatedValue) : (typeof value === "string" ? value : animatedValue)}
            </p>
            {contextLine && (
                <p className="text-[11px] text-[#999] mt-1">{contextLine}</p>
            )}
        </motion.div>
    );
}

/* ─── Progress Step Dots ─── */
function ProgressSteps({ status }) {
    const activeIdx = getActiveStep(status);
    const isCancelled = activeIdx < 0;

    return (
        <div className="flex items-center gap-1 mt-3">
            {LIFECYCLE_STEPS.map((step, i) => {
                const isCompleted = !isCancelled && i < activeIdx;
                const isActive = !isCancelled && i === activeIdx;
                return (
                    <div key={step.label} className="flex items-center gap-1">
                        <div
                            className={`w-2 h-2 rounded-full transition-colors ${isCompleted
                                ? "bg-[#2E7D32]"
                                : isActive
                                    ? "bg-[#C2185B]"
                                    : "bg-[#E0E0E0]"
                                }`}
                            title={step.label}
                        />
                        {i < LIFECYCLE_STEPS.length - 1 && (
                            <div className={`w-3 h-[1.5px] ${isCompleted ? "bg-[#2E7D32]" : "bg-[#E0E0E0]"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main Dashboard ─── */
export default function ClientDashboard() {
    const { user } = useAuth();

    const { data: orders, isLoading: ordersLoading } = useQuery({
        queryKey: ["client-orders"],
        queryFn: async () => {
            const { data } = await api.get("/orders");
            return data.data?.orders || data.data || [];
        },
    });

    const { data: notifData } = useQuery({
        queryKey: ["client-notifications"],
        queryFn: async () => {
            const { data } = await api.get("/notifications");
            return data.data;
        },
        refetchInterval: 30000,
    });

    const allOrders = Array.isArray(orders) ? orders : [];
    const activeOrders = allOrders.filter(
        (o) => !["COMPLETED", "CANCELLED"].includes(o.status)
    );
    const totalPaid = allOrders.reduce((s, o) => s + Number(o.totalPaid || 0), 0);
    const outstandingBalance = allOrders.reduce((s, o) => {
        const agreed = Number(o.agreedFee || o.totalAgreedFee || 0);
        const paid = Number(o.totalPaid || 0);
        return s + Math.max(0, agreed - paid);
    }, 0);

    const notifications = notifData?.notifications || (Array.isArray(notifData) ? notifData : []);
    const recentNotifs = notifications.slice(0, 3);

    // Format today's date
    const today = new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="pb-20 lg:pb-0">
            {/* ─── Welcome Header ─── */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#0D0D0D] mb-1">
                    {getGreeting()}, {user?.fullName?.split(" ")[0] || "there"}
                </h1>
                <p className="text-sm text-[#999]">{today}</p>
            </div>

            {/* ─── Stat Cards (4) ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {ordersLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
                ) : (
                    <>
                        <StatCard
                            label="Active Orders"
                            value={activeOrders.length}
                            icon={ShoppingBag}
                            color="#6A1B9A"
                            delay={0}
                            contextLine={`${allOrders.length} total orders`}
                        />
                        <StatCard
                            label="Total Paid"
                            value={totalPaid}
                            icon={CreditCard}
                            color="#2E7D32"
                            delay={0.06}
                            isCurrency
                        />
                        <StatCard
                            label="Outstanding Balance"
                            value={outstandingBalance}
                            icon={CreditCard}
                            color="#E65100"
                            delay={0.12}
                            isCurrency
                            contextLine={outstandingBalance > 0 ? "Across all orders" : "All clear!"}
                        />
                        <StatCard
                            label="Upcoming Appointment"
                            value="None booked"
                            icon={Calendar}
                            color="#1565C0"
                            delay={0.18}
                        />
                    </>
                )}
            </div>

            {/* ─── Active Orders ─── */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[#0D0D0D]">Active Orders</h2>
                    <Link
                        href="/client/orders"
                        className="text-xs font-semibold text-[#C2185B] hover:underline flex items-center gap-1"
                    >
                        View all <ArrowRight size={12} />
                    </Link>
                </div>

                {ordersLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : activeOrders.length === 0 ? (
                    <EmptyState
                        icon={ShoppingBag}
                        title="No active orders"
                        description="Browse our catalog to place your first order."
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
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
                        }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                    >
                        {activeOrders.slice(0, 4).map((order) => (
                            <motion.div
                                key={order.id}
                                className="h-full"
                                variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            >
                                <OrderListItem order={order} variant="card" />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* ─── Quick Actions ─── */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-[#0D0D0D] mb-4">Quick Actions</h2>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
                    }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                >
                    {[
                        { href: "/catalog/styles", icon: ShoppingBag, label: "Place New Order", color: "#C2185B" },
                        { href: "/client/measurements", icon: Ruler, label: "Update Measurements", color: "#6A1B9A" },
                        { href: "/client/appointments", icon: Calendar, label: "Book Appointment", color: "#1565C0" },
                        { href: "/portfolio", icon: Eye, label: "View Portfolio", color: "#2E7D32" },
                    ].map((action) => (
                        <motion.div key={action.label} variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                            <Link
                                href={action.href}
                                className="h-full p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors flex flex-col items-center text-center gap-2"
                            >
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: `${action.color}15` }}
                                >
                                    <action.icon size={18} style={{ color: action.color }} />
                                </div>
                                <span className="text-xs font-medium text-[#555]">{action.label}</span>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* ─── Recent Notifications ─── */}
            {
                recentNotifs.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-[#0D0D0D]">Recent Notifications</h2>
                            <Button
                                variant="link"
                                className="h-auto p-0 text-xs font-semibold text-[#C2185B]"
                            >
                                View all
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {recentNotifs.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${n.isRead
                                        ? "border-[rgba(0,0,0,0.06)] bg-white"
                                        : "border-[#C2185B]/20 bg-[#FFF5F8]"
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.isRead ? "bg-transparent" : "bg-[#C2185B]"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${n.isRead ? "text-[#555]" : "text-[#0D0D0D] font-medium"}`}>
                                            {n.title || n.message}
                                        </p>
                                        <p className="text-[10px] text-[#999] mt-0.5">
                                            {new Date(n.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }
        </div >
    );
}
