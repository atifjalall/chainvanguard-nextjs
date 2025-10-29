/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Package,
  Wallet,
  Eye,
  EyeOff,
  Key,
  RefreshCw,
  AlertTriangle,
  LogIn,
  CheckCircle,
  Lock,
  UserCheck,
  Zap,
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
  const [isVisible, setIsVisible] = useState(false);

  // NEW: Field-level error state only
  const [walletError, setWalletError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login } = useAuth();
  const { connectWallet, getAllWallets } = useWallet();
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
      // Check if user is already logged in FIRST
      const savedUser = localStorage.getItem("chainvanguard_auth_user");
      const authToken = localStorage.getItem("chainvanguard_auth_token");

      if (savedUser && authToken) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.role) {
            console.log(
              "[LOGIN] User already logged in, redirecting to:",
              userData.role
            );
            // Keep showing skeleton/loading while redirecting
            router.push(`/${userData.role}`);
            return; // ✅ Don't set isInitializing to false, keep showing skeleton
          }
        } catch (error) {
          console.error("[LOGIN] Error parsing saved user:", error);
          // Clear invalid data
          localStorage.removeItem("chainvanguard_auth_user");
          localStorage.removeItem("chainvanguard_auth_token");
        }
      }

      // Only continue if NOT logged in
      const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 500));

      const wallets = getAllWallets();
      setAvailableWallets(wallets);

      await minLoadingTime;

      setIsInitializing(false);
      setIsVisible(true);
    };

    initializePage();
  }, [getAllWallets, router]);

  // Clear wallet error when inputs change
  useEffect(() => {
    if (walletError) setWalletError("");
  }, [selectedWallet, manualWalletAddress, walletInputMode]);

  // Clear password error when input changes
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

    // Validate wallet
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

    // Validate password
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

    // Clear previous errors
    setWalletError("");
    setPasswordError("");

    // Validate form
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

    console.log("[LOGIN] Starting login for:", walletAddress);

    try {
      // ✅ STEP 1: CHECK IF WALLET EXISTS IN DATABASE (for manual entry)
      if (walletInputMode === "manual") {
        console.log("[LOGIN] Verifying wallet exists in database...");

        try {
          await authAPI.checkWalletExists(walletAddress);
          console.log("[LOGIN] ✅ Wallet exists in database");
        } catch (error: any) {
          console.error("[LOGIN] ❌ Wallet not found:", error);

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

      // ✅ STEP 2: VERIFY LOCAL WALLET PASSWORD (for wallet selector)
      if (walletInputMode === "select" && selectedWallet) {
        const wallet = availableWallets.find((w) => w.id === selectedWallet);
        if (wallet) {
          console.log("[LOGIN] Verifying local wallet password...");
          const connected = await connectWallet(selectedWallet, password);

          if (!connected) {
            setPasswordError("Invalid password for this wallet");
            toast.error("Invalid password for this wallet");
            setIsLoading(false);
            return;
          }

          console.log("[LOGIN] ✅ Local wallet verified");
        }
      }

      // ✅ STEP 3: LOGIN TO BACKEND API
      console.log("[LOGIN] 🚀 Calling backend API...");
      const loginResponse = await authAPI.login({
        walletAddress: walletAddress,
        password: password,
      });

      console.log("[LOGIN] ✅ Backend login successful!");

      // Sync with auth provider
      await login(walletAddress, password);

      toast.success("Login successful! Redirecting...");

      // Small delay before redirect for better UX
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect
      const role = loginResponse.data.user.role;
      console.log("[LOGIN] Redirecting to:", role);
      window.location.href = `/${role}`;
    } catch (error: any) {
      console.error("[LOGIN] ❌ Backend API Error:", error);

      // Handle different error types
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

  return (
    <AuthRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex flex-col">
        {/* Header */}
        <div className="w-full p-3 sm:p-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <Link
              href="/"
              className="flex items-center space-x-2 group cursor-pointer"
            >
              <div className="relative">
                <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ChainVanguard
              </span>
            </Link>
            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <Link href="/register" className="hidden sm:block">
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50"
                >
                  Need an account?
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
          <div className="w-full max-w-2xl">
            <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

              <CardHeader className="relative z-10 text-center pb-4">
                <div
                  className={`transform transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white mb-3">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1.5">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                    Connect your Hyperledger Fabric wallet to access the supply
                    chain network
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="relative z-10">
                <div
                  className={`transform transition-all duration-700 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
                >
                  {isInitializing ? (
                    // Skeleton Loader
                    <div className="space-y-4">
                      <div className="flex items-center gap-1.5 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Skeleton className="flex-1 h-7 rounded-md" />
                        <Skeleton className="flex-1 h-7 rounded-md" />
                      </div>
                      <div className="space-y-1.5 h-[80px]">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                      <Skeleton className="h-10 w-full rounded-md" />
                      <Skeleton className="h-9 w-full rounded-md" />
                      <div className="text-center space-y-2">
                        <Skeleton className="h-3 w-48 mx-auto" />
                      </div>
                      <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                  ) : (
                    <>
                      <form onSubmit={handleWalletLogin} className="space-y-4">
                        {/* Wallet Input Mode Toggle */}
                        <div className="flex items-center gap-1.5 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setWalletInputMode("select")}
                            className={`flex-1 py-1.5 px-2.5 rounded-md text-sm font-medium transition-all duration-300 ${
                              walletInputMode === "select"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            }`}
                          >
                            <Wallet className="h-4 w-4 inline mr-1.5" />
                            Select Wallet
                          </button>
                          <button
                            type="button"
                            onClick={() => setWalletInputMode("manual")}
                            className={`flex-1 py-1.5 px-2.5 rounded-md text-sm font-medium transition-all duration-300 ${
                              walletInputMode === "manual"
                                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                            }`}
                          >
                            <Edit3 className="h-4 w-4 inline mr-1.5" />
                            Enter Manually
                          </button>
                        </div>

                        {/* Animated Wallet Input Section */}
                        <div className="relative h-[80px]">
                          <AnimatePresence mode="wait">
                            {walletInputMode === "select" ? (
                              <motion.div
                                key="select"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
                                className="space-y-1.5 absolute inset-0"
                              >
                                <Label
                                  htmlFor="wallet-select"
                                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                  Select Your Wallet
                                </Label>
                                <Select
                                  value={selectedWallet}
                                  onValueChange={setSelectedWallet}
                                >
                                  <SelectTrigger
                                    size="sm"
                                    className={`h-10 w-full flex items-center gap-2 px-2.5 py-0 text-sm leading-none border rounded-md hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 ${
                                      walletError
                                        ? "border-red-300 dark:border-red-700 focus:border-red-500"
                                        : "border-gray-200 dark:border-gray-700"
                                    }`}
                                  >
                                    <SelectValue
                                      placeholder="Choose your wallet"
                                      className="w-full flex items-center h-10 text-sm"
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="w-full">
                                    {availableWallets.map((wallet) => (
                                      <SelectItem
                                        key={wallet.id}
                                        value={wallet.id}
                                        className="cursor-pointer py-2 px-2.5"
                                      >
                                        <div className="flex items-center gap-2 w-full">
                                          <div className="p-1 bg-blue-100 dark:bg-blue-900 rounded">
                                            <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                          </div>
                                          <div className="flex-1 text-left">
                                            <div className="font-medium text-sm text-gray-900 dark:text-gray-100 leading-tight">
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
                                      <SelectItem
                                        value="no-wallet"
                                        disabled
                                        className="h-10 flex items-center px-2.5 text-sm opacity-60"
                                      >
                                        No wallets found - Create one first
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
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
                                className="space-y-1.5 absolute inset-0"
                              >
                                <Label
                                  htmlFor="manual-address"
                                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  Enter Wallet Address
                                </Label>
                                <Input
                                  id="manual-address"
                                  type="text"
                                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                                  value={manualWalletAddress}
                                  onChange={(e) =>
                                    setManualWalletAddress(e.target.value)
                                  }
                                  className={`!h-10 border hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 font-mono text-sm placeholder:text-sm ${
                                    walletError
                                      ? "border-red-300 dark:border-red-700 focus:border-red-500"
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

                        {/* Password Field */}
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="password"
                            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            Wallet Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your wallet password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={`!h-10 border hover:border-blue-300 focus:border-blue-500 transition-colors pr-10 bg-white/50 dark:bg-gray-800/50 cursor-text text-sm placeholder:text-sm ${
                                passwordError
                                  ? "border-red-300 dark:border-red-700 focus:border-red-500"
                                  : "border-gray-200 dark:border-gray-700"
                              }`}
                              required
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-10 w-10 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
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
                          className="w-full h-10 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Connecting to Network...
                            </>
                          ) : (
                            <>
                              Connect Wallet
                              <LogIn className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </form>

                      {/* Action Buttons */}
                      <div className="mt-4 space-y-2.5">
                        <Button
                          variant="outline"
                          className="w-full h-9 border border-gray-200 dark:border-gray-700 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950/20 dark:hover:border-orange-800 transition-all duration-200 cursor-pointer bg-white/50 dark:bg-gray-800/50 text-sm font-medium"
                          size="sm"
                          onClick={() => router.push("/forgot-password")}
                        >
                          <Key className="mr-2 h-4 w-4 text-orange-600" />
                          Forgot Password?
                        </Button>
                      </div>

                      {/* Create Account Link */}
                      <div className="mt-4 text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Don&apos;t have a wallet?{" "}
                          <Link
                            href="/register"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors cursor-pointer"
                          >
                            Create New Wallet
                          </Link>
                        </p>
                      </div>

                      {/* Demo Section */}
                      {availableWallets.length === 0 &&
                        walletInputMode === "select" && (
                          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <Alert>
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
                                No Hyperledger Fabric wallets found. Create a
                                new wallet or enter your wallet address
                                manually.
                              </AlertDescription>
                            </Alert>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full mt-2.5 border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 cursor-pointer text-sm font-medium h-9"
                              onClick={() => router.push("/register")}
                            >
                              <Zap className="mr-2 h-4 w-4 text-amber-600" />
                              Create Wallet
                            </Button>
                          </div>
                        )}

                      {/* Network Status */}
                      <div className="mt-4 p-2.5 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300 text-center flex items-center justify-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                          Hyperledger Fabric Network - Secure Enterprise
                          Blockchain
                          <CheckCircle className="h-3 w-3" />
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Floating Network Status */}
        <div className="fixed bottom-3 right-3 hidden sm:block">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
            <div className="flex items-center gap-1.5 text-[10px]">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-600 dark:text-gray-400">
                Hyperledger Network Online
              </span>
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-3/4 left-3/4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-2000" />
        </div>
      </div>
    </AuthRouteGuard>
  );
}
