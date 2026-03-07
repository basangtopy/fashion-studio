"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
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

export default function StyleDetailPage() {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const [selectedImage, setSelectedImage] = useState(0);

    const { data: style, isLoading } = useQuery({
        queryKey: ["style", id],
        queryFn: async () => {
            const { data } = await api.get(`/styles/${id}`);
            return data.data?.style || data.data;
        },
    });

    if (isLoading) {
        return <StyleDetailSkeleton />;
    }

    if (!style) {
        return <CatalogItemNotFound type="style" />;
    }

    const images = style.images || [];

    return (
        <div className="pt-[var(--nav-height)]">
            <div className="page-container py-8 lg:py-12">
                {/* Breadcrumb */}
                <Link
                    href="/catalog/styles"
                    className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#C2185B] mb-6 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Styles
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div>
                        {/* Main image */}
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#F4F0F8] mb-4 group">
                            {images[selectedImage] ? (
                                <Image
                                    src={images[selectedImage]}
                                    alt={style.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8] flex items-center justify-center">
                                    <span className="text-[#999]">Style Image</span>
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
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        className={`relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${selectedImage === i ? "border-[#C2185B]" : "border-transparent"
                                            }`}
                                    >
                                        <Image src={img} alt="" fill className="object-cover" />
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
                        <span className="text-xs font-medium text-[#C2185B] uppercase tracking-wider">
                            {style.category}
                        </span>
                        <h1 className="text-3xl font-bold text-[#0D0D0D] mt-2 mb-4">{style.name}</h1>

                        {/* Model availability */}
                        <div className="flex gap-2 mb-6">
                            {style.availableForModel1 && (
                                <span className="text-xs px-3 py-1 rounded-full bg-[#F8E8F0] text-[#C2185B] font-medium">
                                    Client Brings Fabric
                                </span>
                            )}
                            {style.availableForModel2 && (
                                <span className="text-xs px-3 py-1 rounded-full bg-[#E3F2FD] text-[#1565C0] font-medium">
                                    Designer Sources Fabric
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-[#555] leading-relaxed mb-8">
                            {style.description || "A beautifully crafted style from our curated collection."}
                        </p>

                        {/* CTA */}
                        <Link
                            href={isAuthenticated ? `/client/orders/new?styleId=${style.id}` : "/login"}
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors text-base"
                        >
                            Order This Style
                            <ArrowRight size={18} />
                        </Link>

                        {!isAuthenticated && (
                            <p className="text-xs text-[#999] mt-3">
                                You&apos;ll need to sign in or create an account to place an order.
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
