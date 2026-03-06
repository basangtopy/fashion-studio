"use client";

import { useState } from "react";
import { Calendar, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonCard } from "@/components/shared/Skeleton";

const STATUS_TABS = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"];

const STATUS_COLORS = {
    REQUESTED: { bg: "bg-[#FFF3E0]", text: "text-[#E65100]" },
    CONFIRMED: { bg: "bg-[#E3F2FD]", text: "text-[#1565C0]" },
    COMPLETED: { bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]" },
    CANCELLED: { bg: "bg-[#FFEBEE]", text: "text-[#C62828]" },
};

export default function AdminAppointmentsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("REQUESTED");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-appointments", activeTab],
        queryFn: async () => {
            const { data } = await api.get("/appointments", { params: { status: activeTab } });
            return data.data?.appointments || data.data || [];
        },
    });

    const updateAppointment = useMutation({
        mutationFn: async ({ id, status, scheduledDate, notes }) => {
            const body = { status };
            if (scheduledDate) body.scheduledDate = scheduledDate;
            if (notes) body.notes = notes;
            const { data } = await api.put(`/appointments/${id}`, body);
            return data;
        },
        onSuccess: (_, { status }) => {
            const msg = status === "CONFIRMED" ? "Appointment confirmed" : status === "CANCELLED" ? "Appointment cancelled" : "Appointment updated";
            toast.success(msg);
            queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Action failed"),
    });

    const appointments = Array.isArray(data) ? data : [];

    return (
        <div className="pb-20 lg:pb-0">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0D0D0D]">Appointments</h1>
                <p className="text-sm text-[#999]">Manage fitting and measurement appointments</p>
            </div>

            {/* Status tabs */}
            <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1 overflow-x-auto">
                {STATUS_TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${activeTab === tab ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999] hover:text-[#555]"}`}
                    >
                        {tab.toLowerCase()}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-[100px]" />)}
                </div>
            ) : appointments.length === 0 ? (
                <div className="p-12 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <Calendar size={28} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No {activeTab.toLowerCase()} appointments.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {appointments.map((apt) => {
                        const colors = STATUS_COLORS[apt.status] || STATUS_COLORS.REQUESTED;
                        return (
                            <div key={apt.id} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                            {apt.client?.fullName?.charAt(0) || apt.user?.fullName?.charAt(0) || "?"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-[#0D0D0D]">
                                                {apt.client?.fullName || apt.user?.fullName || "Client"}
                                            </p>
                                            <p className="text-xs text-[#999]">
                                                {apt.client?.email || apt.user?.email}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                                        {apt.status}
                                    </span>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-[#555] mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-[#999]" />
                                        <span>
                                            {apt.preferredDate
                                                ? new Date(apt.preferredDate).toLocaleDateString("en-NG", { dateStyle: "medium" })
                                                : apt.scheduledDate
                                                    ? new Date(apt.scheduledDate).toLocaleDateString("en-NG", { dateStyle: "medium" })
                                                    : "No date"}
                                        </span>
                                    </div>
                                    {apt.preferredTime && (
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-[#999]" />
                                            <span>{apt.preferredTime}</span>
                                        </div>
                                    )}
                                    {apt.type && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-[#F4F0F8] text-[#555]">{apt.type}</span>
                                    )}
                                </div>

                                {apt.notes && (
                                    <p className="text-xs text-[#999] mb-3 italic">Note: {apt.notes}</p>
                                )}

                                {activeTab === "REQUESTED" && (
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => updateAppointment.mutate({ id: apt.id, status: "CONFIRMED" })}
                                            disabled={updateAppointment.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold hover:bg-[#C8E6C9] transition-colors"
                                        >
                                            <CheckCircle size={14} /> Confirm
                                        </button>
                                        <button
                                            onClick={() => updateAppointment.mutate({ id: apt.id, status: "CANCELLED" })}
                                            disabled={updateAppointment.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFEBEE] text-[#C62828] text-xs font-semibold hover:bg-[#FFCDD2] transition-colors"
                                        >
                                            <XCircle size={14} /> Cancel
                                        </button>
                                    </div>
                                )}

                                {activeTab === "CONFIRMED" && (
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            onClick={() => updateAppointment.mutate({ id: apt.id, status: "COMPLETED" })}
                                            disabled={updateAppointment.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold hover:bg-[#C8E6C9] transition-colors"
                                        >
                                            <CheckCircle size={14} /> Mark Complete
                                        </button>
                                        <button
                                            onClick={() => updateAppointment.mutate({ id: apt.id, status: "CANCELLED" })}
                                            disabled={updateAppointment.isPending}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFEBEE] text-[#C62828] text-xs font-semibold hover:bg-[#FFCDD2] transition-colors"
                                        >
                                            <XCircle size={14} /> Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
