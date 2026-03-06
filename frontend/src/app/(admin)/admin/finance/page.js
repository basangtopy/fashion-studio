"use client";

import { useState } from "react";
import Link from "next/link";
import {
    BarChart3,
    TrendingUp,
    CreditCard,
    Calendar,
    Download,
    DollarSign,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import api from "@/lib/api";
import { formatCurrency } from "@/config/branding";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";

const PIE_COLORS = ["#C2185B", "#6A1B9A", "#2E7D32", "#1565C0", "#E65100"];

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
    const [period, setPeriod] = useState("monthly");

    const { data: financeData, isLoading } = useQuery({
        queryKey: ["admin-finance", period],
        queryFn: async () => {
            const { data } = await api.get("/admin/payments/summary", { params: { period } });
            return data.data;
        },
    });

    const stats = financeData || {};

    const revenueData = stats.revenueOverTime || [
        { date: "Jan", revenue: 150000, expenses: 45000 },
        { date: "Feb", revenue: 280000, expenses: 62000 },
        { date: "Mar", revenue: 220000, expenses: 51000 },
        { date: "Apr", revenue: 410000, expenses: 78000 },
        { date: "May", revenue: 350000, expenses: 65000 },
        { date: "Jun", revenue: 520000, expenses: 95000 },
    ];

    const revenueByModel = stats.revenueByModel || [
        { name: "Model 1 (Client Fabric)", value: 320000 },
        { name: "Model 2 (Sourced Fabric)", value: 480000 },
        { name: "Ready-to-Wear", value: 250000 },
    ];

    const paymentMethods = stats.paymentMethods || [
        { name: "Bank Transfer", value: 65 },
        { name: "Cash", value: 25 },
        { name: "Online", value: 10 },
    ];

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Finance</h1>
                    <p className="text-sm text-[#999]">Revenue, expenses, and financial insights.</p>
                </div>
                <Tabs value={period} onValueChange={setPeriod}>
                    <TabsList className="bg-[#F4F0F8]">
                        <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
                        <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
                        <TabsTrigger value="yearly" className="text-xs">Yearly</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {isLoading ? Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />) : (
                    <>
                        <AnimatedStat label="Total Revenue" value={stats.totalRevenue || 1050000} icon={TrendingUp} color="#2E7D32" isCurrency />
                        <AnimatedStat label="Total Expenses" value={stats.totalExpenses || 396000} icon={DollarSign} color="#C62828" isCurrency />
                        <AnimatedStat label="Net Profit" value={stats.netProfit || 654000} icon={BarChart3} color="#C2185B" isCurrency />
                        <AnimatedStat label="Transactions" value={stats.totalTransactions || 45} icon={CreditCard} color="#1565C0" />
                    </>
                )}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue vs Expenses */}
                <div className="lg:col-span-2 p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Revenue vs Expenses</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={revenueData}>
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C62828" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#C62828" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F4F0F8" />
                            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#999" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#999" }} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                            <Area type="monotone" dataKey="revenue" stroke="#2E7D32" fill="url(#revenueGrad)" strokeWidth={2} />
                            <Area type="monotone" dataKey="expenses" stroke="#C62828" fill="url(#expenseGrad)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Revenue by Model */}
                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Revenue by Model</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie data={revenueByModel} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                                {revenueByModel.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v) => formatCurrency(v)} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-3">
                        {revenueByModel.map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />{item.name}</span>
                                <span className="font-mono-data font-medium">{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payment Methods Bar */}
            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white max-w-xl">
                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Payment Methods</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={paymentMethods} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#F4F0F8" />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "#999" }} unit="%" />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#999" }} width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#C2185B" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
