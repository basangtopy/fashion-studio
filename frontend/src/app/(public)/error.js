"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
        Something went wrong
      </p>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        An unexpected error occurred
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        We couldn&apos;t load this page. Please try again or go back home.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-lg border border-input text-muted-foreground text-sm font-semibold hover:bg-muted transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}