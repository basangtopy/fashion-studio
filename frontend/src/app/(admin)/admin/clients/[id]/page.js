"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, ShoppingBag, CreditCard,
    Ruler, CheckCircle2, XCircle, Plus, Pencil, MessageSquare, ChevronDown, ChevronUp, Download, FileText, History, Clock
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonCard } from "@/components/shared/Skeleton";
import MeasurementFormModal from "@/components/admin/MeasurementFormModal";
import EditClientModal from "@/components/admin/EditClientModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toaster";
import { motion, AnimatePresence } from "framer-motion";


const TABS = ["overview", "orders", "measurements", "payments", "chat"];

// Fields to exclude from measurement display
const MEASUREMENT_META = ["id", "clientId", "client", "createdAt", "updatedAt", "disclaimerSignedAt", "updatedById", "notes", "customParams"];

// Group measurements for display
const UPPER_BODY = ["bust", "underBust", "shoulder", "sleeveLength", "armhole", "bicep", "wrist", "frontLength", "backLength", "neckToWaist", "acrossFront", "acrossBack"];
const LOWER_BODY = ["waist", "hips", "fullLength", "kneeLength", "thigh", "calf", "ankle", "inseam", "outseam", "crotchDepth"];

function groupMeasurements(measurement) {
    if (!measurement) return { upper: [], lower: [], other: [] };
    const upper = [];
    const lower = [];
    const other = [];

    Object.entries(measurement).forEach(([key, val]) => {
        if (MEASUREMENT_META.includes(key) || val === null || val === undefined) return;
        if (typeof val === "object") return; // Skip nested objects
        const item = { key, val };
        if (UPPER_BODY.includes(key)) upper.push(item);
        else if (LOWER_BODY.includes(key)) lower.push(item);
        else other.push(item);
    });

    return { upper, lower, other };
}

