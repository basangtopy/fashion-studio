
import { serverFetch } from "@/lib/serverApi";
import { BRANDING } from "@/config/branding";
import StyleDetailPage from "./StyleDetailContent";

// generateMetadata runs on the server before the page renders.
// It gives Google the style name, description, and image in the <head>.
export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    
    const data = await serverFetch(
        `/styles/${resolvedParams.id}`,
        {},
        { next: { revalidate: 3600 } }
    );
    const style = data?.style;

    if (!style) {
        return { title: "Style Not Found" };
    }

    return {
        title: style.name,
        description:
            style.description ||
            `${style.name} — a ${style.category} style available at ${BRANDING.businessName}.`,
        openGraph: {
            title: `${style.name} | ${BRANDING.businessName}`,
            description:
                style.description ||
                `Bespoke ${style.category} style crafted in Nigeria.`,
            images: style.images?.[0]
                ? [{ url: style.images[0], width: 800, height: 1000, alt: style.name }]
                : [],
        },
    };
}

export default async function StylePage({ params }) {
    const resolvedParams = await params;
    const data = await serverFetch(
        `/styles/${resolvedParams.id}`,
        {},
        { next: { revalidate: 3600 } }
    );

    return <StyleDetailPage initialStyle={data?.style ?? null} />;
}