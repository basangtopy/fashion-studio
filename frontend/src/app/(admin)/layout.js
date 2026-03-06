"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
} from "lucide-react";
import { BRANDING } from "@/config/branding";
import NotificationDrawer, { NotificationBellButton } from "@/components/admin/NotificationDrawer";
import useSSE from "@/hooks/useSSE";
import { Separator } from "@/components/ui/separator";

const EXPANDED_W = 240;
const COLLAPSED_W = 64;

const SIDEBAR_SECTIONS = [
    {
        label: "Main",
        items: [
            { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
            { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
            { href: "/admin/clients", label: "Clients", icon: Users },
            { href: "/admin/chat", label: "Chat", icon: MessageSquare },
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
            { href: "/admin/finance", label: "Finance", icon: BarChart3 },
        ],
    },
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

    // "More" sheet items — everything not in the primary bottom 5
    const moreItems = [
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
                    transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                {/* Brand */}
                <div className="h-14 flex items-center px-3 shrink-0 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-[#C2185B] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        F
                    </div>
                    <span className={`${textCls} ml-2 text-sm font-bold text-white tracking-tight`}>
                        {BRANDING.businessName}
                    </span>
                </div>
                <Separator className="bg-white/8 shrink-0" />

                {/* User */}
                <div className="px-3 py-3 shrink-0 overflow-hidden">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                            {(user?.avatarUrl || user?.profilePicture) ? (
                                <img src={user.avatarUrl || user.profilePicture} alt="" className="w-full h-full object-cover" />
                            ) : (
                                user?.fullName?.charAt(0) || "A"
                            )}
                        </div>
                        <div className={`${textCls} ml-2 min-w-0`}>
                            <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                            <p className="text-[10px] text-white/40 truncate">
                                {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Staff Admin"}
                            </p>
                        </div>
                    </div>
                </div>
                <Separator className="bg-white/8 shrink-0" />

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {SIDEBAR_SECTIONS.map((section) => {
                        if (section.superAdminOnly && !isSuperAdmin) return null;
                        return (
                            <div key={section.label} className="mb-3">
                                <div
                                    className="overflow-hidden transition-all duration-200"
                                    style={{ height: collapsed ? 0 : 20, opacity: collapsed ? 0 : 1 }}
                                >
                                    <p className="px-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider whitespace-nowrap leading-[20px]">
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
                                                className={`flex items-center rounded-lg overflow-hidden transition-colors duration-150 ${isActive
                                                    ? "bg-[#C2185B] text-white"
                                                    : "text-white/50 hover:text-white hover:bg-white/5"
                                                    }`}
                                            >
                                                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                                                    <item.icon size={18} />
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

                {/* Bottom actions */}
                <Separator className="bg-white/8 shrink-0" />
                <div className="px-2 py-2 space-y-0.5 shrink-0">
                    {isSuperAdmin && (
                        <NavItem href="/admin/settings" icon={Settings} label="Settings" textCls={textCls} collapsed={collapsed} />
                    )}
                    <NavItem
                        icon={collapsed ? PanelLeft : PanelLeftClose}
                        label="Collapse"
                        textCls={textCls}
                        collapsed={collapsed}
                        onClick={() => setCollapsed(!collapsed)}
                    />
                    <NavItem
                        icon={LogOut}
                        label="Logout"
                        textCls={textCls}
                        collapsed={collapsed}
                        hoverColor="hover:text-[#C62828]"
                        onClick={logout}
                    />
                </div>
            </aside>

            {/* ─── Main area ─── */}
            <div
                className="flex-1 flex flex-col min-h-screen lg:ml-[var(--admin-sw)]"
                style={{
                    "--admin-sw": `${collapsed ? COLLAPSED_W : EXPANDED_W}px`,
                    transition: "margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
            >
                {/* ─── Top bar (visible on ALL screens) ─── */}
                <header className="flex items-center justify-between h-14 px-4 sm:px-6 bg-white border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-40">
                    {/* Left: breadcrumb on desktop, brand on mobile */}
                    <div className="flex items-center gap-3">
                        <div className="lg:hidden w-8 h-8 rounded-lg bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                            F
                        </div>
                        <h2 className="text-sm font-semibold text-[#0D0D0D] capitalize hidden sm:block">
                            {breadcrumb}
                        </h2>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                        <Link href="/" className="hidden sm:flex text-xs text-[#999] hover:text-[#C2185B] transition-colors font-medium items-center gap-1">
                            <ExternalLink size={12} /> View Site
                        </Link>
                        <NotificationBellButton onClick={() => setNotifOpen(true)} />
                    </div>
                </header>

                <main className="flex-1">
                    <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">{children}</div>
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
                            className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[48px] ${isActive ? "text-[#C2185B]" : "text-[#999]"}`}
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

            {/* ─── Notification Drawer ─── */}
            <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        </div>
    );
}

/* Bottom sidebar item */
function NavItem({ icon: Icon, label, textCls, collapsed, onClick, href, hoverColor = "hover:text-white" }) {
    const cls = `flex items-center rounded-lg overflow-hidden text-white/40 ${hoverColor} hover:bg-white/5 transition-colors duration-150 w-full`;

    const inner = (
        <>
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <Icon size={18} />
            </div>
            <span className={`${textCls} text-sm`}>{label}</span>
        </>
    );

    if (href) return <Link href={href} title={collapsed ? label : undefined} className={cls}>{inner}</Link>;
    return <button onClick={onClick} title={collapsed ? label : undefined} className={cls}>{inner}</button>;
}
