"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MessageSquare, X, Send } from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { useScrollReveal } from "@/hooks/useAnimations";
import { SkeletonCard } from "@/components/shared/Skeleton";
import ImageUpload from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";

export default function TestimonialsPage() {
    const { isAuthenticated } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [ratingFilter, setRatingFilter] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ rating: 5, review: "" });
    const [newImageFiles, setNewImageFiles] = useState([]);
    const { ref, isVisible } = useScrollReveal();

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["testimonials"],
        queryFn: async ({ pageParam = 1 }) => {
            const { data } = await api.get("/testimonials", {
                params: { page: pageParam, limit: 12 }
            });
            // The backend returns standard pagination structure
            return data.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.page < lastPage?.pagination?.pages) {
                return lastPage.pagination.page + 1;
            }
            return undefined;
        }
    });

    const submitMutation = useMutation({
        mutationFn: async (payload) => {
            const formData = new FormData();
            formData.append("rating", payload.rating);
            formData.append("review", payload.review);
            if (newImageFiles[0]) {
                formData.append("reviews", newImageFiles[0]);
            }

            const { data } = await api.post("/testimonials", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Thank you!", "Your review has been submitted and is pending approval.");
            setShowForm(false);
            setFormData({ rating: 5, review: "" });
            setNewImageFiles([]);
            queryClient.invalidateQueries({ queryKey: ["testimonials"] });
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Could not submit review.");
        },
    });

    const testimonials = data?.pages.flatMap((page) => page?.testimonials || []) || [];
    const filtered = ratingFilter > 0
        ? testimonials.filter((t) => t.rating === ratingFilter)
        : testimonials;

    // Use global stats from the first page of the query, falling back to 0 if not yet loaded
    const firstPage = data?.pages?.[0];
    const totalReviews = firstPage?.globalTotal || 0;
    const avgRating = firstPage?.globalAvgRating
        ? Number(firstPage.globalAvgRating).toFixed(1)
        : "0.0";

    return (
        <div className="pt-[var(--nav-height)]">
            {/* Header */}
            <div className="bg-[#1A1A2E] py-12 lg:py-16">
                <div className="page-container">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">What Our Clients Say</h1>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold font-mono-data text-white">{avgRating}</span>
                            <div className="flex gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                        key={i}
                                        size={16}
                                        className={
                                            i < Math.round(Number(avgRating))
                                                ? "text-[#F9A825] fill-[#F9A825]"
                                                : "text-white/20"
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                        <span className="text-white/40">·</span>
                        <p className="text-white/60">{totalReviews} reviews</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="sticky top-[var(--nav-height)] z-30 bg-white border-b border-[rgba(0,0,0,0.06)] py-3">
                <div className="page-container flex items-center justify-between">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <Button
                            variant="ghost"
                            onClick={() => setRatingFilter(0)}
                            className={`px-4 py-1.5 h-auto rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:bg-[#E0E0E0] hover:text-[#555] ${ratingFilter === 0
                                ? "bg-[#C2185B] text-white hover:bg-[#C2185B] hover:text-white"
                                : "bg-[#F4F0F8] text-[#555]"
                                }`}
                        >
                            All
                        </Button>
                        {[5, 4, 3, 2, 1].map((r) => (
                            <Button
                                variant="ghost"
                                key={r}
                                onClick={() => setRatingFilter(r)}
                                className={`px-3 py-1.5 h-auto rounded-full text-sm font-medium flex items-center gap-1 transition-colors hover:bg-[#E0E0E0] hover:text-[#555] ${ratingFilter === r
                                    ? "bg-[#C2185B] text-white hover:bg-[#C2185B] hover:text-white"
                                    : "bg-[#F4F0F8] text-[#555]"
                                    }`}
                            >
                                {r} <Star size={12} className={ratingFilter === r ? "fill-white" : "fill-[#F9A825] text-[#F9A825]"} />
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Masonry Grid */}
            <div ref={ref} className="page-container py-8 lg:py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                        {filtered.map((testimonial, i) => (
                            <motion.div
                                key={testimonial.id}
                                initial={{ opacity: 0, y: 20, rotate: 0.5 }}
                                animate={isVisible ? { opacity: 1, y: 0, rotate: 0 } : {}}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className={`break-inside-avoid relative rounded-xl bg-white border border-[rgba(0,0,0,0.06)] ${testimonial.isFeatured
                                    ? "ring-2 ring-[#C2185B]/20 p-8 lg:p-10 text-base"
                                    : "p-6 lg:p-8"
                                    }`}
                            >
                                {/* Decorative quote */}
                                <span className={`absolute top-3 right-5 font-serif text-[#C2185B]/10 leading-none select-none ${testimonial.isFeatured ? "text-8xl" : "text-6xl"}`}>
                                    &ldquo;
                                </span>

                                {/* Stars */}
                                <div className="flex gap-0.5 mb-4">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <Star
                                            key={j}
                                            size={testimonial.isFeatured ? 20 : 16}
                                            className={
                                                j < testimonial.rating
                                                    ? "text-[#F9A825] fill-[#F9A825]"
                                                    : "text-[#E0E0E0]"
                                            }
                                        />
                                    ))}
                                </div>

                                <p className={`text-[#555] leading-relaxed mb-5 ${testimonial.isFeatured ? "text-base" : "text-sm"}`}>
                                    {testimonial.review}
                                </p>

                                {/* Optional Attached Garment Photo */}
                                {testimonial.photoUrl && (
                                    <div className="relative w-full h-48 sm:h-56 mb-5 rounded-lg overflow-hidden border border-[rgba(0,0,0,0.06)] bg-[#F4F0F8]">
                                        {/* blurred background */}
                                        <Image src={testimonial.photoUrl} alt={`Attached photo from ${testimonial.clientName}`} fill className="object-cover blur-xl scale-110 opacity-100" />
                                        <Image
                                            src={testimonial.photoUrl}
                                            alt={`Attached photo from ${testimonial.clientName}`}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#F8E8F0] flex items-center justify-center text-xs font-bold text-[#C2185B]">
                                            {(testimonial.clientName || "A").charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {testimonial.clientName}
                                            </p>
                                            {testimonial.source === "ADMIN_ADDED" && (
                                                <p className="text-[10px] text-[#999]">Verified by Studio</p>
                                            )}
                                        </div>
                                    </div>
                                    {testimonial.createdAt && (
                                        <p className="text-[11px] text-[#999]">
                                            {new Date(testimonial.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                        </p>
                                    )}
                                </div>

                                {testimonial.isFeatured && (
                                    <span className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full bg-[#F8E8F0] text-[#C2185B] font-semibold">
                                        Featured
                                    </span>
                                )}
                            </motion.div>
                        ))}

                        {/* Inline Skeleton Loaders when fetching next page */}
                        {isFetchingNextPage && (
                            <>
                                <div className="break-inside-avoid relative rounded-xl bg-white border border-[rgba(0,0,0,0.06)] p-6 lg:p-8 animate-pulse">
                                    <div className="flex gap-0.5 mb-4">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <div key={j} className="w-4 h-4 rounded-sm bg-[#F4F0F8]" />
                                        ))}
                                    </div>
                                    <div className="h-4 bg-[#F4F0F8] rounded w-full mb-2"></div>
                                    <div className="h-4 bg-[#F4F0F8] rounded w-5/6 mb-5"></div>
                                    <div className="flex items-center gap-2 mt-8">
                                        <div className="w-8 h-8 rounded-full bg-[#F4F0F8]"></div>
                                        <div className="flex flex-col gap-1">
                                            <div className="h-3 bg-[#F4F0F8] rounded w-20"></div>
                                            <div className="h-2 bg-[#F4F0F8] rounded w-16"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="break-inside-avoid relative rounded-xl bg-white border border-[rgba(0,0,0,0.06)] p-6 lg:p-8 animate-pulse">
                                    <div className="flex gap-0.5 mb-4">
                                        {Array.from({ length: 5 }).map((_, j) => (
                                            <div key={j} className="w-4 h-4 rounded-sm bg-[#F4F0F8]" />
                                        ))}
                                    </div>
                                    <div className="h-4 bg-[#F4F0F8] rounded w-[90%] mb-2"></div>
                                    <div className="h-4 bg-[#F4F0F8] rounded w-3/4 mb-5"></div>
                                    <div className="flex items-center gap-2 mt-8">
                                        <div className="w-8 h-8 rounded-full bg-[#F4F0F8]"></div>
                                        <div className="flex flex-col gap-1">
                                            <div className="h-3 bg-[#F4F0F8] rounded w-24"></div>
                                            <div className="h-2 bg-[#F4F0F8] rounded w-12"></div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Load More Button */}
                {hasNextPage && (
                    <div className="flex justify-center pt-8">
                        <Button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="px-8 py-3 h-auto rounded-full bg-[#1A1A2E] text-white text-sm font-medium hover:bg-[#0D0D0D] transition-colors disabled:opacity-70 flex items-center gap-2"
                        >
                            {isFetchingNextPage ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                "Load More Reviews"
                            )}
                        </Button>
                    </div>
                )}

                {/* CTA */}
                <div className="text-center mt-12">
                    {isAuthenticated ? (
                        <Button
                            onClick={() => setShowForm(true)}
                            className="inline-flex h-auto items-center gap-2 px-6 py-3 rounded-md bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors"
                        >
                            <MessageSquare size={16} />
                            Share Your Experience
                        </Button>
                    ) : (
                        <p className="text-sm text-[#999]">
                            <a href="/login" className="text-[#C2185B] font-semibold hover:underline">
                                Sign in
                            </a>{" "}
                            to leave a review.
                        </p>
                    )}
                </div>
            </div>

            {/* Review Submission Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowForm(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="bg-white rounded-xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-semibold text-[#0D0D0D]">Share Your Review</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="w-8 h-8 rounded-md hover:bg-[#F4F0F8]">
                                    <X size={18} className="text-[#999]" />
                                </Button>
                            </div>

                            {/* Star Rating */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-[#0D0D0D] mb-2 block">Rating</label>
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setFormData((prev) => ({ ...prev, rating: i + 1 }))}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={28}
                                                className={
                                                    i < formData.rating
                                                        ? "text-[#F9A825] fill-[#F9A825]"
                                                        : "text-[#E0E0E0]"
                                                }
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Review Text */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-[#0D0D0D] mb-2 block">Your Review</label>
                                <Textarea
                                    value={formData.review}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, review: e.target.value }))
                                    }
                                    placeholder="Tell us about your experience..."
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-[#0D0D0D] mb-2 block">Add a Photo (Optional)</label>
                                <ImageUpload
                                    existingImages={[]}
                                    newFiles={newImageFiles}
                                    onNewFilesChange={setNewImageFiles}
                                    onExistingImagesReorder={() => { }}
                                    onExistingImageDelete={() => { }}
                                    maxFiles={1}
                                />
                            </div>

                            <Button
                                onClick={() => submitMutation.mutate(formData)}
                                disabled={!formData.review.trim() || submitMutation.isPending}
                                className="w-full flex h-auto items-center justify-center gap-2 py-3 rounded-md bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors disabled:opacity-50"
                            >
                                <Send size={16} />
                                {submitMutation.isPending ? "Submitting..." : "Submit Review"}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
