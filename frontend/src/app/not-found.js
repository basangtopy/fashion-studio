
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
        404
      </p>
      <h1 className="text-3xl font-bold text-foreground mb-2">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}