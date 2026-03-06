"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, ShoppingBag, CreditCard,
    Ruler, CheckCircle2, XCircle, Plus, Pencil,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatCurrency, ORDER_STATUS, ORDER_TYPES } from "@/config/branding";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonCard } from "@/components/shared/Skeleton";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import MeasurementFormModal from "@/components/admin/MeasurementFormModal";

const TABS = ["overview", "orders", "measurements", "payments"];

// Fields to exclude from measurement display
const MEASUREMENT_META = ["id", "clientId", "client", "createdAt", "updatedAt", "disclaimerSignedAt", "updatedByRole", "notes", "customParams"];

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
    const [createOrderOpen, setCreateOrderOpen] = useState(false);
    const [measurementFormOpen, setMeasurementFormOpen] = useState(false);

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

    const clientMeasurements = measurementData?.measurement || null;

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
                            <span className="text-xs text-[#999]">{client.online ? "Online" : "Offline"}</span>
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
                    <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1">
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

                    {/* Overview Tab */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
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
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === "orders" && (
                        <div className="space-y-3">
                            <div className="flex justify-end mb-2">
                                <button onClick={() => setCreateOrderOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C2185B] text-white text-xs font-semibold hover:bg-[#A01548] transition-colors">
                                    <Plus size={14} /> Create Order
                                </button>
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
                        </div>
                    )}

                    {/* Measurements Tab */}
                    {activeTab === "measurements" && (
                        <div className="space-y-4">
                            <div className="flex justify-end mb-2">
                                <button onClick={() => setMeasurementFormOpen(true)}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#C2185B] text-white text-xs font-semibold hover:bg-[#A01548] transition-colors">
                                    {clientMeasurements ? <><Pencil size={14} /> Edit Measurements</> : <><Plus size={14} /> Add Measurements</>}
                                </button>
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
                                </>
                            ) : (
                                <div className="p-8 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                                    <Ruler size={24} className="text-[#999] mx-auto mb-2" />
                                    <p className="text-sm text-[#555]">No measurements recorded.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "payments" && <ClientPaymentsTab clientId={id} orders={orders} />}
                </div>
            </div>

            {/* Modals */}
            <CreateOrderModal open={createOrderOpen} onClose={() => setCreateOrderOpen(false)} preselectedClientId={id} />
            <MeasurementFormModal open={measurementFormOpen} onClose={() => setMeasurementFormOpen(false)} clientId={id} existingMeasurement={clientMeasurements} />
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

function ClientPaymentsTab({ clientId, orders }) {
    const { data: payments, isLoading } = useQuery({
        queryKey: ["admin-client-payments", clientId],
        queryFn: async () => {
            if (!orders.length) return [];
            const all = await Promise.all(
                orders.map(async (order) => {
                    try {
                        const { data } = await api.get(`/payments/order/${order.id}`);
                        const pays = data.data?.payments || data.data || [];
                        return Array.isArray(pays) ? pays.map((p) => ({ ...p, order })) : [];
                    } catch { return []; }
                })
            );
            return all.flat();
        },
        enabled: orders?.length > 0,
    });

    const paymentsList = Array.isArray(payments) ? payments : [];

    if (isLoading) return <SkeletonCard className="h-[200px]" />;

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
