/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User, UserRole } from "@/types";
import { authAPI } from "@/lib/api/auth.api";

const ROLE_STORAGE_KEYS = {
  PRIMARY: "chainvanguard_auth_user",
  BACKUP: "chainvanguard_user",
  ROLE_MAP: "chainvanguard_role_map",
  AUTH_TOKEN: "chainvanguard_auth_token",
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
  setUserRole: (role: UserRole) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = useCallback(async () => {
    setIsLoading(true);

    try {
      console.log("[AUTH] Initializing authentication...");

      const token = localStorage.getItem(ROLE_STORAGE_KEYS.AUTH_TOKEN);

      if (!token) {
        console.log("[AUTH] No auth token found");
        setIsLoading(false);
        return;
      }

      const savedUser = localStorage.getItem(ROLE_STORAGE_KEYS.PRIMARY);

      if (savedUser) {
        try {
          const userData: User = JSON.parse(savedUser);
          console.log("[AUTH] Found saved user:", userData.email);

          setUser(userData);
          setIsAuthenticated(true);

          try {
            const profileResponse = await authAPI.getProfile();
            const backendUser = profileResponse.data;

            console.log("[AUTH] Synced with backend user data");
            localStorage.setItem(
              ROLE_STORAGE_KEYS.PRIMARY,
              JSON.stringify(backendUser)
            );
            setUser(backendUser);
          } catch (error) {
            console.warn(
              "[AUTH] Backend sync failed, using cached data:",
              error
            );
          }
        } catch (error) {
          console.error("[AUTH] Error parsing saved user:", error);
          localStorage.removeItem(ROLE_STORAGE_KEYS.PRIMARY);
        }
      } else {
        try {
          const profileResponse = await authAPI.getProfile();
          const userData = profileResponse.data;

          console.log("[AUTH] Fetched user from backend:", userData.email);
          localStorage.setItem(
            ROLE_STORAGE_KEYS.PRIMARY,
            JSON.stringify(userData)
          );
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("[AUTH] Failed to fetch user profile:", error);
          await logout();
        }
      }
    } catch (error) {
      console.error("[AUTH] Auth initialization error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    walletAddress: string,
    password: string
  ): Promise<void> => {
    setIsLoading(true);

    try {
      console.log("[AUTH] Login called for wallet:", walletAddress);

      // Check if we have user data from backend already
      const backendUserData = localStorage.getItem(ROLE_STORAGE_KEYS.PRIMARY);
      const authToken = localStorage.getItem(ROLE_STORAGE_KEYS.AUTH_TOKEN);

      if (backendUserData && authToken) {
        try {
          const userData: User = JSON.parse(backendUserData);
          console.log("[AUTH] Using existing backend user data");

          if (
            userData.walletAddress?.toLowerCase() ===
            walletAddress.toLowerCase()
          ) {
            setUser(userData);
            setIsAuthenticated(true);
            console.log("[AUTH] ✅ Login successful with cached data");
            return;
          }
        } catch (error) {
          console.error("[AUTH] Error parsing cached user data:", error);
        }
      }

      // If no valid cached data, this is an error - login should have been called by login page
      console.warn(
        "[AUTH] No cached user data found - user should login via API first"
      );
    } catch (error: any) {
      console.error("[AUTH] Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      console.log("[AUTH] Logging out...");

      try {
        await authAPI.logout();
      } catch (error) {
        console.warn("[AUTH] Backend logout failed:", error);
      }

      localStorage.removeItem(ROLE_STORAGE_KEYS.PRIMARY);
      localStorage.removeItem(ROLE_STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem(ROLE_STORAGE_KEYS.BACKUP);
      localStorage.removeItem("chainvanguard_auth");

      document.cookie =
        "chainvanguard_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";

      setUser(null);
      setIsAuthenticated(false);

      console.log("[AUTH] Logout completed");
    } catch (error) {
      console.error("[AUTH] Logout error:", error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = useCallback(
    (updates: Partial<User>) => {
      if (!user) {
        console.warn("[AUTH] Cannot update profile - no user logged in");
        return;
      }

      try {
        const updatedUser: User = {
          ...user,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        console.log("[AUTH] Updating user profile");

        localStorage.setItem(
          ROLE_STORAGE_KEYS.PRIMARY,
          JSON.stringify(updatedUser)
        );
        localStorage.setItem(
          ROLE_STORAGE_KEYS.BACKUP,
          JSON.stringify(updatedUser)
        );

        if (updates.role) {
          updateRoleMap(updatedUser.walletAddress, updates.role);
        }

        setUser(updatedUser);

        console.log("[AUTH] Profile updated successfully");
      } catch (error) {
        console.error("[AUTH] Error updating profile:", error);
      }
    },
    [user]
  );

  const setUserRole = useCallback(
    (role: UserRole) => {
      if (!user) {
        console.warn("[AUTH] Cannot set role - no user logged in");
        return;
      }

      console.log("[AUTH] Setting user role to:", role);

      const organizationMSP =
        role === "supplier"
          ? "SupplierMSP"
          : role === "vendor"
            ? "VendorMSP"
            : role === "customer"
              ? "CustomerMSP"
              : "AdminMSP";

      updateProfile({
        role,
        organizationMSP,
      });
    },
    [user, updateProfile]
  );

  const refreshUser = async (): Promise<void> => {
    if (!isAuthenticated) {
      console.log("[AUTH] Cannot refresh - user not authenticated");
      return;
    }

    try {
      console.log("[AUTH] Refreshing user data from backend...");

      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;

      localStorage.setItem(ROLE_STORAGE_KEYS.PRIMARY, JSON.stringify(userData));
      localStorage.setItem(ROLE_STORAGE_KEYS.BACKUP, JSON.stringify(userData));

      setUser(userData);

      console.log("[AUTH] User data refreshed successfully");
    } catch (error) {
      console.error("[AUTH] Failed to refresh user data:", error);

      if ((error as any)?.response?.status === 401) {
        await logout();
        throw new Error("Session expired. Please login again.");
      }
    }
  };

  const updateRoleMap = (walletAddress: string, role: UserRole) => {
    try {
      const roleMapStr = localStorage.getItem(ROLE_STORAGE_KEYS.ROLE_MAP);
      const roleMap = roleMapStr ? JSON.parse(roleMapStr) : {};

      roleMap[walletAddress.toLowerCase()] = role;

      localStorage.setItem(ROLE_STORAGE_KEYS.ROLE_MAP, JSON.stringify(roleMap));
      console.log("[AUTH] Role map updated for wallet:", walletAddress);
    } catch (error) {
      console.error("[AUTH] Error updating role map:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateProfile,
    setUserRole,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthProvider;
