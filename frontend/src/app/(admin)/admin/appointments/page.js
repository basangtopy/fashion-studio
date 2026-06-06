"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, isToday } from "date-fns";
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, X, AlertTriangle, ChevronLeft, ChevronRight, List, Grid3X3, Save, MessageSquare, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { SkeletonCard } from "@/components/shared/Skeleton";
import EmptyState from "@/components/shared/EmptyState";
import StatusPill from "@/components/shared/StatusPill";
import PageTransition from "@/components/shared/PageTransition";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const STATUS_TABS = ["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"];

const staggerItem = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function AdminAppointmentsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("REQUESTED");
    const [viewMode, setViewMode] = useState("list"); // "list" | "calendar"
    const [confirmModal, setConfirmModal] = useState(null);
    const [confirmedDate, setConfirmedDate] = useState(null);
    const [cancelModal, setCancelModal] = useState(null);
    const [cancelReason, setCancelReason] = useState("");
    const [editingNotes, setEditingNotes] = useState({}); // { [aptId]: string }
    const [savingNotes, setSavingNotes] = useState(null);
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const { data, isLoading } = useQuery({
        queryKey: ["admin-appointments"],
        queryFn: async () => {
            const { data } = await api.get("/appointments");
            return data.data?.appointments || data.data || [];
        },
    });

    const updateAppointment = useMutation({
        mutationFn: async ({ id, status, confirmedDate, adminNotes, cancelReason }) => {
            const body = {};
            if (status) body.status = status;
            if (confirmedDate) body.confirmedDate = confirmedDate;
            if (adminNotes !== undefined) body.adminNotes = adminNotes;
            if (cancelReason) body.cancelReason = cancelReason;
            const { data } = await api.put(`/appointments/${id}`, body);
            return data;
        },
        onSuccess: (_, { status }) => {
            const msg = status === "CONFIRMED" ? "Appointment confirmed" : status === "CANCELLED" ? "Appointment cancelled" : status === "COMPLETED" ? "Appointment marked complete" : "Appointment updated";
            toast.success(msg);
            setConfirmModal(null);
            setCancelModal(null);
            setConfirmedDate(null);
            setCancelReason("");
            queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Action failed"),
    });

    const allAppointments = useMemo(() => Array.isArray(data) ? data : [], [data]);
    const filteredAppointments = allAppointments.filter(a => a.status === activeTab);

    // This week's confirmed appointments
    const now = new Date();
    const startOfCurrentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 7);
    const thisWeekConfirmed = allAppointments.filter(a => {
        if (a.status !== "CONFIRMED") return false;
        const d = new Date(a.confirmedDate || a.requestedDate);
        return d >= startOfCurrentWeek && d < endOfCurrentWeek;
    }).sort((a, b) => new Date(a.confirmedDate || a.requestedDate) - new Date(b.confirmedDate || b.requestedDate));

    // Calendar view helpers
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(calendarMonth);
        const monthEnd = endOfMonth(calendarMonth);
        const calStart = startOfWeek(monthStart);
        const calEnd = endOfWeek(monthEnd);
        return eachDayOfInterval({ start: calStart, end: calEnd });
    }, [calendarMonth]);

    const appointmentsByDate = useMemo(() => {
        const map = {};
        allAppointments.forEach(apt => {
            const dateStr = format(new Date(apt.confirmedDate || apt.requestedDate), "yyyy-MM-dd");
            if (!map[dateStr]) map[dateStr] = [];
            map[dateStr].push(apt);
        });
        return map;
    }, [allAppointments]);

    const handleSaveNotes = async (aptId) => {
        setSavingNotes(aptId);
        try {
            await api.put(`/appointments/${aptId}`, {
                status: allAppointments.find(a => a.id === aptId)?.status || "REQUESTED",
                adminNotes: editingNotes[aptId] || "",
            });
            toast.success("Notes saved");
            queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
            setEditingNotes(prev => { const n = { ...prev }; delete n[aptId]; return n; });
        } catch (err) {
            toast.error("Error", err.response?.data?.message || "Failed to save notes");
        } finally {
            setSavingNotes(null);
        }
    };

    return (
        <PageTransition>
            <div className="pb-20 lg:pb-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D0D0D]">Appointments</h1>
                        <p className="text-sm text-[#999]">Manage fitting and measurement appointments</p>
                    </div>
                    {/* View toggle */}
                    <div className="flex items-center gap-1 bg-[#F4F0F8] rounded-lg p-1">
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === "list" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999] hover:text-[#555]"}`}
                        >
                            <List size={14} /> List
                        </button>
                        <button
                            onClick={() => setViewMode("calendar")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${viewMode === "calendar" ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999] hover:text-[#555]"}`}
                        >
                            <Grid3X3 size={14} /> Calendar
                        </button>
                    </div>
                </div>

                {/* This Week Strip */}
                {thisWeekConfirmed.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl border border-[#E3F2FD] bg-[#E3F2FD]/30"
                    >
                        <p className="text-xs font-semibold text-[#1565C0] uppercase tracking-wider mb-3">
                            <Clock size={12} className="inline mr-1.5" /> This Week — {thisWeekConfirmed.length} confirmed
                        </p>
                        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
                            {thisWeekConfirmed.map(apt => (
                                <div key={apt.id} className="shrink-0 px-4 py-3 rounded-lg bg-white border border-[rgba(0,0,0,0.06)] min-w-[200px] hover:-translate-y-0.5 transition-all duration-200">
                                    <p className="text-sm font-semibold text-[#0D0D0D] truncate">{apt.client?.fullName || "Client"}</p>
                                    <p className="text-xs text-[#1565C0] mt-0.5">
                                        {new Date(apt.confirmedDate || apt.requestedDate).toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })}
                                    </p>
                                    {apt.type && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4F0F8] text-[#555] mt-1 inline-block">{apt.type}</span>}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {viewMode === "list" ? (
                        <motion.div
                            key="list-view"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ duration: 0.2 }}
                        >
                            {/* Status tabs */}
                            <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1 overflow-x-auto">
                                {STATUS_TABS.map((tab) => {
                                    const count = allAppointments.filter(a => a.status === tab).length;
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`relative flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 ${activeTab === tab ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999] hover:text-[#555]"}`}
                                        >
                                            <span className="capitalize">{tab.toLowerCase()}</span>
                                            {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-[#F4F0F8] text-[#555]" : "bg-[rgba(0,0,0,0.05)] text-[#999]"}`}>{count}</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            {isLoading ? (
                                <div className="space-y-4">{[1, 2, 3].map((i) => (
                                    <div key={i} className="rounded-xl border border-[rgba(0,0,0,0.06)] overflow-hidden">
                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <div className="skeleton w-10 h-10 rounded-full" />
                                                <div className="space-y-2 flex-1">
                                                    <div className="skeleton h-4 w-32" />
                                                    <div className="skeleton h-3 w-48" />
                                                </div>
                                                <div className="skeleton h-6 w-20 rounded-full" />
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="skeleton h-3 w-36" />
                                                <div className="skeleton h-3 w-28" />
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="skeleton h-8 w-24 rounded-lg" />
                                                <div className="skeleton h-8 w-20 rounded-lg" />
                                            </div>
                                        </div>
                                    </div>
                                ))}</div>
                            ) : filteredAppointments.length === 0 ? (
                                <EmptyState
                                    icon={CalendarIcon}
                                    title={`No ${activeTab.toLowerCase()} appointments`}
                                    description={activeTab === "REQUESTED" ? "All appointment requests have been handled." : `There are no ${activeTab.toLowerCase()} appointments at this time.`}
                                />
                            ) : (
                                <motion.div
                                    key={activeTab}
                                    initial="hidden"
                                    animate="show"
                                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
                                    className="space-y-4"
                                >
                                    {filteredAppointments.map((apt) => (
                                        <motion.div key={apt.id} variants={staggerItem} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-all duration-200">
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
                                                <StatusPill status={apt.status} />
                                            </div>

                                            {/* Date info */}
                                            <div className="flex flex-wrap gap-4 text-sm text-[#555] mb-3">
                                                <div className="flex items-center gap-1.5">
                                                    <CalendarIcon size={14} className="text-[#999]" />
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
                                            </div>

                                            {apt.clientNotes && (
                                                <p className="text-xs text-[#999] mb-3 italic bg-[#FAFAFA] p-2.5 rounded-lg border border-[rgba(0,0,0,0.04)]">Client note: {apt.clientNotes}</p>
                                            )}

                                            {/* Admin notes display + inline edit */}
                                            {apt.adminNotes && editingNotes[apt.id] === undefined && (
                                                <p className="text-xs text-[#555] mb-3 bg-[#F4F0F8] p-2.5 rounded-lg">Admin: {apt.adminNotes}</p>
                                            )}

                                            {apt.cancelReason && (
                                                <p className="text-xs text-[#C62828] mb-3 bg-[#FFEBEE] p-2.5 rounded-lg border border-[#FFCDD2]">Reason: {apt.cancelReason}</p>
                                            )}

                                            {/* Inline admin notes editor */}
                                            {editingNotes[apt.id] !== undefined && (
                                                <div className="mb-3 space-y-2">
                                                    <Textarea
                                                        value={editingNotes[apt.id]}
                                                        onChange={(e) => setEditingNotes(prev => ({ ...prev, [apt.id]: e.target.value }))}
                                                        placeholder="Add admin notes..."
                                                        rows={2}
                                                        className="resize-none bg-white text-xs"
                                                    />
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleSaveNotes(apt.id)}
                                                            disabled={savingNotes === apt.id}
                                                            className="h-7 text-[11px] px-3 gap-1 bg-[#C2185B] text-white hover:bg-[#A01548]"
                                                        >
                                                            {savingNotes === apt.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                            {savingNotes === apt.id ? "Saving..." : "Save"}
                                                        </Button>
                                                        <Button
                                                            onClick={() => setEditingNotes(prev => { const n = { ...prev }; delete n[apt.id]; return n; })}
                                                            variant="outline"
                                                            className="h-7 text-[11px] px-3"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {activeTab === "REQUESTED" && (
                                                    <>
                                                        <Button
                                                            onClick={() => { setConfirmModal(apt); setConfirmedDate(apt.requestedDate ? new Date(apt.requestedDate) : null); }}
                                                            className="h-8 text-xs gap-1.5 bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] border-0"
                                                            variant="outline"
                                                        >
                                                            <CheckCircle size={14} /> Confirm
                                                        </Button>
                                                        <Button
                                                            onClick={() => { setCancelModal(apt); setCancelReason(""); }}
                                                            className="h-8 text-xs gap-1.5 bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] border-0"
                                                            variant="outline"
                                                        >
                                                            <XCircle size={14} /> Cancel
                                                        </Button>
                                                    </>
                                                )}

                                                {activeTab === "CONFIRMED" && (
                                                    <>
                                                        <Button
                                                            onClick={() => updateAppointment.mutate({ id: apt.id, status: "COMPLETED" })}
                                                            disabled={updateAppointment.isPending}
                                                            className="h-8 text-xs gap-1.5 bg-[#E8F5E9] text-[#2E7D32] hover:bg-[#C8E6C9] border-0"
                                                            variant="outline"
                                                        >
                                                            <CheckCircle size={14} /> Mark Complete
                                                        </Button>
                                                        <Button
                                                            onClick={() => { setCancelModal(apt); setCancelReason(""); }}
                                                            className="h-8 text-xs gap-1.5 bg-[#FFEBEE] text-[#C62828] hover:bg-[#FFCDD2] border-0"
                                                            variant="outline"
                                                        >
                                                            <XCircle size={14} /> Cancel
                                                        </Button>
                                                    </>
                                                )}

                                                {/* Add notes button (all tabs) */}
                                                {editingNotes[apt.id] === undefined && (
                                                    <Button
                                                        onClick={() => setEditingNotes(prev => ({ ...prev, [apt.id]: apt.adminNotes || "" }))}
                                                        variant="outline"
                                                        className="h-8 text-xs gap-1.5 border-[#E0E0E0] text-[#555] hover:border-[#C2185B] hover:text-[#C2185B]"
                                                    >
                                                        <MessageSquare size={12} /> {apt.adminNotes ? "Edit Notes" : "Add Notes"}
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    ) : (
                        /* Calendar View */
                        <motion.div
                            key="calendar-view"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -12 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="rounded-xl border border-[rgba(0,0,0,0.06)] bg-white overflow-hidden">
                                {/* Calendar header */}
                                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
                                    <button
                                        onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                        className="p-1.5 rounded-lg hover:bg-[#F4F0F8] text-[#999] hover:text-[#C2185B] transition-colors"
                                    >
                                        <ChevronLeft size={18} />
                                    </button>
                                    <h3 className="text-sm font-bold text-[#0D0D0D]">
                                        {format(calendarMonth, "MMMM yyyy")}
                                    </h3>
                                    <button
                                        onClick={() => setCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                        className="p-1.5 rounded-lg hover:bg-[#F4F0F8] text-[#999] hover:text-[#C2185B] transition-colors"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>

                                {/* Weekday headers */}
                                <div className="grid grid-cols-7 border-b border-[rgba(0,0,0,0.06)]">
                                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                                        <div key={day} className="py-2 text-center text-[10px] font-semibold text-[#999] uppercase tracking-wider">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7">
                                    {calendarDays.map((day, idx) => {
                                        const dateStr = format(day, "yyyy-MM-dd");
                                        const dayAppointments = appointmentsByDate[dateStr] || [];
                                        const isCurrentMonth = isSameMonth(day, calendarMonth);
                                        const isTodayDate = isToday(day);
                                        const statusCounts = {};
                                        dayAppointments.forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

                                        return (
                                            <div
                                                key={idx}
                                                className={`min-h-[80px] sm:min-h-[100px] p-1.5 border-b border-r border-[rgba(0,0,0,0.04)] transition-colors ${isCurrentMonth ? "bg-white" : "bg-[#FAFAFA]"} ${isTodayDate ? "bg-[#FFF8E1]" : ""}`}
                                            >
                                                <div className={`text-xs font-medium mb-1 ${isTodayDate ? "text-[#C2185B] font-bold" : isCurrentMonth ? "text-[#0D0D0D]" : "text-[#D0D0D0]"}`}>
                                                    {format(day, "d")}
                                                </div>
                                                {dayAppointments.length > 0 && (
                                                    <div className="space-y-0.5">
                                                        {dayAppointments.length <= 2 ? (
                                                            dayAppointments.map(apt => (
                                                                <div
                                                                    key={apt.id}
                                                                    className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate font-medium ${apt.status === "CONFIRMED" ? "bg-[#E3F2FD] text-[#1565C0]" : apt.status === "REQUESTED" ? "bg-[#FFF3E0] text-[#E65100]" : apt.status === "COMPLETED" ? "bg-[#E8F5E9] text-[#2E7D32]" : "bg-[#FFEBEE] text-[#C62828]"}`}
                                                                >
                                                                    {apt.client?.fullName?.split(" ")[0] || "Client"}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <>
                                                                <div className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate font-medium ${dayAppointments[0].status === "CONFIRMED" ? "bg-[#E3F2FD] text-[#1565C0]" : dayAppointments[0].status === "REQUESTED" ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#E8F5E9] text-[#2E7D32]"}`}>
                                                                    {dayAppointments[0].client?.fullName?.split(" ")[0] || "Client"}
                                                                </div>
                                                                <div className="text-[9px] text-[#C2185B] font-semibold px-1">
                                                                    +{dayAppointments.length - 1} more
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className="text-[8px] text-[#999] font-semibold px-0.5 pt-0.5">
                                                            {dayAppointments.length} apt{dayAppointments.length > 1 ? "s" : ""}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Confirm Modal — with premium Calendar date picker */}
                <AnimatePresence>
                    {confirmModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setConfirmModal(null)}>
                            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                                transition={{ type: "spring", duration: 0.3 }}
                                className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-[#0D0D0D]">Confirm Appointment</h3>
                                    <button onClick={() => setConfirmModal(null)} className="p-1 rounded-lg hover:bg-[#F4F0F8] transition-colors"><X size={18} className="text-[#999]" /></button>
                                </div>
                                <p className="text-sm text-[#555] mb-4">
                                    Confirm appointment for <strong>{confirmModal.client?.fullName || confirmModal.user?.fullName || "Client"}</strong>
                                </p>
                                <div className="mb-4">
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Confirmed Date *</label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={`w-full justify-start text-left h-10 border-[1.5px] transition-all duration-200 hover:border-[#C2185B]/60 ${confirmedDate ? "text-[#0D0D0D] border-[#C2185B]" : "text-[#999] border-[#E0E0E0]"}`}
                                            >
                                                <CalendarIcon className="mr-2.5 h-4 w-4 flex-shrink-0" style={{ color: confirmedDate ? "#C2185B" : "#999" }} />
                                                {confirmedDate ? format(confirmedDate, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 z-[90]" style={{ borderColor: "rgba(0,0,0,0.08)", borderRadius: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }} align="start" sideOffset={4}>
                                            <Calendar
                                                mode="single"
                                                selected={confirmedDate}
                                                onSelect={setConfirmedDate}
                                                disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setConfirmModal(null)} className="flex-1 h-10 border-[1.5px]">Cancel</Button>
                                    <Button
                                        onClick={() => updateAppointment.mutate({ id: confirmModal.id, status: "CONFIRMED", confirmedDate: confirmedDate?.toISOString() })}
                                        disabled={!confirmedDate || updateAppointment.isPending}
                                        className="flex-1 h-10 bg-[#2E7D32] text-white hover:bg-[#1B5E20] gap-1.5"
                                    >
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
                            <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.97, opacity: 0 }}
                                transition={{ type: "spring", duration: 0.3 }}
                                className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-[#C62828] flex items-center gap-2">
                                        <AlertTriangle size={18} /> Cancel Appointment
                                    </h3>
                                    <button onClick={() => setCancelModal(null)} className="p-1 rounded-lg hover:bg-[#F4F0F8] transition-colors"><X size={18} className="text-[#999]" /></button>
                                </div>
                                <div className="mb-4">
                                    <label className="text-xs font-medium text-[#555] mb-1.5 block">Reason for cancellation *</label>
                                    <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Enter the reason..." rows={3} className="resize-none bg-white" />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setCancelModal(null)} className="flex-1 h-10 border-[1.5px]">Back</Button>
                                    <Button onClick={() => updateAppointment.mutate({ id: cancelModal.id, status: "CANCELLED", cancelReason })}
                                        disabled={cancelReason.length < 3 || updateAppointment.isPending}
                                        className="flex-1 h-10 bg-[#C62828] text-white hover:bg-[#B71C1C] gap-1.5">
                                        <XCircle size={14} /> {updateAppointment.isPending ? "..." : "Cancel Appointment"}
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </PageTransition>
    );
}
