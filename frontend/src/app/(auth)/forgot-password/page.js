"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Send } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/toaster";
import { BRANDING } from "@/config/branding";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
    const toast = useToast();
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.post("/auth/forgot-password", { email });
            setIsSent(true);
            toast.success("Email sent!", "Check your inbox for the reset link.");
        } catch (err) {
            toast.error("Error", err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Could not send reset email.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 pt-[var(--nav-height)] bg-white">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[400px]">
                <Link href="/login" className="inline-flex items-center gap-1 text-sm text-[#999] hover:text-[#C2185B] mb-8 transition-colors">
                    <ArrowLeft size={14} /> Back to Login
                </Link>

                {isSent ? (
                    <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
                            <Mail size={28} className="text-[#2E7D32]" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">Check your email</h1>
                        <p className="text-sm text-[#999] mb-6">We sent a password reset link to <strong className="text-[#0D0D0D]">{email}</strong>.</p>
                        <Link href="/login" className="text-sm text-[#C2185B] font-semibold hover:underline">Back to Login</Link>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">Forgot your password?</h1>
                        <p className="text-sm text-[#999] mb-6">Enter your email and we&apos;ll send you a reset link.</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                                <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-9 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                            </div>
                            <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#C2185B] hover:bg-[#A01548] text-white font-semibold">
                                {isLoading ? <div className="border-[3px] border-white/30 border-t-white rounded-full animate-spin size-5" /> : <><Send size={16} />Send Reset Link</>}
                            </Button>
                        </form>
                    </>
                )}
            </motion.div>
        </div>
    );
}
