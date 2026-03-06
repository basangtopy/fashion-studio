"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, UserPlus, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CreateClientModal({ open, onClose, onCreated }) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        fullName: "", email: "", phone: "", sex: "", dateOfBirth: "", address: "",
    });

    const mutation = useMutation({
        mutationFn: async (data) => {
            const payload = { ...data };
            if (!payload.sex) delete payload.sex;
            if (!payload.dateOfBirth) delete payload.dateOfBirth;
            if (!payload.address) delete payload.address;
            const { data: res } = await api.post("/users/admin/clients", payload);
            return res.data?.client || res.data;
        },
        onSuccess: (client) => {
            toast.success("Client account created!");
            queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
            setForm({ fullName: "", email: "", phone: "", sex: "", dateOfBirth: "", address: "" });
            onClose();
            if (onCreated) onCreated(client);
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.message || "Failed to create client.");
        },
    });

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b border-[rgba(0,0,0,0.06)] bg-white text-left shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-[#0D0D0D]">
                        <UserPlus size={16} className="text-[#C2185B]" />
                        Add New Client
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Enter client details to create a new profile.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="p-6 space-y-4 bg-white">
                    <Field label="Full Name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
                    <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                    <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+234..." />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">Sex</label>
                            <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                                <SelectTrigger className="w-full bg-white h-9">
                                    <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MALE">Male</SelectItem>
                                    <SelectItem value="FEMALE">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
                    </div>

                    <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Lagos, Nigeria" />

                    <Button
                        type="submit"
                        disabled={mutation.isPending || !form.fullName || !form.email}
                        className="w-full bg-[#C2185B] text-white hover:bg-[#A01548] h-10"
                    >
                        {mutation.isPending ? <><Loader2 size={14} className="animate-spin mr-2" /> Creating...</> : "Create Client"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
    return (
        <div>
            <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wider mb-1.5">{label}</label>
            <Input
                type={type} value={value} onChange={(e) => onChange(e.target.value)}
                required={required} placeholder={placeholder}
                className="bg-white h-9"
            />
        </div>
    );
}
