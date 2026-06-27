"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api, { setAccessToken, clearAccessToken, getAccessToken } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const refreshTimerRef = useRef(null);

    // Fetch current user
    const fetchUser = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            if (data.success) {
                setUser(data.data.user || data.data);
            }
        } catch {
            setUser(null);
            clearAccessToken();
        }
    }, []);

    // Login
    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        if (data.success && data.data?.accessToken) {
            setAccessToken(data.data.accessToken);
            setUser(data.data.user);
            startRefreshTimer();
            return data.data;
        }
        throw new Error(data.message || "Login failed");
    }, []);

    // Register
    const register = useCallback(async (formData) => {
        const { data } = await api.post("/auth/register", formData);
        if (data.success && data.data?.accessToken) {
            setAccessToken(data.data.accessToken);
            setUser(data.data.user);
            startRefreshTimer();
            return data.data;
        }
        throw new Error(data.message || "Registration failed");
    }, []);

    // Logout
    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Ignore errors
        } finally {
            clearAccessToken();
            setUser(null);
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        }
    }, []);

    // Refresh timer — renew token every 13 minutes (token lasts 15 min)
    const startRefreshTimer = useCallback(() => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
        }
        refreshTimerRef.current = setInterval(async () => {
            try {
            const { data } = await api.post("/auth/refresh");
            if (data.success && data.data?.accessToken) {
                setAccessToken(data.data.accessToken);
                // Timer is already running — no need to restart it here
            } else {
                clearAccessToken();
                setUser(null);
            }
            } catch {
            clearAccessToken();
            setUser(null);
            }
        }, 13 * 60 * 1000);
    }, []);

    // Silent refresh
    const refreshToken = useCallback(async () => {
        try {
            const { data } = await api.post("/auth/refresh");
            if (data.success && data.data?.accessToken) {
                setAccessToken(data.data.accessToken);
                startRefreshTimer();
                return true;
            }
        } catch {
            clearAccessToken();
            setUser(null);
        }
        return false;
    }, [startRefreshTimer]);

    // Handle OAuth callback token
    const handleOAuthCallback = useCallback(
        async (code) => {
            const { data } = await api.post("/auth/oauth/exchange", { code });
            if (data.success && data.data?.accessToken) {
                setAccessToken(data.data.accessToken);
                await fetchUser();
                startRefreshTimer();
            }
        },
        [fetchUser, startRefreshTimer]
    );

    // Initial auth check
    useEffect(() => {
        async function init() {
            try {
                const refreshed = await refreshToken();
                if (refreshed) {
                    await fetchUser();
                    startRefreshTimer();
                }
            } catch {
                // Not authenticated
            } finally {
                setLoading(false);
            }
        }
        init();

        return () => {
            if (refreshTimerRef.current) {
                clearInterval(refreshTimerRef.current);
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const value = {
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        refreshToken,
        handleOAuthCallback,
        isAuthenticated: !!user,
        isAdmin: user?.role === "SUPER_ADMIN" || user?.role === "STAFF_ADMIN",
        isSuperAdmin: user?.role === "SUPER_ADMIN",
        isClient: user?.role === "CLIENT",
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

export default AuthContext;
