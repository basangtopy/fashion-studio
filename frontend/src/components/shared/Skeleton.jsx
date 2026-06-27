export function SkeletonCard({ className = "" }) {
    return (
        <div className={`rounded-xl border border-border overflow-hidden ${className}`}>
            <div className="skeleton h-48 w-full" />
            <div className="p-4 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
            </div>
        </div>
    );
}

export function SkeletonLine({ width = "100%", height = "16px", className = "" }) {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height }}
        />
    );
}

export function SkeletonStat({ className = "" }) {
    return (
        <div className={`p-6 rounded-xl border border-border space-y-3 ${className}`}>
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-8 w-28" />
            <div className="skeleton h-3 w-16" />
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border flex gap-4">
                {Array.from({ length: cols }).map((_, i) => (
                    <div key={i} className="skeleton h-4 flex-1" />
                ))}
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div
                    key={i}
                    className="p-4 border-b border-[rgba(0,0,0,0.03)] flex gap-4"
                >
                    {Array.from({ length: cols }).map((_, j) => (
                        <div key={j} className="skeleton h-4 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

/* ─────────────────────────────────────────────
   Style Detail Skeleton
   Mirrors: /catalog/styles/[id]/page.js
   Layout:  breadcrumb + 2-col grid (image | details)
───────────────────────────────────────────── */
export function StyleDetailSkeleton() {
    return (
        <div className="pt-[var(--nav-height)]">
            <div className="page-container py-8 lg:py-12">
                {/* Breadcrumb */}
                <div className="skeleton h-3.5 w-28 mb-6 rounded" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* ── Left: Image Gallery ── */}
                    <div>
                        {/* Main image — aspect-[4/5] matches the real page */}
                        <div className="skeleton aspect-[4/5] w-full rounded-xl mb-4" />
                        {/* Thumbnails row */}
                        <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="skeleton w-16 h-20 rounded-lg flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Details ── */}
                    <div className="space-y-0">
                        {/* Category label */}
                        <div className="skeleton h-3 w-20 rounded mb-3" />
                        {/* Style name */}
                        <div className="skeleton h-9 w-3/4 rounded mb-4" />
                        {/* Model availability pills */}
                        <div className="flex gap-2 mb-6">
                            <div className="skeleton h-6 w-36 rounded-full" />
                            <div className="skeleton h-6 w-40 rounded-full" />
                        </div>
                        {/* Description body — 4 lines of varying width */}
                        <div className="space-y-2 mb-8">
                            <div className="skeleton h-3.5 w-full rounded" />
                            <div className="skeleton h-3.5 w-full rounded" />
                            <div className="skeleton h-3.5 w-5/6 rounded" />
                            <div className="skeleton h-3.5 w-4/6 rounded" />
                        </div>
                        {/* CTA button */}
                        <div className="skeleton h-12 w-52 rounded-md" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Ready-to-Wear Detail Skeleton
   Mirrors: /catalog/ready-to-wear/[id]/page.js
   Layout:  breadcrumb + 2-col grid (image | details)
   Details col is richer: price, stock, sizes,
   qty stepper, dual action buttons, text sections
───────────────────────────────────────────── */
export function RTWDetailSkeleton() {
    return (
        <div className="pt-[var(--nav-height)]">
            <div className="page-container py-8 lg:py-12">
                {/* Breadcrumb */}
                <div className="skeleton h-3.5 w-40 mb-6 rounded" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* ── Left: Image Gallery ── */}
                    <div>
                        {/* Main image */}
                        <div className="skeleton aspect-[4/5] w-full rounded-xl mb-4" />
                        {/* Thumbnails row */}
                        <div className="flex gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="skeleton w-16 h-20 rounded-lg flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* ── Right: Details ── */}
                    <div>
                        {/* Category label */}
                        <div className="skeleton h-3 w-16 rounded mb-3" />
                        {/* Item name */}
                        <div className="skeleton h-9 w-2/3 rounded mb-3" />
                        {/* Price */}
                        <div className="skeleton h-7 w-28 rounded mb-3" />
                        {/* Stock status */}
                        <div className="skeleton h-3 w-20 rounded mb-6" />

                        {/* Size selector */}
                        <div className="mb-6">
                            <div className="skeleton h-3 w-24 rounded mb-3" />
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="skeleton h-9 w-14 rounded-md" />
                                ))}
                            </div>
                        </div>

                        {/* Quantity stepper */}
                        <div className="mb-8">
                            <div className="skeleton h-3 w-20 rounded mb-3" />
                            <div className="flex items-center gap-3">
                                <div className="skeleton h-10 w-10 rounded-md" />
                                <div className="skeleton h-6 w-8 rounded" />
                                <div className="skeleton h-10 w-10 rounded-md" />
                            </div>
                        </div>

                        {/* Action buttons — side by side, same as real page */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-8">
                            <div className="skeleton flex-1 h-12 rounded-md" />
                            <div className="skeleton flex-1 h-12 rounded-md" />
                        </div>

                        {/* Description section */}
                        <div className="mb-6">
                            <div className="skeleton h-3.5 w-24 rounded mb-3" />
                            <div className="space-y-2">
                                <div className="skeleton h-3.5 w-full rounded" />
                                <div className="skeleton h-3.5 w-full rounded" />
                                <div className="skeleton h-3.5 w-4/5 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
