"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Eye, Search, X, Save, Star, Filter, Loader2, ImageIcon } from "lucide-react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ImageUpload from "@/components/shared/ImageUpload";
import CustomSelect from "@/components/shared/CustomSelect";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function AdminCatalogPortfolioPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editEntry, setEditEntry] = useState(null);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [tappedCard, setTappedCard] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "", description: "", category: "", customCategory: "",
        orderId: "", clientConsent: false, isPublished: false, isFeatured: false,
    });
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    // Order search for order linking
    const [orderSearch, setOrderSearch] = useState("");
    const { data: ordersData } = useQuery({
        queryKey: ["admin-orders-search", orderSearch],
        queryFn: async () => {
            const { data } = await api.get("/admin/orders", {
                params: { status: "COMPLETED", search: orderSearch, limit: 20 },
            });
            return data.data?.orders || [];
        },
        enabled: showForm,
    });

    const orderOptions = (ordersData || []).map(o => ({
        value: o.id,
        label: `#${o.id.slice(-6).toUpperCase()} — ${o.user?.fullName || o.clientName || "Client"}`,
    }));

    // Fetch portfolio entries
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["admin-portfolio", searchQuery],
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: 12, admin: true };
            if (searchQuery) params.search = searchQuery;
            const { data } = await api.get("/portfolio", { params });
            return data.data || {};
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.currentPage < lastPage?.pagination?.totalPages) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        },
    });

    const uniqueEntries = data?.pages.flatMap((page) => page?.entries || []) || [];

    const handleSearchChange = (val) => setSearchQuery(val);

    const categories = [...new Set(uniqueEntries.map(e => e.category).filter(Boolean))];

    // Client-side filters
    const filteredEntries = uniqueEntries.filter(entry => {
        if (filterCategory && entry.category !== filterCategory) return false;
        if (filterStatus === "published" && !entry.isPublished) return false;
        if (filterStatus === "drafts" && entry.isPublished) return false;
        return true;
    });

    // FormData builder
    const buildFormData = useCallback(() => {
        const fd = new FormData();
        if (formData.title) fd.append("title", formData.title);
        if (formData.description) fd.append("description", formData.description);
        fd.append("category", formData.customCategory || formData.category);
        if (formData.orderId) fd.append("orderId", formData.orderId);
        fd.append("clientConsent", String(formData.clientConsent));
        fd.append("isPublished", String(formData.clientConsent && formData.isPublished));
        fd.append("isFeatured", String(formData.isFeatured));
        newImageFiles.forEach((file) => fd.append("images", file));
        return fd;
    }, [formData, newImageFiles]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const fd = buildFormData();
            if (editEntry) {
                const { data } = await api.put(`/portfolio/${editEntry.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                return data;
            }
            const { data } = await api.post("/portfolio", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success(editEntry ? "Entry updated!" : "Entry created!");
            closeForm();
            queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const { data } = await api.delete(`/portfolio/${id}`);
            return data;
        },
        onSuccess: () => {
            toast.success("Entry deleted");
            setDeleteTarget(null);
            queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
        },
        onError: (err) => { toast.error("Error", err.response?.data?.message || "Failed."); setDeleteTarget(null); },
    });

    // Image management
    const deleteExistingImage = useMutation({
        mutationFn: async ({ entryId, imageUrl }) => {
            const fd = new FormData();
            fd.append("imageUrls", JSON.stringify([imageUrl]));
            const { data } = await api.patch(`/portfolio/${entryId}/images`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: (data) => {
            setExistingImages(data.data?.entry?.images || []);
            queryClient.invalidateQueries({ queryKey: ["admin-portfolio"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const openCreate = () => {
        setEditEntry(null);
        setFormData({ title: "", description: "", category: "", customCategory: "", orderId: "", clientConsent: false, isPublished: false, isFeatured: false });
        setNewImageFiles([]); setExistingImages([]); setShowForm(true);
    };

    const openEdit = (entry) => {
        setEditEntry(entry);
        setFormData({
            title: entry.title || "", description: entry.description || "", category: entry.category || "", customCategory: "",
            orderId: entry.orderId || "", clientConsent: entry.clientConsent ?? false,
            isPublished: entry.isPublished ?? false, isFeatured: entry.isFeatured ?? false,
        });
        setNewImageFiles([]); setExistingImages(entry.images || []); setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditEntry(null); setNewImageFiles([]); setExistingImages([]); };

    const handleCardTap = (e, entryId) => {
        if (window.matchMedia("(hover: none)").matches) { e.preventDefault(); setTappedCard(tappedCard === entryId ? null : entryId); }
    };

    const activeFilters = [filterCategory, filterStatus !== "all" ? filterStatus : ""].filter(Boolean).length;
    const categoryOptions = categories.map(c => ({ value: c, label: c }));

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Portfolio</h1>
                    <p className="text-sm text-[#999]">{filteredEntries.length} entries</p>
                </div>
                <Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5">
                    <Plus size={14} /> Add Entry
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search portfolio..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 h-11 bg-white text-sm" />
            </div>

            <button onClick={() => setShowMobileFilter(!showMobileFilter)} className="lg:hidden mb-4 flex items-center gap-1.5 text-xs font-semibold text-[#C2185B]">
                <Filter size={14} /> Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>

            <div className="flex gap-6">
                {/* Filter Sidebar */}
                <div className={`${showMobileFilter ? "block" : "hidden"} lg:block w-full lg:w-[220px] shrink-0`}>
                    <div className="p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white space-y-5 lg:sticky lg:top-[72px]">
                        <CustomSelect label="Category" options={categoryOptions} value={filterCategory} onChange={setFilterCategory} placeholder="All categories" />
                        <div>
                            <p className="text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-2">Status</p>
                            <div className="flex gap-1">
                                {[{ v: "all", l: "All" }, { v: "published", l: "Published" }, { v: "drafts", l: "Drafts" }].map(opt => (
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
                        <EmptyState icon={ImageIcon} title="No entries found" description="Try adjusting your filters or add a new portfolio entry."
                            action={<Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548]">Add Entry</Button>} />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredEntries.map((entry) => (
                                    <div key={entry.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden group relative"
                                        onClick={(e) => handleCardTap(e, entry.id)}>
                                        <div className="relative h-52 bg-gradient-to-br from-[#C2185B]/10 to-[#F4F0F8]">
                                            {entry.images?.[0] ? (
                                                <Image src={entry.images[0]} alt={entry.title || "Portfolio"} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><ImageIcon size={28} className="text-[#999]" /></div>
                                            )}

                                            {/* DRAFT watermark */}
                                            {!entry.isPublished && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="text-3xl font-black text-white/40 rotate-[-20deg] tracking-[0.3em] select-none">DRAFT</span>
                                                </div>
                                            )}

                                            {/* Hover/tap controls */}
                                            <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center gap-2 ${tappedCard === entry.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(entry); }}
                                                    className="h-9 px-3 rounded-lg bg-white text-[#0D0D0D] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F0F8] transition-colors">
                                                    <Pencil size={13} /> Edit
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(entry); }}
                                                    className="h-9 px-3 rounded-lg bg-[#FFEBEE] text-[#C62828] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FFCDD2] transition-colors">
                                                    <Trash2 size={13} /> Delete
                                                </button>
                                            </div>

                                            {entry.isFeatured && (
                                                <div className="absolute top-2 left-2 bg-[#FF6F00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={10} fill="currentColor" /> FEATURED</div>
                                            )}
                                        </div>

                                        <div className="p-4">
                                            <p className="text-sm font-semibold text-[#0D0D0D] truncate mb-1">{entry.title || "Untitled"}</p>
                                            <p className="text-xs text-[#999] mb-2 line-clamp-1">{entry.description || "No description"}</p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {entry.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F0F8] text-[#555]">{entry.category}</span>}
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${entry.isPublished ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFF3E0] text-[#E65100]"}`}>
                                                    {entry.isPublished ? "Published" : "Draft"}
                                                </span>
                                                {entry.clientConsent && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#1565C0]">Consent ✓</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {hasNextPage && (
                                <div className="flex justify-center mt-8">
                                    <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline" className="border-[#C2185B] text-[#C2185B] hover:bg-[#C2185B]/5 gap-2">
                                        {isFetchingNextPage ? <Loader2 size={14} className="animate-spin" /> : null}
                                        {isFetchingNextPage ? "Loading…" : "Load More Entries"}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeForm}>
                        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-xl max-w-[640px] w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-[#0D0D0D]">{editEntry ? "Edit Portfolio Entry" : "Add Portfolio Entry"}</h3>
                                <button onClick={closeForm} className="p-1 rounded-full hover:bg-[#F4F0F8] transition-colors"><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Title</label>
                                    <Input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="h-11 bg-white" placeholder="Portfolio entry title" />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Category *</label>
                                    <CustomSelect
                                        options={[...categoryOptions, { value: "__custom__", label: "+ Add custom category" }]}
                                        value={formData.category}
                                        onChange={(val) => {
                                            if (val === "__custom__") setFormData({ ...formData, category: "__custom__", customCategory: "" });
                                            else setFormData({ ...formData, category: val, customCategory: "" });
                                        }}
                                        placeholder="Select or add category" searchable
                                    />
                                    {formData.category === "__custom__" && (
                                        <Input type="text" value={formData.customCategory} onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} placeholder="Enter custom category" className="h-11 bg-white mt-2" />
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Description</label>
                                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="resize-none bg-white" placeholder="Describe this portfolio piece…" />
                                </div>

                                {/* Order Link */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Linked Order (optional)</label>
                                    <CustomSelect
                                        options={orderOptions}
                                        value={formData.orderId}
                                        onChange={(val) => setFormData({ ...formData, orderId: val })}
                                        placeholder="Search completed orders…"
                                        searchable
                                    />
                                    <p className="text-[10px] text-[#999] mt-1">Standalone works can leave this blank. Only completed orders are shown.</p>
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Images</label>
                                    <ImageUpload
                                        existingImages={existingImages}
                                        newFiles={newImageFiles}
                                        onNewFilesChange={setNewImageFiles}
                                        onExistingImagesReorder={setExistingImages}
                                        onExistingImageDelete={(url) => {
                                            if (editEntry) deleteExistingImage.mutate({ entryId: editEntry.id, imageUrl: url });
                                            else setExistingImages(existingImages.filter(u => u !== url));
                                        }}
                                    />
                                </div>

                                {/* Toggles */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Client Consent</p>
                                            <p className="text-[10px] text-[#999]">Client has given permission to showcase this work</p>
                                        </div>
                                        <Switch checked={formData.clientConsent} onCheckedChange={(checked) => {
                                            const updates = { clientConsent: checked };
                                            if (!checked) updates.isPublished = false;
                                            setFormData({ ...formData, ...updates });
                                        }} />
                                    </label>
                                    <label className={`flex items-center justify-between cursor-pointer p-3 rounded-lg border transition-colors ${formData.clientConsent ? "border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA]" : "border-[rgba(0,0,0,0.04)] bg-[#FAFAFA] opacity-50 cursor-not-allowed"}`}>
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Published</p>
                                            <p className="text-[10px] text-[#999]">{formData.clientConsent ? "Visible to the public" : "Requires client consent first"}</p>
                                        </div>
                                        <Switch checked={formData.isPublished} onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })} disabled={!formData.clientConsent} />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Featured</p>
                                            <p className="text-[10px] text-[#999]">Highlight in portfolio showcase</p>
                                        </div>
                                        <Switch checked={formData.isFeatured} onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })} />
                                    </label>
                                </div>
                            </div>

                            <Button onClick={() => saveMutation.mutate()}
                                disabled={!(formData.category || formData.customCategory) || saveMutation.isPending}
                                className="w-full mt-5 bg-[#C2185B] text-white hover:bg-[#A01548] h-11 gap-2">
                                {saveMutation.isPending ? (<><Loader2 size={14} className="animate-spin" /> Saving…</>) : (<><Save size={14} /> {editEntry ? "Save Changes" : "Create Entry"}</>)}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Dialog */}
            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                onConfirm={() => { if (deleteTarget) deleteMutation.mutate(deleteTarget.id); }}
                title={`Delete "${deleteTarget?.title || "this entry"}"?`}
                description="This portfolio entry will be permanently deleted. This action cannot be undone."
                confirmText="Delete Entry"
                variant="danger"
                loading={deleteMutation.isPending}
            />
        </div>
    );
}
