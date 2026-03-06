"use client";

import { createContext, useContext, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { BookingModal } from "./BookingModal";
import { useAuth } from "@/context/AuthContext";

const BookingModalContext = createContext(null);

function BookingModalLogic({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            const action = searchParams.get("action");
            if (action === "book_appointment") {
                setIsOpen(true);

                // Clean the URL so it doesn't pop open again automatically on refresh
                const params = new URLSearchParams(searchParams.toString());
                params.delete("action");
                params.delete("redirectURL"); // clear redirect URL footprint
                const newQuery = params.toString() ? `?${params.toString()}` : "";
                router.replace(`${pathname}${newQuery}`, { scroll: false });
            }
        }
    }, [searchParams, isAuthenticated, loading, router, pathname]);

    return (
        <BookingModalContext.Provider value={{ isOpen, openModal: () => setIsOpen(true), closeModal: () => setIsOpen(false) }}>
            {children}
            <BookingModal isOpen={isOpen} onOpenChange={setIsOpen} />
        </BookingModalContext.Provider>
    );
}

export function BookingModalProvider({ children }) {
    return (
        <Suspense fallback={<>{children}</>}>
            <BookingModalLogic>{children}</BookingModalLogic>
        </Suspense>
    );
}

export const useBookingModal = () => {
    const context = useContext(BookingModalContext);
    if (!context) {
        throw new Error("useBookingModal must be used within a BookingModalProvider");
    }
    return context;
};
