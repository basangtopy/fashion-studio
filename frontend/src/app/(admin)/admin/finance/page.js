"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, CreditCard, Clock, AlertTriangle, ExternalLink, Calendar as CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { format } from "date-fns";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS } from "@/config/branding";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";
import CustomSelect from "@/components/shared/CustomSelect";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PIE_COLORS = ["#F9A825", "#6A1B9A", "#2E7D32", "#1565C0", "#C62828", "#1A1A2E", "#E65100", "#00695C", "#AD1457"];
const BAR_COLORS = { "Model 1": "#C2185B", "Model 2": "#6A1B9A", "Ready-to-Wear": "#1565C0" };
const TYPE_LABEL_MAP = { MODEL_1: "Model 1", MODEL_2: "Model 2", MODEL_3: "Ready-to-Wear" };

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
        { value: "this_month", label: "This Month", from: fmt(startOfMonth), to: fmt(now) },
        { value: "last_month", label: "Last Month", from: fmt(startOfLastMonth), to: fmt(endOfLastMonth) },
        { value: "last_3_months", label: "Last 3 Months", from: fmt(start3Mo), to: fmt(now) },
        { value: "ytd", label: "Year to Date", from: fmt(startOfYear), to: fmt(now) },
        { value: "all", label: "All Time" },
        { value: "custom", label: "Custom Range" },
    ];
};

function AnimatedStat({ label, value, icon: Icon, color, isCurrency, index = 0 }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
    const num = typeof value === "number" ? value : parseInt(value) || 0;
    const animated = useCountUp(num, 800, isVisible);
    return (
        <motion.div ref={ref} initial={{ opacity: 0, y: 12 }} animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
            className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#999] uppercase tracking-wider">{label}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold font-mono-data text-[#0D0D0D]">
                {isCurrency ? formatCurrency(animated) : animated}
            </p>
        </motion.div>
    );
}

