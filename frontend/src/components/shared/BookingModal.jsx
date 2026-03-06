"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock, Loader2 } from "lucide-react";
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
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-background">
                <div className="px-6 pt-6 pb-4 border-b border-border">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-display text-primary">
                            {pendingAppointment ? "Appointment Status" : "Book a Fitting"}
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {pendingAppointment
                                ? "Your current appointment request status."
                                : "Select a date for your studio measurement and fitting session."}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 min-h-[380px] flex flex-col justify-center">
                    {isLoadingStatus ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            <p className="mt-4 text-sm text-muted-foreground">Checking studio availability...</p>
                        </div>
                    ) : pendingAppointment ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center mb-2">
                                <Clock className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-lg font-medium">Pending Studio Review</h3>
                            <p className="text-sm text-muted-foreground max-w-[280px]">
                                You have an active request for{" "}
                                <span className="font-medium text-foreground">
                                    {pendingAppointment.requestedDate ? format(new Date(pendingAppointment.requestedDate), "MMMM d, yyyy") : "a fitting"}
                                </span>. Our team will contact you shortly to confirm the exact time.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4 w-full border-border hover:border-border hover:bg-muted"
                                onClick={() => onOpenChange(false)}
                            >
                                Close
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Preferred Date
                                </label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal border-input hover:border-primary hover:bg-transparent focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                                                !date && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {date ? format(date, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 border-border" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none">
                                    Additional Notes (Optional)
                                </label>
                                <Textarea
                                    placeholder="Share any specific requirements for your fitting..."
                                    className="resize-none h-24 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                disabled={!date || isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting Request...
                                    </>
                                ) : (
                                    "Confirm Booking Request"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
