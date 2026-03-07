"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Minus, ShoppingBag, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency } from "@/config/branding";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { RTWDetailSkeleton } from "@/components/shared/Skeleton";
import { CatalogItemNotFound } from "@/components/shared/EmptyStates";

const STOCK_STATUS = { IN_STOCK: { label: "In Stock", color: "#2E7D32" }, LOW_STOCK: { label: "Low Stock", color: "#E65100" }, OUT_OF_STOCK: { label: "Sold Out", color: "#B71C1C" } };

export default function RTWDetailPage() {
    const { id } = useParams();
    const { isAuthenticated } = useAuth();
    const { addToCart } = useCart();
    const toast = useToast();
    const [selectedImage, setSelectedImage] = useState(0);
    const [selectedSize, setSelectedSize] = useState(null);
    const [quantity, setQuantity] = useState(1);

    const { data: item, isLoading } = useQuery({
        queryKey: ["rtw", id],
        queryFn: async () => {
            const { data } = await api.get(`/ready-to-wear/${id}`);
            return data.data?.item || data.data?.readyToWear || data.data;
        },
    });

    if (isLoading) {
        return <RTWDetailSkeleton />;
    }

    if (!item) {
        return <CatalogItemNotFound type="ready-to-wear" />;
    }

    const images = item.images || [];
    const sizes = item.availableSizes || [];
    const stock = STOCK_STATUS[item.stockStatus] || STOCK_STATUS.IN_STOCK;
    const isOutOfStock = item.stockStatus === "OUT_OF_STOCK";

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            window.location.href = "/login";
            return;
        }
        if (!selectedSize) {
            toast.warning("Select a size", "Please select a size before adding to cart.");
            return;
        }
        addToCart.mutate(
            { readyToWearId: item.id, selectedSize, quantity },
            {
                onSuccess: () => toast.success("Added to cart", `${item.name} added to your cart.`),
                onError: (err) => toast.error("Error", err.response?.data?.message || "Could not add to cart."),
            }
        );
    };

    const handleBuyNow = () => {
        if (!isAuthenticated) {
            window.location.href = "/login";
            return;
        }
        if (!selectedSize) {
            toast.warning("Select a size", "Please select a size first.");
            return;
        }
        addToCart.mutate(
            { readyToWearId: item.id, selectedSize, quantity },
            {
                onSuccess: () => { window.location.href = "/checkout"; },
                onError: (err) => toast.error("Error", err.response?.data?.message || "Could not add to cart."),
            }
        );
    };

    return (
        <div className="pt-[var(--nav-height)]">
            <div className="page-container py-8 lg:py-12">
                <Link
                    href="/catalog/ready-to-wear"
                    className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#C2185B] mb-6 transition-colors"
                >
                    <ArrowLeft size={14} /> Back to Ready-to-Wear
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery */}
                    <div>
                        <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#F4F0F8] mb-4 group">
                            {images[selectedImage] ? (
                                <Image src={images[selectedImage]} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8]" />
                            )}
                            {images.length > 1 && (
                                <>
                                    <Button variant="secondary" size="icon" onClick={() => setSelectedImage((p) => (p === 0 ? images.length - 1 : p - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"><ChevronLeft size={16} /></Button>
                                    <Button variant="secondary" size="icon" onClick={() => setSelectedImage((p) => (p === images.length - 1 ? 0 : p + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"><ChevronRight size={16} /></Button>
                                </>
                            )}
                        </div>
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {images.map((img, i) => (
                                    <button key={i} onClick={() => setSelectedImage(i)} className={`relative w-16 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${selectedImage === i ? "border-[#C2185B]" : "border-transparent"}`}>
                                        <Image src={img} alt="" fill className="object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                        <span className="text-xs font-medium text-[#C2185B] uppercase tracking-wider">{item.category}</span>
                        <h1 className="text-3xl font-bold text-[#0D0D0D] mt-2 mb-2">{item.name}</h1>
                        <p className="text-2xl font-bold font-mono-data text-[#C2185B] mb-4">{formatCurrency(item.price)}</p>

                        {/* Stock Status */}
                        <p className="text-sm font-medium mb-6" style={{ color: stock.color }}>
                            {stock.label} {item.stockCount > 0 && item.stockCount <= 10 && `— Only ${item.stockCount} left`}
                        </p>

                        {/* Size Selector */}
                        <div className="mb-6">
                            <label className="text-sm font-medium text-[#0D0D0D] mb-2 block">Select Size</label>
                            <div className="flex gap-2 flex-wrap">
                                {sizes.map((size) => (
                                    <Button
                                        variant="ghost"
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        disabled={isOutOfStock}
                                        className={`px-4 py-2 h-auto rounded-md text-sm font-semibold transition-colors hover:bg-[#E0E0E0] hover:text-[#555] ${selectedSize === size
                                            ? "bg-[#C2185B] text-white hover:bg-[#C2185B] hover:text-white"
                                            : isOutOfStock
                                                ? "bg-[#F4F0F8] text-[#999] line-through cursor-not-allowed hover:bg-[#F4F0F8] hover:text-[#999]"
                                                : "bg-[#F4F0F8] text-[#555] hover:bg-[#F8E8F0]"
                                            }`}
                                    >
                                        {size}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Quantity */}
                        <div className="mb-8">
                            <label className="text-sm font-medium text-[#0D0D0D] mb-2 block">Quantity</label>
                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 rounded-md border-[#E0E0E0] flex items-center justify-center hover:bg-[#F4F0F8]" disabled={quantity <= 1}>
                                    <Minus size={16} />
                                </Button>
                                <span className="text-lg font-semibold font-mono-data w-8 text-center">{quantity}</span>
                                <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 rounded-md border-[#E0E0E0] flex items-center justify-center hover:bg-[#F4F0F8]">
                                    <Plus size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-8">
                            <Button
                                onClick={handleAddToCart}
                                disabled={isOutOfStock || addToCart.isPending}
                                variant="outline"
                                className="flex-1 flex h-auto items-center justify-center gap-2 px-6 py-3 rounded-md border-2 border-[#C2185B] text-[#C2185B] font-semibold hover:bg-[#F8E8F0] hover:text-[#C2185B] transition-colors disabled:opacity-50"
                            >
                                <ShoppingBag size={16} />
                                {addToCart.isPending ? "Adding..." : "Add to Cart"}
                            </Button>
                            <Button
                                onClick={handleBuyNow}
                                disabled={isOutOfStock || addToCart.isPending}
                                className="flex-1 flex h-auto items-center justify-center gap-2 px-6 py-3 rounded-md bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors disabled:opacity-50"
                            >
                                <Zap size={16} />
                                Buy Now
                            </Button>
                        </div>

                        {/* Details */}
                        {item.description && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Description</h3>
                                <p className="text-sm text-[#555] leading-relaxed">{item.description}</p>
                            </div>
                        )}
                        {item.fabricDetails && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Fabric Details</h3>
                                <p className="text-sm text-[#555]">{item.fabricDetails}</p>
                            </div>
                        )}
                        {item.careInstructions && (
                            <div>
                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Care Instructions</h3>
                                <p className="text-sm text-[#555]">{item.careInstructions}</p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
