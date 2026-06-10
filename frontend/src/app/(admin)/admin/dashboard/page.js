"use client";

import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag, Users, CreditCard, TrendingUp, Calendar as CalendarIcon, ArrowRight,
    CheckCircle2, XCircle, Clock, Download, FileText, X,
    AlertTriangle, Eye, ChevronDown, ChevronUp, ChevronsUpDown,
    Mail, Phone, MapPin, Scissors,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar,
} from "recharts";
import { format } from "date-fns";
import { useToast } from "@/components/ui/toaster";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";
import CustomSelect from "@/components/shared/CustomSelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";

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

// Relative time helper
function timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
}

function StatCard({ label, value, icon: Icon, color, isCurrency, subtext, warning, index = 0 }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
    const num = typeof value === "number" ? value : parseInt(value) || 0;
    const animatedValue = useCountUp(num, 800, isVisible);

    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
            className={`p-5 rounded-xl border bg-white ${warning && num > 0 ? "border-[#E65100]/30 bg-[#FFF3E0]/20" : "border-[rgba(0,0,0,0.06)]"}`}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-medium text-[#999] uppercase tracking-wider">{label}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold font-mono-data text-[#0D0D0D] ">
                {isCurrency ? formatCurrency(animatedValue) : animatedValue}
            </p>
            {subtext && <p className="text-[10px] mt-1 text-[#999]">{subtext}</p>}
            {warning && num > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                    <AlertTriangle size={10} className="text-[#E65100]" />
                    <span className="text-[10px] text-[#E65100] font-medium">Needs attention</span>
                </div>
            )}
        </motion.div>
    );
}

