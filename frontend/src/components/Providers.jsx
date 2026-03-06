"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toaster";
import { CartProvider } from "@/context/CartContext";
import { BookingModalProvider } from "@/components/shared/BookingModalProvider";
import { useState } from "react";

export default function Providers({ children }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <CartProvider>
                    <TooltipProvider>
                        <ToastProvider>
                            <BookingModalProvider>
                                {children}
                            </BookingModalProvider>
                        </ToastProvider>
                    </TooltipProvider>
                </CartProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
