/**
 * Brand Configuration — Central source of truth for all brand values.
 * Update here when branding is finalized — changes propagate throughout the app.
 */

export const BRANDING = {
    businessName: "Deshé Fashion",
    tagline: "Designed for you. Crafted in Nigeria. Made to last.",
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
        facebook: "https://facebook.com/yourstudio",
        twitter: "https://twitter.com/yourstudio",
        tiktok: "https://tiktok.com/yourstudio",
        whatsapp: "https://wa.me/yournumber",
    },

    address: "Abeokuta, Ogun State, Nigeria",

    currency: {
        symbol: "₦",
        code: "NGN",
        locale: "en-NG",
    },

    // ── About Page Content ─────────────────────────────────────────────────────
    founderName: "The Founder",
    mission:
        "To craft garments that honour individuality — where every stitch carries intention, every silhouette tells a story, and every client leaves feeling seen.",
    vision:
        "To become West Africa's most trusted name in bespoke fashion, setting the standard for precision, creativity, and client satisfaction.",

    aboutHeroQuote:
        "We don't just make clothes. We craft confidence, one stitch at a time.",

    values: [
        {
            title: "Precision",
            description:
                "Every measurement is taken twice. Every seam is inspected. We believe that true luxury lives in the details — the ones you see, and the ones you feel.",
        },
        {
            title: "Identity",
            description:
                "Your clothes should speak before you do. We design garments that amplify who you are — your culture, your confidence, your individuality — never someone else's template.",
        },
        {
            title: "Collaboration",
            description:
                "A great garment is a conversation, not a monologue. We listen, sketch, refine, and iterate — together with you — until every detail is exactly right.",
        },
    ],

    businessModels: [
        {
            title: "You Bring the Fabric",
            shortDescription:
                "Have a special fabric? Bring it to us and choose from our curated styles or describe your dream outfit. We'll bring your vision to life.",
            detailedDescription:
                "Perhaps you've found the perfect Ankara print at the market, inherited a cherished fabric from a loved one, or brought back a unique textile from your travels. This is where your story begins. You bring the fabric that means something to you, and we transform it into a garment that honours its origin. Browse our curated style catalog for inspiration, or describe your dream design from scratch — either way, we handle everything from precise measurements and pattern drafting to expert cutting, sewing, and finishing. You stay in the loop at every stage, with photo updates and fittings until the final piece is exactly what you envisioned.",
            link: "/catalog/styles",
            cta: "Browse Styles",
        },
        {
            title: "We Source It for You",
            shortDescription:
                "Don't have fabric? No problem. Tell us what you want, and we'll source the perfect fabric and create your garment from start to finish.",
            detailedDescription:
                "Not everyone has the time — or the desire — to hunt for the right fabric. Tell us the occasion, your style preferences, and your budget, and we'll curate a selection of premium fabrics for your approval. Once you pick your favourite, we take it from there: design consultation, measurements, tailoring, and quality checks — a complete end-to-end experience. This model is ideal for busy professionals, event-driven orders, or anyone who wants the luxury of a fully managed process. You make the decisions; we handle the legwork.",
            link: "/catalog/styles",
            cta: "Find your design",
        },
        {
            title: "Ready to Wear",
            shortDescription:
                "Browse our collection of beautifully crafted, ready-made garments. Find your size, purchase, and step out in style — no wait required.",
            detailedDescription:
                "For those moments when you need something stunning and you need it now. Our Ready-to-Wear collection features handcrafted pieces designed in-house and produced in limited runs — so you get the quality of bespoke without the wait. Each item is available in multiple sizes, and because they're made with the same care as our custom orders, the fit and finish are anything but off-the-rack. Browse online, add to cart, and have your piece delivered — or pick it up at the studio. Perfect for gifting or treating yourself on short notice.",
            link: "/catalog/ready-to-wear",
            cta: "Shop Ready to Wear",
        },
    ],

    processSteps: [
        {
            title: "Consultation",
            description:
                "We sit down — in person or virtually — to understand your vision, occasion, style preferences, and budget.",
        },
        {
            title: "Measurement",
            description:
                "Our team takes precise body measurements, stored securely in your profile for future orders.",
        },
        {
            title: "Design & Approval",
            description:
                "We draft the design, select materials, and present options for your review before a single cut is made.",
        },
        {
            title: "Crafting",
            description:
                "Your garment moves through cutting, sewing, and finishing — with quality checks at every stage.",
        },
        {
            title: "Fitting & Delivery",
            description:
                "A final fitting ensures perfection. We make any last adjustments, then deliver your finished piece.",
        },
    ],

    stats: [
        { value: 500, suffix: "+", label: "Garments Crafted" },
        { value: 300, suffix: "+", label: "Happy Clients" },
        { value: 50, suffix: "+", label: "Styles in Catalog" },
        { value: 2, suffix: "", label: "Years of Craft" },
    ],

    manifestoLines: [
        "For the woman who demands precision.",
        "For the celebration that deserves more than ordinary.",
        "For the culture that runs through every thread.",
        "For you — because you deserve clothes that feel like they were made just for you.",
        "Because they were.",
    ],

    // ── Payment Information (manual bank transfer) ────────────────────────────
    // Replace these with actual details when branding is finalised.
    paymentInfo: {
        bankName: "Access Bank",
        accountName: "Fashion Studio",
        accountNumber: "0000000000",
        instructions: [
            "Copy the account details above and log in to your mobile banking app or visit any Access Bank branch.",
            "Transfer the exact total amount shown on your order. Include your order number (e.g. ORD-2026-0001) in the transfer narration/description.",
            "Take a screenshot or save your transaction receipt — you will need to upload it as proof of payment.",
            "Go to your order detail page and use the chat to send your payment proof to us. We will confirm within a few hours.",
            "Once confirmed, your order will move to production. We will keep you updated every step of the way.",
        ],
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
