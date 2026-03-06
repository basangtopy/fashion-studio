"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Users, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import CreateClientModal from "@/components/admin/CreateClientModal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminClientsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [createOpen, setCreateOpen] = useState(false);
    const limit = 20;

    const { data, isLoading } = useQuery({
        queryKey: ["admin-clients", search, page],
        queryFn: async () => {
            const params = { page, limit };
            if (search) params.search = search;
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

            {/* Search */}
            <div className="relative mb-6 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search by name, email, phone..." value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-8 h-9 bg-white" />
            </div>

            {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map((i) => <SkeletonCard key={i} className="h-[72px]" />)}</div>
            ) : clients.length === 0 ? (
                <EmptyState icon={Users} title="No clients found" description={search ? "Try adjusting your search." : "No clients yet."} />
            ) : (
                <>
                    {/* Mobile: Cards */}
                    <div className="grid grid-cols-1 gap-3 lg:hidden">
                        {clients.map((c) => (
                            <Link key={c.id} href={`/admin/clients/${c.id}`}
                                className="flex items-center gap-3 p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors">
                                <div className="relative shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white text-sm font-bold">
                                        {c.fullName?.charAt(0)}
                                    </div>
                                    {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#2E7D32] border-2 border-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-[#0D0D0D] truncate">{c.fullName}</p>
                                    <p className="text-[10px] text-[#999] truncate">{c.email}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] text-[#555]">{c._count?.orders || 0} orders</span>
                                        {c.phone && <span className="text-[10px] text-[#999]">{c.phone}</span>}
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-[#D0D0D0] shrink-0" />
                            </Link>
                        ))}
                    </div>

                    {/* Desktop: Table */}
                    <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden hidden lg:block">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#999]">Client</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#999]">Email</th>
                                    <th className="text-left py-3 px-4 text-xs font-medium text-[#999]">Phone</th>
                                    <th className="text-center py-3 px-4 text-xs font-medium text-[#999]">Orders</th>
                                    <th className="text-center py-3 px-4 text-xs font-medium text-[#999]">Status</th>
                                    <th className="text-right py-3 px-4 text-xs font-medium text-[#999]">Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((c) => (
                                    <tr key={c.id} onClick={() => router.push(`/admin/clients/${c.id}`)}
                                        className="border-b border-[rgba(0,0,0,0.04)] hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5">
                                                <div className="relative shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs">
                                                        {c.fullName?.charAt(0)}
                                                    </div>
                                                    {c.online && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2E7D32] border-2 border-white" />}
                                                </div>
                                                <span className="font-medium text-[#0D0D0D]">{c.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-[#555]">{c.email}</td>
                                        <td className="py-3 px-4 text-[#555]">{c.phone || "—"}</td>
                                        <td className="py-3 px-4 text-center font-mono-data">{c._count?.orders || 0}</td>
                                        <td className="py-3 px-4 text-center">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.online ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#F4F0F8] text-[#999]"}`}>
                                                {c.online ? "Online" : "Offline"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right text-xs text-[#999]">{new Date(c.createdAt).toLocaleDateString("en-NG")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
