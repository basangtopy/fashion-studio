"use client";

import { useState } from "react";
import { Star, CheckCircle, XCircle, MessageSquare, Plus, X, Save, Loader2, User } from "lucide-react";
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import StatusPill from "@/components/shared/StatusPill";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import StarRatingInput from "@/components/shared/StarRatingInput";
import { SkeletonCard } from "@/components/shared/Skeleton";
import ImageUpload from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";

const TABS = ["PENDING", "APPROVED", "REJECTED"];

export default function AdminTestimonialsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("PENDING");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // { id, action: 'approve' | 'reject' }

    // Create form state
    const [formData, setFormData] = useState({
        clientName: "", rating: 0, review: "", isFeatured: false,
    });
    const [newImageFiles, setNewImageFiles] = useState([]);

    // Fetch testimonials
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["admin-testimonials", activeTab],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get("/testimonials/admin", {
                params: { status: activeTab, page: pageParam, limit: 12 }
            });
            return data.data || {};
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
                return lastPage.pagination.page + 1;
            }
            return undefined;
        }
    });

    // Update status mutation
    const updateStatus = useMutation({
        mutationFn: async ({ id, status, isFeatured }) => {
            const body = {};
            if (status) body.status = status;
            if (typeof isFeatured === "boolean") body.isFeatured = isFeatured;
            const { data } = await api.put(`/testimonials/admin/${id}`, body);
            return data;
        },
        onSuccess: (_, { status, isFeatured }) => {
            if (status === "APPROVED") toast.success("Testimonial approved");
            else if (status === "REJECTED") toast.success("Testimonial rejected");
            else if (typeof isFeatured === "boolean") toast.success(isFeatured ? "Marked as featured" : "Removed from featured");
            setConfirmAction(null);
            queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        },
        onError: (err) => { toast.error("Error", err.response?.data?.message || "Action failed"); setConfirmAction(null); },
    });

    // Create testimonial mutation
    const createMutation = useMutation({
        mutationFn: async () => {
            const fd = new FormData();
            fd.append("clientName", formData.clientName);
            fd.append("rating", formData.rating);
            fd.append("review", formData.review);
            fd.append("isFeatured", String(formData.isFeatured));
            if (newImageFiles[0]) {
                fd.append("reviews", newImageFiles[0]);
            }

            const { data } = await api.post("/testimonials/admin", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Testimonial created!");
            setShowCreateForm(false);
            setFormData({ clientName: "", rating: 0, review: "", isFeatured: false });
            setNewImageFiles([]);
            queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed."),
    });

    const testimonials = data?.pages.flatMap((page) => page?.testimonials || []) || [];

    const handleConfirmAction = () => {
        if (!confirmAction) return;
        updateStatus.mutate({ id: confirmAction.id, status: confirmAction.action === "approve" ? "APPROVED" : "REJECTED" });
    };

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D0D0D]">Testimonials</h1>
                    <p className="text-sm text-[#999]">Review and moderate client testimonials</p>
                </div>
                <Button onClick={() => setShowCreateForm(true)} className="bg-[#C2185B] text-white hover:bg-[#A01548] gap-1.5">
                    <Plus size={14} /> Create Testimonial
                </Button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1 max-w-md">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 px-3 rounded-md text-sm font-medium capitalize transition-all duration-200 ${activeTab === tab
                            ? "bg-white text-[#0D0D0D] shadow-sm"
                            : "text-[#999] hover:text-[#555]"
                            }`}
                    >
                        {tab.toLowerCase()}
                    </button>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-[140px]" />)}
                </div>
            ) : testimonials.length === 0 ? (
                <div className="p-12 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <MessageSquare size={28} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No {activeTab.toLowerCase()} testimonials.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {testimonials.map((t) => (
                        <div key={t.id} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">

                                    <div className="w-9 h-9 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {t.clientName?.charAt(0) || t.user?.fullName?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-[#0D0D0D]">{t.clientName || t.user?.fullName || "Anonymous"}</p>
                                            {t.isFeatured && (
                                                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FF6F00]/10 text-[#FF6F00] font-bold flex items-center gap-0.5">
                                                    <Star size={8} fill="currentColor" /> FEATURED
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} size={12} className={i < t.rating ? "text-[#F9A825] fill-[#F9A825]" : "text-[#E0E0E0]"} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Toggle Featured */}
                                    <button
                                        onClick={() => updateStatus.mutate({ id: t.id, isFeatured: !t.isFeatured })}
                                        title={t.isFeatured ? "Remove from featured" : "Mark as featured"}
                                        className={`p-1.5 rounded-lg transition-all duration-200 ${t.isFeatured ? "text-[#FF6F00] hover:bg-[#FF6F00]/10" : "text-[#E0E0E0] hover:text-[#FF6F00] hover:bg-[#FF6F00]/5"}`}
                                    >
                                        <Star size={16} fill={t.isFeatured ? "currentColor" : "none"} />
                                    </button>
                                    <p className="text-xs text-[#999]">{new Date(t.createdAt).toLocaleDateString("en-NG")}</p>
                                </div>
                            </div>

                            <p className="text-sm text-[#555] leading-relaxed mb-4">{t.review || t.content}</p>

                            {/* Optional Garment Image */}
                            {t.photoUrl && (
                                <div className="relative w-48 h-48 sm:h-56 mb-4 rounded-lg overflow-hidden border border-[rgba(0,0,0,0.06)] bg-[#F4F0F8]">
                                    {/* blurred background */}
                                    <Image src={t.photoUrl} alt={`Attached photo from ${t.clientName || 'Anonymous'}`} fill className="object-cover blur-xl scale-110 opacity-100" />
                                    <Image
                                        src={t.photoUrl}
                                        alt={`Attached photo from ${t.clientName || 'Anonymous'}`}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    />
                                </div>
                            )}

                            {/* Actions — different per tab */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {activeTab === "PENDING" && (
                                    <>
                                        <button onClick={() => setConfirmAction({ id: t.id, action: "approve", name: t.clientName || "this testimonial" })}
                                            disabled={updateStatus.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold hover:bg-[#C8E6C9] transition-colors">
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                        <button onClick={() => setConfirmAction({ id: t.id, action: "reject", name: t.clientName || "this testimonial" })}
                                            disabled={updateStatus.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFEBEE] text-[#C62828] text-xs font-semibold hover:bg-[#FFCDD2] transition-colors">
                                            <XCircle size={14} /> Reject
                                        </button>
                                    </>
                                )}
                                {activeTab === "APPROVED" && (
                                    <div className="flex items-center gap-2">
                                        <StatusPill status="APPROVED" size="small" />
                                        <button onClick={() => setConfirmAction({ id: t.id, action: "reject", name: t.clientName || "this testimonial" })}
                                            className="text-xs text-[#C62828] font-medium hover:underline">
                                            Reject
                                        </button>
                                    </div>
                                )}
                                {activeTab === "REJECTED" && (
                                    <div className="flex items-center gap-2">
                                        <StatusPill status="REJECTED" size="small" />
                                        <button onClick={() => updateStatus.mutate({ id: t.id, status: "APPROVED" })}
                                            className="text-xs text-[#C2185B] font-medium hover:underline">
                                            Approve instead
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Inline Skeleton Loaders when fetching next page */}
                    {isFetchingNextPage && (
                        <>
                            <SkeletonCard className="h-[140px]" />
                            <SkeletonCard className="h-[140px]" />
                        </>
                    )}
                </div>
            )}

            {/* Load More Button */}
            {hasNextPage && (
                <div className="flex justify-center mt-8">
                    <Button
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        variant="outline"
                        className="border-[#C2185B] text-[#C2185B] hover:bg-[#C2185B]/5 gap-2 h-11 px-6 rounded-md"
                    >
                        {isFetchingNextPage ? (
                            <><Loader2 size={14} className="animate-spin" /> Loading…</>
                        ) : (
                            "Load More"
                        )}
                    </Button>
                </div>
            )}

            {/* Create Testimonial Modal */}
            <AnimatePresence>
                {showCreateForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowCreateForm(false)}>
                        <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="bg-white rounded-xl max-w-[480px] w-full p-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
                            onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="text-lg font-bold text-[#0D0D0D]">Create Testimonial</h3>
                                <button onClick={() => setShowCreateForm(false)} className="p-1 rounded-full hover:bg-[#F4F0F8] transition-colors">
                                    <X size={18} className="text-[#999]" />
                                </button>
                            </div>
                            <p className="text-xs text-[#999] mb-5">Manually add a testimonial on behalf of a client. It will be auto-approved.</p>

                            <div className="space-y-5">
                                {/* Client Name */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Client Name *</label>
                                    <Input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} className="h-11 bg-white" placeholder="Full name" />
                                </div>

                                {/* Rating */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Rating *</label>
                                    <StarRatingInput value={formData.rating} onChange={(rating) => setFormData({ ...formData, rating })} size={24} />
                                </div>

                                {/* Review */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Review *</label>
                                    <Textarea value={formData.review} onChange={(e) => setFormData({ ...formData, review: e.target.value })} rows={4} className="resize-none bg-white" placeholder="Write the client's testimonial (min 10 characters)…" />
                                    <p className="text-[10px] text-[#999] mt-1">{formData.review.length}/1000</p>
                                </div>

                                {/* Photo URL */}
                                <div>
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Photo (optional)</label>
                                    <ImageUpload
                                        existingImages={[]}
                                        newFiles={newImageFiles}
                                        onNewFilesChange={setNewImageFiles}
                                        onExistingImagesReorder={() => { }}
                                        onExistingImageDelete={() => { }}
                                        maxFiles={1}
                                    />
                                </div>

                                {/* Featured toggle */}
                                <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-[rgba(0,0,0,0.06)] hover:bg-[#FAFAFA] transition-colors">
                                    <div>
                                        <p className="text-sm font-medium text-[#0D0D0D]">Featured</p>
                                        <p className="text-[10px] text-[#999]">Show prominently on the website</p>
                                    </div>
                                    <Switch checked={formData.isFeatured} onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })} />
                                </label>
                            </div>

                            <Button onClick={() => createMutation.mutate()}
                                disabled={!formData.clientName || formData.rating < 1 || formData.review.length < 10 || createMutation.isPending}
                                className="w-full mt-5 bg-[#C2185B] text-white hover:bg-[#A01548] h-11 gap-2">
                                {createMutation.isPending ? (<><Loader2 size={14} className="animate-spin" /> Creating…</>) : (<><Save size={14} /> Create Testimonial</>)}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirm Dialog for Approve/Reject */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
                onConfirm={handleConfirmAction}
                title={confirmAction?.action === "approve" ? "Approve this testimonial?" : "Reject this testimonial?"}
                description={confirmAction?.action === "approve"
                    ? `"${confirmAction?.name}"'s testimonial will be visible on the website.`
                    : `"${confirmAction?.name}"'s testimonial will be hidden from the website.`
                }
                confirmText={confirmAction?.action === "approve" ? "Approve" : "Reject"}
                variant={confirmAction?.action === "approve" ? "warning" : "danger"}
                loading={updateStatus.isPending}
            />
        </div>
    );
}
