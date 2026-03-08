"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, CheckCircle2, XCircle, Eye, X, Download, FileText, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, PAYMENT_STATUS } from "@/config/branding";
import { SkeletonCard, SkeletonTable } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminPaymentsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [proofPreview, setProofPreview] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState("csv");
    const [exportStart, setExportStart] = useState("");
    const [exportEnd, setExportEnd] = useState("");
    const [exportIncludeSummary, setExportIncludeSummary] = useState(false);
    const [exporting, setExporting] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-payments"],
        queryFn: async () => {
            const { data } = await api.get("/admin/payments");
            return data.data?.payments || data.data || [];
        },
    });

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

    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams({ format: exportFormat });
            if (exportStart) params.append("startDate", exportStart);
            if (exportEnd) params.append("endDate", exportEnd);
            if (exportIncludeSummary) params.append("includeSummary", "true");
            const response = await api.get(`/admin/payments/export?${params.toString()}`, { responseType: "blob" });
            const blob = new Blob([response.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `payments-export.${exportFormat}`; a.click();
            URL.revokeObjectURL(url);
            setShowExportModal(false);
        } catch (err) { toast.error("Export failed", err.response?.data?.message || "Please try again."); }
        finally { setExporting(false); }
    };

    const allPayments = Array.isArray(data) ? data : [];
    const filtered = statusFilter ? allPayments.filter(p => p.status === statusFilter) : allPayments;
    const pendingPayments = allPayments.filter(p => p.status === "PENDING");
    const tabCounts = { "": allPayments.length, PENDING: pendingPayments.length, CONFIRMED: allPayments.filter(p => p.status === "CONFIRMED").length, REJECTED: allPayments.filter(p => p.status === "REJECTED").length };

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Payments</h1>
                    <p className="text-sm text-[#999]">{allPayments.length} total payments</p>
                </div>
                <Button onClick={() => setShowExportModal(true)} variant="outline" className="gap-1.5 text-[#555] h-9">
                    <Download size={14} /> Export
                </Button>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1 overflow-x-auto">
                {[{ v: "PENDING", l: "Pending" }, { v: "CONFIRMED", l: "Confirmed" }, { v: "REJECTED", l: "Rejected" }, { v: "", l: "All" }].map(tab => (
                    <button key={tab.v} onClick={() => setStatusFilter(tab.v)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${statusFilter === tab.v ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999] hover:text-[#555]"}`}>
                        {tab.l}
                        {tabCounts[tab.v] > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[rgba(0,0,0,0.05)]">{tabCounts[tab.v]}</span>}
                    </button>
                ))}
            </div>

            {isLoading ? (
                statusFilter === "PENDING" ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1, 2, 3].map(i => <SkeletonCard key={i} className="h-[160px]" />)}</div> : <SkeletonTable rows={5} cols={6} />
            ) : filtered.length === 0 ? (
                <EmptyState icon={CreditCard} title={`No ${statusFilter?.toLowerCase() || ""} payments`} />
            ) : statusFilter === "PENDING" ? (
                /* Payment Cards for PENDING */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(pay => {
                        const cfg = PAYMENT_STATUS[pay.status] || {};
                        return (
                            <div key={pay.id} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {pay.client?.fullName?.charAt(0) || "?"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">{pay.client?.fullName || "Client"}</p>
                                            <p className="text-[10px] font-mono-data text-[#999]">{pay.order?.orderNumber || "—"}</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold font-mono-data text-[#C2185B]">{formatCurrency(pay.amount)}</p>
                                </div>

                                <div className="flex items-center gap-3 mb-3 text-xs text-[#999]">
                                    <span>{new Date(pay.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                                    {pay.proofUrl && (
                                        <button onClick={() => setProofPreview(pay.proofUrl)} className="text-[#C2185B] font-semibold hover:underline flex items-center gap-1">
                                            <Eye size={12} /> View Proof
                                        </button>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => confirmPayment.mutate(pay.id)} disabled={confirmPayment.isPending}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold hover:bg-[#C8E6C9] transition-colors disabled:opacity-60">
                                        <CheckCircle2 size={14} /> Confirm
                                    </button>
                                    <button onClick={() => { setRejectModal(pay.id); setRejectionReason(""); }}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#FFEBEE] text-[#C62828] text-xs font-semibold hover:bg-[#FFCDD2] transition-colors">
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Full Table for CONFIRMED / REJECTED / ALL */
                <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Client</th>
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Order</th>
                                    <th className="text-right text-xs font-medium text-[#999] py-3 px-4">Amount</th>
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Status</th>
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Date</th>
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Proof</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(pay => {
                                    const cfg = PAYMENT_STATUS[pay.status] || {};
                                    return (
                                        <tr key={pay.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-[#FAFAFA] transition-colors">
                                            <td className="py-3 px-4 font-medium">{pay.client?.fullName || "—"}</td>
                                            <td className="py-3 px-4 font-mono-data text-xs text-[#555]">{pay.order?.orderNumber || "—"}</td>
                                            <td className="py-3 px-4 text-right font-mono-data font-semibold">{formatCurrency(pay.amount)}</td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>{cfg.label}</span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-[#999]">{new Date(pay.createdAt).toLocaleDateString("en-NG")}</td>
                                            <td className="py-3 px-4">
                                                {pay.proofUrl ? (
                                                    <button onClick={() => setProofPreview(pay.proofUrl)} className="text-xs text-[#C2185B] font-semibold hover:underline flex items-center gap-1"><Eye size={12} /> View</button>
                                                ) : <span className="text-xs text-[#999]">—</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Proof Preview */}
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
                            <h3 className="text-lg font-bold text-[#0D0D0D] mb-1">Reject Payment</h3>
                            <p className="text-sm text-[#555] mb-4">Please provide a reason for rejection.</p>
                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="e.g. Proof is unclear, amount doesn't match..."
                                className="w-full h-24 px-3 py-2 text-sm border border-[rgba(0,0,0,0.12)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C2185B]/30 focus:border-[#C2185B] resize-none transition-all" />
                            {rejectionReason.length > 0 && rejectionReason.length < 5 && <p className="text-xs text-[#C62828] mt-1">Min 5 characters</p>}
                            <div className="flex gap-2 mt-4">
                                <Button variant="outline" onClick={() => setRejectModal(null)} className="flex-1 h-9">Cancel</Button>
                                <Button onClick={() => rejectPayment.mutate(rejectModal)} disabled={rejectionReason.length < 5 || rejectPayment.isPending}
                                    className="flex-1 h-9 bg-[#C62828] text-white hover:bg-[#B71C1C] gap-1.5">
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
                                <h3 className="text-lg font-bold text-[#0D0D0D]">Export Payments</h3>
                                <button onClick={() => setShowExportModal(false)}><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-[#999] mb-2">Format</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setExportFormat("csv")}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${exportFormat === "csv" ? "border-[#C2185B] bg-[#C2185B]/5 text-[#C2185B]" : "border-[#E0E0E0] text-[#555]"}`}>
                                            <Download size={14} className="inline mr-1" /> CSV
                                        </button>
                                        <button onClick={() => setExportFormat("pdf")}
                                            className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors ${exportFormat === "pdf" ? "border-[#C2185B] bg-[#C2185B]/5 text-[#C2185B]" : "border-[#E0E0E0] text-[#555]"}`}>
                                            <FileText size={14} className="inline mr-1" /> PDF
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-[#999] mb-1 block">Start Date</label>
                                        <Input type="date" value={exportStart} onChange={(e) => setExportStart(e.target.value)} className="h-9 bg-white text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[#999] mb-1 block">End Date</label>
                                        <Input type="date" value={exportEnd} onChange={(e) => setExportEnd(e.target.value)} className="h-9 bg-white text-sm" />
                                    </div>
                                </div>
                                {exportFormat === "pdf" && (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={exportIncludeSummary} onChange={(e) => setExportIncludeSummary(e.target.checked)}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0]" />
                                        <span className="text-sm text-[#555]">Include summary</span>
                                    </label>
                                )}
                            </div>
                            <Button onClick={handleExport} disabled={exporting} className="w-full mt-5 bg-[#C2185B] text-white hover:bg-[#A01548] h-10 gap-2">
                                <Download size={14} /> {exporting ? "Exporting..." : "Export"}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
