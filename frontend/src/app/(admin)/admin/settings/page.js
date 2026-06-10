"use client";

import { Settings, User, Bell, Shield, Palette } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BRANDING } from "@/config/branding";
import RoleManagementSection from "@/components/admin/RoleManagementSection";

export default function AdminSettingsPage() {
    const { user, isSuperAdmin } = useAuth();

    if (!isSuperAdmin) {
        return (
            <div className="text-center py-12">
                <Shield size={32} className="text-[#999] mx-auto mb-3" />
                <p className="text-sm text-[#555]">Only Super Admins can access settings.</p>
            </div>
        );
    }

    return (
        <div className="pb-20 lg:pb-0 max-w-2xl">
            <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">Settings</h1>
            <p className="text-sm text-[#999] mb-8">Manage your studio settings and preferences.</p>

            {/* Business Profile */}
            <section className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <Palette size={16} className="text-[#C2185B]" />
                    <h2 className="text-sm font-bold text-[#0D0D0D]">Business Profile</h2>
                </div>
                <div className="space-y-3">
                    <SettingsRow label="Business Name" value={BRANDING.businessName} />
                    <SettingsRow label="Email" value={BRANDING.contact.email} />
                    <SettingsRow label="Phone" value={BRANDING.contact.phone} />
                    <SettingsRow label="Instagram" value={BRANDING.socials.instagram || "Not set"} />
                </div>
                <p className="text-[10px] text-[#999] mt-4">
                    To update branding, edit the branding configuration in <code className="bg-[#F4F0F8] px-1 rounded text-[10px]">config/branding.js</code>
                </p>
            </section>

            {/* Account */}
            <section className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white mb-4">
                <div className="flex items-center gap-2 mb-4">
                    <User size={16} className="text-[#C2185B]" />
                    <h2 className="text-sm font-bold text-[#0D0D0D]">Account</h2>
                </div>
                <div className="space-y-3">
                    <SettingsRow label="Name" value={user?.fullName} />
                    <SettingsRow label="Email" value={user?.email} />
                    <SettingsRow label="Role" value={user?.role === "SUPER_ADMIN" ? "Super Admin" : "Staff Admin"} />
                </div>
            </section>

            {/* Role Management */}
            <RoleManagementSection />

            {/* Notification Preferences */}
            <section className="p-6 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white">
                <div className="flex items-center gap-2 mb-4">
                    <Bell size={16} className="text-[#C2185B]" />
                    <h2 className="text-sm font-bold text-[#0D0D0D]">Notification Preferences</h2>
                </div>
                <div className="space-y-3">
                    <SettingsToggle label="Email notifications for new orders" defaultOn />
                    <SettingsToggle label="Email notifications for payments" defaultOn />
                    <SettingsToggle label="WhatsApp alerts for milestone events" defaultOn />
                </div>
                <p className="text-[10px] text-[#999] mt-4">
                    Notification preferences are managed server-side. Contact the developer to adjust.
                </p>
            </section>
        </div>
    );
}

function SettingsRow({ label, value }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0">
            <span className="text-xs text-[#999]">{label}</span>
            <span className="text-sm font-medium text-[#0D0D0D]">{value || "—"}</span>
        </div>
    );
}

function SettingsToggle({ label, defaultOn = false }) {
    return (
        <div className="flex items-center justify-between py-2 border-b border-[rgba(0,0,0,0.04)] last:border-0">
            <span className="text-xs text-[#555]">{label}</span>
            <div className={`w-9 h-5 rounded-full relative cursor-not-allowed ${defaultOn ? "bg-[#C2185B]" : "bg-[#E0E0E0]"}`}>
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${defaultOn ? "right-0.5" : "left-0.5"}`} />
            </div>
        </div>
    );
}
