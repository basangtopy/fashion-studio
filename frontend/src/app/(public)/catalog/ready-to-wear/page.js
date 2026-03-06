"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Search, ShoppingBag, Loader2 } from "lucide-react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/config/branding";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import useDebounce from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STOCK_STATUS = { IN_STOCK: { label: "In Stock", color: "#2E7D32", bg: "#E8F5E9" }, LOW_STOCK: { label: "Low Stock", color: "#E65100", bg: "#FFF3E0" }, OUT_OF_STOCK: { label: "Sold Out", color: "#B71C1C", bg: "#FFEBEE" } };

export default function ReadyToWearPage() {
    const [category, setCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 500);

    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteQuery({
        queryKey: ["ready-to-wear", category, debouncedSearch],
        queryFn: async ({ pageParam = 1 }) => {
            const params = { page: pageParam, limit: 12 };
            if (category !== "All") params.category = category;
            if (debouncedSearch) params.search = debouncedSearch;
            const { data } = await api.get("/ready-to-wear", { params });
            return data.data;
        },
        getNextPageParam: (lastPage) => {
            if (lastPage?.pagination?.currentPage < lastPage?.pagination?.totalPages) {
                return lastPage.pagination.currentPage + 1;
            }
            return undefined;
        }
    });

    const items = data?.pages.flatMap((page) => page?.items || []) || [];

    const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
        queryKey: ["ready-to-wear", "categories"],
        queryFn: async () => {
            const { data } = await api.get("/ready-to-wear/categories");
            return data.data?.categories || [];
        },
    });

    const dynamicCategories = ["All", ...(Array.isArray(categoriesData) ? categoriesData : [])];

    return (
        <div className="pt-[var(--nav-height)]">
            {/* Header */}
            <div className="bg-[#1A1A2E] py-12 lg:py-16">
                <div className="page-container">
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Ready-to-Wear</h1>
                    <p className="text-white/60">Pre-made garments crafted with care, ready for you.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="sticky top-[var(--nav-height)] z-30 bg-white border-b border-[rgba(0,0,0,0.06)] py-3">
                <div className="page-container flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar flex-1 min-w-0 w-full">
                        {isLoadingCategories ? (
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
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" />
                        <Input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 pr-3 h-[32px] text-sm border-[#E0E0E0] w-40 focus-visible:w-56 transition-all bg-white"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="page-container py-8 lg:py-12">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <EmptyState icon={ShoppingBag} title="No items found" description="Check back later for new additions." />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item, i) => {
                            const stock = STOCK_STATUS[item.stockStatus] || STOCK_STATUS.IN_STOCK;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, scale: 0.97 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    className="group rounded-xl overflow-hidden border border-[rgba(0,0,0,0.06)] card-hover bg-white"
                                >
                                    <Link href={`/catalog/ready-to-wear/${item.id}`}>
                                        <div className="relative aspect-[4/5] bg-[#F4F0F8] overflow-hidden">
                                            {item.images?.[0] ? (
                                                <Image src={item.images[0]} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8]" />
                                            )}
                                            {/* Stock badge */}
                                            <span
                                                className="absolute top-3 left-3 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                                                style={{ backgroundColor: stock.bg, color: stock.color }}
                                            >
                                                {stock.label}
                                            </span>
                                        </div>
                                        <div className="p-4">
                                            <h3 className="text-sm font-semibold text-[#0D0D0D] mb-1">{item.name}</h3>
                                            <p className="text-lg font-bold font-mono-data text-[#C2185B] mb-2">
                                                {formatCurrency(item.price)}
                                            </p>
                                            <div className="flex gap-1 flex-wrap">
                                                {(item.availableSizes || []).map((size) => (
                                                    <span key={size} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4F0F8] text-[#555]">
                                                        {size}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}

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
        </div>
    );
}
