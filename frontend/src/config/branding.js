/**
 * Brand Configuration — Central source of truth for all brand values.
 * Update here when branding is finalized — changes propagate throughout the app.
 */

export const BRANDING = {
    businessName: "Fashion Studio",
    tagline: "Designed for you. Crafted in Lagos. Made to last.",
    establishedYear: "2024",

    colors: {
        primary: "#C2185B",
        primaryHover: "#A01548",
        primaryLight: "rgba(194, 24, 91, 0.1)",
        secondary: "#1A1A2E",
        secondaryLight: "#2A2A40",
        accent: "#F8E8F0",
        surface1: "#FFFFFF",
        surface2: "#FAFAFA",
        surface3: "#F4F0F8",
        textDark: "#0D0D0D",
        textMid: "#555555",
        textLight: "#999999",
        success: "#2E7D32",
        warning: "#E65100",
        error: "#C62828",
        info: "#1565C0",
    },

    logoUrl: "/assets/logo-placeholder.svg",
    faviconUrl: "/assets/favicon-placeholder.ico",
    heroImageUrl: "/assets/hero-placeholder.jpg",

    contact: {
        email: "hello@yourstudio.com",
        phone: "+234 000 000 0000",
        whatsapp: "+234 000 000 0000",
    },

    socials: {
        instagram: "https://instagram.com/yourstudio",
    },

    address: "Lagos, Nigeria",

    currency: {
        symbol: "₦",
        code: "NGN",
        locale: "en-NG",
    },
};

/**
 * Order status display configuration
 * Maps backend enum values to display labels and CSS classes
 */
export const ORDER_STATUS = {
    PENDING_REVIEW: {
        label: "Pending Review",
        className: "status-pending-review",
        bg: "#FFF8E1",
        text: "#F9A825",
        step: 0,
    },
    AWAITING_CLIENT_RESPONSE: {
        label: "Awaiting Response",
        className: "status-awaiting-client-response",
        bg: "#E3F2FD",
        text: "#1565C0",
        step: 1,
    },
    AGREED_AWAITING_PAYMENT: {
        label: "Awaiting Payment",
        className: "status-agreed-awaiting-payment",
        bg: "#E8F5E9",
        text: "#2E7D32",
        step: 2,
    },
    IN_PROGRESS: {
        label: "In Progress",
        className: "status-in-progress",
        bg: "#F3E5F5",
        text: "#6A1B9A",
        step: 3,
    },
    CUTTING: {
        label: "Cutting",
        className: "status-cutting",
        bg: "#EDE7F6",
        text: "#4527A0",
        step: 4,
    },
    SEWING: {
        label: "Sewing",
        className: "status-sewing",
        bg: "#E8EAF6",
        text: "#283593",
        step: 5,
    },
    FINISHING: {
        label: "Finishing & QC",
        className: "status-finishing",
        bg: "#E0F7FA",
        text: "#00695C",
        step: 6,
    },
    AWAITING_FINAL_PAYMENT: {
        label: "Awaiting Final Payment",
        className: "status-awaiting-final-payment",
        bg: "#FFF3E0",
        text: "#E65100",
        step: 7,
    },
    READY_FOR_PICKUP: {
        label: "Ready for Pickup",
        className: "status-ready-for-pickup",
        bg: "#F9FBE7",
        text: "#558B2F",
        step: 8,
    },
    OUT_FOR_DELIVERY: {
        label: "Out for Delivery",
        className: "status-out-for-delivery",
        bg: "#E8F5E9",
        text: "#1B5E20",
        step: 8,
    },
    COMPLETED: {
        label: "Completed",
        className: "status-completed",
        bg: "#1A1A2E",
        text: "#FFFFFF",
        step: 9,
    },
    CANCELLED: {
        label: "Cancelled",
        className: "status-cancelled",
        bg: "#FFEBEE",
        text: "#B71C1C",
        step: -1,
    },
};

/**
 * Order type display labels
 */
export const ORDER_TYPES = {
    MODEL_1: { label: "Client Brings Fabric", short: "Model 1" },
    MODEL_2: { label: "Designer Sources Fabric", short: "Model 2" },
    MODEL_3: { label: "Ready-to-Wear", short: "Ready-to-Wear" },
};

/**
 * Payment status display
 */
export const PAYMENT_STATUS = {
    PENDING: { label: "Pending", bg: "#FFF8E1", text: "#F9A825" },
    CONFIRMED: { label: "Confirmed", bg: "#E8F5E9", text: "#2E7D32" },
    REJECTED: { label: "Rejected", bg: "#FFEBEE", text: "#B71C1C" },
};

/**
 * Format currency with Naira symbol
 */
export function formatCurrency(amount) {
    if (amount == null) return "—";
    return `₦${Number(amount).toLocaleString("en-NG")}`;
}

/**
 * Time-aware greeting
 */
export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
}
