"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sparkles, Shirt, Palette, X, ArrowRight } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const OPTIONS = [
    {
        icon: Shirt,
        label: "Choose from Our Styles",
        description:
            "Browse our curated style catalog and pick a design to bring to life — bespoke-fitted to you.",
        href: "/catalog/styles",
        color: "#C2185B",
        bg: "#FFF5F8",
        border: "#C2185B",
    },
    {
        icon: Sparkles,
        label: "Create with Custom Style",
        description:
            "Have your own design in mind? Share your vision — images, descriptions, references — and we'll craft it exactly.",
        href: "/client/orders/new?mode=custom",
        color: "#1565C0",
        bg: "#EFF6FF",
        border: "#1565C0",
    },
];

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    }),
};

export default function NewOrderDialog({ open, onOpenChange }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
                {/* Dark header */}
                <div className="bg-[#1A1A2E] px-6 pt-6 pb-5 relative">
                    <DialogHeader>
                        <DialogTitle className="text-white text-lg font-bold leading-snug">
                            Start a New Order
                        </DialogTitle>
                        <p className="text-sm text-white/50 mt-1 leading-relaxed">
                            How would you like to create your bespoke garment?
                        </p>
                    </DialogHeader>
                    {/* Decorative glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#C2185B]/10 blur-3xl pointer-events-none" />
                </div>

                {/* Options */}
                <div className="p-5 space-y-3 bg-[#FAFAFA]">
                    {OPTIONS.map((opt, i) => {
                        const Icon = opt.icon;
                        return (
                            <motion.div
                                key={opt.label}
                                custom={i}
                                initial="hidden"
                                animate="visible"
                                variants={cardVariants}
                            >
                                <Link
                                    href={opt.href}
                                    onClick={() => onOpenChange(false)}
                                    className="group flex items-start gap-4 p-4 rounded-xl border-2 border-transparent bg-white hover:border-[var(--opt-border)] transition-all duration-200 shadow-sm hover:shadow-md"
                                    style={{ "--opt-border": opt.border + "33" }}
                                >
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
                                        style={{ background: opt.bg }}
                                    >
                                        <Icon size={18} style={{ color: opt.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#0D0D0D] mb-0.5">
                                            {opt.label}
                                        </p>
                                        <p className="text-xs text-[#999] leading-relaxed">
                                            {opt.description}
                                        </p>
                                    </div>
                                    <ArrowRight
                                        size={15}
                                        className="shrink-0 text-[#CCC] group-hover:text-[#555] group-hover:translate-x-0.5 transition-all duration-200 mt-1.5"
                                    />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <div className="px-5 pb-5 pt-0 bg-[#FAFAFA]">
                    <p className="text-[10px] text-center text-[#BDBDBD] leading-relaxed">
                        All bespoke orders start at{" "}
                        <span className="text-[#999] font-semibold">Pending Review</span>{" "}
                        — our studio will contact you with a quote within 24 hours.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
