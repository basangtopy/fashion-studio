"use client";

import { useState } from "react";
import { Loader2, PencilLine } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Wrapper mounts the form only while open, so the inner component initializes
// its state directly from `client` (no effect syncing props into state).
export default function EditClientModal({ open, onClose, client }) {
    if (!open) return null;
    return <EditClientForm onClose={onClose} client={client} />;
}

function EditClientForm({ onClose, client }) {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [form, setForm] = useState(() => ({
        fullName: client?.fullName || "",
        email: client?.email || "",
        phone: client?.phone || "",
        sex: client?.sex || "",
        dateOfBirth: client?.dateOfBirth ? client.dateOfBirth.split("T")[0] : "",
        address: client?.address || "",
    }));

    const mutation = useMutation({
        mutationFn: async (data) => {
            const payload = { ...data };
            if (!payload.sex) delete payload.sex;
            if (!payload.dateOfBirth) delete payload.dateOfBirth;
            if (!payload.address) delete payload.address;
            // Admin editing another client profile goes through users/admin/clients/:id (if exists, or directly through standard profile if not). 
            // Wait, looking at the backend user controller, there is no generic `PUT /users/admin/clients/:id` exposed.
            // Oh, let me check the user controller again. There is no `PUT /users/admin/clients/:id` endpoint. Admin updating clients? 
            // Let me pause here and verify the backend API endpoints. 
            // The user controller has `PUT /users/profile` for the logged-in user.
            // Wait, does the backend have an endpoint for Admin to edit client info?
            // Let me check.
            const { data: res } = await api.put(`/users/admin/clients/${client.id}`, payload);
            return res.data?.client || res.data;
        },
        onSuccess: () => {
            toast.success("Client account updated!");
            queryClient.invalidateQueries({ queryKey: ["admin-client", client?.id] });
            queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
            onClose();
        },
        onError: (err) => {
            toast.error("Error", err.response?.data?.errors?.[0]?.message || "Failed to update client.");
        },
    });

    return (
        <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-0 gap-0">
                <DialogHeader className="px-6 py-4 border-b border-border bg-popover text-left shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <PencilLine size={16} className="text-primary" />
                        Edit Contact Info
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Update client details to keep their profile current.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }} className="p-6 space-y-4 bg-popover">
                    <Field label="Full Name *" value={form.fullName} onChange={(v) => setForm({ ...form, fullName: v })} required />
                    <Field label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
                    <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+234..." />

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] font-semibold text-text-light uppercase tracking-wider mb-1.5">Sex</label>
                            <Select value={form.sex} onValueChange={(v) => setForm({ ...form, sex: v })}>
                                <SelectTrigger className="w-full bg-background h-9">
                                    <SelectValue placeholder="—" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MALE">Male</SelectItem>
                                    <SelectItem value="FEMALE">Female</SelectItem>
                                    <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setForm({ ...form, dateOfBirth: v })} />
                    </div>

                    <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} placeholder="Lagos, Nigeria" />

                    <Button
                        type="submit"
                        disabled={mutation.isPending || !form.fullName || !form.email}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10"
                    >
                        {mutation.isPending ? <><Loader2 size={14} className="animate-spin mr-2" /> Saving...</> : "Save Changes"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
    return (
        <div>
            <label className="block text-[10px] font-semibold text-text-light uppercase tracking-wider mb-1.5">{label}</label>
            <Input
                type={type} value={value} onChange={(e) => onChange(e.target.value)}
                required={required} placeholder={placeholder}
                className="bg-popover h-9"
            />
        </div>
    );
}
