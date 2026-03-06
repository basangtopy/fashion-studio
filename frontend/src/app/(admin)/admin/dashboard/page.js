"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ShoppingBag, Users, CreditCard, TrendingUp, Calendar, ArrowRight,
    CheckCircle2, XCircle, Clock, BarChart3, Download, FileText, MessageSquare,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";
import CustomSelect from "@/components/shared/CustomSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PIE_COLORS = ["#F9A825", "#6A1B9A", "#2E7D32", "#1565C0", "#C62828", "#1A1A2E", "#E65100", "#00695C", "#AD1457"];

// Date range presets
const getDatePresets = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const start3Mo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const fmt = (d) => d.toISOString().split("T")[0];
    return [
        { value: "all", label: "All Time" },
        { value: "this_month", label: "This Month", from: fmt(startOfMonth), to: fmt(now) },
        { value: "last_month", label: "Last Month", from: fmt(startOfLastMonth), to: fmt(endOfLastMonth) },
        { value: "last_3_months", label: "Last 3 Months", from: fmt(start3Mo), to: fmt(now) },
        { value: "ytd", label: "Year to Date", from: fmt(startOfYear), to: fmt(now) },
        { value: "custom", label: "Custom Range" },
    ];
};

function StatCard({ label, value, icon: Icon, color, isCurrency, subtext }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
    const num = typeof value === "number" ? value : parseInt(value) || 0;
    const animatedValue = useCountUp(num, 800, isVisible);

    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
            className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium text-[#999] uppercase tracking-wider">{label}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold font-mono-data text-[#0D0D0D]">
                {isCurrency ? formatCurrency(animatedValue) : animatedValue}
            </p>
            {subtext && <p className="text-[10px] mt-1 text-[#999]">{subtext}</p>}
        </motion.div>
    );
}

