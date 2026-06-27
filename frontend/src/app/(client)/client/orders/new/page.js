"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    Scissors,
    ShoppingBag,
    Ruler,
    Truck,
    Package,
    MapPin,
    FileText,
    Sparkles,
    ImagePlus,
    X,
    Check,
    ArrowRight,
    CheckCircle2,
    ExternalLink,
    Info,
    User,
    Calendar,
    Home,
    Upload,
    Eye,
    Clock,
    Shirt,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency } from "@/config/branding";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import PaymentInfoCard from "@/components/shared/PaymentInfoCard";
import { BookingModal } from "@/components/shared/BookingModal";

// ── Fulfilment options ───────────────────────────────────────────────────────

const FULFILMENT_OPTIONS = [
    {
        value: "PICKUP",
        label: "Studio Pickup",
        description: "Collect your finished garment from our studio at no extra cost",
        icon: Package,
    },
    {
        value: "DELIVERY",
        label: "Home Delivery",
        description: "We deliver to your address (delivery fee discussed at quote stage)",
        icon: Truck,
    },
];

// ── Measurement choice options ───────────────────────────────────────────────

const MEASUREMENT_OPTIONS = [
    {
        value: "saved",
        label: "Use my saved measurements",
        description: "The studio will use the measurements already on file for your profile.",
        icon: Ruler,
        color: 'var(--color-status-success)',
    },
    {
        value: "update",
        label: "Update my measurements",
        description: "I'll update my measurements on the measurements page after placing this order.",
        icon: Ruler,
        color: 'var(--color-status-info)',
    },
    {
        value: "fitting",
        label: "Book a fitting appointment",
        description: "I'd like to schedule an in-studio fitting session with the team.",
        icon: Calendar,
        color: 'var(--color-brand-primary)',
    },
];

// ── Style preview card ───────────────────────────────────────────────────────

