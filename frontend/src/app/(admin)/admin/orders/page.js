"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search, Eye, LayoutGrid, List, ChevronRight, ChevronLeft,
    Plus, Calendar as CalendarIcon, X, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Check, Loader2
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { useToast } from "@/components/ui/toaster";
import { SkeletonTable, SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import CustomSelect from "@/components/shared/CustomSelect";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

// Declared at module scope (not inside the page component) so it isn't
// re-created on every render. Sort state is passed in as props.
function SortIcon({ field, sortBy, sortDir }) {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-[#BDBDBD]" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />;
}

export default function AdminOrdersPage() {
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== "undefined") return localStorage.getItem("admin-orders-view") || "table";
        return "table";
    });
    const [statusFilter, setStatusFilter] = useState([]);
    const [typeFilter, setTypeFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortDir, setSortDir] = useState("desc");
    const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
    const [dragOverCol, setDragOverCol] = useState(null);
    const [draggingId, setDraggingId] = useState(null);
    const limit = 20;
    const queryClient = useQueryClient();
    const toast = useToast();

    useEffect(() => { localStorage.setItem("admin-orders-view", viewMode); }, [viewMode]);

    const statusFilterStr = statusFilter.join(",");
    const dateFromStr = dateRange?.from ? dateRange.from.toISOString().split("T")[0] : "";
    const dateToStr = dateRange?.to ? dateRange.to.toISOString().split("T")[0] : "";

    const { data, isLoading } = useQuery({
        queryKey: ["admin-orders", statusFilterStr, typeFilter, searchQuery, dateFromStr, dateToStr, page, sortBy, sortDir],
        queryFn: async () => {
            const params = { page, limit, sortBy, sortDir };
            if (statusFilterStr) params.status = statusFilterStr;
            if (typeFilter) params.type = typeFilter;
            if (searchQuery) params.search = searchQuery;
            if (dateFromStr) params.from = dateFromStr;
            if (dateToStr) params.to = dateToStr;
            const { data } = await api.get("/admin/orders", { params });
            return data.data || {};
        },
    });

    const orders = Array.isArray(data?.orders) ? data.orders : Array.isArray(data) ? data : [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || orders.length;

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortDir(prev => prev === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortDir("desc");
        }
        setPage(1);
    };

    const toggleStatus = (val) => {
        setStatusFilter(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]);
        setPage(1);
    };

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, newStatus }) => {
            const { data } = await api.put(`/admin/orders/${id}/status`, { status: newStatus });
            return data;
        },
        onMutate: async ({ id, newStatus }) => {
            await queryClient.cancelQueries({ queryKey: ["admin-orders"] });
            const previousData = queryClient.getQueryData(["admin-orders", statusFilterStr, typeFilter, searchQuery, dateFromStr, dateToStr, page, sortBy, sortDir]);
            if (previousData?.orders) {
                queryClient.setQueryData(
                    ["admin-orders", statusFilterStr, typeFilter, searchQuery, dateFromStr, dateToStr, page, sortBy, sortDir],
                    (old) => ({
                        ...old,
                        orders: old.orders.map((o) => o.id === id ? { ...o, status: newStatus } : o),
                    })
                );
            }
            return { previousData };
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(
                ["admin-orders", statusFilterStr, typeFilter, searchQuery, dateFromStr, dateToStr, page, sortBy, sortDir],
                context.previousData
            );
            toast.error("Failed to update status", err.response?.data?.message || "An error occurred");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        },
        onSuccess: (data, { newStatus }) => {
            toast.success("Status updated", `Order moved to ${ORDER_STATUS[newStatus]?.label || newStatus}`);
        }
    });

    const handleDragStart = (e, orderId, currentStatus) => {
        e.dataTransfer.setData("orderId", orderId);
        e.dataTransfer.setData("sourceStatus", currentStatus);
        setDraggingId(orderId);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverCol(null);
    };

    const handleDragOver = (e, colKey) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverCol !== colKey) setDragOverCol(colKey);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOverCol(null);
    };

    const handleDrop = (e, targetStatus) => {
        e.preventDefault();
        setDragOverCol(null);
        const orderId = e.dataTransfer.getData("orderId");
        const sourceStatus = e.dataTransfer.getData("sourceStatus");

        if (orderId && sourceStatus && sourceStatus !== targetStatus) {
            updateStatusMutation.mutate({ id: orderId, newStatus: targetStatus });
        }
    };

    const fmtDate = (d) => d ? d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "";

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Orders</h1>
                    <p className="text-sm text-text-light">{total} total orders</p>
                </div>
                <Link href="/admin/orders/new">
                    <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-9">
                        <Plus size={14} /> New Order
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light" />
                    <Input type="text" placeholder="Search orders..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                        className="pl-8 h-9 bg-white" />
                </div>

                {/* Multi-select status filter */}
                <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                    <PopoverTrigger asChild>
                        <button className={`h-9 px-3 rounded-lg border text-[13px] font-medium transition-colors flex items-center justify-between gap-2 bg-white w-[160px] ${statusFilter.length > 0 ? "border-primary/30 text-primary shadow-sm" : statusPopoverOpen ? "border-primary ring-2 ring-ring/10" : "border-input text-muted-foreground hover:border-primary/40 hover:bg-surface-2"}`}>
                            <span className="truncate">{statusFilter.length > 0 ? `${statusFilter.length} Selected` : "Status"}</span>
                            <div className="flex items-center gap-1">
                                {statusFilter.length > 0 && (
                                    <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center shrink-0">{statusFilter.length}</span>
                                )}
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform opacity-50 ${statusPopoverOpen ? "rotate-180" : ""}`}><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2" align="start">
                        <div className="max-h-[280px] overflow-y-auto custom-scrollbar space-y-0.5">
                            {Object.entries(ORDER_STATUS).map(([key, val]) => (
                                <button key={key} onClick={() => toggleStatus(key)}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs transition-colors ${statusFilter.includes(key) ? "bg-primary/8 text-primary font-medium" : "text-foreground hover:bg-surface-2"}`}>
                                    <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${statusFilter.includes(key) ? "bg-primary border-primary" : "border-[#D0D0D0] bg-popover"} transition-colors`}>
                                        {statusFilter.includes(key) && <Check size={10} className="text-white" />}
                                    </div>
                                    {val.label}
                                </button>
                            ))}
                        </div>
                        {statusFilter.length > 0 && (
                            <button onClick={() => { setStatusFilter([]); setPage(1); }} className="w-full mt-1.5 pt-1.5 border-t border-[#F0F0F0] text-[11px] font-medium text-text-light hover:text-primary text-center py-1 transition-colors">Clear Selection</button>
                        )}
                    </PopoverContent>
                </Popover>

                <CustomSelect options={TYPE_OPTIONS} value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} placeholder="Type" className="w-[160px]" />

                {/* Double-month Date range picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={`h-9 px-3 border-input bg-popover hover:bg-surface-2 hover:border-primary/40 text-[13px] font-medium justify-start ${!dateRange?.from && "text-muted-foreground"} `}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                            {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                        {fmtDate(dateRange.from)} - {fmtDate(dateRange.to)}
                                    </>
                                ) : (
                                    fmtDate(dateRange.from)
                                )
                            ) : (
                                "Pick a date range"
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={(r) => { setDateRange(r || { from: undefined, to: undefined }); setPage(1); }}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>

                {/* View toggle */}
                <div className="flex bg-muted rounded-lg p-0.5 ml-auto">
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <button onClick={() => setViewMode("table")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "table" ? "bg-popover text-foreground shadow-sm" : "text-text-light"}`}>
                                    <List size={14} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>List View</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <button onClick={() => setViewMode("kanban")} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "kanban" ? "bg-popover text-foreground shadow-sm" : "text-text-light"}`}>
                                    <LayoutGrid size={14} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent><p>Kanban View</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Active filter pills */}
            {(statusFilter.length > 0 || typeFilter || searchQuery || dateRange?.from || dateRange?.to) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                    {statusFilter.map(s => (
                        <button key={s} onClick={() => toggleStatus(s)} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[11px] font-medium hover:bg-primary/15 transition-colors">
                            {ORDER_STATUS[s]?.label || s} <X size={12} />
                        </button>
                    ))}
                    {typeFilter && (
                        <button onClick={() => { setTypeFilter(""); setPage(1); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-purple/8 text-accent-purple text-[11px] font-medium hover:bg-accent-purple/15 transition-colors">
                            Type: {ORDER_TYPES[typeFilter]?.label || ORDER_TYPES[typeFilter]?.short || typeFilter} <X size={12} />
                        </button>
                    )}
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(""); setPage(1); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-info/8 text-status-info text-[11px] font-medium hover:bg-status-info/15 transition-colors">
                            {searchQuery} <X size={12} />
                        </button>
                    )}
                    {(dateRange?.from || dateRange?.to) && (
                        <button onClick={() => { setDateRange({ from: undefined, to: undefined }); setPage(1); }} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-status-success/8 text-status-success text-[11px] font-medium hover:bg-status-success/15 transition-colors">
                            {dateRange?.from ? fmtDate(dateRange.from) : "..."} → {dateRange?.to ? fmtDate(dateRange.to) : "..."} <X size={12} />
                        </button>
                    )}
                    <button onClick={() => { setStatusFilter([]); setTypeFilter(""); setSearchQuery(""); setDateRange({ from: undefined, to: undefined }); setPage(1); }}
                        className="text-[11px] text-text-light hover:text-primary font-medium transition-colors">
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
                                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-mono text-xs text-primary">{order.orderNumber}</p>
                                            <StatusPill status={order.status} size="small" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground truncate">{order.client?.fullName || "—"}</p>
                                        <p className="text-xs text-text-light mt-0.5">{ORDER_TYPES[order.orderType]?.short || "—"} • {new Date(order.createdAt).toLocaleDateString("en-NG")}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        {order.totalAgreedFee ? <p className="text-sm font-mono font-semibold text-foreground">{formatCurrency(order.totalAgreedFee)}</p> : null}
                                        <ChevronRight size={14} className="text-[#D0D0D0] ml-auto mt-1" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="rounded-xl border border-border bg-white overflow-hidden hidden lg:block">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-border bg-surface-2">
                                            <th className="text-left text-xs font-medium text-text-light py-3 px-4 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("orderNumber")}>
                                                <span className="flex items-center gap-1">Order # <SortIcon field="orderNumber" sortBy={sortBy} sortDir={sortDir} /></span>
                                            </th>
                                            <th className="text-left text-xs font-medium text-text-light py-3 px-4">Client</th>
                                            <th className="text-left text-xs font-medium text-text-light py-3 px-4 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("orderType")}>
                                                <span className="flex items-center gap-1">Type <SortIcon field="orderType" sortBy={sortBy} sortDir={sortDir} /></span>
                                            </th>
                                            <th className="text-left text-xs font-medium text-text-light py-3 px-4 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("status")}>
                                                <span className="flex items-center gap-1">Status <SortIcon field="status" sortBy={sortBy} sortDir={sortDir} /></span>
                                            </th>
                                            <th className="text-right text-xs font-medium text-text-light py-3 px-4 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("totalAgreedFee")}>
                                                <span className="flex items-center gap-1 justify-end">Agreed Fee <SortIcon field="totalAgreedFee" sortBy={sortBy} sortDir={sortDir} /></span>
                                            </th>
                                            <th className="text-right text-xs font-medium text-text-light py-3 px-4">Total Paid</th>
                                            <th className="text-right text-xs font-medium text-text-light py-3 px-4 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("createdAt")}>
                                                <span className="flex items-center gap-1 justify-end">Date <SortIcon field="createdAt" sortBy={sortBy} sortDir={sortDir} /></span>
                                            </th>
                                            <th className="text-right text-xs font-medium text-text-light py-3 px-4 w-24">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order) => {
                                            return (
                                                <tr key={order.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-surface-2 transition-colors group">
                                                    <td className="py-3 px-4"><Link href={`/admin/orders/${order.id}`} className="font-mono-data text-xs text-primary hover:underline">{order.orderNumber}</Link></td>
                                                    <td className="py-3 px-4">{order.client?.fullName || "—"}</td>
                                                    <td className="py-3 px-4 text-xs text-muted-foreground">{ORDER_TYPES[order.orderType]?.short || "—"}</td>
                                                    <td className="py-3 px-4"><StatusPill status={order.status} size="small" /></td>
                                                    <td className="py-3 px-4 text-right font-mono-data">{order.totalAgreedFee ? formatCurrency(order.totalAgreedFee) : "—"}</td>
                                                    <td className="py-3 px-4 text-right font-mono-data text-muted-foreground">{formatCurrency(order.totalPaid)}</td>
                                                    <td className="py-3 px-4 text-right text-xs text-text-light">{new Date(order.createdAt).toLocaleDateString("en-NG")}</td>
                                                    <td className="py-3 px-4 text-right">
                                                        <Link href={`/admin/orders/${order.id}`}
                                                            className="text-xs text-primary font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
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
                                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="gap-1 text-muted-foreground">
                                    <ChevronLeft size={14} /> Prev
                                </Button>
                                <span className="text-xs text-text-light">Page {page} of {totalPages}</span>
                                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="gap-1 text-muted-foreground">
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
                    <div className="hidden sm:block">
                        <div className="overflow-x-auto pb-4 -mx-1 px-1">
                            <div className="inline-flex gap-3" style={{ minWidth: "max-content" }}>
                                {KANBAN_GROUPS.map((col) => {
                                    const colOrders = orders.filter((o) => o.status === col.key);
                                    if (colOrders.length === 0 && ["COMPLETED", "CANCELLED"].includes(col.key)) return null;
                                    const isDragOver = dragOverCol === col.key;
                                    return (
                                        <div key={col.key} className="w-[280px] shrink-0 flex flex-col h-[65vh]">
                                            <div className="flex items-center justify-between mb-2 px-1 shrink-0">
                                                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</h3>
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-text-light font-mono-data">{colOrders.length}</span>
                                            </div>
                                            <div
                                                className={`space-y-2 flex-1 overflow-y-auto custom-scrollbar px-1 pb-4 rounded-xl transition-colors border-2 ${isDragOver ? "bg-primary/5 border-primary" : "border-transparent"}`}
                                                onDragOver={(e) => handleDragOver(e, col.key)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, col.key)}
                                            >
                                                {colOrders.map((order) => {
                                                    const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id;
                                                    const isDragging = draggingId === order.id;
                                                    return (
                                                        <Link key={order.id} href={`/admin/orders/${order.id}`}
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, order.id, col.key)}
                                                            onDragEnd={handleDragEnd}
                                                            className={`block p-3 rounded-xl border bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]
                                                                ${isDragging ? "opacity-50 scale-95" : "opacity-100 hover:border-primary/30 hover:shadow-sm"} 
                                                                ${isUpdating ? "opacity-60 grayscale pointer-events-none" : "border-border cursor-grab active:cursor-grabbing"}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1.5">
                                                                <div className="flex items-center gap-1.5">
                                                                    <p className="text-[10px] font-mono-data text-primary font-medium">{order.orderNumber}</p>
                                                                    {isUpdating && <Loader2 size={10} className="animate-spin text-text-light" />}
                                                                </div>
                                                                {order.totalAgreedFee && <span className="text-[10px] text-foreground font-mono-data font-semibold">{formatCurrency(order.totalAgreedFee)}</span>}
                                                            </div>
                                                            <p className="text-sm font-semibold text-foreground mb-1 truncate">{order.client?.fullName || "Client"}</p>
                                                            <p className="text-[11px] text-muted-foreground truncate">{order.style?.name || ORDER_TYPES[order.orderType]?.short || "—"}</p>
                                                        </Link>
                                                    );
                                                })}
                                                {colOrders.length === 0 && (
                                                    <div className="p-4 rounded-xl border border-dashed border-input text-center pointer-events-none">
                                                        <p className="text-[11px] text-text-light">{isDragOver ? "Drop Here" : "Empty"}</p>
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
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{col.label}</h3>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-text-light font-mono-data">{colOrders.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {colOrders.map((order) => (
                                            <Link key={order.id} href={`/admin/orders/${order.id}`}
                                                className="flex items-center justify-between p-3 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-mono-data text-text-light">{order.orderNumber}</p>
                                                    <p className="text-sm font-medium text-foreground truncate">{order.client?.fullName}</p>
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
        </div>
    );
}
