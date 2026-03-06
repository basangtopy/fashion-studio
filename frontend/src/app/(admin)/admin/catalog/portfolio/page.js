"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, Pencil, Trash2, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { SkeletonCard } from "@/components/shared/Skeleton";

export default function AdminPortfolioPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: "", description: "", category: "" });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-portfolio", search],
        queryFn: async () => {
            const params = {};
            if (search) params.search = search;
            const { data } = await api.get("/portfolio", { params });
            return data.data?.portfolioEntries || data.data?.items || data.data || [];
        },
    });

    const createEntry = useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post("/portfolio", payload);
            return data;
        },
        onSuccess: () => {
            toast.success("Portfolio entry created");
            queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
            setShowModal(false);
            setForm({ title: "", description: "", category: "" });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to create"),
    });

    const entries = Array.isArray(data) ? data : [];

    const handleCreate = (e) => {
        e.preventDefault();
        createEntry.mutate(form);
    };

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Portfolio</h1>
                    <p className="text-sm text-[#999]">{entries.length} entries</p>
                </div>
                <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors">
                    <Plus size={16} /> Add Entry
                </button>
            </div>

            <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <input type="text" placeholder="Search portfolio..." value={search} onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-10 pl-9 pr-4 text-sm border border-[#E0E0E0] rounded-md focus:border-[#C2185B] outline-none bg-white" />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-[240px]" />)}
                </div>
            ) : entries.length === 0 ? (
                <div className="p-12 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <ImageIcon size={28} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No portfolio entries yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {entries.map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden group">
                            <div className="relative h-48 bg-gradient-to-br from-[#C2185B]/10 to-[#F4F0F8]">
                                {entry.images?.[0] ? (
                                    <Image src={entry.images[0]} alt={entry.title} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageIcon size={28} className="text-[#999]" />
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-semibold text-[#0D0D0D] mb-1">{entry.title}</p>
                                <p className="text-xs text-[#999] mb-2 line-clamp-2">{entry.description || "No description"}</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F0F8] text-[#555]">{entry.category || "General"}</span>
                                    <div className="flex gap-1">
                                        <button className="w-7 h-7 rounded-md bg-[#F4F0F8] flex items-center justify-center text-[#555] hover:bg-[#E0E0E0] transition-colors">
                                            <Pencil size={12} />
                                        </button>
                                        <button className="w-7 h-7 rounded-md bg-[#FFEBEE] flex items-center justify-center text-[#C62828] hover:bg-[#FFCDD2] transition-colors">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
                    <div className="w-full max-w-md bg-white rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-[#0D0D0D] mb-4">New Portfolio Entry</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full h-10 px-3 text-sm border border-[#E0E0E0] rounded-md focus:border-[#C2185B] outline-none" />
                            <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full h-20 px-3 py-2 text-sm border border-[#E0E0E0] rounded-md focus:border-[#C2185B] outline-none resize-none" />
                            <input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full h-10 px-3 text-sm border border-[#E0E0E0] rounded-md focus:border-[#C2185B] outline-none" />
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 border border-[#E0E0E0] rounded-md text-sm text-[#555] hover:bg-[#FAFAFA] transition-colors">Cancel</button>
                                <button type="submit" disabled={createEntry.isPending} className="flex-1 py-2 bg-[#C2185B] text-white rounded-md text-sm font-semibold hover:bg-[#A01548] transition-colors disabled:opacity-60">Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
