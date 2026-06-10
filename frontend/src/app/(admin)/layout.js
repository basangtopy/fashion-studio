"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import useDebounce from "@/hooks/useDebounce";
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    MessageSquare,
    Palette,
    Ruler,
    Calendar,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    PanelLeftClose,
    PanelLeft,
    Search,
    Star,
    Menu,
    X,
    ExternalLink,
    MoreHorizontal,
    Shirt,
    Image as ImageIcon,
    Bell,
    Download,
    Command,
} from "lucide-react";
import { BRANDING } from "@/config/branding";
import NotificationDrawer, { NotificationBellButton } from "@/components/admin/NotificationDrawer";
import useSSE from "@/hooks/useSSE";
import { Separator } from "@/components/ui/separator";
import LogoWithName from "../../../public/images/logo-with-name.svg";
import Logo from "../../../public/images/logo.svg";

const EXPANDED_W = 240;
const COLLAPSED_W = 64;

/* ─── Sidebar sections ─── */
const SIDEBAR_SECTIONS = [
    {
        label: "Overview",
        items: [
            { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Orders & Clients",
        items: [
            { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
            { href: "/admin/clients", label: "Clients", icon: Users },
            { href: "/admin/chat", label: "Chat Inbox", icon: MessageSquare },
        ],
    },
    {
        label: "Catalog",
        items: [
            { href: "/admin/catalog/styles", label: "Styles", icon: Palette },
            { href: "/admin/catalog/ready-to-wear", label: "Ready-to-Wear", icon: Shirt },
            { href: "/admin/catalog/portfolio", label: "Portfolio", icon: ImageIcon },
            { href: "/admin/testimonials", label: "Testimonials", icon: Star },
        ],
    },
    {
        label: "Measurements",
        items: [
            { href: "/admin/measurements", label: "Measurements", icon: Ruler },
            { href: "/admin/appointments", label: "Appointments", icon: Calendar },
        ],
    },
    {
        label: "Finance",
        superAdminOnly: true,
        items: [
            { href: "/admin/payments", label: "Payments", icon: CreditCard },
            { href: "/admin/finance", label: "Finance Summary", icon: BarChart3 },
        ],
    },
];

/* ─── Command Palette item list ─── */
const CMD_PALETTE_ITEMS = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "Pages" },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag, section: "Pages" },
    { href: "/admin/clients", label: "Clients", icon: Users, section: "Pages" },
    { href: "/admin/chat", label: "Chat Inbox", icon: MessageSquare, section: "Pages" },
    { href: "/admin/catalog/styles", label: "Styles", icon: Palette, section: "Catalog" },
    { href: "/admin/catalog/ready-to-wear", label: "Ready-to-Wear", icon: Shirt, section: "Catalog" },
    { href: "/admin/catalog/portfolio", label: "Portfolio", icon: ImageIcon, section: "Catalog" },
    { href: "/admin/testimonials", label: "Testimonials", icon: Star, section: "Catalog" },
    { href: "/admin/measurements", label: "Measurements", icon: Ruler, section: "Measurements" },
    { href: "/admin/appointments", label: "Appointments", icon: Calendar, section: "Measurements" },
    { href: "/admin/payments", label: "Payments", icon: CreditCard, section: "Finance", superAdminOnly: true },
    { href: "/admin/finance", label: "Finance Summary", icon: BarChart3, section: "Finance", superAdminOnly: true },
    { href: "/admin/settings", label: "Settings", icon: Settings, section: "System", superAdminOnly: true },
];

/*
 * Sidebar animation strategy:
 * - Only TWO things animate: sidebar WIDTH and text OPACITY.
 * - Sidebar uses overflow-hidden so text is clipped naturally.
 * - Each item uses a fixed-size icon box (w-10 h-10) for consistent centering.
 * - Text is ALWAYS in the DOM — never conditionally rendered.
 * - On collapse: text fades to 0 (fast), sidebar shrinks (slightly slower).
 * - On expand: sidebar grows, text fades in with a slight delay.
 * - No justify-center toggling, no width-0 tricks, no layout shifts.
 */

