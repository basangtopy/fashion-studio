"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, ChevronDown, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/shared/Skeleton";
import MeasurementFormModal from "@/components/admin/MeasurementFormModal";

// ─── Display helpers ───────────────────────────────────────────────────────────
const MEASUREMENT_GROUPS = {
    "Upper Body": ["bust", "waist", "hips", "shoulderWidth", "sleeveLength", "armLength", "armCircumference", "wristCircumference", "neck"],
    "Lower Body": ["thigh", "inseam", "ankleCircumference"],
    "Length": ["dressLength", "frontLength", "backLength"],
};

const MEASUREMENT_LABELS = {
    bust: "Bust", waist: "Waist", hips: "Hips", shoulderWidth: "Shoulder Width",
    sleeveLength: "Sleeve Length", armLength: "Arm Length",
    armCircumference: "Arm Circumference", wristCircumference: "Wrist Circumference",
    neck: "Neck", thigh: "Thigh", inseam: "Inseam", ankleCircumference: "Ankle Circumference",
    dressLength: "Dress Length", frontLength: "Front Length", backLength: "Back Length",
};


export default function MeasurementsPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const { data: serverMeasurements, isLoading } = useQuery({
        queryKey: ["measurements"],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${user?.id}`);
            return data.data?.measurement || data.data || null;
        },
        enabled: !!user?.id,
    });

    const { data: history } = useQuery({
        queryKey: ["measurement-history"],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/measurements/${user?.id}/history`);
                return data.data?.history || data.data || [];
            } catch {
                return [];
            }
        },
        enabled: !!serverMeasurements?.id,
    });

    const historyItems = Array.isArray(history) ? history : [];
    const hasData = serverMeasurements && !!serverMeasurements.id;
    const flatMeasurements = hasData ? { ...serverMeasurements, ...(serverMeasurements.customParams || {}) } : {};

    const lastUpdated = serverMeasurements?.updatedAt
        ? new Date(serverMeasurements.updatedAt).toLocaleDateString("en-NG", { dateStyle: "long" })
        : null;

    if (isLoading) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
    }

    return (
        <div className="pb-20 lg:pb-0">
            {/* ── Header ── */}
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-2">
                <div className="min-w-0 pr-2">
                    <h1 className="text-lg sm:text-2xl font-bold text-[#0D0D0D] truncate">Your Measurements</h1>
                    {lastUpdated && <p className="text-[10px] sm:text-xs text-[#999] mt-0.5 truncate">Last updated: {lastUpdated}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button onClick={() => setModalOpen(true)} className="bg-[#C2185B] text-white hover:bg-[#A01548]">
                        {hasData ? "Update" : "Submit Measurements"}
                    </Button>
                </div>
            </div>

            {/* ── Empty State ── */}
            {!hasData && (
                <div className="mt-8 p-10 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white text-center shadow-sm max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-[#F4F0F8] rounded-full flex items-center justify-center mx-auto mb-5">
                        <Ruler size={28} className="text-[#C2185B]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0D0D0D] mb-2">No Measurements On File</h2>
                    <p className="text-sm text-[#555] leading-relaxed mb-8 max-w-md mx-auto">
                        For the absolute best results and a flawless fit, we highly recommend scheduling an in-studio fitting. If you cannot visit, you may self-report your measurements.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link href="/client/appointments" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors shadow-sm">
                            <Calendar size={16} /> Book a Fitting
                        </Link>
                        <Button variant="outline" onClick={() => setModalOpen(true)} className="w-full sm:w-auto border-[#E0E0E0] text-[#0D0D0D] hover:bg-[#FAFAFA]">
                            Self-Report Measurements
                        </Button>
                    </div>
                </div>
            )}


            {/* ── Card View ── */}
            {hasData && (
                <motion.div initial="hidden" animate="visible" variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } }} className="space-y-4 mt-6">
                    {Object.entries(MEASUREMENT_GROUPS).map(([groupName, fieldKeys]) => {
                        const items = fieldKeys.filter(k => flatMeasurements[k] != null);
                        if (items.length === 0) return null;
                        return (
                            <motion.div key={groupName} variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }} className="p-5 sm:p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
                                <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-5">{groupName}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                                    {items.map(field => (
                                        <div key={field}>
                                            <label className="text-[11px] text-[#757575] font-medium block uppercase tracking-wider mb-1">{MEASUREMENT_LABELS[field] || field}</label>
                                            <p className="text-[15px] font-mono-data font-semibold text-[#0D0D0D]">{flatMeasurements[field]}cm</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}

                    {Object.keys(serverMeasurements?.customParams || {}).length > 0 && (
                        <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }} className="p-5 sm:p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-5">Custom Fields</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                                {Object.entries(serverMeasurements.customParams).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="text-[11px] text-[#757575] font-medium block uppercase tracking-wider mb-1">{MEASUREMENT_LABELS[key] || key}</label>
                                        <p className="text-[15px] font-mono-data font-semibold text-[#0D0D0D]">{value}cm</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {serverMeasurements?.notes && (
                        <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }} className="p-5 sm:p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-3">Additional Notes</h3>
                            <p className="text-[14px] text-[#555] whitespace-pre-wrap leading-relaxed">{serverMeasurements.notes}</p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Request Update CTA */}
            {hasData && (
                <div className="mt-8 flex justify-end">
                    <Link href="?action=book_appointment" scroll={false} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[rgba(0,0,0,0.12)] text-[13px] font-semibold text-[#555] hover:bg-[#F4F0F8] transition-colors shadow-sm">
                        <Calendar size={14} /> Request Studio Update
                    </Link>
                </div>
            )}

            {/* ── Measurement History Accordion ── */}
            {historyItems.length > 0 && (
                <div className="mt-10 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden shadow-sm">
                    <button onClick={() => setHistoryExpanded(!historyExpanded)} className="w-full flex items-center justify-between px-6 py-5 hover:bg-[#FAFAFA] transition-colors">
                        <h2 className="text-lg font-bold text-[#0D0D0D]">Measurement History</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#F4F0F8] text-[#555]">{historyItems.length} records</span>
                            <ChevronDown size={18} className={`text-[#0D0D0D] transition-transform ${historyExpanded ? "rotate-180" : ""}`} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {historyExpanded && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-[#FAFAFA] border-t border-[rgba(0,0,0,0.04)]">
                                <div className="p-6 space-y-4">
                                    {historyItems.map((entry, i) => (
                                        <div key={entry.id || i} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(0,0,0,0.04)]">
                                                <span className="text-xs font-semibold text-[#555]">
                                                    {new Date(entry.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-[#F4F0F8] text-[#555]">
                                                    {entry.updatedByRole === "CLIENT" ? "Self-Reported" : "Professional"}
                                                </span>
                                            </div>
                                            {entry.notes && (
                                                <div className="mb-4 text-[13px] text-[#555] p-3 bg-[#F4F0F8]/50 rounded-lg italic border border-[rgba(0,0,0,0.03)]">
                                                    &ldquo;{entry.notes}&rdquo;
                                                </div>
                                            )}
                                            {entry.changedFields && (
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-6 text-sm">
                                                    {Object.entries(entry.changedFields).flatMap(([key, change]) => {
                                                        // customParams is a nested dict: { rise: { from, to }, calf: { from, to } }
                                                        if (key === "customParams" && typeof change === "object" && !("from" in change)) {
                                                            return Object.entries(change).map(([cpKey, cpChange]) => {
                                                                const increased = Number(cpChange.to) > Number(cpChange.from);
                                                                return (
                                                                    <div key={`cp-${cpKey}`} className="flex items-center gap-1.5 whitespace-nowrap">
                                                                        <span className="text-[#757575] text-[13px]">{cpKey} (custom):</span>
                                                                        <span className="text-[#555] line-through font-mono-data text-[13px]">{cpChange.from ?? "—"}</span>
                                                                        {increased ? <ArrowUpRight size={12} className="text-[#E65100]" /> : <ArrowDownRight size={12} className="text-[#2E7D32]" />}
                                                                        <span className="text-[#2E7D32] font-mono-data font-bold text-[13px]">{cpChange.to}</span>
                                                                    </div>
                                                                );
                                                            });
                                                        }
                                                        // Standard field: { from, to }
                                                        if (typeof change !== "object" || !("from" in change)) return [];
                                                        const increased = Number(change.to) > Number(change.from);
                                                        return [
                                                            <div key={key} className="flex items-center gap-1.5 whitespace-nowrap">
                                                                <span className="text-[#757575] text-[13px]">{MEASUREMENT_LABELS[key] || key}:</span>
                                                                <span className="text-[#555] line-through font-mono-data text-[13px]">{change.from ?? "—"}</span>
                                                                {increased ? <ArrowUpRight size={12} className="text-[#E65100]" /> : <ArrowDownRight size={12} className="text-[#2E7D32]" />}
                                                                <span className="text-[#2E7D32] font-mono-data font-bold text-[13px]">{change.to}</span>
                                                            </div>
                                                        ];
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Shared Measurement Modal (client mode) ── */}
            <MeasurementFormModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                clientId={user?.id}
                existingMeasurement={hasData ? serverMeasurements : null}
                isClient={true}
            />
        </div>
    );
}
