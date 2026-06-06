"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Eye, ArrowRight, Loader2 } from "lucide-react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import useDebounce from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

export default function StylesCatalogPage() {
    const [category, setCategory] = useState("All");
    const [modelFilter, setModelFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);
    const [quickViewStyle, setQuickViewStyle] = useState(null);
    const [quickViewImageIdx, setQuickViewImageIdx] = useState(0);
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const handleOrderStyle = (styleId) => {
        if (!isAuthenticated) {
            // Redirect to login; on return the style detail page's useEffect
            // picks up action=orderStyle and auto-navigates to /client/orders/new
            const redirectURL = `/catalog/styles/${styleId}`;
            router.push(`/login?redirectURL=${encodeURIComponent(redirectURL)}&action=orderStyle`);
            return;
        }
        router.push(`/client/orders/new?styleId=${styleId}`);
    };

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["styles", category, modelFilter, debouncedSearch],
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: 12 };
            if (category !== "All") params.category = category;
            if (debouncedSearch) params.search = debouncedSearch;
            const { data } = await api.get("/styles", { params });
            return data.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.currentPage < lastPage?.pagination?.totalPages) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        }
    });

    const styles = data?.pages.flatMap((page) => page?.styles || []) || [];

    const filteredStyles = styles.filter((style) => {
        if (modelFilter === "model1") return style.availableForModel1;
        if (modelFilter === "model2") return style.availableForModel2;
        return true;
    });

    const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
        queryKey: ["styles", "categories"],
        queryFn: async () => {
            const { data } = await api.get("/styles/categories");
            return data.data?.categories || [];
        },
    });

    const dynamicCategories = ["All", ...(Array.isArray(categoriesData) ? categoriesData : [])];

    return (
        <div className="pt-[var(--nav-height)]">
            {/* Header */}
            <div className="bg-[#1A1A2E] py-12 lg:py-16">
                <div className="page-container">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Our Styles</h1>
                    <p className="text-white/60">Browse our curated collection and find your perfect look.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-[var(--nav-height)] z-30 bg-white border-b border-[rgba(0,0,0,0.06)] py-3">
                <div className="page-container">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {/* Category pills */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 w-full">
                            {isLoadingCategories ? (
                                // Category Skeletons
                                Array.from({ length: 5 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="animate-pulse bg-[#F4F0F8] rounded-full h-[32px] w-[80px] sm:w-[100px] shrink-0"
                                    />
                                ))
                            ) : (
                                dynamicCategories.map((cat) => (
                                    <Button
                                        variant="ghost"
                                        key={cat}
                                        onClick={() => setCategory(cat)}
                                        className={`px-4 py-1.5 h-auto rounded-full text-sm font-medium whitespace-nowrap transition-colors hover:bg-[#E0E0E0] hover:text-[#555] ${category === cat
                                            ? "bg-[#C2185B] text-white hover:bg-[#C2185B] hover:text-white"
                                            : "bg-[#F4F0F8] text-[#555] hover:bg-[#F8E8F0]"
                                            }`}
                                    >
                                        {cat}
                                    </Button>
                                ))
                            )}
                        </div>

                        {/* Model filter toggles */}
                        <div className="flex items-center gap-2">
                            {[
                                { value: "all", label: "All" },
                                { value: "model1", label: "M1" },
                                { value: "model2", label: "M2" },
                            ].map((opt) => (
                                <Button
                                    variant="ghost"
                                    key={opt.value}
                                    onClick={() => setModelFilter(opt.value)}
                                    className={`px-3 py-1.5 h-auto rounded-md text-xs font-semibold transition-colors hover:bg-[#E0E0E0] hover:text-[#555] ${modelFilter === opt.value
                                        ? "bg-[#1A1A2E] text-white hover:bg-[#1A1A2E] hover:text-white"
                                        : "bg-[#F4F0F8] text-[#555] hover:bg-[#E0E0E0]"
                                        }`}
                                >
                                    {opt.label}
                                </Button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                            <Input
                                type="text"
                                placeholder="Search styles..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 h-[32px] text-sm border-[#E0E0E0] w-40 focus-visible:w-56 transition-all bg-white"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Results Grid */}
            <div className="page-container py-8 lg:py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : filteredStyles.length === 0 ? (
                    <EmptyState
                        icon={Search}
                        title="No styles found"
                        description="Try adjusting your filters or search terms."
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStyles.map((style, i) => (
                            <motion.div
                                key={style.id}
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                className="group rounded-xl overflow-hidden border border-[rgba(0,0,0,0.06)] card-hover bg-white"
                            >
                                {/* Image */}
                                <div className="relative aspect-[4/5] bg-[#F4F0F8] overflow-hidden">
                                    {style.images?.[0] ? (
                                        <>
                                            {/* blurred background */}
                                            <Image src={style.images[0]} alt={style.name} fill className="object-cover blur-xl scale-110 opacity-100" />
                                            <Image
                                                src={style.images[0]}
                                                alt={style.name}
                                                fill
                                                className="object-contain group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </>
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8] flex items-center justify-center">
                                            <span className="text-sm text-[#999]">Style Image</span>
                                        </div>
                                    )}

                                    {/* Quick View overlay */}
                                    <div className="absolute inset-0 bg-black/0 [@media(hover:hover)]:group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                                        <Button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setQuickViewStyle(style);
                                                setQuickViewImageIdx(0);
                                            }}
                                            variant="secondary"
                                            className="pointer-events-auto px-4 py-2 h-auto rounded-md bg-white text-[#0D0D0D] text-sm font-semibold opacity-0 hover:bg-[#F4F0F8] [@media(hover:hover)]:group-hover:opacity-100 transform translate-y-2 [@media(hover:hover)]:group-hover:translate-y-0 transition-all duration-300 flex items-center gap-2 shadow-sm"
                                        >
                                            <Eye size={14} />
                                            Quick View
                                        </Button>
                                    </div>

                                    {/* Mobile/Touch Quick View Button */}
                                    <Button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setQuickViewStyle(style);
                                            setQuickViewImageIdx(0);
                                        }}
                                        variant="secondary"
                                        size="icon"
                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white text-[#0D0D0D] shadow-md flex items-center justify-center hover:bg-[#F4F0F8] [@media(hover:hover)]:hidden z-10"
                                        aria-label="Quick View"
                                    >
                                        <Eye size={14} />
                                    </Button>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <Link href={`/catalog/styles/${style.id}`}>
                                        <h3 className="text-sm font-semibold text-[#0D0D0D] mb-1 hover:text-[#C2185B] transition-colors">
                                            {style.name}
                                        </h3>
                                    </Link>
                                    <p className="text-xs text-[#999] mb-2">{style.category}</p>
                                    <div className="flex gap-1.5">
                                        {style.availableForModel1 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F8E8F0] text-[#C2185B] font-medium">
                                                M1
                                            </span>
                                        )}
                                        {style.availableForModel2 && (
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E3F2FD] text-[#1565C0] font-medium">
                                                M2
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}

                        {/* Inline Skeleton Loaders when fetching next page */}
                        {isFetchingNextPage && (
                            <>
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </>
                        )}
                    </div>
                )}

                {/* Load More Button */}
                {hasNextPage && (
                    <div className="flex justify-center pt-12">
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
                                "Load More"
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Quick View Modal */}
            <AnimatePresence>
                {quickViewStyle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => { setQuickViewStyle(null); setQuickViewImageIdx(0); }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="lookbook-lb-inner"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Image Panel */}
                            <div className="lookbook-lb-img-wrap">
                                {quickViewStyle.images?.[quickViewImageIdx] || quickViewStyle.images?.[0] ? (
                                    <>
                                        {/* blurred background */}
                                        <Image src={quickViewStyle.images[quickViewImageIdx] || quickViewStyle.images[0]} alt={quickViewStyle.name} fill className="object-cover blur-xl scale-110 opacity-100" />
                                        <Image
                                            src={quickViewStyle.images[quickViewImageIdx] || quickViewStyle.images[0]}
                                            alt={quickViewStyle.name}
                                            fill
                                            className="object-contain"
                                        />
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8]" />
                                )}
                            </div>

                            {/* Info Panel */}
                            <div className="lookbook-lb-info relative">
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mb-4">
                                    <h3 className="text-xl font-bold text-[#0D0D0D] mb-2 pr-6">{quickViewStyle.name}</h3>
                                    <p className="text-xs text-[#C2185B] mb-3">{quickViewStyle.category}</p>

                                    {/* Thumbnails Gallery */}
                                    {quickViewStyle.images?.length > 1 && (
                                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4">
                                            {quickViewStyle.images.map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setQuickViewImageIdx(idx)}
                                                    className={`relative w-16 h-20 rounded-md overflow-hidden shrink-0 border-2 transition-all ${quickViewImageIdx === idx ? 'border-[#C2185B]' : 'border-transparent hover:opacity-80'}`}
                                                >
                                                    <Image src={img} alt={`${quickViewStyle.name} thumbnail ${idx + 1}`} fill className="object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-sm text-[#555] mb-6">{quickViewStyle.description}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setQuickViewStyle(null);
                                        setQuickViewImageIdx(0);
                                        handleOrderStyle(quickViewStyle.id);
                                    }}
                                    className="flex items-center justify-center gap-2 w-full mt-auto py-3 rounded-md bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors shrink-0"
                                >
                                    Order This Style
                                    <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setQuickViewStyle(null); setQuickViewImageIdx(0); }}
                                className="lookbook-lb-close w-10 h-10 rounded-full hover:bg-[#F4F0F8] right-4 top-4 absolute text-[#555] bg-white border border-[#E0E0E0] shadow-sm z-50"
                            >
                                <X size={20} />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
