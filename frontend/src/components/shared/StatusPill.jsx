import { ORDER_STATUS, PAYMENT_STATUS } from "@/config/branding";
import { Badge } from "@/components/ui/badge";

// Generic fallback colors for statuses not in ORDER_STATUS or PAYMENT_STATUS
const GENERIC_STATUS = {
    APPROVED: { label: "Approved", bg: "#E8F5E9", text: "#2E7D32" },
    REJECTED: { label: "Rejected", bg: "#FFEBEE", text: "#B71C1C" },
    PENDING: { label: "Pending", bg: "#FFF8E1", text: "#F9A825" },
    CONFIRMED: { label: "Confirmed", bg: "#E8F5E9", text: "#2E7D32" },
    REQUESTED: { label: "Requested", bg: "#FFF3E0", text: "#E65100" },
    COMPLETED: { label: "Completed", bg: "#1A1A2E", text: "#FFFFFF" },
    CANCELLED: { label: "Cancelled", bg: "#FFEBEE", text: "#B71C1C" },
};

export default function StatusPill({ status, size = "default" }) {
    const config = ORDER_STATUS[status] || PAYMENT_STATUS[status] || GENERIC_STATUS[status];
    if (!config) {
        // Last resort — render the raw status as a neutral pill
        return (
            <Badge
                variant="outline"
                className={`font-semibold bg-muted text-muted-foreground border-transparent ${size === "small" ? "px-2 py-0 text-[10px]" : "px-3 py-0.5 text-xs"}`}
            >
                {status?.replace(/_/g, " ") || "Unknown"}
            </Badge>
        );
    }

    const sizeClasses =
        size === "small"
            ? "px-2 py-0 text-[10px]"
            : "px-3 py-0.5 text-xs";

    return (
        <Badge
            variant="outline"
            className={`font-semibold border-transparent ${sizeClasses}`}
            style={{ backgroundColor: config.bg, color: config.text }}
        >
            {config.label}
        </Badge>
    );
}