// ── Split Export Button ────────────────────────────────────────────────────
function SplitExportButton({ onExport, exporting }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className="relative flex">
            {/* Primary segment */}
            <button
                onClick={() => setOpen((o) => !o)}
                disabled={!!exporting}
                className="flex items-center gap-1.5 h-9 px-3 text-xs font-semibold text-white bg-[#C2185B] hover:bg-[#A31545] rounded-l-lg border border-[#C2185B] transition-colors disabled:opacity-60 cursor-pointer"
            >
                <Download size={13} />
                {exporting ? "Exporting..." : "Export Report"}
            </button>
            {/* Caret segment */}
            <button
                onClick={() => setOpen((o) => !o)}
                disabled={!!exporting}
                className="flex items-center justify-center h-9 w-8 text-white bg-[#C2185B] hover:bg-[#A31545] rounded-r-lg border-l border-[#A31545] transition-colors disabled:opacity-60 cursor-pointer"
            >
                <ChevronDown size={13} />
            </button>
            {/* Dropdown */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-1.5 z-30 bg-white rounded-lg shadow-lg border border-[rgba(0,0,0,0.08)] py-1 min-w-[160px]"
                    >
                        <button
                            onClick={() => { onExport("csv"); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0D0D0D] hover:bg-[#F4F0F8] transition-colors cursor-pointer"
                        >
                            <Download size={14} className="text-[#555]" />
                            Download CSV
                        </button>
                        <button
                            onClick={() => { onExport("pdf"); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#0D0D0D] hover:bg-[#F4F0F8] transition-colors cursor-pointer"
                        >
                            <FileText size={14} className="text-[#555]" />
                            Download PDF
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function AdminDashboard() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const presets = useMemo(getDatePresets, []);

    const [datePreset, setDatePreset] = useState("all");
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [exporting, setExporting] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [confirmPopover, setConfirmPopover] = useState(null);
    const [proofPreview, setProofPreview] = useState(null);
    const [expandedRow, setExpandedRow] = useState(null);
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");

    // Compute from/to based on preset
    const { from, to } = useMemo(() => {
        if (datePreset === "custom") {
            return {
                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "",
                to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""
            };
        }
        if (datePreset === "all") return { from: "", to: "" };
        const preset = presets.find((p) => p.value === datePreset);
        return { from: preset?.from || "", to: preset?.to || "" };
    }, [datePreset, dateRange, presets]);

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

    // Live online clients count (SSE-driven via presence events)
    const { data: onlineCountData } = useQuery({
        queryKey: ["admin-online-count"],
        queryFn: async () => {
            const { data } = await api.get("/admin/dashboard/online-count");
            return data.data;
        },
        refetchInterval: false, // refreshed by SSE presence events via useSSE
    });

    // Upcoming appointments (next 7 days)
    const { data: upcomingAppointments } = useQuery({
        queryKey: ["admin-upcoming-appointments"],
        queryFn: async () => {
            const { data } = await api.get("/appointments", { params: { status: "CONFIRMED" } });
            const apts = data.data?.appointments || data.data || [];
            // Filter to next 7 days
            const now = new Date();
            const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return apts.filter((a) => {
                const d = new Date(a.confirmedDate || a.requestedDate);
                return d >= now && d <= in7Days;
            }).sort((a, b) => new Date(a.confirmedDate || a.requestedDate) - new Date(b.confirmedDate || b.requestedDate));
        },
    });

    const confirmPayment = useMutation({
        mutationFn: async (id) => { const { data } = await api.put(`/admin/payments/${id}/confirm`); return data; },
        onSuccess: () => {
            toast.success("Payment confirmed!");
            setConfirmPopover(null);
            queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const rejectPayment = useMutation({
        mutationFn: async (id) => { const { data } = await api.put(`/admin/payments/${id}/reject`, { rejectionReason }); return data; },
        onSuccess: () => { toast.info("Payment rejected"); setRejectModal(null); setRejectionReason(""); queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] }); queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to reject."),
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
    const appointments = Array.isArray(upcomingAppointments) ? upcomingAppointments : [];
    const onlineClients = onlineCountData?.onlineClients ?? null;

    // Sorted recent orders (client-side)
    const handleSort = (key) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };
    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <ChevronsUpDown size={11} className="text-[#CCC] inline ml-0.5" />;
        return sortDir === "asc"
            ? <ChevronUp size={11} className="text-[#C2185B] inline ml-0.5" />
            : <ChevronDown size={11} className="text-[#C2185B] inline ml-0.5" />;
    };

    const rawOrders = Array.isArray(stats.recentOrders) ? stats.recentOrders : [];
    const recentOrders = useMemo(() => {
        if (!sortKey) return rawOrders;
        return [...rawOrders].sort((a, b) => {
            let av, bv;
            if (sortKey === "orderNumber") { av = a.orderNumber; bv = b.orderNumber; }
            else if (sortKey === "client") { av = a.client?.fullName || ""; bv = b.client?.fullName || ""; }
            else if (sortKey === "type") { av = a.orderType || ""; bv = b.orderType || ""; }
            else if (sortKey === "status") { av = a.status || ""; bv = b.status || ""; }
            else if (sortKey === "fee") { av = a.totalAgreedFee || 0; bv = b.totalAgreedFee || 0; }
            else if (sortKey === "paid") {
                av = a.totalPaid || 0;
                bv = b.totalPaid || 0;
            }
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [rawOrders, sortKey, sortDir]);

    const toChartArray = (data, labelMap, fallback) => {
        if (data && typeof data === "object" && !Array.isArray(data)) {
            const entries = Object.entries(data).filter(([, v]) => Number(v) > 0);
            if (entries.length > 0) return entries.map(([key, value]) => ({ name: (labelMap && labelMap[key]?.label) || key.replace(/_/g, " "), value: Number(value) || 0 }));
        }
        if (Array.isArray(data) && data.length > 0) return data;
        return fallback;
    };

    const chartGranularity = stats.chartGranularity || "month";
    const formatPeriodLabel = (period) => {
        if (!period) return "";
        if (chartGranularity === "day") {
            const d = new Date(period);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
        if (chartGranularity === "week") {
            return `W${period.split("-")[1]}`;
        }
        // month: "2026-03" -> "Mar 2026"
        const [y, m] = period.split("-");
        const d = new Date(Number(y), Number(m) - 1);
        return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    };
    const revenueData = (Array.isArray(stats.revenueTimeSeries) ? stats.revenueTimeSeries : []).map(r => ({ ...r, label: formatPeriodLabel(r.period) }));
    const ordersData = (Array.isArray(stats.ordersTimeSeries) ? stats.ordersTimeSeries : []).map(r => ({ ...r, label: formatPeriodLabel(r.period) }));
    const ordersByStatus = toChartArray(stats.ordersByStatus, ORDER_STATUS, []);
    const ordersByType = toChartArray(stats.ordersByType, { MODEL_1: { label: "Model 1" }, MODEL_2: { label: "Model 2" }, MODEL_3: { label: "Ready-to-Wear" } }, []);

    // Get first name for greeting
    const firstName = user?.fullName?.split(" ")[0] || "Admin";

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header with greeting, date picker and export */}
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D0D0D]">Welcome back, {firstName}</h1>
                        <p className="text-sm text-[#999]">
                            {stats.periodLabel || "Here's what's happening in your studio today."}
                        </p>
                        {/* Live online indicator */}
                        {onlineClients !== null && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E7D32] opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E7D32]" />
                                </span>
                                <span className="text-[11px] text-[#555] font-medium">
                                    {onlineClients} client{onlineClients !== 1 ? "s" : ""} online now
                                </span>
                            </div>
                        )}
                    </div>
                    <SplitExportButton onExport={handleExport} exporting={exporting} />
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
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`h-9 border-[#E0E0E0] bg-white hover:bg-white text-sm font-normal justify-start ${!dateRange.from && "text-muted-foreground"}`}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "MMM d, yyyy")} -{" "}
                                                {format(dateRange.to, "MMM d, yyyy")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "MMM d, yyyy")
                                        )
                                    ) : (
                                        "Pick a date range"
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                </div>
            </div>

            {/* Stat Cards — 2 cols mobile, 3 cols desktop (lg), 6 cols large (xl) */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)
                ) : (
                    <>
                        <StatCard index={0} label="Active Orders" value={stats.activeOrders || 0} icon={ShoppingBag} color="#C2185B" />
                        <StatCard index={1} label="Pending Review" value={stats.ordersByStatus?.PENDING_REVIEW || 0} icon={Clock} color="#E65100" warning
                            subtext={from ? `${stats.ordersInPeriod || 0} total in period` : null} />
                        <StatCard index={2} label="Total Revenue" value={stats.totalRevenue || 0} icon={TrendingUp} color="#2E7D32" isCurrency
                            subtext={from ? `${formatCurrency(stats.revenueInPeriod || 0)} in period` : null} />
                        <StatCard index={3} label="Outstanding" value={stats.outstandingBalance || 0} icon={CreditCard} color="#E65100" isCurrency
                            subtext={`${stats.pendingPayments || payments.length} payment${(stats.pendingPayments || payments.length) !== 1 ? "s" : ""} awaiting`} />
                        <StatCard index={4} label="Clients" value={stats.totalClients || 0} icon={Users} color="#1565C0"
                            subtext={from ? `${stats.newClientsInPeriod || 0} new in period` : null} />
                        <StatCard index={5} label="Appointments" value={stats.appointmentsPending || 0} icon={CalendarIcon} color="#6A1B9A" warning />
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
                                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#999" }} />
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

                {/* Pending Payments — enriched cards per spec */}
                <div className="lg:col-span-2 p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#0D0D0D]">Pending Payments</h3>
                        <Link href="/admin/payments" className="text-xs text-[#C2185B] font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
                    </div>
                    {payments.length === 0 ? (
                        <p className="text-sm text-[#999] py-8 text-center">No pending payments!</p>
                    ) : (
                        <div className="space-y-3">
                            {payments.slice(0, 5).map((pay) => (
                                <div key={pay.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAFAFA] border border-[rgba(0,0,0,0.03)] hover:border-[rgba(0,0,0,0.08)] transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-bold font-mono-data text-[#0D0D0D]">{formatCurrency(pay.amount)}</p>
                                            {pay.paymentType && (
                                                <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-[#F4F0F8] text-[#555]">
                                                    {pay.paymentType?.replace(/_/g, " ")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#555]">
                                            <span className="font-mono-data text-[#C2185B]">{pay.order?.orderNumber || "—"}</span>
                                            <span className="mx-1.5 text-[#E0E0E0]">·</span>
                                            {pay.client?.fullName || "Client"}
                                        </p>
                                        <p className="text-[10px] text-[#999] mt-0.5">{timeAgo(pay.createdAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        {pay.proofUrl && (
                                            <button onClick={() => setProofPreview(pay.proofUrl)} className="w-7 h-7 rounded-md bg-[#F4F0F8] flex items-center justify-center text-[#555] hover:text-[#C2185B] transition-colors">
                                                <Eye size={13} />
                                            </button>
                                        )}
                                        {/* Confirm with popover */}
                                        <div className="relative">
                                            <Button
                                                variant="ghost" size="icon"
                                                onClick={() => setConfirmPopover(confirmPopover === pay.id ? null : pay.id)}
                                                className="h-8 w-8 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32]"
                                            >
                                                <CheckCircle2 size={14} />
                                            </Button>
                                            <AnimatePresence>
                                                {confirmPopover === pay.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                        transition={{ duration: 0.15 }}
                                                        className="absolute right-0 bottom-full mb-2 z-30 bg-white rounded-lg shadow-lg border border-[rgba(0,0,0,0.08)] p-3 w-48"
                                                    >
                                                        <p className="text-xs text-[#555] mb-2">Confirm this payment of {formatCurrency(pay.amount)}?</p>
                                                        <div className="flex gap-1.5">
                                                            <Button size="sm" onClick={() => setConfirmPopover(null)} variant="outline" className="h-7 text-[11px] flex-1">Cancel</Button>
                                                            <Button size="sm" onClick={() => confirmPayment.mutate(pay.id)} disabled={confirmPayment.isPending} className="h-7 text-[11px] bg-[#2E7D32] text-white hover:bg-[#1B5E20] flex-1">
                                                                {confirmPayment.isPending ? "..." : "Confirm"}
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => { setRejectModal(pay.id); setRejectionReason(""); }} className="h-8 w-8 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C62828]">
                                            <XCircle size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Orders + Upcoming Appointments side‑by‑side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Recent Orders — full-width table with all spec columns */}
                <div className="lg:col-span-2 p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
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
                            {/* Desktop: table with sortable columns + expandable rows */}
                            <div className="hidden lg:block overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[rgba(0,0,0,0.06)]">
                                            {["Order #", "Client", "Type", "Status", "Agreed Fee", "Paid"].map((label, i) => {
                                                const keys = ["orderNumber", "client", "type", "status", "fee", "paid"];
                                                const key = keys[i];
                                                const isRight = i >= 4;
                                                return (
                                                    <th key={key}
                                                        onClick={() => handleSort(key)}
                                                        className={`text-xs font-medium text-[#999] py-3 pr-4 cursor-pointer select-none whitespace-nowrap hover:text-[#C2185B] transition-colors ${isRight ? "text-right" : "text-left"}`}
                                                    >
                                                        {label}<SortIcon col={key} />
                                                    </th>
                                                );
                                            })}
                                            <th className="text-right text-xs font-medium text-[#999] py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => {
                                            const isExpanded = expandedRow === order.id;
                                            return (
                                                <Fragment key={order.id}>
                                                    <tr key={order.id}
                                                        onClick={() => setExpandedRow(isExpanded ? null : order.id)}
                                                        className={`border-b border-[rgba(0,0,0,0.03)] transition-colors group cursor-pointer ${isExpanded ? "bg-[#F4F0F8]/40" : "hover:bg-[#FAFAFA]"
                                                            }`}
                                                    >
                                                        <td className="py-3 pr-4 whitespace-nowrap">
                                                            <span className="font-mono-data text-xs text-[#C2185B]">{order.orderNumber}</span>
                                                        </td>
                                                        <td className="py-3 pr-4 text-[#0D0D0D] whitespace-nowrap">{order.client?.fullName || "—"}</td>
                                                        <td className="py-3 pr-4 text-[#555] text-xs whitespace-nowrap">{order.orderType?.replace(/_/g, " ") || "—"}</td>
                                                        <td className="py-3 pr-4 whitespace-nowrap"><StatusPill status={order.status} size="small" /></td>
                                                        <td className="py-3 pr-4 text-right font-mono-data text-[#0D0D0D] whitespace-nowrap">{order.totalAgreedFee ? formatCurrency(order.totalAgreedFee) : "—"}</td>
                                                        <td className="py-3 pr-4 text-right font-mono-data text-[#555] whitespace-nowrap">{formatCurrency(order.totalPaid)}</td>
                                                        <td className="py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                                            <Link href={`/admin/orders/${order.id}`}
                                                                className="text-xs text-[#C2185B] font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                                                                Manage <ArrowRight size={10} />
                                                            </Link>
                                                        </td>
                                                    </tr>
                                                    {/* Expandable preview row */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <tr key={`${order.id}-expand`}>
                                                                <td colSpan={7} className="p-0">
                                                                    <motion.div
                                                                        initial={{ opacity: 0, height: 0 }}
                                                                        animate={{ opacity: 1, height: "auto" }}
                                                                        exit={{ opacity: 0, height: 0 }}
                                                                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                                                        className="overflow-hidden"
                                                                    >
                                                                        <div className="flex flex-col md:flex-row gap-6 px-4 py-4 bg-[#F4F0F8]/40 border-b border-[rgba(0,0,0,0.04)] items-start">
                                                                            {/* Column 1: Order Info */}
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[10px] text-[#999] font-medium uppercase tracking-wider mb-1.5">Order Details</p>
                                                                                {order.orderType === "MODEL_3" ? (
                                                                                    <div className="space-y-1">
                                                                                        {order.items?.length > 0 ? (
                                                                                            order.items.map((item, idx) => (
                                                                                                <p key={idx} className="text-sm font-medium text-[#0D0D0D] truncate">
                                                                                                    {item.quantity}x {item.readyToWear?.name || "RTW Item"}
                                                                                                </p>
                                                                                            ))
                                                                                        ) : (
                                                                                            <p className="text-sm text-[#555] italic">No items listed</p>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div>
                                                                                        {order.style?.name ? (
                                                                                            <p className="text-sm font-medium text-[#0D0D0D] truncate">Style: {order.style.name}</p>
                                                                                        ) : order.customStyleDescription ? (
                                                                                            <p className="text-sm font-medium text-[#0D0D0D] line-clamp-2" title={order.customStyleDescription}>
                                                                                                Custom: {order.customStyleDescription}
                                                                                            </p>
                                                                                        ) : (
                                                                                            <p className="text-sm text-[#555] italic">No style specified</p>
                                                                                        )}
                                                                                        {order.clientProvidesFabric !== undefined && order.clientProvidesFabric !== null && (
                                                                                            <span className="inline-flex items-center gap-1.5 mt-2 bg-[#F4F0F8] text-[#C2185B] text-[10px] font-medium px-2 py-1 rounded-md border border-[#F4F0F8]">
                                                                                                <Scissors size={10} className="shrink-0" />
                                                                                                {order.clientProvidesFabric ? "Client provides fabric" : "Studio provides fabric"}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Column 2: Client Contact */}
                                                                            <div className="flex-1 min-w-0 md:border-l md:pl-6 border-[rgba(0,0,0,0.06)]">
                                                                                <p className="text-[10px] text-[#999] font-medium uppercase tracking-wider mb-1.5">Client Contact</p>
                                                                                <div className="space-y-1.5">
                                                                                    {order.client?.email ? (
                                                                                        <div className="flex items-center gap-1.5 text-sm text-[#0D0D0D] truncate">
                                                                                            <Mail size={12} className="text-[#999] shrink-0" />
                                                                                            <span className="truncate">{order.client.email}</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="text-sm text-[#999] italic">No email</p>
                                                                                    )}
                                                                                    {order.client?.phone ? (
                                                                                        <div className="flex items-center gap-1.5 text-sm text-[#0D0D0D] truncate">
                                                                                            <Phone size={12} className="text-[#999] shrink-0" />
                                                                                            <span className="truncate">{order.client.phone}</span>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="text-sm text-[#999] italic">No phone</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            {/* Column 3: Logistics */}
                                                                            <div className="flex-1 min-w-0 md:border-l md:pl-6 border-[rgba(0,0,0,0.06)]">
                                                                                <p className="text-[10px] text-[#999] font-medium uppercase tracking-wider mb-1.5">Logistics</p>
                                                                                <div className="space-y-1.5 flex flex-col justify-between h-full">
                                                                                    <div className="flex items-start gap-1.5 text-sm text-[#0D0D0D]">
                                                                                        <MapPin size={12} className="text-[#C2185B] shrink-0 mt-0.5" />
                                                                                        <div className="line-clamp-2">
                                                                                            {order.fulfillmentMethod === "DELIVERY" && order.deliveryAddress ? (
                                                                                                <span>Delivery: {order.deliveryAddress}</span>
                                                                                            ) : order.fulfillmentMethod === "PICKUP" ? (
                                                                                                <span>Studio Pickup</span>
                                                                                            ) : (
                                                                                                <span className="text-[#999] italic">Not specified</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    <p className="text-[11px] text-[#999] mt-2 font-mono-data">
                                                                                        Ordered: {format(new Date(order.createdAt), "MMM d, yyyy")}
                                                                                    </p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Manage Action */}
                                                                            <div className="md:ml-auto md:pl-6 flex items-center mt-4 md:mt-0 pt-2 shrink-0 self-center">
                                                                                <Link href={`/admin/orders/${order.id}`}
                                                                                    className="flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#C2185B] hover:bg-[#A31545] px-4 py-2 rounded-lg transition-colors shadow-sm w-full md:w-auto"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    Manage <ArrowRight size={11} />
                                                                                </Link>
                                                                            </div>
                                                                        </div>
                                                                    </motion.div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </AnimatePresence>
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Upcoming Appointments — timeline style */}
                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-[#0D0D0D]">Upcoming Appointments</h3>
                        <Link href="/admin/appointments" className="text-xs text-[#C2185B] font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={10} /></Link>
                    </div>
                    {appointments.length === 0 ? (
                        <div className="text-center py-8">
                            <CalendarIcon size={24} className="text-[#E0E0E0] mx-auto mb-2" />
                            <p className="text-sm text-[#999]">No upcoming appointments</p>
                        </div>
                    ) : (
                        <div className="space-y-5 mt-10">
                            {appointments.slice(0, 6).map((apt, i) => {
                                const aptDate = new Date(apt.confirmedDate || apt.requestedDate);
                                const isToday = aptDate.toDateString() === new Date().toDateString();
                                const isTomorrow = aptDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                                const dayLabel = isToday ? "Today" : isTomorrow ? "Tomorrow" : aptDate.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" });

                                return (
                                    <div key={apt.id} className="flex gap-3 group">
                                        {/* Timeline line */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${isToday ? "bg-[#C2185B]" : "bg-[#E0E0E0]"}`} />
                                            {i < appointments.slice(0, 6).length - 1 && (
                                                <div className="w-px flex-1 bg-[rgba(0,0,0,0.06)]" />
                                            )}
                                        </div>
                                        <div className="pb-4 min-w-0 flex-1">
                                            <p className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? "text-[#C2185B]" : "text-[#999]"}`}>
                                                {dayLabel}
                                            </p>
                                            <p className="text-sm font-medium text-[#0D0D0D] truncate">
                                                {apt.client?.fullName || apt.user?.fullName || "Client"}
                                            </p>
                                            {apt.type && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4F0F8] text-[#555]">{apt.type}</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Proof preview lightbox */}
            <AnimatePresence>
                {proofPreview && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={() => setProofPreview(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setProofPreview(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                                <X size={16} className="text-[#0D0D0D]" />
                            </button>
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-white">
                                <Image src={proofPreview} alt="Payment proof" fill className="object-contain" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Rejection reason modal */}
            <AnimatePresence>
                {rejectModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
                        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-bold text-[#0D0D0D] mb-1">Reject Payment</h3>
                            <p className="text-sm text-[#555] mb-4">Please provide a reason for rejecting this payment.</p>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Proof of payment is unclear, amount doesn't match..."
                                className="w-full h-24 px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C2185B]/30 focus:border-[#C2185B] resize-none transition-all"
                            />
                            {rejectionReason.length > 0 && rejectionReason.length < 5 && (
                                <p className="text-xs text-[#C62828] mt-1">Reason must be at least 5 characters</p>
                            )}
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setRejectModal(null)} className="h-9">Cancel</Button>
                                <Button
                                    onClick={() => rejectPayment.mutate(rejectModal)}
                                    disabled={rejectionReason.length < 5 || rejectPayment.isPending}
                                    className="h-9 bg-[#C62828] text-white hover:bg-[#B71C1C] gap-1.5"
                                >
                                    <XCircle size={14} />
                                    {rejectPayment.isPending ? "Rejecting..." : "Reject Payment"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
