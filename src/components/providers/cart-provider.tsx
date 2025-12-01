"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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
      // ✅ Use items.length for unique item count, not totalItems or totalQuantity
      const count = response.data?.items?.length || 0;
      console.log(
        `[CART PROVIDER] Refreshed cart. Items: ${count}, Response totalItems: ${response.data?.totalItems}`
      );
      setCartCount(count);

      // ✅ If cart is empty but count shows items, force refresh from server
      if (count === 0 && cartCount > 0) {
        console.log(
          "[CART PROVIDER] Detected stale count, forcing server refresh"
        );
        await refreshCartCount();
      }
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
      // ✅ Ensure count is valid and use it directly
      const count =
        typeof response.count === "number" ? Math.max(0, response.count) : 0;
      console.log(`[CART PROVIDER] Cart count from server: ${count}`);
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
      // ✅ Poll every 10 seconds for updates (increased frequency for testing)
      const interval = setInterval(() => {
        refreshCartCount();
      }, 10000); // 10 seconds during testing, change back to 30000 later
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
