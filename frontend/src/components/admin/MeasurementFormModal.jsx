"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Ruler, Loader2, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const UPPER_FIELDS = [
    { key: "bust", label: "Bust" },
    { key: "underBust", label: "Under Bust" },
    { key: "shoulder", label: "Shoulder" },
    { key: "sleeveLength", label: "Sleeve Length" },
    { key: "armhole", label: "Armhole" },
    { key: "bicep", label: "Bicep" },
    { key: "wrist", label: "Wrist" },
    { key: "frontLength", label: "Front Length" },
    { key: "backLength", label: "Back Length" },
    { key: "neckToWaist", label: "Neck to Waist" },
    { key: "acrossFront", label: "Across Front" },
    { key: "acrossBack", label: "Across Back" },
];

const LOWER_FIELDS = [
    { key: "waist", label: "Waist" },
    { key: "hips", label: "Hips" },
    { key: "fullLength", label: "Full Length" },
    { key: "kneeLength", label: "Knee Length" },
    { key: "thigh", label: "Thigh" },
    { key: "calf", label: "Calf" },
    { key: "ankle", label: "Ankle" },
    { key: "inseam", label: "Inseam" },
    { key: "outseam", label: "Outseam" },
    { key: "crotchDepth", label: "Crotch Depth" },
];

export default function MeasurementFormModal({ open, onClose, clientId, existingMeasurement = null }) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const isUpdate = !!existingMeasurement;

    const [fields, setFields] = useState({});
    const [notes, setNotes] = useState("");
    const [customParams, setCustomParams] = useState([]);

    // Pre-fill from existing
    useEffect(() => {
        if (existingMeasurement) {
            const vals = {};
            [...UPPER_FIELDS, ...LOWER_FIELDS].forEach(({ key }) => {
                if (existingMeasurement[key] != null) vals[key] = existingMeasurement[key];
            });
            setFields(vals);
            setNotes(existingMeasurement.notes || "");
            if (existingMeasurement.customParams && typeof existingMeasurement.customParams === "object") {
                setCustomParams(Object.entries(existingMeasurement.customParams).map(([k, v]) => ({ key: k, value: String(v) })));
            }
        } else {
            setFields({});
            setNotes("");
            setCustomParams([]);
        }
    }, [existingMeasurement]);

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = {};
            // Only include non-empty numeric fields
            [...UPPER_FIELDS, ...LOWER_FIELDS].forEach(({ key }) => {
                const val = fields[key];
                if (val !== undefined && val !== "" && !isNaN(Number(val))) {
                    payload[key] = Number(val);
                }
            });
            if (notes) payload.notes = notes;

            // Build customParams object
            const cp = {};
            customParams.forEach(({ key, value }) => {
                if (key && value) cp[key] = isNaN(Number(value)) ? value : Number(value);
            });
            if (Object.keys(cp).length > 0) payload.customParams = cp;

            if (isUpdate) {
                const { data } = await api.put(`/measurements/${clientId}`, payload);
                return data;
            } else {
                const { data } = await api.post(`/measurements/${clientId}`, payload);
                return data;
            }
        },
        onSuccess: () => {
            toast.success(isUpdate ? "Measurements updated!" : "Measurements created!");
            queryClient.invalidateQueries({ queryKey: ["admin-client-measurements"] });
            queryClient.invalidateQueries({ queryKey: ["admin-measurement-detail"] });
            queryClient.invalidateQueries({ queryKey: ["admin-measurements-all"] });
            onClose();
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.message || "Failed to save measurements.");
        },
    });

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-xl p-0 border-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.06)] bg-white text-left shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-[#0D0D0D]">
                        <Ruler size={16} className="text-[#C2185B]" />
                        {isUpdate ? "Edit" : "Add"} Measurements
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Enter client measurements, notes, and custom parameters.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5 bg-white">
                    {/* Upper Body */}
                    <div>
                        <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Upper Body</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {UPPER_FIELDS.map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-[10px] text-[#999] mb-1">{label}</label>
                                    <Input
                                        type="number" step="0.1" value={fields[key] || ""} onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                                        placeholder="cm"
                                        className="h-8 font-mono bg-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Lower Body */}
                    <div>
                        <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Lower Body</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {LOWER_FIELDS.map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-[10px] text-[#999] mb-1">{label}</label>
                                    <Input
                                        type="number" step="0.1" value={fields[key] || ""} onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                                        placeholder="cm"
                                        className="h-8 font-mono bg-white"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Custom Params */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-[#999] uppercase tracking-wider">Custom Measurements</h3>
                            <button type="button" onClick={() => setCustomParams([...customParams, { key: "", value: "" }])}
                                className="text-[10px] text-[#C2185B] font-semibold flex items-center gap-0.5 hover:underline">
                                <Plus size={10} /> Add
                            </button>
                        </div>
                        {customParams.map((cp, i) => (
                            <div key={i} className="flex items-center gap-2 mb-2">
                                <Input type="text" value={cp.key} onChange={(e) => { const arr = [...customParams]; arr[i].key = e.target.value; setCustomParams(arr); }}
                                    placeholder="Name" className="h-8 bg-white" />
                                <Input type="text" value={cp.value} onChange={(e) => { const arr = [...customParams]; arr[i].value = e.target.value; setCustomParams(arr); }}
                                    placeholder="Value" className="h-8 font-mono bg-white" />
                                <button onClick={() => setCustomParams(customParams.filter((_, j) => j !== i))} className="p-1 text-[#999] hover:text-[#C62828]"><X size={12} /></button>
                            </div>
                        ))}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Notes</label>
                        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." rows={2}
                            className="resize-none bg-white" />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-[rgba(0,0,0,0.06)] bg-white shrink-0">
                    <Button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                        className="w-full bg-[#C2185B] text-white hover:bg-[#A01548] h-10"
                    >
                        {mutation.isPending ? <><Loader2 size={14} className="animate-spin mr-2" /> Saving...</> : isUpdate ? "Update Measurements" : "Save Measurements"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
