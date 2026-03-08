"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, X, Save, ImageIcon, Star, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AdminPortfolioPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // "all" | "published" | "draft"
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [form, setForm] = useState({
        title: "", description: "", category: "", orderId: "",
        clientConsent: false, isFeatured: false, isPublished: false,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-portfolio", search],
        queryFn: async () => {
            const params = {};
            if (search) params.search = search;
            const { data } = await api.get("/portfolio", { params });
            return data.data?.portfolioEntries || data.data?.items || data.data || [];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            if (editEntry) {
                const { data } = await api.put(`/portfolio/${editEntry.id}`, payload);
                return data;
            }
            const { data } = await api.post("/portfolio", payload);
            return data;
        },
        onSuccess: () => {
            toast.success(editEntry ? "Entry updated!" : "Entry created!");
            closeForm();
            queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => { await api.delete(`/portfolio/${id}`); },
        onSuccess: () => {
            toast.success("Entry deleted");
            queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to delete."),
    });

    const toggleFeatured = useMutation({
        mutationFn: async ({ id, isFeatured }) => {
            const { data } = await api.put(`/portfolio/${id}`, { isFeatured });
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] }),
    });

    const allEntries = Array.isArray(data) ? data : [];
    const categories = [...new Set(allEntries.map(e => e.category).filter(Boolean))];

    const filteredEntries = allEntries.filter(e => {
        if (filterCategory && e.category !== filterCategory) return false;
        if (filterStatus === "published" && !e.isPublished) return false;
        if (filterStatus === "draft" && e.isPublished) return false;
        return true;
    });

    const openCreate = () => {
        setEditEntry(null);
        setForm({ title: "", description: "", category: "", orderId: "", clientConsent: false, isFeatured: false, isPublished: false });
        setShowForm(true);
    };

    const openEdit = (entry) => {
        setEditEntry(entry);
        setForm({
            title: entry.title || "", description: entry.description || "",
            category: entry.category || "", orderId: entry.orderId || "",
            clientConsent: entry.clientConsent ?? false, isFeatured: entry.isFeatured ?? false,
            isPublished: entry.isPublished ?? false,
        });
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditEntry(null); };

    const activeFilters = [filterCategory, filterStatus !== "all" ? filterStatus : ""].filter(Boolean).length;

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Portfolio</h1>
                    <p className="text-sm text-[#999]">{filteredEntries.length} of {allEntries.length} entries</p>
                </div>
                <Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5">
                    <Plus size={14} /> Add Entry
                </Button>
            </div>

            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search portfolio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-white text-sm" />
            </div>

            <button onClick={() => setShowMobileFilter(!showMobileFilter)}
                className="lg:hidden mb-4 flex items-center gap-1.5 text-xs font-semibold text-[#C2185B]">
                <Filter size={14} /> Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>

            <div className="flex gap-6">
                {/* Filter Sidebar */}
                <div className={`${showMobileFilter ? "block" : "hidden"} lg:block w-full lg:w-[220px] shrink-0`}>
                    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white space-y-5 lg:sticky lg:top-[72px]">
                        <div>
                            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Category</p>
                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full h-9 px-2 text-sm border border-[rgba(0,0,0,0.08)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C2185B]/20">
                                <option value="">All</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Status</p>
                            <div className="flex gap-1">
                                {[{ v: "all", l: "All" }, { v: "published", l: "Published" }, { v: "draft", l: "Drafts" }].map(opt => (
                                    <button key={opt.v} onClick={() => setFilterStatus(opt.v)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterStatus === opt.v ? "bg-[#C2185B] text-white" : "bg-[#F4F0F8] text-[#555] hover:bg-[#E0E0E0]"}`}>
                                        {opt.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {activeFilters > 0 && (
                            <button onClick={() => { setFilterCategory(""); setFilterStatus("all"); }}
                                className="text-xs text-[#C2185B] font-semibold hover:underline">Clear filters</button>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 min-w-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} className="h-[280px]" />)}
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <EmptyState icon={ImageIcon} title="No portfolio entries found" description="Try adjusting filters or add a new entry."
                            action={<Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548]">Add Entry</Button>} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredEntries.map((entry) => (
                                <div key={entry.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden group relative">
                                    <div className="relative h-52 bg-gradient-to-br from-[#C2185B]/10 to-[#F4F0F8]">
                                        {entry.images?.[0] ? (
                                            <Image src={entry.images[0]} alt={entry.title} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon size={28} className="text-[#999]" />
                                            </div>
                                        )}

                                        {/* DRAFT watermark overlay */}
                                        {!entry.isPublished && (
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                                                <span className="text-white/70 text-3xl font-black tracking-[0.3em] rotate-[-15deg] select-none">DRAFT</span>
                                            </div>
                                        )}

                                        {/* Hover controls */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-[2]">
                                            <button onClick={() => openEdit(entry)}
                                                className="h-9 px-3 rounded-lg bg-white text-[#0D0D0D] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F0F8] transition-colors">
                                                <Pencil size={13} /> Edit
                                            </button>
                                            <button onClick={() => deleteMutation.mutate(entry.id)}
                                                className="h-9 px-3 rounded-lg bg-[#FFEBEE] text-[#C62828] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FFCDD2] transition-colors">
                                                <Trash2 size={13} /> Delete
                                            </button>
                                        </div>

                                        {/* Featured badge */}
                                        {entry.isFeatured && (
                                            <div className="absolute top-2 left-2 bg-[#FF6F00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-[1]">
                                                <Star size={10} fill="currentColor" /> FEATURED
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-sm font-semibold text-[#0D0D0D] truncate">{entry.title}</p>
                                            <button onClick={() => toggleFeatured.mutate({ id: entry.id, isFeatured: !entry.isFeatured })}
                                                className={`shrink-0 ${entry.isFeatured ? "text-[#FF6F00]" : "text-[#E0E0E0] hover:text-[#FF6F00]"} transition-colors`}>
                                                <Star size={14} fill={entry.isFeatured ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#999] mb-2 line-clamp-2">{entry.description || "No description"}</p>
                                        <div className="flex items-center gap-1.5">
                                            {entry.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F0F8] text-[#555]">{entry.category}</span>}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${entry.isPublished ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}>
                                                {entry.isPublished ? "Published" : "Draft"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeForm}>
                        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-[#0D0D0D]">{editEntry ? "Edit Portfolio Entry" : "New Portfolio Entry"}</h3>
                                <button onClick={closeForm}><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Title *</label>
                                    <Input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-10 bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Category</label>
                                    <Input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        placeholder="e.g. Ankara, Wedding" className="h-10 bg-white" list="portfolio-cat-suggestions" />
                                    <datalist id="portfolio-cat-suggestions">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Description</label>
                                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="resize-none bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Order ID (optional — link to completed order)</label>
                                    <Input type="text" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
                                        placeholder="Paste order ID or leave blank" className="h-10 bg-white" />
                                    <p className="text-[10px] text-[#999] mt-1">Standalone works can leave this blank.</p>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-3 pt-1">
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                        <input type="checkbox" checked={form.clientConsent} onChange={(e) => setForm({ ...form, clientConsent: e.target.checked })}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0]" />
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Client Consent</p>
                                            <p className="text-[10px] text-[#999]">Must be ON to publish this entry</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg border transition-colors ${!form.clientConsent ? "border-[rgba(0,0,0,0.04)] bg-[#FAFAFA] opacity-60 pointer-events-none" : "border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA]"}`}>
                                        <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                                            disabled={!form.clientConsent}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0]" />
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Published</p>
                                            <p className="text-[10px] text-[#999]">Visible to the public</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                        <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0]" />
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Featured</p>
                                            <p className="text-[10px] text-[#999]">Show on homepage showcase</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.title || saveMutation.isPending}
                                className="w-full mt-5 bg-[#C2185B] text-white hover:bg-[#A01548] h-10 gap-2">
                                <Save size={14} /> {saveMutation.isPending ? "Saving..." : editEntry ? "Save Changes" : "Create Entry"}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
