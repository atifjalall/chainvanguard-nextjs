"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User, UserRole } from "@/types/web3";
import { RolePreservation, ROLE_STORAGE_KEYS } from "@/utils/role-preservation";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (walletAddress: string, password: string) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  updateProfile: (profileData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem(ROLE_STORAGE_KEYS.PRIMARY);
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);

        // Verify and recover role if missing
        if (!userData.role && userData.walletAddress) {
          const recoveredRole = RolePreservation.retrieveRole(
            userData.walletAddress
          );
          if (recoveredRole) {
            userData.role = recoveredRole;
            localStorage.setItem(
              ROLE_STORAGE_KEYS.PRIMARY,
              JSON.stringify(userData)
            );
            console.log(
              "[AUTH] Role recovered during initialization:",
              recoveredRole
            );
          }
        }

        setUser(userData);
        setIsAuthenticated(true);
        console.log("[AUTH] Auth provider initialized with user:", userData);
      } catch (error) {
        console.error("[AUTH] Error parsing saved user data:", error);
        localStorage.removeItem(ROLE_STORAGE_KEYS.PRIMARY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    walletAddress: string,
    password: string
  ): Promise<void> => {
    setIsLoading(true);

    try {
      console.log("[AUTH] Starting login for wallet:", walletAddress);

      // Step 1: Try to retrieve existing user data (preserving everything)
      let userData: User | null = null;
      const existingUserData = localStorage.getItem(ROLE_STORAGE_KEYS.PRIMARY);

      if (existingUserData) {
        try {
          userData = JSON.parse(existingUserData);
          console.log("[AUTH] Found existing user data:", userData);

          // Check if this is the same wallet
          if (userData?.walletAddress === walletAddress) {
            // Same wallet - preserve all data, just update login time
            userData.loginAt = new Date().toISOString();
            userData.isAuthenticated = true;
            userData.updatedAt = new Date().toISOString();
            console.log(
              "[AUTH] Same wallet login, data preserved with role:",
              userData.role
            );
          } else {
            // Different wallet - try to recover role for this wallet
            userData = null; // Reset to create new user data
          }
        } catch (error) {
          console.error("[AUTH] Error parsing existing user data:", error);
          userData = null;
        }
      }

      // Step 2: If no matching user data, try to recover or create new
      if (!userData) {
        console.log(
          "[AUTH] Creating new user data, attempting role recovery..."
        );

        const recoveredRole = RolePreservation.retrieveRole(walletAddress);

        userData = {
          id: Date.now().toString(),
          walletAddress,
          walletName: RolePreservation.getWalletName(walletAddress),
          role: recoveredRole || undefined,
          name: "User",
          loginAt: new Date().toISOString(),
          isAuthenticated: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log(
          "[AUTH] Created user data with recovered role:",
          userData.role
        );
      }

      // Step 3: Double-check role preservation
      if (!userData.role) {
        console.warn("[AUTH] Role still missing, attempting final recovery...");
        const recoveredRole = RolePreservation.retrieveRole(walletAddress);
        if (recoveredRole) {
          userData.role = recoveredRole;
          console.log("[AUTH] Final role recovery successful:", recoveredRole);
        }
      }

      // Step 4: Save with full role preservation
      if (userData.role) {
        RolePreservation.saveRole(walletAddress, userData.role, userData);
      } else {
        localStorage.setItem(
          ROLE_STORAGE_KEYS.PRIMARY,
          JSON.stringify(userData)
        );
      }

      // Step 5: Update auth state
      setUser(userData);
      setIsAuthenticated(true);

      // Step 6: Verify consistency
      const consistency = RolePreservation.verifyRoleConsistency(walletAddress);
      console.log("[AUTH] Role consistency check:", consistency);

      console.log(
        "[AUTH] Login completed successfully with role:",
        userData.role
      );
    } catch (error) {
      console.error("[AUTH] Login failed:", error);
      throw new Error("Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log("[AUTH] Logging out user");
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem(ROLE_STORAGE_KEYS.PRIMARY);
    localStorage.removeItem("chainvanguard_current_wallet");
    // Clear auth cookie
    document.cookie =
      "chainvanguard_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  };

  const setUserRole = (role: UserRole) => {
    if (!user) {
      console.warn("[AUTH] Cannot set role: no user logged in");
      return;
    }

    const updatedUser = {
      ...user,
      role,
      updatedAt: new Date().toISOString(),
    };

    // Save with full preservation
    RolePreservation.saveRole(user.walletAddress, role, updatedUser);

    setUser(updatedUser);

    console.log("[AUTH] Role set with full preservation:", role);
  };

  const updateProfile = (profileData: Partial<User>) => {
    if (!user) {
      console.warn("[AUTH] Cannot update profile: no user logged in");
      return;
    }

    const updatedUser = {
      ...user,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    // If role is being updated, use full preservation
    if (profileData.role) {
      RolePreservation.saveRole(
        user.walletAddress,
        profileData.role,
        updatedUser
      );
    } else {
      localStorage.setItem(
        ROLE_STORAGE_KEYS.PRIMARY,
        JSON.stringify(updatedUser)
      );
    }

    setUser(updatedUser);

    console.log("[AUTH] Profile updated with preservation");
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    setUserRole,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
