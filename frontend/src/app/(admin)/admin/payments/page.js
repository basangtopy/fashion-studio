"use client";

import { useState, useMemo, Fragment } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, CheckCircle2, XCircle, Eye, X, Download, FileText,
    Calendar as CalendarIcon, ChevronDown, ChevronUp, ChevronsUpDown, Loader2,
} from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "@/lib/api";
import { formatCurrency, PAYMENT_STATUS } from "@/config/branding";
import { SkeletonCard, SkeletonTable } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import { useToast } from "@/components/ui/toaster";
import CustomSelect from "@/components/shared/CustomSelect";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const PAGE_SIZE = 20;

const ORDER_TYPE_OPTIONS = [
    { value: "", label: "All Types" },
    { value: "MODEL_1", label: "Model 1" },
    { value: "MODEL_2", label: "Model 2" },
    { value: "MODEL_3", label: "Ready-to-Wear" },
];

const staggerChild = {
    hidden: { opacity: 0, y: 12 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: i * 0.06 },
    }),
};

export default function AdminPaymentsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();

    // Filter state
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [orderTypeFilter, setOrderTypeFilter] = useState("");
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

    // Modal state
    const [proofPreview, setProofPreview] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // Export modal state
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState("csv");
    const [exportDateRange, setExportDateRange] = useState({ from: undefined, to: undefined });
    const [exportIncludeSummary, setExportIncludeSummary] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Sort state (for table view)
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState("asc");

    // Build query params from filters
    const queryParams = useMemo(() => {
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (orderTypeFilter) params.orderType = orderTypeFilter;
        if (dateRange?.from) params.from = format(dateRange.from, "yyyy-MM-dd");
        if (dateRange?.to) params.to = format(dateRange.to, "yyyy-MM-dd");
        return params;
    }, [statusFilter, orderTypeFilter, dateRange]);

    // Infinite query for paginated payments
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteQuery({
        queryKey: ["admin-payments", queryParams],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get("/admin/payments", {
                params: { ...queryParams, page: pageParam, limit: PAGE_SIZE },
            });
            return data.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.page < lastPage.totalPages) return lastPage.page + 1;
            return undefined;
        },
        initialPageParam: 1,
    });

    // Flatten paginated results
    const allPayments = useMemo(
        () => data?.pages?.flatMap((page) => page.payments || []) || [],
        [data],
    );
    const totalCount = data?.pages?.[0]?.total || 0;

    // Mutations
    const confirmPayment = useMutation({
        mutationFn: async (id) => { const { data } = await api.put(`/admin/payments/${id}/confirm`); return data; },
        onSuccess: () => { toast.success("Payment confirmed!"); queryClient.invalidateQueries({ queryKey: ["admin-payments"] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const rejectPayment = useMutation({
        mutationFn: async (id) => { const { data } = await api.put(`/admin/payments/${id}/reject`, { rejectionReason }); return data; },
        onSuccess: () => { toast.info("Payment rejected"); setRejectModal(null); setRejectionReason(""); queryClient.invalidateQueries({ queryKey: ["admin-payments"] }); },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    // Export handler
    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ format: exportFormat });
            if (exportDateRange.from) params.append("from", format(exportDateRange.from, "yyyy-MM-dd"));
            if (exportDateRange.to) params.append("to", format(exportDateRange.to, "yyyy-MM-dd"));
            if (exportIncludeSummary) params.append("withSummary", "true");
            const response = await api.get(`/admin/payments/export?${params.toString()}`, { responseType: "blob" });
            const blob = new Blob([response.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `payments-export.${exportFormat}`; a.click();
            URL.revokeObjectURL(url);
            setShowExportModal(false);
        } catch (err) { toast.error("Export failed", err.response?.data?.message || "Please try again."); }
        finally { setExporting(false); }
    };

    // Sort handler for table
    const handleSort = (key) => {
        if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else { setSortKey(key); setSortDir("asc"); }
    };
    const SortIcon = ({ col }) => {
        if (sortKey !== col) return <ChevronsUpDown size={11} className="text-[#CCC] inline ml-0.5" />;
        return sortDir === "asc"
            ? <ChevronUp size={11} className="text-primary inline ml-0.5" />
            : <ChevronDown size={11} className="text-primary inline ml-0.5" />;
    };

    const sortedPayments = useMemo(() => {
        if (!sortKey) return allPayments;
        return [...allPayments].sort((a, b) => {
            let av, bv;
            if (sortKey === "client") { av = a.client?.fullName || ""; bv = b.client?.fullName || ""; }
            else if (sortKey === "order") { av = a.order?.orderNumber || ""; bv = b.order?.orderNumber || ""; }
            else if (sortKey === "amount") { av = Number(a.amount) || 0; bv = Number(b.amount) || 0; }
            else if (sortKey === "date") { av = a.createdAt; bv = b.createdAt; }
            else if (sortKey === "status") { av = a.status || ""; bv = b.status || ""; }
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    }, [allPayments, sortKey, sortDir]);

    // Status tabs
    const TABS = [
        { v: "PENDING", l: "Pending" },
        { v: "CONFIRMED", l: "Confirmed" },
        { v: "REJECTED", l: "Rejected" },
        { v: "", l: "All" },
    ];

    return (
        <PageTransition>
            <div className="pb-20 lg:pb-0">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                        <p className="text-sm text-text-light">{totalCount} total payments</p>
                    </div>
                    <Button onClick={() => setShowExportModal(true)} variant="outline" className="gap-1.5 text-muted-foreground h-9">
                        <Download size={14} /> Export
                    </Button>
                </div>

                {/* Filter bar */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    <CustomSelect
                        options={ORDER_TYPE_OPTIONS}
                        value={orderTypeFilter}
                        onChange={setOrderTypeFilter}
                        placeholder="Order Type"
                        className="w-[160px]"
                    />
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={`h-9 border-input bg-white hover:bg-white text-sm font-normal justify-start ${!dateRange?.from && "text-muted-foreground"}`}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                    dateRange.to ? (
                                        <>{format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}</>
                                    ) : format(dateRange.from, "MMM d, yyyy")
                                ) : "Date Range"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 z-[99]" align="start">
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
                    {(dateRange?.from || dateRange?.to || orderTypeFilter) && (
                        <Button
                            variant="ghost"
                            className="h-9 text-xs text-text-light hover:text-primary"
                            onClick={() => { setDateRange({ from: undefined, to: undefined }); setOrderTypeFilter(""); }}
                        >
                            Clear filters
                        </Button>
                    )}
                </div>

                {/* Status tabs with animated indicator */}
                <div className="relative flex gap-1 mb-6 bg-muted rounded-lg p-1 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab.v} onClick={() => setStatusFilter(tab.v)}
                            className={`relative flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 z-[1] ${statusFilter === tab.v ? "text-foreground" : "text-text-light hover:text-muted-foreground"}`}>
                            {tab.l}
                            {statusFilter === tab.v && (
                                <motion.div
                                    layoutId="paymentTabBg"
                                    className="absolute inset-0 bg-popover rounded-md shadow-sm -z-[1]"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={statusFilter}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {isLoading ? (
                            statusFilter === "PENDING"
                                ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3].map(i => <SkeletonCard key={i} className="h-[160px]" />)}</div>
                                : <SkeletonTable rows={5} cols={6} />
                        ) : allPayments.length === 0 ? (
                            <EmptyState
                                icon={CreditCard}
                                title={`No ${statusFilter?.toLowerCase() || ""} payments`}
                                description={dateRange.from || orderTypeFilter ? "Try adjusting your filters." : undefined}
                            />
                        ) : statusFilter === "PENDING" ? (
                            /* Payment Cards for PENDING */
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allPayments.map((pay, i) => {
                                    const cfg = PAYMENT_STATUS[pay.status] || {};
                                    return (
                                        <motion.div
                                            key={pay.id}
                                            custom={i}
                                            initial="hidden"
                                            animate="visible"
                                            variants={staggerChild}
                                            className="p-5 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                                                        {pay.client?.fullName?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-foreground">{pay.client?.fullName || "Client"}</p>
                                                        <p className="text-[10px] font-mono-data text-text-light">{pay.order?.orderNumber || "—"}</p>
                                                    </div>
                                                </div>
                                                <p className="text-lg font-bold font-mono-data text-primary">{formatCurrency(pay.amount)}</p>
                                            </div>

                                            <div className="flex items-center gap-3 mb-3 text-xs text-text-light">
                                                <span>{new Date(pay.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                                                {pay.paymentType && (
                                                    <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                        {pay.paymentType?.replace(/_/g, " ")}
                                                    </span>
                                                )}
                                                {pay.proofUrl && (
                                                    <button onClick={() => setProofPreview(pay.proofUrl)} className="text-primary font-semibold hover:underline flex items-center gap-1">
                                                        <Eye size={12} /> View Proof
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex gap-2">
                                                <button onClick={() => confirmPayment.mutate(pay.id)} disabled={confirmPayment.isPending}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#E8F5E9] text-status-success text-xs font-semibold hover:bg-[#C8E6C9] transition-colors disabled:opacity-60">
                                                    <CheckCircle2 size={14} /> Confirm
                                                </button>
                                                <button onClick={() => { setRejectModal(pay.id); setRejectionReason(""); }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#FFEBEE] text-destructive text-xs font-semibold hover:bg-[#FFCDD2] transition-colors">
                                                    <XCircle size={14} /> Reject
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Full Table for CONFIRMED / REJECTED / ALL */
                            <div className="rounded-xl border border-border bg-white overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-surface-2">
                                                {[
                                                    { key: "client", label: "Client", align: "left" },
                                                    { key: "order", label: "Order", align: "left" },
                                                    { key: "amount", label: "Amount", align: "right" },
                                                    { key: "status", label: "Status", align: "left" },
                                                    { key: "date", label: "Date", align: "left" },
                                                ].map(col => (
                                                    <th key={col.key} onClick={() => handleSort(col.key)}
                                                        className={`text-xs font-medium text-text-light py-3 px-4 cursor-pointer select-none whitespace-nowrap hover:text-primary transition-colors ${col.align === "right" ? "text-right" : "text-left"}`}>
                                                        {col.label}<SortIcon col={col.key} />
                                                    </th>
                                                ))}
                                                <th className="text-left text-xs font-medium text-text-light py-3 px-4">Proof</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedPayments.map(pay => {
                                                const cfg = PAYMENT_STATUS[pay.status] || {};
                                                return (
                                                    <tr key={pay.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-surface-2 transition-colors">
                                                        <td className="py-3 px-4 font-medium">{pay.client?.fullName || "—"}</td>
                                                        <td className="py-3 px-4 font-mono-data text-xs text-muted-foreground">{pay.order?.orderNumber || "—"}</td>
                                                        <td className="py-3 px-4 text-right font-mono-data font-semibold">{formatCurrency(pay.amount)}</td>
                                                        <td className="py-3 px-4">
                                                            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                                                        </td>
                                                        <td className="py-3 px-4 text-xs text-text-light">{new Date(pay.createdAt).toLocaleDateString("en-NG")}</td>
                                                        <td className="py-3 px-4">
                                                            {pay.proofUrl ? (
                                                                <button onClick={() => setProofPreview(pay.proofUrl)} className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"><Eye size={12} /> View</button>
                                                            ) : <span className="text-xs text-text-light">—</span>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Load More button */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    className="h-10 px-6 gap-2 text-sm font-semibold text-primary border-primary/30 hover:bg-primary/5"
                                >
                                    {isFetchingNextPage ? (
                                        <><Loader2 size={14} className="animate-spin" /> Loading...</>
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            </div>
                        )}
                        {isFetchingNextPage && (
                            <div className="mt-4">
                                {statusFilter === "PENDING"
                                    ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2].map(i => <SkeletonCard key={i} className="h-[160px]" />)}</div>
                                    : <SkeletonTable rows={3} cols={6} />
                                }
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Proof Preview Lightbox */}
                <AnimatePresence>
                    {proofPreview && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={() => setProofPreview(null)}>
                            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                                className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => setProofPreview(null)} className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                                    <X size={16} className="text-foreground" />
                                </button>
                                <div className="relative aspect-square rounded-xl overflow-hidden bg-white">
                                    <Image src={proofPreview} alt="Proof" fill className="object-contain" />
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Reject Modal */}
                <AnimatePresence>
                    {rejectModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setRejectModal(null)}>
                            <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }}
                                className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                                <h3 className="text-lg font-bold text-foreground mb-1">Reject Payment</h3>
                                <p className="text-sm text-muted-foreground mb-4">Please provide a reason for rejection.</p>
                                <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. Proof is unclear, amount doesn't match..."
                                    className="w-full h-24 px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring resize-none transition-all" />
                                {rejectionReason.length > 0 && rejectionReason.length < 5 && <p className="text-xs text-destructive mt-1">Min 5 characters</p>}
                                <div className="flex gap-2 mt-4">
                                    <Button variant="outline" onClick={() => setRejectModal(null)} className="flex-1 h-9">Cancel</Button>
                                    <Button onClick={() => rejectPayment.mutate(rejectModal)} disabled={rejectionReason.length < 5 || rejectPayment.isPending}
                                        className="flex-1 h-9 bg-destructive text-primary-foreground hover:bg-destructive/90 gap-1.5">
                                        <XCircle size={14} /> {rejectPayment.isPending ? "..." : "Reject"}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Export Modal */}
                <AnimatePresence>
                    {showExportModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowExportModal(false)}>
                            <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }}
                                className="bg-white rounded-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-5">
                                    <h3 className="text-lg font-bold text-foreground">Export Payments</h3>
                                    <button onClick={() => setShowExportModal(false)}><X size={18} className="text-text-light" /></button>
                                </div>
                                <div className="space-y-4">
                                    {/* Format selector */}
                                    <div>
                                        <p className="text-xs text-text-light mb-2">Format</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => setExportFormat("csv")}
                                                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${exportFormat === "csv" ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}>
                                                <Download size={14} className="inline mr-1" /> CSV
                                            </button>
                                            <button onClick={() => setExportFormat("pdf")}
                                                className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${exportFormat === "pdf" ? "border-primary bg-primary/5 text-primary" : "border-input text-muted-foreground"}`}>
                                                <FileText size={14} className="inline mr-1" /> PDF
                                            </button>
                                        </div>
                                    </div>

                                    {/* Date range picker */}
                                    <div>
                                        <p className="text-xs text-text-light mb-2">Date Range (optional)</p>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className={`w-full h-9 border-input bg-white hover:bg-white text-sm font-normal justify-start ${!exportDateRange?.from && "text-muted-foreground"}`}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {exportDateRange?.from ? (
                                                        exportDateRange.to ? (
                                                            <>{format(exportDateRange.from, "MMM d")} – {format(exportDateRange.to, "MMM d, yyyy")}</>
                                                        ) : format(exportDateRange.from, "MMM d, yyyy")
                                                    ) : "Select date range"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 z-[90]" align="start">
                                                <Calendar
                                                    initialFocus
                                                    mode="range"
                                                    defaultMonth={exportDateRange?.from}
                                                    selected={exportDateRange}
                                                    onSelect={(range) => setExportDateRange(range || { from: undefined, to: undefined })}
                                                    numberOfMonths={2}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Include Summary (custom checkbox) */}
                                    {exportFormat === "pdf" && (
                                        <label className="flex items-center gap-3 cursor-pointer group" onClick={() => setExportIncludeSummary(!exportIncludeSummary)}>
                                            <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${exportIncludeSummary ? "bg-primary border-primary" : "border-[#D0D0D0] group-hover:border-primary/50"}`}>
                                                {exportIncludeSummary && (
                                                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                        width="12" height="12" viewBox="0 0 12 12" fill="none">
                                                        <motion.path
                                                            initial={{ pathLength: 0 }}
                                                            animate={{ pathLength: 1 }}
                                                            transition={{ duration: 0.2, delay: 0.05 }}
                                                            d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                                        />
                                                    </motion.svg>
                                                )}
                                            </div>
                                            <span className="text-sm text-muted-foreground">Include summary</span>
                                        </label>
                                    )}
                                </div>
                                <Button onClick={handleExport} disabled={exporting} className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90 h-10 gap-2">
                                    {exporting ? <><Loader2 size={14} className="animate-spin" /> Exporting...</> : <><Download size={14} /> Export</>}
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
}
