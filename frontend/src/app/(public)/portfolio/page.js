
import { serverFetch } from "@/lib/serverApi";
import PortfolioContent from "./PortfolioContent";

export default async function PortfolioPage() {
    const [portfolioData, categoriesData] = await Promise.all([
        serverFetch("/portfolio", { limit: 100 }, { next: { revalidate: 3600 } }),
        serverFetch("/portfolio/categories", {}, { next: { revalidate: 86400 } }),
    ]);

    return (
        <PortfolioContent
            initialEntries={portfolioData?.entries ?? []}
            initialCategories={categoriesData?.categories ?? []}
        />
    );
}