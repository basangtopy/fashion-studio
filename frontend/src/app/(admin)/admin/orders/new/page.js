"use client";

import { useState, useRef, useMemo, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, ShoppingBag, Loader2, Search, ChevronRight, ChevronLeft,
    Plus, Scissors, Truck, Package, Sparkles, Check, Upload, Shirt, Trash2, ArrowLeft
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import CustomSelect from "@/components/shared/CustomSelect";
import { formatCurrency } from "@/config/branding";

// ── Helpers & Components ──────────────────────────────────────────────────

function ImageUploader({ images, onChange }) {
    const inputRef = useRef(null);
    const MAX = 5;

    const handleFiles = (files) => {
        const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
        const next = [...images, ...valid].slice(0, MAX);
        onChange(next);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
    };

    const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

    return (
        <div className="space-y-3">
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => images.length < MAX && inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer
                    ${images.length >= MAX
                        ? "border-[#E0E0E0] bg-[#FAFAFA] cursor-not-allowed opacity-60"
                        : "border-[#C2185B]/30 bg-[#FFF5F8] hover:border-[#C2185B]/60 hover:bg-[#FFF0F5]"
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    className="hidden"
                />
                <Upload size={20} className="mx-auto mb-2 text-[#C2185B]/60" />
                <p className="text-sm font-medium text-[#555]">
                    {images.length >= MAX
                        ? "Maximum 5 images uploaded"
                        : "Drop style images here or click to browse"}
                </p>
            </div>
            {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {images.map((file, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#F4F0F8] group">
                            <Image src={URL.createObjectURL(file)} alt="" fill className="object-cover" />
                            <button type="button" onClick={(e) => { e.stopPropagation(); remove(i); }} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <X size={10} strokeWidth={3} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Component Wrapper ────────────────────────────────────────────────────────

const FULFILLMENT_OPTIONS = [
    { value: "PICKUP", label: "Studio Pickup", icon: Package },
    { value: "DELIVERY", label: "Home Delivery", icon: Truck },
];

const ORDER_MODELS = [
    { value: "MODEL_1", label: "Model 1", desc: "Custom Tailoring. Client provides fabric.", icon: Scissors, color: "#C2185B", bg: "#FFF5F8" },
    { value: "MODEL_2", label: "Model 2", desc: "Custom Tailoring. Studio sources fabric.", icon: ShoppingBag, color: "#1565C0", bg: "#EFF6FF" },
    { value: "MODEL_3", label: "Model 3", desc: "Ready-to-Wear selection.", icon: Shirt, color: "#2E7D32", bg: "#F1F8E9" }
];

function NewOrderForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedClientId = searchParams.get("client");

    const toast = useToast();
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);

    // Client State
    const [clientSearch, setClientSearch] = useState("");
    const [selectedClient, setSelectedClient] = useState(preselectedClientId || null);
    const [selectedClientName, setSelectedClientName] = useState(""); // Will populate quickly via search or typing context
    const [openClientCombo, setOpenClientCombo] = useState(false);

    // Form State
    const [form, setForm] = useState({
        orderType: "",
        styleSource: "catalog", // "catalog" | "custom"
        styleId: "",
        customStyleDescription: "",
        customImages: [],
        clientProvidesFabric: true,
        fabricNotes: "",
        useSavedMeasurements: true,
        fulfillmentMethod: "PICKUP",
        deliveryAddress: "",
        clientNotes: "",
        model3Items: []
    });

    // Sub-states for RTW picker
    const [activeRtwId, setActiveRtwId] = useState("");
    const [activeRtwSize, setActiveRtwSize] = useState("");
    const [activeRtwQty, setActiveRtwQty] = useState(1);

    // ── Queries ──
    const { data: clientResults } = useQuery({
        queryKey: ["search-clients", clientSearch],
        queryFn: async () => {
            const { data } = await api.get("/users/admin/clients", { params: { search: clientSearch, limit: 8 } });
            return data.data?.clients || [];
        },
        enabled: !!clientSearch && !preselectedClientId && step === 1,
    });

    // If preselected, fetch that single client name to hydrate the UI
    useQuery({
        queryKey: ["admin-client-single", preselectedClientId],
        queryFn: async () => {
            const { data } = await api.get(`/users/admin/clients/${preselectedClientId}`);
            if (data?.data?.client) setSelectedClientName(data.data.client.fullName);
            return data.data?.client;
        },
        enabled: !!preselectedClientId && !selectedClientName,
    });

    const { data: styles } = useQuery({
        queryKey: ["admin-styles-list"],
        queryFn: async () => {
            const { data } = await api.get("/styles", { params: { limit: 100 } });
            return data.data?.styles || data.data || [];
        },
    });

    const { data: rtwData } = useQuery({
        queryKey: ["admin-rtw-list"],
        queryFn: async () => {
            const { data } = await api.get("/ready-to-wear", { params: { limit: 100 } });
            return data.data?.items || data.data?.readyToWearItems || data.data || [];
        },
    });

    const styleOptions = (Array.isArray(styles) ? styles : []).map((s) => ({ value: s.id, label: s.name }));
    const rtwOptions = (Array.isArray(rtwData) ? rtwData : []).map(r => ({ value: r.id, label: r.name, data: r }));

    const selectedRtwItem = useMemo(() => {
        return rtwOptions.find(o => o.value === activeRtwId)?.data;
    }, [activeRtwId, rtwOptions]);

    // ── Handlers ──
    const handleAddRtwItem = () => {
        if (!activeRtwId || !activeRtwSize || activeRtwQty < 1) return;
        setForm(prev => ({
            ...prev,
            model3Items: [...prev.model3Items, {
                readyToWearId: activeRtwId,
                name: selectedRtwItem.name,
                image: selectedRtwItem.images?.[0],
                price: Number(selectedRtwItem.price),
                selectedSize: activeRtwSize,
                quantity: activeRtwQty
            }]
        }));
        setActiveRtwId("");
        setActiveRtwSize("");
        setActiveRtwQty(1);
    };

    const removeRtwItem = (index) => {
        setForm(prev => ({
            ...prev,
            model3Items: prev.model3Items.filter((_, i) => i !== index)
        }));
    };

    const mutation = useMutation({
        mutationFn: async () => {
            if (form.orderType === "MODEL_3") {
                const payload = {
                    orderType: "MODEL_3",
                    fulfillmentMethod: form.fulfillmentMethod,
                    deliveryAddress: form.fulfillmentMethod === "DELIVERY" ? form.deliveryAddress : undefined,
                    clientNotes: form.clientNotes,
                    items: form.model3Items.map(item => ({
                        readyToWearId: item.readyToWearId,
                        selectedSize: item.selectedSize,
                        quantity: item.quantity
                    }))
                };
                const { data } = await api.post(`/admin/orders/client/${selectedClient}`, payload);
                return data;
            } else {
                const formData = new FormData();
                formData.append("orderType", form.orderType);
                formData.append("fulfillmentMethod", form.fulfillmentMethod);

                if (form.styleSource === "catalog" && form.styleId) {
                    formData.append("styleId", form.styleId);
                } else if (form.styleSource === "custom" && form.customStyleDescription) {
                    formData.append("customStyleDescription", form.customStyleDescription);
                }

                if (form.styleSource === "custom") {
                    form.customImages.forEach(file => formData.append("customStyleImages", file));
                }

                const booleanFabric = form.orderType === "MODEL_1" ? "true" : "false";
                formData.append("clientProvidesFabric", booleanFabric);
                formData.append("useSavedMeasurements", form.useSavedMeasurements ? "true" : "false");

                if (form.fabricNotes) formData.append("fabricNotes", form.fabricNotes);
                if (form.fulfillmentMethod === "DELIVERY" && form.deliveryAddress) formData.append("deliveryAddress", form.deliveryAddress);
                if (form.clientNotes) formData.append("clientNotes", form.clientNotes);

                const { data } = await api.post(`/admin/orders/client/${selectedClient}`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                return data;
            }
        },
        onSuccess: () => {
            toast.success("Order created successfully!");
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            router.push("/admin/orders");
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.message || "Failed to create order.");
        },
    });

    // ── Validation ──
    const canProceedStep1 = !!selectedClient;
    let canProceedStep2 = false;
    if (form.orderType === "MODEL_1" || form.orderType === "MODEL_2") {
        canProceedStep2 = form.styleSource === "catalog" ? !!form.styleId : (!!form.customStyleDescription || form.customImages.length > 0);
    } else if (form.orderType === "MODEL_3") {
        canProceedStep2 = form.model3Items.length > 0;
    }
    const canProceedStep3 = form.fulfillmentMethod === "PICKUP" || (form.fulfillmentMethod === "DELIVERY" && form.deliveryAddress.trim() !== "");
    const canSubmit = step === 3 && canProceedStep3 && mutation.isIdle && !mutation.isPending;

    const estimatedTotal = form.orderType === "MODEL_3"
        ? form.model3Items.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        : null;

    return (
        <div className="min-h-screen bg-[#F4F0F8] xl:flex xl:flex-row pb-20 xl:pb-0">
            {/* Left Box / Main Workflow */}
            <div className="flex-1 p-6 lg:p-12 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="max-w-2xl mx-auto space-y-8">

                    {/* Top Nav */}
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" className="text-[#555] h-9 gap-1.5 -ml-3" onClick={() => router.back()}>
                            <ArrowLeft size={16} /> Back to Orders
                        </Button>
                        <div className="flex items-center gap-1.5">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className={`w-8 h-1.5 rounded-full transition-colors ${step >= s ? "bg-[#C2185B]" : "bg-[#E0E0E0]"}`} />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold text-[#0D0D0D] tracking-tight">Create Order</h1>
                        <p className="text-[#555]">Follow the steps below to configure a new order parameter for your client.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="bg-white rounded-2xl border border-[rgba(0,0,0,0.06)] shadow-sm p-6 lg:p-8 space-y-8"
                        >
                            {/* ── STEP 1: CLIENT ── */}
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0D0D0D]">1. Select Client Profile</h3>
                                        <p className="text-sm text-[#555] mt-1">Search for an existing client to bind this order to.</p>
                                    </div>
                                    {!preselectedClientId ? (
                                        <div>
                                            <Label className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-2 block">Client Database</Label>
                                            <Popover open={openClientCombo} onOpenChange={setOpenClientCombo}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" role="combobox" aria-expanded={openClientCombo} className="w-full justify-between h-12 bg-white font-normal text-base">
                                                        {selectedClient ? selectedClientName : "Search by name, email, or phone..."}
                                                        <Search className="opacity-50" size={16} />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command shouldFilter={false}>
                                                        <CommandInput placeholder="Search..." value={clientSearch} onValueChange={setClientSearch} />
                                                        <CommandList>
                                                            {clientSearch && (!clientResults || clientResults.length === 0) && (
                                                                <CommandEmpty>No clients found.</CommandEmpty>
                                                            )}
                                                            <CommandGroup>
                                                                {(clientResults || []).map((c) => (
                                                                    <CommandItem key={c.id} value={c.id} onSelect={(val) => {
                                                                        setSelectedClient(val === selectedClient ? null : c.id);
                                                                        setSelectedClientName(c.fullName);
                                                                        setOpenClientCombo(false);
                                                                    }}>
                                                                        <div className="flex items-center gap-3 w-full p-1">
                                                                            <div className="w-8 h-8 rounded-full bg-[#C2185B] flex items-center justify-center text-white text-xs font-bold shrink-0">{c.fullName?.charAt(0)}</div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium text-[#0D0D0D] truncate">{c.fullName}</p>
                                                                                <p className="text-xs text-[#999] truncate">{c.email}</p>
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
                                                <div className="mt-4 flex items-center justify-between p-4 rounded-xl border border-[#C2185B]/20 bg-[#C2185B]/5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold shrink-0">{selectedClientName.charAt(0)}</div>
                                                        <div>
                                                            <p className="text-xs text-[#C2185B] uppercase tracking-wider font-semibold mb-0.5">Selected Client</p>
                                                            <span className="text-sm font-medium text-[#0D0D0D]">{selectedClientName}</span>
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedClient(null); setSelectedClientName(""); }} className="h-8 text-xs text-[#C2185B] hover:bg-transparent">Clear</Button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="bg-[#FAFAFA] p-5 rounded-xl border border-[rgba(0,0,0,0.06)] flex items-center gap-4">
                                            <div className="w-12 h-12 bg-[#E0E0E0] rounded-full flex items-center justify-center text-[#555] font-bold text-xl">
                                                {selectedClientName ? selectedClientName.charAt(0) : <Loader2 size={20} className="animate-spin" />}
                                            </div>
                                            <div>
                                                <p className="text-xs text-[#999] uppercase tracking-wider font-semibold mb-0.5">Pre-bound Client</p>
                                                <p className="text-base font-bold text-[#0D0D0D]">{selectedClientName || "Loading profile..."}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── STEP 2: ORDER DETAILS ── */}
                            {step === 2 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0D0D0D]">2. Order Specifications</h3>
                                        <p className="text-sm text-[#555] mt-1">Select the order blueprint and item specifications.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {ORDER_MODELS.map((opt) => {
                                            const isSelected = form.orderType === opt.value;
                                            const Icon = opt.icon;
                                            return (
                                                <button key={opt.value} type="button" onClick={() => setForm({ ...form, orderType: opt.value })}
                                                    className={`relative flex flex-col items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-150 ${isSelected ? "border-[#C2185B] bg-[#FFF5F8]" : "border-[rgba(0,0,0,0.06)] bg-[#FAFAFA] hover:border-[#C2185B]/30"}`}>
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-[#C2185B] text-white shadow-sm" : "text-[#999] bg-white border border-[rgba(0,0,0,0.06)]"}`} style={!isSelected ? { background: opt.bg } : {}}>
                                                        <Icon size={18} style={!isSelected ? { color: opt.color } : {}} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold mb-1 ${isSelected ? "text-[#C2185B]" : "text-[#0D0D0D]"}`}>{opt.label}</p>
                                                        <p className="text-xs text-[#555] leading-relaxed">{opt.desc}</p>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#C2185B] flex items-center justify-center shadow-sm">
                                                            <Check size={12} className="text-white" strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Model 1 / 2 Flow */}
                                    {(form.orderType === "MODEL_1" || form.orderType === "MODEL_2") && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-6 border-t border-[rgba(0,0,0,0.06)] space-y-6">
                                            <div className="flex p-1 bg-[#FAFAFA] border border-[rgba(0,0,0,0.06)] rounded-xl max-w-sm">
                                                <button onClick={() => setForm({ ...form, styleSource: "catalog" })} className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${form.styleSource === "catalog" ? "bg-white shadow-sm text-[#0D0D0D] border border-[rgba(0,0,0,0.04)]" : "text-[#999]"}`}>Catalog Style</button>
                                                <button onClick={() => setForm({ ...form, styleSource: "custom" })} className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-colors ${form.styleSource === "custom" ? "bg-white shadow-sm text-[#0D0D0D] border border-[rgba(0,0,0,0.04)]" : "text-[#999]"}`}>Custom Build</button>
                                            </div>

                                            {form.styleSource === "catalog" ? (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <Label className="text-sm font-semibold text-[#0D0D0D] mb-2 block">Search Catalog</Label>
                                                    <div className="max-w-md">
                                                        <CustomSelect options={styleOptions} value={form.styleId} onChange={(v) => setForm({ ...form, styleId: v })} placeholder="Search styles..." searchable />
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                                    <div>
                                                        <Label className="text-sm font-semibold text-[#0D0D0D] mb-2 block">Custom Description</Label>
                                                        <Textarea value={form.customStyleDescription} onChange={(e) => setForm({ ...form, customStyleDescription: e.target.value })} placeholder="Extensively describe the desired outfit dimensions, cuts, and preferences..." rows={4} className="resize-none" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-sm font-semibold text-[#0D0D0D] mb-2 block">Reference Images <span className="font-normal text-[#999]">(max 5)</span></Label>
                                                        <ImageUploader images={form.customImages} onChange={(imgs) => setForm({ ...form, customImages: imgs })} />
                                                    </div>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Model 3 Flow */}
                                    {form.orderType === "MODEL_3" && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="pt-6 border-t border-[rgba(0,0,0,0.06)] space-y-6">
                                            <Label className="text-sm font-bold text-[#0D0D0D] block">Add Items to List</Label>
                                            <div className="flex flex-col gap-4 items-end bg-[#FAFAFA] p-5 rounded-xl border border-[rgba(0,0,0,0.06)]">
                                                <div className="flex-1 w-full">
                                                    <Label className="text-xs text-[#555] mb-1.5 block font-semibold">Ready-to-Wear</Label>
                                                    <CustomSelect options={rtwOptions} value={activeRtwId} onChange={(v) => setActiveRtwId(v)} placeholder="Search store..." searchable />
                                                </div>
                                                <div className="flex flex-col md:flex-row items-end w-full gap-4">
                                                    <div className="w-full">
                                                        <Label className="text-xs text-[#555] mb-1.5 block font-semibold">Size Variant</Label>
                                                        <CustomSelect
                                                            options={selectedRtwItem?.availableSizes?.map(s => ({ value: s, label: s })) || []}
                                                            value={activeRtwSize} onChange={(v) => setActiveRtwSize(v)} placeholder="Size..." disabled={!activeRtwId}
                                                        />
                                                    </div>
                                                    <div className="w-full ">
                                                        <Label className="text-xs text-[#555] mb-1.5 block font-semibold">Quantity</Label>
                                                        <Input type="number" min="1" value={activeRtwQty} onChange={(e) => setActiveRtwQty(parseInt(e.target.value) || 1)} className="" disabled={!activeRtwId} />
                                                    </div>
                                                    <Button type="button" onClick={handleAddRtwItem} disabled={!activeRtwId || !activeRtwSize || activeRtwQty < 1} className="shrink-0 gap-2 bg-[#0D0D0D] text-white hover:bg-[#333] w-full md:w-auto px-6">
                                                        <Plus size={16} /> Add to List
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* ── STEP 3: FULFILLMENT & NOTES ── */}
                            {step === 3 && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-[#0D0D0D]">3. Fulfillment & Extras</h3>
                                        <p className="text-sm text-[#555] mt-1">Specify how this order will interact with logistics.</p>
                                    </div>

                                    <div className="space-y-6 border-b border-[rgba(0,0,0,0.06)] pb-6">
                                        <Label className="text-sm font-bold text-[#0D0D0D] block">Fulfillment Method</Label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {FULFILLMENT_OPTIONS.map((opt) => {
                                                const isSelected = form.fulfillmentMethod === opt.value;
                                                const Icon = opt.icon;
                                                return (
                                                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, fulfillmentMethod: opt.value })}
                                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150 ${isSelected ? "border-[#C2185B] bg-[#FFF5F8]" : "border-[#E0E0E0] hover:border-[#C2185B]/30"}`}>
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? "bg-[#C2185B] text-white shadow-sm" : "text-[#999] bg-[#FAFAFA]"}`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <span className={`text-base font-semibold ${isSelected ? "text-[#C2185B]" : "text-[#0D0D0D]"}`}>{opt.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {form.fulfillmentMethod === "DELIVERY" && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                                                <Label className="text-sm font-semibold text-[#0D0D0D] mb-2 block">Delivery Address *</Label>
                                                <Textarea value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} placeholder="Full delivery address including state/postcode..." rows={3} className="resize-none" />
                                            </motion.div>
                                        )}
                                    </div>

                                    {(form.orderType === "MODEL_1" || form.orderType === "MODEL_2") && (
                                        <div className="space-y-6 pt-2">
                                            <div className="flex items-center justify-between bg-[#FAFAFA] p-5 rounded-xl border border-[rgba(0,0,0,0.06)]">
                                                <div>
                                                    <Label className="text-sm font-semibold text-[#0D0D0D] flex items-center gap-2 mb-1">Use Saved Measurements</Label>
                                                    <p className="text-xs text-[#555]">Bind backend calculations to client's existing measurement profile.</p>
                                                </div>
                                                <button type="button" onClick={() => setForm({ ...form, useSavedMeasurements: !form.useSavedMeasurements })}
                                                    className={`w-12 h-7 rounded-full relative transition-colors ${form.useSavedMeasurements ? "bg-[#C2185B]" : "bg-[#E0E0E0]"}`}>
                                                    <div className={`w-6 h-6 rounded-full bg-white shadow-sm absolute top-0.5 transition-all ${form.useSavedMeasurements ? "right-0.5" : "left-0.5"}`} />
                                                </button>
                                            </div>
                                            <div>
                                                <Label className="text-sm font-semibold text-[#0D0D0D] mb-2 block">Fabric Notes <span className="text-[#999] font-normal">(Optional)</span></Label>
                                                <Textarea value={form.fabricNotes} onChange={(e) => setForm({ ...form, fabricNotes: e.target.value })} placeholder={form.orderType === "MODEL_1" ? "Notes on the fabric the client will bring..." : "Preferences for the studio sourced fabric..."} rows={3} className="resize-none" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <Label className="text-sm font-semibold text-[#0D0D0D] mb-2 block">Client Notes <span className="text-[#999] font-normal">(Optional)</span></Label>
                                        <Textarea value={form.clientNotes} onChange={(e) => setForm({ ...form, clientNotes: e.target.value })} placeholder="Any special requests or administrative notations..." rows={3} className="resize-none" />
                                    </div>
                                </div>
                            )}

                            {/* Nav Buttons integrated into the card */}
                            <div className="flex items-center justify-between pt-6 border-t border-[rgba(0,0,0,0.06)]">
                                {step > 1 ? (
                                    <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-[#555] font-semibold h-12 px-6 gap-2 rounded-xl">
                                        <ChevronLeft size={16} /> Back
                                    </Button>
                                ) : <div />}

                                {step < 3 && (
                                    <Button
                                        onClick={() => setStep(step + 1)}
                                        disabled={(step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)}
                                        className="bg-[#C2185B] text-white hover:bg-[#A01548] h-12 px-8 gap-2 rounded-xl font-bold shadow-md shadow-[#C2185B]/20"
                                    >
                                        Next Component <ChevronRight size={16} />
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Right Box / Persistent Cart & Summary */}
            <div className="w-full xl:w-[480px] bg-white border-l border-[rgba(0,0,0,0.06)] p-6 lg:p-10 flex flex-col items-center">
                <div className="w-full max-w-sm sticky top-10 space-y-8 flex-1 flex flex-col">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FFF5F8] text-[#C2185B] rounded-full flex items-center justify-center">
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#0D0D0D]">Order Summary</h3>
                            <p className="text-xs text-[#999] uppercase tracking-wider font-semibold">Live Preview</p>
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        {/* Client Summary */}
                        <div className="space-y-2">
                            <p className="text-xs text-[#999] uppercase tracking-wider font-bold">Client Account</p>
                            {selectedClient ? (
                                <p className="text-base font-bold text-[#0D0D0D]">{selectedClientName}</p>
                            ) : (
                                <p className="text-sm text-[#999] italic">Pending selection...</p>
                            )}
                        </div>

                        {/* Order Build Setup */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-[#999] uppercase tracking-wider font-bold">Type Blueprint</p>
                            </div>
                            {form.orderType ? (
                                <div className="bg-[#FAFAFA] border border-[rgba(0,0,0,0.06)] rounded-xl p-4 space-y-3">
                                    <p className="text-sm font-bold text-[#C2185B] flex items-center gap-2">
                                        <Check size={14} /> {ORDER_MODELS.find(m => m.value === form.orderType)?.label}
                                    </p>

                                    {(form.orderType === "MODEL_1" || form.orderType === "MODEL_2") && (
                                        <div className="space-y-1.5 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                                            <p className="text-xs text-[#0D0D0D] flex justify-between"><span className="text-[#555]">Source:</span> <span className="font-semibold">{form.styleSource === "catalog" ? "Catalog Model" : "Custom Built"}</span></p>
                                            <p className="text-xs text-[#0D0D0D] flex justify-between"><span className="text-[#555]">Measurements:</span> <span className="font-semibold">{form.useSavedMeasurements ? "Saved Profile" : "Requires Updating"}</span></p>
                                        </div>
                                    )}

                                    {form.orderType === "MODEL_3" && (
                                        <div className="space-y-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
                                            {form.model3Items.length === 0 ? (
                                                <p className="text-xs text-[#999] italic">No items added yet...</p>
                                            ) : form.model3Items.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-[rgba(0,0,0,0.04)] shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button type="button" onClick={() => removeRtwItem(i)} className="p-1 hover:text-[#C2185B] transition-colors"><X size={12} /></button>
                                                        <p className="text-xs text-[#0D0D0D] font-medium">{item.quantity}x {item.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs font-bold">{formatCurrency(item.price * item.quantity)}</p>
                                                        <p className="text-[9px] text-[#999] uppercase">Size {item.selectedSize}</p>
                                                    </div>
                                                </div>
                                            ))}
                                            {form.model3Items.length > 0 && (
                                                <div className="flex justify-between items-center pt-3 mt-1">
                                                    <p className="text-xs font-bold text-[#0D0D0D]">Subtotal</p>
                                                    <p className="text-sm font-bold text-[#C2185B]">{formatCurrency(estimatedTotal)}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-[#999] italic">Pending configuration...</p>
                            )}
                        </div>

                        {/* Fulfillment Summary */}
                        <div className="space-y-2">
                            <p className="text-xs text-[#999] uppercase tracking-wider font-bold">Fulfillment Logistics</p>
                            <p className="text-sm font-semibold text-[#0D0D0D] bg-[#FAFAFA] p-3 rounded-xl border border-[rgba(0,0,0,0.06)] inline-block">
                                {FULFILLMENT_OPTIONS.find(f => f.value === form.fulfillmentMethod)?.label}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-8">
                        <Button
                            onClick={() => mutation.mutate()}
                            disabled={!canSubmit}
                            className="w-full bg-[#0D0D0D] text-white hover:bg-[#333] h-14 rounded-xl font-bold shadow-xl shadow-black/10 text-base flex justify-center items-center gap-2"
                        >
                            {mutation.isPending ? <><Loader2 size={18} className="animate-spin" /> Committing Order...</> : <><Plus size={18} /> Initialize Order</>}
                        </Button>
                        <p className="text-[11px] text-[#999] text-center mt-3">Finalizing pushes payload parameters directly to active tracking.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function NewOrderPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#C2185B]" /></div>}>
            <NewOrderForm />
        </Suspense>
    );
}
