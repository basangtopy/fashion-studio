"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { isAuthenticated } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Fetch cart from API
    const {
        data: cart,
        isLoading,
    } = useQuery({
        queryKey: ["cart"],
        queryFn: async () => {
            const { data } = await api.get("/cart");
            return isAuthenticated ? data.data?.cart || data.data : null;
        },
        enabled: isAuthenticated,
    });

    // Add item to cart
    const addToCart = useMutation({
        mutationFn: async ({ readyToWearId, selectedSize, quantity }) => {
            const { data } = await api.post("/cart/items", {
                readyToWearId,
                selectedSize,
                quantity,
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            setIsOpen(true);
        },
    });

    // Update item quantity
    const updateQuantity = useMutation({
        mutationFn: async ({ itemId, quantity }) => {
            const { data } = await api.put(`/cart/items/${itemId}`, { quantity });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        },
    });

    // Remove item from cart
    const removeItem = useMutation({
        mutationFn: async (itemId) => {
            const { data } = await api.delete(`/cart/items/${itemId}`);
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        },
    });

    // Clear cart
    const clearCart = useMutation({
        mutationFn: async () => {
            const { data } = await api.delete("/cart");
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        },
    });

    // Checkout
    const checkout = useMutation({
        mutationFn: async ({ fulfillmentMethod, deliveryAddress, clientNotes }) => {
            const { data } = await api.post("/cart/checkout", {
                fulfillmentMethod,
                deliveryAddress,
                clientNotes,
            });
            return data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            setIsOpen(false);
        },
    });

    const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

    const subtotal =
        cart?.items?.reduce(
            (sum, item) => sum + Number(item.readyToWear?.price || 0) * item.quantity,
            0
        ) || 0;

    const value = {
        cart,
        isLoading,
        isOpen,
        setIsOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        checkout,
        itemCount,
        subtotal,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
