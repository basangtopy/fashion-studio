"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, Eye, Search, X, Save, Upload } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonTable } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AdminCatalogStylesPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editStyle, setEditStyle] = useState(null);
    const [formData, setFormData] = useState({
        name: "", description: "", category: "", availableForModel1: true, availableForModel2: true,
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

    const createStyle = useMutation({
        mutationFn: async (payload) => {
            const { data } = await api.post("/styles", payload);
            return data;
        },
        onSuccess: () => {
            toast.success("Style created!");
            setShowCreate(false);
            setFormData({ name: "", description: "", category: "", availableForModel1: true, availableForModel2: true });
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const deleteStyle = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/styles/${id}`);
        },
        onSuccess: () => {
            toast.success("Style deleted");
            queryClient.invalidateQueries({ queryKey: ["admin-styles"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const styles = Array.isArray(data) ? data : [];

    const openCreate = () => {
        setFormData({ name: "", description: "", category: "", availableForModel1: true, availableForModel2: true });
        setShowCreate(true);
    };

    return (
        <div className="pb-20 lg:pb-0">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[#0D0D0D]">Styles Catalog</h1>
                <Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1">
                    <Plus size={14} /> Add Style
                </Button>
            </div>

            <div className="mb-6 relative max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                <Input type="text" placeholder="Search styles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-9 bg-white" />
            </div>

            {isLoading ? <SkeletonTable rows={4} cols={5} /> : styles.length === 0 ? (
                <EmptyState icon={Eye} title="No styles yet" description="Add your first style to the catalog." action={<Button onClick={openCreate} className="bg-[#C2185B] text-white hover:bg-[#A01548]">Add Style</Button>} />
            ) : (
                <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgba(0,0,0,0.06)] bg-[#FAFAFA]">
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Image</th>
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Name</th>
                                    <th className="text-left text-xs font-medium text-[#999] py-3 px-4">Category</th>
                                    <th className="text-center text-xs font-medium text-[#999] py-3 px-4">Models</th>
                                    <th className="text-right text-xs font-medium text-[#999] py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {styles.map((style) => (
                                    <tr key={style.id} className="border-b border-[rgba(0,0,0,0.03)] hover:bg-[#FAFAFA] transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="w-10 h-12 rounded-md overflow-hidden bg-[#F4F0F8] relative">
                                                {style.images?.[0] ? <Image src={style.images[0]} alt="" fill className="object-cover" /> : null}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 font-medium text-[#0D0D0D]">{style.name}</td>
                                        <td className="py-3 px-4 text-[#555]">{style.category || "—"}</td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex gap-1 justify-center">
                                                {style.availableForModel1 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F8E8F0] text-[#C2185B] font-medium">M1</span>}
                                                {style.availableForModel2 && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E3F2FD] text-[#1565C0] font-medium">M2</span>}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-1 justify-end">
                                                <TooltipProvider>
                                                    <Tooltip delayDuration={300}>
                                                        <TooltipTrigger asChild>
                                                            <Button variant="ghost" size="icon" onClick={() => deleteStyle.mutate(style.id)} className="h-8 w-8 text-[#C62828] hover:bg-[#FFEBEE] hover:text-[#B71C1C]">
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Delete Style</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-[#0D0D0D]">Add New Style</h3>
                                <button onClick={() => setShowCreate(false)}><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Name</label>
                                    <Input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-10 bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Category</label>
                                    <Input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="e.g. Ankara, Corporate" className="h-10 bg-white" />
                                </div>
                                <div>
                                    <label className="text-xs text-[#999] mb-1 block">Description</label>
                                    <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="resize-none bg-white" />
                                </div>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                        <Checkbox id="model1" checked={formData.availableForModel1} onCheckedChange={(checked) => setFormData({ ...formData, availableForModel1: checked })} />
                                        Model 1
                                    </label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                                        <Checkbox id="model2" checked={formData.availableForModel2} onCheckedChange={(checked) => setFormData({ ...formData, availableForModel2: checked })} />
                                        Model 2
                                    </label>
                                </div>
                            </div>
                            <Button onClick={() => createStyle.mutate(formData)} disabled={!formData.name || createStyle.isPending} className="w-full mt-4 bg-[#C2185B] text-white hover:bg-[#A01548] h-10 gap-2">
                                <Save size={14} /> {createStyle.isPending ? "Creating..." : "Create Style"}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
