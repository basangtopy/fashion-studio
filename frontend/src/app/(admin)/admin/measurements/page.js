"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, Ruler, Download, ChevronRight, FileText, Loader2 } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
import { SkeletonTable } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import PageTransition from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/button";

/* All measurement fields from the Prisma schema */
const ALL_FIELDS = [
    { key: "bust", label: "Bust" },
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
    { key: "shoulderWidth", label: "Shoulder" },
    { key: "sleeveLength", label: "Sleeve" },
    { key: "dressLength", label: "Dress Len" },
    { key: "neck", label: "Neck" },
    { key: "armLength", label: "Arm Len" },
    { key: "armCircumference", label: "Arm Circ" },
    { key: "backLength", label: "Back Len" },
    { key: "frontLength", label: "Front Len" },
    { key: "thigh", label: "Thigh" },
    { key: "inseam", label: "Inseam" },
    { key: "wristCircumference", label: "Wrist" },
    { key: "ankleCircumference", label: "Ankle" },
];

/* Subset for mobile cards */
const KEY_FIELDS_MOBILE = ALL_FIELDS.slice(0, 4);

const staggerItem = {
    hidden: { opacity: 0, y: 6 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.25, delay: i * 0.04 },
    }),
};

export default function AdminMeasurementsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [exporting, setExporting] = useState(null);

    const debouncedSearch = useDebounce(search, 500);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["admin-measurements", debouncedSearch],
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: 12 };
            if (debouncedSearch) params.search = debouncedSearch;
            const res = await api.get("/measurements", { params });
            return res.data.data;
        },
        getNextPageParam: (lastPage) => {
            if (!lastPage?.pagination) return undefined;
            const { page, pages } = lastPage.pagination;
            return page < pages ? page + 1 : undefined;
        },
        initialPageParam: 1,
    });

    const measurements = data?.pages?.flatMap((p) => p?.measurements || []) || [];
    const totalCount = data?.pages?.[0]?.pagination?.total || 0;

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
        <PageTransition>
            <div className="pb-20 lg:pb-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D0D0D]">Measurements</h1>
                        <p className="text-sm text-[#999]">{totalCount} clients with measurements</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => handleExport("csv")}
                            disabled={!!exporting}
                            variant="outline"
                            className="h-9 text-xs gap-1.5 border-[#E0E0E0] text-[#555] hover:bg-[#FAFAFA]"
                        >
                            <Download size={14} /> {exporting === "csv" ? "..." : "CSV"}
                        </Button>
                        <Button
                            onClick={() => handleExport("pdf")}
                            disabled={!!exporting}
                            variant="outline"
                            className="h-9 text-xs gap-1.5 border-[#E0E0E0] text-[#555] hover:bg-[#FAFAFA]"
                        >
                            <FileText size={14} /> {exporting === "pdf" ? "..." : "PDF"}
                        </Button>
                    </div>
                </div>

                <div className="relative mb-6 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-4 text-sm border border-[#E0E0E0] rounded-md focus:border-[#C2185B] focus:ring-2 focus:ring-[#C2185B]/20 outline-none bg-white transition-all duration-200"
                    />
                </div>

                {isLoading ? (
                    <SkeletonTable rows={6} cols={8} />
                ) : measurements.length === 0 ? (
                    <EmptyState
                        icon={Ruler}
                        title="No measurements found"
                        description={search ? "Try adjusting your search query." : "No clients have measurements recorded yet."}
                    />
                ) : (
                    <>
                        {/* Mobile: Card layout */}
                        <div className="grid grid-cols-1 gap-3 lg:hidden">
                            {measurements.map((m, i) => (
                                <motion.div
                                    key={m.id}
                                    initial="hidden"
                                    animate="show"
                                    custom={i}
                                    variants={staggerItem}
                                >
                                    <Link
                                        href={`/admin/measurements/${m.clientId}`}
                                        className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <div className="relative w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                                            {m.client?.profilePicture ? (
                                                <Image 
                                                    src={m.client.profilePicture} 
                                                    alt={m.client.fullName || "Client"} 
                                                    fill 
                                                    className="object-cover" 
                                                    sizes="40px" 
                                                />
                                            ) : (
                                                m.client?.fullName?.charAt(0) || "?"
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[#0D0D0D] truncate">{m.client?.fullName}</p>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                {KEY_FIELDS_MOBILE.map(({ key, label }) => m[key] != null ? (
                                                    <span key={key} className="text-[10px] text-[#999]">
                                                        {label}: <span className="font-mono text-[#0D0D0D] font-medium">{m[key]}</span>
                                                    </span>
                                                ) : null)}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-[#D0D0D0] shrink-0" />
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Desktop: Full table with ALL measurement columns */}
                        <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden hidden lg:block">
                            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-[#999] uppercase sticky left-0 bg-[#FAFAFA] z-10 min-w-[180px]">Client</th>
                                            {ALL_FIELDS.map(({ key, label }) => (
                                                <th key={key} className="text-center py-3 px-2 text-[10px] font-semibold text-[#999] uppercase whitespace-nowrap min-w-[60px]">
                                                    {label}
                                                </th>
                                            ))}
                                            <th className="text-center py-3 px-2 text-[10px] font-semibold text-[#999] uppercase min-w-[80px]">Updated</th>
                                            <th className="text-center py-3 px-2 text-[10px] font-semibold text-[#999] uppercase min-w-[60px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {measurements.map((m, i) => (
                                            <motion.tr
                                                key={m.id}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.25, delay: i * 0.04 }}
                                                className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAFA] transition-colors group"
                                            >
                                                <td className="py-3 px-4 sticky left-0 bg-white group-hover:bg-[#FAFAFA] transition-colors z-10">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="relative w-7 h-7 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-[10px] shrink-0 overflow-hidden">
                                                            {m.client?.profilePicture ? (
                                                                <Image 
                                                                    src={m.client.profilePicture} 
                                                                    alt={m.client.fullName || "Client"} 
                                                                    fill 
                                                                    className="object-cover" 
                                                                    sizes="28px" 
                                                                />
                                                            ) : (
                                                                m.client?.fullName?.charAt(0) || "?"
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-[#0D0D0D] whitespace-nowrap">{m.client?.fullName}</p>
                                                            <p className="text-[10px] text-[#999]">{m.client?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {ALL_FIELDS.map(({ key }) => (
                                                    <td key={key} className="text-center py-3 px-2 text-[#0D0D0D] font-mono text-xs">
                                                        {m[key] != null ? m[key] : <span className="text-[#E0E0E0]">—</span>}
                                                    </td>
                                                ))}
                                                <td className="text-center py-3 px-2 text-xs text-[#999] whitespace-nowrap">
                                                    {m.updatedAt ? new Date(m.updatedAt).toLocaleDateString("en-NG") : "—"}
                                                </td>
                                                <td className="text-center py-2 px-2">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => router.push(`/admin/measurements/${m.clientId}`)}
                                                            className="h-8 px-3 text-xs font-semibold text-[#C2185B] hover:text-[#A01548] hover:bg-[#C2185B]/10 gap-1"
                                                        >
                                                            View/Edit <ChevronRight size={14} />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Load More */}
                        {hasNextPage && (
                            <div className="flex justify-center mt-6">
                                <Button
                                    onClick={() => fetchNextPage()}
                                    disabled={isFetchingNextPage}
                                    variant="outline"
                                    className="h-10 px-6 text-sm font-medium border-[#E0E0E0] text-[#555] hover:border-[#C2185B] hover:text-[#C2185B] transition-all duration-200 gap-2"
                                >
                                    {isFetchingNextPage ? (
                                        <><Loader2 size={14} className="animate-spin" /> Loading...</>
                                    ) : (
                                        "Load More"
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </PageTransition>
    );
}
