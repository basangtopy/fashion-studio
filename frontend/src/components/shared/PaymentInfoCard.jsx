
import { useState } from "react";
import { Copy, Building2, Check, CreditCard } from "lucide-react";
import { BRANDING, formatCurrency } from "../../config/branding";

export default function PaymentInfoCard({ orderNumber, grandTotal, compact = false }) {
    const { paymentInfo } = BRANDING;
    const [copiedField, setCopiedField] = useState(null);

    const copyToClipboard = (value, field) => {
        navigator.clipboard.writeText(value).then(() => {
            setCopiedField(field);
            setTimeout(() => setCopiedField(null), 2000);
        });
    };

    const fields = [
        { label: "Bank", value: paymentInfo.bankName, key: "bank" },
        { label: "Account Name", value: paymentInfo.accountName, key: "name" },
        { label: "Account Number", value: paymentInfo.accountNumber, key: "number" },
        ...(grandTotal ? [{ label: "Amount to Pay", value: formatCurrency(grandTotal), key: "amount" }] : []),
        ...(orderNumber ? [{ label: "Order Number", value: orderNumber, key: "orderNumber" }] : []),
    ];

    return (
        <div className="rounded-xl bg-[#1A1A2E] text-white overflow-hidden">
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[#C2185B]/20 flex items-center justify-center shrink-0">
                        <CreditCard size={15} className="text-[#C2185B]" />
                    </div>
                    <h3 className="font-semibold text-sm">Payment Details</h3>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                    Transfer the exact amount to the account below after placing your order.
                </p>
            </div>

            {/* Account fields */}
            <div className="px-5 py-4 space-y-3">
                {fields.map(({ label, value, key }) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className={`font-medium text-white ${key === "number" || key === "amount" ? "font-mono text-sm" : "text-sm"}`}>
                                {value}
                            </p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(value, key)}
                            className="shrink-0 w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            title="Copy"
                        >
                            {copiedField === key ? (
                                <Check size={12} className="text-[#C2185B]" />
                            ) : (
                                <Copy size={12} className="text-white/40" />
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Instructions */}
            {!compact && (
                <div className="px-5 pb-5 border-t border-white/10 pt-4">
                    <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-3">
                        How to pay
                    </p>
                    <ol className="space-y-2.5">
                        {paymentInfo.instructions.map((step, i) => (
                            <li key={i} className="flex gap-2.5">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-[#C2185B]/20 text-[#C2185B] text-[10px] font-bold flex items-center justify-center mt-0.5">
                                    {i + 1}
                                </span>
                                <p className="text-xs text-white/60 leading-relaxed">{step}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            )}
        </div>
    );
}