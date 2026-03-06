import Navbar from "@/components/layout/Navbar";
import { BRANDING } from "@/config/branding";

export const metadata = {
    title: {
        template: `%s | ${BRANDING.businessName}`,
        default: `Sign In | ${BRANDING.businessName}`,
    },
};

export default function AuthLayout({ children }) {
    return (
        <>
            <Navbar />
            {children}
        </>
    );
}
