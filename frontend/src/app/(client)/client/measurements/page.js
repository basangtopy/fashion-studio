"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ruler, ChevronDown, LayoutGrid, User as UserIcon, Save, Calendar, ArrowUpRight, ArrowDownRight, Check, X, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { SkeletonCard } from "@/components/shared/Skeleton";

// Explicit standard fields required by the backend schema for accurate data mapping
const STANDARD_FIELDS = [
    "bust", "waist", "hips", "shoulderWidth", "sleeveLength",
    "dressLength", "thigh", "inseam", "neck", "armLength",
    "armCircumference", "ankleCircumference", "wristCircumference",
    "backLength", "frontLength"
];

// Groupings that strictly match the blueprint
const MEASUREMENT_GROUPS = {
    "Upper Body": ["bust", "waist", "hips", "shoulderWidth", "sleeveLength", "armLength", "armCircumference", "wristCircumference", "neck"],
    "Lower Body": ["thigh", "inseam", "ankleCircumference"],
    "Length": ["dressLength", "frontLength", "backLength"],
};

// Labels for all standard AND custom fields
const MEASUREMENT_LABELS = {
    bust: "Bust", waist: "Waist", hips: "Hips", shoulderWidth: "Shoulder Width",
    sleeveLength: "Sleeve Length", armLength: "Arm Length",
    inseam: "Inseam", thigh: "Thigh", knee: "Knee", calf: "Calf",
    ankleCircumference: "Ankle",
    fullHeight: "Full Height", dressLength: "Dress Length", skirtLength: "Skirt Length",
    // Extras for SVG mappings that users might type into custom
    neck: "Neck", armCircumference: "Bicep", wristCircumference: "Wrist"
};

/* ─── Body diagram measurement point positions ─── */
const SVG_POINTS = {
    neck: { x: 200, y: 82, side: "right" },
    shoulderWidth: { x: 146, y: 100, side: "left" },
    bust: { x: 254, y: 145, side: "right" },
    waist: { x: 254, y: 195, side: "right" },
    hips: { x: 254, y: 245, side: "right" },
    armCircumference: { x: 122, y: 155, side: "left" },
    sleeveLength: { x: 108, y: 195, side: "left" },
    wristCircumference: { x: 95, y: 250, side: "left" },
    thigh: { x: 146, y: 295, side: "left" },
    knee: { x: 146, y: 355, side: "left" },
    calf: { x: 146, y: 395, side: "left" },
    ankleCircumference: { x: 146, y: 445, side: "left" },
};

