"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Search, Eye, LayoutGrid, List, ChevronRight, ChevronLeft,
    Plus, Calendar, X, ArrowRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonTable, SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import CustomSelect from "@/components/shared/CustomSelect";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUS_OPTIONS = [
    { value: "", label: "All Statuses" },
    ...Object.entries(ORDER_STATUS).map(([key, val]) => ({ value: key, label: val.label })),
];

const TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    ...Object.entries(ORDER_TYPES).map(([key, val]) => ({ value: key, label: val.label || val.short })),
];

// Kanban columns
const KANBAN_GROUPS = [
    { key: "PENDING_REVIEW", label: "Pending" },
    { key: "AWAITING_CLIENT_RESPONSE", label: "Awaiting Client" },
    { key: "AGREED_AWAITING_PAYMENT", label: "Awaiting Payment" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "CUTTING", label: "Cutting" },
    { key: "SEWING", label: "Sewing" },
    { key: "FINISHING", label: "Finishing" },
    { key: "AWAITING_FINAL_PAYMENT", label: "Final Payment" },
    { key: "READY_FOR_PICKUP", label: "Ready" },
    { key: "OUT_FOR_DELIVERY", label: "Delivery" },
    { key: "COMPLETED", label: "Done" },
    { key: "CANCELLED", label: "Cancelled" },
];