function StylePreviewCard({ style, orderType, onChangeStyle }) {
    const models = [];
    if (style.availableForModel1) models.push({ label: "Client Brings Fabric", color: 'var(--color-brand-primary)', bg: "#F8E8F0" });
    if (style.availableForModel2) models.push({ label: "Studio Sources Fabric", color: 'var(--color-status-info)', bg: "#E3F2FD" });

    return (
        <div className="rounded-xl border border-border bg-white overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                <Eye size={16} className="text-primary" />
                <h2 className="font-semibold text-sm text-foreground">Style Selected</h2>
                <button
                    onClick={onChangeStyle}
                    className="ml-auto text-xs text-primary hover:underline font-medium"
                >
                    Change Style
                </button>
            </div>
            <div className="flex items-start gap-4 px-5 py-4">
                {/* Thumbnail */}
                <div className="w-16 h-20 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                    {style.images?.[0] ? (
                        <Image
                            src={style.images[0]}
                            alt={style.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#F8E8F0] to-[#F4F0F8]" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                        {style.category}
                    </p>
                    <p className="text-base font-bold text-foreground mb-2">{style.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                        {models.map((m) => (
                            <span
                                key={m.label}
                                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                style={{ background: m.bg, color: m.color }}
                            >
                                {m.label}
                            </span>
                        ))}
                    </div>
                    {style.description && (
                        <p className="text-xs text-text-light mt-2 line-clamp-2 leading-relaxed">
                            {style.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Custom image uploader ────────────────────────────────────────────────────

function ImageUploader({ images, onChange }) {
    const inputRef = useRef(null);
    const MAX = 5;

    const handleFiles = (files) => {
        const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
        const next = [...images, ...valid].slice(0, MAX);
        onChange(next);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-3">
            {/* Drop zone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => images.length < MAX && inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                    ${images.length >= MAX
                        ? "border-input bg-surface-2 cursor-not-allowed opacity-60"
                        : "border-primary/30 bg-[#FFF5F8] hover:border-primary/60 hover:bg-[#FFF0F5]"
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />
                <Upload size={20} className="mx-auto mb-2 text-primary/60" />
                <p className="text-sm font-medium text-muted-foreground">
                    {images.length >= MAX
                        ? "Maximum 5 images uploaded"
                        : "Drop style images here or click to browse"}
                </p>
                <p className="text-xs text-text-light mt-1">
                    PNG, JPG, WEBP · Max 5 images · Any reference photos welcome
                </p>
            </div>

            {/* Preview grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {images.map((file, i) => (
                        <div
                            key={i}
                            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                        >
                            <Image
                                src={URL.createObjectURL(file)}
                                alt=""
                                fill
                                className="object-cover"
                            />
                            <button
                                onClick={(e) => { e.stopPropagation(); remove(i); }}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={10} strokeWidth={3} />
                            </button>
                        </div>
                    ))}
                    {images.length < MAX && (
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="aspect-square rounded-lg border-2 border-dashed border-input flex items-center justify-center hover:border-primary/40 transition-colors"
                        >
                            <ImagePlus size={18} className="text-[#BDBDBD]" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Measurements mini-display ─────────────────────────────────────────────────

function MeasurementSnapshot({ measurement }) {
    const fields = [
        ["Bust", measurement?.bust],
        ["Waist", measurement?.waist],
        ["Hips", measurement?.hips],
        ["Height", measurement?.fullHeight || measurement?.customParams?.fullHeight],
    ].filter(([, v]) => v != null);

    if (fields.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-3 mt-3 p-3 rounded-lg bg-muted">
            {fields.map(([label, value]) => (
                <div key={label} className="flex flex-col">
                    <span className="text-[10px] text-text-light uppercase tracking-wider">{label}</span>
                    <span className="text-sm font-semibold font-mono text-foreground">{value}cm</span>
                </div>
            ))}
            <div className="flex flex-col">
                <span className="text-[10px] text-text-light uppercase tracking-wider">Updated</span>
                <span className="text-sm font-semibold text-foreground">
                    {measurement?.updatedAt
                        ? new Date(measurement.updatedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })
                        : "—"}
                </span>
            </div>
        </div>
    );
}

// ── Order created success state ──────────────────────────────────────────────

function OrderCreatedState({ order, measurementChoice, onBookFitting }) {
    const isCustom = !order.style && !order.styleId;
    const modelLabel =
        order.orderType === "MODEL_1" ? "Client Brings Fabric" : "Studio Sources Fabric";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-[70vh] flex flex-col items-center justify-start pt-4 pb-12"
        >
            {/* Success ring */}
            <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 22 }}
                className="mb-6 relative"
            >
                <div className="w-20 h-20 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                    <CheckCircle2 size={40} className="text-status-success" strokeWidth={1.5} />
                </div>
                <span
                    className="absolute inset-0 rounded-full animate-ping bg-status-success/10"
                    style={{ animationDuration: "1.4s" }}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.4 }}
                className="text-center mb-8 max-w-lg"
            >
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Order Placed!</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                    Your bespoke order has been received. Our studio will review it and send you a
                    quote within 24 hours.
                </p>
            </motion.div>

            <div className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left — recap */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.32, duration: 0.4 }}
                    className="space-y-4"
                >
                    {/* Order number */}
                    <div className="rounded-xl border border-border bg-white p-5">
                        <p className="text-xs text-text-light uppercase tracking-wider mb-1.5">Order Number</p>
                        <p className="text-xl font-bold font-mono text-primary tracking-wider">
                            {order.orderNumber}
                        </p>
                        <Separator className="my-4" />

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-light">Type</span>
                                <span className="font-medium text-foreground">
                                    {isCustom ? "Custom Style" : order.style?.name || "Catalog Style"}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-light">Model</span>
                                <span className="font-medium text-foreground">{modelLabel}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-light">Status</span>
                                <span className="inline-flex items-center gap-1.5 font-semibold text-status-warning">
                                    <Clock size={12} className="animate-pulse" /> Pending Review
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-text-light">Fulfilment</span>
                                <span className="font-medium text-foreground">
                                    {order.fulfillmentMethod === "DELIVERY" ? "Home Delivery" : "Studio Pickup"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* What happens next */}
                    <div className="rounded-xl bg-[#E3F2FD] border border-[#1565C0]/15 p-4 flex gap-3">
                        <Info size={16} className="text-status-info shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-status-info mb-1">What happens next?</p>
                            <p className="text-xs text-status-info/80 leading-relaxed">
                                Our studio will review your order and send you a quote within 24 hours. Once
                                you approve the quote, you'll make a payment (full or installment) and
                                production begins.
                            </p>
                        </div>
                    </div>

                    {/* Next steps based on measurement choice */}
                    {measurementChoice === "fitting" && (
                        <button
                            onClick={onBookFitting}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-[#FFF5F8] border border-primary/20 hover:bg-[#FFF0F5] transition-colors text-left"
                        >
                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Calendar size={16} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-primary">Book Fitting Appointment</p>
                                <p className="text-xs text-text-light">You indicated you'd like an in-studio fitting.</p>
                            </div>
                            <ArrowRight size={14} className="text-primary ml-auto shrink-0" />
                        </button>
                    )}

                    {measurementChoice === "update" && (
                        <Link
                            href="/client/measurements"
                            className="flex items-center gap-3 p-4 rounded-xl bg-[#E3F2FD] border border-[#1565C0]/20 hover:bg-[#EFF6FF] transition-colors"
                        >
                            <div className="w-9 h-9 rounded-lg bg-status-info/10 flex items-center justify-center shrink-0">
                                <Ruler size={16} className="text-status-info" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-status-info">Update My Measurements</p>
                                <p className="text-xs text-text-light">You indicated you'd like to update your measurements.</p>
                            </div>
                            <ArrowRight size={14} className="text-status-info ml-auto shrink-0" />
                        </Link>
                    )}

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href={`/client/orders/${order.id}`}
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                            <ExternalLink size={15} />
                            View Order Details
                        </Link>
                        <Link
                            href="/catalog/styles"
                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-input text-muted-foreground text-sm font-semibold hover:bg-muted transition-colors"
                        >
                            <Shirt size={15} />
                            Browse More Styles
                        </Link>
                    </div>
                </motion.div>

                {/* Right — payment info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.44, duration: 0.4 }}
                    className="space-y-4"
                >
                    <PaymentInfoCard compact orderNumber={order.orderNumber} />
                    <div className="rounded-xl border border-border bg-surface-2 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Payment note
                        </p>
                        <p className="text-xs text-text-light leading-relaxed">
                            For bespoke orders, payment is made after the studio sends you a quote and you
                            approve it. Once approved, use the account details above to make your payment —
                            full or an initial installment — and send your proof via the order chat.
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function NewOrderPage() {
    return (
        <Suspense fallback={<div className="max-w-5xl mx-auto h-96 animate-pulse bg-muted rounded-2xl" />}>
            <NewOrderContent />
        </Suspense>
    );
}

function NewOrderContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const toast = useToast();

    const styleId = searchParams.get("styleId");
    const isCustomMode = !styleId;

    // ── Form state ───────────────────────────────────────────────────────────
    const [orderType, setOrderType] = useState("MODEL_1"); // MODEL_1 or MODEL_2
    const [customImages, setCustomImages] = useState([]);
    const [customDesc, setCustomDesc] = useState("");
    const [fabricNotes, setFabricNotes] = useState("");
    const [measurementChoice, setMeasurementChoice] = useState("saved");
    const [fulfillmentMethod, setFulfillmentMethod] = useState("PICKUP");
    const [useProfileAddress, setUseProfileAddress] = useState(true);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [clientNotes, setClientNotes] = useState("");
    const [authorised, setAuthorised] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [placedOrder, setPlacedOrder] = useState(null);
    const [bookingOpen, setBookingOpen] = useState(false);

    // ── Fetch catalog style if styleId present ───────────────────────────────
    const { data: style, isLoading: styleLoading } = useQuery({
        queryKey: ["style", styleId],
        queryFn: async () => {
            const { data } = await api.get(`/styles/${styleId}`);
            return data.data?.style || data.data;
        },
        enabled: !!styleId,
    });

    // ── Fetch user measurements ──────────────────────────────────────────────
    const { data: measurement } = useQuery({
        queryKey: ["measurements"],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${user?.id}`);
            return data.data?.measurement || data.data || null;
        },
        enabled: !!user?.id,
    });

    const hasMeasurements =
        measurement && measurement.id && Object.keys(measurement).length > 0;

    // ── Derive orderType from style model availability ───────────────────────
    useEffect(() => {
        if (!style) return;
        if (style.availableForModel1) setOrderType("MODEL_1");
        else if (style.availableForModel2) setOrderType("MODEL_2");
    }, [style]);

    // ── Pre-fill delivery address ────────────────────────────────────────────
    useEffect(() => {
        if (user?.address) setDeliveryAddress(user.address);
    }, [user]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handlePlaceOrder = async () => {
        if (!authorised) return;

        // Validate custom mode requires images or description
        if (isCustomMode && !customDesc.trim() && customImages.length === 0) {
            toast.warning(
                "Style details required",
                "Please add reference images or describe your desired style."
            );
            return;
        }

        // Validate delivery address
        const finalAddress =
            fulfillmentMethod === "DELIVERY"
                ? useProfileAddress
                    ? user?.address || deliveryAddress
                    : deliveryAddress
                : undefined;

        if (fulfillmentMethod === "DELIVERY" && !finalAddress?.trim()) {
            toast.warning("Delivery address required", "Please enter your delivery address.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("orderType", orderType);
            if (styleId) formData.append("styleId", styleId);
            if (isCustomMode && customDesc.trim())
                formData.append("customStyleDescription", customDesc.trim());
            formData.append("clientProvidesFabric", orderType === "MODEL_1" ? "true" : "false");
            if (fabricNotes.trim()) formData.append("fabricNotes", fabricNotes.trim());
            formData.append(
                "useSavedMeasurements",
                (measurementChoice === "saved" && hasMeasurements).toString()
            );
            formData.append("fulfillmentMethod", fulfillmentMethod);
            if (finalAddress) formData.append("deliveryAddress", finalAddress);
            if (clientNotes.trim()) formData.append("clientNotes", clientNotes.trim());
            customImages.forEach((img) => formData.append("customStyleImages", img));

            const { data } = await api.post("/orders", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const order = data.data?.order || data.data;
            toast.success("Order placed!", `Order ${order.orderNumber} has been received.`);
            setPlacedOrder(order);
        } catch (err) {
            toast.error(
                "Order failed",
                err.response?.data?.message || "Something went wrong. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Determine which model options are available ──────────────────────────
    const canBeModel1 = !style || style.availableForModel1;
    const canBeModel2 = !style || style.availableForModel2;
    const modelOptions = [
        canBeModel1 && {
            value: "MODEL_1",
            label: "Client Brings Fabric",
            description: "You supply the fabric/material. Our studio handles cutting, sewing, and finishing.",
            icon: Scissors,
            color: 'var(--color-brand-primary)',
            bg: "#FFF5F8",
        },
        canBeModel2 && {
            value: "MODEL_2",
            label: "Studio Sources Fabric",
            description: "We source fabric to match your style and preference. You just approve and we handle the rest.",
            icon: ShoppingBag,
            color: 'var(--color-status-info)',
            bg: "#EFF6FF",
        },
    ].filter(Boolean);

    // ── Success state ─────────────────────────────────────────────────────────
    if (placedOrder) {
        return (
            <div className="max-w-5xl mx-auto">
                <OrderCreatedState
                    order={placedOrder}
                    measurementChoice={measurementChoice}
                    onBookFitting={() => setBookingOpen(true)}
                />
                <BookingModal isOpen={bookingOpen} onOpenChange={setBookingOpen} />
            </div>
        );
    }

    // ── Loading state (fetching catalog style) ────────────────────────────────
    if (styleId && styleLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-5">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-36 rounded-xl bg-muted animate-pulse"
                    />
                ))}
            </div>
        );
    }

    // ── Main form ─────────────────────────────────────────────────────────────
    return (
        <div className="max-w-5xl mx-auto sm:max-lg:mb-20">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-text-light mb-6">
                <Link href="/client/orders" className="hover:text-primary transition-colors">
                    My Orders
                </Link>
                <ChevronRight size={12} />
                <span className="text-foreground font-medium">New Order</span>
            </nav>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
                {/* ─── LEFT: Form ─────────────────────────────────────────── */}
                <div className="space-y-5 min-w-0">

                    {/* ── 1. Style Section ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                    >
                        {styleId && style ? (
                            <StylePreviewCard
                                style={style}
                                orderType={orderType}
                                onChangeStyle={() => router.push("/catalog/styles")}
                            />
                        ) : (
                            <div className="rounded-xl border border-border bg-white overflow-hidden">
                                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                                    <Sparkles size={16} className="text-primary" />
                                    <h2 className="font-semibold text-sm text-foreground">Your Custom Style</h2>
                                    <Link
                                        href="/catalog/styles"
                                        className="ml-auto text-xs text-muted-foreground hover:text-primary transition-colors"
                                    >
                                        Browse catalog instead →
                                    </Link>
                                </div>
                                <div className="px-5 py-4 space-y-4">
                                    {/* Image upload */}
                                    <div>
                                        <Label className="text-sm font-medium text-foreground mb-2 block">
                                            Reference Images{" "}
                                            <span className="text-text-light font-normal">(up to 5)</span>
                                        </Label>
                                        <ImageUploader
                                            images={customImages}
                                            onChange={setCustomImages}
                                        />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <Label className="text-sm font-medium text-foreground mb-1.5 block">
                                            Style Description
                                        </Label>
                                        <Textarea
                                            value={customDesc}
                                            onChange={(e) => setCustomDesc(e.target.value)}
                                            placeholder="Describe your desired outfit in detail — color, cut, silhouette, occasion, length, neckline, sleeve style, embellishments, or any reference you have in mind..."
                                            maxLength={2000}
                                            className="resize-none border-input focus-visible:ring-ring focus-visible:border-ring min-h-[120px]"
                                        />
                                        <p className="text-xs text-text-light mt-1 text-right">
                                            {customDesc.length}/2000
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* ── 2. Model / Fabric ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.06 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <Scissors size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">Fabric &amp; Service Model</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {modelOptions.map((opt) => {
                                    const isSelected = orderType === opt.value;
                                    const Icon = opt.icon;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setOrderType(opt.value)}
                                            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150
                                                ${isSelected
                                                    ? "border-primary bg-[#FFF5F8]"
                                                    : "border-input bg-white hover:border-primary/30"
                                                }`}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors
                                                    ${isSelected ? "bg-primary text-primary-foreground" : "text-text-light"}`}
                                                style={!isSelected ? { background: opt.bg } : {}}
                                            >
                                                <Icon size={16} style={!isSelected ? { color: opt.color } : {}} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                    {opt.label}
                                                </p>
                                                <p className="text-xs text-text-light leading-snug mt-0.5">
                                                    {opt.description}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check size={10} className="text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Fabric notes slide-down */}
                            <AnimatePresence>
                                {orderType && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="pt-1">
                                            <Label className="text-sm font-medium text-foreground mb-1.5 block">
                                                Fabric Notes{" "}
                                                <span className="text-text-light font-normal">(Optional)</span>
                                            </Label>
                                            <Textarea
                                                value={fabricNotes}
                                                onChange={(e) => setFabricNotes(e.target.value)}
                                                placeholder={
                                                    orderType === "MODEL_1"
                                                        ? "Any details about the fabric you'll bring — color, texture, quantity, or material type..."
                                                        : "Any preferences for the fabric the studio sources — color family, texture, material type, or things to avoid..."
                                                }
                                                maxLength={1000}
                                                className="resize-none border-input focus-visible:ring-ring focus-visible:border-ring min-h-[80px]"
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* ── 3. Measurements ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <Ruler size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">Measurements</h2>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            {hasMeasurements ? (
                                <>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        We have your measurements on file. How would you like to proceed?
                                    </p>
                                    <MeasurementSnapshot measurement={measurement} />
                                    <div className="space-y-2 mt-3">
                                        {MEASUREMENT_OPTIONS.map((opt) => {
                                            const isSelected = measurementChoice === opt.value;
                                            const Icon = opt.icon;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setMeasurementChoice(opt.value)}
                                                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150
                                                        ${isSelected
                                                            ? "border-primary bg-[#FFF5F8]"
                                                            : "border-input hover:border-primary/30"
                                                        }`}
                                                >
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors
                                                            ${isSelected
                                                                ? "border-primary bg-primary"
                                                                : "border-input bg-white"
                                                            }`}
                                                    >
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                            {opt.label}
                                                        </p>
                                                        <p className="text-xs text-text-light leading-relaxed mt-0.5">
                                                            {opt.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex gap-3 p-3.5 rounded-xl bg-[#FFF8E1] border border-[#F9A825]/20">
                                        <Info size={15} className="text-status-warning shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-status-warning">No measurements on file</p>
                                            <p className="text-xs text-status-warning/80 leading-relaxed mt-0.5">
                                                For the best fit, we strongly recommend having your measurements on record. You can proceed now and add them after,
                                                or book a fitting with our team.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {MEASUREMENT_OPTIONS.filter((o) => o.value !== "saved").map((opt) => {
                                            const isSelected = measurementChoice === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    type="button"
                                                    onClick={() => setMeasurementChoice(opt.value)}
                                                    className={`w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all duration-150
                                                        ${isSelected
                                                            ? "border-primary bg-[#FFF5F8]"
                                                            : "border-input hover:border-primary/30"
                                                        }`}
                                                >
                                                    <div
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors
                                                            ${isSelected ? "border-primary bg-primary" : "border-input bg-white"}`}
                                                    >
                                                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                                                            {opt.label}
                                                        </p>
                                                        <p className="text-xs text-text-light leading-relaxed mt-0.5">
                                                            {opt.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── 4. Your Information ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.14 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <User size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">Your Information</h2>
                        </div>
                        <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <p className="text-[11px] text-text-light uppercase tracking-wider mb-0.5">Email</p>
                                <p className="text-sm font-medium text-foreground break-all">{user?.email || "—"}</p>
                            </div>
                            <div>
                                <p className="text-[11px] text-text-light uppercase tracking-wider mb-0.5">Phone</p>
                                <p className="text-sm font-medium text-foreground">{user?.phone || "—"}</p>
                            </div>
                            {user?.address && (
                                <div className="sm:col-span-2">
                                    <p className="text-[11px] text-text-light uppercase tracking-wider mb-0.5">Saved Address</p>
                                    <p className="text-sm font-medium text-foreground">{user.address}</p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── 5. Fulfilment ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.17 }}
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
                                            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-150
                                                ${isSelected
                                                    ? "border-primary bg-[#FFF5F8]"
                                                    : "border-input bg-white hover:border-primary/30"
                                                }`}
                                        >
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-text-light"}`}>
                                                <Icon size={16} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{opt.label}</p>
                                                <p className="text-xs text-text-light leading-snug mt-0.5">{opt.description}</p>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                    <Check size={10} className="text-white" strokeWidth={3} />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Delivery address */}
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
                                            {user?.address && (
                                                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted">
                                                    <Checkbox
                                                        id="useProfileAddress"
                                                        checked={useProfileAddress}
                                                        onCheckedChange={setUseProfileAddress}
                                                        className="mt-0.5 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                    />
                                                    <div>
                                                        <Label htmlFor="useProfileAddress" className="text-sm font-medium text-foreground cursor-pointer leading-snug">
                                                            Deliver to my saved address
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-0.5">{user.address}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {(!user?.address || !useProfileAddress) && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                                                    <Label className="text-sm font-medium text-foreground mb-1.5 block">
                                                        Delivery Address <span className="text-destructive">*</span>
                                                    </Label>
                                                    <div className="relative">
                                                        <MapPin size={15} className="absolute left-3 top-3 text-text-light z-10" />
                                                        <Textarea
                                                            value={deliveryAddress}
                                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                                            placeholder="Enter your full delivery address including landmark..."
                                                            className="pl-9 resize-none border-input focus-visible:ring-ring focus-visible:border-ring min-h-[80px]"
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

                    {/* ── 6. Order Note ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.2 }}
                        className="rounded-xl border border-border bg-white overflow-hidden"
                    >
                        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
                            <FileText size={16} className="text-primary" />
                            <h2 className="font-semibold text-sm text-foreground">Order Note</h2>
                            <span className="ml-auto text-xs text-text-light">Optional</span>
                        </div>
                        <div className="px-5 py-4 space-y-3">
                            <div className="flex gap-2.5 p-3 rounded-lg bg-muted">
                                <Info size={14} className="text-primary shrink-0 mt-0.5" />
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Use this space to share any specifics about your order — preferred length,
                                    lining, event occasion, color adjustments, or anything else your tailor
                                    should know. <strong className="text-foreground">The more detail you provide, the closer we'll get to your vision on the first try.</strong>
                                </p>
                            </div>
                            <Textarea
                                value={clientNotes}
                                onChange={(e) => setClientNotes(e.target.value)}
                                placeholder="e.g. I need this for a wedding in April — I'd like the hem to be tea-length and the sleeves to be detachable..."
                                maxLength={1000}
                                className="resize-none border-input focus-visible:ring-ring focus-visible:border-ring min-h-[100px]"
                            />
                            <p className="text-xs text-text-light text-right">{clientNotes.length}/1000</p>
                        </div>
                    </motion.div>

                    {/* ── 7. Authorization + CTA ─── */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: 0.24 }}
                        className="rounded-xl border border-border bg-white p-5 space-y-5"
                    >
                        <div className="flex items-center gap-3">
                            <Checkbox
                                id="authorised"
                                checked={authorised}
                                onCheckedChange={setAuthorised}
                                className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <Label
                                htmlFor="authorised"
                                className="text-sm text-muted-foreground leading-relaxed cursor-pointer inline text-justify"
                            >
                                I have reviewed my order details and confirm they are correct. I understand
                                this is a <span className="font-semibold text-primary">bespoke order</span> —
                                pricing will be provided by the studio after review, and payment (full or
                                installment) is required before production begins.
                            </Label>
                        </div>

                        <Button
                            onClick={handlePlaceOrder}
                            disabled={!authorised || isSubmitting}
                            className={`w-full h-12 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
                                ${authorised
                                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                                    : "bg-[#E0E0E0] text-text-light cursor-not-allowed"
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="border-[3px] border-white/30 border-t-white rounded-full animate-spin size-4" />
                                    Placing Order...
                                </>
                            ) : (
                                <>
                                    Place Order
                                    <ArrowRight size={16} />
                                </>
                            )}
                        </Button>

                        <p className="text-xs text-text-light text-center leading-relaxed">
                            No payment is collected now. The studio will send you a quote within 24 hours.
                        </p>
                    </motion.div>
                </div>

                {/* ─── RIGHT: Sticky payment info ─────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 }}
                    className="lg:sticky lg:top-20 h-fit space-y-4"
                >
                    <PaymentInfoCard compact />
                    <div className="rounded-xl border border-border bg-surface-2 p-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            How pricing works
                        </p>
                        <p className="text-xs text-text-light leading-relaxed">
                            Bespoke orders are priced after our studio reviews your specifications.
                            You'll receive a personalised quote within 24 hours — no surprise costs.
                            Payment (full or installment) is only required once you've approved the quote.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Booking modal triggered via success state */}
            <BookingModal isOpen={bookingOpen} onOpenChange={setBookingOpen} />
        </div>
    );
}
