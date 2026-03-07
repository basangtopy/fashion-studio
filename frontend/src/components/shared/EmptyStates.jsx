"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArchiveX, SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CatalogItemNotFound({ type = "style" }) {
    const isRtw = type === "ready-to-wear";
    const categoryName = isRtw ? "ready-to-wear piece" : "style";
    const backLink = isRtw ? "/catalog/ready-to-wear" : "/catalog/styles";
    const backLabel = isRtw ? "Back to Ready-to-Wear" : "Back to Styles";

    return (
        <div className="pt-[var(--nav-height)]">
            <div className="page-container py-16 lg:py-24 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="w-full max-w-md bg-[#F4F0F8] rounded-2xl p-8 md:p-12 text-center"
                >
                    <div className="w-16 h-16 rounded-2xl bg-[#F8E8F0] text-[#C2185B] flex items-center justify-center mx-auto mb-6 shadow-sm">
                        {isRtw ? <SearchX size={32} strokeWidth={1.5} /> : <ArchiveX size={32} strokeWidth={1.5} />}
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold font-display text-[#0D0D0D] mb-3 tracking-tight">
                        {isRtw ? "Item Unavailable" : "Style Not Found"}
                    </h1>

                    <p className="text-[#555] text-sm md:text-base leading-relaxed mb-8">
                        The {categoryName} you are looking for might have been archived, sold out, or the link may be incorrect. Let&apos;s get you back to the collection.
                    </p>

                    <Button asChild className="w-full h-12 rounded-lg bg-[#C2185B] hover:bg-[#A01548] text-white font-semibold transition-colors">
                        <Link href={backLink} className="flex items-center justify-center gap-2">
                            <ArrowLeft size={18} />
                            {backLabel}
                        </Link>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
