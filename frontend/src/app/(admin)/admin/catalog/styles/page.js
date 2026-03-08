"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Archive, Eye, Search, X, Save, Star, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function AdminCatalogStylesPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editStyle, setEditStyle] = useState(null);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterModel, setFilterModel] = useState("");
    const [filterActive, setFilterActive] = useState("active"); // "active" | "archived" | "all"
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [formData, setFormData] = useState({
        name: "", description: "", category: "",
        availableForModel1: true, availableForModel2: true,
        isFeatured: false, isActive: true,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-styles", searchQuery],
        queryFn: async () => {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            const { data } = await api.get("/styles", { params });
            return data.data?.styles || data.data || [];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            if (editStyle) {
                const { data } = await api.put(`/styles/${editStyle.id}`, payload);
                return data;
            }
            const { data } = await api.post("/styles", payload);
            return data;
        },
        onSuccess: () => {
            toast.success(editStyle ? "Style updated!" : "Style created!");
            closeForm();
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const toggleArchive = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const { data } = await api.put(`/styles/${id}`, { isActive });
            return data;
        },
        onSuccess: () => {
            toast.success("Style updated");
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const toggleFeatured = useMutation({
        mutationFn: async ({ id, isFeatured }) => {
            const { data } = await api.put(`/styles/${id}`, { isFeatured });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
    });

    const allStyles = Array.isArray(data) ? data : [];

    // Get unique categories
    const categories = [...new Set(allStyles.map(s => s.category).filter(Boolean))];

    // Apply filters
    const filteredStyles = allStyles.filter(s => {
        if (filterCategory && s.category !== filterCategory) return false;
        if (filterModel === "model1" && !s.availableForModel1) return false;
        if (filterModel === "model2" && !s.availableForModel2) return false;
        if (filterActive === "active" && s.isActive === false) return false;
        if (filterActive === "archived" && s.isActive !== false) return false;
        return true;
    });

    const openCreate = () => {
        setEditStyle(null);
        setFormData({ name: "", description: "", category: "", availableForModel1: true, availableForModel2: true, isFeatured: false, isActive: true });
        setShowForm(true);
    };

    const openEdit = (style) => {
        setEditStyle(style);
        setFormData({
            name: style.name || "", description: style.description || "", category: style.category || "",
            availableForModel1: style.availableForModel1 ?? true, availableForModel2: style.availableForModel2 ?? true,
            isFeatured: style.isFeatured ?? false, isActive: style.isActive ?? true,
        });
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditStyle(null); };

    const activeFilters = [filterCategory, filterModel, filterActive !== "active" ? filterActive : ""].filter(Boolean).length;

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Styles Catalog</h1>
                    <p className="text-sm text-[#999]">{filteredStyles.length} of {allStyles.length} styles</p>
                </div>
                <Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5">
                    <Plus size={14} /> Add New Style
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search styles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-white text-sm" />
            </div>

            {/* Mobile filter toggle */}
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
                            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Model</p>
                            <select value={filterModel} onChange={(e) => setFilterModel(e.target.value)}
                                className="w-full h-9 px-2 text-sm border border-[rgba(0,0,0,0.08)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C2185B]/20">
                                <option value="">All</option>
                                <option value="model1">Model 1</option>
                                <option value="model2">Model 2</option>
                            </select>
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Status</p>
                            <div className="flex gap-1">
                                {[{ v: "active", l: "Active" }, { v: "archived", l: "Archived" }, { v: "all", l: "All" }].map(opt => (
                                    <button key={opt.v} onClick={() => setFilterActive(opt.v)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterActive === opt.v ? "bg-[#C2185B] text-white" : "bg-[#F4F0F8] text-[#555] hover:bg-[#E0E0E0]"}`}>
                                        {opt.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {activeFilters > 0 && (
                            <button onClick={() => { setFilterCategory(""); setFilterModel(""); setFilterActive("active"); }}
                                className="text-xs text-[#C2185B] font-semibold hover:underline">
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Item Grid */}
                <div className="flex-1 min-w-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} className="h-[280px]" />)}
                        </div>
                    ) : filteredStyles.length === 0 ? (
                        <EmptyState icon={Eye} title="No styles found" description="Try adjusting your filters or add a new style."
                            action={<Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548]">Add Style</Button>} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredStyles.map((style) => (
                                <div key={style.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden group relative">
                                    {/* Image */}
                                    <div className="relative h-52 bg-gradient-to-br from-[#C2185B]/10 to-[#F4F0F8]">
                                        {style.images?.[0] ? (
                                            <Image src={style.images[0]} alt={style.name} fill className="object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Eye size={28} className="text-[#999]" />
                                            </div>
                                        )}

                                        {/* Hover overlay with controls */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <button onClick={() => openEdit(style)}
                                                className="h-9 px-3 rounded-lg bg-white text-[#0D0D0D] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F0F8] transition-colors">
                                                <Pencil size={13} /> Edit
                                            </button>
                                            <button onClick={() => toggleArchive.mutate({ id: style.id, isActive: !style.isActive })}
                                                className="h-9 px-3 rounded-lg bg-white/90 text-[#555] text-xs font-semibold flex items-center gap-1.5 hover:bg-white transition-colors">
                                                <Archive size={13} /> {style.isActive === false ? "Restore" : "Archive"}
                                            </button>
                                        </div>

                                        {/* Featured badge */}
                                        {style.isFeatured && (
                                            <div className="absolute top-2 left-2 bg-[#FF6F00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <Star size={10} fill="currentColor" /> FEATURED
                                            </div>
                                        )}

                                        {/* Archived overlay */}
                                        {style.isActive === false && (
                                            <div className="absolute top-2 right-2 bg-[#555] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                                                ARCHIVED
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <p className="text-sm font-semibold text-[#0D0D0D] truncate">{style.name}</p>
                                            <button onClick={() => toggleFeatured.mutate({ id: style.id, isFeatured: !style.isFeatured })}
                                                className={`shrink-0 ${style.isFeatured ? "text-[#FF6F00]" : "text-[#E0E0E0] hover:text-[#FF6F00]"} transition-colors`}>
                                                <Star size={14} fill={style.isFeatured ? "currentColor" : "none"} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-[#999] mb-2 line-clamp-1">{style.description || "No description"}</p>
                                        <div className="flex items-center gap-1.5">
                                            {style.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F0F8] text-[#555]">{style.category}</span>}
                                            {style.availableForModel1 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F8E8F0] text-[#C2185B] font-medium">M1</span>}
                                            {style.availableForModel2 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E3F2FD] text-[#1565C0] font-medium">M2</span>}
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
                                <h3 className="text-lg font-bold text-[#0D0D0D]">{editStyle ? "Edit Style" : "Add New Style"}</h3>
                                <button onClick={closeForm}><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Name *</label>
                                    <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-10 bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Category</label>
                                    <Input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Ankara, Corporate" className="h-10 bg-white" list="cat-suggestions" />
                                    <datalist id="cat-suggestions">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Description</label>
                                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="resize-none bg-white" />
                                </div>

                                {/* Model availability */}
                                <div>
                                    <p className="text-xs text-[#999] mb-2">Model Availability</p>
                                    <div className="flex gap-3">
                                        {[{ k: "availableForModel1", l: "Model 1 (Custom)" }, { k: "availableForModel2", l: "Model 2 (Bring Fabric)" }].map(opt => (
                                            <button key={opt.k} onClick={() => setFormData({ ...formData, [opt.k]: !formData[opt.k] })}
                                                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border-2 transition-colors ${formData[opt.k]
                                                    ? "border-[#C2185B] bg-[#C2185B]/5 text-[#C2185B]"
                                                    : "border-[#E0E0E0] text-[#999] hover:border-[#C2185B]/30"
                                                    }`}>
                                                {opt.l}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="flex gap-4 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.isFeatured} onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0] focus:ring-[#C2185B]" />
                                        <span className="text-sm text-[#555]">Featured</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0] focus:ring-[#C2185B]" />
                                        <span className="text-sm text-[#555]">Active</span>
                                    </label>
                                </div>
                            </div>

                            <Button onClick={() => saveMutation.mutate(formData)} disabled={!formData.name || saveMutation.isPending}
                                className="w-full mt-5 bg-[#C2185B] text-white hover:bg-[#A01548] h-10 gap-2">
                                <Save size={14} /> {saveMutation.isPending ? "Saving..." : editStyle ? "Save Changes" : "Create Style"}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
