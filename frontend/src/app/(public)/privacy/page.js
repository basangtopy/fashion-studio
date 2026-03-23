"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BRANDING } from "@/config/branding";
import { useScrollReveal } from "@/hooks/useAnimations";

// ── Privacy Policy Content Sections ────────────────────────────────────────────
const SECTIONS = [
    {
        id: "introduction",
        title: "Introduction",
        content: `Welcome to ${BRANDING.businessName}. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it.\n\nThis policy applies to all information collected through our website, our services (including bespoke tailoring, fabric sourcing, and ready-to-wear purchases), and any related communications.\n\nBy using our services, you agree to the collection and use of information in accordance with this policy.`,
    },
    {
        id: "information-we-collect",
        title: "Information We Collect",
        content: `We collect information that you provide directly to us when you:\n\n• **Create an account** — Full name, email address, phone number, and password.\n• **Place an order** — Delivery address, order details, style preferences, fabric choices, and any special instructions.\n• **Submit measurements** — Body measurements (e.g. chest, waist, hips, inseam, shoulder width, arm length, and custom parameters). These are stored securely in your profile for current and future orders.\n• **Make a payment** — Payment confirmation details, bank transfer receipts, and transaction references. We do not store your bank account credentials.\n• **Book an appointment** — Preferred date, time, and service type.\n• **Communicate with us** — Messages sent through our platform chat, email, WhatsApp, or phone.\n• **Upload images** — Profile photos, payment proof, fabric images, and reference photos.\n\nWe may also automatically collect certain information when you visit our website, including your IP address, browser type, device information, pages visited, and referring URL. This is collected through standard web analytics tools.`,
    },
    {
        id: "how-we-use",
        title: "How We Use Your Information",
        content: `We use the information we collect for the following purposes:\n\n• **Order fulfilment** — To process, track, and deliver your bespoke or ready-to-wear orders.\n• **Measurements** — To store and retrieve your body measurements for accurate garment production, and to maintain a history of measurement changes over time.\n• **Payment processing** — To verify and confirm payments, issue receipts, and maintain accurate financial records.\n• **Communication** — To send order updates, appointment reminders, production status notifications, and respond to your enquiries.\n• **Account management** — To maintain your profile, order history, and preferences.\n• **Service improvement** — To analyse usage patterns, improve our website and services, and develop new features.\n• **Legal compliance** — To comply with applicable laws, regulations, and legal processes.`,
    },
    {
        id: "data-sharing",
        title: "Data Sharing & Third Parties",
        content: `We do **not** sell, trade, or rent your personal information to third parties.\n\nWe may share your information only in the following limited circumstances:\n\n• **Hosting providers** — Our website and data are hosted on secure cloud infrastructure provided by reputable third-party hosting services.\n• **Analytics tools** — We use privacy-respecting analytics to understand how our website is used. This data is aggregated and does not personally identify you.\n• **Legal requirements** — We may disclose your information if required to do so by law or in response to valid requests by public authorities.\n• **Business transfers** — In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.\n\nWe will never share your body measurements, order details, or personal communications with other clients or unrelated third parties.`,
    },
    {
        id: "data-retention",
        title: "Data Retention",
        content: `We retain your personal information for as long as your account is active or as needed to provide you with our services. Specifically:\n\n• **Account information** — Retained until you request deletion of your account.\n• **Order records** — Retained for a minimum of 6 years for accounting and legal compliance purposes.\n• **Measurements** — Retained in your profile until you delete them or request account deletion.\n• **Communications** — Chat messages and order-related communications are retained for the duration of the relevant order, plus 12 months.\n• **Analytics data** — Aggregated analytics data may be retained indefinitely as it does not personally identify you.\n\nWhen your data is no longer needed, we will securely delete or anonymise it.`,
    },
    {
        id: "your-rights",
        title: "Your Rights",
        content: `You have the following rights regarding your personal information:\n\n• **Access** — You can request a copy of the personal data we hold about you.\n• **Correction** — You can update or correct inaccurate information in your profile at any time, or request that we do so.\n• **Deletion** — You can request that we delete your account and associated personal data. Note that we may need to retain certain information for legal compliance.\n• **Data portability** — You can request your data in a structured, commonly used format.\n• **Withdrawal of consent** — Where we rely on your consent to process data, you may withdraw it at any time.\n• **Objection** — You can object to our processing of your data in certain circumstances.\n\nTo exercise any of these rights, please contact us using the details provided at the end of this policy.`,
    },
    {
        id: "cookies",
        title: "Cookies & Tracking",
        content: `Our website uses cookies and similar technologies to improve your experience:\n\n• **Essential cookies** — Required for the website to function properly. These include session cookies for authentication and cart functionality.\n• **Preference cookies** — Remember your settings and preferences (e.g. theme, language).\n• **Analytics cookies** — Help us understand how visitors interact with our website.\n\nWe do not use cookies for advertising or cross-site tracking. You can control cookie settings through your browser preferences. Note that disabling essential cookies may affect the functionality of our website.`,
    },
    {
        id: "security",
        title: "Data Security",
        content: `We take the security of your personal information seriously and implement appropriate technical and organisational measures to protect it, including:\n\n• Encryption of data in transit using SSL/TLS.\n• Secure password hashing and storage.\n• Access controls limiting who within our team can view your personal data.\n• Regular security reviews and updates to our systems.\n\nWhile we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security, but we are committed to promptly addressing any breaches should they occur.`,
    },
    {
        id: "children",
        title: "Children's Privacy",
        content: `Our services are not directed at individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal data, please contact us and we will take steps to delete that information.`,
    },
    {
        id: "changes",
        title: "Changes to This Policy",
        content: `We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make material changes, we will:\n\n• Update the "Effective Date" at the top of this page.\n• Notify registered users via email where practical.\n\nWe encourage you to review this policy periodically to stay informed about how we are protecting your information.`,
    },
    {
        id: "contact",
        title: "Contact Us",
        content: `If you have any questions about this Privacy Policy, wish to exercise your rights, or have concerns about how your data is handled, please contact us:\n\n• **Email:** ${BRANDING.contact.email}\n• **Phone:** ${BRANDING.contact.phone}\n• **WhatsApp:** ${BRANDING.contact.whatsapp}\n• **Address:** ${BRANDING.address}\n\nWe aim to respond to all enquiries within 48 hours.`,
    },
];

