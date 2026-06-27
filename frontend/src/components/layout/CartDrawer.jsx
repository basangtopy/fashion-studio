"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/config/branding";

export default function CartDrawer() {
    const {
        cart,
        isOpen,
        closeCart,
        updateQuantity,
        removeItem,
        itemCount,
        subtotal,
    } = useCart();

    const items = cart?.items || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        className="fixed top-0 right-0 bottom-0 z-[71] w-full max-w-[400px] bg-card shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                                <ShoppingBag size={18} className="text-foreground" />
                                <h2 className="text-lg font-semibold text-foreground">Your Cart</h2>
                                {itemCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {itemCount} {itemCount === 1 ? "item" : "items"}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={closeCart}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <X size={18} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Content */}
                        {items.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <ShoppingBag size={24} className="text-text-light" />
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">Your cart is empty</p>
                                <p className="text-xs text-text-light mb-6">
                                    Explore our ready-to-wear collection to find something you love.
                                </p>
                                <Link
                                    href="/catalog/ready-to-wear"
                                    onClick={closeCart}
                                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    Start Browsing
                                </Link>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <div className="p-4 flex flex-col gap-4">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex gap-3 p-3 rounded-lg border border-border"
                                        >
                                            {/* Thumbnail */}
                                            <div className="w-16 h-20 rounded-md bg-muted overflow-hidden shrink-0 relative">
                                                {item.readyToWear?.images?.[0] ? (
                                                    <Image
                                                        src={item.readyToWear.images[0]}
                                                        alt={item.readyToWear.name}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8]" />
                                                )}
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">
                                                    {item.readyToWear?.name || "Item"}
                                                </p>
                                                <p className="text-xs text-text-light mt-0.5">
                                                    Size: {item.selectedSize}
                                                </p>
                                                <p className="text-sm font-semibold font-mono-data text-foreground mt-1">
                                                    {formatCurrency(item.readyToWear?.price * item.quantity)}
                                                </p>

                                                {/* Quantity Controls */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity.mutate({
                                                                itemId: item.id,
                                                                quantity: Math.max(1, item.quantity - 1),
                                                            })
                                                        }
                                                        className="w-7 h-7 rounded-md border border-input flex items-center justify-center hover:bg-muted transition-colors"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        <Minus size={12} />
                                                    </button>
                                                    <span className="text-sm font-medium w-6 text-center font-mono-data">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity.mutate({
                                                                itemId: item.id,
                                                                quantity: item.quantity + 1,
                                                            })
                                                        }
                                                        className="w-7 h-7 rounded-md border border-input flex items-center justify-center hover:bg-muted transition-colors"
                                                    >
                                                        <Plus size={12} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Remove */}
                                            <button
                                                onClick={() => removeItem.mutate(item.id)}
                                                className="shrink-0 p-1.5 rounded-md text-text-light hover:text-destructive hover:bg-[#FFEBEE] transition-colors self-start"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-4 border-t border-border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Subtotal</span>
                                    <span className="text-lg font-bold font-mono-data text-foreground">
                                        {formatCurrency(subtotal)}
                                    </span>
                                </div>
                                <p className="text-xs text-text-light">
                                    Delivery fees calculated at checkout
                                </p>
                                <Link
                                    href="/client/checkout"
                                    onClick={closeCart}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={16} />
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
