"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    LayoutDashboard,
    ShoppingBag,
    Ruler,
    CalendarDays,
    CreditCard,
    User,
    LogOut,
    X,
    ExternalLink,
    MoreHorizontal,
    ShoppingCart,
} from "lucide-react";
import CartDrawer from "@/components/layout/CartDrawer";
import NotificationDrawer, { NotificationBellButton } from "@/components/shared/NotificationDrawer";
import useSSE from "@/hooks/useSSE";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

/* ─── Sidebar links (blueprint Section 4) ─── */
const SIDEBAR_LINKS = [
    { href: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/client/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/client/measurements", label: "Measurements", icon: Ruler },
    { href: "/client/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/client/payments", label: "Payments", icon: CreditCard },
    { href: "/client/profile", label: "Profile", icon: User },
];

/* ─── Mobile bottom nav (4 primary + More = 5 icons total, per blueprint) ─── */
const MOBILE_NAV = [
    { href: "/client/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/client/orders", label: "Orders", icon: ShoppingBag },
    { href: "/client/measurements", label: "Measures", icon: Ruler },
    { href: "/client/appointments", label: "Appts", icon: CalendarDays },
];

/* ─── "More" bottom sheet — full sidebar menu ─── */
const MORE_ITEMS = [
    { href: "/client/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/client/orders", label: "My Orders", icon: ShoppingBag },
    { href: "/client/measurements", label: "Measurements", icon: Ruler },
    { href: "/client/appointments", label: "Appointments", icon: CalendarDays },
    { href: "/client/payments", label: "Payments", icon: CreditCard },
    { href: "/client/profile", label: "Profile", icon: User },
];

/* ─── Page titles from path ─── */
const PAGE_TITLES = {
    "/client/dashboard": "Dashboard",
    "/client/orders": "My Orders",
    "/client/measurements": "Measurements",
    "/client/appointments": "Appointments",
    "/client/payments": "Payments",
    "/client/profile": "Profile",
    "/client/checkout": "Checkout",
    "/client/orders/new": "New Order",
};

function getPageTitle(pathname) {
    if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
    if (pathname.startsWith("/client/orders/")) return "Order Details";
    return "Dashboard";
}

export default function ClientLayout({ children }) {
    const pathname = usePathname();
    const { isAuthenticated, loading, user, logout, isClient, isAdmin } = useAuth();
    const { itemCount, openCart } = useCart();
    const router = useRouter();
    const [notifOpen, setNotifOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);

    // Establish SSE connection for live updates
    useSSE();

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                router.replace("/login");
            } else if (isAdmin) {
                router.replace("/admin/dashboard");
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

    if (!isAuthenticated || isAdmin) return null;

    const pageTitle = getPageTitle(pathname);

    return (
        <>
            <CartDrawer />

            <div className="flex min-h-screen bg-[#FAFAFA]">
                {/* ─── Desktop Sidebar (fixed left, 240px, Secondary bg) ─── */}
                <aside className="hidden lg:flex flex-col w-[240px] bg-[#1A1A2E] fixed top-0 bottom-0 left-0 z-50">
                    {/* Brand */}
                    <div className="h-14 flex items-center px-5 shrink-0">
                        <Link href="/" className="flex items-center gap-2 text-white">
                            <div className="w-8 h-8 rounded-lg bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs">
                                F
                            </div>
                            <span className="text-sm font-bold tracking-tight">Fashion Studio</span>
                        </Link>
                    </div>
                    <Separator className="bg-white/8 shrink-0" />

                    {/* Navigation */}
                    <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                        {SIDEBAR_LINKS.map((link) => {
                            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
                                        ? "bg-[#C2185B]/10 text-white border-l-[3px] border-[#C2185B] pl-[9px]"
                                        : "text-white/50 hover:text-white hover:bg-white/5"
                                        }`}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Bottom: user info + logout */}
                    <Separator className="bg-white/8 shrink-0" />
                    <div className="px-3 py-4 space-y-3">
                        {/* User info */}
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-9 h-9 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                                {(user?.avatarUrl || user?.profilePicture) ? (
                                    <img src={user.avatarUrl || user.profilePicture} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    user?.fullName?.charAt(0) || "U"
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
                                <p className="text-[10px] text-white/40 truncate">Client</p>
                            </div>
                        </div>
                        {/* Logout */}
                        <Button
                            variant="ghost"
                            onClick={logout}
                            className="flex items-center justify-start gap-3 px-3 py-2 w-full text-sm text-white/40 hover:text-[#C62828] hover:bg-white/5"
                        >
                            <LogOut size={18} />
                            Logout
                        </Button>
                    </div>
                </aside>

                {/* ─── Main content area ─── */}
                <div className="flex-1 w-full max-w-full min-w-0 flex flex-col min-h-screen lg:ml-[240px]">
                    {/* Top bar */}
                    <header className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8 bg-white border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-40">
                        {/* Left: page title */}
                        <div className="flex items-center gap-3">
                            {/* Mobile brand mark */}
                            <div className="lg:hidden w-8 h-8 rounded-lg bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                                F
                            </div>
                            <h1 className="text-sm font-semibold text-[#0D0D0D]">{pageTitle}</h1>
                        </div>

                        {/* Right: cart + notifications + avatar */}
                        <div className="flex items-center gap-2">
                            {/* View Site (desktop) */}
                            <Link
                                href="/"
                                className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-[#555] hover:bg-[#F4F0F8] transition-colors"
                            >
                                <ExternalLink size={14} /> View Site
                            </Link>
                            {/* Cart icon */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={openCart}
                                className="relative w-9 h-9 bg-[#F4F0F8] text-[#555] hover:bg-[#E8E4EC]"
                            >
                                <ShoppingCart size={16} />
                                {itemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#C2185B] text-white text-[10px] font-bold flex items-center justify-center">
                                        {itemCount > 9 ? "9+" : itemCount}
                                    </span>
                                )}
                            </Button>

                            {/* Notification bell */}
                            <NotificationBellButton onClick={() => setNotifOpen(true)} />

                            {/* User avatar */}
                            <Link
                                href="/client/profile"
                                className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F4F0F8] transition-colors"
                            >
                                <div className="w-7 h-7 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-[10px] overflow-hidden">
                                    {(user?.avatarUrl || user?.profilePicture) ? (
                                        <img src={user.avatarUrl || user.profilePicture} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        user?.fullName?.charAt(0) || "U"
                                    )}
                                </div>
                                <span className="text-xs font-medium text-[#555] max-w-[100px] truncate">{user?.fullName?.split(" ")[0]}</span>
                            </Link>
                        </div>
                    </header>

                    {/* Page content */}
                    <main className="flex-1 w-full max-w-full min-w-0 flex flex-col">
                        <div className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 w-full min-w-0">{children}</div>
                    </main>
                </div>

                {/* ─── Mobile Bottom Nav ─── */}
                <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[rgba(0,0,0,0.06)] flex items-center justify-around h-16 px-1">
                    {MOBILE_NAV.map((link) => {
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
                    <Button
                        variant="ghost"
                        onClick={() => setMoreOpen(true)}
                        className={`flex flex-col items-center justify-center h-auto gap-0.5 py-1 px-2 min-w-[48px] rounded-none hover:bg-transparent ${moreOpen ? "text-[#C2185B]" : "text-[#999] hover:text-[#999]"}`}
                    >
                        <MoreHorizontal size={20} />
                        <span className="text-[10px] font-medium mt-1">More</span>
                    </Button>
                </nav>

                {/* ─── More Bottom Sheet (Mobile) ─── */}
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
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setMoreOpen(false)}
                                        className="w-8 h-8 text-[#999] hover:bg-[#F4F0F8]"
                                    >
                                        <X size={16} />
                                    </Button>
                                </div>
                                <div className="px-3 pb-6 grid grid-cols-3 gap-2">
                                    {MORE_ITEMS.map((item) => {
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
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setMoreOpen(false); logout(); }}
                                        className="h-auto flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl text-[#C62828] hover:bg-[#FFEBEE] hover:text-[#C62828]"
                                    >
                                        <LogOut size={20} />
                                        <span className="text-[11px] font-medium text-center leading-tight">Logout</span>
                                    </Button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            {/* ─── Notification Drawer ─── */}
            <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
        </>
    );
}
