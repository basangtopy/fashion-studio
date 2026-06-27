"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_VARIANTS = {
    success: {
        icon: CheckCircle2,
        borderColor: 'var(--color-status-success)',
        iconColor: "#2E7D32",
    },
    warning: {
        icon: AlertTriangle,
        borderColor: 'var(--color-status-warning)',
        iconColor: "#E65100",
    },
    error: {
        icon: AlertCircle,
        borderColor: 'var(--color-status-error)',
        iconColor: "#C62828",
    },
    info: {
        icon: Info,
        borderColor: 'var(--color-status-info)',
        iconColor: "#1565C0",
    },
};

function Toast({ id, variant = "info", title, message, onRemove, duration = 4000 }) {
    const config = TOAST_VARIANTS[variant] || TOAST_VARIANTS.info;
    const Icon = config.icon;

    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(id);
        }, duration);
        return () => clearTimeout(timer);
    }, [id, onRemove, duration]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-[320px] bg-white rounded-xl shadow-lg overflow-hidden"
            style={{ borderLeft: `4px solid ${config.borderColor}` }}
        >
            <div className="flex items-start gap-3 p-4">
                <Icon size={20} style={{ color: config.iconColor }} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                    {title && (
                        <p className="font-semibold text-sm text-foreground">{title}</p>
                    )}
                    {message && (
                        <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
                    )}
                </div>
                <button
                    onClick={() => onRemove(id)}
                    className="shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={14} className="text-text-light" />
                </button>
            </div>
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 h-[3px] w-full">
                <div
                    className="h-full toast-progress-bar"
                    style={{
                        backgroundColor: config.borderColor,
                        animationDuration: `${duration}ms`,
                    }}
                />
            </div>
        </motion.div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ variant, title, message, duration }) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, variant, title, message, duration }]);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const toast = {
        success: (title, message, duration) =>
            addToast({ variant: "success", title, message, duration }),
        warning: (title, message, duration) =>
            addToast({ variant: "warning", title, message, duration }),
        error: (title, message, duration) =>
            addToast({ variant: "error", title, message, duration }),
        info: (title, message, duration) =>
            addToast({ variant: "info", title, message, duration }),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => (
                        <Toast key={t.id} {...t} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}
