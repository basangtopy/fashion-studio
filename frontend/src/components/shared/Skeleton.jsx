export function SkeletonCard({ className = "" }) {
    return (
        <div className={`rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden ${className}`}>
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
        <div className={`p-6 rounded-xl border border-[rgba(0,0,0,0.06)] space-y-3 ${className}`}>
            <div className="skeleton h-3 w-20" />
            <div className="skeleton h-8 w-28" />
            <div className="skeleton h-3 w-16" />
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
    return (
        <div className="rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
            <div className="p-4 border-b border-[rgba(0,0,0,0.06)] flex gap-4">
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
