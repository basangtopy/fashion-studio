
import { serverFetch } from "@/lib/serverApi";
import TestimonialsContent from "./TestimonialsContent";

export default async function TestimonialsPage() {
    const [testimonials] = await Promise.all([
        serverFetch("/testimonials", { published: true }, { next: { revalidate: 86400 } }),
    ]);

    return (
        <TestimonialsContent
            initialData={testimonials}
        />
    );
}