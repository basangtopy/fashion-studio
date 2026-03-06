"use client";

import { useState } from "react";
import { Star, CheckCircle, XCircle, Clock, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import StatusPill from "@/components/shared/StatusPill";
import { SkeletonCard } from "@/components/shared/Skeleton";

const TABS = ["PENDING", "APPROVED", "REJECTED"];

export default function AdminTestimonialsPage() {
    const toast = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("PENDING");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-testimonials", activeTab],
        queryFn: async () => {
            const { data } = await api.get("/testimonials/admin", { params: { status: activeTab } });
            return data.data?.testimonials || data.data || [];
        },
    });

    const updateStatus = useMutation({
        mutationFn: async ({ id, status }) => {
            const { data } = await api.put(`/testimonials/admin/${id}`, { status });
            return data;
        },
        onSuccess: (_, { status }) => {
            toast.success(status === "APPROVED" ? "Testimonial approved" : "Testimonial rejected");
            queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
        },
        onError: (err) => toast.error("Error", err.response?.data?.message || "Action failed"),
    });

    const testimonials = Array.isArray(data) ? data : [];

    return (
        <div className="pb-20 lg:pb-0">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0D0D0D]">Testimonials</h1>
                <p className="text-sm text-[#999]">Review and moderate client testimonials</p>
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 mb-6 bg-[#F4F0F8] rounded-lg p-1 max-w-md">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-white text-[#0D0D0D] shadow-sm" : "text-[#999] hover:text-[#555]"}`}
                    >
                        {tab.toLowerCase()}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => <SkeletonCard key={i} className="h-[120px]" />)}
                </div>
            ) : testimonials.length === 0 ? (
                <div className="p-12 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white text-center">
                    <MessageSquare size={28} className="text-[#999] mx-auto mb-2" />
                    <p className="text-sm text-[#555]">No {activeTab.toLowerCase()} testimonials.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {testimonials.map((t) => (
                        <div key={t.id} className="p-5 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-[#C2185B] flex items-center justify-center text-white font-bold text-xs shrink-0">
                                        {t.clientName?.charAt(0) || t.user?.fullName?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-[#0D0D0D]">{t.clientName || t.user?.fullName || "Anonymous"}</p>
                                        <div className="flex gap-0.5">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} size={12} className={i < t.rating ? "text-[#F9A825] fill-[#F9A825]" : "text-[#E0E0E0]"} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-[#999]">{new Date(t.createdAt).toLocaleDateString("en-NG")}</p>
                            </div>

                            <p className="text-sm text-[#555] leading-relaxed mb-4">{t.review || t.content}</p>

                            {activeTab === "PENDING" && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus.mutate({ id: t.id, status: "APPROVED" })}
                                        disabled={updateStatus.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#E8F5E9] text-[#2E7D32] text-xs font-semibold hover:bg-[#C8E6C9] transition-colors"
                                    >
                                        <CheckCircle size={14} /> Approve
                                    </button>
                                    <button
                                        onClick={() => updateStatus.mutate({ id: t.id, status: "REJECTED" })}
                                        disabled={updateStatus.isPending}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFEBEE] text-[#C62828] text-xs font-semibold hover:bg-[#FFCDD2] transition-colors"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            )}

                            {activeTab !== "PENDING" && (
                                <div className="flex items-center gap-2">
                                    <StatusPill status={activeTab} size="small" />
                                    {activeTab === "REJECTED" && (
                                        <button
                                            onClick={() => updateStatus.mutate({ id: t.id, status: "APPROVED" })}
                                            className="text-xs text-[#C2185B] font-medium hover:underline"
                                        >
                                            Approve instead
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
