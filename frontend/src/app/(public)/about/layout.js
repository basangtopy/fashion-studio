import { BRANDING } from "@/config/branding";

export const metadata = {
    title: "About Us",
    description:
        `${BRANDING.businessName} is a Nigeria-based bespoke tailoring studio. Learn our story, values, and the craftsmanship behind every garment we create.`,
    openGraph: {
        title: `About ${BRANDING.businessName} | Bespoke Tailoring Studio`,
        description:
            `Born in Nigeria, built on precision. Discover the studio, the story, and the people behind every stitch.`,
    },
};

export default function TermsLayout({ children }) {
    return children;
}