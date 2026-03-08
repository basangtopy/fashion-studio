"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { BRANDING } from "@/config/branding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const ROTATING_COPY = [
    "Made for you.",
    "Worn with pride.",
    "Crafted with care.",
];

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-[var(--nav-height)] bg-white" />}>
            <LoginContent />
        </Suspense>
    );
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isAuthenticated, isAdmin } = useAuth();
    const toast = useToast();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [copyIndex, setCopyIndex] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            router.replace(isAdmin ? "/admin/dashboard" : "/client/dashboard");
        }
    }, [isAuthenticated, isAdmin, router]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCopyIndex((prev) => (prev + 1) % ROTATING_COPY.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const data = await login(formData.email, formData.password);
            toast.success("Welcome back!", `Signed in as ${data.user?.fullName || formData.email}`);

            const redirectURL = searchParams.get("redirectURL");
            const action = searchParams.get("action");
            let targetPath = data.user?.role === "CLIENT" ? "/client/dashboard" : "/admin/dashboard";

            if (redirectURL) {
                targetPath = redirectURL;
                if (action) {
                    targetPath += `?action=${action}`;
                }
            }
            router.push(targetPath);
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Login failed";
            if (err.response?.status === 429) {
                toast.error("Too many attempts", "Please wait before trying again.");
            } else {
                toast.error("Login failed", msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleOAuth = (provider) => {
        window.location.href = `${API_URL}/auth/${provider}`;
    };

    return (
        <div className="h-screen overflow-hidden flex pt-[var(--nav-height)]">
            {/* Left brand panel — Desktop only */}
            <div className="hidden lg:flex w-[55%] bg-[#1A1A2E] relative overflow-hidden items-center justify-center sticky top-[var(--nav-height)] h-[calc(100vh-var(--nav-height))]">
                <div className="relative z-10 px-16 max-w-lg">
                    {/* Geometric decoration */}
                    <div className="absolute -top-20 -left-10 w-64 h-64 rounded-full bg-[#C2185B]/10 blur-3xl" />
                    <div className="absolute -bottom-20 -right-10 w-48 h-48 rounded-full bg-[#F8E8F0]/5 blur-2xl" />

                    <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
                        Your Style,<br />
                        <span className="text-[#C2185B]">Our Craft</span>
                    </h2>

                    {/* Rotating copy */}
                    <div className="h-8 mb-8 overflow-hidden">
                        <motion.p
                            key={copyIndex}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            transition={{ duration: 0.4 }}
                            className="text-lg text-[#F8E8F0]/60 font-light"
                        >
                            {ROTATING_COPY[copyIndex]}
                        </motion.p>
                    </div>

                    {/* Testimonial */}
                    <div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-sm text-white/60 italic leading-relaxed mb-3">
                            &ldquo;The best fashion studio experience I&apos;ve ever had. Every piece is perfection.&rdquo;
                        </p>
                        <p className="text-xs text-white/40">— Happy Client</p>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className="flex-1 flex items-start justify-center px-6 py-12 bg-white overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[400px] my-auto"
                >
                    {/* Mobile brand mark */}
                    <div className="lg:hidden text-center mb-8">
                        <h2 className="text-xl font-bold text-[#C2185B]">{BRANDING.businessName}</h2>
                    </div>

                    <h1 className="text-2xl font-bold text-[#0D0D0D] mb-2">Welcome back</h1>
                    <p className="text-sm text-[#999] mb-8">
                        Sign in to manage your orders and measurements.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <Label className="mb-1.5 block text-[#0D0D0D]">Email</Label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                                <Input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="you@example.com"
                                    className="pl-9 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <Label className="text-[#0D0D0D]">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-[#C2185B] hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999] z-10" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter your password"
                                    className="pl-9 pr-10 h-11 border-[#E0E0E0] focus-visible:ring-[#C2185B] focus-visible:border-[#C2185B]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#999] hover:text-[#555] z-10"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-[#C2185B] hover:bg-[#A01548] text-white font-semibold"
                        >
                            {isLoading ? (
                                <div className="border-[3px] border-white/30 border-t-white rounded-full animate-spin size-5" />
                            ) : (
                                <>
                                    <LogIn size={16} />
                                    Sign In
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-[#E0E0E0]" />
                        <span className="text-xs text-[#999]">or continue with</span>
                        <div className="flex-1 h-px bg-[#E0E0E0]" />
                    </div>

                    {/* OAuth buttons */}
                    <div className="flex flex-col gap-2">
                        {[
                            { provider: "google", label: "Google", icon: "G" },
                            { provider: "facebook", label: "Facebook", icon: "f" },
                            { provider: "twitter", label: "Twitter / X", icon: "𝕏" },
                        ].map(({ provider, label, icon }) => (
                            <Button
                                key={provider}
                                type="button"
                                variant="outline"
                                onClick={() => handleOAuth(provider)}
                                className="w-full h-11 border-[#E0E0E0] text-[#555] hover:bg-[#F4F0F8]"
                            >
                                <span className="size-5 rounded-full bg-[#E0E0E0]/30 flex items-center justify-center text-xs font-bold shrink-0">
                                    {icon}
                                </span>
                                {label}
                            </Button>
                        ))}
                    </div>

                    {/* Signup link */}
                    <p className="text-center text-sm text-[#999] mt-6">
                        Don&apos;t have an account?{" "}
                        <Link href={`/signup${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="text-[#C2185B] font-semibold hover:underline">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
