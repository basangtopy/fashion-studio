"use client";

import { AlertTriangle } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * ConfirmDialog — Reusable confirmation modal for destructive actions.
 *
 * Props:
 *  - open: boolean
 *  - onOpenChange: (open) => void
 *  - onConfirm: () => void
 *  - title: string (e.g., "Archive this style?")
 *  - description: string (e.g., "This will hide it from the public catalog.")
 *  - confirmText: string (e.g., "Archive", "Delete", "Reject")
 *  - variant: "danger" | "warning" (default: "danger")
 *  - loading: boolean
 */
export default function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Are you sure?",
    description = "This action cannot be undone.",
    confirmText = "Confirm",
    variant = "danger",
    loading = false,
}) {
    const isDanger = variant === "danger";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[420px] p-6" showCloseButton={false}>
                <DialogHeader className="items-center text-center sm:text-center">
                    <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${isDanger ? "bg-[#FFEBEE]" : "bg-[#FFF3E0]"}`}>
                        <AlertTriangle size={22} className={isDanger ? "text-destructive" : "text-status-warning"} />
                    </div>
                    <DialogTitle className="text-base font-semibold text-foreground">{title}</DialogTitle>
                    <DialogDescription className="text-sm text-[#777] leading-relaxed">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-row gap-2 pt-2 sm:justify-center">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="flex-1 h-10 border-input text-muted-foreground hover:bg-muted"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 h-10 text-primary-foreground ${isDanger ? "bg-destructive hover:bg-destructive/90" : "bg-status-warning hover:bg-status-warning/90"}`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Processing…
                            </span>
                        ) : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
