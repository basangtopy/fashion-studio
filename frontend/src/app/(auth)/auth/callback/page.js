"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
                <Loader2 size={40} className="text-[#C2185B] animate-spin" />
            </div>
        }>
            <AuthCallbackContent />
        </Suspense>
    );
}

function AuthCallbackContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { handleOAuthCallback, isAuthenticated, isAdmin } = useAuth();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (error) {
            router.replace(`/login?error=${error}`);
            return;
        }

        if (token) {
            const doCallback = async () => {
                try {
                    await handleOAuthCallback(token);
                } catch {
                    router.replace("/login?error=oauth_failed");
                }
            };
            doCallback();
        } else {
            router.replace("/login");
        }
    }, [searchParams, handleOAuthCallback, router]);

    // Redirect once auth is established
    useEffect(() => {
        if (isAuthenticated) {
            router.replace(isAdmin ? "/admin/dashboard" : "/client/dashboard");
        }
    }, [isAuthenticated, isAdmin, router]);

    return (
        <div className="min-h-screen bg-[#1A1A2E] flex items-center justify-center">
            <div className="text-center">
                <Loader2 size={40} className="text-[#C2185B] mx-auto mb-4 animate-spin" />
                <p className="text-white/60 text-sm">Completing sign in...</p>
            </div>
        </div>
    );
}