export default function AdminFinancePage() {
    const presets = useMemo(getDatePresets, []);
    const [datePreset, setDatePreset] = useState("this_month");
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [outstandingPage, setOutstandingPage] = useState(1);
    const OUTSTANDING_PER_PAGE = 5;

    // Compute from/to based on preset
    const { from, to } = useMemo(() => {
        if (datePreset === "custom") {
            return {
                from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "",
                to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "",
            };
        }
        if (datePreset === "all") return { from: "", to: "" };
        const preset = presets.find((p) => p.value === datePreset);
        return { from: preset?.from || "", to: preset?.to || "" };
    }, [datePreset, dateRange, presets]);

    const { data: financeData, isLoading } = useQuery({
        queryKey: ["admin-finance", from, to],
        queryFn: async () => {
            const params = {};
            if (from) params.from = from;
            if (to) params.to = to;
            const { data } = await api.get("/admin/payments/summary", { params });
            return data.data;
        },
    });

    // Extract data from API response with correct mapping
    const summary = financeData?.summary || {};
    const revenueTimeSeries = financeData?.revenueTimeSeries || [];
    const ordersByStatus = financeData?.ordersByStatus || [];
    const rawByOrderType = financeData?.byOrderType || {};
    const outstandingOrdersData = financeData?.outstandingOrders || {};
    const outstandingOrders = Array.isArray(outstandingOrdersData.orders)
        ? outstandingOrdersData.orders
        : Array.isArray(outstandingOrdersData) ? outstandingOrdersData : [];

    // Build chart data for Orders by Type (Bar chart)
    const ordersByType = Object.entries(rawByOrderType)
        .filter(([, v]) => Number(v) > 0)
        .map(([key, value]) => ({
            name: TYPE_LABEL_MAP[key] || key.replace(/_/g, " "),
            count: Number(value) || 0,
        }));

    return (
        <PageTransition>
            <div className="pb-20 lg:pb-0">
                {/* Header with date range picker */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D0D0D]">Finance Summary</h1>
                        <p className="text-sm text-[#999]">Revenue, payments, and financial insights.</p>
                    </div>
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
                                        className={`h-9 border-[#E0E0E0] bg-white hover:bg-white text-sm font-normal justify-start ${!dateRange?.from && "text-muted-foreground"}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange?.from ? (
                                            dateRange.to ? (
                                                <>
                                                    {format(dateRange.from, "MMM d, yyyy")} –{" "}
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

                {/* Stat Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />) : (
                        <>
                            <AnimatedStat index={0} label="Total Revenue" value={summary.totalRevenue || 0} icon={TrendingUp} color="#2E7D32" isCurrency />
                            <AnimatedStat index={1} label="Confirmed Payments" value={summary.totalConfirmed || 0} icon={CreditCard} color="#1565C0" />
                            <AnimatedStat index={2} label="Pending Amount" value={summary.totalPending || 0} icon={Clock} color="#E65100" isCurrency />
                            <AnimatedStat index={3} label="Outstanding Balance" value={summary.outstandingBalance || 0} icon={AlertTriangle} color="#C62828" isCurrency />
                        </>
                    )}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Chart 1: Revenue over Time (Area) */}
                    <div className="lg:col-span-2 p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Revenue Over Time</h3>
                        {isLoading ? (
                            <div className="h-[280px] rounded-lg bg-[#FAFAFA] animate-pulse" />
                        ) : revenueTimeSeries.length === 0 ? (
                            <div className="flex items-center justify-center h-[280px]">
                                <p className="text-xs text-[#999]">No revenue data for this period.</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={revenueTimeSeries}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#C2185B" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#C2185B" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#F4F0F8" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#999" }} />
                                    <YAxis tick={{ fontSize: 11, fill: "#999" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v) => formatCurrency(v)} />
                                    <Area type="monotone" dataKey="totalRevenue" stroke="#C2185B" fill="url(#revenueGrad)" strokeWidth={2} name="Revenue" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Chart 2: Orders by Status (Donut) */}
                    <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Orders by Status</h3>
                        {isLoading ? (
                            <div className="h-[200px] rounded-lg bg-[#FAFAFA] animate-pulse mb-4" />
                        ) : ordersByStatus.length === 0 ? (
                            <div className="flex items-center justify-center h-[200px]">
                                <p className="text-xs text-[#999]">No order data for this period.</p>
                            </div>
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
                                <div className="space-y-1.5 mt-2">
                                    {ordersByStatus.map((item, i) => (
                                        <div key={item.name} className="flex items-center justify-between text-xs">
                                            <span className="flex items-center gap-1.5">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                                <span className="capitalize">{item.name.toLowerCase().replace(/_/g, " ")}</span>
                                            </span>
                                            <span className="font-mono-data font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Chart 3: Orders by Type (Bar) */}
                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white mb-8 max-w-2xl">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Revenue by Order Type</h3>
                    {isLoading ? (
                        <div className="h-[200px] rounded-lg bg-[#FAFAFA] animate-pulse" />
                    ) : ordersByType.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px]">
                            <p className="text-xs text-[#999]">No revenue by type data for this period.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={ordersByType}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F4F0F8" />
                                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#999" }} />
                                <YAxis tick={{ fontSize: 11, fill: "#999" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v) => formatCurrency(v)} />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Revenue">
                                    {ordersByType.map((entry, i) => (
                                        <Cell key={i} fill={BAR_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Outstanding Orders */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={16} className="text-[#E65100]" />
                        <h3 className="text-sm font-semibold text-[#0D0D0D]">Outstanding Orders</h3>
                        {outstandingOrders.length > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[#E65100] font-semibold">{outstandingOrders.length}</span>
                        )}
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-[#FAFAFA] animate-pulse" />)}
                        </div>
                    ) : outstandingOrders.length === 0 ? (
                        <EmptyState icon={CreditCard} title="No outstanding orders" subtitle="All active orders are fully paid." />
                    ) : (
                        <>
                            <p className="text-xs text-[#999] mb-4">Orders where total paid is less than the agreed fee.</p>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
                                            <th className="text-left text-xs font-medium text-[#999] py-2.5 px-3">Order #</th>
                                            <th className="text-left text-xs font-medium text-[#999] py-2.5 px-3">Client</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-2.5 px-3">Agreed Fee</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-2.5 px-3">Total Paid</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-2.5 px-3">Outstanding</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-2.5 px-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {outstandingOrders.slice(0, outstandingPage * OUTSTANDING_PER_PAGE).map(order => (
                                            <tr key={order.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-[#FAFAFA] transition-colors">
                                                <td className="py-2.5 px-3 font-mono-data text-xs">{order.orderNumber}</td>
                                                <td className="py-2.5 px-3 font-medium">{order.client?.fullName || "—"}</td>
                                                <td className="py-2.5 px-3 text-right font-mono-data">{formatCurrency(order.totalAgreedFee || 0)}</td>
                                                <td className="py-2.5 px-3 text-right font-mono-data">{formatCurrency(order.totalPaid || 0)}</td>
                                                <td className="py-2.5 px-3 text-right font-mono-data font-bold text-[#C62828]">
                                                    {formatCurrency((order.totalAgreedFee || 0) - (order.totalPaid || 0))}
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <Link href={`/admin/orders/${order.id}`} className="text-xs text-[#C2185B] font-semibold hover:underline flex items-center gap-1 justify-end">
                                                        View <ExternalLink size={10} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {outstandingOrders.length > outstandingPage * OUTSTANDING_PER_PAGE && (
                                <div className="flex justify-center mt-4">
                                    <Button variant="outline" onClick={() => setOutstandingPage(p => p + 1)}
                                        className="h-9 px-5 text-xs font-semibold text-[#C2185B] border-[#C2185B]/30 hover:bg-[#C2185B]/5">
                                        Show More ({outstandingOrders.length - outstandingPage * OUTSTANDING_PER_PAGE} remaining)
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            </div>
        </PageTransition>
    );
}
