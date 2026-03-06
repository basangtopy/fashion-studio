import { BRANDING } from "@/config/branding";

export const metadata = {
    title: "Portfolio",
    description: `A glimpse into our craftsmanship at ${BRANDING.businessName}. See our latest work and completed projects.`,
    openGraph: {
        title: `Portfolio | ${BRANDING.businessName}`,
        description: "Explore our fashion portfolio — handcrafted pieces from our studio.",
    },
};

export default function PortfolioLayout({ children }) {
    return children;
}
