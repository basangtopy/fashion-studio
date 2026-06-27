import { BRANDING } from "@/config/branding";

export const metadata = {
    title: "Terms of Service",
    description: `Read the ${BRANDING.businessName} Terms of Service. Understand your rights and responsibilities when using our platform.`,
    openGraph: {
        title: `Terms of Service | ${BRANDING.businessName}`,
        description: `Terms and conditions for using ${BRANDING.businessName}'s services.`,
    },
};

export default function TermsLayout({ children }) {
    return children;
}