"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-secondary flex items-center justify-center">
                <Loader2 size={40} className="text-primary animate-spin" />
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
    const toast = useToast();

    useEffect(() => {
        const code = searchParams.get("code");
        const error = searchParams.get("error");

        if (error) {
            router.replace(`/login?error=${error}`);
            return;
        }

        if (code) {
            const doCallback = async () => {
                try {
                    await handleOAuthCallback(code);
                } catch (error) {
                    const msg = error.response?.data?.message || error.message || "OAuth authentication failed";
                    toast.error("Authentication failed.", msg);
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
        <div className="min-h-screen bg-secondary flex items-center justify-center">
            <div className="text-center">
                <Loader2 size={40} className="text-primary mx-auto mb-4 animate-spin" />
                <p className="text-white/60 text-sm">Completing sign in...</p>
            </div>
        </div>
    );
}
