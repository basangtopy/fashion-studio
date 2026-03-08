"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Archive, Search, X, Save, ShoppingBag, Minus, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/config/branding";
import { useToast } from "@/components/ui/toaster";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const STOCK_STATUS_MAP = { IN_STOCK: "In Stock", LOW_STOCK: "Low Stock", OUT_OF_STOCK: "Out of Stock" };
const STOCK_COLORS = { IN_STOCK: "bg-[#E8F5E9] text-[#2E7D32]", LOW_STOCK: "bg-[#FFF3E0] text-[#E65100]", OUT_OF_STOCK: "bg-[#FFEBEE] text-[#C62828]" };

function calcStockStatus(count) {
    if (count <= 0) return "OUT_OF_STOCK";
    if (count <= 5) return "LOW_STOCK";
    return "IN_STOCK";
}

export default function AdminRTWPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStock, setFilterStock] = useState("");
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [form, setForm] = useState({
        name: "", description: "", category: "", price: "",
        availableSizes: "", stockCount: "", fabricDetails: "", careInstructions: "",
        isFeatured: false, isActive: true,
    });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-rtw", searchQuery],
        queryFn: async () => {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            const { data } = await api.get("/ready-to-wear", { params });
            return data.data?.items || data.data?.readyToWear || data.data || [];
        },
    });

    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            if (editItem) {
                const { data } = await api.put(`/ready-to-wear/${editItem.id}`, payload);
                return data;
            }
            const { data } = await api.post("/ready-to-wear", payload);
            return data;
        },
        onSuccess: () => {
            toast.success(editItem ? "Item updated!" : "Item created!");
            closeForm();
            queryClient.invalidateQueries({ queryKey: ["admin-rtw"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const toggleArchive = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const { data } = await api.put(`/ready-to-wear/${id}`, { isActive });
            return data;
        },
        onSuccess: () => {
            toast.success("Item updated");
            queryClient.invalidateQueries({ queryKey: ["admin-rtw"] });
        },
    });

    const allItems = Array.isArray(data) ? data : [];
    const categories = [...new Set(allItems.map(i => i.category).filter(Boolean))];

    const filteredItems = allItems.filter(i => {
        if (filterCategory && i.category !== filterCategory) return false;
        if (filterStock) {
            const status = i.stockStatus || calcStockStatus(i.stockCount || i.stock || 0);
            if (filterStock !== status) return false;
        }
        return true;
    });

    const openCreate = () => {
        setEditItem(null);
        setForm({ name: "", description: "", category: "", price: "", availableSizes: "", stockCount: "", fabricDetails: "", careInstructions: "", isFeatured: false, isActive: true });
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({
            name: item.name || "", description: item.description || "", category: item.category || "",
            price: item.price || "", availableSizes: (item.availableSizes || []).join(", "),
            stockCount: item.stockCount || item.stock || "", fabricDetails: item.fabricDetails || "",
            careInstructions: item.careInstructions || "", isFeatured: item.isFeatured ?? false, isActive: item.isActive ?? true,
        });
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditItem(null); };

    const handleSubmit = () => {
        saveMutation.mutate({
            name: form.name, description: form.description, category: form.category,
            price: Number(form.price), stockCount: Number(form.stockCount) || 0,
            availableSizes: form.availableSizes.split(",").map(s => s.trim()).filter(Boolean),
            fabricDetails: form.fabricDetails, careInstructions: form.careInstructions,
            isFeatured: form.isFeatured, isActive: form.isActive,
        });
    };

    const activeFilters = [filterCategory, filterStock].filter(Boolean).length;

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Ready-to-Wear</h1>
                    <p className="text-sm text-[#999]">{filteredItems.length} of {allItems.length} items</p>
                </div>
                <Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5">
                    <Plus size={14} /> Add Item
                </Button>
            </div>

            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-11 bg-white text-sm" />
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
                            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Stock Status</p>
                            <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}
                                className="w-full h-9 px-2 text-sm border border-[rgba(0,0,0,0.08)] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C2185B]/20">
                                <option value="">All</option>
                                <option value="IN_STOCK">In Stock</option>
                                <option value="LOW_STOCK">Low Stock</option>
                                <option value="OUT_OF_STOCK">Out of Stock</option>
                            </select>
                        </div>
                        {activeFilters > 0 && (
                            <button onClick={() => { setFilterCategory(""); setFilterStock(""); }}
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
                    ) : filteredItems.length === 0 ? (
                        <EmptyState icon={ShoppingBag} title="No items found" description="Try adjusting filters or add a new item."
                            action={<Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548]">Add Item</Button>} />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredItems.map((item) => {
                                const stockStatus = item.stockStatus || calcStockStatus(item.stockCount || item.stock || 0);
                                return (
                                    <div key={item.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden group relative">
                                        <div className="relative h-52 bg-gradient-to-br from-[#C2185B]/10 to-[#F4F0F8]">
                                            {item.images?.[0] ? (
                                                <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingBag size={28} className="text-[#999]" />
                                                </div>
                                            )}
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => openEdit(item)}
                                                    className="h-9 px-3 rounded-lg bg-white text-[#0D0D0D] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F0F8] transition-colors">
                                                    <Pencil size={13} /> Edit
                                                </button>
                                                <button onClick={() => toggleArchive.mutate({ id: item.id, isActive: !(item.isActive ?? true) })}
                                                    className="h-9 px-3 rounded-lg bg-white/90 text-[#555] text-xs font-semibold flex items-center gap-1.5 hover:bg-white transition-colors">
                                                    <Archive size={13} /> {item.isActive === false ? "Restore" : "Archive"}
                                                </button>
                                            </div>
                                            {/* Stock badge */}
                                            <div className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${STOCK_COLORS[stockStatus]}`}>
                                                {STOCK_STATUS_MAP[stockStatus]}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <p className="text-sm font-semibold text-[#0D0D0D] truncate mb-0.5">{item.name}</p>
                                            <p className="text-xs text-[#999] mb-2">{item.category || "Uncategorized"}</p>
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-bold font-mono-data text-[#C2185B]">{formatCurrency(item.price)}</p>
                                                <span className="text-[10px] text-[#999]">{item.stockCount || item.stock || 0} in stock</span>
                                            </div>
                                            {(item.availableSizes || []).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.availableSizes.map((size) => (
                                                        <span key={size} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4F0F8] text-[#555]">{size}</span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
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
                                <h3 className="text-lg font-bold text-[#0D0D0D]">{editItem ? "Edit Item" : "New Ready-to-Wear Item"}</h3>
                                <button onClick={closeForm}><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Name *</label>
                                    <Input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Category</label>
                                    <Input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                        placeholder="e.g. Dresses, Tops" className="h-10 bg-white" list="rtw-cat-suggestions" />
                                    <datalist id="rtw-cat-suggestions">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Description</label>
                                    <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="resize-none bg-white" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-[#999] mb-1 block">Price (₦) *</label>
                                        <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-10 bg-white" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-[#999] mb-1 block">Stock Count</label>
                                        <div className="flex items-center gap-1">
                                            <button type="button" onClick={() => setForm({ ...form, stockCount: Math.max(0, (Number(form.stockCount) || 0) - 1) })}
                                                className="h-10 w-10 shrink-0 rounded-l-lg border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-[#F4F0F8] transition-colors">
                                                <Minus size={14} />
                                            </button>
                                            <Input type="number" value={form.stockCount} onChange={(e) => setForm({ ...form, stockCount: e.target.value })}
                                                className="h-10 bg-white text-center rounded-none border-x-0" />
                                            <button type="button" onClick={() => setForm({ ...form, stockCount: (Number(form.stockCount) || 0) + 1 })}
                                                className="h-10 w-10 shrink-0 rounded-r-lg border border-[rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-[#F4F0F8] transition-colors">
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-[#999] mt-1">
                                            Status: <span className="font-semibold">{STOCK_STATUS_MAP[calcStockStatus(Number(form.stockCount) || 0)]}</span>
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Available Sizes</label>
                                    <Input type="text" value={form.availableSizes} onChange={(e) => setForm({ ...form, availableSizes: e.target.value })}
                                        placeholder="e.g. S, M, L, XL" className="h-10 bg-white" />
                                    <p className="text-[10px] text-[#999] mt-1">Comma-separated</p>
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Fabric Details</label>
                                    <Textarea value={form.fabricDetails} onChange={(e) => setForm({ ...form, fabricDetails: e.target.value })}
                                        rows={2} placeholder="Material, weave, weight..." className="resize-none bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Care Instructions</label>
                                    <Textarea value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })}
                                        rows={2} placeholder="Washing, ironing, storage..." className="resize-none bg-white" />
                                </div>
                                <div className="flex gap-4 pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0]" />
                                        <span className="text-sm text-[#555]">Featured</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                                            className="w-4 h-4 rounded text-[#C2185B] border-[#E0E0E0]" />
                                        <span className="text-sm text-[#555]">Active</span>
                                    </label>
                                </div>
                            </div>
                            <Button onClick={handleSubmit} disabled={!form.name || !form.price || saveMutation.isPending}
                                className="w-full mt-5 bg-[#C2185B] text-white hover:bg-[#A01548] h-10 gap-2">
                                <Save size={14} /> {saveMutation.isPending ? "Saving..." : editItem ? "Save Changes" : "Create Item"}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
