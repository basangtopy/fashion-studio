"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, CalendarOff, Plus, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import StatusPill from "@/components/shared/StatusPill";
import PageTransition from "@/components/shared/PageTransition";
import { BookingModal } from "@/components/shared/BookingModal";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
    REQUESTED: { icon: Clock, color: "#E65100", bg: "#FFF3E0", label: "Awaiting confirmation from the studio" },
    CONFIRMED: { icon: CheckCircle, color: "#2E7D32", bg: "#E8F5E9", label: "Your appointment is confirmed" },
    COMPLETED: { icon: CheckCircle, color: "#0D0D0D", bg: "#F4F0F8", label: "Appointment completed" },
    CANCELLED: { icon: XCircle, color: "#C62828", bg: "#FFEBEE", label: "This appointment was cancelled" },
};

const staggerItem = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ClientAppointmentsPage() {
    const [bookingOpen, setBookingOpen] = useState(false);
    const [expanded, setExpanded] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ["client-appointments"],
        queryFn: async () => {
            const { data } = await api.get("/appointments/own");
            return data.data?.appointments || data.data || [];
        },
    });

    const appointments = Array.isArray(data) ? data : [];

    // Separate active (REQUESTED/CONFIRMED) from past (COMPLETED/CANCELLED)
    const active = appointments.filter(a => a.status === "REQUESTED" || a.status === "CONFIRMED")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const past = appointments.filter(a => a.status === "COMPLETED" || a.status === "CANCELLED")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Check if user can book a new appointment (no active REQUESTED)
    const hasPendingRequest = appointments.some(a => a.status === "REQUESTED");

    return (
        <PageTransition>
            <div className="pb-20 lg:pb-0 max-w-3xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D0D0D]">My Appointments</h1>
                        <p className="text-sm text-[#999]">View and manage your fitting appointments</p>
                    </div>
                    {!hasPendingRequest && (
                        <Button
                            onClick={() => setBookingOpen(true)}
                            className="h-10 px-5 gap-2 bg-[#C2185B] text-white hover:bg-[#A01548] transition-all duration-200 hover:-translate-y-0.5"
                        >
                            <Plus size={14} /> Book New Appointment
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="rounded-xl border border-[rgba(0,0,0,0.06)] p-5 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="skeleton w-8 h-8 rounded-full" />
                                    <div className="skeleton h-4 w-40" />
                                    <div className="skeleton h-5 w-20 rounded-full ml-auto" />
                                </div>
                                <div className="skeleton h-3 w-56" />
                                <div className="skeleton h-3 w-32" />
                            </div>
                        ))}
                    </div>
                ) : appointments.length === 0 ? (
                    <EmptyState
                        icon={CalendarOff}
                        title="No appointments yet"
                        description="Book a fitting appointment with our studio to get measured for your perfect outfit."
                        action={
                            <Button
                                onClick={() => setBookingOpen(true)}
                                className="h-10 px-6 bg-[#C2185B] text-white hover:bg-[#A01548] gap-2"
                            >
                                <Plus size={14} /> Book Your First Appointment
                            </Button>
                        }
                    />
                ) : (
                    <div className="space-y-8">
                        {/* Active appointments */}
                        {active.length > 0 && (
                            <div>
                                <h2 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-4">Active</h2>
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{ show: { transition: { staggerChildren: 0.08 } } }}
                                    className="space-y-4"
                                >
                                    {active.map(apt => (
                                        <AppointmentCard
                                            key={apt.id}
                                            apt={apt}
                                            expanded={expanded === apt.id}
                                            onToggle={() => setExpanded(expanded === apt.id ? null : apt.id)}
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        )}

                        {/* Past appointments */}
                        {past.length > 0 && (
                            <div>
                                <h2 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-4">Past</h2>
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{ show: { transition: { staggerChildren: 0.06 } } }}
                                    className="space-y-4"
                                >
                                    {past.map(apt => (
                                        <AppointmentCard
                                            key={apt.id}
                                            apt={apt}
                                            expanded={expanded === apt.id}
                                            onToggle={() => setExpanded(expanded === apt.id ? null : apt.id)}
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        )}
                    </div>
                )}

                <BookingModal isOpen={bookingOpen} onOpenChange={setBookingOpen} />
            </div>
        </PageTransition>
    );
}

function AppointmentCard({ apt, expanded, onToggle }) {
    const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.REQUESTED;
    const Icon = config.icon;
    const mainDate = apt.confirmedDate || apt.requestedDate;

    return (
        <motion.div variants={staggerItem} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden hover:border-[rgba(0,0,0,0.12)] transition-all duration-200">
            <div className="p-5">
                {/* Top: status icon, status message, and pill */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: config.bg }}>
                            <Icon size={18} style={{ color: config.color }} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-[#0D0D0D]">{config.label}</p>
                            <p className="text-xs text-[#999] mt-0.5">
                                {mainDate ? format(new Date(mainDate), "EEEE, MMMM d, yyyy") : "No date set"}
                            </p>
                        </div>
                    </div>
                    <StatusPill status={apt.status} />
                </div>

                {/* Date details */}
                <div className="flex flex-wrap gap-4 text-xs text-[#555] mb-4">
                    {apt.requestedDate && (
                        <div className="flex items-center gap-1.5">
                            <CalendarIcon size={12} className="text-[#999]" />
                            <span>Requested: {format(new Date(apt.requestedDate), "MMM d, yyyy")}</span>
                        </div>
                    )}
                    {apt.confirmedDate && (
                        <div className="flex items-center gap-1.5">
                            <CheckCircle size={12} className="text-[#2E7D32]" />
                            <span className="text-[#2E7D32] font-medium">Confirmed: {format(new Date(apt.confirmedDate), "MMM d, yyyy")}</span>
                        </div>
                    )}
                </div>

                {/* Admin notes (visible to client) */}
                {apt.adminNotes && (
                    <div className="p-3 rounded-lg bg-[#F4F0F8] text-xs text-[#555] mb-3 flex items-start gap-2">
                        <MessageSquare size={12} className="text-[#C2185B] shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-[#0D0D0D] mb-0.5">Note from the studio</p>
                            <p>{apt.adminNotes}</p>
                        </div>
                    </div>
                )}

                {/* Cancel reason (visible to client) */}
                {apt.cancelReason && (
                    <div className="p-3 rounded-lg bg-[#FFEBEE] text-xs text-[#C62828] mb-3 border border-[#FFCDD2]">
                        <p className="font-medium mb-0.5">Reason for cancellation</p>
                        <p>{apt.cancelReason}</p>
                    </div>
                )}

                {/* Expand toggle */}
                {apt.clientNotes && (
                    <button
                        onClick={onToggle}
                        className="flex items-center gap-1 text-xs text-[#C2185B] font-medium hover:underline transition-colors"
                    >
                        <span>{expanded ? "Hide" : "Show"} your notes</span>
                        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                )}
            </div>

            {/* Expanded client notes */}
            <AnimatePresence>
                {expanded && apt.clientNotes && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                    >
                        <div className="px-5 pb-5 pt-0">
                            <div className="p-3 rounded-lg bg-[#FAFAFA] text-xs text-[#555] border border-[rgba(0,0,0,0.04)]">
                                <p className="font-medium text-[#0D0D0D] mb-0.5">Your notes</p>
                                <p className="whitespace-pre-wrap">{apt.clientNotes}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