export default function AdminLayout({ children }) {
    const pathname = usePathname();
    const { isAuthenticated, loading, user, logout, isAdmin, isSuperAdmin } = useAuth();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const [cmdOpen, setCmdOpen] = useState(false);
    const [cmdQuery, setCmdQuery] = useState("");
    const cmdInputRef = useRef(null);

    // Debounce the command query for DB search
    const debouncedQuery = useDebounce(cmdQuery, 300);

    // DB Search Query
    const { data: searchData, isFetching: isSearching } = useQuery({
        queryKey: ["admin-global-search", debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery || debouncedQuery.length < 2) return null;
            const { data } = await api.get("/admin/dashboard/search", { params: { q: debouncedQuery } });
            return data?.data;
        },
        enabled: debouncedQuery.length >= 2,
        staleTime: 5 * 60 * 1000,
    });

    // Establish SSE connection for live updates
    useSSE();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.replace("/login");
            } else if (!isAdmin) {
                router.replace("/client/dashboard");
            }
        }
    }, [loading, isAuthenticated, isAdmin, router]);

    // Command Palette keyboard shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setCmdOpen((prev) => !prev);
                setCmdQuery("");
            }
            if (e.key === "Escape" && cmdOpen) {
                setCmdOpen(false);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [cmdOpen]);

    // Auto-focus command palette input
    useEffect(() => {
        if (cmdOpen) {
            setTimeout(() => cmdInputRef.current?.focus(), 100);
        }
    }, [cmdOpen]);

    const handleCmdSelect = useCallback((href) => {
        setCmdOpen(false);
        setCmdQuery("");
        router.push(href);
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
                <div className="w-8 h-8 border-3 border-[#C2185B]/30 border-t-[#C2185B] rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !isAdmin) return null;

    // Text classes: always rendered, fades based on state
    const textCls = `whitespace-nowrap overflow-hidden transition-opacity duration-200 ${collapsed ? "opacity-0 delay-0" : "opacity-100 delay-100"}`;

    // Breadcrumb from pathname
    const breadcrumb = pathname.split("/").filter(Boolean).slice(1).join(" / ") || "Dashboard";

    // Filter static command palette items
    const filteredStaticItems = CMD_PALETTE_ITEMS
        .filter((item) => !item.superAdminOnly || isSuperAdmin)
        .filter((item) => {
            if (!cmdQuery) return true;
            return item.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
                item.section.toLowerCase().includes(cmdQuery.toLowerCase());
        });

    // Group filtered items by section
    const cmdSections = {};
    if (filteredStaticItems.length > 0) {
        cmdSections["Pages & Sections"] = filteredStaticItems;
    }

    // Append dynamic DB search results if available
    if (searchData) {
        if (searchData.orders?.length > 0) {
            cmdSections["Orders"] = searchData.orders.map(o => ({
                href: `/admin/orders/${o.id}`,
                label: `Order ${o.orderNumber}`,
                subtext: o.client?.fullName,
                icon: ShoppingBag,
            }));
        }
        if (searchData.clients?.length > 0) {
            cmdSections["Clients"] = searchData.clients.map(c => ({
                href: `/admin/clients/${c.id}`,
                label: c.fullName,
                subtext: c.email,
                icon: Users,
            }));
        }
        if (searchData.styles?.length > 0) {
            cmdSections["Styles"] = searchData.styles.map(s => ({
                href: `/admin/catalog/styles/${s.id}`,
                label: s.name,
                icon: Palette,
            }));
        }
        if (searchData.rtw?.length > 0) {
            cmdSections["Ready-to-Wear"] = searchData.rtw.map(r => ({
                href: `/admin/catalog/ready-to-wear/${r.id}`,
                label: r.name,
                icon: Shirt,
            }));
        }
    }

    // "More" sheet items — everything not in the primary bottom 5
    const moreItems = [
        { href: "/admin/dashboard", icon: LayoutDashboard, label: "Home" },
        { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
        { href: "/admin/chat", icon: MessageSquare, label: "Chat" },
        { href: "/admin/clients", icon: Users, label: "Clients" },
        { href: "/admin/catalog/styles", label: "Styles", icon: Palette },
        { href: "/admin/catalog/ready-to-wear", label: "Ready-to-Wear", icon: Shirt },
        { href: "/admin/catalog/portfolio", label: "Portfolio", icon: ImageIcon },
        { href: "/admin/testimonials", label: "Testimonials", icon: Star },
        { href: "/admin/measurements", label: "Measurements", icon: Ruler },
        { href: "/admin/appointments", label: "Appointments", icon: Calendar },
        ...(isSuperAdmin ? [
            { href: "/admin/payments", label: "Payments", icon: CreditCard },
            { href: "/admin/finance", label: "Finance", icon: BarChart3 },
            { href: "/admin/settings", label: "Settings", icon: Settings },
        ] : []),
    ];

    return (
        <div className="flex min-h-screen bg-[#FAFAFA]">
            {/* ─── Desktop Sidebar ─── */}
            <aside
                className="hidden lg:flex flex-col fixed top-0 bottom-0 left-0 z-50 bg-[#1A1A2E] overflow-hidden"
                style={{
                    width: collapsed ? COLLAPSED_W : EXPANDED_W,
                    transition: "width 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                {/* Brand */}
                <div className="h-16 flex items-center px-3 shrink-0 overflow-hidden">

                    {collapsed ? <Logo style={{ fill: "#C2185B" }} className="w-10 h-10" /> : <LogoWithName style={{ fill: "#C2185B" }} className="tracking-tight" />}

                </div>
                <Separator className="bg-white/8 shrink-0" />

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {SIDEBAR_SECTIONS.map((section) => {
                        if (section.superAdminOnly && !isSuperAdmin) return null;
                        return (
                            <div key={section.label} className="mb-4">
                                <div
                                    className="overflow-hidden transition-all duration-200"
                                    style={{ height: collapsed ? 0 : 22, opacity: collapsed ? 0 : 0.5 }}
                                >
                                    <p className="px-3 text-[10px] font-semibold text-white/40 uppercase tracking-widest whitespace-nowrap leading-[22px]">
                                        {section.label}
                                    </p>
                                </div>

                                <div className="space-y-0.5">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                title={collapsed ? item.label : undefined}
                                                className={`flex items-center rounded-lg overflow-hidden transition-all duration-150 relative ${isActive
                                                    ? "bg-[#C2185B]/12 text-white"
                                                    : "text-white/50 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                {/* Active indicator — 4px Primary left border */}
                                                {isActive && (
                                                    <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#C2185B]" />
                                                )}
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                                    <item.icon size={20} />
                                                </div>
                                                <span className={`${textCls} text-sm font-medium`}>
                                                    {item.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom area: user block + actions */}
                <Separator className="bg-white/8 shrink-0" />
                <div className="px-2 py-2 space-y-0.5 shrink-0">
                    {/* Cmd+K shortcut hint */}
                    {!collapsed && (
                        <button
                            onClick={() => { setCmdOpen(true); setCmdQuery(""); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/40 hover:text-white/60 hover:bg-white/8 transition-colors text-xs"
                        >
                            <Search size={14} />
                            <span className="flex-1 text-left">Search...</span>
                            <kbd className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono-data">⌘K</kbd>
                        </button>
                    )}
                    {collapsed && (
                        <button
                            onClick={() => { setCmdOpen(true); setCmdQuery(""); }}
                            title="Search (⌘K)"
                            className="w-10 h-10 mx-auto flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <Search size={20} />
                        </button>
                    )}
                </div>

                <Separator className="bg-white/8 shrink-0" />
                <div className="px-2 py-2 space-y-0.5 shrink-0">
                    {isSuperAdmin && (
                        <NavItem href="/admin/settings" icon={Settings} label="Settings" textCls={textCls} collapsed={collapsed} pathname={pathname} />
                    )}
                    <NavItem
                        icon={collapsed ? PanelLeft : PanelLeftClose}
                        label="Collapse"
                        textCls={textCls}
                        collapsed={collapsed}
                        onClick={() => setCollapsed(!collapsed)}
                    />
                </div>

                {/* User block at bottom — per spec */}
                <Separator className="bg-white/8 shrink-0" />
                <div className="px-3 py-3 shrink-0 overflow-hidden">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden relative">
                            {(user?.avatarUrl || user?.profilePicture) ? (
                                <Image src={user.avatarUrl || user.profilePicture} alt="" fill className="object-cover" />
                            ) : (
                                <span className="text-lg">{user?.fullName?.charAt(0) || "A"}</span>
                            )}
                        </div>
                        <div className={`${textCls} ml-2 min-w-0 flex-1`}>
                            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                                    {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Staff"}
                                </span>
                            </div>
                        </div>
                        {!collapsed && (
                            <button
                                onClick={logout}
                                title="Logout"
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-[#C62828] hover:bg-white/5 transition-colors shrink-0"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                    </div>
                    {collapsed && (
                        <button
                            onClick={logout}
                            title="Logout"
                            className="w-10 h-10 mx-auto mt-1 flex items-center justify-center rounded-lg text-white/30 hover:text-[#C62828] hover:bg-white/5 transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </aside>

            {/* ─── Main area ─── */}
            <div
                className="flex-1 min-w-0 flex flex-col min-h-screen lg:ml-[var(--admin-sw)]"
                style={{
                    "--admin-sw": `${collapsed ? COLLAPSED_W : EXPANDED_W}px`,
                    transition: "margin-left 300ms cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            >
                {/* ─── Top bar (visible on ALL screens) ─── */}
                <header className="flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-40">
                    {/* Left: breadcrumb on desktop, brand on mobile */}
                    <div className="flex items-center gap-3">
                        <div className="lg:hidden w-8 h-8 flex items-center justify-center text-white font-bold text-xs shrink-0">
                            {<Logo style={{ fill: "#C2185B" }} className="w-8 h-8" />}
                        </div>
                        <h2 className="text-sm font-semibold text-[#0D0D0D] capitalize hidden sm:block">
                            {breadcrumb}
                        </h2>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                        {/* Cmd+K trigger for top bar */}
                        <button
                            onClick={() => { setCmdOpen(true); setCmdQuery(""); }}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(0,0,0,0.08)] text-xs text-[#999] hover:text-[#555] hover:border-[rgba(0,0,0,0.15)] transition-colors"
                        >
                            <Search size={13} />
                            <span>Search...</span>
                            <kbd className="text-[10px] bg-[#F4F0F8] px-1.5 py-0.5 rounded font-mono-data">⌘K</kbd>
                        </button>
                        <Link href="/" className="hidden sm:flex text-xs text-[#999] hover:text-[#C2185B] transition-colors font-medium items-center gap-1">
                            <ExternalLink size={12} /> View Site
                        </Link>
                        <NotificationBellButton onClick={() => setNotifOpen(true)} />
                    </div>
                </header>

                <main className="flex-1 min-w-0">
                    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-full">{children}</div>
                </main>
            </div>

            {/* ─── Mobile Bottom Nav ─── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[rgba(0,0,0,0.06)] flex items-center justify-around h-16 px-1">
                {[
                    { href: "/admin/dashboard", icon: LayoutDashboard, label: "Home" },
                    { href: "/admin/orders", icon: ShoppingBag, label: "Orders" },
                    { href: "/admin/chat", icon: MessageSquare, label: "Chat" },
                    { href: "/admin/clients", icon: Users, label: "Clients" },
                ].map((link) => {
                    const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[48px] transition-colors ${isActive ? "text-[#C2185B]" : "text-[#999]"}`}
                        >
                            <link.icon size={20} />
                            <span className="text-[10px] font-medium">{link.label}</span>
                        </Link>
                    );
                })}
                {/* More button */}
                <button
                    onClick={() => setMoreOpen(true)}
                    className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[48px] ${moreOpen ? "text-[#C2185B]" : "text-[#999]"}`}
                >
                    <MoreHorizontal size={20} />
                    <span className="text-[10px] font-medium">More</span>
                </button>
            </nav>

            {/* ─── More Sheet (Mobile) ─── */}
            <AnimatePresence>
                {moreOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 z-50 lg:hidden"
                            onClick={() => setMoreOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto lg:hidden"
                        >
                            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                <h3 className="text-sm font-bold text-[#0D0D0D]">More</h3>
                                <button onClick={() => setMoreOpen(false)} className="p-1.5 rounded-lg hover:bg-[#F4F0F8]">
                                    <X size={16} className="text-[#999]" />
                                </button>
                            </div>
                            <div className="px-3 pb-6 grid grid-cols-3 gap-2">
                                {moreItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMoreOpen(false)}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-colors ${isActive
                                                ? "bg-[#C2185B]/10 text-[#C2185B]"
                                                : "text-[#555] hover:bg-[#F4F0F8]"
                                                }`}
                                        >
                                            <item.icon size={20} />
                                            <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                                        </Link>
                                    );
                                })}
                                <Link
                                    href="/"
                                    onClick={() => setMoreOpen(false)}
                                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[#555] hover:bg-[#F4F0F8] transition-colors"
                                >
                                    <ExternalLink size={20} />
                                    <span className="text-[11px] font-medium text-center leading-tight">View Site</span>
                                </Link>
                                <button
                                    onClick={() => { setMoreOpen(false); logout(); }}
                                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-[#C62828] hover:bg-[#FFEBEE] transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span className="text-[11px] font-medium text-center leading-tight">Logout</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Command Palette (Cmd+K) ─── */}
            <AnimatePresence>
                {cmdOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                            onClick={() => setCmdOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: -20 }}
                            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-[90vw] max-w-[520px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-[rgba(0,0,0,0.08)] overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
                                <Search size={18} className="text-[#999] shrink-0" />
                                <input
                                    ref={cmdInputRef}
                                    type="text"
                                    value={cmdQuery}
                                    onChange={(e) => setCmdQuery(e.target.value)}
                                    placeholder="Search pages, settings..."
                                    className="flex-1 text-sm text-[#0D0D0D] bg-transparent outline-none placeholder-[#999]"
                                />
                                <kbd className="text-[10px] text-[#999] bg-[#F4F0F8] px-2 py-1 rounded font-mono-data shrink-0">ESC</kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[50vh] overflow-y-auto py-2">
                                {Object.keys(cmdSections).length === 0 ? (
                                    <div className="py-8 text-center flex flex-col items-center justify-center">
                                        {isSearching ? (
                                            <div className="w-5 h-5 border-2 border-[#C2185B] border-t-transparent rounded-full animate-spin mb-3 text-[#C2185B]" />
                                        ) : (
                                            <Search size={24} className="text-[#CCC] mb-2" />
                                        )}
                                        <p className="text-sm text-[#999]">{isSearching ? "Searching database..." : "No results found"}</p>
                                    </div>
                                ) : (
                                    Object.entries(cmdSections).map(([sectionName, items]) => (
                                        <div key={sectionName} className="mb-2 last:mb-0">
                                            <p className="px-5 py-1.5 text-[10px] font-semibold text-[#555] bg-[#FAFAFA] uppercase tracking-wider sticky top-0 z-10">{sectionName}</p>
                                            <div className="py-1">
                                                {items.map((item) => {
                                                    const isActive = pathname === item.href;
                                                    return (
                                                        <button
                                                            key={item.href}
                                                            onClick={() => handleCmdSelect(item.href)}
                                                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors group ${isActive
                                                                ? "bg-[#C2185B]/8 text-[#C2185B]"
                                                                : "text-[#0D0D0D] hover:bg-[#F4F0F8]"
                                                                }`}
                                                        >
                                                            <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isActive ? "bg-[#C2185B]/10" : "bg-white border border-[rgba(0,0,0,0.06)] group-hover:bg-white"}`}>
                                                                <item.icon size={14} className={isActive ? "text-[#C2185B]" : "text-[#555] group-hover:text-[#0D0D0D]"} />
                                                            </div>
                                                            <div className="flex flex-col items-start min-w-0">
                                                                <span className="font-medium truncate">{item.label}</span>
                                                                {item.subtext && <span className="text-[11px] text-[#999] truncate mt-0.5">{item.subtext}</span>}
                                                            </div>
                                                            {isActive && <span className="ml-auto text-[10px] text-[#C2185B]/60 font-medium bg-[#C2185B]/10 px-1.5 py-0.5 rounded">Current</span>}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer hint */}
                            <div className="px-5 py-2.5 border-t border-[rgba(0,0,0,0.06)] flex items-center gap-4 text-[10px] text-[#999]">
                                <span className="flex items-center gap-1"><kbd className="bg-[#F4F0F8] px-1 py-0.5 rounded font-mono-data">↑↓</kbd> Navigate</span>
                                <span className="flex items-center gap-1"><kbd className="bg-[#F4F0F8] px-1 py-0.5 rounded font-mono-data">↵</kbd> Open</span>
                                <span className="flex items-center gap-1"><kbd className="bg-[#F4F0F8] px-1 py-0.5 rounded font-mono-data">Esc</kbd> Close</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ─── Notification Drawer ─── */}
            <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
    );
}

/* Sidebar bottom action item */
function NavItem({ icon: Icon, label, textCls, collapsed, onClick, href, hoverColor = "hover:text-white", pathname }) {
    const isActive = pathname && href && (pathname === href || pathname.startsWith(href + "/"));
    const cls = `flex items-center rounded-lg overflow-hidden transition-colors duration-150 w-full relative ${isActive
        ? "bg-[#C2185B]/12 text-white"
        : `text-white/40 ${hoverColor} hover:bg-white/5`
        }`;

    const inner = (
        <>
            {isActive && <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#C2185B]" />}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Icon size={20} />
            </div>
            <span className={`${textCls} text-sm`}>{label}</span>
        </>
    );

    if (href) return <Link href={href} title={collapsed ? label : undefined} className={cls}>{inner}</Link>;
    return <button onClick={onClick} title={collapsed ? label : undefined} className={cls}>{inner}</button>;
}