export default function AdminOrdersPage() {
    const [viewMode, setViewMode] = useState("table");
    const [statusFilter, setStatusFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const limit = 20;

    const { data, isLoading } = useQuery({
        queryKey: ["admin-orders", statusFilter, typeFilter, searchQuery, dateFrom, dateTo, page],
        queryFn: async () => {
            const params = { page, limit };
            if (statusFilter) params.status = statusFilter;
            if (typeFilter) params.type = typeFilter;
            if (searchQuery) params.search = searchQuery;
            if (dateFrom) params.from = dateFrom;
            if (dateTo) params.to = dateTo;
            const { data } = await api.get("/admin/orders", { params });
            return data.data || {};
        },
    });

    const orders = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || orders.length;

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Orders</h1>
                    <p className="text-sm text-[#999]">{total} total orders</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex bg-[#F4F0F8] rounded-lg p-0.5">
                        <TooltipProvider>
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "table" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999]"}`}>
                                        <List size={14} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent><p>List View</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <button onClick={() => setViewMode("kanban")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "kanban" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999]"}`}>
                                        <LayoutGrid size={14} />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent><p>Kanban View</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Button onClick={() => setCreateOpen(true)} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5 h-9">
                        <Plus size={14} /> New Order
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                    <Input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pl-8 h-9 bg-white" />
                </div>
                <CustomSelect options={STATUS_OPTIONS} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} placeholder="Status" className="w-[160px]" />
                <CustomSelect options={TYPE_OPTIONS} value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} placeholder="Type" className="w-[160px]" />
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-[#999]" />
                        <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="h-9 w-auto bg-white" />
                    </div>
                    <span className="text-xs text-[#999]">to</span>
                    <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                        className="h-9 w-auto bg-white" />
                </div>
            </div>

            {/* Active filter pills */}
            {(statusFilter || typeFilter || searchQuery || dateFrom || dateTo) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {statusFilter && (
                        <button onClick={() => { setStatusFilter(""); setPage(1); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#C2185B]/8 text-[#C2185B] text-[11px] font-medium hover:bg-[#C2185B]/15 transition-colors">
                            Status: {ORDER_STATUS[statusFilter]?.label || statusFilter} <X size={12} />
                        </button>
                    )}
                    {typeFilter && (
                        <button onClick={() => { setTypeFilter(""); setPage(1); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#6A1B9A]/8 text-[#6A1B9A] text-[11px] font-medium hover:bg-[#6A1B9A]/15 transition-colors">
                            Type: {ORDER_TYPES[typeFilter]?.label || ORDER_TYPES[typeFilter]?.short || typeFilter} <X size={12} />
                        </button>
                    )}
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setPage(1); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1565C0]/8 text-[#1565C0] text-[11px] font-medium hover:bg-[#1565C0]/15 transition-colors">
                            "{searchQuery}" <X size={12} />
                        </button>
                    )}
                    {(dateFrom || dateTo) && (
                        <button onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2E7D32]/8 text-[#2E7D32] text-[11px] font-medium hover:bg-[#2E7D32]/15 transition-colors">
                            {dateFrom || "..."} → {dateTo || "..."} <X size={12} />
                        </button>
                    )}
                    <button onClick={() => { setStatusFilter(""); setTypeFilter(""); setSearchQuery(""); setDateFrom(""); setDateTo(""); setPage(1); }}
                        className="text-[11px] text-[#999] hover:text-[#C2185B] font-medium transition-colors">
                        Clear all
                    </button>
                </div>
            )}

            {/* Table View */}
            {viewMode === "table" && (
                isLoading ? <SkeletonTable rows={6} cols={6} /> : orders.length === 0 ? (
                    <EmptyState icon={Search} title="No orders found" description="Try adjusting your filters." />
                ) : (
                    <>
                        {/* Mobile card list */}
                        <div className="space-y-3 lg:hidden">
                            {orders.map((order) => (
                                <Link key={order.id} href={`/admin/orders/${order.id}`}
                                    className="flex items-center justify-between p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-mono text-xs text-[#C2185B]">{order.orderNumber}</p>
                                            <StatusPill status={order.status} size="small" />
                                        </div>
                                        <p className="text-sm font-medium text-[#0D0D0D] truncate">{order.client?.fullName || "—"}</p>
                                        <p className="text-xs text-[#999] mt-0.5">{ORDER_TYPES[order.orderType]?.short || "—"} • {new Date(order.createdAt).toLocaleDateString("en-NG")}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        {order.totalAgreedFee ? <p className="text-sm font-mono font-semibold text-[#0D0D0D]">{formatCurrency(order.totalAgreedFee)}</p> : null}
                                        <ChevronRight size={14} className="text-[#D0D0D0] ml-auto mt-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden hidden lg:block">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-14 z-10">
                                        <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
                                            <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Order #</th>
                                            <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Client</th>
                                            <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Type</th>
                                            <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Status</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-3 px-4">Agreed Fee</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-3 px-4">Total Paid</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-3 px-4">Date</th>
                                            <th className="text-right text-xs font-medium text-[#999] py-3 px-4 w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => {
                                            const totalPaid = order.payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
                                            return (
                                                <tr key={order.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-[#FAFAFA] transition-colors group">
                                                    <td className="py-3 px-4"><Link href={`/admin/orders/${order.id}`} className="font-mono-data text-xs text-[#C2185B] hover:underline">{order.orderNumber}</Link></td>
                                                    <td className="py-3 px-4">{order.client?.fullName || "—"}</td>
                                                    <td className="py-3 px-4 text-xs text-[#555]">{ORDER_TYPES[order.orderType]?.short || "—"}</td>
                                                    <td className="py-3 px-4"><StatusPill status={order.status} size="small" /></td>
                                                    <td className="py-3 px-4 text-right font-mono-data">{order.totalAgreedFee ? formatCurrency(order.totalAgreedFee) : "—"}</td>
                                                    <td className="py-3 px-4 text-right font-mono-data text-[#555]">{formatCurrency(totalPaid)}</td>
                                                    <td className="py-3 px-4 text-right text-xs text-[#999]">{new Date(order.createdAt).toLocaleDateString("en-NG")}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link href={`/admin/orders/${order.id}`}
                                                            className="text-xs text-[#C2185B] font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
                                                            Manage <ArrowRight size={10} />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="gap-1 text-[#555]">
                                    <ChevronLeft size={14} /> Prev
                                </Button>
                                <span className="text-xs text-[#999]">Page {page} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="gap-1 text-[#555]">
                                    Next <ChevronRight size={14} />
                                </Button>
                            </div>
                        )}
                    </>
                )
            )}

            {/* Kanban View */}
            {viewMode === "kanban" && (
                <>
                    {/* Desktop: horizontal scroll kanban */}
                    <div className="hidden sm:block overflow-hidden">
                        <div className="overflow-x-auto pb-4 -mx-1 px-1">
                            <div className="inline-flex gap-3" style={{ minWidth: "max-content" }}>
                                {KANBAN_GROUPS.map((col) => {
                                    const colOrders = orders.filter((o) => o.status === col.key);
                                    if (colOrders.length === 0 && ["COMPLETED", "CANCELLED"].includes(col.key)) return null;
                                    return (
                                        <div key={col.key} className="w-[220px] shrink-0">
                                            <div className="flex items-center justify-between mb-2 px-1">
                                                <h3 className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">{col.label}</h3>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F4F0F8] text-[#999] font-mono-data">{colOrders.length}</span>
                                            </div>
                                            <div className="space-y-2 min-h-[80px]">
                                                {colOrders.map((order) => (
                                                    <Link key={order.id} href={`/admin/orders/${order.id}`} className="block p-2.5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors">
                                                        <p className="text-[9px] font-mono-data text-[#999] mb-0.5">{order.orderNumber}</p>
                                                        <p className="text-xs font-medium text-[#0D0D0D] mb-0.5 truncate">{order.client?.fullName || "Client"}</p>
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] text-[#555] truncate">{order.style?.name || ORDER_TYPES[order.orderType]?.short || "—"}</p>
                                                            {order.totalAgreedFee && <span className="text-[9px] font-mono-data font-medium">{formatCurrency(order.totalAgreedFee)}</span>}
                                                        </div>
                                                    </Link>
                                                ))}
                                                {colOrders.length === 0 && (
                                                    <div className="p-3 rounded-xl border border-dashed border-[#E0E0E0] text-center">
                                                        <p className="text-[9px] text-[#999]">Empty</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Mobile: stacked groups */}
                    <div className="sm:hidden space-y-6">
                        {KANBAN_GROUPS.map((col) => {
                            const colOrders = orders.filter((o) => o.status === col.key);
                            if (colOrders.length === 0) return null;
                            return (
                                <div key={col.key}>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wider">{col.label}</h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F0F8] text-[#999] font-mono-data">{colOrders.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {colOrders.map((order) => (
                                            <Link key={order.id} href={`/admin/orders/${order.id}`}
                                                className="flex items-center justify-between p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-mono-data text-[#999]">{order.orderNumber}</p>
                                                    <p className="text-sm font-medium text-[#0D0D0D] truncate">{order.client?.fullName}</p>
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    {order.totalAgreedFee ? <p className="text-xs font-mono-data font-medium">{formatCurrency(order.totalAgreedFee)}</p> : null}
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Create Order Modal */}
            <CreateOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
}
