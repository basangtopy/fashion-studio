// frontend/src/app/(public)/catalog/ready-to-wear/[id]/page.js
// No "use client" — server component
import { serverFetch } from "@/lib/serverApi";
import { BRANDING, formatCurrency } from "@/config/branding";
import RTWDetailPage from "./RTWDetailContent";

export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const data = await serverFetch(
        `/ready-to-wear/${resolvedParams.id}`,
        {},
        { next: { revalidate: 1800 } }
    );
    const item = data?.item;

    if (!item) {
        return { title: "Item Not Found" };
    }

    return {
        title: item.name,
        description:
            item.description ||
            `${item.name} — ${item.category} available at ${BRANDING.businessName}. ${formatCurrency(item.price)}.`,
        openGraph: {
            title: `${item.name} | ${BRANDING.businessName}`,
            description: item.description || `${item.category} — ${formatCurrency(item.price)}`,
            images: item.images?.[0]
                ? [{ url: item.images[0], width: 800, height: 1000, alt: item.name }]
                : [],
        },
    };
}

export default async function RTWItemPage({ params }) {
    const resolvedParams = await params;
    const data = await serverFetch(
        `/ready-to-wear/${resolvedParams.id}`,
        {},
        { next: { revalidate: 1800 } }
    );

    const item = data?.item;

    // JSON-LD Product schema — enables Google rich results (price, availability, image)
    const jsonLd = item ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.name,
        description: item.description || `${item.category} available at ${BRANDING.businessName}`,
        image: item.images || [],
        brand: { "@type": "Brand", name: BRANDING.businessName },
        offers: {
            "@type": "Offer",
            price: Number(item.price),
            priceCurrency: "NGN",
            availability:
                item.stockStatus === "OUT_OF_STOCK"
                    ? "https://schema.org/OutOfStock"
                    : "https://schema.org/InStock",
            seller: { "@type": "Organization", name: BRANDING.businessName },
        },
    } : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <RTWDetailPage initialItem={item ?? null} />
        </>
    );
}