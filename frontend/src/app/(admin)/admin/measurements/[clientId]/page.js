"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Ruler, Download, FileText, History, ChevronDown, ChevronUp, Edit3, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard, SkeletonLine } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import MeasurementFormModal from "@/components/admin/MeasurementFormModal";
import { Button } from "@/components/ui/button";

const UPPER_BODY_FIELDS = ["bust", "waist", "hips", "shoulderWidth", "sleeveLength", "armLength", "armCircumference", "wristCircumference", "neck"];
const LOWER_BODY_FIELDS = ["thigh", "inseam", "ankleCircumference"];
const LENGTH_FIELDS = ["dressLength", "frontLength", "backLength"];
const META_FIELDS = ["id", "clientId", "client", "createdAt", "updatedAt", "disclaimerSignedAt", "updatedById", "updatedByRole", "notes", "customParams"];

const staggerContainer = { show: { transition: { staggerChildren: 0.08 } } };
const staggerItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function AdminMeasurementDetailPage() {
    const { clientId } = useParams();
    const [showHistory, setShowHistory] = useState(false);
    const [exporting, setExporting] = useState(null);
    const [showFormModal, setShowFormModal] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-measurement-detail", clientId],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${clientId}`);
            return data.data;
        },
    });

    const { data: history } = useQuery({
        queryKey: ["admin-measurement-history", clientId],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${clientId}/history`);
            return data.data?.history || data.data || [];
        },
        enabled: showHistory,
    });

    const client = data?.client;
    const measurement = data?.measurement;
    const historyList = Array.isArray(history) ? history : [];

    const handleExport = async (format) => {
        setExporting(format);
        try {
            const response = await api.get(`/measurements/export?clientId=${clientId}&format=${format}`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `measurements-${client?.fullName || clientId}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setExporting(null);
        }
    };

    // Group measurements
    const upperBody = [];
    const lowerBody = [];
    const lengthFields = [];
    const otherFields = [];

    if (measurement) {
        Object.entries(measurement).forEach(([key, val]) => {
            if (META_FIELDS.includes(key) || val === null || val === undefined || typeof val === "object") return;
            const item = { key, val };
            if (UPPER_BODY_FIELDS.includes(key)) upperBody.push(item);
            else if (LOWER_BODY_FIELDS.includes(key)) lowerBody.push(item);
            else if (LENGTH_FIELDS.includes(key)) lengthFields.push(item);
            else otherFields.push(item);
        });
    }

    const customParams = measurement?.customParams;
    const hasCustom = customParams && typeof customParams === "object" && Object.keys(customParams).length > 0;

    if (isLoading) {
        return (
            <PageTransition>
                <div className="pb-20 lg:pb-0">
                    <SkeletonLine width="120px" height="14px" className="mb-6 rounded" />
                    <div className="flex items-center gap-3 mb-6">
                        <div className="skeleton w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                            <SkeletonLine width="160px" height="20px" className="rounded" />
                            <SkeletonLine width="200px" height="12px" className="rounded" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <SkeletonCard className="h-[200px]" />
                        <SkeletonCard className="h-[200px]" />
                    </div>
                </div>
            </PageTransition>
        );
    }

    return (
        <PageTransition>
            <div className="pb-20 lg:pb-0">
                <Link href="/admin/measurements" className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#C2185B] mb-6 transition-colors">
                    <ArrowLeft size={14} /> All Measurements
                </Link>

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                        <div className="relative w-14 h-14 rounded-full bg-[#C2185B] flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
                            {client?.profilePicture ? (
                                <Image
                                    src={client.profilePicture}
                                    alt={client.fullName || "Client"}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                />
                            ) : (
                                client?.fullName?.charAt(0) || "?"
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#0D0D0D]">{client?.fullName}</h1>
                            <p className="text-xs text-[#999]">{client?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {measurement && (
                            <Button
                                onClick={() => setShowFormModal(true)}
                                className="h-9 text-xs gap-1.5 bg-[#C2185B] text-white hover:bg-[#A01548]"
                            >
                                <Edit3 size={14} /> Edit Measurements
                            </Button>
                        )}
                        <Button
                            onClick={() => handleExport("csv")}
                            disabled={!!exporting || !measurement}
                            variant="outline"
                            className="h-9 text-xs gap-1.5 border-[#E0E0E0] text-[#555] hover:bg-[#FAFAFA]"
                        >
                            <Download size={14} /> {exporting === "csv" ? "..." : "CSV"}
                        </Button>
                        <Button
                            onClick={() => handleExport("pdf")}
                            disabled={!!exporting || !measurement}
                            variant="outline"
                            className="h-9 text-xs gap-1.5 border-[#E0E0E0] text-[#555] hover:bg-[#FAFAFA]"
                        >
                            <FileText size={14} /> {exporting === "pdf" ? "..." : "PDF"}
                        </Button>
                    </div>
                </div>

                {!measurement ? (
                    <EmptyState
                        icon={Ruler}
                        title="No measurements recorded"
                        description="This client doesn't have any measurements on file yet. Create an initial measurement record."
                        action={
                            <Button
                                onClick={() => setShowFormModal(true)}
                                className="h-10 px-6 bg-[#C2185B] text-white hover:bg-[#A01548] gap-2"
                            >
                                <Plus size={14} /> Create Measurements
                            </Button>
                        }
                    />
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={staggerContainer}
                        className="space-y-4"
                    >
                        {/* Last updated */}
                        <motion.div variants={staggerItem} className="flex items-center gap-2 text-xs text-[#999]">
                            <span>Last updated: {new Date(measurement.updatedAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</span>
                            {measurement.updatedByRole && <span>• by {measurement.updatedByRole === "CLIENT" ? "Client" : "Admin"}</span>}
                        </motion.div>

                        {/* Upper Body */}
                        {upperBody.length > 0 && (
                            <motion.div variants={staggerItem}>
                                <MeasurementSection title="Upper Body" items={upperBody} />
                            </motion.div>
                        )}

                        {/* Lower Body */}
                        {lowerBody.length > 0 && (
                            <motion.div variants={staggerItem}>
                                <MeasurementSection title="Lower Body" items={lowerBody} />
                            </motion.div>
                        )}

                        {/* Length */}
                        {lengthFields.length > 0 && (
                            <motion.div variants={staggerItem}>
                                <MeasurementSection title="Length" items={lengthFields} />
                            </motion.div>
                        )}

                        {/* Other fields */}
                        {otherFields.length > 0 && (
                            <motion.div variants={staggerItem}>
                                <MeasurementSection title="Other" items={otherFields} />
                            </motion.div>
                        )}

                        {/* Custom measurements */}
                        {hasCustom && (
                            <motion.div variants={staggerItem}>
                                <MeasurementSection
                                    title="Custom Measurements"
                                    items={Object.entries(customParams)
                                        .filter(([, v]) => v !== null && v !== undefined)
                                        .map(([key, val]) => ({ key, val }))}
                                />
                            </motion.div>
                        )}

                        {/* Notes */}
                        {measurement.notes && (
                            <motion.div variants={staggerItem} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Notes</h3>
                                <p className="text-sm text-[#555] whitespace-pre-wrap">{measurement.notes}</p>
                            </motion.div>
                        )}

                        {/* History toggle */}
                        <motion.div variants={staggerItem}>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 text-sm font-medium text-[#C2185B] hover:underline transition-colors"
                            >
                                <History size={14} />
                                {showHistory ? "Hide" : "Show"} Measurement History
                                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </motion.div>

                        {/* History with animation */}
                        <AnimatePresence>
                            {showHistory && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                                    className="overflow-hidden"
                                >
                                    <div className="space-y-3 pt-1">
                                        {historyList.length === 0 ? (
                                            <p className="text-sm text-[#999] px-1">No changes recorded.</p>
                                        ) : (
                                            historyList.map((entry, idx) => (
                                                <motion.div
                                                    key={entry.id}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05, duration: 0.25 }}
                                                    className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="text-xs text-[#999]">
                                                            <span className="font-medium text-[#555]">{entry.updatedByName || (entry.updatedByRole === "CLIENT" ? "Client" : "Admin")}</span>
                                                            <span> • {new Date(entry.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                                                        </div>
                                                    </div>
                                                    {entry.changedFields && typeof entry.changedFields === "object" && (
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {Object.entries(entry.changedFields).flatMap(([field, change]) => {
                                                                // customParams is a nested dict: { rise: { from, to }, calf: { from, to } }
                                                                if (field === "customParams" && typeof change === "object" && !("from" in change)) {
                                                                    return Object.entries(change).map(([cpKey, cpChange]) => (
                                                                        <div key={`cp-${cpKey}`} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[#F4F0F8]">
                                                                            <span className="text-[#999] capitalize">{cpKey} (custom):</span>
                                                                            <span className="text-[#C62828] line-through">{cpChange.from ?? "—"}</span>
                                                                            <span className="text-[#0D0D0D]">→</span>
                                                                            <span className="text-[#2E7D32] font-medium">{cpChange.to ?? "—"}</span>
                                                                        </div>
                                                                    ));
                                                                }
                                                                // Standard field: { from, to }
                                                                if (typeof change !== "object" || !("from" in change)) return [];
                                                                return [
                                                                    <div key={field} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[#F4F0F8]">
                                                                        <span className="text-[#999] capitalize">{field.replace(/([A-Z])/g, " $1").trim()}:</span>
                                                                        <span className="text-[#C62828] line-through">{change.from ?? "—"}</span>
                                                                        <span className="text-[#0D0D0D]">→</span>
                                                                        <span className="text-[#2E7D32] font-medium">{change.to ?? "—"}</span>
                                                                    </div>
                                                                ];
                                                            })}
                                                        </div>
                                                    )}
                                                    {entry.notes && (
                                                        <p className="text-xs text-[#555] mt-2 italic">&quot;{entry.notes}&quot;</p>
                                                    )}
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Measurement Form Modal (Create / Edit) */}
                <MeasurementFormModal
                    open={showFormModal}
                    onClose={() => setShowFormModal(false)}
                    clientId={clientId}
                    existingMeasurement={measurement || null}
                />
            </div>
        </PageTransition>
    );
}

function MeasurementSection({ title, items }) {
    return (
        <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map(({ key, val }) => (
                    <div key={key} className="p-3 rounded-lg bg-[#F4F0F8] hover:bg-[#EDE7F6] transition-colors duration-200">
                        <p className="text-xs text-[#999] capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                        <p className="text-lg font-bold text-[#0D0D0D]">
                            {val} {typeof val === "number" ? <span className="text-xs font-normal text-[#999]">cm</span> : null}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
