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
                    <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Your Measurements</h1>
                    {lastUpdated && <p className="text-[10px] sm:text-xs text-text-light mt-0.5 truncate">Last updated: {lastUpdated}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button onClick={() => setModalOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                        {hasData ? "Update" : "Submit Measurements"}
                    </Button>
                </div>
            </div>

            {/* ── Empty State ── */}
            {!hasData && (
                <div className="mt-8 p-10 rounded-2xl border border-border bg-white text-center shadow-sm max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5">
                        <Ruler size={28} className="text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground mb-2">No Measurements On File</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
                        For the absolute best results and a flawless fit, we highly recommend scheduling an in-studio fitting. If you cannot visit, you may self-report your measurements.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link href="/client/appointments" className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                            <Calendar size={16} /> Book a Fitting
                        </Link>
                        <Button variant="outline" onClick={() => setModalOpen(true)} className="w-full sm:w-auto border-input text-foreground hover:bg-surface-2">
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
                            <motion.div key={groupName} variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }} className="p-5 sm:p-6 rounded-2xl border border-border bg-white shadow-sm">
                                <h3 className="text-[15px] font-bold text-foreground mb-5">{groupName}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                                    {items.map(field => (
                                        <div key={field}>
                                            <label className="text-[11px] text-[#757575] font-medium block uppercase tracking-wider mb-1">{MEASUREMENT_LABELS[field] || field}</label>
                                            <p className="text-[15px] font-mono-data font-semibold text-foreground">{flatMeasurements[field]}cm</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}

                    {Object.keys(serverMeasurements?.customParams || {}).length > 0 && (
                        <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }} className="p-5 sm:p-6 rounded-2xl border border-border bg-white shadow-sm">
                            <h3 className="text-[15px] font-bold text-foreground mb-5">Custom Fields</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                                {Object.entries(serverMeasurements.customParams).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="text-[11px] text-[#757575] font-medium block uppercase tracking-wider mb-1">{MEASUREMENT_LABELS[key] || key}</label>
                                        <p className="text-[15px] font-mono-data font-semibold text-foreground">{value}cm</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {serverMeasurements?.notes && (
                        <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }} className="p-5 sm:p-6 rounded-2xl border border-border bg-white shadow-sm">
                            <h3 className="text-[15px] font-bold text-foreground mb-3">Additional Notes</h3>
                            <p className="text-[14px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{serverMeasurements.notes}</p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Request Update CTA */}
            {hasData && (
                <div className="mt-8 flex justify-end">
                    <Link href="?action=book_appointment" scroll={false} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[rgba(0,0,0,0.12)] text-[13px] font-semibold text-muted-foreground hover:bg-muted transition-colors shadow-sm">
                        <Calendar size={14} /> Request Studio Update
                    </Link>
                </div>
            )}

            {/* ── Measurement History Accordion ── */}
            {historyItems.length > 0 && (
                <div className="mt-10 rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
                    <button onClick={() => setHistoryExpanded(!historyExpanded)} className="w-full flex items-center justify-between px-6 py-5 hover:bg-surface-2 transition-colors">
                        <h2 className="text-lg font-bold text-foreground">Measurement History</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-muted text-muted-foreground">{historyItems.length} records</span>
                            <ChevronDown size={18} className={`text-foreground transition-transform ${historyExpanded ? "rotate-180" : ""}`} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {historyExpanded && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-surface-2 border-t border-[rgba(0,0,0,0.04)]">
                                <div className="p-6 space-y-4">
                                    {historyItems.map((entry, i) => (
                                        <div key={entry.id || i} className="p-5 rounded-xl border border-border bg-white shadow-sm">
                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(0,0,0,0.04)]">
                                                <span className="text-xs font-semibold text-muted-foreground">
                                                    {new Date(entry.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-muted text-muted-foreground">
                                                    {entry.updatedByRole === "CLIENT" ? "Self-Reported" : "Professional"}
                                                </span>
                                            </div>
                                            {entry.notes && (
                                                <div className="mb-4 text-[13px] text-muted-foreground p-3 bg-muted/50 rounded-lg italic border border-[rgba(0,0,0,0.03)]">
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
                                                                        <span className="text-muted-foreground line-through font-mono-data text-[13px]">{cpChange.from ?? "—"}</span>
                                                                        {increased ? <ArrowUpRight size={12} className="text-status-warning" /> : <ArrowDownRight size={12} className="text-status-success" />}
                                                                        <span className="text-status-success font-mono-data font-bold text-[13px]">{cpChange.to}</span>
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
                                                                <span className="text-muted-foreground line-through font-mono-data text-[13px]">{change.from ?? "—"}</span>
                                                                {increased ? <ArrowUpRight size={12} className="text-status-warning" /> : <ArrowDownRight size={12} className="text-status-success" />}
                                                                <span className="text-status-success font-mono-data font-bold text-[13px]">{change.to}</span>
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
