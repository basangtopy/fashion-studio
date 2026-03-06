"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ruler, Download, FileText, History, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";

const UPPER_BODY_FIELDS = ["bust", "underBust", "shoulder", "sleeveLength", "armhole", "bicep", "wrist", "frontLength", "backLength", "neckToWaist", "acrossFront", "acrossBack"];
const LOWER_BODY_FIELDS = ["waist", "hips", "fullLength", "kneeLength", "thigh", "calf", "ankle", "inseam", "outseam", "crotchDepth"];
const META_FIELDS = ["id", "clientId", "client", "createdAt", "updatedAt", "disclaimerSignedAt", "updatedByRole", "notes", "customParams"];

export default function AdminMeasurementDetailPage() {
    const { clientId } = useParams();
    const [showHistory, setShowHistory] = useState(false);
    const [exporting, setExporting] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-measurement-detail", clientId],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${clientId}`);
            return data.data; // { client, measurement }
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
    const otherFields = [];

    if (measurement) {
        Object.entries(measurement).forEach(([key, val]) => {
            if (META_FIELDS.includes(key) || val === null || val === undefined || typeof val === "object") return;
            const item = { key, val };
            if (UPPER_BODY_FIELDS.includes(key)) upperBody.push(item);
            else if (LOWER_BODY_FIELDS.includes(key)) lowerBody.push(item);
            else otherFields.push(item);
        });
    }

    const customParams = measurement?.customParams;
    const hasCustom = customParams && typeof customParams === "object" && Object.keys(customParams).length > 0;

    if (isLoading) {
        return (
            <div className="pb-20 lg:pb-0">
                <div className="skeleton h-6 w-32 mb-6" />
                <SkeletonCard className="h-[400px]" />
            </div>
        );
    }

    return (
        <div className="pb-20 lg:pb-0">
            <Link href="/admin/measurements" className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#C2185B] mb-6 transition-colors">
                <ArrowLeft size={14} /> All Measurements
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-lg">
                        {client?.fullName?.charAt(0) || "?"}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#0D0D0D]">{client?.fullName}</h1>
                        <p className="text-xs text-[#999]">{client?.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExport("csv")}
                        disabled={!!exporting || !measurement}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#E0E0E0] text-xs font-medium text-[#555] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                    >
                        <Download size={14} /> {exporting === "csv" ? "..." : "CSV"}
                    </button>
                    <button
                        onClick={() => handleExport("pdf")}
                        disabled={!!exporting || !measurement}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#E0E0E0] text-xs font-medium text-[#555] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                    >
                        <FileText size={14} /> {exporting === "pdf" ? "..." : "PDF"}
                    </button>
                </div>
            </div>

            {!measurement ? (
                <div className="p-12 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <Ruler size={28} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No measurements recorded for this client.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Last updated */}
                    <div className="flex items-center gap-2 text-xs text-[#999]">
                        <span>Last updated: {new Date(measurement.updatedAt).toLocaleDateString("en-NG", { dateStyle: "long" })}</span>
                        {measurement.updatedByRole && <span>• by {measurement.updatedByRole === "CLIENT" ? "Client" : "Admin"}</span>}
                    </div>

                    {/* Upper Body */}
                    {upperBody.length > 0 && (
                        <MeasurementSection title="Upper Body" items={upperBody} />
                    )}

                    {/* Lower Body */}
                    {lowerBody.length > 0 && (
                        <MeasurementSection title="Lower Body" items={lowerBody} />
                    )}

                    {/* Other fields */}
                    {otherFields.length > 0 && (
                        <MeasurementSection title="Other" items={otherFields} />
                    )}

                    {/* Custom measurements */}
                    {hasCustom && (
                        <MeasurementSection
                            title="Custom Measurements"
                            items={Object.entries(customParams)
                                .filter(([, v]) => v !== null && v !== undefined)
                                .map(([key, val]) => ({ key, val }))}
                        />
                    )}

                    {/* Notes */}
                    {measurement.notes && (
                        <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Notes</h3>
                            <p className="text-sm text-[#555] whitespace-pre-wrap">{measurement.notes}</p>
                        </div>
                    )}

                    {/* History toggle */}
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center gap-2 text-sm font-medium text-[#C2185B] hover:underline"
                    >
                        <History size={14} />
                        {showHistory ? "Hide" : "Show"} Measurement History
                        {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* History */}
                    {showHistory && (
                        <div className="space-y-3">
                            {historyList.length === 0 ? (
                                <p className="text-sm text-[#999] px-1">No changes recorded.</p>
                            ) : (
                                historyList.map((entry) => (
                                    <div key={entry.id} className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-xs text-[#999]">
                                                <span className="font-medium text-[#555]">{entry.updatedByName || (entry.updatedByRole === "CLIENT" ? "Client" : "Admin")}</span>
                                                <span> • {new Date(entry.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                                            </div>
                                        </div>
                                        {entry.changedFields && typeof entry.changedFields === "object" && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {Object.entries(entry.changedFields).map(([field, change]) => (
                                                    <div key={field} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-[#F4F0F8]">
                                                        <span className="text-[#999] capitalize">{field.replace(/([A-Z])/g, " $1").trim()}:</span>
                                                        <span className="text-[#C62828] line-through">{change.from ?? "—"}</span>
                                                        <span className="text-[#0D0D0D]">→</span>
                                                        <span className="text-[#2E7D32] font-medium">{change.to ?? "—"}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {entry.notes && (
                                            <p className="text-xs text-[#555] mt-2 italic">&quot;{entry.notes}&quot;</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function MeasurementSection({ title, items }) {
    return (
        <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">{title}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {items.map(({ key, val }) => (
                    <div key={key} className="p-3 rounded-lg bg-[#F4F0F8]">
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
