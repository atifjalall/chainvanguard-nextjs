/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import {
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  WalletIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";
import { WalletData } from "@/types/web3";
import { authAPI } from "@/lib/api/auth.api";
import { AnimatePresence, motion } from "framer-motion";
import { AuthRouteGuard } from "@/components/guards/auth-route-guard";
import { usePageTitle } from "@/hooks/use-page-title";

type WalletInputMode = "select" | "manual";

export default function LoginPage() {
  usePageTitle("Login");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [availableWallets, setAvailableWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [walletInputMode, setWalletInputMode] =
    useState<WalletInputMode>("select");
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);

  const [walletError, setWalletError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login } = useAuth();
  const { connectWallet, getAllWallets } = useWallet();
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
      const savedUser = localStorage.getItem("chainvanguard_auth_user");
      const authToken = localStorage.getItem("chainvanguard_auth_token");

      if (savedUser && authToken) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.role) {
            router.push(`/${userData.role}`);
            return;
          }
        } catch (error) {
          console.error("[LOGIN] Error parsing saved user:", error);
          localStorage.removeItem("chainvanguard_auth_user");
          localStorage.removeItem("chainvanguard_auth_token");
        }
      }

      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 500));
      const wallets = getAllWallets();
      setAvailableWallets(wallets);
      await minLoadingTime;
      setIsInitializing(false);
    };

    initializePage();
  }, [getAllWallets, router]);

  useEffect(() => {
    if (walletError) setWalletError("");
  }, [selectedWallet, manualWalletAddress, walletInputMode]);

  useEffect(() => {
    if (passwordError) setPasswordError("");
  }, [password]);

  const getCurrentWalletAddress = (): string | null => {
    if (walletInputMode === "manual") {
      return manualWalletAddress.trim() || null;
    }
    const wallet = availableWallets.find((w) => w.id === selectedWallet);
    return wallet?.address || null;
  };

  const validateForm = (): boolean => {
    let isValid = true;
    const walletAddress = getCurrentWalletAddress();

    if (!walletAddress) {
      setWalletError("Please select or enter a wallet address");
      toast.error("Please select or enter a wallet address");
      isValid = false;
    } else if (
      walletInputMode === "manual" &&
      !walletAddress.match(/^0x[a-fA-F0-9]{40,}$/)
    ) {
      setWalletError("Invalid wallet address format");
      toast.error("Invalid wallet address format");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      toast.error("Password is required");
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      toast.error("Password must be at least 8 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleWalletLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setWalletError("");
    setPasswordError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const walletAddress = getCurrentWalletAddress();

    if (!walletAddress) {
      toast.error("Wallet address is required");
      setIsLoading(false);
      return;
    }

    try {
      if (walletInputMode === "manual") {
        try {
          await authAPI.checkWalletExists(walletAddress);
        } catch (error: any) {
          if (error.response?.status === 404) {
            setWalletError("This wallet is not registered.");
            toast.error("Wallet not found!", {
              duration: 5000,
            });
          } else {
            setWalletError("Failed to verify wallet. Please try again.");
            toast.error("Failed to verify wallet");
          }
          setIsLoading(false);
          return;
        }
      }

      if (walletInputMode === "select" && selectedWallet) {
        const wallet = availableWallets.find((w) => w.id === selectedWallet);
        if (wallet) {
          const connected = await connectWallet(selectedWallet, password);
          if (!connected) {
            setPasswordError("Invalid password for this wallet");
            toast.error("Invalid password for this wallet");
            setIsLoading(false);
            return;
          }
        }
      }

      const loginResponse = await authAPI.login({
        walletAddress: walletAddress,
        password: password,
      });

      await login(walletAddress, password);
      toast.success("Login successful! Redirecting...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const role = loginResponse.data.user.role;
      window.location.href = `/${role}`;
    } catch (error: any) {
      if (error.response?.status === 401) {
        setPasswordError("Incorrect password");
        toast.error("Incorrect password");
      } else if (error.response?.status === 404) {
        setWalletError("Wallet not found");
        toast.error("Wallet not found - Please sign up first");
      } else if (error.response?.status === 429) {
        toast.error("Too many login attempts. Try again in a few minutes");
      } else {
        toast.error(
          error.response?.data?.error ||
            error.message ||
            "Login failed. Please try again."
        );
      }
      setIsLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getSelectedWalletName = () => {
    const wallet = availableWallets.find((w) => w.id === selectedWallet);
    return wallet ? wallet.name : "Select your wallet";
  };

  return (
    <AuthRouteGuard>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="border-gray-200 dark:border-gray-800">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 cursor-pointer">
              <span className="text-lg font-light text-gray-900 dark:text-white tracking-wide">
                ChainVanguard
              </span>
            </Link>

            <Link href="/register" className="cursor-pointer">
              <button className="bg-black dark:bg-white text-white dark:text-black px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors cursor-pointer">
                Create Account
              </button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] py-16">
          <div className="w-full max-w-3xl mx-auto px-12 lg:px-16">
            {isInitializing ? (
              <div className="text-center">
                <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                  Loading...
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Header */}
                <div className="text-center space-y-4">
                  <WalletIcon className="h-12 w-12 mx-auto text-gray-900 dark:text-white opacity-70" />
                  <div className="space-y-2">
                    <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                      Welcome Back
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light">
                      Connect your wallet to access the network
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleWalletLogin} className="space-y-4">
                  {/* Wallet Input Mode Toggle */}
                  <div className="flex border border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setWalletInputMode("select")}
                      className={`flex-1 h-11 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer ${
                        walletInputMode === "select"
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Select Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletInputMode("manual")}
                      className={`flex-1 h-11 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer ${
                        walletInputMode === "manual"
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-white dark:bg-gray-950 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      Enter Manually
                    </button>
                  </div>

                  {/* Wallet Input */}
                  <div className="relative h-[100px]">
                    <AnimatePresence mode="wait">
                      {walletInputMode === "select" ? (
                        <motion.div
                          key="select"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="absolute inset-0"
                        >
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                              Wallet
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowWalletDropdown(!showWalletDropdown)
                                }
                                className={`w-full flex items-center justify-between border-b ${
                                  walletError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px cursor-pointer`}
                              >
                                <span className="h-12 flex items-center text-sm text-gray-900 dark:text-white">
                                  {getSelectedWalletName()}
                                </span>
                                <ChevronDownIcon
                                  className={`h-4 w-4 text-gray-400 transition-transform ${
                                    showWalletDropdown ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {showWalletDropdown && (
                                <>
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowWalletDropdown(false)}
                                  />
                                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 max-h-64 overflow-y-auto">
                                    {availableWallets.length > 0 ? (
                                      availableWallets.map((wallet) => (
                                        <button
                                          key={wallet.id}
                                          type="button"
                                          onClick={() => {
                                            setSelectedWallet(wallet.id);
                                            setShowWalletDropdown(false);
                                          }}
                                          className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800 last:border-0 cursor-pointer"
                                        >
                                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                                            {wallet.name}
                                          </p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                                            {formatAddress(wallet.address)}
                                          </p>
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-4">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                          No wallets found
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="h-4 mt-1">
                            {walletError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {walletError}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="manual"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="absolute inset-0"
                        >
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                              Wallet Address
                            </label>
                            <div
                              className={`border-b ${
                                walletError
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-900 dark:border-white"
                              } pb-px`}
                            >
                              <input
                                type="text"
                                placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                                value={manualWalletAddress}
                                onChange={(e) =>
                                  setManualWalletAddress(e.target.value)
                                }
                                className="w-full h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none font-mono"
                              />
                            </div>
                          </div>
                          <div className="h-4 mt-1">
                            {walletError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {walletError}
                                </p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                        Password
                      </label>
                      <div className="relative">
                        <div
                          className={`border-b ${
                            passwordError
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-900 dark:border-white"
                          } pb-px`}
                        >
                          <div className="flex items-center">
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="h-12 px-3 -mr-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                            >
                              {showPassword ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="h-4 mt-1">
                      {passwordError && (
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                          <p className="text-xs text-red-500">
                            {passwordError}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button and Forgot Password */}
                  <div className="space-y-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin inline" />
                          Connecting...
                        </>
                      ) : (
                        "Connect Wallet"
                      )}
                    </button>

                    {/* Forgot Password */}
                    <button
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                      className="w-full border border-black dark:border-white text-black dark:text-white h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>

                {/* Sign Up Link */}
                <div className="text-center pt-8 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Don&apos;t have a wallet?{" "}
                    <Link
                      href="/register"
                      className="text-gray-900 dark:text-white hover:underline transition-colors cursor-pointer"
                    >
                      Create New Wallet
                    </Link>
                  </p>
                </div>

                {/* No Wallets Warning */}
                {availableWallets.length === 0 &&
                  walletInputMode === "select" && (
                    <div className="border border-gray-200 dark:border-gray-800 p-6">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3">
                          <ExclamationTriangleIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            No wallets found. Create a new wallet or enter your
                            wallet address manually.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => router.push("/register")}
                          className="mx-auto border border-black dark:border-white text-black dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                        >
                          Create Wallet
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>

        {/* Network Status - Fixed Bottom Right */}
        <div className="fixed bottom-4 right-4 hidden sm:block">
          <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-4 py-2 transition-all duration-200">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-1.5 h-1.5 bg-green-500 animate-pulse" />
              <span className="text-gray-600 dark:text-gray-400">
                Hyperledger Network Online
              </span>
            </div>
          </div>
        </div>
      </div>
    </AuthRouteGuard>
  );
}
