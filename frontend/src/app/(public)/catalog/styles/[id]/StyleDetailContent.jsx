"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { StyleDetailSkeleton } from "@/components/shared/Skeleton";
import { CatalogItemNotFound } from "@/components/shared/EmptyStates";
import { Button } from "@/components/ui/button";

// Suspense boundary — required because useSearchParams() is called inside
export default function StyleDetailPage({ initialStyle = null }) {
    return (
        <Suspense fallback={<StyleDetailSkeleton />}>
            <StyleDetailContent initialStyle={initialStyle} />
        </Suspense>
    );
}

function StyleDetailContent({ initialStyle }) {
    const { id } = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated } = useAuth();
    const [selectedImage, setSelectedImage] = useState(0);
    // Prevent double-firing the post-login redirect
    const actionConsumed = useRef(false);

    const { data: style, isLoading } = useQuery({
        queryKey: ["style", id],
        queryFn: async () => {
            const { data } = await api.get(`/styles/${id}`);
            return data.data?.style || data.data;
        },
        // Server pre-fetched data seeds the cache — no loading state on first render
        initialData: initialStyle ?? undefined,
        staleTime: 60 * 60 * 1000,
    });

    // ── Post-login callback: auto-navigate to order creation ─────────────────
    // When an unauthenticated user clicks "Order This Style", we send them to
    // /login?redirectURL=/catalog/styles/{id}&action=orderStyle. After login,
    // they land back here and this effect fires the redirect automatically.
    useEffect(() => {
        const action = searchParams.get("action");
        if (action !== "orderStyle" || !isAuthenticated || !id || actionConsumed.current) return;
        actionConsumed.current = true;
        router.push(`/client/orders/new?styleId=${id}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, id, searchParams]);

    if (isLoading) return <StyleDetailSkeleton />;
    if (!style) return <CatalogItemNotFound type="style" />;

    const images = style.images || [];

    const handleOrderStyle = () => {
        if (!isAuthenticated) {
            const currentPath = `/catalog/styles/${id}`;
            router.push(`/login?redirectURL=${encodeURIComponent(currentPath)}&action=orderStyle`);
            return;
        }
        router.push(`/client/orders/new?styleId=${id}`);
    };

    return (
        <div className="pt-[var(--nav-height)]">
            <div className="page-container py-8 lg:py-12">
                {/* Breadcrumb */}
                <Link
                    href="/catalog/styles"
                    className="inline-flex items-center gap-1 text-sm text-text-light hover:text-primary mb-6 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Styles
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div>
                        {/* Main image */}
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-muted mb-4 group">
                            {images[selectedImage] ? (
                                <>
                                    {/* blurred background */}
                                    <Image src={images[selectedImage]} alt={style.name} fill className="object-cover blur-xl scale-110 opacity-100" />
                                    <Image
                                        src={images[selectedImage]}
                                        alt={style.name}
                                        fill
                                        className="object-contain transition-transform duration-300 group-hover:scale-110"
                                    />
                                </>
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8] flex items-center justify-center">
                                    <span className="text-text-light">Style Image</span>
                                </div>
                            )}

                            {images.length > 1 && (
                                <>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => setSelectedImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={() => setSelectedImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {images.map((img, i) => (
                                    <button
                                        key={img}
                                        onClick={() => setSelectedImage(i)}
                                        className={`relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${selectedImage === i ? "border-primary" : "border-transparent"
                                            }`}
                                    >
                                        <Image src={img} alt={`${style.name} - view ${i + 1}`} fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="text-xs font-medium text-primary uppercase tracking-wider">
                            {style.category}
                        </span>
                        <h1 className="text-3xl font-bold text-foreground mt-2 mb-4">{style.name}</h1>

                        {/* Model availability */}
                        <div className="flex gap-2 mb-6">
                            {style.availableForModel1 && (
                                <span className="text-xs px-3 py-1 rounded-full bg-[#F8E8F0] text-primary font-medium">
                                    Client Brings Fabric
                                </span>
                            )}
                            {style.availableForModel2 && (
                                <span className="text-xs px-3 py-1 rounded-full bg-[#E3F2FD] text-status-info font-medium">
                                    Studio Sources Fabric
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            {style.description || "A beautifully crafted style from our curated collection."}
                        </p>

                        {/* CTA */}
                        <button
                            onClick={handleOrderStyle}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 transition-colors text-base"
                        >
                            Order This Style
                            <ArrowRight size={18} />
                        </button>

                        {!isAuthenticated && (
                            <p className="text-xs text-text-light mt-3">
                                You&apos;ll need to sign in or create an account to place an order.
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
