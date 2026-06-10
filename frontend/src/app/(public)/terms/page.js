"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { BRANDING } from "@/config/branding";
import { useScrollReveal } from "@/hooks/useAnimations";

// ── Terms of Service Content Sections ──────────────────────────────────────────
const SECTIONS = [
    {
        id: "acceptance",
        title: "Acceptance of Terms",
        content: `By accessing or using the ${BRANDING.businessName} website and services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree with any part of these Terms, you must not use our website or services.\n\nThese Terms constitute a legally binding agreement between you and ${BRANDING.businessName}. Please read them carefully before placing an order, creating an account, or using any of our services.`,
    },
    {
        id: "eligibility",
        title: "Eligibility",
        content: `To use our services, you must:\n\n• Be at least 18 years of age, or have the consent of a parent or legal guardian.\n• Be capable of forming a binding contract under applicable law.\n• Provide accurate and complete information when creating an account or placing an order.\n\nOur bespoke tailoring services are primarily available to clients in Lagos, Nigeria and surrounding areas where in-person fittings can be arranged. Ready-to-Wear items may be shipped to additional locations at our discretion.`,
    },
    {
        id: "services",
        title: "Our Services",
        content: `${BRANDING.businessName} offers three primary service models:\n\n• **Model 1 — Client Brings Fabric:** You provide your own fabric, and we create a custom garment based on your chosen style, measurements, and design preferences. This model is ideal for clients who have a specific fabric in mind — whether it's a special Ankara print, imported textile, or a sentimental piece.\n\n• **Model 2 — We Source the Fabric:** You describe your desired garment and we source the appropriate fabric on your behalf. We present fabric options for your approval before proceeding with production. Fabric sourcing costs are included in the quoted price.\n\n• **Model 3 — Ready-to-Wear:** Browse our collection of pre-made garments designed and crafted in-house. Ready-to-Wear items are available in standard sizes and can be purchased directly through our website.\n\nWe also offer appointment booking for consultations and fittings, which can be scheduled through our website.`,
    },
    {
        id: "account",
        title: "Account Registration & Responsibility",
        content: `When you create an account with us, you agree to:\n\n• Provide accurate, current, and complete registration information.\n• Maintain and promptly update your account information.\n• Keep your password secure and confidential.\n• Accept responsibility for all activities that occur under your account.\n• Notify us immediately of any unauthorised use of your account.\n\nWe reserve the right to suspend or terminate accounts that violate these Terms, contain false information, or are used for fraudulent purposes.`,
    },
    {
        id: "orders",
        title: "Placing Orders & Confirmation",
        content: `When you place an order through our website:\n\n• Your order is treated as an offer to purchase and is subject to our acceptance.\n• We will review your order and confirm acceptance via your dashboard or email. An order is not confirmed until we send you a written confirmation.\n• For bespoke orders (Models 1 and 2), the final price may be adjusted based on design complexity, fabric requirements, and agreed-upon specifications.\n• For Ready-to-Wear purchases, the listed price at the time of order is final, subject to availability.\n• We reserve the right to refuse or cancel any order at our discretion — for example, if the requested design is not feasible, if payment is not received, or if there are stock limitations on Ready-to-Wear items.\n\nOrder details — including style, fabric, measurements, and special instructions — are confirmed during the production review stage. Changes requested after production has begun may incur additional charges or delay delivery.`,
    },
    {
        id: "measurements",
        title: "Measurements & Fitting",
        content: `Accurate body measurements are essential for bespoke garments. By using our services, you agree to:\n\n• **Provide accurate measurements.** If measurements are submitted by you (self-measured), you accept responsibility for their accuracy. We strongly recommend an in-person measurement session at our studio for the best results.\n• **Attend fittings when requested.** For custom orders, we may schedule one or more fitting sessions to ensure proper fit. Failure to attend scheduled fittings may delay your order.\n• **Communicate changes.** If your body measurements change significantly between ordering and delivery, please inform us as soon as possible.\n\n${BRANDING.businessName} will store your measurements securely in your account profile for use in current and future orders. You may update or delete your measurements at any time through your account settings.`,
    },
    {
        id: "payment",
        title: "Payment Terms",
        content: `All prices are quoted in Nigerian Naira (${BRANDING.currency.symbol}/${BRANDING.currency.code}).\n\nPayment is processed via manual bank transfer. Our payment process is as follows:\n\n• **Bank Details:** ${BRANDING.paymentInfo.bankName} — Account Name: ${BRANDING.paymentInfo.accountName} — Account Number: ${BRANDING.paymentInfo.accountNumber}\n• Transfer the exact amount specified in your order confirmation.\n• Include your order number in the transfer description/narration.\n• Upload your payment proof (screenshot or receipt) through your order dashboard.\n• Payment will be verified by our team, typically within a few hours during business days.\n\nFor bespoke orders, we may require a deposit (typically 50–70% of the total) before production begins, with the balance due before delivery or pickup. The specific payment schedule will be communicated during order confirmation.\n\nOrders will not proceed to production until the required payment has been confirmed.`,
    },
    {
        id: "production",
        title: "Production & Turnaround Times",
        content: `Production timelines vary depending on the type and complexity of your order:\n\n• **Bespoke orders (Models 1 & 2):** Typically 1–4 weeks, depending on design complexity, fabric availability, and any required fittings. We will provide an estimated delivery date during order confirmation.\n• **Ready-to-Wear orders:** Typically processed and shipped within 1–5 business days, subject to stock availability.\n\nWhile we strive to meet all estimated timelines, production delays may occur due to unforeseen circumstances such as fabric supply issues, design complexity, or force majeure events. We will notify you promptly of any significant delays.\n\nTurnaround times do not begin until payment has been confirmed and all order details (measurements, style, fabric) have been finalised.`,
    },
    {
        id: "returns",
        title: "Alterations, Returns & Refunds",
        content: `**Bespoke orders (Models 1 & 2):**\n\n• Because bespoke garments are made to your specific measurements and design choices, they are **non-refundable** and **non-returnable** once production has commenced.\n• If a garment does not fit properly due to a production error on our part, we will make alterations at no additional cost. This must be reported within 7 days of delivery.\n• If the fit issue is due to inaccurate self-submitted measurements, alterations may be offered at an additional cost.\n\n**Ready-to-Wear orders:**\n\n• Ready-to-Wear items may be returned within 7 days of delivery, provided they are unworn, unwashed, and in their original condition with all tags attached.\n• Refunds for eligible returns will be processed within 10 business days of receiving the returned item.\n• Items purchased on sale or at a discount may be exchanged but are not eligible for refund.\n• Shipping costs for returns are the responsibility of the client unless the return is due to a defect or error on our part.\n\n**Cancellations:**\n\n• Orders may be cancelled before production begins, at no charge.\n• Cancellation of a bespoke order after production has started is subject to a restocking/materials fee, determined on a case-by-case basis.`,
    },
    {
        id: "ip",
        title: "Intellectual Property",
        content: `All content on the ${BRANDING.businessName} website — including but not limited to text, graphics, logos, images, design templates, style illustrations, and software — is the property of ${BRANDING.businessName} and is protected by Nigerian and international intellectual property laws.\n\nYou may not:\n\n• Copy, reproduce, or distribute any content from our website without prior written consent.\n• Use our brand name, logo, or designs for commercial purposes.\n• Claim ownership of any design created by ${BRANDING.businessName}.\n\n**Portfolio usage:** When we create a garment for you, we may photograph it for inclusion in our portfolio and marketing materials. If you prefer that your garment not be featured, please inform us during the order process or through your account settings. We will always respect your preference and will never publish client-identifiable information without explicit consent.`,
    },
    {
        id: "conduct",
        title: "Client Conduct",
        content: `When using our services, you agree to:\n\n• Communicate respectfully with our team and staff.\n• Provide truthful and accurate information in all interactions.\n• Not misuse our platform for any unlawful, fraudulent, or harmful purpose.\n• Not attempt to interfere with the proper functioning of our website.\n• Not upload content that is offensive, defamatory, or infringes on the rights of others.\n\nWe reserve the right to refuse service, cancel orders, or terminate accounts of clients who violate these conduct standards.`,
    },
    {
        id: "liability",
        title: "Limitation of Liability",
        content: `To the maximum extent permitted by applicable law:\n\n• ${BRANDING.businessName} provides its services "as is" and makes no warranties, express or implied, regarding the website or services.\n• We shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services.\n• Our total liability for any claim arising from these Terms or our services shall not exceed the amount you paid for the specific order giving rise to the claim.\n• We are not liable for delays, failures, or damages caused by circumstances beyond our reasonable control, including but not limited to natural disasters, strikes, supply chain disruptions, pandemics, or government actions.\n\nNothing in these Terms shall exclude or limit our liability for death or personal injury caused by our negligence, fraud, or any liability that cannot be excluded by applicable law.`,
    },
    {
        id: "governing-law",
        title: "Governing Law",
        content: `These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria.\n\nAny disputes arising from or relating to these Terms or our services shall be subject to the exclusive jurisdiction of the courts of Lagos State, Nigeria.\n\nIf any provision of these Terms is found to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.`,
    },
    {
        id: "changes",
        title: "Changes to These Terms",
        content: `We reserve the right to modify these Terms at any time. When we make material changes, we will:\n\n• Update the "Effective Date" at the top of this page.\n• Notify registered users via email or dashboard notification where practical.\n\nYour continued use of our services after changes are posted constitutes acceptance of the revised Terms. If you do not agree with any updates, you should stop using our services and contact us to close your account.`,
    },
    {
        id: "contact",
        title: "Contact Information",
        content: `If you have questions about these Terms of Service, need clarification on any clause, or wish to raise a concern, please contact us:\n\n• **Email:** ${BRANDING.contact.email}\n• **Phone:** ${BRANDING.contact.phone}\n• **WhatsApp:** ${BRANDING.contact.whatsapp}\n• **Address:** ${BRANDING.address}\n\nWe are committed to resolving disputes amicably and will respond to all enquiries within 48 hours.`,
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
function TermsHero() {
    return (
        <section className="relative bg-[#1A1A2E] pt-[calc(var(--nav-height)_+_40px)] pb-16 sm:pb-20 lg:pb-24 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] left-[10%] w-48 h-56 rounded-3xl bg-[#C2185B]/5 -rotate-6" />
                <div className="absolute bottom-[15%] right-[5%] w-32 h-40 rounded-2xl bg-[#F8E8F0]/3 rotate-12" />
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
                        Terms of Service
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
// MOBILE TOC
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

    const renderContent = (text) => {
        return text.split("\n").map((line, i) => {
            if (line.trim() === "") return <br key={i} />;

            const parts = line.split(/\*\*(.*?)\*\*/g);
            const rendered = parts.map((part, j) =>
                j % 2 === 1 ? <strong key={j} className="font-semibold text-[#0D0D0D]">{part}</strong> : part
            );

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
export default function TermsOfServicePage() {
    const sectionIds = SECTIONS.map((s) => s.id);
    const activeId = useScrollSpy(sectionIds);

    return (
        <>
            <TermsHero />

            <section className="section-gap bg-white">
                <div className="page-container">
                    <MobileTOC sections={SECTIONS} activeId={activeId} />

                    <div className="flex gap-12 lg:gap-16">
                        <aside className="hidden lg:block w-64 shrink-0">
                            <div className="sticky top-[calc(var(--nav-height)_+_32px)]">
                                <TOCSidebar sections={SECTIONS} activeId={activeId} />
                            </div>
                        </aside>

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
