"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Ruler, Download, ChevronRight, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";

const KEY_FIELDS = ["bust", "waist", "hips", "shoulder", "sleeveLength", "fullLength"];

export default function AdminMeasurementsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [exporting, setExporting] = useState(null);

    const { data: clients, isLoading } = useQuery({
        queryKey: ["admin-clients-measurements", search],
        queryFn: async () => {
            const params = { limit: 100 };
            if (search) params.search = search;
            const { data } = await api.get("/users/admin/clients", { params });
            return data.data?.clients || [];
        },
    });

    const { data: measurementsMap } = useQuery({
        queryKey: ["admin-measurements-all", clients?.map((c) => c.id).join(",")],
        queryFn: async () => {
            const map = {};
            await Promise.all(
                clients.map(async (client) => {
                    try {
                        const { data } = await api.get(`/measurements/${client.id}`);
                        map[client.id] = data.data?.measurement || null;
                    } catch {
                        map[client.id] = null;
                    }
                })
            );
            return map;
        },
        enabled: !!clients?.length,
    });

    const clientList = Array.isArray(clients) ? clients : [];
    const clientsWithMeasurements = clientList.filter(
        (c) => measurementsMap && measurementsMap[c.id]
    );

    const handleExport = async (format) => {
        setExporting(format);
        try {
            const response = await api.get(`/measurements/export?format=${format}`, {
                responseType: "blob",
            });
            const blob = new Blob([response.data]);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `measurements-${new Date().toISOString().split("T")[0]}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export failed:", err);
        } finally {
            setExporting(null);
        }
    };

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Measurements</h1>
                    <p className="text-sm text-[#999]">{clientsWithMeasurements.length} clients with measurements</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => handleExport("csv")}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#E0E0E0] text-xs font-medium text-[#555] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                    >
                        <Download size={14} /> {exporting === "csv" ? "..." : "CSV"}
                    </button>
                    <button
                        onClick={() => handleExport("pdf")}
                        disabled={exporting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-md border border-[#E0E0E0] text-xs font-medium text-[#555] hover:bg-[#FAFAFA] transition-colors disabled:opacity-50"
                    >
                        <FileText size={14} /> {exporting === "pdf" ? "..." : "PDF"}
                    </button>
                </div>
            </div>

            <div className="relative mb-6 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input type="text" placeholder="Search clients..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-9 pl-8 pr-4 text-sm border border-[#E0E0E0] rounded-md focus:border-[#C2185B] outline-none bg-white" />
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} className="h-[80px]" />)}
                </div>
            ) : clientsWithMeasurements.length === 0 ? (
                <EmptyState icon={Ruler} title="No measurements found" description={search ? "Try adjusting your search." : "No clients have measurements recorded yet."} />
            ) : (
                <>
                    {/* Mobile: Card layout */}
                    <div className="grid grid-cols-1 gap-3 lg:hidden">
                        {clientsWithMeasurements.map((c) => {
                            const m = measurementsMap[c.id] || {};
                            return (
                                <Link
                                    key={c.id}
                                    href={`/admin/measurements/${c.id}`}
                                    className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white text-sm font-bold shrink-0">
                                        {c.fullName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-[#0D0D0D] truncate">{c.fullName}</p>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                            {KEY_FIELDS.slice(0, 3).map((f) => m[f] ? (
                                                <span key={f} className="text-[10px] text-[#999]">
                                                    <span className="capitalize">{f.replace(/([A-Z])/g, " $1").trim()}</span>: <span className="font-mono text-[#0D0D0D] font-medium">{m[f]}</span>
                                                </span>
                                            ) : null)}
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-[#D0D0D0] shrink-0" />
                                </Link>
                            );
                        })}
                    </div>

                    {/* Desktop: Table layout */}
                    <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden hidden lg:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-[#999] uppercase">Client</th>
                                    {KEY_FIELDS.map((f) => (
                                        <th key={f} className="text-center py-3 px-2 text-xs font-semibold text-[#999] uppercase whitespace-nowrap">
                                            {f.replace(/([A-Z])/g, " $1").trim()}
                                        </th>
                                    ))}
                                    <th className="text-center py-3 px-2 text-xs font-semibold text-[#999] uppercase">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientsWithMeasurements.map((c) => {
                                    const m = measurementsMap[c.id] || {};
                                    return (
                                        <tr
                                            key={c.id}
                                            onClick={() => router.push(`/admin/measurements/${c.id}`)}
                                            className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                                                        {c.fullName?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-[#0D0D0D] whitespace-nowrap">{c.fullName}</p>
                                                        <p className="text-[10px] text-[#999]">{c.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {KEY_FIELDS.map((f) => (
                                                <td key={f} className="text-center py-3 px-2 text-[#0D0D0D] font-mono text-xs">
                                                    {m[f] ? `${m[f]}` : <span className="text-[#E0E0E0]">—</span>}
                                                </td>
                                            ))}
                                            <td className="text-center py-3 px-2 text-xs text-[#999]">
                                                {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString("en-NG") : "—"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
