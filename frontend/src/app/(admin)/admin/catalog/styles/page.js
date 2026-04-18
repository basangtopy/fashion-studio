"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Archive, Eye, Search, X, Save, Star, Filter, Loader2 } from "lucide-react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
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

export default function AdminCatalogStylesPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editStyle, setEditStyle] = useState(null);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterModel, setFilterModel] = useState("");
    const [filterActive, setFilterActive] = useState("active");
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [tappedCard, setTappedCard] = useState(null);

    // Confirm dialog state
    const [confirmAction, setConfirmAction] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "", description: "", category: "", customCategory: "",
        availableForModel1: true, availableForModel2: true,
        isFeatured: false, isActive: true,
    });
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Fetch styles
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["admin-styles", debouncedSearchQuery],
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: 12 };
            if (debouncedSearchQuery) params.search = debouncedSearchQuery;
            const { data } = await api.get("/styles", { params });
            return data.data || {};
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.currentPage < lastPage?.pagination?.totalPages) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        },
    });

    const allStyles = data?.pages.flatMap((page) => page?.styles || []) || [];
    const uniqueStyles = Array.from(new Map(allStyles.map(s => [s.id, s])).values());

    const handleSearchChange = (val) => setSearchQuery(val);

    // Get unique categories from loaded styles
    const categories = [...new Set(uniqueStyles.map(s => s.category).filter(Boolean))];

    // Apply client-side filters
    const filteredStyles = uniqueStyles.filter(s => {
        if (filterCategory && s.category !== filterCategory) return false;
        if (filterModel === "model1" && !s.availableForModel1) return false;
        if (filterModel === "model2" && !s.availableForModel2) return false;
        if (filterActive === "active" && s.isActive === false) return false;
        if (filterActive === "archived" && s.isActive !== false) return false;
        return true;
    });

    // Build FormData for API
    const buildFormData = useCallback(() => {
        const fd = new FormData();
        fd.append("name", formData.name);
        fd.append("description", formData.description);
        fd.append("category", formData.customCategory || formData.category);
        fd.append("availableForModel1", String(formData.availableForModel1));
        fd.append("availableForModel2", String(formData.availableForModel2));
        fd.append("isFeatured", String(formData.isFeatured));
        if (editStyle) {
            fd.append("isActive", String(formData.isActive));
        }
        newImageFiles.forEach((file) => fd.append("images", file));
        return fd;
    }, [formData, newImageFiles, editStyle]);

    // Save mutation (create/update)
    const saveMutation = useMutation({
        mutationFn: async () => {
            const fd = buildFormData();
            if (editStyle) {
                const { data } = await api.put(`/styles/${editStyle.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                return data;
            }
            const { data } = await api.post("/styles", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success(editStyle ? "Style updated!" : "Style created!");
            closeForm();
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    // Archive mutation
    const toggleArchive = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const fd = new FormData();
            fd.append("isActive", String(isActive));
            const { data } = await api.put(`/styles/${id}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Style updated");
            setConfirmAction(null);
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.message || "Failed.");
            setConfirmAction(null);
        },
    });

    // Toggle featured
    const toggleFeatured = useMutation({
        mutationFn: async ({ id, isFeatured }) => {
            const fd = new FormData();
            fd.append("isFeatured", String(isFeatured));
            const { data } = await api.put(`/styles/${id}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-styles"] }),
    });

    // Image management (delete existing image)
    const deleteExistingImage = useMutation({
        mutationFn: async ({ styleId, imageUrl }) => {
            const fd = new FormData();
            fd.append("imageUrls", JSON.stringify([imageUrl]));
            const { data } = await api.patch(`/styles/${styleId}/images`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: (data) => {
            setExistingImages(data.data?.style?.images || []);
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to delete image."),
    });

    const openCreate = () => {
        setEditStyle(null);
        setFormData({ name: "", description: "", category: "", customCategory: "", availableForModel1: true, availableForModel2: true, isFeatured: false, isActive: true });
        setNewImageFiles([]);
        setExistingImages([]);
        setShowForm(true);
    };

    const openEdit = (style) => {
        setEditStyle(style);
        setFormData({
            name: style.name || "", description: style.description || "", category: style.category || "", customCategory: "",
            availableForModel1: style.availableForModel1 ?? true, availableForModel2: style.availableForModel2 ?? true,
            isFeatured: style.isFeatured ?? false, isActive: style.isActive ?? true,
        });
        setNewImageFiles([]);
        setExistingImages(style.images || []);
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditStyle(null); setNewImageFiles([]); setExistingImages([]); };

    // Touch accessibility — tap to toggle overlay
    const handleCardTap = (e, styleId) => {
        if (window.matchMedia("(hover: none)").matches) {
            e.preventDefault();
            setTappedCard(tappedCard === styleId ? null : styleId);
        }
    };

    const activeFilters = [filterCategory, filterModel, filterActive !== "active" ? filterActive : ""].filter(Boolean).length;

    // Category options for CustomSelect
    const categoryOptions = categories.map(c => ({ value: c, label: c }));

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Styles Catalog</h1>
                    <p className="text-sm text-[#999]">{filteredStyles.length} styles</p>
                </div>
                <Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5">
                    <Plus size={14} /> Add New Style
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search styles..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 h-11 bg-white text-sm" />
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
                        <CustomSelect
                            label="Category"
                            options={categoryOptions}
                            value={filterCategory}
                            onChange={setFilterCategory}
                            placeholder="All categories"
                        />
                        <CustomSelect
                            label="Model"
                            options={[
                                { value: "model1", label: "Model 1 (Client Brings Fabric)" },
                                { value: "model2", label: "Model 2 (Studio Source Fabric)" },
                            ]}
                            value={filterModel}
                            onChange={setFilterModel}
                            placeholder="All models"
                        />
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
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredStyles.map((style) => (
                                    <div key={style.id}
                                        className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden group relative"
                                        onClick={(e) => handleCardTap(e, style.id)}
                                    >
                                        {/* Image */}
                                        <div className="relative h-52 bg-gradient-to-br from-[#C2185B]/10 to-[#F4F0F8]">
                                            {style.images?.[0] ? (
                                                <>
                                                    {/* blurred background */}
                                                    <Image src={style.images[0]} alt={style.name} fill className="object-cover blur-xl scale-110 opacity-100" />
                                                    <Image src={style.images[0]} alt={style.name} fill className="object-contain" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Eye size={28} className="text-[#999]" />
                                                </div>
                                            )}

                                            {/* Hover / Tap overlay with controls */}
                                            <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center gap-2 ${tappedCard === style.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(style); }}
                                                    className="h-9 px-3 rounded-lg bg-white text-[#0D0D0D] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#F4F0F8] transition-colors">
                                                    <Pencil size={13} /> Edit
                                                </button>
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmAction({ id: style.id, isActive: style.isActive, name: style.name });
                                                }}
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
                                                <button onClick={(e) => { e.stopPropagation(); toggleFeatured.mutate({ id: style.id, isFeatured: !style.isFeatured }); }}
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

                            {/* Load More */}
                            {hasNextPage && (
                                <div className="flex justify-center mt-8">
                                    <Button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        variant="outline"
                                        className="border-[#C2185B] text-[#C2185B] hover:bg-[#C2185B]/5 gap-2"
                                    >
                                        {isFetchingNextPage ? <Loader2 size={14} className="animate-spin" /> : null}
                                        {isFetchingNextPage ? "Loading…" : "Load More Styles"}
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
                                <h3 className="text-lg font-bold text-[#0D0D0D]">{editStyle ? "Edit Style" : "Add New Style"}</h3>
                                <button onClick={closeForm} className="p-1 rounded-full hover:bg-[#F4F0F8] transition-colors"><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Name *</label>
                                    <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 bg-white" placeholder="Style name" />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Category *</label>
                                    <CustomSelect
                                        options={[
                                            ...categoryOptions,
                                            { value: "__custom__", label: "+ Add custom category" },
                                        ]}
                                        value={formData.category}
                                        onChange={(val) => {
                                            if (val === "__custom__") {
                                                setFormData({ ...formData, category: "__custom__", customCategory: "" });
                                            } else {
                                                setFormData({ ...formData, category: val, customCategory: "" });
                                            }
                                        }}
                                        placeholder="Select or add category"
                                        searchable
                                    />
                                    {formData.category === "__custom__" && (
                                        <Input
                                            type="text"
                                            value={formData.customCategory}
                                            onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                                            placeholder="Enter custom category"
                                            className="h-11 bg-white mt-2"
                                        />
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Description *</label>
                                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="resize-none bg-white" placeholder="Describe this style…" />
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Images {!editStyle && "*"}</label>
                                    <ImageUpload
                                        existingImages={existingImages}
                                        newFiles={newImageFiles}
                                        onNewFilesChange={setNewImageFiles}
                                        onExistingImagesReorder={setExistingImages}
                                        onExistingImageDelete={(url) => {
                                            if (editStyle) {
                                                deleteExistingImage.mutate({ styleId: editStyle.id, imageUrl: url });
                                            } else {
                                                setExistingImages(existingImages.filter(u => u !== url));
                                            }
                                        }}
                                    />
                                </div>

                                {/* Model availability */}
                                <div>
                                    <p className="text-xs font-medium text-[#555] mb-3">Model Availability</p>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                            <div>
                                                <p className="text-sm font-medium text-[#0D0D0D]">Model 1 — Client Brings Fabric</p>
                                                <p className="text-[10px] text-[#999]">Client provides fabric</p>
                                            </div>
                                            <Switch
                                                checked={formData.availableForModel1}
                                                onCheckedChange={(checked) => setFormData({ ...formData, availableForModel1: checked })}
                                            />
                                        </label>
                                        <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                            <div>
                                                <p className="text-sm font-medium text-[#0D0D0D]">Model 2 — Studio Source Fabric</p>
                                                <p className="text-[10px] text-[#999]">We source fabric and make</p>
                                            </div>
                                            <Switch
                                                checked={formData.availableForModel2}
                                                onCheckedChange={(checked) => setFormData({ ...formData, availableForModel2: checked })}
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Toggles */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Featured</p>
                                            <p className="text-[10px] text-[#999]">Show on homepage showcase</p>
                                        </div>
                                        <Switch
                                            checked={formData.isFeatured}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                                        />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-[#0D0D0D]">Active</p>
                                            <p className="text-[10px] text-[#999]">Visible in the public catalog</p>
                                        </div>
                                        <Switch
                                            checked={formData.isActive}
                                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                                        />
                                    </label>
                                </div>
                            </div>

                            <Button
                                onClick={() => saveMutation.mutate()}
                                disabled={!formData.name || !formData.description || !(formData.category || formData.customCategory) || (!editStyle && newImageFiles.length === 0) || saveMutation.isPending}
                                className="w-full mt-5 bg-[#C2185B] text-white hover:bg-[#A01548] h-11 gap-2"
                            >
                                {saveMutation.isPending ? (
                                    <><Loader2 size={14} className="animate-spin" /> Saving…</>
                                ) : (
                                    <><Save size={14} /> {editStyle ? "Save Changes" : "Create Style"}</>
                                )}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Archive Confirm Dialog */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                onConfirm={() => {
                    if (confirmAction) {
                        toggleArchive.mutate({ id: confirmAction.id, isActive: confirmAction.isActive === false });
                    }
                }}
                title={confirmAction?.isActive === false ? `Restore "${confirmAction?.name}"?` : `Archive "${confirmAction?.name}"?`}
                description={confirmAction?.isActive === false
                    ? "This style will be visible in the public catalog again."
                    : "This will hide the style from the public catalog. You can restore it later."
                }
                confirmText={confirmAction?.isActive === false ? "Restore" : "Archive"}
                variant={confirmAction?.isActive === false ? "warning" : "danger"}
                loading={toggleArchive.isPending}
            />
        </div>
    );
}
