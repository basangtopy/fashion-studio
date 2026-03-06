"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToast();
    const token = searchParams.get("token");
    const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }
        setIsLoading(true);
        try {
            await api.post("/auth/reset-password", { token, newPassword: formData.password });
            setIsSuccess(true);
            toast.success("Password reset!", "Your password has been updated.");
            setTimeout(() => router.push("/login"), 2000);
        } catch (err) {
            toast.error("Error", err.response?.data?.message || "Could not reset password.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={28} className="text-[#2E7D32]" />
                </div>
                <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">Password Reset!</h1>
                <p className="text-sm text-[#999]">Redirecting you to login...</p>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">Set new password</h1>
            <p className="text-sm text-[#999] mb-6">Enter your new password below.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label className="mb-1.5 block text-[#0D0D0D]">New Password</Label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                        <Input type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Min. 8 characters" className="pl-9 pr-10 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] z-10 hover:text-[#555]">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                </div>
                <div>
                    <Label className="mb-1.5 block text-[#0D0D0D]">Confirm Password</Label>
                    <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                        <Input type="password" required value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Confirm password" className="pl-9 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                    </div>
                </div>
                <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#C2185B] hover:bg-[#A01548] text-white font-semibold">
                    {isLoading ? <div className="border-[3px] border-white/30 border-t-white rounded-full animate-spin size-5" /> : "Reset Password"}
                </Button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 pt-[var(--nav-height)] bg-white">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px]">
                <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
                    <ResetPasswordForm />
                </Suspense>
            </motion.div>
        </div>
    );
}
