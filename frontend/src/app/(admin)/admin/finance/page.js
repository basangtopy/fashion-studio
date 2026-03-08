"use client";

import { useState } from "react";
import Link from "next/link";
import { TrendingUp, CreditCard, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "@/lib/api";
import { formatCurrency } from "@/config/branding";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";
import { Input } from "@/components/ui/input";

const PIE_COLORS = ["#FFA726", "#42A5F5", "#66BB6A", "#EF5350", "#AB47BC", "#78909C"];
const BAR_COLORS = { "Model 1": "#C2185B", "Model 2": "#6A1B9A", "Ready-to-Wear": "#1565C0" };

function AnimatedStat({ label, value, icon: Icon, color, isCurrency }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
    const num = typeof value === "number" ? value : parseInt(value) || 0;
    const animated = useCountUp(num, 800, isVisible);
    return (
        <div ref={ref} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[#999] uppercase tracking-wider">{label}</span>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold font-mono-data text-[#0D0D0D]">
                {isCurrency ? formatCurrency(animated) : animated}
            </p>
        </div>
    );
}

export default function AdminFinancePage() {
    const now = new Date();
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(now.toISOString().split("T")[0]);

    const { data: financeData, isLoading } = useQuery({
        queryKey: ["admin-finance", startDate, endDate],
        queryFn: async () => {
            const { data } = await api.get("/admin/payments/summary", { params: { startDate, endDate } });
            return data.data;
        },
    });

    const stats = financeData || {};

    // Revenue over time (Area/Line chart)
    const revenueData = stats.revenueOverTime || stats.totalRevenueData || [
        { date: "Week 1", totalRevenue: 150000 }, { date: "Week 2", totalRevenue: 280000 },
        { date: "Week 3", totalRevenue: 220000 }, { date: "Week 4", totalRevenue: 410000 },
    ];

    // Orders by Status (Donut/Pie)
    const ordersByStatus = stats.ordersByStatus || [
        { name: "PENDING", value: 8 }, { name: "IN_PROGRESS", value: 12 },
        { name: "COMPLETED", value: 25 }, { name: "CANCELLED", value: 3 },
    ];

    // Orders by Type (Bar)
    const ordersByType = stats.ordersByType || [
        { name: "Model 1", count: 18 }, { name: "Model 2", count: 14 }, { name: "Ready-to-Wear", count: 10 },
    ];

    // Outstanding orders (totalPaid < totalAgreedFee)
    const outstandingOrders = stats.outstandingOrders || [];

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Finance Summary</h1>
                    <p className="text-sm text-[#999]">Revenue, payments, and financial insights.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 bg-white text-sm w-[140px]" />
                    <span className="text-xs text-[#999]">to</span>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 bg-white text-sm w-[140px]" />
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />) : (
                    <>
                        <AnimatedStat label="Total Revenue" value={stats.totalRevenue || 0} icon={TrendingUp} color="#2E7D32" isCurrency />
                        <AnimatedStat label="Confirmed Payments" value={stats.confirmedPayments || stats.totalConfirmed || 0} icon={CreditCard} color="#1565C0" isCurrency />
                        <AnimatedStat label="Pending Amount" value={stats.pendingAmount || stats.totalPending || 0} icon={Clock} color="#E65100" isCurrency />
                        <AnimatedStat label="Outstanding Balance" value={stats.outstandingBalance || 0} icon={AlertTriangle} color="#C62828" isCurrency />
                    </>
                )}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Chart 1: Revenue over Time */}
                <div className="lg:col-span-2 p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Revenue Over Time</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
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
                </div>

                {/* Chart 2: Orders by Status (Donut) */}
                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Orders by Status</h3>
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
                </div>
            </div>

            {/* Chart 3: Orders by Type (Bar) */}
            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white mb-8 max-w-2xl">
                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Orders by Type</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ordersByType}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F0F8" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#999" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#999" }} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {ordersByType.map((entry, i) => (
                                <Cell key={i} fill={BAR_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Outstanding Orders */}
            {outstandingOrders.length > 0 && (
                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle size={16} className="text-[#E65100]" />
                        <h3 className="text-sm font-semibold text-[#0D0D0D]">Outstanding Orders</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFF3E0] text-[#E65100] font-semibold">{outstandingOrders.length}</span>
                    </div>
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
                                {outstandingOrders.map(order => (
                                    <tr key={order.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-[#FAFAFA] transition-colors">
                                        <td className="py-2.5 px-3 font-mono-data text-xs">{order.orderNumber}</td>
                                        <td className="py-2.5 px-3 font-medium">{order.client?.fullName || "—"}</td>
                                        <td className="py-2.5 px-3 text-right font-mono-data">{formatCurrency(order.totalAgreedFee || order.agreedFee || 0)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono-data">{formatCurrency(order.totalPaid || 0)}</td>
                                        <td className="py-2.5 px-3 text-right font-mono-data font-bold text-[#C62828]">
                                            {formatCurrency((order.totalAgreedFee || order.agreedFee || 0) - (order.totalPaid || 0))}
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
                </div>
            )}
        </div>
    );
}
