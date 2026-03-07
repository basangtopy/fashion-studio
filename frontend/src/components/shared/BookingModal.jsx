"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
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

export function BookingModal({ isOpen, onOpenChange }) {
    const { user, isAuthenticated } = useAuth();
    const { success, error, warning } = useToast();

    const [date, setDate] = useState(null);
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [pendingAppointment, setPendingAppointment] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);

    // Fetch 'own' appointments to check for a REQUESTED one
    useEffect(() => {
        async function checkPending() {
            if (!isOpen || !isAuthenticated) return;

            setIsLoadingStatus(true);
            try {
                const { data } = await api.get("/appointments/own");
                if (data.success && data.data?.appointments) {
                    const req = data.data.appointments.find((a) => a.status === "REQUESTED");
                    setPendingAppointment(req || null);
                }
            } catch (err) {
                console.error("Error checking appointments:", err);
            } finally {
                setIsLoadingStatus(false);
            }
        }
        checkPending();
    }, [isOpen, isAuthenticated]);

    // Clean form when closing
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setDate(null);
                setNotes("");
            }, 300);
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!date) return;

        setIsSubmitting(true);
        try {
            const { data } = await api.post("/appointments", {
                requestedDate: date.toISOString(),
                clientNotes: notes,
            });

            if (data.success) {
                success(
                    "Request submitted",
                    "Your fitting appointment request has been sent to our studio."
                );
                setPendingAppointment(data.data.appointment);
            }
        } catch (err) {
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
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white border-0">

                {/* — Premium Modal Header — */}
                <div className="relative px-7 pt-7 pb-5">
                    {/* Decorative brand accent strip */}
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
                                <Sparkles
                                    className="h-3.5 w-3.5"
                                    style={{ color: "#C2185B" }}
                                />
                            </div>
                            <DialogTitle
                                className="text-[17px] leading-snug font-display font-700"
                                style={{ fontWeight: 700, color: "#0D0D0D", letterSpacing: "-0.01em" }}
                            >
                                {pendingAppointment ? "Appointment Status" : "Book a Fitting"}
                            </DialogTitle>
                        </div>
                        <DialogDescription
                            className="text-[13px] leading-relaxed pl-[36px]"
                            style={{ color: "#999999" }}
                        >
                            {pendingAppointment
                                ? "Your current appointment request is being reviewed."
                                : "Choose a preferred date and we'll confirm your studio session."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* — Divider — */}
                <div
                    className="mx-7"
                    style={{ height: "1px", background: "rgba(0,0,0,0.06)" }}
                />

                {/* — Modal Body — fixed min-height, flex-centered across all states — */}
                <div className="px-7 py-6 min-h-[360px] flex flex-col justify-center">
                    {isLoadingStatus ? (

                        /* Loading State */
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div
                                className="relative flex h-14 w-14 items-center justify-center rounded-full"
                                style={{ background: "rgba(194, 24, 91, 0.06)" }}
                            >
                                <Loader2
                                    className="h-6 w-6 animate-spin"
                                    style={{ color: "#C2185B" }}
                                />
                            </div>
                            <div className="text-center">
                                <p
                                    className="text-[13px] font-medium"
                                    style={{ color: "#555555" }}
                                >
                                    Checking studio availability
                                </p>
                                <p
                                    className="text-[12px] mt-0.5"
                                    style={{ color: "#999999" }}
                                >
                                    Just a moment…
                                </p>
                            </div>
                        </div>

                    ) : pendingAppointment ? (

                        /* Pending State */
                        <div className="flex flex-col items-center text-center gap-5">
                            {/* Layered ring icon treatment */}
                            <div className="relative flex items-center justify-center">
                                <div
                                    className="absolute h-20 w-20 rounded-full"
                                    style={{ background: "rgba(194, 24, 91, 0.06)" }}
                                />
                                <div
                                    className="absolute h-14 w-14 rounded-full"
                                    style={{ background: "rgba(194, 24, 91, 0.10)" }}
                                />
                                <div
                                    className="relative h-10 w-10 rounded-full flex items-center justify-center"
                                    style={{ background: "rgba(194, 24, 91, 0.15)" }}
                                >
                                    <Clock
                                        className="h-5 w-5"
                                        style={{ color: "#C2185B" }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3
                                    className="text-[15px] font-semibold"
                                    style={{ color: "#0D0D0D", letterSpacing: "-0.01em" }}
                                >
                                    Pending Studio Review
                                </h3>
                                <p
                                    className="text-[13px] leading-relaxed max-w-[260px]"
                                    style={{ color: "#555555" }}
                                >
                                    Your request for{" "}
                                    <span
                                        className="font-semibold"
                                        style={{ color: "#0D0D0D" }}
                                    >
                                        {pendingAppointment.requestedDate
                                            ? format(new Date(pendingAppointment.requestedDate), "MMMM d, yyyy")
                                            : "a fitting"}
                                    </span>{" "}
                                    is being reviewed. We'll contact you shortly to confirm.
                                </p>
                            </div>

                            {/* Status pill */}
                            <div
                                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase"
                                style={{
                                    background: "rgba(194, 24, 91, 0.08)",
                                    color: "#C2185B",
                                    letterSpacing: "0.06em",
                                }}
                            >
                                <div
                                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                                    style={{ background: "#C2185B" }}
                                />
                                Awaiting Confirmation
                            </div>

                            <Button
                                variant="outline"
                                className="w-full mt-1 border-[1.5px] text-[13px] font-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                                style={{
                                    borderColor: "rgba(0,0,0,0.12)",
                                    color: "#555555",
                                    height: "42px",
                                }}
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </div>

                    ) : (

                        /* Booking Form State */
                        <div className="space-y-5">
                            {/* Date Picker */}
                            <div className="space-y-1.5">
                                <label
                                    className="text-[13px] font-medium block"
                                    style={{ color: "#0D0D0D" }}
                                >
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
                                                borderColor: date
                                                    ? "#C2185B"
                                                    : "#E0E0E0",
                                                borderRadius: "6px",
                                            }}
                                        >
                                            <CalendarIcon
                                                className="mr-2.5 h-4 w-4 flex-shrink-0"
                                                style={{ color: date ? "#C2185B" : "#999999" }}
                                            />
                                            <span
                                                style={{
                                                    color: date ? "#0D0D0D" : "#999999",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {date ? format(date, "PPP") : "Pick a date"}
                                            </span>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        style={{
                                            borderColor: "rgba(0,0,0,0.08)",
                                            borderRadius: "10px",
                                            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                                        }}
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(date) =>
                                                date < new Date() || date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label
                                    className="text-[13px] font-medium block"
                                    style={{ color: "#0D0D0D" }}
                                >
                                    Additional Notes{" "}
                                    <span
                                        className="font-normal"
                                        style={{ color: "#999999" }}
                                    >
                                        (Optional)
                                    </span>
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

                            {/* Reassurance footnote */}
                            <p
                                className="text-center text-[11px] leading-relaxed"
                                style={{ color: "#999999" }}
                            >
                                This is a request — we'll contact you to confirm the exact time.
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
