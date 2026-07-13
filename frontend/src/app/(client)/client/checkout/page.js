"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    MapPin,
    Phone,
    Mail,
    Truck,
    Package,
    ChevronRight,
    Copy,
    Check,
    ArrowRight,
    Building2,
    CreditCard,
    FileText,
    CheckCircle2,
    ExternalLink,
    Info,
    Home,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { BRANDING, formatCurrency } from "@/config/branding";
import PaymentInfoCard from "@/components/shared/PaymentInfoCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// ── Fulfilment options ───────────────────────────────────────────────────────

const FULFILMENT_OPTIONS = [
    {
        value: "PICKUP",
        label: "Studio Pickup",
        description: "Collect your order from our studio at no extra cost",
        icon: Package,
    },
    {
        value: "DELIVERY",
        label: "Home Delivery",
        description: "We deliver to your address (delivery fee applies)",
        icon: Truck,
    },
];


// ── Order Created success state ──────────────────────────────────────────────

function OrderCreatedState({ order }) {
    const itemCount = order.items?.length || 0;
    const grandTotal = Number(order.totalAgreedFee);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-[70vh] flex flex-col items-center justify-start pt-4 pb-12"
        >
            {/* Success Hero */}
            <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 22 }}
                className="mb-6 relative"
            >
                <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                    <CheckCircle2 size={40} className="text-status-success" strokeWidth={1.5} />
                </div>
                {/* Pulse rings */}
                <span className="absolute inset-0 rounded-full animate-ping bg-status-success/10" style={{ animationDuration: "1.2s" }} />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-center mb-8 max-w-lg"
            >
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Order Placed!</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Your order has been received. Make your payment to confirm it and we&apos;ll get to work right away.
                </p>
            </motion.div>

            {/* Two-column layout on desktop */}
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: order recap */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.4 }}
                    className="space-y-4"
                >
                    {/* Order number card */}
                    <div className="rounded-xl border border-border bg-white p-5">
                        <p className="text-xs text-text-light uppercase tracking-wider mb-1.5">Order Number</p>
                        <p className="text-xl font-bold font-mono text-primary tracking-wider">{order.orderNumber}</p>
                        <Separator className="my-4" />

                        {/* Items */}
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            {itemCount} {itemCount === 1 ? "item" : "Items"} ordered
                        </p>
                        <div className="space-y-3">
                            {order.items?.map((item) => (
                                <div key={item.id} className="flex items-center gap-3">
                                    <div className="w-10 h-12 rounded-md bg-muted overflow-hidden shrink-0 relative">
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
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {item.readyToWear?.name || "Item"}
                                        </p>
                                        <p className="text-xs text-text-light">
                                            Size: {item.selectedSize} · Qty: {item.quantity}
                                        </p>
                                    </div>
                                    <p className="text-sm font-semibold font-mono text-foreground shrink-0">
                                        {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <Separator className="my-4" />
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-foreground">Total</p>
                            <p className="text-xl font-bold font-mono text-primary">{formatCurrency(grandTotal)}</p>
                        </div>
                    </div>

                    {/* Next steps callout */}
                    <div className="rounded-xl bg-[#E8F5E9] border border-[#2E7D32]/15 p-4 flex gap-3">
                        <Info size={16} className="text-status-success shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-status-success mb-1">What happens next?</p>
                            <p className="text-xs text-status-success/80 leading-relaxed">
                                Make the full payment of{" "}
                                <span className="font-bold font-mono">{formatCurrency(grandTotal)}</span> using the
                                account details on the payment info card. Then open your order page and send your payment proof via the
                                payment section. We&apos;ll confirm and process your order shortly after.
                            </p>
                        </div>
                    </div>

                    {/* CTA buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href={`/client/orders/${order.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                            <ExternalLink size={15} />
                            View Order Details
                        </Link>
                        <Link
                            href="/catalog/ready-to-wear"
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-input text-muted-foreground text-sm font-semibold hover:bg-muted transition-colors"
                        >
                            <Home size={15} />
                            Continue Shopping
                        </Link>
                    </div>
                </motion.div>

                {/* Right: payment info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.4 }}
                >
                    <PaymentInfoCard orderNumber={order.orderNumber} grandTotal={grandTotal} />
                </motion.div>
            </div>
        </motion.div>
    );
}

// ── Main checkout page ───────────────────────────────────────────────────────

export default function CheckoutPage() {
    const { cart, isLoading: cartLoading, checkout } = useCart();
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();
    const toast = useToast();

    const [fulfillmentMethod, setFulfillmentMethod] = useState("PICKUP");
    const [useProfileAddress, setUseProfileAddress] = useState(true);
    // Pre-fill from the profile address. The (client) layout only renders this
    // page after auth resolves, so `user` is already available on first render.
    const [deliveryAddress, setDeliveryAddress] = useState(() => user?.address || "");
    const [clientNotes, setClientNotes] = useState("");
    const [authorised, setAuthorised] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null); // order created state

    const items = cart?.items || [];
    const subtotal = items.reduce(
        (sum, item) => sum + Number(item.readyToWear?.price || 0) * item.quantity,
        0
    );

    // Redirect if cart is empty (only after loading is done)
    useEffect(() => {
        if (!cartLoading && items.length === 0 && !placedOrder) {
            router.replace("/catalog/ready-to-wear");
        }
    }, [cartLoading, items.length, placedOrder, router]);

    const handleCheckout = async () => {
        if (!authorised) return;

        const finalAddress =
            fulfillmentMethod === "DELIVERY"
                ? useProfileAddress
                    ? user?.address || deliveryAddress
                    : deliveryAddress
                : undefined;

        if (fulfillmentMethod === "DELIVERY" && !finalAddress?.trim()) {
            toast.warning("Delivery address required", "Please enter a delivery address to continue.");
            return;
        }

        checkout.mutate(
            {
                fulfillmentMethod,
                deliveryAddress: finalAddress,
                clientNotes: clientNotes.trim() || undefined,
            },
            {
                onSuccess: (data) => {
                    const order = data?.order || data;
                    toast.success("Order placed!", `Your order ${order.orderNumber} has been received.`);
                    setPlacedOrder(order);
                },
                onError: (err) => {
                    toast.error(
                        "Checkout failed",
                        err.response?.data?.message || "Something went wrong. Please try again."
                    );
                },
            }
        );
    };

    // ── Order created success state ──────────────────────────────────────────
    if (placedOrder) {
        return (
            <div className="max-w-5xl mx-auto">
                <OrderCreatedState order={placedOrder} />
            </div>
        );
    }

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (cartLoading) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="h-8 w-40 rounded-lg bg-muted animate-pulse mb-8" />
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="rounded-xl border border-border bg-white p-5 h-40 animate-pulse" />
                        ))}
                    </div>
                    <div className="rounded-xl bg-secondary h-96 animate-pulse" />
                </div>
            </div>
        );
    }

    // ── Main checkout form ───────────────────────────────────────────────────

    return (
        <div className="max-w-5xl mx-auto sm:max-lg:mb-20">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-text-light mb-6">
                <Link href="/catalog/ready-to-wear" className="hover:text-primary transition-colors">
                    Shop
                </Link>
                <ChevronRight size={12} />
                <Link href="#" className="hover:text-primary transition-colors" onClick={(e) => { e.preventDefault(); /* open cart */ }}>
                    Cart
                </Link>
                <ChevronRight size={12} />
                <span className="text-foreground font-medium">Checkout</span>
            </nav>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                {/* ─── LEFT: Form ─────────────────────────────────────────── */}
                <div className="space-y-5 min-w-0">

                    {/* Order Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        {/* Card header */}
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <ShoppingBag size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">
                                Order Summary
                            </h2>
                            <span className="ml-auto text-xs text-text-light">
                                {items.length} {items.length === 1 ? "item" : "items"}
                            </span>
                        </div>

                        {/* Items list */}
                        <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                            {items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                                    {/* Thumbnail */}
                                    <div className="w-14 h-18 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                                        {item.readyToWear?.images?.[0] ? (
                                            <Image
                                                src={item.readyToWear.images[0]}
                                                alt={item.readyToWear.name}
                                                width={56}
                                                height={72}
                                                className="object-cover w-full h-full"
                                            />
                                        ) : (
                                            <div className="w-14 h-[72px] bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8]" />
                                        )}
                                    </div>
                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {item.readyToWear?.name || "Item"}
                                        </p>
                                        <p className="text-xs text-text-light mt-0.5">
                                            Size: {item.selectedSize} · Qty: {item.quantity}
                                        </p>
                                        <p className="text-sm font-semibold font-mono text-foreground mt-1">
                                            {formatCurrency(Number(item.readyToWear?.price || 0) * item.quantity)}
                                        </p>
                                    </div>
                                    {/* Per unit price */}
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-text-light">
                                            {formatCurrency(item.readyToWear?.price)} / ea
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Subtotal */}
                        <div className="flex items-center justify-between px-5 py-4 bg-surface-2 border-t border-border">
                            <p className="text-sm text-muted-foreground">Subtotal</p>
                            <p className="text-lg font-bold font-mono text-foreground">
                                {formatCurrency(subtotal)}
                            </p>
                        </div>
                    </motion.div>

                    {/* Your Information */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.07 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <CreditCard size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">Your Information</h2>
                        </div>
                        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <Mail size={13} className="text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-text-light uppercase tracking-wider mb-0.5">Email</p>
                                    <p className="text-sm font-medium text-foreground truncate break-all">{user?.email || "—"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                    <Phone size={13} className="text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] text-text-light uppercase tracking-wider mb-0.5">Phone</p>
                                    <p className="text-sm font-medium text-foreground">{user?.phone || "—"}</p>
                                </div>
                            </div>
                            {user?.address && (
                                <div className="flex items-start gap-3 sm:col-span-2">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <MapPin size={13} className="text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] text-text-light uppercase tracking-wider mb-0.5">Saved Address</p>
                                        <p className="text-sm font-medium text-foreground">{user.address}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Fulfilment */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.12 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <Truck size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">Fulfilment Method</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {FULFILMENT_OPTIONS.map((opt) => {
                                    const isSelected = fulfillmentMethod === opt.value;
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFulfillmentMethod(opt.value)}
                                            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150 ${isSelected
                                                ? "border-primary bg-[#FFF5F8]"
                                                : "border-input bg-white hover:border-primary/30 hover:bg-surface-2"
                                                }`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-text-light"}`}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                    {opt.label}
                                                </p>
                                                <p className="text-xs text-text-light leading-snug mt-0.5">{opt.description}</p>
                                            </div>
                                            {/* Selection indicator */}
                                            {isSelected && (
                                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check size={10} className="text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Delivery address panel */}
                            <AnimatePresence>
                                {fulfillmentMethod === "DELIVERY" && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-2 space-y-3">
                                            {/* Use saved address toggle */}
                                            {user?.address && (
                                                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                                                    <Checkbox
                                                        id="useProfileAddress"
                                                        checked={useProfileAddress}
                                                        onCheckedChange={setUseProfileAddress}
                                                        className="mt-0.5 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                    <div>
                                                        <Label
                                                            htmlFor="useProfileAddress"
                                                            className="text-sm font-medium text-foreground cursor-pointer leading-snug"
                                                        >
                                                            Deliver to my saved address
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{user.address}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Custom address input */}
                                            {(!user?.address || !useProfileAddress) && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <Label className="text-sm font-medium text-foreground mb-1.5 block">
                                                        Delivery Address <span className="text-destructive">*</span>
                                                    </Label>
                                                    <div className="relative">
                                                        <MapPin size={15} className="absolute left-3 top-3 text-text-light z-10" />
                                                        <Textarea
                                                            value={deliveryAddress}
                                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                                            placeholder="Enter your full delivery address including landmark..."
                                                            className="pl-9 resize-none border-input focus-visible:ring-ring focus-visible:border-ring min-h-[90px]"
                                                        />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Order Note */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.17 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <FileText size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">Order Note</h2>
                            <span className="ml-auto text-xs text-text-light">Optional</span>
                        </div>
                        <div className="px-5 py-4">
                            <Textarea
                                value={clientNotes}
                                onChange={(e) => setClientNotes(e.target.value)}
                                placeholder="Any special instructions for your order? e.g. preferred contact time, access notes for delivery..."
                                maxLength={500}
                                className="resize-none border-input focus-visible:ring-ring focus-visible:border-ring min-h-[90px]"
                            />
                            <p className="text-xs text-text-light mt-1.5 text-right">
                                {clientNotes.length}/500
                            </p>
                        </div>
                    </motion.div>

                    {/* Authorization + CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.22 }}
                        className="rounded-xl border border-border bg-white p-5 space-y-5"
                    >
                        {/* Checkbox */}
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="authorised"
                                checked={authorised}
                                onCheckedChange={setAuthorised}
                                className="mt-0.5 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label
                                htmlFor="authorised"
                                className="text-sm text-muted-foreground leading-relaxed cursor-pointer inline"
                            >
                                I have reviewed my order details and confirm that all information is correct. I
                                understand I will need to make a{" "}<span className="font-semibold text-primary">full payment</span>{" "}to the provided
                                account before my order is processed.
                            </Label>
                        </div>

                        {/* Place order button */}
                        <Button
                            onClick={handleCheckout}
                            disabled={!authorised || checkout.isPending}
                            className={`w-full h-12 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${authorised
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                : "bg-[#E0E0E0] text-text-light cursor-not-allowed"
                                }`}
                        >
                            {checkout.isPending ? (
                                <>
                                    <div className="border-[3px] border-white/30 border-t-white rounded-full animate-spin size-4" />
                                    Placing Order...
                                </>
                            ) : (
                                <>
                                    Place Order · {formatCurrency(subtotal)}
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-text-light text-center leading-relaxed">
                            Payment is collected manually via bank transfer. Your order will be confirmed once we
                            receive your payment proof.
                        </p>
                    </motion.div>
                </div>

                {/* ─── RIGHT: Payment info (sticky on desktop) ────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.1 }}
                    className="lg:sticky lg:top-20 h-fit"
                >
                    <PaymentInfoCard grandTotal={subtotal} />
                </motion.div>
            </div>
        </div>
    );
}
