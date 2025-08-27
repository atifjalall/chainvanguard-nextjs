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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Package,
  Wallet,
  Eye,
  EyeOff,
  Key,
  Shield,
  RefreshCw,
  AlertTriangle,
  LogIn,
  ArrowRight,
  CheckCircle,
  Lock,
  UserCheck,
  Zap,
} from "lucide-react";
import { WalletData } from "@/types/web3";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Recovery Dialog State
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);

  // Password Reset State
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [resetWalletId, setResetWalletId] = useState("");
  const [resetRecoveryPhrase, setResetRecoveryPhrase] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const { login } = useAuth();
  const { connectWallet, getAllWallets, recoverWallet } = useWallet();
  const router = useRouter();

  // Load available wallets on component mount
  useEffect(() => {
    setIsVisible(true);

    const wallets = getAllWallets();
    setAvailableWallets(wallets);

    // Check if user is already logged in
    const savedUser = localStorage.getItem("chainvanguard_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.role) {
        router.push(`/${userData.role}`);
      }
    }
  }, [getAllWallets, router]);

  const handleWalletLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!selectedWallet || !password) {
        throw new Error("Please select a wallet and enter password");
      }

      const wallet = availableWallets.find((w) => w.id === selectedWallet);
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      console.log("[LOGIN] Starting login process for wallet:", wallet.address);

      // Connect wallet first
      const connected = await connectWallet(selectedWallet, password);
      if (!connected) {
        throw new Error("Invalid password");
      }

      // Set authentication cookie
      document.cookie = `chainvanguard_auth=${selectedWallet}; path=/; max-age=${7 * 24 * 60 * 60}`;

      // Login with auth provider (this should preserve role)
      await login(wallet.address, password);

      console.log("[LOGIN] Auth provider login completed");

      toast.success("Wallet connected successfully!");

      // Add a longer delay to ensure all state updates are complete
      setTimeout(async () => {
        // Double-check user data after state updates
        const savedUser = localStorage.getItem("chainvanguard_user");
        const authUser = JSON.parse(
          localStorage.getItem("chainvanguard_user") || "{}"
        );

        console.log("[LOGIN] Final check - savedUser:", savedUser);
        console.log("[LOGIN] Final check - authUser role:", authUser.role);

        if (savedUser) {
          try {
            const userData = JSON.parse(savedUser);

            if (userData.role && userData.walletAddress === wallet.address) {
              console.log(
                "[LOGIN] User has role, navigating to dashboard:",
                userData.role
              );
              // Use replace instead of push to avoid back button issues
              router.replace(`/${userData.role}`);
            } else {
              console.log("[LOGIN] User missing role, going to role selection");
              router.replace("/role-selection");
            }
          } catch (error) {
            console.error("[LOGIN] Error parsing user data:", error);
            router.replace("/role-selection");
          }
        } else {
          console.log("[LOGIN] No user data found, going to role selection");
          router.replace("/role-selection");
        }
      }, 1000); // Increased delay to 1 second
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
      setIsLoading(false); // Only set loading false on error
    }
    // Don't set setIsLoading(false) here - let the timeout handle it
  };

  const handleRecoveryRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRecovering(true);

    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!recoveryPhrase || recoveryPhrase.trim().split(" ").length !== 12) {
        throw new Error("Please enter a valid 12-word recovery phrase");
      }

      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      const recoveredWallet = await recoverWallet(
        recoveryPhrase.trim(),
        newPassword
      );

      // Update available wallets
      const updatedWallets = getAllWallets();
      setAvailableWallets(updatedWallets);
      setSelectedWallet(recoveredWallet.id);

      // Clear recovery form
      setRecoveryPhrase("");
      setNewPassword("");
      setConfirmPassword("");
      setShowRecoveryDialog(false);

      toast.success("Wallet recovered successfully! You can now login.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to recover wallet"
      );
    } finally {
      setIsRecovering(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!resetWalletId) {
        throw new Error("Please select a wallet to reset");
      }

      if (
        !resetRecoveryPhrase ||
        resetRecoveryPhrase.trim().split(" ").length !== 12
      ) {
        throw new Error("Please enter a valid 12-word recovery phrase");
      }

      if (resetNewPassword !== resetConfirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (resetNewPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      // Verify recovery phrase matches the wallet
      const storedRecoveryPhrase = localStorage.getItem(
        `wallet_${resetWalletId}_recovery`
      );
      if (storedRecoveryPhrase !== resetRecoveryPhrase.trim()) {
        throw new Error("Invalid recovery phrase for this wallet");
      }

      // Update wallet password
      const walletsData = JSON.parse(
        localStorage.getItem("chainvanguard_wallets") || "[]"
      );
      const walletIndex = walletsData.findIndex(
        (w: any) => w.id === resetWalletId
      );

      if (walletIndex === -1) {
        throw new Error("Wallet not found");
      }

      // Update password (in a real app, this would be properly encrypted)
      walletsData[walletIndex].encryptedPrivateKey = resetNewPassword; // Simplified for demo
      localStorage.setItem(
        "chainvanguard_wallets",
        JSON.stringify(walletsData)
      );

      // Clear form and close dialog
      setResetWalletId("");
      setResetRecoveryPhrase("");
      setResetNewPassword("");
      setResetConfirmPassword("");
      setShowForgotDialog(false);

      toast.success(
        "Password reset successfully! You can now login with your new password."
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reset password"
      );
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 flex flex-col">
      {/* Header */}
      <div className="w-full p-4 sm:p-6">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Link
            href="/"
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="relative">
              <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ChainVanguard
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/register" className="hidden sm:block">
              <Button
                variant="ghost"
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                Need an account?
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

            <CardHeader className="relative z-10 text-center pb-6">
              <div
                className={`transform transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
                  <Wallet className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Welcome Back
                </CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  Connect your Hyperledger Fabric wallet to access the supply
                  chain network
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              <div
                className={`transform transition-all duration-700 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              >
                <form onSubmit={handleWalletLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="wallet-select"
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <UserCheck className="h-4 w-4" />
                      Select Your Wallet
                    </Label>
                    <Select
                      value={selectedWallet}
                      onValueChange={setSelectedWallet}
                    >
                      <SelectTrigger className="h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors cursor-pointer bg-white/50 dark:bg-gray-800/50">
                        <SelectValue
                          placeholder="Choose your wallet"
                          className="cursor-pointer"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableWallets.map((wallet) => (
                          <SelectItem
                            key={wallet.id}
                            value={wallet.id}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                                <Wallet className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium">{wallet.name}</div>
                                <div className="text-xs text-gray-500">
                                  {formatAddress(wallet.address)}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                        {availableWallets.length === 0 && (
                          <SelectItem value="no-wallet" disabled>
                            No wallets found - Create one first
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                    >
                      <Lock className="h-4 w-4" />
                      Wallet Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your wallet password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors pr-12 bg-white/50 dark:bg-gray-800/50 cursor-text"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-12 w-12 hover:bg-blue-50 dark:hover:bg-blue-950/50 cursor-pointer"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                    disabled={isLoading || !selectedWallet}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                        Connecting to Network...
                      </>
                    ) : (
                      <>
                        
                        Connect Wallet
                        <LogIn className="mr-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {/* Forgot Password Dialog */}
                  {availableWallets.length > 0 && (
                    <Dialog
                      open={showForgotDialog}
                      onOpenChange={setShowForgotDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-11 border-2 border-gray-200 dark:border-gray-700 hover:bg-orange-50 hover:border-orange-200 dark:hover:bg-orange-950/20 dark:hover:border-orange-800 transition-all duration-200 cursor-pointer bg-white/50 dark:bg-gray-800/50"
                          size="sm"
                        >
                          <Key className="mr-2 h-4 w-4 text-orange-600" />
                          Forgot Password?
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5 text-orange-500" />
                            Reset Password
                          </DialogTitle>
                          <DialogDescription>
                            Use your recovery phrase to reset your wallet
                            password
                          </DialogDescription>
                        </DialogHeader>

                        <form
                          onSubmit={handlePasswordReset}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="reset-wallet">Select Wallet</Label>
                            <Select
                              value={resetWalletId}
                              onValueChange={setResetWalletId}
                            >
                              <SelectTrigger className="cursor-pointer">
                                <SelectValue placeholder="Choose wallet to reset" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableWallets.map((wallet) => (
                                  <SelectItem
                                    key={wallet.id}
                                    value={wallet.id}
                                    className="cursor-pointer"
                                  >
                                    {wallet.name} -{" "}
                                    {formatAddress(wallet.address)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="reset-recovery-phrase">
                              Recovery Phrase
                            </Label>
                            <textarea
                              id="reset-recovery-phrase"
                              className="w-full p-3 border-2 rounded-lg resize-none h-24 hover:border-blue-300 focus:border-blue-500 transition-colors cursor-text"
                              placeholder="Enter your 12-word recovery phrase"
                              value={resetRecoveryPhrase}
                              onChange={(e) =>
                                setResetRecoveryPhrase(e.target.value)
                              }
                              required
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="reset-new-password">
                                New Password
                              </Label>
                              <Input
                                id="reset-new-password"
                                type="password"
                                placeholder="Create new password"
                                value={resetNewPassword}
                                onChange={(e) =>
                                  setResetNewPassword(e.target.value)
                                }
                                required
                                minLength={8}
                                className="border-2 hover:border-blue-300 focus:border-blue-500 cursor-text"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="reset-confirm-password">
                                Confirm Password
                              </Label>
                              <Input
                                id="reset-confirm-password"
                                type="password"
                                placeholder="Confirm password"
                                value={resetConfirmPassword}
                                onChange={(e) =>
                                  setResetConfirmPassword(e.target.value)
                                }
                                required
                                className="border-2 hover:border-blue-300 focus:border-blue-500 cursor-text"
                              />
                            </div>
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-11 bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                          >
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Recover Wallet Dialog */}
                  <Dialog
                    open={showRecoveryDialog}
                    onOpenChange={setShowRecoveryDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full h-11 border-2 border-gray-200 dark:border-gray-700 hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/20 dark:hover:border-green-800 transition-all duration-200 cursor-pointer bg-white/50 dark:bg-gray-800/50"
                        size="sm"
                      >
                        <Shield className="mr-2 h-4 w-4 text-green-600" />
                        Recover Wallet with Seed Phrase
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-green-500" />
                          Recover Wallet
                        </DialogTitle>
                        <DialogDescription>
                          Enter your 12-word recovery phrase to restore your
                          wallet
                        </DialogDescription>
                      </DialogHeader>

                      <form
                        onSubmit={handleRecoveryRestore}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="recovery-phrase">
                            Recovery Phrase
                          </Label>
                          <textarea
                            id="recovery-phrase"
                            className="w-full p-3 border-2 rounded-lg resize-none h-24 hover:border-blue-300 focus:border-blue-500 transition-colors cursor-text"
                            placeholder="Enter your 12-word recovery phrase separated by spaces"
                            value={recoveryPhrase}
                            onChange={(e) => setRecoveryPhrase(e.target.value)}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="Create password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              required
                              minLength={8}
                              className="border-2 hover:border-blue-300 focus:border-blue-500 cursor-text"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">
                              Confirm Password
                            </Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              required
                              className="border-2 hover:border-blue-300 focus:border-blue-500 cursor-text"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-11 bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                          disabled={isRecovering}
                        >
                          {isRecovering ? (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                              Recovering...
                            </>
                          ) : (
                            <>
                              <Shield className="mr-2 h-4 w-4" />
                              Recover Wallet
                            </>
                          )}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Create Account Link */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Don&apos;t have a wallet?{" "}
                    <Link
                      href="/register"
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors cursor-pointer"
                    >
                      Create New Wallet
                    </Link>
                  </p>
                </div>

                {/* Mobile Create Account Button */}
                <div className="text-center mt-4 sm:hidden">
                  <Link href="/register">
                    <Button
                      variant="ghost"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer"
                    >
                      Need an account? Create wallet
                    </Button>
                  </Link>
                </div>

                {/* Demo Section */}
                {availableWallets.length === 0 && (
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <Alert>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800 dark:text-amber-200">
                        No Hyperledger Fabric wallets found. Create a new wallet
                        to get started with blockchain-based supply chain
                        management.
                      </AlertDescription>
                    </Alert>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3 border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/40 cursor-pointer"
                      onClick={() => router.push("/register")}
                    >
                      <Zap className="mr-2 h-4 w-4 text-amber-600" />
                      Create Wallet
                    </Button>
                  </div>
                )}

                {/* Network Status */}
                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-300 text-center flex items-center justify-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Hyperledger Fabric Network - Secure Enterprise Blockchain
                    <CheckCircle className="h-3 w-3" />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Floating Network Status */}
      <div className="fixed bottom-4 right-4 hidden sm:block">
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600 dark:text-gray-400">
              Network Online
            </span>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-3/4 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl animate-pulse delay-2000" />
      </div>
    </div>
  );
}
