"use client";

import { useState, useEffect } from "react";
import { X, Ruler, Loader2, Plus, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const UPPER_FIELDS = [
    { key: "bust", label: "Bust" },
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
    { key: "shoulderWidth", label: "Shoulder Width" },
    { key: "sleeveLength", label: "Sleeve Length" },
    { key: "armLength", label: "Arm Length" },
    { key: "armCircumference", label: "Arm Circumference" },
    { key: "wristCircumference", label: "Wrist Circumference" },
    { key: "neck", label: "Neck" },
    { key: "backLength", label: "Back Length" },
    { key: "frontLength", label: "Front Length" },
];

const LOWER_FIELDS = [
    { key: "dressLength", label: "Dress Length" },
    { key: "thigh", label: "Thigh" },
    { key: "inseam", label: "Inseam" },
    { key: "ankleCircumference", label: "Ankle Circumference" },
];

/**
 * @param {boolean} isClient  — pass true for the client-side panel; adds the
 *                              disclaimer checkbox and appends disclaimerSigned
 *                              to every API call so the backend accepts it.
 */
export default function MeasurementFormModal({
    open,
    onClose,
    clientId,
    existingMeasurement = null,
    isClient = false,
}) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const isUpdate = !!existingMeasurement;

    const [fields, setFields] = useState({});
    const [notes, setNotes] = useState("");
    const [customParams, setCustomParams] = useState([]);
    const [disclaimerSigned, setDisclaimerSigned] = useState(false);

    // Pre-fill from existing measurement
    useEffect(() => {
        if (existingMeasurement) {
            const vals = {};
            [...UPPER_FIELDS, ...LOWER_FIELDS].forEach(({ key }) => {
                if (existingMeasurement[key] != null) vals[key] = existingMeasurement[key];
            });
            setFields(vals);
            setNotes(existingMeasurement.notes || "");
            if (existingMeasurement.customParams && typeof existingMeasurement.customParams === "object") {
                setCustomParams(
                    Object.entries(existingMeasurement.customParams).map(([k, v]) => ({ key: k, value: String(v) }))
                );
            }
        } else {
            setFields({});
            setNotes("");
            setCustomParams([]);
        }
        // Reset disclaimer whenever the modal content changes
        setDisclaimerSigned(false);
    }, [existingMeasurement, open]);

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = {};

            // Only include non-empty numeric standard fields
            [...UPPER_FIELDS, ...LOWER_FIELDS].forEach(({ key }) => {
                const val = fields[key];
                if (val !== undefined && val !== "" && !isNaN(Number(val))) {
                    payload[key] = Number(val);
                }
            });

            if (notes) payload.notes = notes;

            // Build customParams object — values must be numbers per Zod schema
            const cp = {};
            customParams.forEach(({ key, value }) => {
                if (key && value && !isNaN(Number(value))) {
                    cp[key] = Number(value);
                }
            });
            if (Object.keys(cp).length > 0) payload.customParams = cp;

            // Clients must send disclaimerSigned on every call (both POST & PUT)
            if (isClient) payload.disclaimerSigned = true;

            if (isUpdate) {
                const { data } = await api.put(`/measurements/${clientId}`, payload);
                return data;
            } else {
                const { data } = await api.post(`/measurements/${clientId}`, payload);
                return data;
            }
        },
        onSuccess: () => {
            toast.success(isUpdate ? "Measurements updated!" : "Measurements created!", "Changes saved successfully.");
            // Invalidate all relevant caches so every view re-fetches fresh data
            queryClient.invalidateQueries({ queryKey: ["admin-client-measurements"] });
            queryClient.invalidateQueries({ queryKey: ["admin-measurement-detail"] });
            queryClient.invalidateQueries({ queryKey: ["admin-measurements-all"] });
            queryClient.invalidateQueries({ queryKey: ["measurements"] });
            queryClient.invalidateQueries({ queryKey: ["measurement-history"] });
            onClose();
        },
        onError: (err) => {
            const msg =
                err.response?.data?.errors?.[0]?.message ||
                err.response?.data?.message ||
                "Failed to save measurements.";
            toast.error("Error", msg);
        },
    });

    if (!open) return null;

    // Client mode: save is disabled until the disclaimer is signed
    const canSave = isClient ? disclaimerSigned && !mutation.isPending : !mutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-xl p-0 border-0 gap-0 overflow-hidden flex flex-col max-h-[90vh]">
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border bg-popover text-left shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Ruler size={16} className="text-primary" />
                        {isUpdate ? "Update" : "Submit"} Measurements
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Enter measurements, notes, and custom parameters.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5 bg-popover">
                    {/* Upper Body */}
                    <div>
                        <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Upper Body</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {UPPER_FIELDS.map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-[10px] text-text-light mb-1">{label}</label>
                                    <Input
                                        type="number" step="0.1" value={fields[key] || ""}
                                        onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                                        placeholder="cm"
                                        className="h-8 font-mono bg-popover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lower Body */}
                    <div>
                        <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider mb-3">Lower Body & Length</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {LOWER_FIELDS.map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-[10px] text-text-light mb-1">{label}</label>
                                    <Input
                                        type="number" step="0.1" value={fields[key] || ""}
                                        onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                                        placeholder="cm"
                                        className="h-8 font-mono bg-popover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Params */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-text-light uppercase tracking-wider">Custom Measurements</h3>
                            <button
                                type="button"
                                onClick={() => setCustomParams([...customParams, { key: "", value: "" }])}
                                className="text-[10px] text-primary font-semibold flex items-center gap-0.5 hover:underline"
                            >
                                <Plus size={10} /> Add
                            </button>
                        </div>
                        {customParams.map((cp, i) => (
                            <div key={i} className="flex items-center gap-2 mb-2">
                                <Input
                                    type="text" value={cp.key}
                                    onChange={(e) => { const arr = [...customParams]; arr[i].key = e.target.value; setCustomParams(arr); }}
                                    placeholder="Name" className="h-8 bg-background"
                                />
                                <Input
                                    type="number" step="0.1" value={cp.value}
                                    onChange={(e) => { const arr = [...customParams]; arr[i].value = e.target.value; setCustomParams(arr); }}
                                    placeholder="cm" className="h-8 font-mono bg-background"
                                />
                                <button
                                    onClick={() => setCustomParams(customParams.filter((_, j) => j !== i))}
                                    className="p-1 text-text-light hover:text-destructive shrink-0"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-[10px] font-semibold text-text-light uppercase tracking-wider mb-1.5">Notes</label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Additional notes or special fit preferences..."
                            rows={2}
                            className="resize-none bg-background"
                        />
                    </div>

                    {/* Disclaimer — only shown in client mode */}
                    {isClient && (
                        <div className="mt-2 p-4 rounded-xl border border-[rgba(0,0,0,0.08)] bg-surface-2">
                            <h4 className="text-[13px] font-bold text-foreground mb-1.5 flex items-center gap-1.5">
                                <Check size={14} className="text-status-success" /> Authorization & Disclaimer
                            </h4>
                            <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
                                I understand that self-reported measurements will be used directly to construct custom garments.
                                By submitting, I take responsibility for their accuracy. The studio highly recommends an in-person fitting when possible.
                            </p>
                            <label
                                className={`flex items-start gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                    disclaimerSigned
                                        ? "border-primary/30 bg-primary/5"
                                        : "border-border hover:border-primary/20 hover:bg-white"
                                }`}
                            >
                                <div className="mt-0.5 shrink-0">
                                    <Checkbox
                                        checked={disclaimerSigned}
                                        onCheckedChange={setDisclaimerSigned}
                                        className="w-[18px] h-[18px] rounded-md border-2 border-[#D1D5DB] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                </div>
                                <span className="text-[12px] font-medium text-foreground select-none leading-relaxed">
                                    I confirm these measurements are accurate and final. I understand they will be used for my bespoke garment.
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-border bg-popover shrink-0">
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={!canSave}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutation.isPending
                            ? <><Loader2 size={14} className="animate-spin mr-2" />Saving...</>
                            : isUpdate ? "Update Measurements" : "Save Measurements"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
