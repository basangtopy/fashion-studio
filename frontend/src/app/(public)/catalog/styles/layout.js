import { BRANDING } from "@/config/branding";

export const metadata = {
    title: "Our Styles",
    description: `Explore our curated collection of fashion styles at ${BRANDING.businessName}. From Ankara to corporate wear, find your perfect look.`,
    openGraph: {
        title: `Styles | ${BRANDING.businessName}`,
        description: "Browse our fashion style catalog — curated designs for every occasion.",
    },
};

export default function CatalogStylesLayout({ children }) {
    return children;
}
