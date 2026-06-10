"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Menu,
    X,
    ChevronDown,
    User,
    LogOut,
    LayoutDashboard,
    Calendar,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { BRANDING } from "@/config/branding";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "../../../public/images/logo-with-name.svg";

const NAV_LINKS = [
    { href: "/", label: "Home" },
    {
        href: "/catalog/styles",
        label: "Catalog",
        hasDropdown: true,
        children: [
            { href: "/catalog/styles", label: "Our Styles", description: "Browse curated fashion styles" },
            { href: "/catalog/ready-to-wear", label: "Ready-to-Wear", description: "Shop pre-made garments" },
        ],
    },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/testimonials", label: "Testimonials" },
    { href: "/about", label: "About" },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [megaMenuOpen, setMegaMenuOpen] = useState(false);
    const pathname = usePathname();
    const { user, isAuthenticated, isAdmin, logout } = useAuth();
    const { itemCount, openCart } = useCart();
    const megaMenuRef = useRef(null);

    const isHeroPage = pathname === "/";

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
        setMegaMenuOpen(false);
    }, [pathname]);

    // Close mega menu on outside click
    useEffect(() => {
        function handleClick(e) {
            if (megaMenuRef.current && !megaMenuRef.current.contains(e.target)) {
                setMegaMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const navClass = isHeroPage && !isScrolled
        ? "glass-nav-transparent"
        : "glass-nav";

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navClass}`}
                style={{ height: "var(--nav-height)" }}
            >
                <div className="page-container h-full flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <Logo
                            height={36}
                            style={{ fill: isHeroPage && !isScrolled ? "#fff" : BRANDING.colors.primary }}
                        />

                    </Link>

                    {/* Center Nav Links — Desktop */}
                    <div className="hidden lg:flex items-center gap-8" ref={megaMenuRef}>
                        {NAV_LINKS.map((link) =>
                            link.hasDropdown ? (
                                <div key={link.href} className="relative">
                                    <button
                                        onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                                        className={`flex items-center gap-1 text-sm font-medium transition-colors ${isHeroPage && !isScrolled
                                            ? "text-white/80 hover:text-white"
                                            : "text-[#555] hover:text-[#0D0D0D]"
                                            } ${pathname.startsWith("/catalog") ? "!text-[#C2185B]" : ""}`}
                                    >
                                        {link.label}
                                        <ChevronDown
                                            size={14}
                                            className={`transition-transform duration-200 ${megaMenuOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>

                                    {/* Mega Menu Dropdown */}
                                    <AnimatePresence>
                                        {megaMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                                                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[400px] bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.06)] overflow-hidden"
                                            >
                                                <div className="p-4 grid grid-cols-1 gap-1">
                                                    {link.children.map((child) => (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            className="flex flex-col gap-1 p-3 rounded-lg hover:bg-[#F4F0F8] transition-colors"
                                                        >
                                                            <span className="text-sm font-semibold text-[#0D0D0D]">
                                                                {child.label}
                                                            </span>
                                                            <span className="text-xs text-[#999]">{child.description}</span>
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`text-sm font-medium transition-colors ${isHeroPage && !isScrolled
                                        ? "text-white/80 hover:text-white"
                                        : "text-[#555] hover:text-[#0D0D0D]"
                                        } ${pathname === link.href ? "!text-[#C2185B]" : ""}`}
                                >
                                    {link.label}
                                </Link>
                            )
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Cart */}
                        <button
                            onClick={openCart}
                            className={`relative p-2 rounded-lg transition-colors ${isHeroPage && !isScrolled
                                ? "text-white/80 hover:text-white"
                                : "text-[#555] hover:text-[#0D0D0D]"
                                }`}
                        >
                            <ShoppingBag size={20} />
                            {itemCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#C2185B] text-white text-[10px] font-bold flex items-center justify-center"
                                >
                                    {itemCount}
                                </motion.span>
                            )}
                        </button>

                        {/* Book Appointment CTA — Desktop */}
                        <Link
                            href={isAuthenticated ? "?action=book_appointment" : `/login?redirectURL=${pathname}&action=book_appointment`}
                            scroll={false}
                            className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-md bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors"
                        >
                            <Calendar size={14} />
                            Book Appointment
                        </Link>

                        {/* User Avatar / Login */}
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className={`p-2 rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C2185B] ring-offset-1 ${isHeroPage && !isScrolled
                                            ? "text-white/80 hover:text-white"
                                            : "text-[#555] hover:text-[#0D0D0D]"
                                            }`}
                                    >
                                        <Avatar className="w-8 h-8 hover:opacity-90 transition-opacity">
                                            <AvatarImage src={user?.avatarUrl || user?.profilePicture} alt={user?.fullName || "User"} />
                                            <AvatarFallback className="bg-[#C2185B] text-white text-xs font-bold">
                                                {user?.fullName?.charAt(0) || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </button>
                                </DropdownMenuTrigger>

                                {/* User Dropdown */}
                                <DropdownMenuContent align="end" className="w-48 bg-white rounded-xl shadow-xl border border-[rgba(0,0,0,0.06)] p-1">
                                    <div className="px-2 py-2">
                                        <p className="text-sm font-semibold text-[#0D0D0D] truncate">
                                            {user?.fullName}
                                        </p>
                                        <p className="text-xs text-[#999] truncate">{user?.email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-[rgba(0,0,0,0.06)] mx-1" />
                                    <DropdownMenuItem asChild className="flex items-center gap-2 px-2 py-2 text-sm text-[#555] hover:bg-[#F4F0F8] rounded-lg cursor-pointer transition-colors outline-none focus:bg-[#F4F0F8] focus:text-[#0D0D0D]">
                                        <Link href={isAdmin ? "/admin/dashboard" : "/client/dashboard"}>
                                            <LayoutDashboard size={14} />
                                            <span>Dashboard</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={logout} className="flex items-center gap-2 px-2 py-2 text-sm text-[#C62828] hover:bg-[#FFEBEE] rounded-lg cursor-pointer transition-colors outline-none focus:bg-[#FFEBEE] focus:text-[#C62828] w-full mt-1">
                                        <LogOut size={14} />
                                        <span>Logout</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Link
                                href="/login"
                                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isHeroPage && !isScrolled
                                    ? "text-white/80 hover:text-white border border-white/20"
                                    : "text-[#555] hover:text-[#0D0D0D] border border-[#E0E0E0]"
                                    }`}
                            >
                                <User size={14} />
                                Login
                            </Link>
                        )}

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className={`lg:hidden p-2 ${isHeroPage && !isScrolled
                                ? "text-white/80 hover:text-white"
                                : "text-[#555] hover:text-[#0D0D0D]"
                                }`}
                        >
                            <Menu size={22} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-[#1A1A2E]"
                    >
                        <div className="flex items-center justify-between p-4">
                            <span className="text-xl font-bold text-white">{BRANDING.businessName}</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex flex-col px-6 pt-8 gap-1">
                            {NAV_LINKS.map((link, i) => (
                                <div key={link.href}>
                                    {link.hasDropdown ? (
                                        <div className="flex flex-col">
                                            <span className="text-[32px] font-bold text-white/60 py-3">
                                                {link.label}
                                            </span>
                                            {link.children.map((child, j) => (
                                                <motion.div
                                                    key={child.href}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: (i + j) * 0.08 }}
                                                >
                                                    <Link
                                                        href={child.href}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block text-lg text-white/80 hover:text-[#C2185B] pl-4 py-2 border-l-2 border-transparent hover:border-[#C2185B] transition-all"
                                                    >
                                                        {child.label}
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                        >
                                            <Link
                                                href={link.href}
                                                onClick={() => setMobileMenuOpen(false)}
                                                className={`text-[32px] font-bold py-3 block transition-colors ${pathname === link.href
                                                    ? "text-[#C2185B]"
                                                    : "text-white hover:text-[#C2185B]"
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        </motion.div>
                                    )}
                                </div>
                            ))}

                            {/* Auth links in mobile */}
                            <div className="mt-8 pt-8 border-t border-white/10">
                                {isAuthenticated ? (
                                    <>
                                        <Link
                                            href={isAdmin ? "/admin/dashboard" : "/client/dashboard"}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block text-lg text-white/80 hover:text-white py-2"
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => { logout(); setMobileMenuOpen(false); }}
                                            className="block text-lg text-[#C62828] py-2"
                                        >
                                            Logout
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block text-lg text-white hover:text-[#C2185B] py-2"
                                    >
                                        Login / Sign Up
                                    </Link>
                                )}
                            </div>

                            {/* CTA at bottom */}
                            <div className="mt-auto pt-8">
                                <Link
                                    href={isAuthenticated ? "?action=book_appointment" : `/login?redirectURL=${pathname}&action=book_appointment`}
                                    scroll={false}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-md bg-[#C2185B] text-white font-semibold hover:bg-[#A01548] transition-colors"
                                >
                                    <Calendar size={16} />
                                    Book a Fitting
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
