"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { getAccessToken } from "@/lib/api";
/**
 * useSSE — Establishes a Server-Sent Events connection to the backend.
 * Uses @microsoft/fetch-event-source to send the auth token via Authorization header
 * (secure — unlike native EventSource which only supports URL query params).
 * Automatically invalidates relevant React Query caches on incoming events.
 * Auto-reconnects on disconnect with exponential backoff.
 */
export default function useSSE() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const controllerRef = useRef(null);
    const retryCountRef = useRef(0);

    const connect = useCallback(() => {
        const token = getAccessToken();
        if (!token) return;

        const apiBase = "/api";
        const url = `${apiBase}/sse`;

        // Abort any previous connection
        if (controllerRef.current) controllerRef.current.abort();
        const controller = new AbortController();
        controllerRef.current = controller;

        fetchEventSource(url, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
            openWhenHidden: true, // Keep connection alive when tab is hidden

            onopen(response) {
                if (response.ok) {
                    retryCountRef.current = 0;
                } else if (response.status === 401 || response.status === 403) {
                    // Auth failed — don't retry
                    throw new Error("Unauthorized");
                }
            },

            onmessage(event) {
                try {
                    const payload = event.data ? JSON.parse(event.data) : {};

                    switch (event.event || event.type) {
                        case "connected":
                            break;

                        case "notification":
                            queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
                            queryClient.invalidateQueries({ queryKey: ["client-notifications"] });
                            break;

                        case "chat":
                            queryClient.invalidateQueries({ queryKey: ["admin-chat"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-chat-inbox"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
                            break;

                        case "chat_message":
                            if (payload?.orderId) {
                                queryClient.invalidateQueries({ queryKey: ["chat", payload.orderId] });
                            }
                            queryClient.invalidateQueries({ queryKey: ["admin-chat"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-chat-inbox"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
                            queryClient.invalidateQueries({ queryKey: ["client-orders"] });
                            break;

                        case "chat_read":
                            if (payload?.orderId) {
                                queryClient.invalidateQueries({ queryKey: ["chat", payload.orderId] });
                            }
                            queryClient.invalidateQueries({ queryKey: ["admin-chat"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-chat-inbox"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
                            break;

                        case "order":
                            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-recent-orders"] });
                            queryClient.invalidateQueries({ queryKey: ["client-orders"] });
                            if (payload?.orderId) {
                                queryClient.invalidateQueries({ queryKey: ["admin-order", payload.orderId] });
                                queryClient.invalidateQueries({ queryKey: ["order", payload.orderId] });
                            }
                            break;

                        case "payment":
                            queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-pending-payments"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
                            queryClient.invalidateQueries({ queryKey: ["client-orders"] });
                            if (payload?.orderId) {
                                queryClient.invalidateQueries({ queryKey: ["order-payments", payload.orderId] });
                            }
                            break;

                        case "presence":
                            queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
                            queryClient.invalidateQueries({ queryKey: ["admin-online-count"] });
                            break;

                        default:
                            break;
                    }
                } catch { /* ignore parse errors for heartbeat/keep-alive */ }
            },

            onerror(err) {
                // Don't retry on auth errors
                if (err?.message === "Unauthorized") throw err;
                // Exponential backoff: 1s, 2s, 4s, 8s... max 30s
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                retryCountRef.current += 1;
                return delay;
            },

            onclose() {
                // Server closed connection — reconnect
                const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
                retryCountRef.current += 1;
                return delay;
            },
        }).catch(() => {
            // Silently handle abort and auth errors
        });
    }, [queryClient]);

    useEffect(() => {
        if (!isAuthenticated) return;

        connect();

        return () => {
            if (controllerRef.current) {
                controllerRef.current.abort();
                controllerRef.current = null;
            }
        };
    }, [isAuthenticated, connect]);
}
