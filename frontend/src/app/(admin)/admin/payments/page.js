"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, CheckCircle2, XCircle, Eye, X, Search, Download, FileText } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, PAYMENT_STATUS } from "@/config/branding";
import { SkeletonTable } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/toaster";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

export default function AdminPaymentsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState("");
    const [proofPreview, setProofPreview] = useState(null);
    const [exporting, setExporting] = useState(null);

    const handleExport = async (format) => {
        setExporting(format);
        try {
            const response = await api.get(`/admin/payments/export?format=${format}`, { responseType: "blob" });
            const blob = new Blob([response.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `payments-export.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            toast.error("Export failed", err.response?.data?.message || "Please try again.");
        } finally {
            setExporting(null);
        }
    };

    const { data, isLoading } = useQuery({
        queryKey: ["admin-payments", statusFilter],
        queryFn: async () => {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const { data } = await api.get("/admin/payments", { params });
            return data.data?.payments || data.data || [];
        },
    });

    const confirmPayment = useMutation({
        mutationFn: async (id) => {
            const { data } = await api.put(`/admin/payments/${id}/confirm`);
            return data;
        },
        onSuccess: () => {
            toast.success("Payment confirmed!");
            queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const rejectPayment = useMutation({
        mutationFn: async (id) => {
            const { data } = await api.put(`/admin/payments/${id}/reject`, { reason: "Rejected" });
            return data;
        },
        onSuccess: () => {
            toast.info("Payment rejected");
            queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
        },
    });

    const payments = Array.isArray(data) ? data : [];

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <h1 className="text-2xl font-bold text-[#0D0D0D]">Payments</h1>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => handleExport("csv")} disabled={!!exporting} className="gap-1.5 text-[#555] h-9">
                        <Download size={14} /> {exporting === "csv" ? "..." : "CSV"}
                    </Button>
                    <Button variant="outline" onClick={() => handleExport("pdf")} disabled={!!exporting} className="gap-1.5 text-[#555] h-9">
                        <FileText size={14} /> {exporting === "pdf" ? "..." : "PDF"}
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
                {["", "PENDING", "CONFIRMED", "REJECTED"].map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? "bg-[#1A1A2E] text-white" : "bg-[#F4F0F8] text-[#555]"}`}>
                        {s || "All"}
                    </button>
                ))}
            </div>

            {isLoading ? <SkeletonTable rows={6} cols={6} /> : payments.length === 0 ? (
                <EmptyState icon={CreditCard} title="No payments found" />
            ) : (
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
                                    <th className="text-right text-xs font-medium text-[#999] py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((pay) => {
                                    const cfg = PAYMENT_STATUS[pay.status] || {};
                                    return (
                                        <tr key={pay.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-[#FAFAFA] transition-colors">
                                            <td className="py-3 px-4 font-medium">{pay.client?.fullName || "—"}</td>
                                            <td className="py-3 px-4 font-mono-data text-xs text-[#555]">{pay.order?.orderNumber || "—"}</td>
                                            <td className="py-3 px-4 text-right font-mono-data font-semibold">{formatCurrency(pay.amount)}</td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.text }}>
                                                    {cfg.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-xs text-[#999]">{new Date(pay.createdAt).toLocaleDateString("en-NG")}</td>
                                            <td className="py-3 px-4">
                                                {pay.proofUrl ? (
                                                    <button onClick={() => setProofPreview(pay.proofUrl)} className="text-xs text-[#C2185B] font-semibold hover:underline flex items-center gap-1">
                                                        <Eye size={12} /> View
                                                    </button>
                                                ) : <span className="text-xs text-[#999]">—</span>}
                                            </td>
                                            <td className="py-3 px-4">
                                                {pay.status === "PENDING" && (
                                                    <div className="flex gap-1.5 justify-end">
                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" onClick={() => confirmPayment.mutate(pay.id)} className="h-7 w-7 bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32]">
                                                                        <CheckCircle2 size={13} />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Confirm Payment</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        <TooltipProvider>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <Button variant="ghost" size="icon" onClick={() => rejectPayment.mutate(pay.id)} className="h-7 w-7 bg-[#FFEBEE] hover:bg-[#FFCDD2] text-[#C62828]">
                                                                        <XCircle size={13} />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>Reject Payment</p></TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {proofPreview && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-4" onClick={() => setProofPreview(null)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setProofPreview(null)} className="absolute -top-10 right-0 text-white"><X size={20} /></button>
                            <div className="relative aspect-square rounded-xl overflow-hidden bg-white">
                                <Image src={proofPreview} alt="Proof" fill className="object-contain" />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