export default function AdminDashboard() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const presets = useMemo(getDatePresets, []);

    const [datePreset, setDatePreset] = useState("all");
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [exporting, setExporting] = useState(null);

    // Compute from/to based on preset
    const { from, to } = useMemo(() => {
        if (datePreset === "custom") return { from: customFrom, to: customTo };
        if (datePreset === "all") return { from: "", to: "" };
        const preset = presets.find((p) => p.value === datePreset);
        return { from: preset?.from || "", to: preset?.to || "" };
    }, [datePreset, customFrom, customTo, presets]);

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ["admin-dashboard", from, to],
        queryFn: async () => {
            const params = {};
            if (from) params.from = from;
            if (to) params.to = to;
            const { data } = await api.get("/admin/dashboard", { params });
            return data.data;
        },
    });

    const { data: pendingPayments } = useQuery({
        queryKey: ["admin-pending-payments"],
        queryFn: async () => {
            const { data } = await api.get("/admin/payments", { params: { status: "PENDING" } });
            return data.data?.payments || data.data || [];
        },
    });

    const confirmPayment = useMutation({
        mutationFn: async (id) => { const { data } = await api.put(`/admin/payments/${id}/confirm`); return data; },
        onSuccess: () => { toast.success("Payment confirmed!"); queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] }); queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
    });

    const rejectPayment = useMutation({
        mutationFn: async (id) => { const { data } = await api.put(`/admin/payments/${id}/reject`, { reason: "Rejected by admin" }); return data; },
        onSuccess: () => { toast.info("Payment rejected"); queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] }); },
    });

    const handleExport = async (format) => {
        setExporting(format);
        try {
            const params = { format };
            if (from) params.from = from;
            if (to) params.to = to;
            const response = await api.get("/admin/dashboard/export", { params, responseType: "blob" });
            const blob = new Blob([response.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `dashboard-report.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Export failed", err.response?.data?.message || "Please try again.");
        } finally {
            setExporting(null);
        }
    };

    const stats = dashboardData || {};
    const payments = Array.isArray(pendingPayments) ? pendingPayments : [];
    const recentOrders = Array.isArray(stats.recentOrders) ? stats.recentOrders : [];

    const toChartArray = (data, labelMap, fallback) => {
        if (data && typeof data === "object" && !Array.isArray(data)) {
            const entries = Object.entries(data).filter(([, v]) => Number(v) > 0);
            if (entries.length > 0) return entries.map(([key, value]) => ({ name: (labelMap && labelMap[key]?.label) || key.replace(/_/g, " "), value: Number(value) || 0 }));
        }
        if (Array.isArray(data) && data.length > 0) return data;
        return fallback;
    };

    const revenueData = Array.isArray(stats.revenueTimeSeries) && stats.revenueTimeSeries.length > 0 ? stats.revenueTimeSeries : [];
    const ordersData = Array.isArray(stats.ordersTimeSeries) && stats.ordersTimeSeries.length > 0 ? stats.ordersTimeSeries : [];
    const ordersByStatus = toChartArray(stats.ordersByStatus, ORDER_STATUS, []);
    const ordersByType = toChartArray(stats.ordersByType, { MODEL_1: { label: "Model 1" }, MODEL_2: { label: "Model 2" }, MODEL_3: { label: "Ready-to-Wear" } }, []);

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header with date picker and export */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D0D0D]">Admin Dashboard</h1>
                        <p className="text-sm text-[#999]">
                            {stats.periodLabel || "Overview of your fashion studio operations."}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={() => handleExport("csv")} disabled={!!exporting} className="gap-1.5 text-[#555] h-9">
                            <Download size={14} /> {exporting === "csv" ? "..." : "CSV"}
                        </Button>
                        <Button variant="outline" onClick={() => handleExport("pdf")} disabled={!!exporting} className="gap-1.5 text-[#555] h-9">
                            <FileText size={14} /> {exporting === "pdf" ? "..." : "PDF"}
                        </Button>
                    </div>
                </div>

                {/* Date Range Picker */}
                <div className="flex flex-wrap items-center gap-2">
                    <CustomSelect
                        options={presets.map((p) => ({ value: p.value, label: p.label }))}
                        value={datePreset}
                        onChange={setDatePreset}
                        placeholder="Filter period..."
                        className="w-[180px]"
                    />
                    {datePreset === "custom" && (
                        <div className="flex items-center gap-2">
                            <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                                className="h-9 bg-white w-auto" />
                            <span className="text-xs text-[#999]">to</span>
                            <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                                className="h-9 bg-white w-auto" />
                        </div>
                    )}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)
                ) : (
                    <>
                        <StatCard label="Total Orders" value={stats.totalOrders || 0} icon={ShoppingBag} color="#C2185B" subtext={from ? `${stats.ordersInPeriod || 0} in period` : null} />
                        <StatCard label="Active" value={stats.activeOrders || 0} icon={Clock} color="#6A1B9A" />
                        <StatCard label="Revenue" value={stats.totalRevenue || 0} icon={TrendingUp} color="#2E7D32" isCurrency subtext={from ? `${formatCurrency(stats.revenueInPeriod || 0)} in period` : null} />
                        <StatCard label="Clients" value={stats.totalClients || 0} icon={Users} color="#1565C0" subtext={from ? `${stats.newClientsInPeriod || 0} new in period` : null} />
                        <StatCard label="Pending Payments" value={stats.pendingPayments || payments.length} icon={CreditCard} color="#E65100" />
                        <StatCard label="Unread Chats" value={stats.unreadChats || 0} icon={MessageSquare} color="#F9A825" />
                    </>
                )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Revenue Over Time</h3>
                    {revenueData.length === 0 ? (
                        <p className="text-xs text-[#999] py-12 text-center">No revenue data for this period.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#C2185B" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#C2185B" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F4F0F8" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#999" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v) => formatCurrency(v)} />
                                <Area type="monotone" dataKey="revenue" stroke="#C2185B" fill="url(#revenueGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Orders by Status (Donut) */}
                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Orders by Status</h3>
                    {ordersByStatus.length === 0 ? (
                        <p className="text-xs text-[#999] py-12 text-center">No data for this period.</p>
                    ) : (
                        <>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                        {ordersByStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-2 mt-2 justify-center">
                                {ordersByStatus.map((item, i) => (
                                    <span key={item.name} className="flex items-center gap-1 text-[10px] text-[#555]">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />{item.name}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Orders by Type + Pending Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Orders by Type</h3>
                    {ordersByType.length === 0 ? (
                        <p className="text-xs text-[#999] py-12 text-center">No data.</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={ordersByType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F4F0F8" />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#999" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#999" }} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#C2185B" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Pending Payments */}
                <div className="lg:col-span-2 p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#0D0D0D]">Pending Payments</h3>
                        <Link href="/admin/payments" className="text-xs text-[#C2185B] font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
                    </div>
                    {payments.length === 0 ? (
                        <p className="text-sm text-[#999] py-8 text-center">No pending payments!</p>
                    ) : (
                        <div className="space-y-3">
                            {payments.slice(0, 4).map((pay) => (
                                <div key={pay.id} className="flex items-center justify-between p-3 rounded-lg bg-[#FAFAFA]">
                                    <div>
                                        <p className="text-sm font-semibold text-[#0D0D0D]">{formatCurrency(pay.amount)}</p>
                                        <p className="text-xs text-[#999]">{pay.order?.orderNumber || "—"} · {pay.client?.fullName || "Client"}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => confirmPayment.mutate(pay.id)} className="h-8 w-8 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32]">
                                            <CheckCircle2 size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => rejectPayment.mutate(pay.id)} className="h-8 w-8 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C62828]">
                                            <XCircle size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders */}
            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#0D0D0D]">Recent Orders</h3>
                    <Link href="/admin/orders" className="text-xs text-[#C2185B] font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
                </div>
                {recentOrders.length === 0 ? (
                    <p className="text-sm text-[#999] py-8 text-center">No orders yet.</p>
                ) : (
                    <>
                        {/* Mobile: cards */}
                        <div className="space-y-2 lg:hidden">
                            {recentOrders.map((order) => (
                                <Link key={order.id} href={`/admin/orders/${order.id}`}
                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors">
                                    <div>
                                        <p className="font-mono-data text-xs text-[#C2185B]">{order.orderNumber}</p>
                                        <p className="text-sm text-[#0D0D0D]">{order.client?.fullName || "—"}</p>
                                    </div>
                                    <div className="text-right">
                                        <StatusPill status={order.status} size="small" />
                                        <p className="text-xs font-mono-data mt-1">{order.totalAgreedFee ? formatCurrency(order.totalAgreedFee) : "—"}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        {/* Desktop: table */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[rgba(0,0,0,0.06)]">
                                        <th className="text-left text-xs font-medium text-[#999] py-3 pr-4">Order</th>
                                        <th className="text-left text-xs font-medium text-[#999] py-3 pr-4">Client</th>
                                        <th className="text-left text-xs font-medium text-[#999] py-3 pr-4">Type</th>
                                        <th className="text-left text-xs font-medium text-[#999] py-3 pr-4">Status</th>
                                        <th className="text-right text-xs font-medium text-[#999] py-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-[#FAFAFA] transition-colors">
                                            <td className="py-3 pr-4">
                                                <Link href={`/admin/orders/${order.id}`} className="font-mono-data text-xs text-[#C2185B] hover:underline">{order.orderNumber}</Link>
                                            </td>
                                            <td className="py-3 pr-4 text-[#0D0D0D]">{order.client?.fullName || "—"}</td>
                                            <td className="py-3 pr-4 text-[#555]">{order.orderType?.replace(/_/g, " ") || "—"}</td>
                                            <td className="py-3 pr-4"><StatusPill status={order.status} size="small" /></td>
                                            <td className="py-3 text-right font-mono-data font-medium text-[#0D0D0D]">{order.totalAgreedFee ? formatCurrency(order.totalAgreedFee) : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
