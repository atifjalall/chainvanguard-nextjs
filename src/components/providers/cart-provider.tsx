"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./auth-provider";
import { getCart, getCartCount } from "@/lib/api/customer.cart.api";
import { Cart } from "@/lib/api/customer.cart.api";

interface CartContextType {
  cart: Cart | null;
  cartCount: number;
  loading: boolean;
  refreshCart: () => Promise<void>;
  refreshCartCount: () => Promise<void>;
  setCartCount: (count: number) => void;
  incrementCartCount: (amount?: number) => void;
  decrementCartCount: (amount?: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshCart = async () => {
    if (!user) {
      setCart(null);
      setCartCount(0);
      return;
    }

    try {
      setLoading(true);
      const response = await getCart();
      setCart(response.data);
      // Ensure count is 0 if cart is empty or has no items
      const count = response.data?.items?.length || response.data?.totalItems || 0;
      setCartCount(count > 0 ? count : 0);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setCart(null);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  const refreshCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

    try {
      const response = await getCartCount();
      // Ensure count is a valid number and not negative
      const count = typeof response.count === 'number' && response.count > 0 ? response.count : 0;
      setCartCount(count);
    } catch (err) {
      console.error("Error fetching cart count:", err);
      setCartCount(0);
    }
  };

  const incrementCartCount = (amount: number = 1) => {
    setCartCount((prev) => Math.max(0, prev + amount));
  };

  const decrementCartCount = (amount: number = 1) => {
    setCartCount((prev) => Math.max(0, prev - amount));
  };

  useEffect(() => {
    if (user) {
      // Initial fetch
      refreshCartCount();
      // Poll every 30 seconds for updates (reduced from 3s to prevent spam)
      const interval = setInterval(() => {
        refreshCartCount();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setCart(null);
      setCartCount(0);
    }
  }, [user]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        loading,
        refreshCart,
        refreshCartCount,
        setCartCount,
        incrementCartCount,
        decrementCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
