"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Archive, Eye, Search, X, Save, Star, Filter, Loader2, Package } from "lucide-react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ImageUpload from "@/components/shared/ImageUpload";
import CustomSelect from "@/components/shared/CustomSelect";
import TagInput from "@/components/shared/TagInput";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function AdminCatalogReadyToWearPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStock, setFilterStock] = useState("");
    const [filterActive, setFilterActive] = useState("active");
    const [showMobileFilter, setShowMobileFilter] = useState(false);
    const [tappedCard, setTappedCard] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "", description: "", category: "", customCategory: "",
        price: "", availableSizes: [], fabricDetails: "", careInstructions: "",
        stockCount: 0, isFeatured: false, isActive: true,
        stockStatusOverride: false, stockStatus: "",
    });
    const [newImageFiles, setNewImageFiles] = useState([]);
    const [existingImages, setExistingImages] = useState([]);

    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    // Fetch items
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["admin-rtw", debouncedSearchQuery, filterCategory, filterStock, filterActive],
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: 12 };
            if (debouncedSearchQuery) params.search = debouncedSearchQuery;
            if (filterCategory) params.category = filterCategory;
            if (filterStock) params.stockStatus = filterStock;
            if (filterActive) params.isActive = filterActive === "active" ? true : false;
            const { data } = await api.get("/ready-to-wear/admin", { params });
            return data.data || {};
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.currentPage < lastPage?.pagination?.totalPages) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        },
    });

    const totalItems = data?.pages[0]?.pagination?.totalItems || 0;

    const allItems = data?.pages.flatMap((page) => page?.items || []) || [];
    const uniqueItems = Array.from(new Map(allItems.map(i => [i.id, i])).values());

    const handleSearchChange = (val) => setSearchQuery(val);

    const {data: categoriesData, isLoading: isLoadingCategories} = useQuery({
        queryKey: ["ready-to-wear", "categories"],
        queryFn: async () => {
            const { data } = await api.get("/ready-to-wear/categories");
            return data.data.categories || [];
        },
    });

    // FormData builder
    const buildFormData = useCallback(() => {
        const fd = new FormData();
        fd.append("name", formData.name);
        fd.append("description", formData.description);
        fd.append("category", formData.customCategory || formData.category);
        fd.append("price", String(formData.price));
        fd.append("availableSizes", JSON.stringify(formData.availableSizes));
        fd.append("stockCount", String(formData.stockCount));
        fd.append("isFeatured", String(formData.isFeatured));
        if (formData.fabricDetails) fd.append("fabricDetails", formData.fabricDetails);
        if (formData.careInstructions) fd.append("careInstructions", formData.careInstructions);
        if (editItem) {
            fd.append("isActive", String(formData.isActive));
            if (formData.stockStatusOverride && formData.stockStatus) {
                fd.append("stockStatus", formData.stockStatus);
            }
        }
        newImageFiles.forEach((file) => fd.append("images", file));
        return fd;
    }, [formData, newImageFiles, editItem]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async () => {
            const fd = buildFormData();
            if (editItem) {
                const { data } = await api.put(`/ready-to-wear/${editItem.id}`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                return data;
            }
            const { data } = await api.post("/ready-to-wear", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success(editItem ? "Item updated!" : "Item created!");
            closeForm();
            queryClient.invalidateQueries({ queryKey: ["admin-rtw"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    // Archive mutation
    const toggleArchive = useMutation({
        mutationFn: async ({ id, isActive }) => {
            const fd = new FormData();
            fd.append("isActive", String(isActive));
            const { data } = await api.put(`/ready-to-wear/${id}`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Item updated");
            setConfirmAction(null);
            queryClient.invalidateQueries({ queryKey: ["admin-rtw"] });
        },
        onError: (err) => { toast.error("Error", err.response?.data?.message || "Failed."); setConfirmAction(null); },
    });

    // Image management
    const deleteExistingImage = useMutation({
        mutationFn: async ({ itemId, imageUrl }) => {
            const fd = new FormData();
            fd.append("imageUrls", JSON.stringify([imageUrl]));
            const { data } = await api.patch(`/ready-to-wear/${itemId}/images`, fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: (data) => {
            setExistingImages(data.data?.item?.images || []);
            queryClient.invalidateQueries({ queryKey: ["admin-rtw"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const openCreate = () => {
        setEditItem(null);
        setFormData({ name: "", description: "", category: "", customCategory: "", price: "", availableSizes: [], fabricDetails: "", careInstructions: "", stockCount: 0, isFeatured: false, isActive: true, stockStatusOverride: false, stockStatus: "" });
        setNewImageFiles([]); setExistingImages([]); setShowForm(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setFormData({
            name: item.name || "", description: item.description || "", category: item.category || "", customCategory: "",
            price: item.price || "", availableSizes: item.availableSizes || [],
            fabricDetails: item.fabricDetails || "", careInstructions: item.careInstructions || "",
            stockCount: item.stockCount || 0, isFeatured: item.isFeatured ?? false, isActive: item.isActive ?? true,
            stockStatusOverride: false, stockStatus: item.stockStatus || "",
        });
        setNewImageFiles([]); setExistingImages(item.images || []); setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditItem(null); setNewImageFiles([]); setExistingImages([]); };

    const handleCardTap = (e, itemId) => {
        if (window.matchMedia("(hover: none)").matches) { e.preventDefault(); setTappedCard(tappedCard === itemId ? null : itemId); }
    };

    const getStockColor = (status) => {
        if (status === "IN_STOCK") return "bg-[#E8F5E9] text-status-success";
        if (status === "LOW_STOCK") return "bg-[#FFF3E0] text-status-warning";
        return "bg-[#FFEBEE] text-destructive";
    };

    const activeFilters = [filterCategory, filterStock, filterActive !== "active" ? filterActive : ""].filter(Boolean).length;
    const categoryOptions = categoriesData?.map(c => ({ value: c, label: c })) || [];

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Ready-to-Wear</h1>
                    <p className="text-sm text-text-light">{totalItems} items</p>
                </div>
                <Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5">
                    <Plus size={14} /> Add New Item
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light" />
                <Input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} className="pl-10 h-11 bg-white text-sm" />
            </div>

            {/* Mobile filter toggle */}
            <button onClick={() => setShowMobileFilter(!showMobileFilter)} className="lg:hidden mb-4 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <Filter size={14} /> Filters {activeFilters > 0 && `(${activeFilters})`}
            </button>

            <div className="flex gap-6">
                {/* Filter Sidebar */}
                <div className={`${showMobileFilter ? "block" : "hidden"} lg:block w-full lg:w-[220px] shrink-0`}>
                    <div className="p-4 rounded-xl border border-border bg-background space-y-5 lg:sticky lg:top-[72px]">
                        <CustomSelect label="Category" options={categoryOptions} value={filterCategory} onChange={setFilterCategory} placeholder="All categories" />
                        <CustomSelect label="Stock Status" options={[
                            { value: "IN_STOCK", label: "In Stock" },
                            { value: "LOW_STOCK", label: "Low Stock" },
                            { value: "OUT_OF_STOCK", label: "Out of Stock" },
                        ]} value={filterStock} onChange={setFilterStock} placeholder="All statuses" />
                        <div>
                            <p className="text-[10px] font-semibold text-text-light uppercase tracking-wider mb-2">Status</p>
                            <div className="flex gap-1">
                                {[{ v: "active", l: "Active" }, { v: "archived", l: "Archived" }, { v: "all", l: "All" }].map(opt => (
                                    <button key={opt.v} onClick={() => setFilterActive(opt.v)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterActive === opt.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-[#E0E0E0]"}`}>
                                        {opt.l}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {activeFilters > 0 && (
                            <button onClick={() => { setFilterCategory(""); setFilterStock(""); setFilterActive("active"); }}
                                className="text-xs text-primary font-semibold hover:underline">
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 min-w-0">
                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} className="h-[320px]" />)}
                        </div>
                    ) : uniqueItems.length === 0 ? (
                        <EmptyState icon={Package} title="No items found" description="Try adjusting your filters or add a new item."
                            action={<Button onClick={openCreate} className="bg-primary text-primary-foreground hover:bg-primary/90">Add Item</Button>} />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                {uniqueItems.map((item) => (
                                    <div key={item.id} className="rounded-xl border border-border bg-white overflow-hidden group relative"
                                        onClick={(e) => handleCardTap(e, item.id)}>
                                        <div className="relative h-52 bg-gradient-to-br from-primary/10 to-[#F4F0F8]">
                                            {item.images?.[0] ? (
                                                <>
                                                    {/* blurred background */}
                                                    <Image src={item.images[0]} alt={item.name} fill className="object-cover blur-xl scale-110 opacity-100" />
                                                    <Image src={item.images[0]} alt={item.name} fill className="object-contain" />
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Package size={28} className="text-text-light" /></div>
                                            )}
                                            <div className={`absolute inset-0 bg-black/50 transition-opacity flex items-center justify-center gap-2 ${tappedCard === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                                <button onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                                                    className="h-9 px-3 rounded-lg bg-white text-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-muted transition-colors">
                                                    <Pencil size={13} /> Edit
                                                </button>
                                                <button onClick={(e) => { e.stopPropagation(); setConfirmAction({ id: item.id, isActive: item.isActive, name: item.name }); }}
                                                    className="h-9 px-3 rounded-lg bg-white/90 text-muted-foreground text-xs font-semibold flex items-center gap-1.5 hover:bg-white transition-colors">
                                                    <Archive size={13} /> {item.isActive === false ? "Restore" : "Archive"}
                                                </button>
                                            </div>
                                            {item.isFeatured && (
                                                <div className="absolute top-2 left-2 bg-[#FF6F00] text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Star size={10} fill="currentColor" /> FEATURED</div>
                                            )}
                                            {item.isActive === false && (
                                                <div className="absolute top-2 right-2 bg-[#555] text-white text-[9px] font-bold px-2 py-0.5 rounded-full">ARCHIVED</div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                                                <p className="text-sm font-bold text-primary shrink-0">{typeof formatCurrency === "function" ? formatCurrency(item.price) : `₦${Number(item.price || 0).toLocaleString()}`}</p>
                                            </div>
                                            <p className="text-xs text-text-light mb-2 line-clamp-1">{item.description || "No description"}</p>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {item.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{item.category}</span>}
                                                {item.stockStatus && <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStockColor(item.stockStatus)}`}>{item.stockStatus?.replace(/_/g, " ")}</span>}
                                                {item.availableSizes?.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E3F2FD] text-status-info">{item.availableSizes.join(", ")}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {hasNextPage && (
                                <div className="flex justify-center mt-8">
                                    <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline" className="border-primary text-primary hover:bg-primary/5 gap-2">
                                        {isFetchingNextPage ? <Loader2 size={14} className="animate-spin" /> : null}
                                        {isFetchingNextPage ? "Loading…" : "Load More Items"}
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
                            className="bg-white rounded-xl max-w-[680px] w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-foreground">{editItem ? "Edit Item" : "Add New Item"}</h3>
                                <button onClick={closeForm} className="p-1 rounded-full hover:bg-muted transition-colors"><X size={18} className="text-text-light" /></button>
                            </div>
                            <div className="space-y-5">
                                {/* Name */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name *</label>
                                    <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-11 bg-white" placeholder="Item name" />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category *</label>
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

                                {/* Price */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price (₦) *</label>
                                    <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="h-11 bg-white" placeholder="0.00" min="0" step="0.01" />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description *</label>
                                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="resize-none bg-background" placeholder="Describe this item…" />
                                </div>

                                {/* Available Sizes */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Available Sizes *</label>
                                    <TagInput value={formData.availableSizes} onChange={(sizes) => setFormData({ ...formData, availableSizes: sizes })} placeholder='Type a size and press Enter (e.g. S, M, L, XL)' />
                                </div>

                                {/* Stock Count */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Stock Count</label>
                                    <div className="flex items-center gap-3">
                                        <button type="button" onClick={() => setFormData({ ...formData, stockCount: Math.max(0, formData.stockCount - 1) })}
                                            className="h-11 w-11 rounded-lg border border-input flex items-center justify-center text-muted-foreground hover:bg-muted text-lg font-bold transition-colors">−</button>
                                        <Input type="number" value={formData.stockCount} onChange={(e) => setFormData({ ...formData, stockCount: Math.max(0, parseInt(e.target.value) || 0) })}
                                            className="h-11 bg-white text-center w-24" min="0" />
                                        <button type="button" onClick={() => setFormData({ ...formData, stockCount: formData.stockCount + 1 })}
                                            className="h-11 w-11 rounded-lg border border-input flex items-center justify-center text-muted-foreground hover:bg-muted text-lg font-bold transition-colors">+</button>
                                        <span className={`ml-2 text-xs px-2 py-1 rounded-full font-medium ${formData.stockCount === 0 ? "bg-[#FFEBEE] text-destructive" : formData.stockCount <= 5 ? "bg-[#FFF3E0] text-status-warning" : "bg-[#E8F5E9] text-status-success"}`}>
                                            {formData.stockCount === 0 ? "Out of Stock" : formData.stockCount <= 5 ? "Low Stock" : "In Stock"}
                                        </span>
                                    </div>
                                </div>

                                {/* Stock Status Override (edit only) */}
                                {editItem && (
                                    <div className="p-3 rounded-lg border border-border">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Override Stock Status</p>
                                                <p className="text-[10px] text-text-light">Manually set status instead of auto-calculating</p>
                                            </div>
                                            <Switch checked={formData.stockStatusOverride} onCheckedChange={(checked) => setFormData({ ...formData, stockStatusOverride: checked })} />
                                        </label>
                                        {formData.stockStatusOverride && (
                                            <div className="mt-3">
                                                <CustomSelect
                                                    options={[
                                                        { value: "IN_STOCK", label: "In Stock" },
                                                        { value: "LOW_STOCK", label: "Low Stock" },
                                                        { value: "OUT_OF_STOCK", label: "Out of Stock" },
                                                    ]}
                                                    value={formData.stockStatus}
                                                    onChange={(val) => setFormData({ ...formData, stockStatus: val })}
                                                    placeholder="Select status"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Fabric & Care */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Fabric Details</label>
                                        <Textarea value={formData.fabricDetails} onChange={(e) => setFormData({ ...formData, fabricDetails: e.target.value })} rows={2} className="resize-none bg-background" placeholder="Cotton, Silk…" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Care Instructions</label>
                                        <Textarea value={formData.careInstructions} onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })} rows={2} className="resize-none bg-background" placeholder="Dry clean only…" />
                                    </div>
                                </div>

                                {/* Images */}
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Images {!editItem && "*"}</label>
                                    <ImageUpload
                                        existingImages={existingImages}
                                        newFiles={newImageFiles}
                                        onNewFilesChange={setNewImageFiles}
                                        onExistingImagesReorder={setExistingImages}
                                        onExistingImageDelete={(url) => {
                                            if (editItem) deleteExistingImage.mutate({ itemId: editItem.id, imageUrl: url });
                                            else setExistingImages(existingImages.filter(u => u !== url));
                                        }}
                                    />
                                </div>

                                {/* Toggles */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-border hover:bg-surface-2 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Featured</p>
                                            <p className="text-[10px] text-text-light">Show on homepage showcase</p>
                                        </div>
                                        <Switch checked={formData.isFeatured} onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })} />
                                    </label>
                                    <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-border hover:bg-surface-2 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-foreground">Active</p>
                                            <p className="text-[10px] text-text-light">Visible in the public catalog</p>
                                        </div>
                                        <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })} />
                                    </label>
                                </div>
                            </div>

                            <Button onClick={() => saveMutation.mutate()}
                                disabled={!formData.name || !formData.description || !(formData.category || formData.customCategory) || !formData.price || formData.availableSizes.length === 0 || (!editItem && newImageFiles.length === 0) || saveMutation.isPending}
                                className="w-full mt-5 bg-primary text-primary-foreground hover:bg-primary/90 h-11 gap-2">
                                {saveMutation.isPending ? (<><Loader2 size={14} className="animate-spin" /> Saving…</>) : (<><Save size={14} /> {editItem ? "Save Changes" : "Create Item"}</>)}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Archive Confirm Dialog */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                onConfirm={() => { if (confirmAction) toggleArchive.mutate({ id: confirmAction.id, isActive: confirmAction.isActive === false }); }}
                title={confirmAction?.isActive === false ? `Restore "${confirmAction?.name}"?` : `Archive "${confirmAction?.name}"?`}
                description={confirmAction?.isActive === false ? "This item will be visible in the catalog again." : "This will hide the item from the public catalog. You can restore it later."}
                confirmText={confirmAction?.isActive === false ? "Restore" : "Archive"}
                variant={confirmAction?.isActive === false ? "warning" : "danger"}
                loading={toggleArchive.isPending}
            />
        </div>
    );
}
