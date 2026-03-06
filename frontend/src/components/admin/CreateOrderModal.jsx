"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, ShoppingBag, Loader2, Search, ChevronRight, ChevronLeft, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import CustomSelect from "@/components/shared/CustomSelect";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

const ORDER_TYPE_OPTIONS = [
    { value: "MODEL_1", label: "Model 1 — Custom Tailoring (client's fabric)" },
    { value: "MODEL_2", label: "Model 2 — Custom Tailoring (studio's fabric)" },
    { value: "MODEL_3", label: "Model 3 — Ready-to-Wear" },
];

const FULFILLMENT_OPTIONS = [
    { value: "PICKUP", label: "Pick Up" },
    { value: "DELIVERY", label: "Delivery" },
];

export default function CreateOrderModal({ open, onClose, preselectedClientId = null }) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [clientSearch, setClientSearch] = useState("");
    const [selectedClient, setSelectedClient] = useState(preselectedClientId || null);
    const [selectedClientName, setSelectedClientName] = useState("");
    const [openClientCombo, setOpenClientCombo] = useState(false);
    const [form, setForm] = useState({
        orderType: "",
        styleId: "",
        customStyleDescription: "",
        clientProvidesFabric: true,
        fabricNotes: "",
        useSavedMeasurements: true,
        fulfillmentMethod: "PICKUP",
        deliveryAddress: "",
        clientNotes: "",
    });

    // Search clients for step 1
    const { data: clientResults } = useQuery({
        queryKey: ["search-clients", clientSearch],
        queryFn: async () => {
            const { data } = await api.get("/users/admin/clients", { params: { search: clientSearch, limit: 8 } });
            return data.data?.clients || [];
        },
        enabled: !!clientSearch && !preselectedClientId && step === 1,
    });

    // Fetch styles for step 2
    const { data: styles } = useQuery({
        queryKey: ["admin-styles-list"],
        queryFn: async () => {
            const { data } = await api.get("/styles", { params: { limit: 100 } });
            return data.data?.styles || data.data || [];
        },
        enabled: step === 2 && (form.orderType === "MODEL_1" || form.orderType === "MODEL_2"),
    });

    const styleOptions = (Array.isArray(styles) ? styles : []).map((s) => ({
        value: s.id,
        label: s.name,
    }));

    const mutation = useMutation({
        mutationFn: async () => {
            const payload = {
                orderType: form.orderType,
                fulfillmentMethod: form.fulfillmentMethod,
                useSavedMeasurements: form.useSavedMeasurements,
            };
            if (form.styleId) payload.styleId = form.styleId;
            if (form.customStyleDescription) payload.customStyleDescription = form.customStyleDescription;
            if (form.orderType === "MODEL_1") payload.clientProvidesFabric = form.clientProvidesFabric;
            if (form.fabricNotes) payload.fabricNotes = form.fabricNotes;
            if (form.fulfillmentMethod === "DELIVERY" && form.deliveryAddress) payload.deliveryAddress = form.deliveryAddress;
            if (form.clientNotes) payload.clientNotes = form.clientNotes;
            const { data } = await api.post(`/admin/orders/client/${selectedClient}`, payload);
            return data.data?.order || data.data;
        },
        onSuccess: () => {
            toast.success("Order created successfully!");
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            onClose();
            resetForm();
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.message || "Failed to create order.");
        },
    });

    const resetForm = () => {
        setStep(1);
        setSelectedClient(preselectedClientId || null);
        setSelectedClientName("");
        setClientSearch("");
        setForm({ orderType: "", styleId: "", customStyleDescription: "", clientProvidesFabric: true, fabricNotes: "", useSavedMeasurements: true, fulfillmentMethod: "PICKUP", deliveryAddress: "", clientNotes: "" });
    };

    if (!open) return null;

    const canProceedStep1 = !!selectedClient;
    const canProceedStep2 = !!form.orderType && (form.orderType === "MODEL_3" || form.styleId || form.customStyleDescription);
    const canSubmit = canProceedStep2 && form.fulfillmentMethod && (form.fulfillmentMethod !== "DELIVERY" || form.deliveryAddress);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            if (!isOpen) { onClose(); resetForm(); }
        }}>
            <DialogContent className="max-w-lg p-0 border-0 gap-0 overflow-hidden flex flex-col h-[80vh] sm:h-auto sm:max-h-[80vh]">
                {/* Header */}
                <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-[rgba(0,0,0,0.06)] bg-white text-left shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-[#0D0D0D]">
                        <ShoppingBag size={16} className="text-[#C2185B]" />
                        Create Order
                    </DialogTitle>
                    <div className="flex items-center gap-3 !mt-0 !mr-6">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className={`w-6 h-1 rounded-full transition-colors ${step >= s ? "bg-[#C2185B]" : "bg-[#E0E0E0]"}`} />
                            ))}
                        </div>
                    </div>
                </DialogHeader>
                <DialogDescription className="sr-only">
                    Create a new order by selecting a client, style, and fulfillment details over multiple steps.
                </DialogDescription>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-white">
                    {/* Step 1: Select Client */}
                    {step === 1 && !preselectedClientId && (
                        <div>
                            <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">Step 1 — Select Client</p>

                            <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={openClientCombo}
                                        className="w-full justify-between h-9 bg-white font-normal"
                                    >
                                        {selectedClient
                                            ? selectedClientName
                                            : "Search by name, email, or phone..."}
                                        <Search className="opacity-50" size={14} />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search by name, email, or phone..."
                                            value={clientSearch}
                                            onValueChange={setClientSearch}
                                        />
                                        <CommandList>
                                            {clientSearch && (!clientResults || clientResults.length === 0) && (
                                                <CommandEmpty>No clients found. Create a new client first.</CommandEmpty>
                                            )}
                                            <CommandGroup>
                                                {(clientResults || []).map((c) => (
                                                    <CommandItem
                                                        key={c.id}
                                                        value={c.id}
                                                        onSelect={(currentValue) => {
                                                            setSelectedClient(currentValue === selectedClient ? null : c.id);
                                                            setSelectedClientName(c.fullName);
                                                            setOpenClientCombo(false);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-2.5 w-full">
                                                            <div className="w-6 h-6 rounded-full bg-[#C2185B] flex items-center justify-center text-white text-[10px] font-bold shrink-0">{c.fullName?.charAt(0)}</div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-medium text-[#0D0D0D] truncate">{c.fullName}</p>
                                                                <p className="text-[10px] text-[#999] truncate">{c.email}</p>
                                                            </div>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {selectedClient && (
                                <div className="mt-4 flex items-center justify-between p-3 rounded-lg border border-[#C2185B]/20 bg-[#C2185B]/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-[#C2185B] flex items-center justify-center text-white text-xs font-bold">{selectedClientName.charAt(0)}</div>
                                        <span className="text-sm font-medium text-[#C2185B]">{selectedClientName}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setSelectedClientName(""); }} className="h-7 text-xs text-[#C2185B] hover:text-[#A01548] hover:bg-transparent">Change</Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 1 for preselected client */}
                    {step === 1 && preselectedClientId && (
                        <div>
                            <p className="text-xs text-[#999] mb-3">Creating order for this client.</p>
                        </div>
                    )}

                    {/* Step 2: Order Details */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-1">Step 2 — Order Details</p>
                            <CustomSelect
                                label="Order Type"
                                options={ORDER_TYPE_OPTIONS}
                                value={form.orderType}
                                onChange={(v) => setForm({ ...form, orderType: v, styleId: "" })}
                                placeholder="Select order type..."
                            />

                            {(form.orderType === "MODEL_1" || form.orderType === "MODEL_2") && (
                                <>
                                    <CustomSelect
                                        label="Style"
                                        options={styleOptions}
                                        value={form.styleId}
                                        onChange={(v) => setForm({ ...form, styleId: v })}
                                        placeholder="Select a style..."
                                        searchable
                                    />
                                    <div>
                                        <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Or Custom Description</label>
                                        <Textarea value={form.customStyleDescription} onChange={(e) => setForm({ ...form, customStyleDescription: e.target.value })}
                                            placeholder="Describe the custom style..." rows={2}
                                            className="resize-none bg-white" />
                                    </div>
                                </>
                            )}

                            {form.orderType === "MODEL_1" && (
                                <div className="flex items-center gap-3">
                                    <label className="text-xs text-[#555]">Client provides fabric?</label>
                                    <button type="button" onClick={() => setForm({ ...form, clientProvidesFabric: !form.clientProvidesFabric })}
                                        className={`w-9 h-5 rounded-full relative transition-colors ${form.clientProvidesFabric ? "bg-[#C2185B]" : "bg-[#E0E0E0]"}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${form.clientProvidesFabric ? "right-0.5" : "left-0.5"}`} />
                                    </button>
                                </div>
                            )}

                            <div>
                                <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Fabric Notes</label>
                                <Input type="text" value={form.fabricNotes} onChange={(e) => setForm({ ...form, fabricNotes: e.target.value })}
                                    placeholder="Optional fabric details..."
                                    className="h-9 bg-white" />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Fulfillment */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-1">Step 3 — Fulfillment & Notes</p>
                            <CustomSelect
                                label="Fulfillment Method"
                                options={FULFILLMENT_OPTIONS}
                                value={form.fulfillmentMethod}
                                onChange={(v) => setForm({ ...form, fulfillmentMethod: v })}
                            />

                            {form.fulfillmentMethod === "DELIVERY" && (
                                <div>
                                    <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Delivery Address *</label>
                                    <Input type="text" value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })}
                                        placeholder="Full delivery address..."
                                        className="h-9 bg-white" />
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <label className="text-xs text-[#555]">Use saved measurements?</label>
                                <button type="button" onClick={() => setForm({ ...form, useSavedMeasurements: !form.useSavedMeasurements })}
                                    className={`w-9 h-5 rounded-full relative transition-colors ${form.useSavedMeasurements ? "bg-[#C2185B]" : "bg-[#E0E0E0]"}`}>
                                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${form.useSavedMeasurements ? "right-0.5" : "left-0.5"}`} />
                                </button>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Client Notes</label>
                                <Textarea value={form.clientNotes} onChange={(e) => setForm({ ...form, clientNotes: e.target.value })}
                                    placeholder="Any additional notes..." rows={2}
                                    className="resize-none bg-white" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-[rgba(0,0,0,0.06)] bg-white shrink-0">
                    {step > 1 ? (
                        <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-[#999] hover:text-[#555] h-9 gap-1">
                            <ChevronLeft size={14} /> Back
                        </Button>
                    ) : <div />}

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
                            className="bg-[#C2185B] text-white hover:bg-[#A01548] h-9 gap-1"
                        >
                            Next <ChevronRight size={14} />
                        </Button>
                    ) : (
                        <Button
                            onClick={() => mutation.mutate()}
                            disabled={mutation.isPending || !canSubmit}
                            className="bg-[#C2185B] text-white hover:bg-[#A01548] h-9 gap-2"
                        >
                            {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : <><Plus size={14} /> Create Order</>}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
