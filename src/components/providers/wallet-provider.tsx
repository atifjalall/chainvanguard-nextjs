/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { WalletData, Transaction } from "@/types/web3";
import { WalletContextType } from "@/types";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

// Backend transaction type mapping
interface BackendTransaction {
  _id: string;
  type: "deposit" | "withdrawal" | "payment" | "transfer_in" | "transfer_out";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  status: "pending" | "completed" | "failed";
  relatedUserId?: string;
  timestamp: string;
  metadata?: any;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [currentWallet, setCurrentWallet] = useState<WalletData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const authUser = apiClient.getAuthUser();

  const fetchBackendBalance = async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        console.log("[WALLET] ❌ Not authenticated, skipping balance fetch");
        return;
      }

      console.log("[WALLET] 🔄 Fetching balance from backend...");
      console.log("[WALLET] API URL:", process.env.NEXT_PUBLIC_API_URL);

      const response: any = await apiClient.get("/wallet/balance");

      console.log("[WALLET] ✅ Backend response:", response);

      if (response.success && response.data) {
        const backendBalance = response.data.balance;
        console.log("[WALLET] 💰 Backend balance:", backendBalance);
        setBalance(backendBalance);

        // Sync to localStorage
        if (currentWallet) {
          localStorage.setItem(
            `wallet_${currentWallet.id}_balance`,
            backendBalance.toString()
          );
          console.log("[WALLET] 💾 Saved balance to localStorage");
        }
      } else {
        console.error("[WALLET] ❌ Invalid response format:", response);
      }
    } catch (error: any) {
      console.error("[WALLET] ❌ Failed to fetch backend balance:", error);
      console.error("[WALLET] Error details:", error.response?.data);

      // Fallback to localStorage balance
      if (currentWallet) {
        const savedBalance = localStorage.getItem(
          `wallet_${currentWallet.id}_balance`
        );
        if (savedBalance) {
          console.log("[WALLET] 📦 Using cached balance:", savedBalance);
          setBalance(parseInt(savedBalance));
        }
      }
    }
  };

  const fetchBackendTransactions = async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        console.log("[WALLET] Not authenticated, skipping transactions fetch");
        return;
      }

      console.log("[WALLET] Fetching transactions from backend...");
      const response: any = await apiClient.get(
        "/wallet/transactions?page=1&limit=20"
      );

      console.log("[WALLET] Transactions response:", response); // Debug log

      if (response.success && response.data) {
        // ✅ Add safety check here
        const backendTransactions: BackendTransaction[] = Array.isArray(
          response.data.transactions
        )
          ? response.data.transactions
          : [];

        // If no transactions, set empty array and return
        if (backendTransactions.length === 0) {
          console.log("[WALLET] No transactions found");
          setTransactions([]);
          return;
        }

        // Map backend transactions to frontend format
        const mappedTransactions: Transaction[] = backendTransactions.map(
          (tx) => {
            // Determine from and to based on transaction type
            const walletAddress = currentWallet?.address || "";

            let from: string;
            let to: string;

            switch (tx.type) {
              case "deposit":
                from = tx.metadata?.paymentMethod || "External";
                to = walletAddress;
                break;
              case "withdrawal":
                from = walletAddress;
                to = tx.metadata?.bankAccount || "Bank Account";
                break;
              case "transfer_out":
              case "payment":
                from = walletAddress;
                to =
                  tx.metadata?.recipientWallet ||
                  tx.metadata?.recipientEmail ||
                  tx.relatedUserId ||
                  "Unknown";
                break;
              case "transfer_in":
                from =
                  tx.metadata?.senderWallet ||
                  tx.metadata?.senderEmail ||
                  tx.relatedUserId ||
                  "Unknown";
                to = walletAddress;
                break;
              default:
                from = walletAddress;
                to = "Unknown";
            }

            return {
              id: tx._id,
              type: mapTransactionType(tx.type),
              amount: tx.amount,
              description: tx.description,
              timestamp: tx.timestamp,
              status: tx.status as "pending" | "completed" | "failed",
              from,
              to,
              txHash: tx.metadata?.txHash,
              category: tx.metadata?.category || "General",
              counterparty:
                tx.metadata?.recipientName || tx.metadata?.senderName || "",
            };
          }
        );

        console.log(
          "[WALLET] Backend transactions mapped:",
          mappedTransactions.length
        );
        setTransactions(mappedTransactions);

        // Sync to localStorage
        if (currentWallet) {
          localStorage.setItem(
            `wallet_${currentWallet.id}_transactions`,
            JSON.stringify(mappedTransactions)
          );
        }
      } else {
        console.log("[WALLET] No transaction data in response");
        setTransactions([]);
      }
    } catch (error: any) {
      console.error("[WALLET] Failed to fetch backend transactions:", error);
      console.error("[WALLET] Error details:", error.response?.data);

      // Set empty array on error
      setTransactions([]);

      // Fallback to localStorage transactions only if they exist
      if (currentWallet) {
        const savedTransactions = localStorage.getItem(
          `wallet_${currentWallet.id}_transactions`
        );
        if (savedTransactions) {
          try {
            const parsed = JSON.parse(savedTransactions);
            if (Array.isArray(parsed)) {
              setTransactions(parsed);
              console.log("[WALLET] Using cached transactions");
            }
          } catch (e) {
            console.error("[WALLET] Error parsing saved transactions:", e);
          }
        }
      }
    }
  };

  // Helper: Map backend transaction types to frontend types
  const mapTransactionType = (
    backendType: string
  ): "deposit" | "withdrawal" | "payment" | "received" => {
    switch (backendType) {
      case "transfer_in":
        return "received";
      case "transfer_out":
        return "payment";
      case "deposit":
        return "deposit";
      case "withdrawal":
        return "withdrawal";
      case "payment":
        return "payment";
      default:
        return "payment";
    }
  };

  // INITIALIZE: Load saved wallet from localStorage and fetch from backend
  useEffect(() => {
    const initializeWallet = () => {
      console.log("[WALLET] 🔄 Initializing wallet...");

      // First, try to load from localStorage
      const savedWallet = localStorage.getItem("chainvanguard_current_wallet");

      if (savedWallet) {
        try {
          const walletData = JSON.parse(savedWallet);
          console.log("[WALLET] ✅ Found saved wallet:", walletData.address);
          setCurrentWallet(walletData);
          setIsConnected(true);
          loadWalletData(walletData.id);

          // Fetch from backend if authenticated
          if (apiClient.isAuthenticated()) {
            fetchBackendBalance();
            fetchBackendTransactions();
          }
          return;
        } catch (error) {
          console.error("[WALLET] ❌ Error parsing saved wallet:", error);
          localStorage.removeItem("chainvanguard_current_wallet");
        }
      }

      // If no saved wallet but user is authenticated, create wallet from user data
      if (authUser && authUser.walletAddress) {
        console.log("[WALLET] 📝 Creating wallet from auth user data");
        const walletData: WalletData = {
          id: authUser._id || authUser.id || Date.now().toString(),
          name: `${authUser.name}'s Wallet`,
          address: authUser.walletAddress,
          createdAt: new Date().toISOString(),
          encryptedPrivateKey: `encrypted_${authUser._id || authUser.id}`,
        };

        setCurrentWallet(walletData);
        setIsConnected(true);

        // Save to localStorage
        localStorage.setItem(
          "chainvanguard_current_wallet",
          JSON.stringify(walletData)
        );

        // Save to wallets list if not already there
        const existingWallets = JSON.parse(
          localStorage.getItem("chainvanguard_wallets") || "[]"
        );
        const walletExists = existingWallets.some(
          (w: WalletData) => w.address === walletData.address
        );
        if (!walletExists) {
          existingWallets.push(walletData);
          localStorage.setItem(
            "chainvanguard_wallets",
            JSON.stringify(existingWallets)
          );
        }

        // Fetch from backend
        if (apiClient.isAuthenticated()) {
          fetchBackendBalance();
          fetchBackendTransactions();
        }

        console.log("[WALLET] ✅ Wallet initialized from auth user");
      } else {
        console.warn("[WALLET] ⚠️ No wallet found and user not authenticated");
      }
    };

    initializeWallet();
  }, [authUser?.walletAddress]);

  // NEW: Auto-refresh balance and transactions when authenticated
  useEffect(() => {
    if (apiClient.isAuthenticated() && currentWallet) {
      fetchBackendBalance();
      fetchBackendTransactions();

      // Optional: Set up periodic refresh (every 30 seconds)
      const interval = setInterval(() => {
        fetchBackendBalance();
        fetchBackendTransactions();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [currentWallet, apiClient.isAuthenticated()]);

  const connectWallet = async (
    walletId: string,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      console.log("[WALLET] Connecting to wallet:", walletId);

      const wallets = getAllWallets();
      const wallet = wallets.find((w) => w.id === walletId);

      if (!wallet) {
        console.error("[WALLET] Wallet not found in local storage");
        return false;
      }

      // Verify password
      const storedPassword = localStorage.getItem(
        `wallet_${walletId}_password`
      );

      if (!storedPassword) {
        console.warn("[WALLET] No password stored for this wallet");
      } else if (storedPassword !== password) {
        console.error("[WALLET] Invalid password");
        return false;
      }

      // Set as current wallet
      setCurrentWallet(wallet);
      setIsConnected(true);
      localStorage.setItem(
        "chainvanguard_current_wallet",
        JSON.stringify(wallet)
      );

      // Load wallet data from localStorage first (fast)
      await loadWalletData(walletId);

      // Then fetch from backend (accurate)
      if (apiClient.isAuthenticated()) {
        await fetchBackendBalance();
        await fetchBackendTransactions();
      }

      console.log("[WALLET] ✅ Wallet connected successfully");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to connect wallet";
      console.error("[WALLET] Connection error:", errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    console.log("[WALLET] Disconnecting wallet...");

    setCurrentWallet(null);
    setIsConnected(false);
    setBalance(0);
    setTransactions([]);

    localStorage.removeItem("chainvanguard_current_wallet");

    console.log("[WALLET] ✅ Wallet disconnected");
  };

  const getAllWallets = (): WalletData[] => {
    try {
      const wallets = localStorage.getItem("chainvanguard_wallets");
      const parsedWallets = wallets ? JSON.parse(wallets) : [];
      console.log("[WALLET] Retrieved wallets:", parsedWallets.length);
      return parsedWallets;
    } catch (error) {
      console.error("[WALLET] Error loading wallets:", error);
      return [];
    }
  };

  const loadWalletData = async (walletId: string) => {
    try {
      console.log("[WALLET] Loading data for wallet:", walletId);

      // Load balance from localStorage (temporary until backend loads)
      const savedBalance = localStorage.getItem(`wallet_${walletId}_balance`);
      const walletBalance = savedBalance ? parseInt(savedBalance) : 0;
      setBalance(walletBalance);

      // Load transactions from localStorage (temporary until backend loads)
      const savedTransactions = localStorage.getItem(
        `wallet_${walletId}_transactions`
      );
      const walletTransactions = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];
      setTransactions(walletTransactions);

      console.log("[WALLET] ✅ Wallet data loaded from localStorage");
    } catch (error) {
      console.error("[WALLET] Error loading wallet data:", error);
    }
  };

  const createWallet = async (
    name: string,
    password: string
  ): Promise<WalletData> => {
    console.error("[WALLET] ❌ createWallet() should NOT be called!");
    console.error(
      "[WALLET] Wallets are created by backend during registration"
    );

    throw new Error(
      "Wallet creation must be done through backend registration API. " +
        "Please use authAPI.register() instead."
    );
  };

  const generateRecoveryPhrase = (): string => {
    console.error("[WALLET] ❌ generateRecoveryPhrase() should NOT be called!");
    console.error(
      "[WALLET] Recovery phrases are generated by backend during registration"
    );

    throw new Error(
      "Recovery phrase generation must be done by backend. " +
        "The mnemonic is returned in the registration response."
    );
  };

  const recoverWallet = async (
    recoveryPhrase: string,
    newPassword: string
  ): Promise<WalletData> => {
    setIsLoading(true);

    try {
      console.log("[WALLET] Recovering wallet from mnemonic...");

      // Validate recovery phrase
      const words = recoveryPhrase.trim().split(/\s+/);
      if (words.length !== 12) {
        throw new Error("Recovery phrase must contain exactly 12 words");
      }

      // Check if wallet exists locally first
      const existingWallets = getAllWallets();

      for (const wallet of existingWallets) {
        const storedMnemonic = localStorage.getItem(
          `wallet_${wallet.id}_recovery`
        );
        if (storedMnemonic === recoveryPhrase) {
          // Update password
          localStorage.setItem(`wallet_${wallet.id}_password`, newPassword);
          console.log(
            "[WALLET] ✅ Wallet recovered locally and password updated"
          );
          toast.success("Wallet recovered successfully!");
          return wallet;
        }
      }

      // If not found locally, we need backend to recover it
      throw new Error(
        "Wallet not found. Please use the forgot password page or contact support."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to recover wallet";
      console.error("[WALLET] Recovery error:", errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Update balance with backend sync
  const updateBalance = async (newBalance: number) => {
    console.log("[WALLET] Updating balance:", newBalance);
    setBalance(newBalance);

    if (currentWallet) {
      localStorage.setItem(
        `wallet_${currentWallet.id}_balance`,
        newBalance.toString()
      );
    }

    // Refresh from backend to ensure accuracy
    if (apiClient.isAuthenticated()) {
      setTimeout(() => {
        fetchBackendBalance();
        fetchBackendTransactions();
      }, 1000);
    }
  };

  // NEW: Refresh methods for manual updates
  const refreshBalance = async () => {
    await fetchBackendBalance();
  };

  const refreshTransactions = async () => {
    await fetchBackendTransactions();
  };

  const value: WalletContextType = {
    currentWallet,
    isConnected,
    balance,
    transactions,
    connectWallet,
    disconnectWallet,
    createWallet,
    getAllWallets,
    generateRecoveryPhrase,
    recoverWallet,
    isLoading,
    updateBalance,
    // NEW: Add refresh methods
    refreshBalance,
    refreshTransactions,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};

// HELPER: Save backend wallet to localStorage
export const saveWalletToLocalStorage = (wallet: {
  address: string;
  mnemonic: string;
  name: string;
  password: string;
}) => {
  try {
    console.log("[WALLET] 💾 Saving backend wallet to localStorage...");
    console.log("[WALLET] Address:", wallet.address);
    console.log("[WALLET] Name:", wallet.name);

    const walletId = Date.now().toString();

    const walletData: WalletData = {
      id: walletId,
      name: wallet.name,
      address: wallet.address,
      createdAt: new Date().toISOString(),
      encryptedPrivateKey: `encrypted_${walletId}_${Date.now()}`,
    };

    // Get existing wallets
    const existingWallets = JSON.parse(
      localStorage.getItem("chainvanguard_wallets") || "[]"
    );

    // Check for duplicates
    const duplicate = existingWallets.find(
      (w: WalletData) => w.address === wallet.address
    );
    if (duplicate) {
      console.warn("[WALLET] ⚠️ Wallet already exists in localStorage");
      return duplicate;
    }

    // Add new wallet
    existingWallets.push(walletData);
    localStorage.setItem(
      "chainvanguard_wallets",
      JSON.stringify(existingWallets)
    );

    // Save credentials and recovery phrase FROM BACKEND
    localStorage.setItem(`wallet_${walletId}_password`, wallet.password);
    localStorage.setItem(`wallet_${walletId}_recovery`, wallet.mnemonic);

    // Initialize balance and transactions (backend will provide real values)
    localStorage.setItem(`wallet_${walletId}_balance`, "0");
    localStorage.setItem(`wallet_${walletId}_transactions`, JSON.stringify([]));

    console.log("[WALLET] ✅ Wallet saved successfully");
    console.log("[WALLET] Wallet ID:", walletId);
    console.log("[WALLET] Total wallets:", existingWallets.length);

    return walletData;
  } catch (error) {
    console.error("[WALLET] ❌ Error saving wallet:", error);
    throw error;
  }
};
