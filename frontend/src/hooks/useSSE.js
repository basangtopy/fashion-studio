"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

/**
 * useSSE — Establishes a Server-Sent Events connection to the backend.
 * Automatically invalidates relevant React Query caches on incoming events.
 * Auto-reconnects on disconnect with exponential backoff.
 */
export default function useSSE() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const eventSourceRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const retryCountRef = useRef(0);

    const connect = useCallback(() => {
        // Get stored token
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
        if (!token) return;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const url = `${apiBase}/sse`;

        // Create EventSource with auth via query param (SSE doesn't support headers)
        // We'll use a custom fetch-based approach instead
        const es = new EventSource(`${url}?token=${token}`, { withCredentials: false });

        es.onopen = () => {
            retryCountRef.current = 0; // Reset retry count on success
        };

        // Handle named events
        es.addEventListener("connected", () => {
            // Connection established
        });

        es.addEventListener("notification", (e) => {
            try {
                queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
            } catch { /* ignore */ }
        });

        es.addEventListener("chat", (e) => {
            try {
                queryClient.invalidateQueries({ queryKey: ["admin-chat"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            } catch { /* ignore */ }
        });

        // Backend sends "chat_message" SSE events for real-time chat
        es.addEventListener("chat_message", (e) => {
            try {
                const payload = JSON.parse(e.data);
                // Invalidate specific order's chat query for client-side real-time
                if (payload?.orderId) {
                    queryClient.invalidateQueries({ queryKey: ["chat", payload.orderId] });
                }
                // Also invalidate admin queries
                queryClient.invalidateQueries({ queryKey: ["admin-chat"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            } catch { /* ignore */ }
        });

        es.addEventListener("chat_read", (e) => {
            try {
                const payload = JSON.parse(e.data);
                if (payload?.orderId) {
                    queryClient.invalidateQueries({ queryKey: ["chat", payload.orderId] });
                }
                queryClient.invalidateQueries({ queryKey: ["admin-chat"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            } catch { /* ignore */ }
        });

        es.addEventListener("order", (e) => {
            try {
                queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
                queryClient.invalidateQueries({ queryKey: ["admin-recent-orders"] });
            } catch { /* ignore */ }
        });

        es.addEventListener("payment", (e) => {
            try {
                queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
                queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] });
                queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
            } catch { /* ignore */ }
        });

        es.addEventListener("presence", (e) => {
            try {
                queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
            } catch { /* ignore */ }
        });

        es.onerror = () => {
            es.close();
            // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
            const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
            retryCountRef.current += 1;
            reconnectTimeoutRef.current = setTimeout(connect, delay);
        };

        eventSourceRef.current = es;
    }, [queryClient]);

    useEffect(() => {
        if (!isAuthenticated) return;

        connect();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
                eventSourceRef.current = null;
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [isAuthenticated, connect]);
}