export default function AdminClientDetailPage() {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("overview");
    const [measurementFormOpen, setMeasurementFormOpen] = useState(false);
    const [editClientOpen, setEditClientOpen] = useState(false);
    const toast = useToast();


    const { data: client, isLoading } = useQuery({
        queryKey: ["admin-client", id],
        queryFn: async () => {
            const { data } = await api.get(`/users/admin/clients/${id}`);
            return data.data?.client || data.data;
        },
    });

    const { data: clientOrders } = useQuery({
        queryKey: ["admin-client-orders", id],
        queryFn: async () => {
            const { data } = await api.get("/admin/orders", { params: { clientId: id } });
            return data.data?.orders || data.data || [];
        },
        enabled: activeTab === "orders" || activeTab === "overview",
    });

    const { data: measurementData } = useQuery({
        queryKey: ["admin-client-measurements", id],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${id}`);
            return data.data; // { client, measurement }
        },
        enabled: activeTab === "measurements" || activeTab === "overview",
    });

    const { data: measurementHistory } = useQuery({
        queryKey: ["admin-client-measurements-history", id],
        queryFn: async () => {
            const { data } = await api.get(`/measurements/${id}/history`);
            return data.data?.history || data.data || [];
        },
        enabled: activeTab === "measurements",
    });

    const { data: clientPaymentsList } = useQuery({
        queryKey: ["admin-client-payments", id],
        queryFn: async () => {
            const { data } = await api.get(`/admin/payments`, { params: { clientId: id } });
            return data.data?.payments || data.data || [];
        },
        enabled: !!clientOrders, // Fetch once orders exist
    });

    const clientMeasurements = measurementData?.measurement || null;
    const measurementsHistoryList = Array.isArray(measurementHistory) ? measurementHistory : [];
    const paymentsList = Array.isArray(clientPaymentsList) ? clientPaymentsList : [];

    const handleExportMeasurements = async (format) => {
        try {
            const response = await api.get(`/measurements/export?clientId=${id}&format=${format}`, {
                responseType: "blob",
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `client-${id}-measurements.${format}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Download Successful", `Measurements exported as ${format.toUpperCase()}`);
        } catch (error) {
            toast.error("Download Failed", "Failed to export measurements. Please try again.");
        }
    };


    if (isLoading) {
        return (
            <div className="pb-20 lg:pb-0">
                <div className="skeleton h-8 w-40 mb-6" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SkeletonCard className="h-[300px]" />
                    <div className="lg:col-span-2"><SkeletonCard className="h-[300px]" /></div>
                </div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-12">
                <p className="text-[#555]">Client not found.</p>
                <Link href="/admin/clients" className="text-sm text-[#C2185B] font-semibold mt-2 inline-block">
                    ← Back to Clients
                </Link>
            </div>
        );
    }

    const orders = Array.isArray(clientOrders) ? clientOrders : [];
    const groups = groupMeasurements(clientMeasurements);
    const customParams = clientMeasurements?.customParams;

    return (
        <div className="pb-20 lg:pb-0">
            <Link href="/admin/clients" className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#C2185B] mb-6 transition-colors">
                <ArrowLeft size={14} /> All Clients
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Client Profile Card */}
                <div className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-xl mb-3">
                            {client.fullName?.charAt(0) || "?"}
                        </div>
                        <h2 className="text-lg font-bold text-[#0D0D0D]">{client.fullName}</h2>
                        <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-2 h-2 rounded-full ${client.online ? "bg-[#2E7D32]" : "bg-[#999]"}`} />
                            <span className={`text-xs ${client.online ? "text-[#2E7D32] font-medium" : "text-[#999]"}`}>
                                {client.online ? "Online now" : "Offline"}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3 text-sm">
                        <InfoRow icon={Mail} label="Email" value={client.email} />
                        <InfoRow icon={Phone} label="Phone" value={client.phone || "—"} />
                        <InfoRow icon={User} label="Sex" value={client.sex || "—"} />
                        <InfoRow icon={MapPin} label="Address" value={client.address || "—"} />
                        <InfoRow icon={Calendar} label="Joined" value={new Date(client.createdAt).toLocaleDateString("en-NG")} />
                        <InfoRow icon={client.isEmailVerified ? CheckCircle2 : XCircle} label="Verified" value={client.isEmailVerified ? "Yes" : "No"} />
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="p-3 rounded-lg bg-[#F4F0F8] text-center">
                            <p className="text-lg font-bold text-[#0D0D0D]">{client._count?.orders || 0}</p>
                            <p className="text-[10px] text-[#999] uppercase">Orders</p>
                        </div>
                        <div className="p-3 rounded-lg bg-[#F4F0F8] text-center">
                            <p className="text-lg font-bold text-[#0D0D0D]">{client._count?.payments || 0}</p>
                            <p className="text-[10px] text-[#999] uppercase">Payments</p>
                        </div>
                    </div>
                </div>

                {/* Main content with tabs */}
                <div className="lg:col-span-3">
                    <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1 overflow-x-auto">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab
                                    ? "bg-white text-[#0D0D0D] shadow-sm"
                                    : "text-[#999] hover:text-[#555]"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                                        <p className="text-2xl font-bold text-[#0D0D0D]">{client._count?.orders || orders.length}</p>
                                        <p className="text-[10px] text-[#999] uppercase tracking-wider mt-1">Total Orders</p>
                                    </div>
                                    <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                                        <p className="text-2xl font-bold font-mono-data text-[#0D0D0D]">
                                            {formatCurrency(paymentsList.filter(p => p.status === "CONFIRMED" || p.status === "COMPLETED" || p.status === "SUCCESS").reduce((sum, p) => sum + (Number(p.amount) || 0), 0))}
                                        </p>
                                        <p className="text-[10px] text-[#999] uppercase tracking-wider mt-1">Total Spend</p>
                                    </div>
                                    <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                                        <p className="text-2xl font-bold font-mono-data text-[#0D0D0D]">
                                            {orders.length > 0 ? formatCurrency(orders.reduce((sum, o) => sum + (Number(o.totalAgreedFee) || 0), 0) / orders.length) : formatCurrency(0)}
                                        </p>
                                        <p className="text-[10px] text-[#999] uppercase tracking-wider mt-1">Avg Order Value</p>
                                    </div>
                                </div>

                                {/* Contact info */}
                                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-[#0D0D0D]">Contact Info</h3>
                                        <button onClick={() => setEditClientOpen(true)} className="text-[#999] hover:text-[#C2185B] transition-colors" title="Edit Contact Info">
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <InfoRow icon={Mail} label="Email" value={client.email} />
                                        <InfoRow icon={Phone} label="Phone" value={client.phone || "—"} />
                                        <InfoRow icon={MapPin} label="Address" value={client.address || "—"} />
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                    <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Recent Orders</h3>
                                    {orders.length === 0 ? (
                                        <p className="text-sm text-[#999]">No orders yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {orders.slice(0, 5).map((order) => (
                                                <Link key={order.id} href={`/admin/orders/${order.id}`}
                                                    className="flex items-center justify-between p-3 rounded-lg hover:bg-[#FAFAFA] transition-colors">
                                                    <div>
                                                        <p className="text-xs font-mono text-[#999]">{order.orderNumber}</p>
                                                        <p className="text-sm font-medium text-[#0D0D0D]">{order.style?.name || ORDER_TYPES[order.orderType]?.label || "Order"}</p>
                                                    </div>
                                                    <StatusPill status={order.status} size="small" />
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {clientMeasurements && (
                                    <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                        <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Measurements</h3>
                                        <MeasurementGrid items={[...groups.upper.slice(0, 4), ...groups.lower.slice(0, 4)]} />
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Orders Tab */}
                        {activeTab === "orders" && (
                            <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-3">
                                <div className="flex justify-end mb-2">
                                    <Link href={`/admin/orders/new?client=${id}`}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C2185B] text-white text-xs font-semibold hover:bg-[#A01548] transition-colors">
                                        <Plus size={14} /> Create Order
                                    </Link>
                                </div>
                                {orders.length === 0 ? (
                                    <div className="p-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                                        <ShoppingBag size={24} className="text-[#999] mx-auto mb-2" />
                                        <p className="text-sm text-[#555]">No orders from this client.</p>
                                    </div>
                                ) : (
                                    orders.map((order) => (
                                        <Link key={order.id} href={`/admin/orders/${order.id}`}
                                            className="flex items-center justify-between p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors block">
                                            <div>
                                                <p className="text-xs font-mono text-[#999]">{order.orderNumber}</p>
                                                <p className="text-sm font-medium text-[#0D0D0D]">{order.style?.name || ORDER_TYPES[order.orderType]?.label}</p>
                                                <p className="text-xs text-[#999] mt-1">{new Date(order.createdAt).toLocaleDateString("en-NG")}</p>
                                            </div>
                                            <div className="text-right">
                                                <StatusPill status={order.status} size="small" />
                                                {order.totalAgreedFee && (
                                                    <p className="text-xs font-mono font-semibold text-[#0D0D0D] mt-1">{formatCurrency(order.totalAgreedFee)}</p>
                                                )}
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </motion.div>
                        )}

                        {/* Measurements Tab */}
                        {activeTab === "measurements" && (
                            <motion.div key="measurements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-[#0D0D0D]">Detailed Measurements</h2>
                                        <p className="text-sm text-[#555]">All dimensions are in centimeters (cm)</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {clientMeasurements && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-[rgba(0,0,0,0.12)] text-[#0D0D0D] text-xs font-semibold hover:bg-[#FAFAFA] transition-colors">
                                                        <Download size={14} /> Export <ChevronDown size={14} />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-40 border-[rgba(0,0,0,0.08)] shadow-lg rounded-xl">
                                                    <DropdownMenuItem onClick={() => handleExportMeasurements("csv")} className="cursor-pointer gap-2 text-sm focus:bg-[#FAFAFA] text-[#0D0D0D] py-2.5">
                                                        <FileText size={14} className="text-[#999]" /> Export as CSV
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleExportMeasurements("pdf")} className="cursor-pointer gap-2 text-sm focus:bg-[#FAFAFA] text-[#0D0D0D] py-2.5">
                                                        <FileText size={14} className="text-[#999]" /> Export as PDF
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                        <button onClick={() => setMeasurementFormOpen(true)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C2185B] text-white text-xs font-semibold hover:bg-[#A01548] transition-colors">
                                            {clientMeasurements ? <><Pencil size={14} /> Edit</> : <><Plus size={14} /> Add Measurements</>}
                                        </button>
                                    </div>
                                </div>
                                {clientMeasurements ? (
                                    <>
                                        {groups.upper.length > 0 && (
                                            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Upper Body</h3>
                                                <MeasurementGrid items={groups.upper} />
                                            </div>
                                        )}
                                        {groups.lower.length > 0 && (
                                            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Lower Body</h3>
                                                <MeasurementGrid items={groups.lower} />
                                            </div>
                                        )}
                                        {groups.other.length > 0 && (
                                            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Other</h3>
                                                <MeasurementGrid items={groups.other} />
                                            </div>
                                        )}
                                        {customParams && typeof customParams === "object" && Object.keys(customParams).length > 0 && (
                                            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-4">Custom Measurements</h3>
                                                <MeasurementGrid
                                                    items={Object.entries(customParams)
                                                        .filter(([, v]) => v !== null && v !== undefined)
                                                        .map(([key, val]) => ({ key, val }))}
                                                />
                                            </div>
                                        )}
                                        {clientMeasurements.notes && (
                                            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                                                <h3 className="text-sm font-semibold text-[#0D0D0D] mb-2">Notes</h3>
                                                <p className="text-sm text-[#555]">{clientMeasurements.notes}</p>
                                            </div>
                                        )}
                                        {/* History Accordion */}
                                        {measurementsHistoryList.length > 0 && (
                                            <div className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white mt-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <History size={16} className="text-[#C2185B]" />
                                                    <h3 className="text-sm font-semibold text-[#0D0D0D]">Measurement History</h3>
                                                </div>
                                                <div className="space-y-4">
                                                    {measurementsHistoryList.map((hist) => (
                                                        <HistoryAccordionItem key={hist.id} hist={hist} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="p-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                                        <Ruler size={24} className="text-[#999] mx-auto mb-2" />
                                        <p className="text-sm text-[#555]">No measurements recorded.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {activeTab === "payments" && (
                            <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <ClientPaymentsTab clientId={id} orders={orders} preFetchedPayments={paymentsList} />
                            </motion.div>
                        )}

                        {/* Chat History Tab */}
                        {activeTab === "chat" && (
                            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <ClientChatHistoryTab clientId={id} orders={orders} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modals */}
            <MeasurementFormModal open={measurementFormOpen} onClose={() => setMeasurementFormOpen(false)} clientId={id} existingMeasurement={clientMeasurements} />
            <EditClientModal open={editClientOpen} onClose={() => setEditClientOpen(false)} client={client} />
        </div>
    );
}

function MeasurementGrid({ items }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(({ key, val }) => (
                <div key={key} className="p-3 rounded-lg bg-[#F4F0F8]">
                    <p className="text-xs text-[#999] capitalize mb-1">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                    <p className="text-lg font-bold text-[#0D0D0D]">
                        {val} {typeof val === "number" ? <span className="text-xs font-normal text-[#999]">cm</span> : null}
                    </p>
                </div>
            ))}
        </div>
    );
}

function ClientPaymentsTab({ clientId, orders, preFetchedPayments }) {
    const { data: payments, isLoading } = useQuery({
        queryKey: ["admin-client-payments", clientId],
        queryFn: async () => {
            return preFetchedPayments || [];
        },
        enabled: orders?.length > 0 && !preFetchedPayments,
        initialData: preFetchedPayments,
    });

    const paymentsList = Array.isArray(payments) ? payments : preFetchedPayments || [];

    if (isLoading && !preFetchedPayments) return <SkeletonCard className="h-[200px]" />;

    return (
        <div className="space-y-3">
            {paymentsList.length === 0 ? (
                <div className="p-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <CreditCard size={24} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No payments from this client.</p>
                </div>
            ) : (
                paymentsList.map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                        <div>
                            <p className="text-xs font-mono text-[#999]">{pay.order?.orderNumber}</p>
                            <p className="text-sm font-semibold text-[#0D0D0D]">{formatCurrency(pay.amount)}</p>
                            <p className="text-xs text-[#999] mt-0.5">{new Date(pay.createdAt).toLocaleDateString("en-NG")}</p>
                        </div>
                        <StatusPill status={pay.status} size="small" />
                    </div>
                ))
            )}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon size={14} className="text-[#999] mt-0.5 shrink-0" />
            <div>
                <p className="text-[10px] uppercase text-[#999]">{label}</p>
                <p className="text-[#0D0D0D] font-medium break-all">{typeof value === "string" || typeof value === "number" ? value : "—"}</p>
            </div>
        </div>
    );
}

function ClientChatHistoryTab({ clientId, orders }) {
    const { data: chatThreads, isLoading } = useQuery({
        queryKey: ["admin-client-chats", clientId],
        queryFn: async () => {
            if (!orders.length) return [];
            const threads = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const { data } = await api.get(`/chat/${order.id}`);
                        const msgs = data.data?.messages || data.data || [];
                        if (!Array.isArray(msgs) || msgs.length === 0) return null;
                        return { order, messages: msgs, lastMessage: msgs[msgs.length - 1] };
                    } catch { return null; }
                })
            );
            return threads.filter(Boolean).sort((a, b) =>
                new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt)
            );
        },
        enabled: orders?.length > 0,
    });

    const threads = Array.isArray(chatThreads) ? chatThreads : [];

    if (isLoading) return <SkeletonCard className="h-[200px]" />;

    return (
        <div className="space-y-3">
            {threads.length === 0 ? (
                <div className="p-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <MessageSquare size={24} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No chat history.</p>
                </div>
            ) : (
                threads.map((thread) => (
                    <Link key={thread.order.id} href={`/admin/orders/${thread.order.id}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white hover:border-[rgba(0,0,0,0.12)] transition-colors">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-[#C2185B]/10 flex items-center justify-center shrink-0">
                                <MessageSquare size={16} className="text-[#C2185B]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-mono-data text-[#999]">{thread.order.orderNumber}</p>
                                <p className="text-sm text-[#555] truncate mt-0.5">
                                    {thread.lastMessage.senderRole !== "CLIENT" ? "You: " : ""}
                                    {thread.lastMessage.message || "[Attachment]"}
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                            <span className="text-[10px] text-[#999]">
                                {new Date(thread.lastMessage.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                            </span>
                            <p className="text-[9px] text-[#999] mt-0.5">{thread.messages.length} msgs</p>
                        </div>
                    </Link>
                ))
            )}
        </div>
    );
}

