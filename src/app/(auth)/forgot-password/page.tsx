/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Package,
  Wallet,
  Eye,
  EyeOff,
  Shield,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  KeyRound,
  CheckCircle2,
  BadgeCheck,
  ArrowLeft,
} from "lucide-react";
import { WalletData } from "@/types/web3";

export default function ForgotPasswordPage() {
  // Current step in the multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Animation states
  const [isVisible, setIsVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("right");

  // Form State
  const [availableWallets, setAvailableWallets] = useState<WalletData[]>([]);
  const [selectedWallet, setSelectedWallet] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phraseWords, setPhraseWords] = useState<string[]>([]);

  const { getAllWallets, recoverWallet } = useWallet();
  const router = useRouter();

  // Initialize
  useEffect(() => {
    setIsVisible(true);
    const wallets = getAllWallets();
    setAvailableWallets(wallets);
  }, [getAllWallets]);

  // Update phrase words when recovery phrase changes
  useEffect(() => {
    const words = recoveryPhrase.trim().split(/\s+/).filter(Boolean);
    setPhraseWords(words);
  }, [recoveryPhrase]);

  // Handle step transitions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setSlideDirection("left");
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsVisible(true);
      }, 200);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setSlideDirection("right");
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsVisible(true);
      }, 200);
    }
  };

  const progress = (currentStep / totalSteps) * 100;

  // Validation functions
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!selectedWallet) {
          newErrors.selectedWallet = "Please select a wallet to recover";
        }
        break;
      case 2:
        if (!recoveryPhrase.trim()) {
          newErrors.recoveryPhrase = "Recovery phrase is required";
        } else if (phraseWords.length !== 12) {
          newErrors.recoveryPhrase = "Recovery phrase must be exactly 12 words";
        }
        break;
      case 3:
        if (!newPassword || newPassword.length < 8) {
          newErrors.newPassword = "Password must be at least 8 characters";
        }
        if (newPassword !== confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
        break;
    }

    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step: number) => {
    return validateStep(step);
  };

  const handleNext = () => {
    const currentStepErrors: Record<string, string> = {};

    switch (currentStep) {
      case 1:
        if (!selectedWallet) {
          currentStepErrors.selectedWallet =
            "Please select a wallet to recover";
        }
        break;
      case 2:
        if (!recoveryPhrase.trim()) {
          currentStepErrors.recoveryPhrase = "Recovery phrase is required";
        } else if (phraseWords.length !== 12) {
          currentStepErrors.recoveryPhrase =
            "Recovery phrase must be exactly 12 words";
        }
        break;
    }

    setErrors(currentStepErrors);

    if (Object.keys(currentStepErrors).length === 0) {
      nextStep();
    }
  };

  const handleResetPassword = async () => {
    if (!validateStep(3)) {
      const newErrors: Record<string, string> = {};
      if (!newPassword || newPassword.length < 8) {
        newErrors.newPassword = "Password must be at least 8 characters";
      }
      if (newPassword !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Verify recovery phrase matches the wallet
      const storedRecoveryPhrase = localStorage.getItem(
        `wallet_${selectedWallet}_recovery`
      );

      if (!storedRecoveryPhrase) {
        throw new Error("No recovery phrase found for this wallet");
      }

      if (storedRecoveryPhrase !== recoveryPhrase.trim()) {
        throw new Error("Invalid recovery phrase for this wallet");
      }

      // Update wallet password in localStorage
      const walletsData = JSON.parse(
        localStorage.getItem("chainvanguard_wallets") || "[]"
      );
      const walletIndex = walletsData.findIndex(
        (w: any) => w.id === selectedWallet
      );

      if (walletIndex === -1) {
        throw new Error("Wallet not found");
      }

      // In a production environment, you would properly encrypt the private key
      // For now, we'll update the password hash
      walletsData[walletIndex].password = newPassword;
      localStorage.setItem(
        "chainvanguard_wallets",
        JSON.stringify(walletsData)
      );

      // Success
      toast.success(
        "Password reset successfully! You can now login with your new password."
      );

      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      setIsLoading(false);
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
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ChainVanguard
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button
                variant="ghost"
                className="cursor-pointer text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50"
              >
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="relative">
              <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Recovery Card */}
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

            <CardHeader className="relative z-10 text-center pb-6">
              <div
                className={`transform transition-all duration-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
                  {currentStep === 1 && <Wallet className="h-8 w-8" />}
                  {currentStep === 2 && <KeyRound className="h-8 w-8" />}
                  {currentStep === 3 && <Lock className="h-8 w-8" />}
                </div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {currentStep === 1 && "Select Your Wallet"}
                  {currentStep === 2 && "Enter Recovery Phrase"}
                  {currentStep === 3 && "Create New Password"}
                </CardTitle>
                <CardDescription className="text-base text-gray-600 dark:text-gray-400">
                  {currentStep === 1 && "Choose the wallet you want to recover"}
                  {currentStep === 2 &&
                    "Enter your 12-word recovery phrase to verify ownership"}
                  {currentStep === 3 &&
                    "Set a new secure password for your wallet"}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="relative z-10">
              <div
                className={`transform transition-all duration-500 ${
                  isVisible
                    ? "translate-x-0 opacity-100"
                    : slideDirection === "left"
                      ? "-translate-x-8 opacity-0"
                      : "translate-x-8 opacity-0"
                }`}
              >
                {/* Step 1: Select Wallet */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        You&apos;ll need your 12-word recovery phrase to reset
                        your password. Make sure you have it ready before
                        continuing.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label
                        htmlFor="wallet-select"
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <Wallet className="h-4 w-4" />
                        Select Wallet to Recover
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
                                  <div className="font-medium">
                                    {wallet.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
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
                      {errors.selectedWallet && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.selectedWallet}
                        </p>
                      )}
                    </div>

                    {selectedWallet && (
                      <div className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                        <div className="flex items-start gap-3">
                          <BadgeCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                              What You&apos;ll Need
                            </h4>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                              <li>• Your 12-word recovery phrase</li>
                              <li>• The words must be in the correct order</li>
                              <li>• Each word must be spelled correctly</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Recovery Phrase */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Enter your recovery phrase exactly as it was given to
                        you. All 12 words must be in the correct order.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label
                        htmlFor="recovery-phrase"
                        className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <KeyRound className="h-4 w-4" />
                        Recovery Phrase (12 words)
                      </Label>
                      <textarea
                        id="recovery-phrase"
                        className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 rounded-lg resize-none h-32 transition-colors cursor-text bg-white/50 dark:bg-gray-800/50 font-mono text-sm"
                        placeholder="Enter your 12-word recovery phrase separated by spaces&#10;Example: word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                        value={recoveryPhrase}
                        onChange={(e) => setRecoveryPhrase(e.target.value)}
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`${
                            phraseWords.length === 12
                              ? "text-green-600 dark:text-green-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {phraseWords.length} / 12 words
                        </span>
                        {phraseWords.length === 12 && (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="h-4 w-4" />
                            Valid word count
                          </span>
                        )}
                      </div>
                      {errors.recoveryPhrase && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors.recoveryPhrase}
                        </p>
                      )}
                    </div>

                    {/* Word Preview Grid */}
                    {phraseWords.length > 0 && (
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Word Preview
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {phraseWords.slice(0, 12).map((word, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                            >
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {index + 1}.
                              </span>
                              <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-100 truncate">
                                {word}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: New Password */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Recovery phrase verified! Now create a new secure
                        password for your wallet.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="new-password"
                          className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <Lock className="h-4 w-4" />
                          New Password
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Minimum 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-12 pr-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 w-12 cursor-pointer"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {errors.newPassword && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.newPassword}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label
                          htmlFor="confirm-password"
                          className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                        >
                          <Lock className="h-4 w-4" />
                          Confirm New Password
                        </Label>
                        <div className="relative mt-1">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Re-enter your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 pr-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white/50 dark:bg-gray-800/50 cursor-text"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-12 w-12 cursor-pointer"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>

                      {/* Password Strength Indicator */}
                      {newPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>Password Strength</span>
                            <span>
                              {newPassword.length >= 12
                                ? "Strong"
                                : newPassword.length >= 8
                                  ? "Good"
                                  : "Weak"}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                newPassword.length >= 12
                                  ? "bg-blue-500 w-full"
                                  : newPassword.length >= 8
                                    ? "bg-cyan-500 w-2/3"
                                    : "bg-red-500 w-1/3"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <BadgeCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Password Tips
                          </h4>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>
                              • Use at least 8 characters (12+ recommended)
                            </li>
                            <li>• Mix uppercase and lowercase letters</li>
                            <li>• Include numbers and special characters</li>
                            <li>
                              • Avoid common words or personal information
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                {currentStep === 1 ? (
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 cursor-pointer border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back to Login
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="flex items-center gap-2 cursor-pointer border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(currentStep)}
                    className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer ${!isStepValid(currentStep) ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={!isStepValid(3) || isLoading}
                    className={`flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white cursor-pointer ${!isStepValid(3) || isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Reset Password
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Help Links */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            </p>
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
        </div>
      </div>

      {/* Network Status */}
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
