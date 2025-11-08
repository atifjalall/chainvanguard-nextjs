/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Package,
  Wallet,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle,
  LogIn,
  Lock,
  Edit3,
  XCircle,
} from "lucide-react";
import { WalletData } from "@/types/web3";
import { authAPI } from "@/lib/api/auth.api";
import { AnimatePresence, motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthRouteGuard } from "@/components/guards/auth-route-guard";

type WalletInputMode = "select" | "manual";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [availableWallets, setAvailableWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [walletInputMode, setWalletInputMode] =
    useState<WalletInputMode>("select");

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
        toast.error("Wallet not found - Please sign up for first");
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

  return (
    <AuthRouteGuard>
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        {/* Header */}
        <header className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="w-full px-6 h-16 flex items-center">
            {/* Logo on the far left */}
            <Link
              href="/"
              className="flex items-center space-x-3 group cursor-pointer"
            >
              <Package className="h-6 w-6 text-gray-900 dark:text-white" />
              <span className="text-xl font-light text-gray-900 dark:text-white">
                ChainVanguard
              </span>
            </Link>

            {/* Push navbar to the right */}
            <nav className="flex items-center gap-2 ml-auto">
              <ThemeToggle />
              <Link href="/register">
                <Button
                  size="sm"
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-none cursor-pointer text-xs h-9 px-4"
                >
                  Create Account
                </Button>
              </Link>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4 min-h-[calc(100vh-8rem)]">
          <div className="w-full max-w-2xl">
            {isInitializing ? (
              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6">
                {/* Header Skeleton */}
                <div className="text-center space-y-2 mb-5">
                  <Skeleton className="h-12 w-12 mx-auto mb-2 rounded-none" />
                  <Skeleton className="h-6 w-40 mx-auto rounded-none" />
                  <Skeleton className="h-4 w-56 mx-auto rounded-none" />
                </div>
                {/* Form Skeleton */}
                <form className="space-y-3">
                  {/* Wallet Input Mode Toggle */}
                  <Skeleton className="h-9 w-full rounded-none" />

                  {/* Wallet Input */}
                  <div className="relative h-[60px] mb-3">
                    <div className="space-y-1.5 absolute inset-0">
                      <Skeleton className="h-4 w-32 mb-1 rounded-none" />
                      <Skeleton className="h-9 w-full rounded-none" />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28 mb-1 rounded-none" />
                    <Skeleton className="h-9 w-full rounded-none" />
                  </div>

                  {/* Submit Button */}
                  <Skeleton className="h-9 w-full mt-1 rounded-none" />

                  {/* Forgot Password Button */}
                  <Skeleton className="h-8 w-full mt-1 rounded-none" />
                </form>

                {/* Sign Up Link */}
                <div className="mt-8 text-center">
                  <Skeleton className="h-4 w-52 mx-auto rounded-none" />
                </div>

                {/* No Wallets Warning */}
                {/* Optionally, you can show a skeleton for the warning box if needed */}

                {/* Network Status */}
                  <Skeleton className="h-9 w-full mt-1 rounded-none" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6">
                {/* Header */}
                <div className="text-center space-y-2 mb-5">
                  <Wallet className="h-12 w-12 mx-auto text-gray-900 dark:text-white mb-2" />
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                    Welcome Back
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Connect your Hyperledger Fabric wallet to access the supply
                    chain network
                  </p>
                </div>

                <form onSubmit={handleWalletLogin} className="space-y-3">
                  {/* Wallet Input Mode Toggle */}
                  <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={() => setWalletInputMode("select")}
                      className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer ${
                        walletInputMode === "select"
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <Wallet className="h-3.5 w-3.5 inline mr-1.5" />
                      Select Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletInputMode("manual")}
                      className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer ${
                        walletInputMode === "manual"
                          ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <Edit3 className="h-3.5 w-3.5 inline mr-1.5" />
                      Enter Manually
                    </button>
                  </div>
                  {/* Wallet Input */}
                  <div className="relative h-[60px] mb-3">
                    <AnimatePresence mode="wait">
                      {walletInputMode === "select" ? (
                        <motion.div
                          key="select"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-1.5 absolute inset-0"
                        >
                          <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <Wallet className="h-3 w-3" />
                            Select Your Wallet
                          </Label>
                          <Select
                            value={selectedWallet}
                            onValueChange={setSelectedWallet}
                          >
                            <SelectTrigger
                              className={`h-9 w-full border rounded-none bg-white/50 dark:bg-gray-800/50 text-xs hover:border-gray-900 dark:hover:border-white transition-colors ${
                                walletError
                                  ? "border-red-500 dark:border-red-500"
                                  : "border-gray-200 dark:border-gray-700"
                              }`}
                            >
                              <SelectValue placeholder="Choose your wallet" />
                            </SelectTrigger>
                            <SelectContent className="rounded-none">
                              {availableWallets.map((wallet) => (
                                <SelectItem
                                  key={wallet.id}
                                  value={wallet.id}
                                  className="cursor-pointer py-2 px-2.5"
                                >
                                  <div className="flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-gray-900 dark:text-white" />
                                    <div className="flex-1 text-left">
                                      <div className="font-medium text-xs text-gray-900 dark:text-gray-100 leading-tight">
                                        {wallet.name}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400 font-mono leading-tight mt-0.5">
                                        {formatAddress(wallet.address)}
                                      </div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                              {availableWallets.length === 0 && (
                                <SelectItem value="no-wallet" disabled>
                                  No wallets found
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {walletError && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                              <XCircle className="h-3 w-3" />
                              {walletError}
                            </p>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div
                          key="manual"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="space-y-1.5 absolute inset-0"
                        >
                          <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <Edit3 className="h-3 w-3" />
                            Enter Wallet Address
                          </Label>
                          <Input
                            type="text"
                            placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                            value={manualWalletAddress}
                            onChange={(e) =>
                              setManualWalletAddress(e.target.value)
                            }
                            className={`h-9 border rounded-none bg-white/50 dark:bg-gray-800/50 font-mono text-xs placeholder:text-xs hover:border-gray-900 dark:hover:border-white transition-colors cursor-text ${
                              walletError
                                ? "border-red-300 dark:border-red-700"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          {walletError && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                              <XCircle className="h-3 w-3" />
                              {walletError}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Lock className="h-3 w-3" />
                      Wallet Password
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your wallet password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`h-9 border rounded-none bg-white/50 dark:bg-gray-800/50 pr-9 text-xs placeholder:text-xs hover:border-gray-900 dark:hover:border-white transition-colors cursor-text ${
                          passwordError
                            ? "border-red-300 dark:border-red-700"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-9 w-9 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-none cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5 text-gray-500" />
                        ) : (
                          <Eye className="h-3.5 w-3.5 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-9 text-xs font-semibold bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 rounded-none cursor-pointer mt-1"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Connecting to Network...
                      </>
                    ) : (
                      <>
                        Connect Wallet
                        <LogIn className="ml-2 h-3.5 w-3.5" />
                      </>
                    )}
                  </Button>

                  {/* Forgot Password */}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-8 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200 rounded-none cursor-pointer bg-white/50 dark:bg-gray-800/50 text-xs font-medium mt-1"
                    size="sm"
                    onClick={() => router.push("/forgot-password")}
                  >
                    <Lock className="mr-2 h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                    Forgot Password?
                  </Button>
                </form>

                {/* Sign Up Link */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Don&apos;t have a wallet?{" "}
                    <Link
                      href="/register"
                      className="text-gray-900 dark:text-white font-medium hover:underline transition-colors cursor-pointer"
                    >
                      Create New Wallet
                    </Link>
                  </p>
                </div>

                {/* No Wallets Warning */}
                {availableWallets.length === 0 &&
                  walletInputMode === "select" && (
                    <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            No Hyperledger Fabric wallets found. Create a new
                            wallet or enter your wallet address manually.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-8 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-none cursor-pointer text-xs font-medium"
                          onClick={() => router.push("/register")}
                        >
                          <Wallet className="mr-2 h-3.5 w-3.5" />
                          Create Wallet
                        </Button>
                      </div>
                    </div>
                  )}

                {/* Network Status */}
                <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                  <p className="text-xs text-gray-900 dark:text-white text-center flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 animate-pulse"></span>
                    Hyperledger Fabric Network - Secure Enterprise Blockchain
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Network Status */}
        <div className="fixed bottom-4 right-4 hidden sm:block">
          <div className="bg-white dark:bg-gray-900 backdrop-blur-sm border border-gray-200 dark:border-gray-700 px-4 py-2 transition-all duration-200 cursor-pointer rounded-none">
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
