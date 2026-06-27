"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Scissors, Package, ShoppingBag, Calendar, ChevronDown } from "lucide-react";
import { BRANDING } from "@/config/branding";
import { useScrollReveal, useCountUp } from "@/hooks/useAnimations";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

// ============================================================
// HERO SECTION — Cinematic Immersive
// ============================================================
function AboutHero() {
    const sectionRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end start"],
    });
    const shapeY1 = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const shapeY2 = useTransform(scrollYProgress, [0, 1], [0, -40]);
    const textY = useTransform(scrollYProgress, [0, 1], [0, 30]);
    const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

    return (
        <section ref={sectionRef} className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-secondary">
            {/* Floating geometric shapes */}
            <motion.div style={{ y: shapeY1 }} className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[8%] left-[5%] w-72 h-96 rounded-3xl bg-primary/8 rotate-6" />
                <div className="absolute bottom-[12%] right-[8%] w-64 h-80 rounded-3xl bg-[#F8E8F0]/5 -rotate-6" />
            </motion.div>
            <motion.div style={{ y: shapeY2 }} className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[20%] right-[15%] w-48 h-56 rounded-2xl bg-primary/6 -rotate-3" />
                <div className="absolute bottom-[20%] left-[12%] w-40 h-48 rounded-2xl bg-[#F8E8F0]/4 rotate-4" />
                <div className="absolute top-[50%] left-[45%] w-20 h-24 rounded-xl bg-primary/10 rotate-12" />
            </motion.div>

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-secondary/60 via-transparent to-brand-secondary/80 pointer-events-none" />

            {/* Content */}
            <motion.div
                style={{ y: textY, opacity }}
                className="relative z-10 text-center px-6 max-w-4xl mx-auto"
            >
                <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="inline-block text-[10px] sm:text-xs uppercase tracking-[0.4em] text-primary font-semibold mb-6"
                >
                    Our Story
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-8"
                >
                    A Studio Born{" "}
                    <span className="block mt-1">
                        from a <em className="font-light italic text-[#F8E8F0]">Belief</em>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.7 }}
                    className="text-lg sm:text-xl text-white/60 font-light leading-relaxed max-w-2xl mx-auto"
                >
                    {BRANDING.aboutHeroQuote}
                </motion.p>

                {/* Scroll indicator */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="absolute top-100 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                >
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium">Scroll to explore</span>
                    <motion.div
                        animate={{ y: [0, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <ChevronDown size={16} className="text-white/30" />
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
}

// ============================================================
// ORIGIN STORY SECTION
// ============================================================
function OriginSection() {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });

    return (
        <section ref={ref} className="section-gap bg-white overflow-hidden">
            <div className="page-container">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Left — Narrative */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-semibold mb-4 block">
                            Where It All Began
                        </span>

                        <div className="flex items-baseline gap-4 mb-8">
                            <span className="text-7xl sm:text-8xl lg:text-9xl font-extralight text-primary/15 leading-none font-display">
                                {BRANDING.establishedYear}
                            </span>
                            <span className="text-sm text-text-light uppercase tracking-widest">Est.</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-6 leading-tight">
                            Crafted in Nigeria.{" "}
                            <span className="text-primary">Made for You.</span>
                        </h2>

                        <div className="space-y-4 text-muted-foreground leading-relaxed">
                            <p>
                                {BRANDING.businessName} was born from a simple conviction: that everyone deserves
                                clothes that fit perfectly, reflect their personality, and are made with genuine care.
                            </p>
                            <p>
                                In a world of mass production and disposable fashion, we chose a different path.
                                Every garment that leaves our studio carries the mark of hands that measured,
                                cut, stitched, and inspected with intention. We don&apos;t do shortcuts. We do craft.
                            </p>
                            <p>
                                From our studio in {BRANDING.address}, we serve clients who value precision over
                                speed, individuality over trends, and quality over quantity.
                            </p>
                        </div>
                    </motion.div>

                    {/* Right — Geometric composition */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isVisible ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="relative h-[400px] lg:h-[500px]"
                    >
                        {/* Abstract layered shapes */}
                        <div className="absolute top-0 right-0 w-[80%] h-[75%] rounded-2xl bg-secondary z-[1]">
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Our Mission</span>
                                <p className="text-white/80 text-sm sm:text-base text-center leading-relaxed italic font-light">
                                    &ldquo;{BRANDING.mission}&rdquo;
                                </p>
                            </div>
                        </div>
                        <div className="absolute bottom-0 left-0 w-[65%] h-[55%] rounded-2xl bg-gradient-to-br from-primary/10 to-[#F8E8F0] z-[2] border border-border">
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-primary mb-3">Our Vision</span>
                                <p className="text-foreground text-xs sm:text-sm text-center leading-relaxed italic font-light">
                                    &ldquo;{BRANDING.vision}&rdquo;
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}

// ============================================================
// VALUES SECTION — Editorial alternating panels
// ============================================================
function ValuesSection() {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

    return (
        <section ref={ref} className="section-gap bg-surface-2 overflow-hidden">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 lg:mb-24"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-semibold mb-4 block">
                        What We Believe
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                        The Principles Behind Every Stitch
                    </h2>
                </motion.div>

                <div className="space-y-16 lg:space-y-32">
                    {BRANDING.values.map((value, i) => (
                        <ValuePanel key={value.title} value={value} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ValuePanel({ value, index }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });
    const isReversed = index % 2 !== 0;

    return (
        <div
            ref={ref}
            className={`flex flex-col ${isReversed ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-10 lg:gap-16`}
        >
            {/* Number / Visual side */}
            <motion.div
                initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 relative flex items-center justify-center min-h-[240px] lg:min-h-[320px]"
            >
                {/* Giant watermark number */}
                <span className="text-[120px] sm:text-[160px] lg:text-[200px] font-extralight text-primary/[0.06] leading-none select-none font-display">
                    {String(index + 1).padStart(2, "0")}
                </span>
                {/* Decorative accent line */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={isVisible ? { scaleX: 1 } : {}}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className={`absolute bottom-8 ${isReversed ? "right-0 origin-right" : "left-0 origin-left"} w-24 h-[2px] bg-primary/30`}
                />
            </motion.div>

            {/* Text side */}
            <motion.div
                initial={{ opacity: 0, x: isReversed ? -40 : 40 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1"
            >
                <h3 className="text-xs uppercase tracking-[0.35em] text-primary font-semibold mb-4">
                    {value.title}
                </h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground leading-snug mb-6">
                    {value.title === "Precision" && "Luxury lives in the details."}
                    {value.title === "Identity" && "Your style is yours alone."}
                    {value.title === "Collaboration" && "Great garments are conversations."}
                </p>
                <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                    {value.description}
                </p>
            </motion.div>
        </div>
    );
}

// ============================================================
// BUSINESS MODELS SECTION — Comprehensive detail
// ============================================================
const MODEL_ICONS = [Scissors, Package, ShoppingBag];

function BusinessModelsSection() {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });
    const [activeModel, setActiveModel] = useState(0);

    return (
        <section ref={ref} className="section-gap bg-secondary overflow-hidden">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 lg:mb-16"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-semibold mb-4 block">
                        How We Work
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                        Three Ways to Create with Us
                    </h2>
                    <p className="text-white/50 max-w-lg mx-auto">
                        Whether you bring your own fabric, need us to source it, or want something ready to wear
                        — we&apos;ve designed a path that fits you perfectly.
                    </p>
                </motion.div>

                {/* Model selector tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-10 lg:mb-14 max-w-3xl mx-auto"
                >
                    {BRANDING.businessModels.map((model, i) => {
                        const Icon = MODEL_ICONS[i];
                        const isActive = activeModel === i;
                        return (
                            <button
                                key={model.title}
                                onClick={() => setActiveModel(i)}
                                className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border transition-all duration-300 text-left ${isActive
                                    ? "bg-primary border-primary text-white shadow-lg shadow-[#C2185B]/20"
                                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20"
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-white/20" : "bg-white/5"}`}>
                                    <Icon size={18} />
                                </div>
                                <span className="font-semibold text-sm">{model.title}</span>
                            </button>
                        );
                    })}
                </motion.div>

                {/* Active model detail */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeModel}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-4xl mx-auto"
                    >
                        {(() => {
                            const model = BRANDING.businessModels[activeModel];
                            const Icon = MODEL_ICONS[activeModel];
                            return (
                                <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-8 sm:p-10 lg:p-14">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 rounded-xl bg-primary/15 flex items-center justify-center">
                                            <Icon size={24} className="text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-white">{model.title}</h3>
                                            <p className="text-sm text-white/40 mt-1">Model {activeModel + 1} of 3</p>
                                        </div>
                                    </div>

                                    <p className="text-white/70 leading-relaxed text-base lg:text-lg mb-8">
                                        {model.detailedDescription}
                                    </p>

                                    <Link
                                        href={model.link}
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
                                    >
                                        {activeModel === 2 ? "Shop the Collection" : "Explore Our Styles"}
                                        <ArrowRight size={14} />
                                    </Link>
                                </div>
                            );
                        })()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}

// ============================================================
// PROCESS TIMELINE — "How a Garment is Born"
// ============================================================
function ProcessSection() {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

    return (
        <section ref={ref} className="section-gap bg-white overflow-hidden">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16 lg:mb-24"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-semibold mb-4 block">
                        The Journey
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                        How a Garment is Born
                    </h2>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        From the first conversation to the final stitch — every piece follows a process
                        built on care, precision, and collaboration.
                    </p>
                </motion.div>

                {/* Timeline */}
                <div className="relative max-w-3xl mx-auto">
                    {/* Vertical line */}
                    <motion.div
                        initial={{ scaleY: 0 }}
                        animate={isVisible ? { scaleY: 1 } : {}}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute left-6 sm:left-8 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary via-primary/40 to-transparent origin-top"
                    />

                    <div className="space-y-12 lg:space-y-16">
                        {BRANDING.processSteps.map((step, i) => (
                            <TimelineItem key={step.title} step={step} index={i} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

function TimelineItem({ step, index }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="relative pl-16 sm:pl-20"
        >
            {/* Dot on the line */}
            <motion.div
                initial={{ scale: 0 }}
                animate={isVisible ? { scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-[14px] sm:left-[22px] top-1 w-5 h-5 rounded-full border-[3px] border-primary bg-white z-10"
            />

            {/* Step number */}
            <span className="text-xs text-primary font-semibold uppercase tracking-widest mb-2 block">
                Step {String(index + 1).padStart(2, "0")}
            </span>
            <h4 className="text-lg sm:text-xl font-bold text-foreground mb-2">{step.title}</h4>
            <p className="text-muted-foreground leading-relaxed">{step.description}</p>
        </motion.div>
    );
}

// ============================================================
// STATS SECTION — Animated Counters
// ============================================================
function StatsSection() {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.3 });

    return (
        <section ref={ref} className="py-20 lg:py-28 bg-surface-2">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-semibold mb-4 block">
                        By the Numbers
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                        In Our Studio&apos;s Story So Far
                    </h2>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 max-w-4xl mx-auto">
                    {BRANDING.stats.map((stat, i) => (
                        <StatCard key={stat.label} stat={stat} index={i} isVisible={isVisible} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function StatCard({ stat, index, isVisible }) {
    const count = useCountUp(stat.value, 1200, isVisible);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="text-center"
        >
            <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground font-display leading-none">
                {count}{stat.suffix}
            </span>
            <p className="text-xs sm:text-sm text-text-light mt-3 uppercase tracking-widest font-medium">
                {stat.label}
            </p>
        </motion.div>
    );
}

// ============================================================
// MANIFESTO SECTION
// ============================================================
function ManifestoSection() {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

    return (
        <section ref={ref} className="section-gap bg-secondary overflow-hidden">
            <div className="page-container">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-semibold mb-4 block">
                        Who Is This Studio For?
                    </span>
                </motion.div>

                <div className="max-w-3xl mx-auto text-center space-y-6 sm:space-y-8">
                    {BRANDING.manifestoLines.map((line, i) => {
                        const isLast = i === BRANDING.manifestoLines.length - 1;
                        return (
                            <motion.p
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                                className={`text-xl sm:text-2xl lg:text-3xl leading-snug ${isLast
                                    ? "font-bold text-primary mt-2"
                                    : "font-light text-white/70 italic"
                                    }`}
                            >
                                {line}
                            </motion.p>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// ============================================================
// CTA FINALE
// ============================================================
function CTASection() {
    const { ref, isVisible } = useScrollReveal();
    const { isAuthenticated } = useAuth();
    const pathname = usePathname();
    const bookUrl = isAuthenticated ? "?action=book_appointment" : `/login?redirectURL=${pathname}&action=book_appointment`;

    return (
        <section ref={ref} className="py-20 lg:py-28 bg-white">
            <div className="page-container text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isVisible ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto"
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-semibold mb-4 block">
                        Ready?
                    </span>
                    <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                        Begin Your Story
                    </h2>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        Whether it&apos;s your first bespoke piece or your fiftieth, every order starts with a conversation.
                        Let&apos;s create something you&apos;ll love.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/catalog/styles"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Explore Our Styles
                            <ArrowRight size={16} />
                        </Link>
                        <Link
                            href={bookUrl}
                            scroll={false}
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-md border border-[#0D0D0D]/20 text-foreground font-semibold hover:bg-[#0D0D0D]/5 transition-colors"
                        >
                            <Calendar size={16} />
                            Book a Fitting
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function AboutPage() {
    return (
        <>
            <AboutHero />
            <OriginSection />
            <ValuesSection />
            <BusinessModelsSection />
            <ProcessSection />
            <StatsSection />
            <ManifestoSection />
            <CTASection />
        </>
    );
}
