"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Scissors, Package, ShoppingBag, Star, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { BRANDING, formatCurrency } from "@/config/branding";
import { useScrollReveal } from "@/hooks/useAnimations";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

// ============================================================
// HERO SECTION
// ============================================================
function HeroSection() {
    const { isAuthenticated } = useAuth();
    const pathname = usePathname();
    const bookUrl = isAuthenticated ? "?action=book_appointment" : `/login?redirectURL=${pathname}&action=book_appointment`;

    const phrases = [
        "Designed for you.",
        "Crafted in Lagos.",
        "Made to last.",
    ];
    const [phraseIndex, setPhraseIndex] = useState(0);
    const sectionRef = useRef(null);

    // Parallax - shapes & portrait move at different speeds on scroll
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });
    const shapeY1 = useTransform(scrollYProgress, [0, 1], [0, -60]);
    const shapeY2 = useTransform(scrollYProgress, [0, 1], [0, -30]);
    const portraitY = useTransform(scrollYProgress, [0, 1], [0, -45]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPhraseIndex((prev) => (prev + 1) % phrases.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section ref={sectionRef} className="relative min-h-[100dvh] flex flex-col xl:flex-row xl:bg-[#1A1A2E]">
            {/* Mobile/Tablet: Full-screen background with gradient overlay */}
            <div className="xl:hidden absolute inset-0 w-full h-full overflow-hidden z-0">
                {/* Background Image / Geometric shapes */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#C2185B]/20 via-[#1A1A2E] to-[#F8E8F0]/10" />

                {/* Simulated Fashion Image for Mobile Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <span className="text-white/20 text-sm tracking-widest uppercase">Fashion Image</span>
                </div>

                {/* Aesthetic shapes floating in background */}
                <div className="absolute top-[10%] -left-10 w-64 h-80 rounded-full bg-[#C2185B]/10 blur-3xl" />
                <div className="absolute top-[30%] -right-10 w-48 h-64 rounded-full bg-[#F8E8F0]/5 blur-3xl" />

                {/* Dark gradient overlay to ensure text legibility at the bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/80 to-transparent" />

                {/* Floating badge mobile */}
                <div className="absolute top-[var(--nav-height)] right-4 mt-4 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                    <span className="text-[10px] font-semibold text-white/80">Est. {BRANDING.establishedYear}</span>
                </div>
            </div>

            {/* Left Content (Mobile text / Desktop 60%) */}
            <div className="relative w-full xl:w-[60%] h-[100dvh] xl:h-auto xl:bg-[#1A1A2E] flex items-end xl:items-center z-10">
                <div className="px-6 sm:px-12 md:px-16 lg:px-20 pb-[12vh] xl:pb-0 pt-[var(--nav-height)] xl:pt-0 w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
                            Where Style{" "}
                            <span className="text-[#C2185B]">Meets</span>
                            <br />
                            Craftsmanship
                        </h1>

                        {/* Animated word cycling */}
                        <div className="h-8 mb-8 overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={phraseIndex}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-lg text-[#F8E8F0] font-light"
                                >
                                    {phrases[phraseIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start gap-4">
                            <Link
                                href="/catalog/styles"
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors"
                            >
                                Explore Our Styles
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                href={bookUrl}
                                scroll={false}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-white/30 text-white font-semibold hover:bg-white/10 transition-colors"
                            >
                                <Calendar size={16} />
                                Book a Fitting
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Geometric Composition (40%) — Desktop only */}
            <div className="hidden xl:flex w-[40%] bg-[#1A1A2E] relative overflow-hidden items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="relative w-full h-[540px] mx-6"
                >
                    {/* Large geometric shapes — parallax layer 1 (moves faster) */}
                    <motion.div style={{ y: shapeY1 }} className="absolute inset-0">
                        <div className="absolute -top-4 -left-4 w-64 h-80 rounded-3xl bg-[#C2185B]/20 rotate-2" />
                        <div className="absolute bottom-0 right-[-10px] w-56 h-72 rounded-3xl bg-[#F8E8F0]/10 -rotate-3" />
                    </motion.div>

                    {/* Medium geometric shapes — parallax layer 2 (moves slower) */}
                    <motion.div style={{ y: shapeY2 }} className="absolute inset-0">
                        <div className="absolute top-12 right-20 w-40 h-52 rounded-2xl bg-[#C2185B]/15 rotate-6" />
                        <div className="absolute bottom-16 left-8 w-36 h-44 rounded-2xl bg-[#F8E8F0]/8 -rotate-4" />
                        <div className="absolute top-1/2 left-1/3 w-24 h-28 rounded-xl bg-[#C2185B]/10 -rotate-2" />
                    </motion.div>

                    {/* Image frame 1 — taller portrait, top-left, slight backward tilt */}
                    <motion.div
                        style={{ y: portraitY }}
                        className="absolute top-[4%] left-[6%] w-[240px] h-[340px] rounded-xl overflow-hidden shadow-2xl border border-white/10 z-[2]"
                    >
                        <div className="w-full h-full bg-gradient-to-br from-[#C2185B]/30 via-[#1A1A2E] to-[#F8E8F0]/20" style={{ transform: 'rotate(-2deg) scale(1.05)' }}>
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-white/20 text-xs">Fashion Image</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Image frame 2 — wider/shorter, bottom-right, opposite tilt, clearly separated */}
                    <motion.div
                        style={{ y: shapeY2 }}
                        className="absolute bottom-[6%] right-[4%] w-[220px] h-[260px] rounded-xl overflow-hidden shadow-2xl border border-white/15 z-[3]"
                    >
                        <div className="w-full h-full bg-gradient-to-tl from-[#F8E8F0]/15 via-[#1A1A2E] to-[#C2185B]/25" style={{ transform: 'rotate(3deg) scale(1.05)' }}>
                            <div className="w-full h-full flex items-center justify-center">
                                <span className="text-white/20 text-xs">Fashion Image</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating badge — below the right image */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="absolute bottom-0 right-[4%] px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 z-10"
                    >
                        <span className="text-xs font-semibold text-white/80">
                            Est. {BRANDING.establishedYear}
                        </span>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}

// ============================================================
// HOW IT WORKS SECTION
// ============================================================
function ProcessSection() {
    const { ref, isVisible } = useScrollReveal();

    const models = [
        {
            icon: Scissors,
            title: "You Bring the Fabric",
            description:
                "Have a special fabric? Bring it to us and choose from our curated styles or describe your dream outfit. We'll bring your vision to life.",
            link: "/catalog/styles",
        },
        {
            icon: Package,
            title: "We Source It for You",
            description:
                "Don't have fabric? No problem. Tell us what you want, and we'll source the perfect fabric and create your garment from start to finish.",
            link: "/catalog/styles",
        },
        {
            icon: ShoppingBag,
            title: "Ready to Wear Now",
            description:
                "Browse our collection of beautifully crafted, ready-made garments. Find your size, purchase, and step out in style — no wait required.",
            link: "/catalog/ready-to-wear",
        },
    ];

    return (
        <section ref={ref} className="section-gap bg-white">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 lg:mb-16"
                >
                    <h2 className="text-3xl lg:text-4xl font-bold text-[#0D0D0D] mb-4">
                        Three Ways to Work with Us
                    </h2>
                    <p className="text-[#555] max-w-lg mx-auto">
                        Whether you bring your own fabric, need us to source it, or want something ready to wear — we&apos;ve got you covered.
                    </p>
                </motion.div>

                {/* Desktop: 3-col grid */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
                    {models.map((model, i) => (
                        <motion.div
                            key={model.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isVisible ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            className="group flex flex-col p-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white card-hover h-full"
                        >
                            <div className="w-14 h-14 rounded-xl bg-[#F8E8F0] flex items-center justify-center mb-6 group-hover:bg-[#C2185B]/10 transition-colors">
                                <model.icon size={24} className="text-[#C2185B]" />
                            </div>
                            <h3 className="text-xl font-bold text-[#0D0D0D] mb-3">{model.title}</h3>
                            <p className="text-sm text-[#555] leading-relaxed mb-6 flex-1">
                                {model.description}
                            </p>
                            <Link
                                href={model.link}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#C2185B] hover:gap-2 transition-all mt-auto"
                            >
                                Learn more <ArrowRight size={14} />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile: horizontal scroll carousel */}
                <div className="lg:hidden flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory -mx-6 px-6">
                    {models.map((model, i) => (
                        <motion.div
                            key={model.title}
                            initial={{ opacity: 0, x: 30 }}
                            animate={isVisible ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.12 }}
                            className="group shrink-0 w-[280px] snap-center p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white"
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#F8E8F0] flex items-center justify-center mb-5 group-hover:bg-[#C2185B]/10 transition-colors">
                                <model.icon size={20} className="text-[#C2185B]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0D0D0D] mb-2">{model.title}</h3>
                            <p className="text-sm text-[#555] leading-relaxed mb-5">
                                {model.description}
                            </p>
                            <Link
                                href={model.link}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#C2185B] hover:gap-2 transition-all"
                            >
                                Learn more <ArrowRight size={14} />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile: Swipe hint */}
                <div className="lg:hidden mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-[#999]">
                    <span>Swipe for more</span>
                    <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="text-[#C2185B]"
                    >
                        <ArrowRight size={12} />
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============================================================
// FEATURED STYLES SECTION
// ============================================================
function FeaturedStylesSection() {
    const { ref, isVisible } = useScrollReveal();

    const { data: styles } = useQuery({
        queryKey: ["styles", "featured"],
        queryFn: async () => {
            const { data } = await api.get("/styles", {
                params: { isFeatured: true, limit: 4 },
            });
            return data.data?.styles || data.data?.items || [];
        },
    });

    const placeholderStyles = [
        { id: 1, name: "Ankara Elegance", category: "Ankara" },
        { id: 2, name: "Corporate Chic", category: "Corporate" },
        { id: 3, name: "Evening Gown", category: "Gowns" },
        { id: 4, name: "Casual Friday", category: "Casual" },
    ];

    const displayStyles = styles?.length > 0 ? styles : placeholderStyles;

    /*
     * Styles grid (reference homepage.html):
     * grid-template-columns: 2fr 1fr 1fr
     * grid-template-rows: 340px 240px
     * Row 1: [T1 col1 row1-2 (tall)] [T2 col2]  [T3 col3]
     * Row 2: [   T1 continues      ] [T4 col2-3 (wide)   ]
     */
    const styleSlots = [
        { gridColumn: "1", gridRow: "1 / 3" },       // T1 — tall left
        { gridColumn: "2", gridRow: "1" },            // T2 — top center
        { gridColumn: "3", gridRow: "1" },            // T3 — top right
        { gridColumn: "2 / 4", gridRow: "2" },        // T4 — wide bottom right
    ];

    return (
        <section ref={ref} className="section-gap bg-[#FAFAFA]">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-end justify-between mb-12"
                >
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-[#0D0D0D] mb-3">
                            Styles We Create
                        </h2>
                        <p className="text-[#555]">Explore our curated collection of fashion styles.</p>
                    </div>
                    <Link
                        href="/catalog/styles"
                        className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#C2185B] hover:gap-2 transition-all"
                    >
                        View all styles <ArrowRight size={14} />
                    </Link>
                </motion.div>

                {/* Editorial masonry grid — desktop */}
                <div
                    className="hidden lg:grid"
                    style={{
                        gridTemplateColumns: '2fr 1fr 1fr',
                        gridTemplateRows: '340px 240px',
                        gap: '4px',
                    }}
                >
                    {displayStyles.slice(0, 4).map((style, i) => (
                        <motion.div
                            key={style.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className="group relative rounded-xl overflow-hidden"
                            style={styleSlots[i] ? { gridColumn: styleSlots[i].gridColumn, gridRow: styleSlots[i].gridRow } : {}}
                        >
                            {/* Image or gradient placeholder */}
                            <div className="absolute inset-0 bg-gradient-to-br from-[#C2185B]/20 via-[#1A1A2E]/40 to-[#F8E8F0]/20">
                                {style.images?.[0] ? (
                                    <Image
                                        src={style.images[0]}
                                        alt={style.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : null}
                            </div>

                            {/* Dark hover overlay + info (Capability based hover) */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/80 via-[#1A1A2E]/20 to-transparent [@media(hover:hover)]:bg-none [@media(hover:hover)]:bg-[#1A1A2E]/0 [@media(hover:hover)]:group-hover:bg-[#1A1A2E]/70 transition-all duration-300 flex items-end p-6">
                                <div className="opacity-100 translate-y-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:translate-y-4 [@media(hover:hover)]:group-hover:translate-y-0 transition-all duration-300">
                                    <p className="text-xs text-[#F8E8F0] font-medium mb-1">{style.category}</p>
                                    <p className="text-base font-bold text-white">{style.name}</p>
                                </div>
                            </div>

                            {/* Clickable arrow → style detail page */}
                            <Link
                                href={`/catalog/styles/${style.id}`}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm shadow-md [@media(hover:hover)]:bg-white/0 [@media(hover:hover)]:backdrop-blur-none [@media(hover:hover)]:shadow-none [@media(hover:hover)]:group-hover:bg-white/20 flex items-center justify-center opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 transition-all duration-300 hover:bg-white/40 z-10"
                                aria-label={`View ${style.name}`}
                            >
                                <ArrowUpRight size={16} className="text-white" />
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Tablet & Mobile grid */}
                <div className="grid gap-1 lg:hidden" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {displayStyles.slice(0, 4).map((style, i) => {
                        // Tablet (sm+): T1 full-width 260px, T2/T3 220px, T4 full-width 220px
                        // Mobile (<sm): single column, T1 240px, rest 200px
                        const spanFull = i === 0 || i === 3;
                        return (
                            <motion.div
                                key={style.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className={`group relative rounded-xl overflow-hidden ${spanFull
                                    ? `col-span-2 ${i === 0 ? 'h-[240px] sm:h-[260px]' : 'h-[200px] sm:h-[220px]'}`
                                    : 'col-span-2 sm:col-span-1 h-[200px] sm:h-[220px]'
                                    }`}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-[#C2185B]/20 via-[#1A1A2E]/40 to-[#F8E8F0]/20">
                                    {style.images?.[0] ? (
                                        <Image src={style.images[0]} alt={style.name} fill className="object-cover" />
                                    ) : null}
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E]/80 via-[#1A1A2E]/20 to-transparent flex items-end p-4">
                                    <div className="opacity-100 flex-1">
                                        <p className="text-[10px] text-[#F8E8F0] font-medium">{style.category}</p>
                                        <p className="text-sm font-bold text-white">{style.name}</p>
                                    </div>
                                </div>
                                <Link
                                    href={`/catalog/styles/${style.id}`}
                                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/20 backdrop-blur-sm shadow-md flex items-center justify-center opacity-100 z-10"
                                    aria-label={`View ${style.name}`}
                                >
                                    <ArrowUpRight size={14} className="text-white" />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>

                <Link
                    href="/catalog/styles"
                    className="sm:hidden flex items-center justify-center gap-1 mt-8 text-sm font-semibold text-[#C2185B]"
                >
                    View all styles <ArrowRight size={14} />
                </Link>
            </div>
        </section>
    );
}

// ============================================================
// READY-TO-WEAR PREVIEW SECTION
// ============================================================
function ReadyToWearSection() {
    const { ref, isVisible } = useScrollReveal();
    const scrollContainerRef = useRef(null);

    const { data: items } = useQuery({
        queryKey: ["rtw", "homepage-featured"],
        queryFn: async () => {
            const { data } = await api.get("/ready-to-wear", {
                params: { featured: "true", inStock: "true" },
            });
            const allItems = data.data?.items || data.data?.readyToWear || [];
            return allItems.slice(0, 10);
        },
    });

    const displayItems = items?.length > 0 ? items : [];

    const scroll = (dir) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
        }
    };

    return (
        <section ref={ref} className="section-gap bg-[#1A1A2E]">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-end justify-between mb-10"
                >
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                            Ready to Wear
                        </h2>
                        <p className="text-white/60">Handcrafted pieces, ready for you.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => scroll(-1)} className="hidden sm:flex w-9 h-9 rounded-full border-white/20 items-center justify-center text-white/60 hover:text-white hover:bg-transparent hover:border-white/40 transition-colors">
                            <ChevronLeft size={16} />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => scroll(1)} className="hidden sm:flex w-9 h-9 rounded-full border-white/20 items-center justify-center text-white/60 hover:text-white hover:bg-transparent hover:border-white/40 transition-colors">
                            <ChevronRight size={16} />
                        </Button>
                        <Link
                            href="/catalog/ready-to-wear"
                            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#C2185B] hover:gap-2 transition-all ml-2"
                        >
                            Shop all <ArrowRight size={14} />
                        </Link>
                    </div>
                </motion.div>

                {displayItems.length === 0 ? (
                    <p className="text-white/40 text-sm text-center py-12">No items available right now.</p>
                ) : (
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-4 lg:gap-6 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
                    >
                        {displayItems.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: 40 }}
                                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className="shrink-0 w-[240px] lg:w-[260px] snap-center"
                            >
                                <Link href={`/catalog/ready-to-wear/${item.id}`} className="group block">
                                    <div className="relative h-[300px] lg:h-[320px] rounded-xl overflow-hidden bg-[#2A2A40] mb-3">
                                        {item.images?.[0] ? (
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#C2185B]/20 to-[#2A2A40]" />
                                        )}
                                        {/* "View" button on hover */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            <span className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-white border border-white/20">
                                                View
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium text-white mb-1 truncate">{item.name}</p>
                                    <p className="text-lg font-bold font-mono-data text-[#F8E8F0]">
                                        {formatCurrency(item.price)}
                                    </p>
                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                        {(item.availableSizes || []).map((size) => (
                                            <span
                                                key={size}
                                                className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                                            >
                                                {size}
                                            </span>
                                        ))}
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Mobile: Bottom Actions (Swipe Hint & Shop All) */}
                <div className="md:hidden mt-6 flex items-center justify-between px-2">
                    {displayItems.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-white/50">
                            <span>Swipe for more</span>
                            <motion.div
                                animate={{ x: [0, 4, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                className="text-[#C2185B]"
                            >
                                <ArrowRight size={12} />
                            </motion.div>
                        </div>
                    ) : (
                        <div />
                    )}

                    <Link
                        href="/catalog/ready-to-wear"
                        className="flex items-center gap-1 text-sm font-semibold text-[#C2185B]"
                    >
                        Shop all <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ============================================================
// PORTFOLIO PREVIEW SECTION
// ============================================================
function PortfolioSection() {
    const { ref, isVisible } = useScrollReveal();

    const { data: entries } = useQuery({
        queryKey: ["portfolio", "homepage-featured"],
        queryFn: async () => {
            const { data } = await api.get("/portfolio", {
                params: { featured: "true" },
            });
            return data.data?.entries || [];
        },
    });

    const displayEntries = entries?.length > 0 ? entries : [];

    /*
     * Editorial layout:
     * - Item 0: large featured (col-span-2, row-span-2)
     * - Items 1-4: smaller supporting pieces
     */

    return (
        <section ref={ref} className="section-gap bg-white">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="flex items-end justify-between mb-12"
                >
                    <div>
                        <h2 className="text-3xl lg:text-4xl font-bold text-[#0D0D0D] mb-3">
                            From Our Studio to Your Wardrobe
                        </h2>
                        <p className="text-[#555] max-w-lg">
                            A glimpse into the craftsmanship behind every piece we create.
                        </p>
                    </div>
                    <Link
                        href="/portfolio"
                        className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#C2185B] hover:gap-2 transition-all"
                    >
                        See the full portfolio <ArrowRight size={14} />
                    </Link>
                </motion.div>

                {displayEntries.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-[#999] text-sm">Portfolio pieces coming soon.</p>
                    </div>
                ) : (
                    <>
                        {/* ===== Desktop: 3 sub-block structure (lg+) ===== */}
                        {(() => {
                            const items = displayEntries.slice(0, 7);
                            // Helper to render a portfolio image item
                            const renderItem = (entry, i, isLarge = false) => (
                                <motion.div
                                    key={entry.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.5, delay: i * 0.1 }}
                                    className="group relative rounded-xl overflow-hidden cursor-pointer h-full"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E]/30 to-[#C2185B]/20">
                                        {entry.images?.[0] && (
                                            <Image src={entry.images[0]} alt={entry.title || "Portfolio"} fill className="object-cover" />
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent [@media(hover:hover)]:bg-none [@media(hover:hover)]:bg-black/0 [@media(hover:hover)]:group-hover:bg-black/60 transition-all duration-300 flex flex-col items-start justify-end p-6">
                                        <div className="opacity-100 translate-y-0 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:translate-y-3 [@media(hover:hover)]:group-hover:translate-y-0 transition-all duration-300">
                                            {entry.category && (
                                                <span className="text-[10px] uppercase tracking-wider text-[#F8E8F0] font-semibold mb-1 block">{entry.category}</span>
                                            )}
                                            {entry.title && (
                                                <p className="text-white font-bold text-sm mb-1">{entry.title}</p>
                                            )}
                                            {entry.description && isLarge && (
                                                <p className="text-white/70 text-xs line-clamp-2">{entry.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );

                            return (
                                <div className="hidden lg:flex flex-col" style={{ gap: '4px' }}>
                                    {/* Block A: 2fr 1fr, 440px */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', height: '440px', gap: '4px' }}>
                                        {items[0] && renderItem(items[0], 0, true)}
                                        {/* Sidebar: 2 stacked items */}
                                        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: '4px' }}>
                                            {items[1] && renderItem(items[1], 1)}
                                            {items[2] && renderItem(items[2], 2)}
                                        </div>
                                    </div>

                                    {/* Block B: 1fr 1fr 1fr, 260px */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', height: '260px', gap: '4px' }}>
                                        {items[3] && renderItem(items[3], 3)}
                                        {items[4] && renderItem(items[4], 4)}
                                        {items[5] && renderItem(items[5], 5)}
                                    </div>

                                    {/* Block C: 1fr 2fr, 360px */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', height: '360px', gap: '4px' }}>
                                        {/* Text/CTA panel */}
                                        <div className="flex flex-col justify-between rounded-xl p-8" style={{ background: '#1A1A2E' }}>
                                            <div>
                                                <span className="text-[10px] uppercase tracking-[0.3em] text-[#C2185B] mb-3 block">Studio ethos</span>
                                                <h3 className="text-xl font-bold text-white leading-snug">
                                                    Every piece is<br /><em className="font-normal text-[#F8E8F0] italic">a collaboration</em>
                                                </h3>
                                            </div>
                                            <p className="text-xs text-white/55 leading-relaxed">
                                                We don&apos;t just make clothes — we make garments that carry meaning, memory, and precision.
                                            </p>
                                        </div>
                                        {items[6] && renderItem(items[6], 6)}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ===== Tablet & Mobile grid (below lg) ===== */}
                        <div className="lg:hidden flex flex-col" style={{ gap: '4px' }}>
                            {(() => {
                                const items = displayEntries.slice(0, 7);
                                const renderMobileItem = (entry, i, className = '') => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={isVisible ? { opacity: 1, y: 0 } : {}}
                                        transition={{ duration: 0.5, delay: i * 0.08 }}
                                        className={`group relative rounded-xl overflow-hidden cursor-pointer ${className}`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E]/30 to-[#C2185B]/20">
                                            {entry.images?.[0] && (
                                                <Image src={entry.images[0]} alt={entry.title || "Portfolio"} fill className="object-cover" />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3 sm:p-4">
                                            <div className="opacity-100">
                                                {entry.category && (
                                                    <span className="text-[9px] uppercase tracking-wider text-[#F8E8F0] font-semibold mb-0.5 block">{entry.category}</span>
                                                )}
                                                <p className="text-white font-semibold text-xs sm:text-sm">{entry.title}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );

                                return (
                                    <>
                                        {/* Block A: tablet 1fr 1fr, mobile single col */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '4px' }}>
                                            {items[0] && renderMobileItem(items[0], 0, 'h-[280px] sm:h-[320px]')}
                                            <div className="grid grid-cols-2 sm:grid-cols-1" style={{ gap: '4px' }}>
                                                {items[1] && renderMobileItem(items[1], 1, 'h-[140px] sm:h-[158px]')}
                                                {items[2] && renderMobileItem(items[2], 2, 'h-[140px] sm:h-[158px]')}
                                            </div>
                                        </div>

                                        {/* Block B: tablet 3-col, mobile 2-col */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: '4px' }}>
                                            {items[3] && renderMobileItem(items[3], 3, 'h-[180px] sm:h-[220px]')}
                                            {items[4] && renderMobileItem(items[4], 4, 'h-[180px] sm:h-[220px]')}
                                            {items[5] && renderMobileItem(items[5], 5, 'h-[180px] sm:h-[220px] col-span-2 sm:col-span-1')}
                                        </div>

                                        {/* Block C: tablet side-by-side, mobile stacked */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: '4px' }}>
                                            <div className="flex flex-col justify-between rounded-xl p-6 sm:p-8 h-auto sm:h-[280px]" style={{ background: '#1A1A2E' }}>
                                                <div>
                                                    <span className="text-[10px] uppercase tracking-[0.3em] text-[#C2185B] mb-2 block">Studio ethos</span>
                                                    <h3 className="text-lg sm:text-xl font-bold text-white leading-snug mb-3 sm:mb-0">
                                                        Every piece is<br /><em className="font-normal text-[#F8E8F0] italic">a collaboration</em>
                                                    </h3>
                                                </div>
                                                <p className="text-xs text-white/55 leading-relaxed">
                                                    We don&apos;t just make clothes — we make garments that carry meaning, memory, and precision.
                                                </p>
                                            </div>
                                            {items[6] && renderMobileItem(items[6], 6, 'h-[240px] sm:h-[280px]')}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </>
                )}

                <div className="text-center mt-8 sm:hidden">
                    <Link
                        href="/portfolio"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#C2185B] hover:gap-2 transition-all"
                    >
                        See the full portfolio <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ============================================================
// TESTIMONIALS SECTION
// ============================================================
function TestimonialsSection() {
    const { ref, isVisible } = useScrollReveal();

    const { data: testimonials } = useQuery({
        queryKey: ["testimonials", "homepage"],
        queryFn: async () => {
            const { data } = await api.get("/testimonials", {
                params: { limit: 3 },
            });
            return data.data?.testimonials || data.data?.items || [];
        },
    });

    const placeholderTestimonials = [
        {
            id: 1,
            clientName: "Amara",
            rating: 5,
            review:
                "The attention to detail is incredible. My ankara gown fit perfectly and I received so many compliments. Will definitely be ordering again!",
        },
        {
            id: 2,
            clientName: "Chioma",
            rating: 5,
            review:
                "From fabric selection to the final fitting, the whole experience was seamless. The team really knows their craft.",
        },
        {
            id: 3,
            clientName: "Funke",
            rating: 4,
            review:
                "I love the ready-to-wear collection! The quality is amazing and the styling is so on-trend. My go-to fashion studio in Lagos.",
        },
    ];

    const displayTestimonials =
        testimonials?.length > 0 ? testimonials : placeholderTestimonials;

    return (
        <section ref={ref} className="section-gap bg-[#F4F0F8]">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-3xl lg:text-4xl font-bold text-[#0D0D0D] mb-3">
                        What Our Clients Say
                    </h2>
                    <p className="text-[#555]">Real feedback from real clients.</p>
                </motion.div>

                {/* Desktop: 3 visible simultaneously */}
                <div className="hidden md:grid md:grid-cols-3 gap-6">
                    {displayTestimonials.map((testimonial, i) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 20, rotate: 0.5 }}
                            animate={isVisible ? { opacity: 1, y: 0, rotate: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.12 }}
                            className="relative p-6 lg:p-8 rounded-xl bg-white border border-[rgba(0,0,0,0.06)]"
                        >
                            {/* Large decorative quotation mark — behind card content */}
                            <span className="absolute top-2 left-4 text-[80px] lg:text-[100px] font-serif leading-none text-[#C2185B]/10 pointer-events-none select-none" aria-hidden="true">
                                &ldquo;
                            </span>

                            <div className="relative z-[1]">
                                {/* Stars */}
                                <div className="flex gap-0.5 mb-4">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <Star
                                            key={j}
                                            size={16}
                                            className={j < testimonial.rating ? "text-[#F9A825] fill-[#F9A825]" : "text-[#E0E0E0]"}
                                        />
                                    ))}
                                </div>

                                <p className="text-sm text-[#555] leading-relaxed mb-6">
                                    {testimonial.review}
                                </p>

                                <p className="text-sm font-semibold text-[#0D0D0D]">
                                    {testimonial.clientName}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Mobile: stacked */}
                <div className="md:hidden space-y-4">
                    {displayTestimonials.map((testimonial, i) => (
                        <motion.div
                            key={testimonial.id}
                            initial={{ opacity: 0, y: 16, rotate: 0.3 }}
                            animate={isVisible ? { opacity: 1, y: 0, rotate: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="relative p-6 rounded-xl bg-white border border-[rgba(0,0,0,0.06)]"
                        >
                            <span className="absolute top-1 left-3 text-[60px] font-serif leading-none text-[#C2185B]/10 pointer-events-none select-none" aria-hidden="true">
                                &ldquo;
                            </span>
                            <div className="relative z-[1]">
                                <div className="flex gap-0.5 mb-3">
                                    {Array.from({ length: 5 }).map((_, j) => (
                                        <Star
                                            key={j}
                                            size={14}
                                            className={j < testimonial.rating ? "text-[#F9A825] fill-[#F9A825]" : "text-[#E0E0E0]"}
                                        />
                                    ))}
                                </div>
                                <p className="text-sm text-[#555] leading-relaxed mb-4">{testimonial.review}</p>
                                <p className="text-sm font-semibold text-[#0D0D0D]">{testimonial.clientName}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Link to testimonials page */}
                <div className="text-center mt-10">
                    <Link
                        href="/testimonials"
                        className="inline-flex items-center gap-1 text-sm font-semibold text-[#C2185B] hover:gap-2 transition-all"
                    >
                        Read all reviews <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// ============================================================
// CTA SECTION — Measurement Appointment
// ============================================================
function CTASection() {
    const { ref, isVisible } = useScrollReveal();
    const { isAuthenticated } = useAuth();
    const pathname = usePathname();
    const bookUrl = isAuthenticated ? "?action=book_appointment" : `/login?redirectURL=${pathname}&action=book_appointment`;

    return (
        <section
            ref={ref}
            className="relative py-20 lg:py-24 bg-[#C2185B] overflow-hidden"
        >
            {/* Diagonal pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.15]"
                style={{
                    backgroundImage: `repeating-linear-gradient(
                        -45deg,
                        transparent,
                        transparent 10px,
                        rgba(255,255,255,0.3) 10px,
                        rgba(255,255,255,0.3) 11px
                    )`,
                }}
            />
            {/* Grain overlay */}
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjEiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMyIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==')]" />

            <div className="page-container relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto"
                >
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        Your Measurements, Your Fit — Every Time
                    </h2>
                    <p className="text-white/80 mb-8 leading-relaxed">
                        Book a fitting appointment and let our expert team take your precise measurements.
                        Every garment we create is tailored specifically for your body.
                    </p>
                    <Link
                        href={bookUrl}
                        scroll={false}
                        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-white text-[#C2185B] font-semibold hover:bg-[#F8E8F0] transition-colors"
                    >
                        <Calendar size={16} />
                        Book a Fitting
                    </Link>
                </motion.div>
            </div>
        </section>
    );
}

// ============================================================
// HOMEPAGE
// ============================================================
export default function HomePage() {
    return (
        <>
            <HeroSection />
            <ProcessSection />
            <FeaturedStylesSection />
            <ReadyToWearSection />
            <PortfolioSection />
            <TestimonialsSection />
            <CTASection />
        </>
    );
}
