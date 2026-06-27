import { serverFetch } from "@/lib/serverApi";
import { 
  HeroSection, 
  ProcessSection, 
  FeaturedStylesSection, 
  ReadyToWearSection, 
  PortfolioSection, 
  TestimonialsSection, 
  CTASection 
} from "./HomeClient";

export const metadata = {
    title: "Deshé Fashion | Bespoke Tailoring & Ready-to-Wear in Nigeria",
    description:
        "Deshé Fashion is a Lagos-based bespoke tailoring studio. Bring your fabric, have us source it, or shop our ready-to-wear collection.",
    openGraph: {
        title: "Deshé Fashion | Where Style Meets Craftsmanship",
        description: "Bespoke tailoring and ready-to-wear pieces crafted in Nigeria.",
        type: "website",
    },
};

// ============================================================
// HOMEPAGE
// ============================================================
export default async function HomePage() {
    // Fetch all data in parallel on the server.
    // Each call revalidates independently — styles every hour, testimonials every day.
    // If any call fails, the section falls back to client-side useQuery automatically.
    const [featuredStyles, featuredRTW, portfolioEntries, testimonials] = await Promise.all([
        serverFetch("/styles", { isFeatured: true, limit: 4 }, { next: { revalidate: 3600 } }),
        serverFetch("/ready-to-wear", { featured: "true", inStock: "true" }, { next: { revalidate: 1800 } }),
        serverFetch("/portfolio", { featured: "true" }, { next: { revalidate: 3600 } }),
        serverFetch("/testimonials", { limit: 3 }, { next: { revalidate: 86400 } }),
    ]);
    return (
        <>
            <HeroSection />
            <ProcessSection />
            <FeaturedStylesSection initialData={featuredStyles?.styles ?? featuredStyles?.items ?? []} />
            <ReadyToWearSection initialData={(featuredRTW?.items ?? featuredRTW?.readyToWear ?? [].slice(0, 10))} />
            <PortfolioSection initialData={portfolioEntries?.entries ?? []} />
            <TestimonialsSection initialData={testimonials?.testimonials ?? testimonials?.items ?? []} />
            <CTASection />
        </>
    );
}
