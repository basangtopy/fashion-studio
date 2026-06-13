"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ChevronDown, AlertTriangle, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, PAYMENT_STATUS } from "@/config/branding";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import StatusPill from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import ImageLightbox from "@/components/shared/ImageLightbox";

export default function ClientPaymentsPage() {
    const [expanded, setExpanded] = useState(null);
    const [lightboxImage, setLightboxImage] = useState(null);


    const { data, isLoading } = useQuery({
        queryKey: ["client-payments"],
        queryFn: async () => {
            const { data: ordersRes } = await api.get("/orders");
            const orders = ordersRes.data?.orders || ordersRes.data || [];
            if (!Array.isArray(orders) || orders.length === 0) return { payments: [], orders: [] };

            const allPayments = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const { data: payRes } = await api.get(`/payments/order/${order.id}`);
                        const payments = payRes.data?.payments || payRes.data || [];
                        return Array.isArray(payments)
                            ? payments.map((p) => ({ ...p, order }))
                            : [];
                    } catch {
                        return [];
                    }
                })
            );

            const payments = allPayments.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return { payments, orders };
        },
    });

    const payments = data?.payments || [];
    const orders = data?.orders || [];
    const confirmed = payments.filter((p) => p.status === "CONFIRMED");
    const pending = payments.filter((p) => p.status === "PENDING");
    const totalPaid = confirmed.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalPending = pending.reduce((s, p) => s + Number(p.amount || 0), 0);

    const outstandingBalance = orders.reduce((sum, order) => {
        const agreedFee = Number(order.totalAgreedFee || order.agreedFee || 0);
        const orderPayments = payments.filter(p => p.order?.id === order.id && p.status === "CONFIRMED");
        const orderTotalPaid = orderPayments.reduce((s, p) => s + Number(p.amount), 0);
        return sum + Math.max(0, agreedFee - orderTotalPaid);
    }, 0);

    return (
        <div className="pb-20 lg:pb-0">
            <h1 className="text-2xl font-bold text-[#0D0D0D] mb-6">Payments</h1>

            {/* ─── Summary Strip (3 stat cards) ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <SkeletonStat key={i} />)
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                        }}
                        className="col-span-1 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-[#999] uppercase tracking-wider">Total Paid</span>
                                <div className="w-9 h-9 rounded-lg bg-[#2E7D32]/10 flex items-center justify-center">
                                    <CreditCard size={18} className="text-[#2E7D32]" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold font-mono-data text-[#2E7D32]">{formatCurrency(totalPaid)}</p>
                        </motion.div>
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-[#999] uppercase tracking-wider">Pending Confirmation</span>
                                <div className="w-9 h-9 rounded-lg bg-[#F9A825]/10 flex items-center justify-center">
                                    <CreditCard size={18} className="text-[#F9A825]" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold font-mono-data text-[#F9A825]">{formatCurrency(totalPending)}</p>
                            <p className="text-[11px] text-[#999] mt-1">{pending.length} awaiting admin confirmation</p>
                        </motion.div>
                        <motion.div
                            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-[#999] uppercase tracking-wider">Outstanding Balance</span>
                                <div className="w-9 h-9 rounded-lg bg-[#E65100]/10 flex items-center justify-center">
                                    <CreditCard size={18} className="text-[#E65100]" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold font-mono-data text-[#E65100]">{formatCurrency(outstandingBalance)}</p>
                        </motion.div>
                    </motion.div>
                )}
            </div>

            {/* ─── Payment List ─── */}
            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : payments.length === 0 ? (
                <EmptyState
                    icon={CreditCard}
                    title="No payments yet"
                    description="Your payment history will appear here once you make your first payment."
                />
            ) : (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                    }}
                    className="space-y-3"
                >
                    {payments.map((payment) => {
                        const statusCfg = PAYMENT_STATUS[payment.status] || {};
                        const isExpanded = expanded === payment.id;
                        const isRejected = payment.status === "REJECTED";

                        return (
                            <motion.div
                                variants={{
                                    hidden: { opacity: 0, y: 16 },
                                    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
                                }}
                                key={payment.id}
                            >
                                <div
                                    className={`rounded-xl border bg-white overflow-hidden card-hover shadow-sm transition-all flex flex-col ${isRejected
                                        ? "border-[#C62828]/20 hover:border-[#C62828]/50"
                                        : "border-[rgba(0,0,0,0.06)] hover:border-[rgba(194,24,91,0.3)]"
                                        }`}
                                >
                                    <Button
                                        variant="ghost"
                                        onClick={() => setExpanded(isExpanded ? null : payment.id)}
                                        className="w-full flex items-center justify-between px-5 py-4 h-auto rounded-none hover:bg-transparent"
                                    >
                                        <div className="flex items-center gap-4 text-left">
                                            {/* Order number (linked) */}
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/client/orders/${payment.order?.id}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-xs font-mono-data text-[#C2185B] hover:underline"
                                                >
                                                    {payment.order?.orderNumber || "—"}
                                                </Link>
                                                <p className="text-[10px] text-[#999] mt-0.5">
                                                    {payment.paymentType === "FULL" ? "Full Payment" : "Installment"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {/* Amount (mono, prominent) */}
                                            <span className="text-sm font-bold font-mono-data text-[#0D0D0D]">
                                                {formatCurrency(payment.amount)}
                                            </span>

                                            {/* Status pill */}
                                            <span
                                                className="text-[11px] px-2 py-1 rounded-full font-semibold whitespace-nowrap"
                                                style={{ backgroundColor: statusCfg.bg, color: statusCfg.text }}
                                            >
                                                {statusCfg.label}
                                            </span>

                                            {/* Date */}
                                            <span className="text-[10px] text-[#999] hidden sm:block whitespace-nowrap">
                                                {new Date(payment.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                            </span>

                                            <ChevronDown
                                                size={16}
                                                className={`text-[#999] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                                            />
                                        </div>
                                    </Button>

                                    {/* Rejection reason inline (Warning tint) */}
                                    {isRejected && payment.adminNote && !isExpanded && (
                                        <div className="px-5 pb-3 flex items-start gap-2">
                                            <AlertTriangle size={12} className="text-[#C62828] shrink-0 mt-0.5" />
                                            <p className="text-xs text-[#C62828]">{payment.adminNote}</p>
                                        </div>
                                    )}

                                    {/* Expanded details */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: "auto" }}
                                                exit={{ height: 0 }}
                                                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-5 pb-5 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                                                        <div>
                                                            <span className="text-[#999] text-xs">Order</span>
                                                            <Link
                                                                href={`/client/orders/${payment.order?.id}`}
                                                                className="font-mono-data text-[#C2185B] hover:underline block"
                                                            >
                                                                {payment.order?.orderNumber || "—"}
                                                            </Link>
                                                        </div>
                                                        <div>
                                                            <span className="text-[#999] text-xs">Type</span>
                                                            <p className="text-[#0D0D0D]">
                                                                {payment.paymentType === "FULL" ? "Full Payment" : "Installment"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[#999] text-xs">Submitted</span>
                                                            <p className="text-[#0D0D0D]">{new Date(payment.createdAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</p>
                                                        </div>
                                                        {payment.confirmedAt && (
                                                            <div>
                                                                <span className="text-[#999] text-xs">Confirmed</span>
                                                                <p className="text-[#0D0D0D]">{new Date(payment.confirmedAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Rejection reason (expanded view) */}
                                                    {isRejected && payment.adminNote && (
                                                        <div className="mb-4 p-3 rounded-lg bg-[#FFEBEE] border border-[#C62828]/10 flex items-start gap-2">
                                                            <AlertTriangle size={14} className="text-[#C62828] shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="text-xs font-semibold text-[#C62828]">Rejection Reason</p>
                                                                <p className="text-xs text-[#C62828]/80 mt-0.5">{payment.adminNote}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Admin note for non-rejected */}
                                                    {!isRejected && payment.adminNote && (
                                                        <p className="text-xs text-[#555] italic mb-3">&ldquo;{payment.adminNote}&rdquo;</p>
                                                    )}

                                                    {payment.proofUrl && (
                                                        <div className="mt-4 border-t border-[rgba(0,0,0,0.06)] pt-4">
                                                            <p className="text-xs font-semibold text-[#0D0D0D] mb-3 flex items-center gap-1.5">
                                                                Payment Proof
                                                            </p>
                                                            <div onClick={() => { setLightboxImage(payment.proofUrl) }} className="cursor-pointer relative w-full max-w-[280px] aspect-[4/3] rounded-lg overflow-hidden border border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] hover:opacity-80 transition-opacity">
                                                                <Image src={payment.proofUrl} alt="Payment proof" fill className="object-contain" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ─── Image Lightbox ─── */}
            <ImageLightbox lightboxImage={lightboxImage} setLightboxImage={setLightboxImage} />
        </div>
    );
}
