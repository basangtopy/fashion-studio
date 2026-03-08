"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, CheckCircle, XCircle, X, Save, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { SkeletonCard } from "@/components/shared/Skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const STATUS_TABS = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"];
const STATUS_COLORS = {
    REQUESTED: "bg-[#FFF3E0] text-[#E65100]",
    CONFIRMED: "bg-[#E3F2FD] text-[#1565C0]",
    COMPLETED: "bg-[#E8F5E9] text-[#2E7D32]",
    CANCELLED: "bg-[#FFEBEE] text-[#C62828]",
};

export default function AdminAppointmentsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("REQUESTED");
    const [confirmModal, setConfirmModal] = useState(null); // appointment to confirm
    const [confirmedDate, setConfirmedDate] = useState("");
    const [cancelModal, setCancelModal] = useState(null); // appointment to cancel
    const [cancelReason, setCancelReason] = useState("");
    const [adminNotes, setAdminNotes] = useState({});

    // Fetch all appointments (not filtered by status — we filter client-side)
    const { data, isLoading } = useQuery({
        queryKey: ["admin-appointments"],
        queryFn: async () => {
            const { data } = await api.get("/appointments");
            return data.data?.appointments || data.data || [];
        },
    });

    const updateAppointment = useMutation({
        mutationFn: async ({ id, status, confirmedDate, adminNotes, cancelReason }) => {
            const body = { status };
            if (confirmedDate) body.confirmedDate = confirmedDate;
            if (adminNotes) body.adminNotes = adminNotes;
            if (cancelReason) body.cancelReason = cancelReason;
            const { data } = await api.put(`/appointments/${id}`, body);
            return data;
        },
        onSuccess: (_, { status }) => {
            const msg = status === "CONFIRMED" ? "Appointment confirmed" : status === "CANCELLED" ? "Appointment cancelled" : "Appointment updated";
            toast.success(msg);
            setConfirmModal(null);
            setCancelModal(null);
            setConfirmedDate("");
            setCancelReason("");
            queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Action failed"),
    });

    const allAppointments = Array.isArray(data) ? data : [];
    const filteredAppointments = allAppointments.filter(a => a.status === activeTab);

    // This week's confirmed appointments
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek); endOfWeek.setDate(endOfWeek.getDate() + 7);
    const thisWeekConfirmed = allAppointments.filter(a => {
        if (a.status !== "CONFIRMED") return false;
        const d = new Date(a.confirmedDate || a.requestedDate);
        return d >= startOfWeek && d < endOfWeek;
    }).sort((a, b) => new Date(a.confirmedDate || a.requestedDate) - new Date(b.confirmedDate || b.requestedDate));

    const saveAdminNotes = (aptId) => {
        updateAppointment.mutate({ id: aptId, status: undefined, adminNotes: adminNotes[aptId] || "" });
    };

    return (
        <div className="pb-20 lg:pb-0">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0D0D0D]">Appointments</h1>
                <p className="text-sm text-[#999]">Manage fitting and measurement appointments</p>
            </div>

            {/* This Week Strip */}
            {thisWeekConfirmed.length > 0 && (
                <div className="mb-6 p-4 rounded-xl border border-[#E3F2FD] bg-[#E3F2FD]/30">
                    <p className="text-xs font-semibold text-[#1565C0] uppercase tracking-wider mb-3">
                        <Clock size={12} className="inline mr-1.5" /> This Week — {thisWeekConfirmed.length} confirmed
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                        {thisWeekConfirmed.map(apt => (
                            <div key={apt.id} className="shrink-0 px-4 py-3 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] min-w-[200px]">
                                <p className="text-sm font-semibold text-[#0D0D0D] truncate">{apt.client?.fullName || apt.user?.fullName || "Client"}</p>
                                <p className="text-xs text-[#1565C0] mt-0.5">
                                    {new Date(apt.confirmedDate || apt.requestedDate).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                                </p>
                                {apt.type && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4F0F8] text-[#555] mt-1 inline-block">{apt.type}</span>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Status tabs */}
            <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1 overflow-x-auto">
                {STATUS_TABS.map((tab) => {
                    const count = allAppointments.filter(a => a.status === tab).length;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === tab ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999] hover:text-[#555]"}`}
                        >
                            <span className="capitalize">{tab.toLowerCase()}</span>
                            {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-[#F4F0F8] text-[#555]" : "bg-[rgba(0,0,0,0.05)] text-[#999]"}`}>{count}</span>}
                        </button>
                    );
                })}
            </div>

            {isLoading ? (
                <div className="space-y-4">{[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-[120px]" />)}</div>
            ) : filteredAppointments.length === 0 ? (
                <div className="p-12 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <Calendar size={28} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No {activeTab.toLowerCase()} appointments.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map((apt) => (
                        <div key={apt.id} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                            <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                        {apt.client?.fullName?.charAt(0) || apt.user?.fullName?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#0D0D0D]">{apt.client?.fullName || apt.user?.fullName || "Client"}</p>
                                        <p className="text-xs text-[#999]">{apt.client?.email || apt.user?.email}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[apt.status]}`}>{apt.status}</span>
                            </div>

                            {/* Date info */}
                            <div className="flex flex-wrap gap-4 text-sm text-[#555] mb-3">
                                <div className="flex items-center gap-1.5">
                                    <Calendar size={14} className="text-[#999]" />
                                    <span>
                                        Requested: {apt.requestedDate
                                            ? new Date(apt.requestedDate).toLocaleDateString("en-NG", { dateStyle: "medium" })
                                            : "No date"}
                                    </span>
                                </div>
                                {apt.confirmedDate && (
                                    <div className="flex items-center gap-1.5">
                                        <CheckCircle size={14} className="text-[#2E7D32]" />
                                        <span className="text-[#2E7D32] font-medium">
                                            Confirmed: {new Date(apt.confirmedDate).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                                        </span>
                                    </div>
                                )}
                                {apt.type && <span className="text-xs px-2 py-0.5 rounded bg-[#F4F0F8] text-[#555]">{apt.type}</span>}
                            </div>

                            {apt.clientNotes && (
                                <p className="text-xs text-[#999] mb-3 italic bg-[#FAFAFA] p-2 rounded-lg">Client note: {apt.clientNotes}</p>
                            )}

                            {apt.adminNotes && (
                                <p className="text-xs text-[#555] mb-3 bg-[#F4F0F8] p-2 rounded-lg">Admin: {apt.adminNotes}</p>
                            )}

                            {apt.cancelReason && (
                                <p className="text-xs text-[#C62828] mb-3 bg-[#FFEBEE] p-2 rounded-lg">Reason: {apt.cancelReason}</p>
                            )}

                            {/* Actions */}
                            {activeTab === "REQUESTED" && (
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => { setConfirmModal(apt); setConfirmedDate(apt.requestedDate ? new Date(apt.requestedDate).toISOString().split("T")[0] : ""); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold hover:bg-[#C8E6C9] transition-colors">
                                        <CheckCircle size={14} /> Confirm
                                    </button>
                                    <button onClick={() => { setCancelModal(apt); setCancelReason(""); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFEBEE] text-[#C62828] text-xs font-semibold hover:bg-[#FFCDD2] transition-colors">
                                        <XCircle size={14} /> Cancel
                                    </button>
                                </div>
                            )}

                            {activeTab === "CONFIRMED" && (
                                <div className="flex gap-2 pt-1">
                                    <button onClick={() => updateAppointment.mutate({ id: apt.id, status: "COMPLETED" })}
                                        disabled={updateAppointment.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold hover:bg-[#C8E6C9] transition-colors">
                                        <CheckCircle size={14} /> Mark Complete
                                    </button>
                                    <button onClick={() => { setCancelModal(apt); setCancelReason(""); }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFEBEE] text-[#C62828] text-xs font-semibold hover:bg-[#FFCDD2] transition-colors">
                                        <XCircle size={14} /> Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Modal — with date picker */}
            <AnimatePresence>
                {confirmModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setConfirmModal(null)}>
                        <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }}
                            className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[#0D0D0D]">Confirm Appointment</h3>
                                <button onClick={() => setConfirmModal(null)}><X size={18} className="text-[#999]" /></button>
                            </div>
                            <p className="text-sm text-[#555] mb-4">
                                Confirm appointment for <strong>{confirmModal.client?.fullName || confirmModal.user?.fullName || "Client"}</strong>
                            </p>
                            <div className="mb-4">
                                <label className="text-xs text-[#999] mb-1 block">Confirmed Date *</label>
                                <Input type="date" value={confirmedDate} onChange={(e) => setConfirmedDate(e.target.value)} className="h-10 bg-white" />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setConfirmModal(null)} className="flex-1">Cancel</Button>
                                <Button onClick={() => updateAppointment.mutate({ id: confirmModal.id, status: "CONFIRMED", confirmedDate })}
                                    disabled={!confirmedDate || updateAppointment.isPending}
                                    className="flex-1 bg-[#2E7D32] text-white hover:bg-[#1B5E20] gap-1.5">
                                    <CheckCircle size={14} /> {updateAppointment.isPending ? "..." : "Confirm"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cancel Modal — requires reason */}
            <AnimatePresence>
                {cancelModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setCancelModal(null)}>
                        <motion.div initial={{ scale: 0.97 }} animate={{ scale: 1 }} exit={{ scale: 0.97 }}
                            className="bg-white rounded-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-[#C62828] flex items-center gap-2">
                                    <AlertTriangle size={18} /> Cancel Appointment
                                </h3>
                                <button onClick={() => setCancelModal(null)}><X size={18} className="text-[#999]" /></button>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs text-[#999] mb-1 block">Reason for cancellation *</label>
                                <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Enter the reason..." rows={3} className="resize-none bg-white" />
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => setCancelModal(null)} className="flex-1">Back</Button>
                                <Button onClick={() => updateAppointment.mutate({ id: cancelModal.id, status: "CANCELLED", cancelReason })}
                                    disabled={cancelReason.length < 3 || updateAppointment.isPending}
                                    className="flex-1 bg-[#C62828] text-white hover:bg-[#B71C1C] gap-1.5">
                                    <XCircle size={14} /> {updateAppointment.isPending ? "..." : "Cancel Appointment"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
