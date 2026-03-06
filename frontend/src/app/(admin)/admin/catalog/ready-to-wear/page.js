"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Search, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/config/branding";
import { useToast } from "@/components/ui/toaster";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AdminRTWPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", category: "", price: "", availableSizes: "", stock: "" });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-rtw", searchQuery],
        queryFn: async () => {
            const params = {};
            if (searchQuery) params.search = searchQuery;
            const { data } = await api.get("/ready-to-wear", { params });
            return data.data?.items || data.data?.readyToWear || data.data || [];
        },
    });

    const createItem = useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post("/ready-to-wear", payload);
            return data;
        },
        onSuccess: () => {
            toast.success("Ready-to-wear item created");
            queryClient.invalidateQueries({ queryKey: ["admin-rtw"] });
            setShowModal(false);
            setForm({ name: "", description: "", category: "", price: "", availableSizes: "", stock: "" });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to create"),
    });

    const deleteItem = useMutation({
        mutationFn: async (id) => {
            await api.delete?.(`/ready-to-wear/${id}`) || await api.put(`/ready-to-wear/${id}`, { isActive: false });
        },
        onSuccess: () => {
            toast.success("Item removed");
            queryClient.invalidateQueries({ queryKey: ["admin-rtw"] });
        },
        onError: () => toast.error("Error", "Failed to delete"),
    });

    const items = Array.isArray(data) ? data : [];

    const handleCreate = (e) => {
        e.preventDefault();
        createItem.mutate({
            name: form.name,
            description: form.description,
            category: form.category,
            price: Number(form.price),
            availableSizes: form.availableSizes.split(",").map((s) => s.trim()).filter(Boolean),
            stock: Number(form.stock) || 0,
        });
    };

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Ready-to-Wear</h1>
                    <p className="text-sm text-[#999]">{items.length} items</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-2">
                    <Plus size={16} /> Add Item
                </Button>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 bg-white" />
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-[200px]" />)}
                </div>
            ) : items.length === 0 ? (
                <div className="p-12 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <ShoppingBag size={28} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No ready-to-wear items yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden group">
                            <div className="relative h-40 bg-[#F4F0F8]">
                                {item.images?.[0] ? (
                                    <Image src={item.images[0]} alt={item.name} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ShoppingBag size={24} className="text-[#999]" />
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <p className="text-sm font-semibold text-[#0D0D0D] mb-1">{item.name}</p>
                                <p className="text-xs text-[#999] mb-2">{item.category || "Uncategorized"}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-bold text-[#C2185B]">{formatCurrency(item.price)}</p>
                                    <div className="flex gap-1">
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-[#F4F0F8] hover:bg-[#E0E0E0] text-[#555]">
                                                        <Pencil size={12} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Edit Item</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                        <TooltipProvider>
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <Button variant="ghost" size="icon" onClick={() => deleteItem.mutate(item.id)} className="h-7 w-7 bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] hover:text-[#B71C1C]">
                                                        <Trash2 size={12} />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent><p>Delete Item</p></TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                                <div className="flex gap-1 mt-2">
                                    {(item.availableSizes || []).map((size) => (
                                        <span key={size} className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4F0F8] text-[#555]">{size}</span>
                                    ))}
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
                        <h3 className="text-lg font-bold text-[#0D0D0D] mb-4">New Ready-to-Wear Item</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            <Input required placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                                className="h-10 bg-white" />
                            <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="resize-none h-20 bg-white" />
                            <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="h-10 bg-white" />
                            <div className="grid grid-cols-2 gap-3">
                                <Input required type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className="h-10 bg-white" />
                                <Input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                                    className="h-10 bg-white" />
                            </div>
                            <Input placeholder="Sizes (comma-separated, e.g. S,M,L)" value={form.availableSizes} onChange={(e) => setForm({ ...form, availableSizes: e.target.value })}
                                className="h-10 bg-white" />
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} className="flex-1 text-[#555]">Cancel</Button>
                                <Button type="submit" disabled={createItem.isPending} className="flex-1 bg-[#C2185B] text-white hover:bg-[#A01548]">Create</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
