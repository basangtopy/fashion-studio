"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

const SIZE_VARIANTS = [
    "lookbook-item-landscape",
    "lookbook-item-portrait",
    "lookbook-item-square",
    "lookbook-item-wide",
    "lookbook-item-tall",
];

const GRADIENT_POOL = [
    "linear-gradient(135deg, #F8E8F0 0%, #F4F0F8 100%)",
    "linear-gradient(160deg, #F4F0F8 0%, #E8E0F0 100%)",
    "linear-gradient(45deg, #F8E8F0 0%, #EDE4F8 100%)",
    "linear-gradient(170deg, #F0ECF8 0%, #F8E8F0 100%)",
    "linear-gradient(120deg, #F4F0F8 0%, #F8E8F0 100%)",
    "linear-gradient(200deg, #EDE4F8 0%, #F4F0F8 100%)",
    "linear-gradient(30deg, #F8E8F0 0%, #F4F0F8 100%)",
    "linear-gradient(155deg, #F0ECF8 0%, #F8E8F0 100%)",
    "linear-gradient(100deg, #F4F0F8 0%, #EDE4F8 100%)",
    "linear-gradient(220deg, #F8E8F0 0%, #F4F0F8 100%)",
    "linear-gradient(140deg, #F0ECF8 0%, #EDE4F8 100%)",
    "linear-gradient(70deg, #F8E8F0 0%, #F4F0F8 100%)",
];

