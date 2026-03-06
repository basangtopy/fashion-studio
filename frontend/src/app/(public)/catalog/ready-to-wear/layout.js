import { BRANDING } from "@/config/branding";

export const metadata = {
    title: "Ready-to-Wear",
    description: `Shop our ready-to-wear collection at ${BRANDING.businessName}. Beautifully crafted garments, ready for you — no wait required.`,
    openGraph: {
        title: `Ready-to-Wear | ${BRANDING.businessName}`,
        description: "Browse our ready-to-wear fashion collection with sizes available for immediate purchase.",
    },
};

export default function CatalogRTWLayout({ children }) {
    return children;
}