// ============================================================
// SCROLLSPY HOOK
// ============================================================
function useScrollSpy(sectionIds) {
    const [activeId, setActiveId] = useState(sectionIds[0]);

    useEffect(() => {
        const observers = [];
        const handleIntersect = (id) => (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveId(id);
                }
            });
        };

        sectionIds.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                const observer = new IntersectionObserver(handleIntersect(id), {
                    rootMargin: "-20% 0px -70% 0px",
                    threshold: 0,
                });
                observer.observe(el);
                observers.push(observer);
            }
        });

        return () => observers.forEach((obs) => obs.disconnect());
    }, [sectionIds]);

    return activeId;
}

// ============================================================
// HERO BANNER
// ============================================================
function PolicyHero() {
    return (
        <section className="relative bg-[#1A1A2E] pt-[calc(var(--nav-height)+40px)] pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
            {/* Subtle background shapes */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[10%] w-48 h-56 rounded-3xl bg-[#C2185B]/5 rotate-12" />
                <div className="absolute bottom-[15%] left-[5%] w-32 h-40 rounded-2xl bg-[#F8E8F0]/3 -rotate-6" />
            </div>

            <div className="page-container relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="text-[10px] uppercase tracking-[0.4em] text-[#C2185B] font-semibold mb-4 block">
                        Legal
                    </span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                        Privacy Policy
                    </h1>
                    <p className="text-white/50 text-sm">
                        Effective Date: March 1, 2026 &middot; Last Updated: March 16, 2026
                    </p>
                </motion.div>
            </div>
        </section>
    );
}

// ============================================================
// TABLE OF CONTENTS (Sticky Sidebar)
// ============================================================
function TOCSidebar({ sections, activeId }) {
    const handleClick = (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <nav className="space-y-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#999] font-semibold mb-4">
                Contents
            </p>
            {sections.map((section) => (
                <button
                    key={section.id}
                    onClick={() => handleClick(section.id)}
                    className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-all duration-200 ${activeId === section.id
                        ? "bg-[#C2185B]/10 text-[#C2185B] font-semibold border-l-2 border-[#C2185B]"
                        : "text-[#555] hover:text-[#0D0D0D] hover:bg-[#F4F0F8]"
                        }`}
                >
                    {section.title}
                </button>
            ))}
        </nav>
    );
}

// ============================================================
// MOBILE TOC (Collapsible)
// ============================================================
function MobileTOC({ sections, activeId }) {
    const [open, setOpen] = useState(false);

    const handleClick = (id) => {
        setOpen(false);
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    };

    return (
        <div className="lg:hidden mb-8 border border-[rgba(0,0,0,0.06)] rounded-xl bg-white overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#0D0D0D]"
            >
                <span>Contents</span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[#999]"
                >
                    ▾
                </motion.span>
            </button>
            {open && (
                <div className="px-4 pb-3 space-y-1 border-t border-[rgba(0,0,0,0.06)]">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => handleClick(section.id)}
                            className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors ${activeId === section.id
                                ? "text-[#C2185B] font-semibold"
                                : "text-[#555]"
                                }`}
                        >
                            {section.title}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================
// CONTENT SECTION
// ============================================================
function ContentSection({ section }) {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

    // Parse simple markdown-like formatting in content
    const renderContent = (text) => {
        return text.split("\n").map((line, i) => {
            if (line.trim() === "") return <br key={i} />;

            // Bold handling
            const parts = line.split(/\*\*(.*?)\*\*/g);
            const rendered = parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="font-semibold text-[#0D0D0D]">{part}</strong> : part
            );

            // Bullet points
            if (line.trim().startsWith("•")) {
                return (
                    <li key={i} className="flex items-start gap-2 ml-1 mb-2">
                        <span className="text-[#C2185B] mt-1 shrink-0">•</span>
                        <span>{rendered.map((r, idx) => typeof r === "string" ? r.replace(/^•\s*/, "") : r)}</span>
                    </li>
                );
            }

            return <p key={i} className="mb-3">{rendered}</p>;
        });
    };

    return (
        <motion.div
            ref={ref}
            id={section.id}
            initial={{ opacity: 0, y: 16 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="scroll-mt-28 mb-12 last:mb-0"
        >
            <h2 className="text-xl sm:text-2xl font-bold text-[#0D0D0D] mb-4 pb-3 border-b border-[rgba(0,0,0,0.06)]">
                <span className="border-l-[3px] border-[#C2185B] pl-3">{section.title}</span>
            </h2>
            <div className="text-[#555] leading-relaxed text-[15px]">
                {renderContent(section.content)}
            </div>
        </motion.div>
    );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function PrivacyPolicyPage() {
    const sectionIds = SECTIONS.map((s) => s.id);
    const activeId = useScrollSpy(sectionIds);

    return (
        <>
            <PolicyHero />

            <section className="section-gap bg-white">
                <div className="page-container">
                    <MobileTOC sections={SECTIONS} activeId={activeId} />

                    <div className="flex gap-12 lg:gap-16">
                        {/* Sticky TOC — Desktop */}
                        <aside className="hidden lg:block w-64 shrink-0">
                            <div className="sticky top-[calc(var(--nav-height)+32px)]">
                                <TOCSidebar sections={SECTIONS} activeId={activeId} />
                            </div>
                        </aside>

                        {/* Content */}
                        <div className="flex-1 min-w-0 max-w-3xl">
                            {SECTIONS.map((section) => (
                                <ContentSection key={section.id} section={section} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