export default function PortfolioPage() {
    const [category, setCategory] = useState("All");
    const [lightboxItem, setLightboxItem] = useState(null);
    const [lightboxIdx, setLightboxIdx] = useState(0);
    const [lightboxImageIdx, setLightboxImageIdx] = useState(0);
    const scrollRef = useRef(null);
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, scrollLeft: 0 });

    const { data: items = [], isLoading } = useQuery({
        queryKey: ["portfolio", category],
        queryFn: async () => {
            const params = { limit: 100 }; // Fetch a large number to ensure all items are shown grouped
            if (category !== "All") params.category = category;
            const { data } = await api.get("/portfolio", { params });
            // Support both old array format and new pagination object format gracefully
            return data.data?.entries || data.data?.items || data.data || [];
        },
    });

    const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
        queryKey: ["portfolio", "categories"],
        queryFn: async () => {
            const { data } = await api.get("/portfolio/categories");
            return data.data?.categories || [];
        },
    });

    const dynamicCategories = ["All", ...(Array.isArray(categoriesData) ? categoriesData : [])];

    // Group items by category
    const groupedItems = useMemo(() => {
        if (category !== "All") return [{ category, items }];

        const groups = {};
        items.forEach((item) => {
            const cat = item.category || "Uncategorised";
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(item);
        });
        return Object.entries(groups).map(([cat, catItems]) => ({
            category: cat,
            items: catItems,
        }));
    }, [items, category]);

    // Flat list for lightbox navigation
    const flatItems = useMemo(() => items, [items]);

    // Drag-to-scroll handlers
    const onMouseDown = useCallback((e) => {
        const el = scrollRef.current;
        if (!el) return;
        isDragging.current = true;
        dragStart.current = { x: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
        el.style.cursor = "grabbing";
    }, []);

    const onMouseUp = useCallback(() => {
        isDragging.current = false;
        if (scrollRef.current) scrollRef.current.style.cursor = "";
    }, []);

    const onMouseMove = useCallback((e) => {
        if (!isDragging.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        scrollRef.current.scrollLeft = dragStart.current.scrollLeft - (x - dragStart.current.x) * 1.4;
    }, []);

    // Lightbox
    const openLightbox = useCallback(
        (item) => {
            const idx = flatItems.findIndex((fi) => fi.id === item.id);
            setLightboxItem(item);
            setLightboxIdx(idx >= 0 ? idx : 0);
            setLightboxImageIdx(0);
        },
        [flatItems]
    );

    const closeLightbox = useCallback(() => {
        setLightboxItem(null);
        setLightboxImageIdx(0);
    }, []);

    const navigateLightbox = useCallback(
        (dir) => {
            const newIdx = (lightboxIdx + dir + flatItems.length) % flatItems.length;
            setLightboxIdx(newIdx);
            setLightboxItem(flatItems[newIdx]);
            setLightboxImageIdx(0);
        },
        [lightboxIdx, flatItems]
    );

    // Keyboard navigation for lightbox
    useEffect(() => {
        if (!lightboxItem) return;
        const handler = (e) => {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") navigateLightbox(-1);
            if (e.key === "ArrowRight") navigateLightbox(1);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [lightboxItem, closeLightbox, navigateLightbox]);

    // Lock body scroll when lightbox open
    useEffect(() => {
        document.body.style.overflow = lightboxItem ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [lightboxItem]);

    return (
        <div className="pt-[var(--nav-height)]">
            {/* Header */}
            <div className="bg-[#1A1A2E] py-10 sm:py-12 lg:py-16">
                <div className="page-container flex flex-col sm:flex-row sm:items-end justify-between gap-6 sm:gap-8">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                            Our Portfolio
                        </h1>
                        <p className="text-white/60">
                            A curated showcase of garments we&apos;ve brought to life — each piece tells a story of craft and care.
                        </p>
                    </div>
                    <div className="lookbook-scroll-hint hidden sm:inline-flex flex-shrink-0">
                        <span />
                        Scroll to explore
                    </div>
                </div>
            </div>

            {/* ── FILTER BAR — consistent with other pages ── */}
            <div className="sticky top-[var(--nav-height)] z-30 bg-white border-b border-[rgba(0,0,0,0.06)] py-3">
                <div className="page-container">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
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
                </div>
            </div>

            {/* ── HORIZONTAL LOOKBOOK SCROLL ── */}
            {isLoading ? (
                <div
                    className="lookbook-wrap"
                    ref={scrollRef}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onMouseMove={onMouseMove}
                >
                    <div className="lookbook-track">
                        {Array.from({ length: 8 }).map((_, i) => {
                            const sizeClass = SIZE_VARIANTS[i % SIZE_VARIANTS.length];
                            return (
                                <div key={i} style={{ display: "contents" }}>
                                    {i > 0 && <div className="lookbook-spacer-sm" />}
                                    <div
                                        className={`lookbook-item ${sizeClass} animate-pulse bg-[#F4F0F8] rounded-2xl`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : items.length === 0 ? (
                <div className="page-container py-16">
                    <EmptyState
                        icon={Maximize2}
                        title="No portfolio items yet"
                        description="Check back soon for new additions to our portfolio."
                    />
                </div>
            ) : (
                <div
                    className="lookbook-wrap"
                    ref={scrollRef}
                    onMouseDown={onMouseDown}
                    onMouseUp={onMouseUp}
                    onMouseLeave={onMouseUp}
                    onMouseMove={onMouseMove}
                >
                    <div className="lookbook-track">
                        {groupedItems.map((group, gi) => {
                            // Global item counter for consistent sizing
                            let globalOffset = 0;
                            for (let k = 0; k < gi; k++) {
                                globalOffset += groupedItems[k].items.length;
                            }

                            return (
                                <div key={group.category} style={{ display: "contents" }}>
                                    {/* Category Divider */}
                                    {category === "All" && (
                                        <div className="lookbook-cat-divider">
                                            <span className="lookbook-cat-divider-label">
                                                {group.category}
                                            </span>
                                        </div>
                                    )}

                                    {/* Items in this group */}
                                    {group.items.map((item, i) => {
                                        const globalIndex = globalOffset + i;
                                        const sizeClass =
                                            SIZE_VARIANTS[globalIndex % SIZE_VARIANTS.length];
                                        const gradient =
                                            GRADIENT_POOL[globalIndex % GRADIENT_POOL.length];
                                        const num = String(globalIndex + 1).padStart(2, "0");

                                        return (
                                            <div key={item.id} style={{ display: "contents" }}>
                                                {i > 0 && <div className="lookbook-spacer-sm" />}
                                                <motion.div
                                                    className={`lookbook-item ${sizeClass}`}
                                                    initial={{ opacity: 0, x: 30 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{
                                                        duration: 0.5,
                                                        delay: globalIndex * 0.06,
                                                    }}
                                                    onClick={() => openLightbox(item)}
                                                >
                                                    {/* Image or gradient placeholder */}
                                                    {item.images?.[0] ? (
                                                        <div
                                                            className="lookbook-item-ph"
                                                            style={{ background: gradient }}
                                                        >
                                                            <Image
                                                                src={item.images[0]}
                                                                alt={
                                                                    item.title ||
                                                                    item.description ||
                                                                    "Portfolio piece"
                                                                }
                                                                fill
                                                                className="lookbook-item-img"
                                                                sizes="(max-width: 768px) 80vw, 680px"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className="lookbook-item-ph"
                                                            style={{ background: gradient }}
                                                        >
                                                            <div className="lookbook-item-ph-num">
                                                                {num}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Hover Overlay */}
                                                    <div className="lookbook-item-overlay">
                                                        <div className="lookbook-item-expand">
                                                            <Maximize2
                                                                size={14}
                                                                color="white"
                                                            />
                                                        </div>
                                                        <div className="lookbook-item-cat">
                                                            {item.category}
                                                        </div>
                                                        <div className="lookbook-item-title">
                                                            {item.title ||
                                                                item.description?.slice(0, 60) ||
                                                                "Studio Creation"}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            </div>
                                        );
                                    })}

                                    {/* Spacer between groups */}
                                    {gi < groupedItems.length - 1 && (
                                        <div className="lookbook-spacer" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── LIGHTBOX MODAL ── */}
            <AnimatePresence>
                {lightboxItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="lookbook-lightbox"
                        onClick={closeLightbox}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 32, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 32, scale: 0.97 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="lookbook-lb-inner"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Image Panel */}
                            <div className="lookbook-lb-img-wrap">
                                {lightboxItem.images?.length > 0 ? (
                                    <Image
                                        key={lightboxItem.images[lightboxImageIdx] || lightboxItem.images[0]}
                                        src={lightboxItem.images[lightboxImageIdx] || lightboxItem.images[0]}
                                        alt={lightboxItem.title || ""}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        style={{
                                            background:
                                                GRADIENT_POOL[
                                                lightboxIdx % GRADIENT_POOL.length
                                                ],
                                        }}
                                    >
                                        <span className="lookbook-lb-placeholder-num">
                                            {String(lightboxIdx + 1).padStart(2, "0")}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Info Panel */}
                            <div className="lookbook-lb-info">
                                <div>
                                    <div className="lookbook-lb-eyebrow">
                                        {lightboxItem.category}
                                    </div>
                                    <div className="lookbook-lb-title">
                                        {lightboxItem.title || "Studio Creation"}
                                    </div>
                                    <div className="lookbook-lb-desc">
                                        {lightboxItem.description ||
                                            "A beautifully crafted piece from our studio, made with intention and care."}
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {lightboxItem.images?.length > 1 && (
                                        <div className="lookbook-lb-thumbs">
                                            {lightboxItem.images.map((img, imgI) => (
                                                <button
                                                    key={imgI}
                                                    className={`lookbook-lb-thumb ${imgI === lightboxImageIdx ? "active" : ""
                                                        }`}
                                                    onClick={() => setLightboxImageIdx(imgI)}
                                                    aria-label={`View image ${imgI + 1}`}
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`${lightboxItem.title || "Portfolio"} — image ${imgI + 1}`}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover"
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="lookbook-lb-nav">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="lookbook-lb-btn w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                            onClick={() => navigateLightbox(-1)}
                                            aria-label="Previous item"
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <span className="lookbook-lb-count">
                                            {lightboxIdx + 1} / {flatItems.length}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="lookbook-lb-btn w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                            onClick={() => navigateLightbox(1)}
                                            aria-label="Next item"
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="lookbook-lb-close w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                                onClick={closeLightbox}
                                aria-label="Close lightbox"
                            >
                                <X size={18} />
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
