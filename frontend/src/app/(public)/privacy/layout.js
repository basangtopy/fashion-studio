import { BRANDING } from "@/config/branding";

export const metadata = {
    title: "Privacy Policy",
    description: `Read the ${BRANDING.businessName} Privacy Policy. Learn how we collect, use, and protect your personal information.`,
    openGraph: {
        title: `Privacy Policy | ${BRANDING.businessName}`,
        description: `How ${BRANDING.businessName} handles your personal data and privacy.`,
    },
};

export default function PrivacyLayout({ children }) {
    return children;
}