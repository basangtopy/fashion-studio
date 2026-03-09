"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users, ChevronRight, ChevronLeft, Plus, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/config/branding";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import CreateClientModal from "@/components/admin/CreateClientModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import useDebounce from "@/hooks/useDebounce";

export default function AdminClientsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const limit = 20;

    const debouncedSearch = useDebounce(search, 500);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-clients", debouncedSearch, page],
        queryFn: async () => {
            const params = { page, limit };
            if (debouncedSearch) params.search = debouncedSearch;
            const { data } = await api.get("/users/admin/clients", { params });
            return data.data || {};
        },
    });

    const clients = Array.isArray(data?.clients) ? data.clients : [];
    const totalPages = data?.totalPages || 1;
    const total = data?.total || clients.length;

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Clients</h1>
                    <p className="text-sm text-[#999]">{total} clients</p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5 h-9">
                    <Plus size={14} /> Add Client
                </Button>
            </div>

            {/* Search — prominent, full-width */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search by name, email, phone..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10 h-11 bg-white text-sm" />
            </div>

            {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} className="h-[72px]" />)}</div>
            ) : clients.length === 0 ? (
                <EmptyState icon={Users} title="No clients found" description={search ? "Try adjusting your search." : "No clients yet."} />
            ) : (
                <>
                    {/* Client Cards Grid — 2 cols desktop, 1 on mobile per spec */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {clients.map((c) => {
                            const initial = c.fullName?.charAt(0) || "?";
                            // Color-code avatar by first letter
                            const hue = ((initial.charCodeAt(0) - 65) * 27) % 360;
                            const avatarColor = `hsl(${hue}, 50%, 40%)`;
                            const totalPaid = c.totalPaid || c._count?.payments || 0;

                            // Relative time for last active
                            const lastActive = c.updatedAt ? (() => {
                                const d = new Date(c.updatedAt);
                                const now = new Date();
                                const seconds = Math.floor((now - d) / 1000);
                                if (seconds < 60) return "just now";
                                const minutes = Math.floor(seconds / 60);
                                if (minutes < 60) return `${minutes}m ago`;
                                const hours = Math.floor(minutes / 60);
                                if (hours < 24) return `${hours}h ago`;
                                const days = Math.floor(hours / 24);
                                if (days < 7) return `${days}d ago`;
                                return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
                            })() : null;

                            return (
                                <div key={c.id} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-all group">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="relative shrink-0">
                                            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden"
                                                style={{ backgroundColor: avatarColor }}>
                                                {c.profilePicture ? (
                                                    <img src={c.profilePicture} alt="" className="w-full h-full object-cover" />
                                                ) : initial}
                                            </div>
                                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${c.online ? "bg-[#2E7D32]" : "bg-[#E0E0E0]"}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#0D0D0D] truncate">{c.fullName}</p>
                                            <p className="text-xs text-[#555] truncate">{c.email}</p>
                                            {c.phone && <p className="text-xs text-[#999]">{c.phone}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <p className="text-lg font-bold font-mono-data text-[#0D0D0D]">{c._count?.orders || 0}</p>
                                                <p className="text-[9px] text-[#999] uppercase tracking-wider">Orders</p>
                                            </div>
                                            {typeof totalPaid === "number" && totalPaid > 0 && (
                                                <div>
                                                    <p className="text-lg font-bold font-mono-data text-[#0D0D0D]">{formatCurrency(totalPaid)}</p>
                                                    <p className="text-[9px] text-[#999] uppercase tracking-wider">Total Paid</p>
                                                </div>
                                            )}
                                        </div>
                                        {c.online ? (
                                            <span className="text-[10px] text-[#2E7D32] font-medium">Online now</span>
                                        ) : lastActive ? (
                                            <span className="text-[10px] text-[#999]">Active {lastActive}</span>
                                        ) : null}
                                    </div>
                                    <Link href={`/admin/clients/${c.id}`}
                                        className="block w-full text-center py-2 rounded-lg bg-[#C2185B]/5 text-[#C2185B] text-xs font-semibold hover:bg-[#C2185B]/10 transition-colors">
                                        View Profile
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 mt-6">
                            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="gap-1 text-[#555]">
                                <ChevronLeft size={14} /> Prev
                            </Button>
                            <span className="text-xs text-[#999]">Page {page} of {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="gap-1 text-[#555]">
                                Next <ChevronRight size={14} />
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Create Client Modal */}
            <CreateClientModal open={createOpen} onClose={() => setCreateOpen(false)} />
        </div>
    );
}
