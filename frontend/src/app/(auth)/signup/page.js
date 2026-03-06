"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { BRANDING } from "@/config/branding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function SignupPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-[var(--nav-height)] bg-white" />}>
            <SignupContent />
        </Suspense>
    );
}

function SignupContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { register, isAuthenticated, isAdmin } = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        phone: "",
        sex: "FEMALE",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace(isAdmin ? "/admin/dashboard" : "/client/dashboard");
        }
    }, [isAuthenticated, isAdmin, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match", "Please ensure both passwords are the same.");
            return;
        }
        setIsLoading(true);
        try {
            const { confirmPassword, ...payload } = formData;
            await register(payload);
            toast.success("Account created!", "Please check your email to verify your account.");

            const redirectURL = searchParams.get("redirectURL");
            const action = searchParams.get("action");
            let targetPath = "/client/dashboard";

            if (redirectURL) {
                targetPath = redirectURL;
                if (action) {
                    targetPath += `?action=${action}`;
                }
            }
            router.push(targetPath);
        } catch (err) {
            toast.error("Signup failed", err.response?.data?.message || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuth = (provider) => {
        window.location.href = `${API_URL}/auth/${provider}`;
    };

    const update = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    return (
        <div className="min-h-screen flex pt-[var(--nav-height)]">
            {/* Left brand panel */}
            <div className="hidden lg:flex w-[55%] bg-[#1A1A2E] relative overflow-hidden items-center justify-center sticky top-[var(--nav-height)] h-[calc(100vh-var(--nav-height))]">
                <div className="relative z-10 px-16 max-w-lg">
                    <div className="absolute -top-20 -left-10 w-64 h-64 rounded-full bg-[#C2185B]/10 blur-3xl" />
                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
                        Join Our<br /><span className="text-[#C2185B]">Fashion Family</span>
                    </h2>
                    <p className="text-lg text-[#F8E8F0]/60 font-light mb-12">
                        Create an account to place custom orders, track your garments, and access exclusive styles.
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { n: "500+", l: "Garments Created" },
                            { n: "3", l: "Service Models" },
                            { n: "100%", l: "Satisfaction" },
                        ].map(({ n, l }) => (
                            <div key={l} className="text-center">
                                <p className="text-2xl font-bold font-mono-data text-white">{n}</p>
                                <p className="text-xs text-white/40 mt-1">{l}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[400px]"
                >
                    <div className="lg:hidden text-center mb-8">
                        <h2 className="text-xl font-bold text-[#C2185B]">{BRANDING.businessName}</h2>
                    </div>

                    <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">Create your account</h1>
                    <p className="text-sm text-[#999] mb-6">Get started with your fashion journey.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label className="mb-1.5 block text-[#0D0D0D]">Full Name</Label>
                            <div className="relative">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                                <Input type="text" required value={formData.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Your full name" className="pl-9 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-1.5 block text-[#0D0D0D]">Email</Label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                                <Input type="email" required value={formData.email} onChange={(e) => update("email", e.target.value)} placeholder="you@example.com" className="pl-9 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                            </div>
                        </div>

                        <div>
                            <Label className="mb-1.5 block text-[#0D0D0D]">Phone</Label>
                            <Input type="tel" value={formData.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+234 000 000 0000" className="h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                        </div>

                        <div>
                            <Label className="mb-1.5 block text-[#0D0D0D]">Sex</Label>
                            <div className="flex gap-2">
                                {["FEMALE", "MALE"].map((s) => (
                                    <Button key={s} type="button" variant={formData.sex === s ? "default" : "outline"} onClick={() => update("sex", s)} className={`flex-1 h-11 ${formData.sex === s ? "bg-[#C2185B] hover:bg-[#A01548] text-white" : "border-[#E0E0E0] text-[#555] hover:bg-[#F4F0F8]"}`}>
                                        {s.charAt(0) + s.slice(1).toLowerCase()}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Label className="mb-1.5 block text-[#0D0D0D]">Password</Label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                                <Input type={showPassword ? "text" : "password"} required value={formData.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 8 characters" className="pl-9 pr-10 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] z-10 hover:text-[#555]">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                            </div>
                        </div>

                        <div>
                            <Label className="mb-1.5 block text-[#0D0D0D]">Confirm Password</Label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                                <Input type="password" required value={formData.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="Confirm your password" className="pl-9 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]" />
                            </div>
                        </div>

                        <Button type="submit" disabled={isLoading} className="w-full h-11 bg-[#C2185B] hover:bg-[#A01548] text-white font-semibold mt-2">
                            {isLoading ? <div className="border-[3px] border-white/30 border-t-white rounded-full animate-spin size-5" /> : <><UserPlus size={16} />Create Account</>}
                        </Button>
                    </form>

                    <div className="flex items-center gap-3 my-5">
                        <div className="flex-1 h-px bg-[#E0E0E0]" /><span className="text-xs text-[#999]">or</span><div className="flex-1 h-px bg-[#E0E0E0]" />
                    </div>

                    <div className="flex flex-col gap-2">
                        {[{ provider: "google", label: "Google", icon: "G" }, { provider: "facebook", label: "Facebook", icon: "f" }, { provider: "twitter", label: "Twitter / X", icon: "𝕏" }].map(({ provider, label, icon }) => (
                            <Button key={provider} type="button" variant="outline" onClick={() => handleOAuth(provider)} className="w-full h-11 border-[#E0E0E0] text-[#555] hover:bg-[#F4F0F8]">
                                <span className="size-5 rounded-full bg-[#E0E0E0]/30 flex items-center justify-center text-xs font-bold shrink-0">{icon}</span>{label}
                            </Button>
                        ))}
                    </div>

                    <p className="text-center text-sm text-[#999] mt-5">
                        Already have an account?{" "}
                        <Link href={`/login${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="text-[#C2185B] font-semibold hover:underline">Sign in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