/* ─── Proper human silhouette SVG ─── */
function BodySilhouette({ highlightedField, onPointHover, flatMeasurements }) {
    return (
        <svg viewBox="0 0 400 500" className="w-full max-w-[400px] mx-auto" style={{ height: "auto" }}>
            {/* Head */}
            <ellipse cx="200" cy="45" rx="28" ry="35" fill="none" stroke="#C2185B" strokeWidth="1.2" opacity="0.35" />

            {/* Neck */}
            <path d="M188,78 L188,90 L212,90 L212,78" fill="none" stroke="#C2185B" strokeWidth="1.2" opacity="0.35" />

            {/* Torso */}
            <path
                d="M188,90 L155,100 L138,115 L128,140 L120,170 L115,195 L118,200 
                   L125,200 L130,210 L140,230 L148,250 L155,265 L162,275 L165,278
                   L170,275 L172,270 L185,270 L200,272 L215,270 L228,270
                   L230,275 L235,278 L238,275 L245,265 L252,250 L260,230 L270,210
                   L275,200 L282,200 L285,195 L280,170 L272,140 L262,115 L245,100
                   L212,90"
                fill="none" stroke="#C2185B" strokeWidth="1.2" opacity="0.35"
            />

            {/* Left arm */}
            <path
                d="M155,100 L138,115 L125,140 L115,170 L105,200 L98,230 L92,255 L90,265
                   L95,268 L100,265 L105,250 L110,230 L118,200"
                fill="none" stroke="#C2185B" strokeWidth="1.2" opacity="0.35"
            />

            {/* Right arm */}
            <path
                d="M245,100 L262,115 L275,140 L285,170 L295,200 L302,230 L308,255 L310,265
                   L305,268 L300,265 L295,250 L290,230 L282,200"
                fill="none" stroke="#C2185B" strokeWidth="1.2" opacity="0.35"
            />

            {/* Left leg */}
            <path
                d="M172,270 L168,300 L165,330 L163,360 L162,390 L161,420 L160,445 L158,465
                   L155,472 L162,475 L172,472 L172,465 L170,445 L172,420 L174,390 L176,360
                   L178,330 L180,300 L185,270"
                fill="none" stroke="#C2185B" strokeWidth="1.2" opacity="0.35"
            />

            {/* Right leg */}
            <path
                d="M228,270 L232,300 L235,330 L237,360 L238,390 L239,420 L240,445 L242,465
                   L245,472 L238,475 L228,472 L228,465 L230,445 L228,420 L226,390 L224,360
                   L222,330 L220,300 L215,270"
                fill="none" stroke="#C2185B" strokeWidth="1.2" opacity="0.35"
            />

            {/* Interactive measurement points */}
            {Object.entries(SVG_POINTS).map(([key, pos]) => {
                const value = flatMeasurements?.[key];
                const isHighlighted = highlightedField === key;
                const labelX = pos.side === "left" ? pos.x - 8 : pos.x + 8;
                const anchor = pos.side === "left" ? "end" : "start";

                return (
                    <g
                        key={key}
                        onMouseEnter={() => onPointHover?.(key)}
                        onMouseLeave={() => onPointHover?.(null)}
                        className="cursor-pointer"
                    >
                        {isHighlighted && (
                            <circle cx={pos.x} cy={pos.y} r="12" fill="#C2185B" opacity="0.1">
                                <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
                            </circle>
                        )}
                        <circle
                            cx={pos.x} cy={pos.y} r={isHighlighted ? 5 : 3.5}
                            fill={isHighlighted ? "#C2185B" : value ? "#C2185B" : "#999"}
                            opacity={isHighlighted ? 1 : 0.7}
                            className="transition-all duration-200"
                        />
                        <text
                            x={labelX}
                            y={pos.y + 3}
                            fontSize={isHighlighted ? "10" : "8.5"}
                            fill={isHighlighted ? "#C2185B" : "#555"}
                            fontFamily="var(--font-mono), monospace"
                            textAnchor={anchor}
                            fontWeight={isHighlighted ? "600" : "400"}
                            className="transition-all duration-200"
                        >
                            {MEASUREMENT_LABELS[key]}: {value ? `${value}cm` : "—"}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function MeasurementsPage() {
    const { user } = useAuth();
    const toast = useToast();
    const queryClient = useQueryClient();
    const [viewMode, setViewMode] = useState("cards");
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [expandedGroup, setExpandedGroup] = useState("Upper Body");
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const [highlightedField, setHighlightedField] = useState(null);
    const [confirmed, setConfirmed] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [customFields, setCustomFields] = useState([]);
    const [notes, setNotes] = useState("");

    const { data: serverMeasurements, isLoading: loadingMeasurements } = useQuery({
        queryKey: ["measurements"],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${user?.id}`);
            return data.data?.measurement || data.data || null;
        },
    });

    const { data: history, isLoading: loadingHistory } = useQuery({
        queryKey: ["measurement-history"],
        queryFn: async () => {
            try {
                const { data } = await api.get(`/measurements/${user?.id}/history`);
                return data.data?.history || data.data || [];
            } catch (e) {
                return [];
            }
        },
        enabled: !!serverMeasurements?.id,
    });

    const updateMutation = useMutation({
        mutationFn: async (payload) => {
            // Include disclaimerSigned as required by Zod update validation
            const { data } = await api.put(`/measurements/${user?.id}`, { ...payload, disclaimerSigned: true });
            return data;
        },
        onSuccess: () => {
            toast.success("Measurements updated!", "Your measurements have been saved.");
            setEditing(false);
            setCreateModalOpen(false);
            setConfirmed(false);
            queryClient.invalidateQueries({ queryKey: ["measurements"] });
            queryClient.invalidateQueries({ queryKey: ["measurement-history"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to update."),
    });

    const createMutation = useMutation({
        mutationFn: async (payload) => {
            try {
                const { data } = await api.put(`/measurements/${user?.id}`, { ...payload, disclaimerSigned: true });
                return data;
            } catch (err) {

                throw err;
            }
        },
        onSuccess: () => {
            toast.success("Measurements created!", "Thank you for submitting your measurements.");
            setCreateModalOpen(false);
            setConfirmed(false);
            queryClient.invalidateQueries({ queryKey: ["measurements"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Failed to submit measurements. Studio may need to initialize your profile."),
    });

    const historyItems = Array.isArray(history) ? history : [];
    const hasData = serverMeasurements && Object.keys(serverMeasurements).length > 0 && !!serverMeasurements.id;

    // Flatten measurements so UI fields can map seamlessly
    const flatMeasurements = hasData
        ? { ...serverMeasurements, ...(serverMeasurements.customParams || {}) }
        : {};

    const startEditing = () => {
        setFormData(flatMeasurements);

        let initialNotes = serverMeasurements?.notes || "";

        const existingCustoms = Object.entries(serverMeasurements?.customParams || {})
            .filter(([k]) => !Object.values(MEASUREMENT_GROUPS).flat().includes(k))
            .map(([k, v]) => {
                // Parse legacy string values into the notes box gracefully (at the top)
                if (typeof v === "string" && isNaN(parseFloat(v))) {
                    initialNotes = initialNotes ? `${k}: ${v}\n${initialNotes}` : `${k}: ${v}`;
                    return null;
                }
                return { id: Math.random().toString(), key: k, value: String(v) };
            })
            .filter(Boolean); // Drop the nulls

        setCustomFields(existingCustoms);
        setNotes(initialNotes);

        setEditing(true);
        setConfirmed(false);
    };

    const startCreating = () => {
        setFormData({});
        setCustomFields([]);
        setNotes("");
        setCreateModalOpen(true);
        setConfirmed(false);
    };

    const handleSave = () => {
        if (!confirmed) return;

        // Pack the flat formData back into standard fields and customParams
        const payload = { ...formData };
        const customParams = {};

        Object.keys(payload).forEach(key => {
            const val = payload[key];
            if (val === "" || val === null || val === undefined) {
                delete payload[key];
                return;
            }
            if (!STANDARD_FIELDS.includes(key)) {
                customParams[key] = parseFloat(val);
                delete payload[key];
            } else {
                payload[key] = parseFloat(val);
            }
        });

        // Add dynamic custom fields
        customFields.forEach(field => {
            if (field.key.trim() && field.value) {
                customParams[field.key.trim()] = parseFloat(field.value);
            }
        });

        if (Object.keys(customParams).length > 0) {
            payload.customParams = customParams;
        }

        if (notes.trim()) {
            payload.notes = notes.trim();
        }

        if (hasData) {
            updateMutation.mutate(payload);
        } else {
            createMutation.mutate(payload);
        }
    };

    if (loadingMeasurements) {
        return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>;
    }

    const lastUpdated = serverMeasurements?.updatedAt
        ? new Date(serverMeasurements.updatedAt).toLocaleDateString("en-NG", { dateStyle: "long" })
        : null;

    // Build the form content which is shared between inline Edit mode and the Create Modal
    const renderFormContent = () => (
        <div className="space-y-4">
            {Object.entries(MEASUREMENT_GROUPS).map(([groupName, fields]) => (
                <div key={groupName} className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden shadow-sm">
                    <button
                        onClick={() => setExpandedGroup(expandedGroup === groupName ? "" : groupName)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#FAFAFA] transition-colors"
                    >
                        <h3 className="text-sm font-semibold text-[#0D0D0D]">{groupName}</h3>
                        <ChevronDown
                            size={16}
                            className={`text-[#999] transition-transform ${expandedGroup === groupName ? "rotate-180" : ""}`}
                        />
                    </button>

                    <AnimatePresence>
                        {expandedGroup === groupName && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {fields.map((field) => (
                                        <div
                                            key={field}
                                            onMouseEnter={() => setHighlightedField(field)}
                                            onMouseLeave={() => setHighlightedField(null)}
                                        >
                                            <label className="text-[11px] text-[#555] font-medium mb-1.5 block">
                                                {MEASUREMENT_LABELS[field] || field}
                                            </label>
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={formData[field] || ""}
                                                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                                                onFocus={() => setHighlightedField(field)}
                                                onBlur={() => setHighlightedField(null)}
                                                placeholder="—"
                                                className="h-10 text-sm font-mono-data border-[#E0E0E0] focus-visible:border-[#C2185B] focus-visible:ring-[#C2185B]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}

            {/* Dynamic Custom Fields Section */}
            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[#0D0D0D]">Additional Custom Measurements</h3>
                    <Button
                        variant="ghost"
                        onClick={() => setCustomFields([...customFields, { id: Math.random().toString(), key: "", value: "" }])}
                        className="h-8 gap-1.5 text-xs font-semibold text-[#C2185B] bg-[#C2185B]/5 hover:bg-[#C2185B]/10 hover:text-[#A01548]"
                    >
                        <Plus size={14} /> Add Field
                    </Button>
                </div>

                {customFields.length === 0 ? (
                    <p className="text-xs text-[#999]">No custom measurements added.</p>
                ) : (
                    <div className="space-y-3">
                        {customFields.map((field, index) => (
                            <div key={field.id} className="w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                                    <div className="flex-1 min-w-0">
                                        <Input
                                            type="text"
                                            value={field.key}
                                            onChange={(e) => {
                                                const updated = [...customFields];
                                                updated[index].key = e.target.value;
                                                setCustomFields(updated);
                                            }}
                                            placeholder="Measurement Name (e.g. Rise)"
                                            className="h-10 text-sm border-[#E0E0E0] focus-visible:border-[#C2185B] focus-visible:ring-[#C2185B]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3 w-full sm:w-auto">
                                        <div className="flex-1 sm:flex-none sm:w-32 min-w-0">
                                            <Input
                                                type="number"
                                                step="0.1"
                                                value={field.value}
                                                onChange={(e) => {
                                                    const updated = [...customFields];
                                                    updated[index].value = e.target.value;
                                                    setCustomFields(updated);
                                                }}
                                                placeholder="Value (cm)"
                                                className="h-10 text-sm font-mono-data border-[#E0E0E0] focus-visible:border-[#C2185B] focus-visible:ring-[#C2185B]"
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))}
                                            className="h-10 px-3 text-[#999] hover:text-[#C62828] hover:bg-[#C62828]/5 border border-[#E0E0E0] sm:border-transparent"
                                            title="Remove field"
                                        >
                                            <Trash2 size={16} className="sm:inline hidden" />
                                            <span className="sm:hidden text-sm font-medium">Remove</span>
                                        </Button>
                                    </div>
                                </div>
                                <div className="sm:hidden w-full h-[1px] bg-[rgba(0,0,0,0.04)] my-4" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Notes Section */}
            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden shadow-sm p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-3">Additional Notes</h3>
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any specific fit preferences, body quirks, or instructions for the tailor..."
                    className="h-24 text-sm border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B] resize-none"
                />
            </div>

            <div className="mt-8 p-5 sm:p-6 rounded-xl border border-[rgba(0,0,0,0.08)] bg-[#FAFAFA] shadow-sm">
                <h4 className="text-[15px] font-bold text-[#0D0D0D] mb-2 flex items-center gap-2">
                    <Check size={16} className="text-[#2E7D32]" /> Authorization & Disclaimer
                </h4>
                <p className="text-[13px] text-[#555] leading-relaxed mb-5">
                    I understand that self-reported measurements will be used directly to construct custom garments. By submitting these sizes, I take responsibility for their accuracy. For the utmost perfection, the studio highly recommends an in-person bespoke fitting when possible.
                </p>

                <label
                    className={`flex items-start gap-4 p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer group ${confirmed
                        ? "border-[#C2185B]/30 bg-[#C2185B]/5 shadow-sm"
                        : "border-[rgba(0,0,0,0.06)] hover:border-[#C2185B]/20 hover:bg-white"
                        }`}
                >
                    <div className="mt-0.5 relative flex-shrink-0">
                        <Checkbox
                            checked={confirmed}
                            onCheckedChange={setConfirmed}
                            className="w-5 h-5 sm:w-[22px] sm:h-[22px] rounded-md border-2 border-[#D1D5DB] data-[state=checked]:bg-[#C2185B] data-[state=checked]:border-[#C2185B] group-hover:border-[#C2185B] transition-all shadow-sm"
                        />
                    </div>
                    <span className="text-[13px] sm:text-sm font-medium text-[#0D0D0D] select-none pt-[1px] leading-relaxed">
                        I confirm that the measurements provided above are accurate and final. I understand they will be used directly for my bespoke garment.
                    </span>
                </label>
            </div>
        </div >
    );

    return (
        <div className="pb-20 lg:pb-0">
            {/* Header */}
            <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-2">
                <div className="min-w-0 pr-2">
                    <h1 className="text-lg sm:text-2xl font-bold text-[#0D0D0D] truncate">Your Measurements</h1>
                    {lastUpdated && (
                        <p className="text-[10px] sm:text-xs text-[#999] mt-0.5 sm:mt-1 truncate">Last updated: {lastUpdated}</p>
                    )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* View toggle */}
                    {hasData && !editing && (
                        <div className="flex bg-[#F4F0F8] rounded-lg p-0.5">
                            <button
                                onClick={() => setViewMode("cards")}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "cards" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999]"
                                    }`}
                                title="Card view"
                            >
                                <LayoutGrid size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode("svg")}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${viewMode === "svg" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999]"
                                    }`}
                                title="Diagram view"
                            >
                                <UserIcon size={14} />
                            </button>
                        </div>
                    )}

                    {hasData && !editing && (
                        <Button
                            onClick={startEditing}
                            className="bg-[#C2185B] text-white hover:bg-[#A01548]"
                        >
                            Update
                        </Button>
                    )}

                    {hasData && editing && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => { setEditing(false); setConfirmed(false); }}
                                className="text-[#555] hover:bg-[#F4F0F8]"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={updateMutation.isPending || !confirmed}
                                className="bg-[#2E7D32] text-white hover:bg-[#1B5E20] gap-1.5"
                            >
                                <Save size={14} /> Save
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Empty state specifically matching blueprint */}
            {!hasData && !editing && (
                <div className="mt-8 p-10 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white text-center shadow-sm max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-[#F4F0F8] rounded-full flex items-center justify-center mx-auto mb-5">
                        <Ruler size={28} className="text-[#C2185B]" />
                    </div>
                    <h2 className="text-lg font-bold text-[#0D0D0D] mb-2">No Measurements On File</h2>
                    <p className="text-sm text-[#555] leading-relaxed mb-8 max-w-md mx-auto">
                        For the absolute best results and a flawless fit, we highly recommend scheduling an in-studio fitting with our tailors. If you reside outside Lagos or cannot visit, you may self-report your measurements.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Link
                            href="/client/appointments"
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors shadow-sm"
                        >
                            <Calendar size={16} /> Book a Fitting
                        </Link>
                        <Button
                            variant="outline"
                            onClick={startCreating}
                            className="w-full sm:w-auto border-[#E0E0E0] text-[#0D0D0D] hover:bg-[#FAFAFA]"
                        >
                            Self-Report Measurements
                        </Button>
                    </div>
                </div>
            )}

            {/* ─── SVG Diagram View ─── */}
            {viewMode === "svg" && !editing && hasData && (
                <div className="mb-8 mt-6">
                    <div className="p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
                        <BodySilhouette
                            flatMeasurements={flatMeasurements}
                            highlightedField={highlightedField}
                            onPointHover={setHighlightedField}
                        />
                    </div>

                    {/* Check if there are any Custom Fields that are entirely outside the predefined group lists */}
                    {Object.keys(serverMeasurements?.customParams || {}).filter(k => !Object.values(MEASUREMENT_GROUPS).flat().includes(k)).length > 0 && (
                        <div className="mt-6 p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm">
                            <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-4">Additional Custom Measurements</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {Object.entries(serverMeasurements.customParams).filter(([k]) => !Object.values(MEASUREMENT_GROUPS).flat().includes(k)).map(([key, value]) => (
                                    <div key={key}>
                                        <span className="text-[11px] text-[#757575] font-medium block uppercase tracking-wider mb-1">{MEASUREMENT_LABELS[key] || key}</span>
                                        <span className="text-sm font-mono-data font-bold text-[#0D0D0D]">{value}cm</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── Card View / Edit View ─── */}
            {(viewMode === "cards" && hasData && !editing) && (
                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
                    }}
                    className="space-y-4 mt-6"
                >
                    {Object.entries(MEASUREMENT_GROUPS).map(([groupName, fields]) => (
                        <motion.div
                            key={groupName}
                            variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            className="p-5 sm:p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm"
                        >
                            <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-5">{groupName}</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                                {fields.map((field) => (
                                    <div key={field}>
                                        <label className="text-[11px] text-[#757575] font-medium block uppercase tracking-wider mb-1">
                                            {MEASUREMENT_LABELS[field] || field}
                                        </label>
                                        <p className="text-[15px] font-mono-data font-semibold text-[#0D0D0D]">
                                            {flatMeasurements[field] ? `${flatMeasurements[field]}cm` : "—"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}

                    {Object.keys(serverMeasurements?.customParams || {}).filter(k => !Object.values(MEASUREMENT_GROUPS).flat().includes(k)).length > 0 && (
                        <motion.div
                            variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            className="p-5 sm:p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm"
                        >
                            <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-5">Custom Fields</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                                {Object.entries(serverMeasurements.customParams).filter(([k]) => !Object.values(MEASUREMENT_GROUPS).flat().includes(k)).map(([key, value]) => (
                                    <div key={key}>
                                        <label className="text-[11px] text-[#757575] font-medium block uppercase tracking-wider mb-1">
                                            {MEASUREMENT_LABELS[key] || key}
                                        </label>
                                        <p className="text-[15px] font-mono-data font-semibold text-[#0D0D0D]">
                                            {value}cm
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {serverMeasurements?.notes && (
                        <motion.div
                            variants={{ hidden: { opacity: 0, scale: 0.97 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } } }}
                            className="p-5 sm:p-6 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm"
                        >
                            <h3 className="text-[15px] font-bold text-[#0D0D0D] mb-3">Additional Notes</h3>
                            <p className="text-[14px] text-[#555] whitespace-pre-wrap leading-relaxed">{serverMeasurements.notes}</p>
                        </motion.div>
                    )}
                </motion.div>
            )}

            {/* Inline Editor */}
            {hasData && editing && (
                <div className="mt-6">
                    {renderFormContent()}
                </div>
            )}

            {/* Request Update CTA (Matches blueprint) */}
            {hasData && !editing && (
                <div className="mt-8 flex justify-end">
                    <Link
                        href="?action=book_appointment"
                        scroll={false}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[rgba(0,0,0,0.12)] text-[13px] font-semibold text-[#555] hover:bg-[#F4F0F8] transition-colors shadow-sm"
                    >
                        <Calendar size={14} /> Request Update
                    </Link>
                </div>
            )}

            {/* ─── Measurement History Accordion ─── */}
            {historyItems.length > 0 && !editing && (
                <div className="mt-10 rounded-2xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden shadow-sm">
                    <button
                        onClick={() => setHistoryExpanded(!historyExpanded)}
                        className="w-full flex items-center justify-between px-6 py-5 hover:bg-[#FAFAFA] transition-colors"
                    >
                        <h2 className="text-lg font-bold text-[#0D0D0D]">Measurement History</h2>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-[#F4F0F8] text-[#555]">
                                {historyItems.length} records
                            </span>
                            <ChevronDown
                                size={18}
                                className={`text-[#0D0D0D] transition-transform ${historyExpanded ? "rotate-180" : ""}`}
                            />
                        </div>
                    </button>

                    <AnimatePresence>
                        {historyExpanded && (
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "auto" }}
                                exit={{ height: 0 }}
                                className="overflow-hidden bg-[#FAFAFA] border-t border-[rgba(0,0,0,0.04)]"
                            >
                                <div className="p-6 space-y-4">
                                    {historyItems.map((entry, i) => (
                                        <div
                                            key={entry.id || i}
                                            className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white shadow-sm"
                                        >
                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[rgba(0,0,0,0.04)]">
                                                <span className="text-xs font-semibold text-[#555]">
                                                    {new Date(entry.createdAt).toLocaleDateString("en-NG", {
                                                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                                                    })}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-[#F4F0F8] text-[#555]">
                                                    {entry.changedBy || (entry.source === "SELF" || entry.updatedByRole === "CLIENT" ? "Self-Reported" : "Professional")}
                                                </span>
                                            </div>

                                            {entry.notes && (
                                                <div className="mb-4 text-[13px] text-[#555] p-3 bg-[#F4F0F8]/50 rounded-lg italic border border-[rgba(0,0,0,0.03)]">
                                                    "{entry.notes}"
                                                </div>
                                            )}

                                            {entry.changedFields && (
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-3 gap-x-6 text-sm">
                                                    {Object.entries(entry.changedFields).map(([key, change]) => {
                                                        if (typeof change !== "object" || !('from' in change)) return null;
                                                        const increased = Number(change.to) > Number(change.from);
                                                        return (
                                                            <div key={key} className="flex items-center gap-1.5 whitespace-nowrap">
                                                                <span className="text-[#757575] text-[13px]">{MEASUREMENT_LABELS[key] || key}:</span>
                                                                <span className="text-[#555] line-through font-mono-data text-[13px]">{change.from}</span>
                                                                {increased
                                                                    ? <ArrowUpRight size={12} className="text-[#E65100]" />
                                                                    : <ArrowDownRight size={12} className="text-[#2E7D32]" />
                                                                }
                                                                <span className="text-[#2E7D32] font-mono-data font-bold text-[13px]">{change.to}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ─── Create Measurement Overlay Modal ─── */}
            <AnimatePresence>
                {createModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ y: 20, opacity: 0, scale: 0.95 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={{ y: 20, opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-[rgba(0,0,0,0.06)] flex items-center justify-between bg-white shrink-0">
                                <h2 className="text-lg font-bold text-[#0D0D0D]">Submit Measurements</h2>
                                <button
                                    onClick={() => setCreateModalOpen(false)}
                                    className="p-2 -mr-2 text-[#999] hover:text-[#0D0D0D] transition-colors rounded-lg hover:bg-[#F4F0F8]"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Scrollable Body */}
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-[#FAFAFA]">
                                {renderFormContent()}
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-[rgba(0,0,0,0.06)] bg-white flex items-center justify-end gap-3 shrink-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="text-[#555] hover:bg-[#F4F0F8]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={createMutation.isPending || !confirmed}
                                    className="gap-1.5 bg-[#0D0D0D] text-white hover:bg-[#222]"
                                >
                                    <Save size={14} /> Submit
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
