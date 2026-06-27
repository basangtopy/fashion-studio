"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ShoppingBag,
    CreditCard,
    Ruler,
    Calendar,
    ArrowRight,
    Eye,
    MessageSquare,
    Star,
    Send,
    X,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency, getGreeting, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonStat, SkeletonCard } from "@/components/shared/Skeleton";
import OrderListItem from "@/components/shared/OrderListItem";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/shared/ImageUpload";
import EmptyState from "@/components/shared/EmptyState";
import NewOrderDialog from "@/components/shared/NewOrderDialog";
const LIFECYCLE_STEPS = [
    { label: "Review", maxStep: 0 },
    { label: "Agreement", maxStep: 1 },
    { label: "Payment", maxStep: 2 },
    { label: "Production", maxStep: 6 },    // IN_PROGRESS, CUTTING, SEWING, FINISHING
    { label: "Delivery", maxStep: 8 },       // AWAITING_FINAL_PAYMENT, READY_FOR_PICKUP, OUT_FOR_DELIVERY
    { label: "Complete", maxStep: 9 },
];

function getActiveStep(status) {
    const config = ORDER_STATUS[status];
    if (!config || config.step < 0) return -1; // cancelled
    const step = config.step;
    for (let i = 0; i < LIFECYCLE_STEPS.length; i++) {
        if (step <= LIFECYCLE_STEPS[i].maxStep) return i;
    }
    return LIFECYCLE_STEPS.length - 1;
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon: Icon, color, isCurrency, contextLine, delay = 0 }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
    const numericValue = typeof value === "number" ? value : parseInt(value) || 0;
    const animatedValue = useCountUp(numericValue, 800, isVisible);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 12 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay }}
            className="p-5 rounded-xl border border-border bg-white"
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-light uppercase tracking-wider">{label}</span>
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${color}15` }}
                >
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold font-mono-data text-foreground">
                {isCurrency ? formatCurrency(animatedValue) : (typeof value === "string" ? value : animatedValue)}
            </p>
            {contextLine && (
                <p className="text-[11px] text-text-light mt-1">{contextLine}</p>
            )}
        </motion.div>
    );
}

/* ─── Progress Step Dots ─── */
function ProgressSteps({ status }) {
    const activeIdx = getActiveStep(status);
    const isCancelled = activeIdx < 0;

    return (
        <div className="flex items-center gap-1 mt-3">
            {LIFECYCLE_STEPS.map((step, i) => {
                const isCompleted = !isCancelled && i < activeIdx;
                const isActive = !isCancelled && i === activeIdx;
                return (
                    <div key={step.label} className="flex items-center gap-1">
                        <div
                            className={`w-2 h-2 rounded-full transition-colors ${isCompleted
                                ? "bg-status-success"
                                : isActive
                                    ? "bg-primary"
                                    : "bg-[#E0E0E0]"
                                }`}
                            title={step.label}
                        />
                        {i < LIFECYCLE_STEPS.length - 1 && (
                            <div className={`w-3 h-[1.5px] ${isCompleted ? "bg-status-success" : "bg-[#E0E0E0]"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main Dashboard ─── */
export default function ClientDashboard() {
    const { user } = useAuth();
    const pathname = usePathname();
    const [dialogOpen, setDialogOpen] = useState(false);
    const toast = useToast();
    const queryClient = useQueryClient();

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewFormData, setReviewFormData] = useState({ rating: 5, review: "" });
    const [reviewNewImageFiles, setReviewNewImageFiles] = useState([]);

    const { data: orders, isLoading: ordersLoading } = useQuery({
        queryKey: ["client-orders"],
        queryFn: async () => {
            const { data } = await api.get("/orders");
            return data.data?.orders || data.data || [];
        },
    });

    const { data: notifData } = useQuery({
        queryKey: ["client-notifications"],
        queryFn: async () => {
            const { data } = await api.get("/notifications");
            return data.data;
        },
        refetchInterval: 30000,
    });

    const { data: pendingAppointment } = useQuery({
        queryKey: ["pendingAppointment"],
        queryFn: async () => {
            const { data } = await api.get("/appointments/own");
            const appointments = data.data?.appointments || data.data || [];
            return appointments.find((a) => a.status === "REQUESTED" || a.status === "CONFIRMED") || null;
        }
    });

    const allOrders = Array.isArray(orders) ? orders : [];
    const activeOrders = allOrders.filter(
        (o) => !["COMPLETED", "CANCELLED"].includes(o.status)
    );
    const totalPaid = allOrders.reduce((s, o) => s + Number(o.totalPaid || 0), 0);
    const outstandingBalance = allOrders.reduce((s, o) => {
        const agreed = Number(o.agreedFee || o.totalAgreedFee || 0);
        const paid = Number(o.totalPaid || 0);
        return s + Math.max(0, agreed - paid);
    }, 0);

    const notifications = notifData?.notifications || (Array.isArray(notifData) ? notifData : []);
    const recentNotifs = notifications.slice(0, 3);

    // Format today's date
    const today = new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const reviewSubmitMutation = useMutation({
        mutationFn: async (payload) => {
            const formData = new FormData();
            formData.append("rating", payload.rating);
            formData.append("review", payload.review);
            if (reviewNewImageFiles[0]) {
                formData.append("reviews", reviewNewImageFiles[0]);
            }

            const { data } = await api.post("/testimonials", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return data;
        },
        onSuccess: () => {
            toast.success("Thank you!", "Your review has been submitted and is pending approval.");
            setShowReviewForm(false);
            setReviewFormData({ rating: 5, review: "" });
            setReviewNewImageFiles([]);
            queryClient.invalidateQueries({ queryKey: ["testimonials"] });
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Could not submit review.");
        },
    });

    const pendingAppointmentDate = pendingAppointment?.requestedDate;
    const pendingAppointmentStatus = pendingAppointment?.status;

    return (
        <div className="pb-20 lg:pb-0">
            {/* ─── Welcome Header ─── */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                    {getGreeting()}, {user?.fullName?.split(" ")[0] || "there"}
                </h1>
                <p className="text-sm text-text-light">{today}</p>
            </div>

            {/* ─── Stat Cards (4) ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {ordersLoading ? (
                    Array.from({ length: 4 }).map((_, i) => <SkeletonStat key={i} />)
                ) : (
                    <>
                        <StatCard
                            label="Active Orders"
                            value={activeOrders.length}
                            icon={ShoppingBag}
                            color="#6A1B9A"
                            delay={0}
                            contextLine={`${allOrders.length} total orders`}
                        />
                        <StatCard
                            label="Total Paid"
                            value={totalPaid}
                            icon={CreditCard}
                            color="#2E7D32"
                            delay={0.06}
                            isCurrency
                        />
                        <StatCard
                            label="Outstanding Balance"
                            value={outstandingBalance}
                            icon={CreditCard}
                            color="#E65100"
                            delay={0.12}
                            isCurrency
                            contextLine={outstandingBalance > 0 ? "Across all orders" : "All clear!"}
                        />
                        <Link href="/client/appointments" className="block">
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.18 }}
                                className="p-5 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-medium text-text-light uppercase tracking-wider">Appointment</span>
                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1565C015" }}>
                                        <Calendar size={18} style={{ color: 'var(--color-status-info)' }} />
                                    </div>
                                </div>
                                {pendingAppointment ? (
                                    <>
                                        <p className="text-sm font-bold text-foreground mb-1">
                                            {new Date(pendingAppointment.confirmedDate || pendingAppointment.requestedDate).toLocaleDateString("en-NG", {
                                                weekday: "short", month: "short", day: "numeric",
                                            })}
                                        </p>
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <StatusPill status={pendingAppointment.status} size="small" />
                                        </div>
                                        {pendingAppointment.adminNotes && (
                                            <p className="text-[10px] text-text-light mt-1 truncate">💬 {pendingAppointment.adminNotes}</p>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg font-bold text-foreground">None booked</p>
                                        <p className="text-[11px] text-primary font-medium mt-1">Book an appointment →</p>
                                    </>
                                )}
                            </motion.div>
                        </Link>
                    </>
                )}
            </div>

            {/* ─── Active Orders ─── */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">Active Orders</h2>
                    <Link
                        href="/client/orders"
                        className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                        View all <ArrowRight size={12} />
                    </Link>
                </div>

                {ordersLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : activeOrders.length === 0 ? (
                    <EmptyState
                        icon={ShoppingBag}
                        title="No active orders"
                        description="Browse our catalog to place your first order."
                        action={
                            <Link
                                href="/catalog/styles"
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                            >
                                Explore Styles <ArrowRight size={14} />
                            </Link>
                        }
                    />
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
                        }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                    >
                        {activeOrders.slice(0, 4).map((order) => (
                            <motion.div
                                key={order.id}
                                className="h-full"
                                variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            >
                                <OrderListItem order={order} variant="card" />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* ─── Quick Actions ─── */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
                    }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                >
                    {/* Place New Order — opens dialog */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="w-full h-full p-4 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors flex flex-col items-center text-center gap-2"
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#C2185B15" }}>
                                <ShoppingBag size={18} style={{ color: 'var(--color-brand-primary)' }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Place New Order</span>
                        </button>
                    </motion.div>

                    {/* Update Measurements */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                        <Link href="/client/measurements" className="h-full p-4 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors flex flex-col items-center text-center gap-2">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent-purple) 8%, transparent)' }}>
                                <Ruler size={18} style={{ color: 'var(--color-accent-purple)' }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Update Measurements</span>
                        </Link>
                    </motion.div>

                    {/* Book Appointment */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                        <Link
                            href={user ? `${pathname}?action=book_appointment` : `/login?redirectURL=${encodeURIComponent(pathname)}&action=book_appointment`}
                            scroll={false}
                            className="h-full p-4 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors flex flex-col items-center text-center gap-2"
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#1565C015" }}>
                                <Calendar size={18} style={{ color: 'var(--color-status-info)' }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Book Appointment</span>
                        </Link>
                    </motion.div>

                    {/* Write Review */}
                    <motion.div variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}>
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="w-full h-full p-4 rounded-xl border border-border bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors flex flex-col items-center text-center gap-2"
                        >
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#2E7D3215" }}>
                                <Star size={18} style={{ color: 'var(--color-status-success)' }} />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Write a Review</span>
                        </button>
                    </motion.div>
                </motion.div>
            </div>

            {/* ─── Recent Notifications ─── */}
            {
                recentNotifs.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-foreground">Recent Notifications</h2>
                            <Button
                                variant="link"
                                className="h-auto p-0 text-xs font-semibold text-primary"
                            >
                                View all
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {recentNotifs.map((n) => (
                                <div
                                    key={n.id}
                                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${n.isRead
                                        ? "border-border bg-white"
                                        : "border-primary/20 bg-[#FFF5F8]"
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${n.isRead ? "bg-transparent" : "bg-primary"}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${n.isRead ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                                            {n.title || n.message}
                                        </p>
                                        <p className="text-[10px] text-text-light mt-0.5">
                                            {new Date(n.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            }

            {/* Review Submission Modal */}
            <AnimatePresence>
                {showReviewForm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setShowReviewForm(false)}
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
                                <h3 className="text-lg font-semibold text-foreground">Share Your Review</h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowReviewForm(false)} className="w-8 h-8 rounded-md hover:bg-muted">
                                    <X size={18} className="text-text-light" />
                                </Button>
                            </div>

                            {/* Star Rating */}
                            <div className="mb-4">
                                <label className="text-sm font-medium text-foreground mb-2 block">Rating</label>
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setReviewFormData((prev) => ({ ...prev, rating: i + 1 }))}
                                            className="p-1 transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={28}
                                                className={
                                                    i < reviewFormData.rating
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
                                <label className="text-sm font-medium text-foreground mb-2 block">Your Review</label>
                                <Textarea
                                    value={reviewFormData.review}
                                    onChange={(e) =>
                                        setReviewFormData((prev) => ({ ...prev, review: e.target.value }))
                                    }
                                    placeholder="Tell us about your experience..."
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="mb-6">
                                <label className="text-sm font-medium text-foreground mb-2 block">Add a Photo (Optional)</label>
                                <ImageUpload
                                    existingImages={[]}
                                    newFiles={reviewNewImageFiles}
                                    onNewFilesChange={setReviewNewImageFiles}
                                    onExistingImagesReorder={() => { }}
                                    onExistingImageDelete={() => { }}
                                    maxFiles={1}
                                />
                            </div>

                            <Button
                                onClick={() => reviewSubmitMutation.mutate(reviewFormData)}
                                disabled={!reviewFormData.review.trim() || reviewSubmitMutation.isPending}
                                className="w-full flex h-auto items-center justify-center gap-2 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                <Send size={16} />
                                {reviewSubmitMutation.isPending ? "Submitting..." : "Submit Review"}
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Order Dialog */}
            <NewOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
    );
}
