import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";
import { FaInstagram, FaFacebook, FaTiktok, FaWhatsapp } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { BRANDING } from "@/config/branding";

export default function Footer() {
    const iconMap = {
        instagram: FaInstagram,
        facebook: FaFacebook,
        twitter: FaXTwitter,
        tiktok: FaTiktok,
    };

    return (
        <footer className="bg-[#1A1A2E] text-white">
            <div className="page-container py-16 lg:py-20">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Column 1 — Brand */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-white">{BRANDING.businessName}</h3>
                        <p className="text-sm text-white/60 leading-relaxed">
                            {BRANDING.tagline}
                        </p>
                        <div className="flex items-center gap-3 pt-2">

                            {Object.entries(BRANDING.socials).map(([platform, url]) => {
                                const Icon = iconMap[platform];
                                if (!Icon) return null;
                                return (
                                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#C2185B] transition-colors">
                                        <Icon size={16} />
                                    </a>
                                );
                            })}

                        </div>
                    </div>

                    {/* Column 2 — Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                            Explore
                        </h4>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { href: "/", label: "Home" },
                                { href: "/catalog/styles", label: "Our Styles" },
                                { href: "/catalog/ready-to-wear", label: "Ready-to-Wear" },
                                { href: "/portfolio", label: "Portfolio" },
                                { href: "/testimonials", label: "Testimonials" },
                                { href: "/about", label: "About Us" },
                            ].map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm text-white/60 hover:text-[#C2185B] transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Column 3 — Client Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                            My Account
                        </h4>
                        <div className="flex flex-col gap-2.5">
                            {[
                                { href: "/client/orders", label: "My Orders" },
                                { href: "/client/measurements", label: "My Measurements" },
                                { href: "/client/profile", label: "My Profile" },
                                { href: "/client/payments", label: "Payment History" },
                            ].map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm text-white/60 hover:text-[#C2185B] transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Column 4 — Contact */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold text-white/50 uppercase tracking-wider">
                            Contact Us
                        </h4>
                        <div className="flex flex-col gap-3">
                            <a
                                href={`mailto:${BRANDING.contact.email}`}
                                className="flex items-center gap-2 text-sm text-white/60 hover:text-[#C2185B] transition-colors"
                            >
                                <Mail size={14} className="shrink-0" />
                                {BRANDING.contact.email}
                            </a>
                            <a
                                href={`tel:${BRANDING.contact.phone}`}
                                className="flex items-center gap-2 text-sm text-white/60 hover:text-[#C2185B] transition-colors"
                            >
                                <Phone size={14} className="shrink-0" />
                                {BRANDING.contact.phone}
                            </a>
                            <a
                                href={`https://wa.me/${BRANDING.contact.whatsapp.replace(/\s/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-white/60 hover:text-[#C2185B] transition-colors"
                            >
                                <FaWhatsapp size={14} className="shrink-0" />
                                WhatsApp
                            </a>
                            <div className="flex items-start gap-2 text-sm text-white/60">
                                <MapPin size={14} className="shrink-0 mt-0.5" />
                                {BRANDING.address}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-white/40">
                        © {new Date().getFullYear()} {BRANDING.businessName}. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <Link href="/about" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                            About
                        </Link>
                        <Link href="/privacy" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-xs text-white/40 hover:text-white/60 transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
