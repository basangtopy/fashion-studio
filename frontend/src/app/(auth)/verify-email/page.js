"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center">
                    <Loader2 size={48} className="text-[#C2185B] mx-auto mb-4 animate-spin" />
                    <h1 className="text-xl font-bold text-[#0D0D0D] mb-2">Loading...</h1>
                </div>
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
}

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("No verification token provided.");
            return;
        }

        const verify = async () => {
            try {
                const { data } = await api.post("/auth/verify-email", { token });
                setStatus("success");
                setMessage(data.message || "Email verified successfully!");
            } catch (err) {
                setStatus("error");
                setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center">
                {status === "loading" && (
                    <>
                        <Loader2 size={48} className="text-[#C2185B] mx-auto mb-4 animate-spin" />
                        <h1 className="text-xl font-bold text-[#0D0D0D] mb-2">Verifying your email...</h1>
                        <p className="text-sm text-[#999]">Please wait while we confirm your email address.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} className="text-[#2E7D32]" />
                        </div>
                        <h1 className="text-xl font-bold text-[#0D0D0D] mb-2">Email Verified!</h1>
                        <p className="text-sm text-[#555] mb-6">{message}</p>
                        <Link href="/login" className="inline-flex items-center px-6 py-2.5 rounded-md bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors">
                            Continue to Login
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 rounded-full bg-[#FFEBEE] flex items-center justify-center mx-auto mb-4">
                            <XCircle size={32} className="text-[#C62828]" />
                        </div>
                        <h1 className="text-xl font-bold text-[#0D0D0D] mb-2">Verification Failed</h1>
                        <p className="text-sm text-[#555] mb-6">{message}</p>
                        <Link href="/login" className="inline-flex items-center px-6 py-2.5 rounded-md bg-[#C2185B] text-white text-sm font-semibold hover:bg-[#A01548] transition-colors">
                            Go to Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
