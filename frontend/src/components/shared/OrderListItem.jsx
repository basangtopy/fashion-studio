import Link from "next/link";
import { motion } from "framer-motion";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { ArrowRight, MessageSquare } from "lucide-react";

/* ─── Progress step definitions ─── */
const LIFECYCLE_STEPS = [
    { label: "Review", maxStep: 0 },
    { label: "Agreement", maxStep: 1 },
    { label: "Payment", maxStep: 2 },
    { label: "Production", maxStep: 6 },
    { label: "Delivery", maxStep: 8 },
    { label: "Complete", maxStep: 9 },
];

function getActiveStep(status) {
    const config = ORDER_STATUS[status];
    if (!config || config.step < 0) return -1;
    const step = config.step;
    for (let i = 0; i < LIFECYCLE_STEPS.length; i++) {
        if (step <= LIFECYCLE_STEPS[i].maxStep) return i;
    }
    return LIFECYCLE_STEPS.length - 1;
}

function CompactSteps({ status }) {
    const activeIdx = getActiveStep(status);
    const isCancelled = activeIdx < 0;

    return (
        <div className="flex items-center gap-1">
            {LIFECYCLE_STEPS.map((step, i) => {
                const isCompleted = !isCancelled && i < activeIdx;
                const isActive = !isCancelled && i === activeIdx;
                return (
                    <div key={step.label} className="flex items-center gap-1">
                        <div
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${isCompleted
                                ? "bg-[#2E7D32]"
                                : isActive
                                    ? "bg-[#C2185B]"
                                    : "bg-transparent border border-[#E0E0E0]"
                                }`}
                            title={step.label}
                        />
                        {i < LIFECYCLE_STEPS.length - 1 && (
                            <div className={`w-3 sm:w-4 h-[2px] transition-colors rounded-full ${isCompleted ? "bg-[#2E7D32]" : "bg-[#F4F0F8]"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const TYPE_PILL_COLORS = {
    MODEL_1: "bg-[#DCFCE7] text-[#15803D]",
    MODEL_2: "bg-[#E0F2FE] text-[#0369A1]",
    MODEL_3: "bg-[#FEF9C3] text-[#A16207]",
};

export default function OrderListItem({ order, variant = "list" }) {
    const typeConfig = ORDER_TYPES[order.orderType] || {};
    const computedTotalPaid = order.payments?.reduce((s, p) => s + Number(p.amount), 0) || 0;
    const agreedFee = Number(order.totalAgreedFee || order.agreedFee || 0);
    const outstanding = Math.max(0, agreedFee - computedTotalPaid);
    const unread = order.unreadMessages || 0;
    const typePillClass = TYPE_PILL_COLORS[order.orderType] || "bg-[#F4F0F8] text-[#555]";

    const orderName = order.style?.name
        || order.items?.[0]?.readyToWear?.name
        || typeConfig.label
        || "Order";

    const dateStr = new Date(order.createdAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
    });

    // Mobile / Card Layout Content (Matches user image exactly)
    const renderMobileContent = () => (
        <div className="flex flex-col h-full w-full min-w-0">
            <div className="flex items-center justify-between mb-1.5 min-w-0 gap-2">
                <span className="text-[13px] font-bold font-mono-data text-[#0D0D0D] tracking-wider truncate">{order.orderNumber}</span>
                {unread > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#C2185B] px-1.5 py-0.5 rounded shadow-sm">
                        <MessageSquare size={10} /> {unread}
                    </span>
                )}
            </div>

            <div className="mb-4">
                <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${typePillClass}`}>
                    {typeConfig.short || order.orderType}
                </span>
            </div>

            <div className="mb-4 min-w-0">
                <h3 className="text-[15px] font-bold text-[#0D0D0D] leading-tight mb-2 pr-4 break-words">{orderName}</h3>
                <div className="mb-2 w-max max-w-full"><StatusPill status={order.status} size="small" /></div>
                <div className="w-full overflow-x-auto no-scrollbar pb-1">
                    <CompactSteps status={order.status} />
                </div>
            </div>

            <div className="mt-auto pt-1 flex flex-col gap-0.5 min-w-0">
                <p className="text-[16px] font-bold font-mono-data text-[#0D0D0D] tracking-tight truncate">
                    {agreedFee > 0 ? formatCurrency(agreedFee) : "—"}
                </p>
                {outstanding > 0 && agreedFee > 0 && (
                    <p className="text-[11.5px] font-bold font-mono-data text-[#E65100] truncate">
                        {formatCurrency(outstanding)} outstanding
                    </p>
                )}
                <p className="text-[11px] font-medium text-[#757575] mt-1 truncate">{dateStr}</p>
            </div>
        </div>
    );

    // If variant is strictly 'card' (used in Dashboard), render mobile style only
    if (variant === "card") {
        return (
            <Link
                href={`/client/orders/${order.id}`}
                className="block h-full p-5 rounded-xl border border-[rgba(0,0,0,0.06)] hover:border-[rgba(194,24,91,0.3)] bg-white card-hover shadow-sm transition-all flex flex-col"
            >
                {renderMobileContent()}
            </Link>
        );
    }

    // List variant (My Orders page)
    return (
        <div className="group">
            {/* MOBILE LIST LAYOUT (< 640px) */}
            <div className="sm:hidden relative rounded-xl overflow-hidden bg-[#F8E8F0] border border-[rgba(0,0,0,0.06)]">
                {/* Background quick actions */}
                <div className="absolute inset-y-0 right-0 flex items-center justify-end px-6 gap-6 z-0 w-[50%]">
                    <Link href={`/client/orders/${order.id}?chat=true`} className="flex flex-col items-center text-[#C2185B]">
                        <MessageSquare size={20} />
                        <span className="text-[10px] font-medium mt-1">Chat</span>
                    </Link>
                </div>

                <motion.div
                    drag="x"
                    dragConstraints={{ left: -100, right: 0 }}
                    dragElastic={0.1}
                    className="relative z-10 bg-white p-5 rounded-xl border border-[rgba(0,0,0,0.06)] shadow-sm"
                >
                    <Link href={`/client/orders/${order.id}`} className="block h-full">
                        {renderMobileContent()}
                    </Link>
                </motion.div>
            </div>

            {/* DESKTOP LIST LAYOUT (>= 640px) */}
            <Link
                href={`/client/orders/${order.id}`}
                className="hidden sm:grid grid-cols-[160px_1fr_auto] gap-6 items-center p-5 sm:px-6 sm:py-5 rounded-xl border border-[rgba(0,0,0,0.06)] hover:border-[rgba(194,24,91,0.3)] bg-white card-hover shadow-sm transition-all overflow-hidden"
            >

                {/* Column 1: Order ID + Pill */}
                <div className="flex flex-col items-start gap-1.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold font-mono-data text-[#0D0D0D] tracking-wider">{order.orderNumber}</span>
                        {unread > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#C2185B] px-1.5 py-0.5 rounded shadow-sm">
                                <MessageSquare size={10} /> {unread}
                            </span>
                        )}
                    </div>
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${typePillClass}`}>
                        {typeConfig.short || order.orderType}
                    </span>
                </div>

                {/* Column 2: Name + Status + Stepper */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0 pr-4">
                    <h3 className="text-[15px] font-bold text-[#0D0D0D] w-full lg:w-auto shrink-0 leading-tight">
                        {orderName}
                    </h3>
                    <StatusPill status={order.status} size="small" />
                    <CompactSteps status={order.status} />
                </div>

                {/* Column 3: Price + Date + Arrow */}
                <div className="flex items-center gap-6 text-right">
                    <div className="flex flex-col gap-0.5">
                        <p className="text-[16px] font-bold font-mono-data text-[#0D0D0D] tracking-tight">
                            {agreedFee > 0 ? formatCurrency(agreedFee) : "—"}
                        </p>
                        {outstanding > 0 && agreedFee > 0 && (
                            <p className="text-[11.5px] font-bold font-mono-data text-[#E65100]">
                                {formatCurrency(outstanding)} outstanding
                            </p>
                        )}
                        <p className="text-[11px] font-medium text-[#757575] mt-0.5">
                            {dateStr}
                        </p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F4F0F8] text-[#9E9E9E] group-hover:bg-[#C2185B] group-hover:text-white transition-colors shrink-0">
                        <ArrowRight size={16} />
                    </div>
                </div>

            </Link>
        </div>
    );
}
