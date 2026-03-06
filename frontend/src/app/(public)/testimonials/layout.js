import { BRANDING } from "@/config/branding";

export const metadata = {
    title: "Testimonials",
    description: `Read what our clients say about ${BRANDING.businessName}. Real reviews from real people who love our work.`,
    openGraph: {
        title: `Testimonials | ${BRANDING.businessName}`,
        description: "Client reviews and testimonials — genuine feedback from our satisfied customers.",
    },
};

export default function TestimonialsLayout({ children }) {
    return children;
}
