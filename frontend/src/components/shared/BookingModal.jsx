"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2, Sparkles, CheckCircle2, CheckCircle, XCircle, MessageSquare, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import Link from "next/link";

const STATUS_DISPLAY = {
    REQUESTED: { icon: Clock, color: "#E65100", bg: "rgba(230, 81, 0, 0.08)", title: "Pending Studio Review", desc: "is being reviewed. We'll contact you shortly to confirm." },
    CONFIRMED: { icon: CheckCircle, color: "#2E7D32", bg: "rgba(46, 125, 50, 0.08)", title: "Appointment Confirmed", desc: "has been confirmed. See you at the studio!" },
    COMPLETED: { icon: CheckCircle2, color: "#555", bg: "rgba(0, 0, 0, 0.06)", title: "Appointment Completed", desc: "has been completed. You can book a new one." },
    CANCELLED: { icon: XCircle, color: "#C62828", bg: "rgba(198, 40, 40, 0.08)", title: "Appointment Cancelled", desc: "was cancelled." },
};

export function BookingModal({ isOpen, onOpenChange }) {
    const { user, isAuthenticated } = useAuth();
    const { success, error, warning } = useToast();
    const queryClient = useQueryClient();

    const [date, setDate] = useState(null);
    const [notes, setNotes] = useState("");



    // Fetch latest active appointment (not just REQUESTED — show all active statuses)
    const { data: activeAppointment, isLoading: isLoadingStatus, isError } = useQuery({
        queryKey: ["activeAppointment"],
        queryFn: async () => {
            const { data } = await api.get("/appointments/own");
            const appointments = data.data?.appointments || data.data || [];
            // Priority: REQUESTED > CONFIRMED > most recent COMPLETED/CANCELLED
            const requested = appointments.find((a) => a.status === "REQUESTED");
            if (requested) return requested;
            const confirmed = appointments.find((a) => a.status === "CONFIRMED");
            if (confirmed) return confirmed;
            // Return most recent overall
            return appointments[0] || null;
        },

        enabled: !!isOpen && !!isAuthenticated,
    });

    if (isError) {
        error("Error", "Failed to fetch appointments.");
    }

    const { mutate: requestAppointment, isPending: isSubmitting } = useMutation({
        mutationFn: async ({ requestedDate, clientNotes }) => {
            const { data } = await api.post("/appointments", {
                requestedDate,
                clientNotes,
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["activeAppointment"] });
            queryClient.invalidateQueries({ queryKey: ["pendingAppointment"] });
            queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
        },
    });

    // Clean form when closing
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setDate(null);
                setNotes("");
            }, 300);
        }
    }, [isOpen]);

    if (!isOpen || !isAuthenticated) return;

    const handleSubmit = () => {
        if (!date) return;

        requestAppointment({
            requestedDate: date.toISOString(),
            clientNotes: notes,
        }, {
            onSuccess: () => {
                success(
                    "Request submitted",
                    "Your fitting appointment request has been sent to our studio."
                );
            },
            onError: (err) => {
                if (err.response?.status === 409) {
                    warning(
                        "Already Requested",
                        "You already have a pending appointment request."
                    );
                } else {
                    error(
                        "Error",
                        err.response?.data?.message || "Failed to request appointment."
                    );
                }
            },
        });
    };

    if (!isAuthenticated) return null;

    // Determine if user can book a new appointment (only if no active REQUESTED)
    const canBookNew = !activeAppointment || activeAppointment.status === "COMPLETED" || activeAppointment.status === "CANCELLED";
    const showStatus = activeAppointment && (activeAppointment.status === "REQUESTED" || activeAppointment.status === "CONFIRMED");
    const showPastStatus = activeAppointment && (activeAppointment.status === "COMPLETED" || activeAppointment.status === "CANCELLED");

    const statusConfig = activeAppointment ? STATUS_DISPLAY[activeAppointment.status] : null;
    const StatusIcon = statusConfig?.icon || Clock;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0">

                {/* — Premium Modal Header — */}
                <div className="relative px-7 pt-7 pb-5">
                    <div
                        className="absolute top-0 left-0 right-0 h-[3px]"
                        style={{
                            background: "linear-gradient(90deg, #C2185B 0%, #F8E8F0 60%, transparent 100%)",
                        }}
                    />
                    <DialogHeader className="gap-1">
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <div
                                className="flex h-7 w-7 items-center justify-center rounded-lg flex-shrink-0"
                                style={{ background: "rgba(194, 24, 91, 0.08)" }}
                            >
                                <Sparkles className="h-3.5 w-3.5" style={{ color: "#C2185B" }} />
                            </div>
                            <DialogTitle
                                className="text-[17px] leading-snug font-display font-700"
                                style={{ fontWeight: 700, color: "#0D0D0D", letterSpacing: "-0.01em" }}
                            >
                                {showStatus ? statusConfig.title : canBookNew ? "Book a Fitting" : "Appointment Status"}
                            </DialogTitle>
                        </div>
                        <DialogDescription
                            className="text-[13px] leading-relaxed pl-[36px]"
                            style={{ color: "#999999" }}
                        >
                            {showStatus
                                ? "Your appointment details at a glance."
                                : canBookNew
                                    ? "Choose a preferred date and we'll confirm your studio session."
                                    : "Review your appointment details below."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="mx-7" style={{ height: "1px", background: "rgba(0,0,0,0.06)" }} />

                {/* — Modal Body — */}
                <div className="px-7 py-6 min-h-[360px] flex flex-col justify-center">
                    {isLoadingStatus ? (
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="relative flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(194, 24, 91, 0.06)" }}>
                                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#C2185B" }} />
                            </div>
                            <div className="text-center">
                                <p className="text-[13px] font-medium" style={{ color: "#555555" }}>Checking studio availability</p>
                                <p className="text-[12px] mt-0.5" style={{ color: "#999999" }}>Just a moment…</p>
                            </div>
                        </div>

                    ) : showStatus ? (
                        /* Active Appointment State (REQUESTED or CONFIRMED) */
                        <div className="flex flex-col items-center text-center gap-5">
                            <div className="relative flex items-center justify-center">
                                <div className="absolute h-20 w-20 rounded-full" style={{ background: statusConfig.bg }} />
                                <div className="absolute h-14 w-14 rounded-full" style={{ background: statusConfig.bg, opacity: 0.7 }} />
                                <div className="relative h-10 w-10 rounded-full flex items-center justify-center" style={{ background: statusConfig.bg }}>
                                    <StatusIcon className="h-5 w-5" style={{ color: statusConfig.color }} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-[15px] font-semibold" style={{ color: "#0D0D0D", letterSpacing: "-0.01em" }}>
                                    {statusConfig.title}
                                </h3>
                                <p className="text-[13px] leading-relaxed max-w-[280px]" style={{ color: "#555555" }}>
                                    Your request for{" "}
                                    <span className="font-semibold" style={{ color: "#0D0D0D" }}>
                                        {activeAppointment.confirmedDate
                                            ? format(new Date(activeAppointment.confirmedDate), "MMMM d, yyyy")
                                            : activeAppointment.requestedDate
                                                ? format(new Date(activeAppointment.requestedDate), "MMMM d, yyyy")
                                                : "a fitting"}
                                    </span>{" "}
                                    {statusConfig.desc}
                                </p>
                            </div>

                            {/* Status pill with pulse */}
                            <div
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase"
                                style={{
                                    background: statusConfig.bg,
                                    color: statusConfig.color,
                                    letterSpacing: "0.06em",
                                }}
                            >
                                <div className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: statusConfig.color }} />
                                {activeAppointment.status === "REQUESTED" ? "Awaiting Confirmation" : "Confirmed"}
                            </div>

                            {/* Client notes */}
                            {activeAppointment.clientNotes && (
                                <div className="w-full text-left p-3 rounded-lg text-[12px]" style={{ background: "rgba(0,0,0,0.03)", color: "#555" }}>
                                    <p className="font-medium text-[#0D0D0D] mb-0.5 text-[11px] uppercase tracking-wider">Your notes</p>
                                    <p>{activeAppointment.clientNotes}</p>
                                </div>
                            )}

                            {/* Admin notes */}
                            {activeAppointment.adminNotes && (
                                <div className="w-full text-left p-3 rounded-lg text-[12px] flex items-start gap-2" style={{ background: "rgba(194, 24, 91, 0.05)" }}>
                                    <MessageSquare size={12} className="text-[#C2185B] shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-[#0D0D0D] mb-0.5 text-[11px] uppercase tracking-wider">Studio note</p>
                                        <p style={{ color: "#555" }}>{activeAppointment.adminNotes}</p>
                                    </div>
                                </div>
                            )}

                            {/* View all link */}
                            <Link
                                href="/client/appointments"
                                onClick={() => onOpenChange(false)}
                                className="flex items-center gap-1 text-[12px] font-medium text-[#C2185B] hover:underline"
                            >
                                View all appointments <ArrowRight size={12} />
                            </Link>

                            <Button
                                variant="outline"
                                className="w-full mt-1 border-[1.5px] text-[13px] font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                                style={{ borderColor: "rgba(0,0,0,0.12)", color: "#555555", height: "42px" }}
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </div>

                    ) : canBookNew ? (
                        /* Booking Form State (no active, or past appointment — can book new) */
                        <div className="space-y-5">
                            {/* Show past appointment info if exists */}
                            {showPastStatus && (
                                <div className="p-3 rounded-lg text-[12px] mb-2" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <StatusIcon size={12} />
                                        <span className="font-semibold">{statusConfig.title}</span>
                                    </div>
                                    {activeAppointment.cancelReason && (
                                        <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>Reason: {activeAppointment.cancelReason}</p>
                                    )}
                                    <p className="text-[11px] mt-1" style={{ color: "#555" }}>You can book a new appointment below.</p>
                                </div>
                            )}

                            {/* Date Picker */}
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium block" style={{ color: "#0D0D0D" }}>
                                    Preferred Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-[1.5px] transition-all duration-200 hover:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                                !date && "text-muted-foreground"
                                            )}
                                            style={{
                                                height: "44px",
                                                borderColor: date ? "#C2185B" : "#E0E0E0",
                                                borderRadius: "6px",
                                            }}
                                        >
                                            <CalendarIcon
                                                className="mr-2.5 h-4 w-4 flex-shrink-0"
                                                style={{ color: date ? "#C2185B" : "#999999" }}
                                            />
                                            <span style={{ color: date ? "#0D0D0D" : "#999999", fontSize: "14px" }}>
                                                {date ? format(date, "PPP") : "Pick a date"}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        style={{ borderColor: "rgba(0,0,0,0.08)", borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(date) =>
                                                date < new Date().setHours(0, 0, 0, 0) || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-[13px] font-medium block" style={{ color: "#0D0D0D" }}>
                                    Additional Notes{" "}
                                    <span className="font-normal" style={{ color: "#999999" }}>(Optional)</span>
                                </label>
                                <Textarea
                                    placeholder="Share any specific requirements, garment ideas, or questions for your fitting…"
                                    className="resize-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 placeholder:text-[13px]"
                                    style={{
                                        minHeight: "96px",
                                        borderWidth: "1.5px",
                                        borderColor: "#E0E0E0",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        color: "#0D0D0D",
                                    }}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            {/* Submit CTA */}
                            <Button
                                className="w-full font-semibold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 hover:shadow-md disabled:hover:translate-y-0 disabled:hover:shadow-none"
                                style={{
                                    height: "44px",
                                    background: date ? "#C2185B" : undefined,
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    letterSpacing: "-0.01em",
                                }}
                                disabled={!date || isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting Request…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Confirm Booking Request
                                    </>
                                )}
                            </Button>

                            {/* Links */}
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] leading-relaxed" style={{ color: "#999999" }}>
                                    This is a request — we'll contact you to confirm.
                                </p>
                                <Link
                                    href="/client/appointments"
                                    onClick={() => onOpenChange(false)}
                                    className="text-[11px] font-medium text-[#C2185B] hover:underline whitespace-nowrap"
                                >
                                    View all →
                                </Link>
                            </div>
                        </div>

                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