function HistoryAccordionItem({ hist }) {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-[rgba(0,0,0,0.06)] rounded-lg overflow-hidden transition-colors hover:border-[rgba(0,0,0,0.12)]">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-3 bg-[#FAFAFA] hover:bg-[#F4F0F8] transition-colors"
            >
                <div>
                    <p className="text-sm font-medium text-[#0D0D0D] text-left">
                        Updated by {hist.updatedByName || "Staff"}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                        <Clock size={12} className="text-[#999]" />
                        <p className="text-xs text-[#999]">
                            {new Date(hist.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                    </div>
                </div>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={16} className="text-[#999]" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && hist.changedFields && typeof hist.changedFields === 'object' && Object.keys(hist.changedFields).length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 bg-white grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-[rgba(0,0,0,0.04)]">
                            {Object.entries(hist.changedFields).map(([field, detail]) => (
                                <div key={field} className="text-xs bg-[#FAFAFA] p-2 rounded border border-[rgba(0,0,0,0.04)]">
                                    <span className="font-semibold text-[#0D0D0D] capitalize">{field.replace(/([A-Z])/g, " $1")}</span>:
                                    <span className="text-[#999] line-through ml-1">{detail.from === null || detail.from === undefined ? '-' : detail.from}</span>
                                    <span className="text-[#C2185B] mx-1">→</span>
                                    <span className="text-[#0D0D0D] font-medium">{detail.to === null || detail.to === undefined ? '-' : detail.to}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
