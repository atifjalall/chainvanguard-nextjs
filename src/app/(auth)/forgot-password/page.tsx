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
  Search,
  HelpCircle,
  Edit3,
} from "lucide-react";
import { WalletData } from "@/types/web3";
import { motion, AnimatePresence, easeOut, easeInOut } from "framer-motion";

type RecoveryMode = "known-wallet" | "forgot-wallet" | null;
type WalletInputMode = "select" | "manual";

export default function ForgotPasswordPage() {
  // Recovery Mode Selection
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>(null);

  // Current step in the multi-step form
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(3);

  // Animation states
  const [isVisible, setIsVisible] = useState(false);

  // Form State
  const [availableWallets, setAvailableWallets] = useState<WalletData[]>([]);
  const [walletInputMode, setWalletInputMode] =
    useState<WalletInputMode>("select");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Wallet Recovery State
  const [recoveredWallet, setRecoveredWallet] = useState<WalletData | null>(
    null
  );
  const [isRecoveringWallet, setIsRecoveringWallet] = useState(false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phraseWords, setPhraseWords] = useState<string[]>([]);

  const { getAllWallets } = useWallet();
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

  // Update total steps based on recovery mode
  useEffect(() => {
    if (recoveryMode === "known-wallet") {
      setTotalSteps(3);
    } else if (recoveryMode === "forgot-wallet") {
      setTotalSteps(3);
    }
  }, [recoveryMode]);

  // Handle mode selection
  const handleModeSelection = (mode: RecoveryMode) => {
    setRecoveryMode(mode);
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStep(1);
      setIsVisible(true);
    }, 300);
  };

  // Handle step transitions
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsVisible(true);
      }, 300);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsVisible(true);
      }, 300);
    } else if (currentStep === 1) {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentStep(0);
        setRecoveryMode(null);
        setSelectedWallet("");
        setManualWalletAddress("");
        setRecoveryPhrase("");
        setRecoveredWallet(null);
        setErrors({});
        setWalletInputMode("select");
        setIsVisible(true);
      }, 300);
    }
  };

  const progress = currentStep === 0 ? 0 : (currentStep / totalSteps) * 100;

  // Get current wallet identifier
  const getCurrentWallet = () => {
    if (walletInputMode === "manual") {
      return manualWalletAddress;
    }
    return selectedWallet;
  };

  // Wallet recovery function
  const handleRecoverWallet = async () => {
    if (phraseWords.length !== 12) {
      setErrors({ recoveryPhrase: "Recovery phrase must be exactly 12 words" });
      return;
    }

    setIsRecoveringWallet(true);
    setErrors({});

    try {
      const walletsData = JSON.parse(
        localStorage.getItem("chainvanguard_wallets") || "[]"
      );

      const matchingWallet = walletsData.find((wallet: any) => {
        const storedRecoveryPhrase = localStorage.getItem(
          `wallet_${wallet.id}_recovery`
        );
        return storedRecoveryPhrase === recoveryPhrase.trim();
      });

      if (!matchingWallet) {
        throw new Error("No wallet found with this recovery phrase");
      }

      // Use the full matchingWallet as WalletData (cast) so the state gets all required properties
      setRecoveredWallet(matchingWallet as WalletData);

      setSelectedWallet(matchingWallet.id);
      toast.success("Wallet found successfully!");

      setTimeout(() => {
        nextStep();
      }, 1000);
    } catch (error) {
      setErrors({
        recoveryPhrase:
          error instanceof Error
            ? error.message
            : "Failed to recover wallet. Please check your recovery phrase.",
      });
      toast.error("Wallet not found");
    } finally {
      setIsRecoveringWallet(false);
    }
  };

  // Validation functions
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (recoveryMode === "known-wallet") {
      switch (step) {
        case 1:
          if (walletInputMode === "select" && !selectedWallet) {
            newErrors.wallet = "Please select a wallet";
          } else if (walletInputMode === "manual" && !manualWalletAddress) {
            newErrors.wallet = "Please enter wallet address";
          } else if (
            walletInputMode === "manual" &&
            manualWalletAddress.length < 10
          ) {
            newErrors.wallet = "Please enter a valid wallet address";
          }
          break;
        case 2:
          if (!recoveryPhrase.trim()) {
            newErrors.recoveryPhrase = "Recovery phrase is required";
          } else if (phraseWords.length !== 12) {
            newErrors.recoveryPhrase =
              "Recovery phrase must be exactly 12 words";
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
    } else if (recoveryMode === "forgot-wallet") {
      switch (step) {
        case 1:
          if (!recoveryPhrase.trim()) {
            newErrors.recoveryPhrase = "Recovery phrase is required";
          } else if (phraseWords.length !== 12) {
            newErrors.recoveryPhrase =
              "Recovery phrase must be exactly 12 words";
          }
          break;
        case 2:
          if (!recoveredWallet) {
            newErrors.wallet = "Wallet recovery failed";
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
    }

    return Object.keys(newErrors).length === 0;
  };

  const isStepValid = (step: number) => {
    return validateStep(step);
  };

  const handleNext = () => {
    const currentStepErrors: Record<string, string> = {};

    if (recoveryMode === "known-wallet") {
      switch (currentStep) {
        case 1:
          if (walletInputMode === "select" && !selectedWallet) {
            currentStepErrors.wallet = "Please select a wallet";
          } else if (walletInputMode === "manual" && !manualWalletAddress) {
            currentStepErrors.wallet = "Please enter wallet address";
          } else if (
            walletInputMode === "manual" &&
            manualWalletAddress.length < 10
          ) {
            currentStepErrors.wallet = "Please enter a valid wallet address";
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
    } else if (recoveryMode === "forgot-wallet") {
      if (currentStep === 1) {
        handleRecoverWallet();
        return;
      }
    }

    setErrors(currentStepErrors);

    if (Object.keys(currentStepErrors).length === 0) {
      nextStep();
    }
  };

  const handleResetPassword = async () => {
    if (!validateStep(totalSteps)) {
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
      const walletId =
        recoveryMode === "forgot-wallet"
          ? recoveredWallet?.id
          : getCurrentWallet();

      const storedRecoveryPhrase = localStorage.getItem(
        `wallet_${walletId}_recovery`
      );

      if (!storedRecoveryPhrase) {
        throw new Error("No recovery phrase found for this wallet");
      }

      if (storedRecoveryPhrase !== recoveryPhrase.trim()) {
        throw new Error("Invalid recovery phrase for this wallet");
      }

      const walletsData = JSON.parse(
        localStorage.getItem("chainvanguard_wallets") || "[]"
      );
      const walletIndex = walletsData.findIndex((w: any) => w.id === walletId);

      if (walletIndex === -1) {
        throw new Error("Wallet not found");
      }

      walletsData[walletIndex].password = newPassword;
      localStorage.setItem(
        "chainvanguard_wallets",
        JSON.stringify(walletsData)
      );

      toast.success(
        "Password reset successfully! You can now login with your new password."
      );

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

  const getStepTitle = () => {
    if (currentStep === 0) return "Choose Recovery Method";

    if (recoveryMode === "known-wallet") {
      if (currentStep === 1) return "Select Your Wallet";
      if (currentStep === 2) return "Verify Recovery Phrase";
      if (currentStep === 3) return "Create New Password";
    } else if (recoveryMode === "forgot-wallet") {
      if (currentStep === 1) return "Enter Recovery Phrase";
      if (currentStep === 2) return "Wallet Found";
      if (currentStep === 3) return "Create New Password";
    }
    return "";
  };

  const getStepDescription = () => {
    if (currentStep === 0)
      return "Select how you want to recover your wallet password";

    if (recoveryMode === "known-wallet") {
      if (currentStep === 1)
        return "Choose your wallet from the list or enter address manually";
      if (currentStep === 2)
        return "Enter your 12-word recovery phrase to verify ownership";
      if (currentStep === 3) return "Set a new secure password for your wallet";
    } else if (recoveryMode === "forgot-wallet") {
      if (currentStep === 1)
        return "We'll use your recovery phrase to locate your wallet";
      if (currentStep === 2)
        return "Confirm this is your wallet before proceeding";
      if (currentStep === 3) return "Set a new secure password for your wallet";
    }
    return "";
  };

  const getStepIcon = () => {
    if (currentStep === 0) return <HelpCircle className="h-7 w-7" />;

    if (recoveryMode === "known-wallet") {
      if (currentStep === 1) return <Wallet className="h-7 w-7" />;
      if (currentStep === 2) return <KeyRound className="h-7 w-7" />;
      if (currentStep === 3) return <Lock className="h-7 w-7" />;
    } else if (recoveryMode === "forgot-wallet") {
      if (currentStep === 1) return <Search className="h-7 w-7" />;
      if (currentStep === 2) return <CheckCircle2 className="h-7 w-7" />;
      if (currentStep === 3) return <Lock className="h-7 w-7" />;
    }
    return <Wallet className="h-7 w-7" />;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: easeOut,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: easeOut,
      },
    },
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
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
              ChainVanguard
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/login" className="hidden sm:block">
              <Button
                variant="ghost"
                className="cursor-pointer text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50"
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
          <AnimatePresence mode="wait">
            {currentStep > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">
                    Step {currentStep} of {totalSteps}
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recovery Card */}
          <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />

            <CardHeader className="relative z-10 text-center pb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  variants={containerVariants}
                  initial="hidden"
                  animate={isVisible ? "visible" : "hidden"}
                  exit="exit"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 text-white mb-4 shadow-lg">
                    {getStepIcon()}
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {getStepTitle()}
                  </CardTitle>
                  <CardDescription className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {getStepDescription()}
                  </CardDescription>
                </motion.div>
              </AnimatePresence>
            </CardHeader>

            <CardContent className="relative z-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStep}-${recoveryMode}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate={isVisible ? "visible" : "hidden"}
                  exit="exit"
                >
                  {/* Step 0: Mode Selection */}
                  {currentStep === 0 && (
                    <div className="space-y-5">
                      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                          Choose how you want to recover access to your wallet
                        </AlertDescription>
                      </Alert>

                      <div className="grid gap-4">
                        {/* Known Wallet Option */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleModeSelection("known-wallet")}
                          className="w-full p-5 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                I Know My Wallet
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                Select your wallet and reset password using
                                recovery phrase
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mt-1" />
                          </div>
                        </motion.button>

                        {/* Forgot Wallet Option */}
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleModeSelection("forgot-wallet")}
                          className="w-full p-5 text-left border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 transition-all cursor-pointer group"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-2.5 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/50 transition-colors">
                              <Search className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                I Forgot My Wallet
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                Use recovery phrase to find wallet, then reset
                                password
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors mt-1" />
                          </div>
                        </motion.button>
                      </div>

                      <div className="mt-5 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                          <BadgeCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
                              What You&apos;ll Need
                            </h4>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 leading-relaxed">
                              <li>• Your 12-word recovery phrase</li>
                              <li>• Words in the correct order</li>
                              <li>• Correctly spelled words</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Known Wallet Flow - Step 1: Select Wallet */}
                  {recoveryMode === "known-wallet" && currentStep === 1 && (
                    <div className="space-y-5">
                      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                          Have your 12-word recovery phrase ready before
                          continuing
                        </AlertDescription>
                      </Alert>

                      {/* Wallet Input Mode Toggle */}
                      <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <button
                          onClick={() => setWalletInputMode("select")}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            walletInputMode === "select"
                              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                        >
                          <Wallet className="h-4 w-4 inline mr-1.5" />
                          Select Wallet
                        </button>
                        <button
                          onClick={() => setWalletInputMode("manual")}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            walletInputMode === "manual"
                              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                          }`}
                        >
                          <Edit3 className="h-4 w-4 inline mr-1.5" />
                          Enter Manually
                        </button>
                      </div>

                      <AnimatePresence mode="wait">
                        {walletInputMode === "select" ? (
                          <motion.div
                            key="select"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2"
                          >
                            <Label
                              htmlFor="wallet-select"
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              <Wallet className="h-4 w-4" />
                              Select Your Wallet
                            </Label>
                            <Select
                              value={selectedWallet}
                              onValueChange={setSelectedWallet}
                            >
                              <SelectTrigger className="h-12 w-full border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors cursor-pointer bg-white dark:bg-gray-800">
                                <SelectValue placeholder="Choose your wallet" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableWallets.map((wallet) => (
                                  <SelectItem
                                    key={wallet.id}
                                    value={wallet.id}
                                    className="cursor-pointer py-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded">
                                        <Wallet className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">
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
                                    <span className="text-sm">
                                      No wallets found
                                    </span>
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="manual"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-2"
                          >
                            <Label
                              htmlFor="manual-address"
                              className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              <Edit3 className="h-4 w-4" />
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
                              className="h-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 font-mono text-sm"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {errors.wallet && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-red-500"
                        >
                          {errors.wallet}
                        </motion.p>
                      )}

                      <AnimatePresence>
                        {(selectedWallet ||
                          (manualWalletAddress &&
                            manualWalletAddress.length > 10)) && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                              <div className="flex items-start gap-3">
                                <BadgeCheck className="h-4 w-4 text-cyan-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-sm font-semibold text-cyan-900 dark:text-cyan-100 mb-1.5">
                                    Next Step
                                  </h4>
                                  <ul className="text-sm text-cyan-800 dark:text-cyan-200 space-y-1 leading-relaxed">
                                    <li>
                                      • Enter your 12-word recovery phrase
                                    </li>
                                    <li>• Words must be in correct order</li>
                                    <li>• Check spelling carefully</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Forgot Wallet Flow - Step 1: Enter Recovery Phrase */}
                  {recoveryMode === "forgot-wallet" && currentStep === 1 && (
                    <div className="space-y-5">
                      <Alert className="border-cyan-200 dark:border-cyan-800 bg-cyan-50/50 dark:bg-cyan-950/20">
                        <Search className="h-4 w-4 text-cyan-600" />
                        <AlertDescription className="text-sm text-cyan-800 dark:text-cyan-200">
                          Enter your recovery phrase and we&apos;ll locate your
                          wallet
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label
                          htmlFor="recovery-phrase-find"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          <KeyRound className="h-4 w-4" />
                          Recovery Phrase (12 words)
                        </Label>
                        <textarea
                          id="recovery-phrase-find"
                          className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 rounded-xl resize-none h-32 transition-colors cursor-text bg-white dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Enter your 12-word recovery phrase separated by spaces&#10;Example: word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                          value={recoveryPhrase}
                          onChange={(e) => setRecoveryPhrase(e.target.value)}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={`font-medium ${
                              phraseWords.length === 12
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {phraseWords.length} / 12 words
                          </span>
                          {phraseWords.length === 12 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Valid count
                            </motion.span>
                          )}
                        </div>
                        {errors.recoveryPhrase && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-500 font-medium"
                          >
                            {errors.recoveryPhrase}
                          </motion.p>
                        )}
                      </div>

                      {/* Word Preview Grid */}
                      <AnimatePresence>
                        {phraseWords.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Word Preview
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {phraseWords.slice(0, 12).map((word, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                  >
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      {index + 1}.
                                    </span>
                                    <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {word}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Forgot Wallet Flow - Step 2: Confirm Found Wallet */}
                  {recoveryMode === "forgot-wallet" &&
                    currentStep === 2 &&
                    recoveredWallet && (
                      <div className="space-y-5">
                        <Alert className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                            Wallet found! Confirm this is correct before
                            proceeding
                          </AlertDescription>
                        </Alert>

                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                          className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 shadow-lg"
                        >
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl shadow-md">
                              <Wallet className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">
                                {recoveredWallet.name}
                              </h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2.5 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    Address
                                  </span>
                                  <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">
                                    {formatAddress(recoveredWallet.address)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                          <div className="flex items-start gap-3">
                            <BadgeCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1.5">
                                Is this your wallet?
                              </h4>
                              <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                If correct, continue to set a new password.
                                Otherwise, go back and verify your recovery
                                phrase.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Known Wallet Flow - Step 2: Recovery Phrase */}
                  {recoveryMode === "known-wallet" && currentStep === 2 && (
                    <div className="space-y-5">
                      <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
                        <AlertTriangle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                          Enter your recovery phrase exactly as provided. All 12
                          words in order.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label
                          htmlFor="recovery-phrase"
                          className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          <KeyRound className="h-4 w-4" />
                          Recovery Phrase (12 words)
                        </Label>
                        <textarea
                          id="recovery-phrase"
                          className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 rounded-xl resize-none h-32 transition-colors cursor-text bg-white dark:bg-gray-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="Enter your 12-word recovery phrase separated by spaces&#10;Example: word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                          value={recoveryPhrase}
                          onChange={(e) => setRecoveryPhrase(e.target.value)}
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span
                            className={`font-medium ${
                              phraseWords.length === 12
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {phraseWords.length} / 12 words
                          </span>
                          {phraseWords.length === 12 && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-medium"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Valid count
                            </motion.span>
                          )}
                        </div>
                        {errors.recoveryPhrase && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-red-500 font-medium"
                          >
                            {errors.recoveryPhrase}
                          </motion.p>
                        )}
                      </div>

                      {/* Word Preview Grid */}
                      <AnimatePresence>
                        {phraseWords.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: "auto" }}
                            exit={{ opacity: 0, y: -10, height: 0 }}
                            transition={{ duration: 0.4 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                                Word Preview
                              </h4>
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {phraseWords.slice(0, 12).map((word, index) => (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                                  >
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                      {index + 1}.
                                    </span>
                                    <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-100 truncate">
                                      {word}
                                    </span>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Step 3: New Password (Both Flows) */}
                  {currentStep === 3 && (
                    <div className="space-y-5">
                      <Alert className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-sm text-green-800 dark:text-green-200">
                          {recoveryMode === "forgot-wallet"
                            ? "Wallet verified! Create a new secure password"
                            : "Recovery verified! Create a new secure password"}
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-4">
                        <div>
                          <Label
                            htmlFor="new-password"
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            <Lock className="h-4 w-4" />
                            New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="new-password"
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Minimum 8 characters"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="h-12 pr-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 w-12 cursor-pointer hover:bg-transparent"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {errors.newPassword && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-red-500 mt-1.5 font-medium"
                            >
                              {errors.newPassword}
                            </motion.p>
                          )}
                        </div>

                        <div>
                          <Label
                            htmlFor="confirm-password"
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            <Lock className="h-4 w-4" />
                            Confirm New Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirm-password"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter your password"
                              value={confirmPassword}
                              onChange={(e) =>
                                setConfirmPassword(e.target.value)
                              }
                              className="h-12 pr-12 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-colors bg-white dark:bg-gray-800 text-sm"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-12 w-12 cursor-pointer hover:bg-transparent"
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
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-sm text-red-500 mt-1.5 font-medium"
                            >
                              {errors.confirmPassword}
                            </motion.p>
                          )}
                        </div>

                        {/* Password Strength Indicator */}
                        <AnimatePresence>
                          {newPassword && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-2 overflow-hidden"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                  Password Strength
                                </span>
                                <span
                                  className={`font-semibold ${
                                    newPassword.length >= 12
                                      ? "text-green-600 dark:text-green-400"
                                      : newPassword.length >= 8
                                        ? "text-cyan-600 dark:text-cyan-400"
                                        : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {newPassword.length >= 12
                                    ? "Strong"
                                    : newPassword.length >= 8
                                      ? "Good"
                                      : "Weak"}
                                </span>
                              </div>
                              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{
                                    width:
                                      newPassword.length >= 12
                                        ? "100%"
                                        : newPassword.length >= 8
                                          ? "66%"
                                          : "33%",
                                  }}
                                  transition={{ duration: 0.3 }}
                                  className={`h-full transition-colors ${
                                    newPassword.length >= 12
                                      ? "bg-green-500"
                                      : newPassword.length >= 8
                                        ? "bg-cyan-500"
                                        : "bg-red-500"
                                  }`}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <BadgeCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1.5">
                              Password Tips
                            </h4>
                            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 leading-relaxed">
                              <li>
                                • Use at least 8 characters (12+ recommended)
                              </li>
                              <li>• Mix uppercase and lowercase letters</li>
                              <li>• Include numbers and special characters</li>
                              <li>• Avoid common words or personal info</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                {currentStep === 0 ? (
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 cursor-pointer border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm h-11"
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
                    disabled={isLoading || isRecoveringWallet}
                    className="flex items-center gap-2 cursor-pointer border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm h-11"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {currentStep === 1 ? "Change Method" : "Previous"}
                  </Button>
                )}

                {currentStep === 0 ? (
                  <div />
                ) : currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={
                      !isStepValid(currentStep) ||
                      isRecoveringWallet ||
                      (recoveryMode === "forgot-wallet" &&
                        currentStep === 1 &&
                        phraseWords.length !== 12)
                    }
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium h-11 px-6"
                  >
                    {isRecoveringWallet ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Finding Wallet...
                      </>
                    ) : (
                      <>
                        {recoveryMode === "forgot-wallet" &&
                        currentStep === 1 ? (
                          <>
                            <Search className="h-4 w-4" />
                            Find My Wallet
                          </>
                        ) : (
                          <>
                            Continue
                            <ChevronRight className="h-4 w-4" />
                          </>
                        )}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={!isStepValid(totalSteps) || isLoading}
                    className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium h-11 px-6"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Resetting...
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center space-y-2"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline transition-colors cursor-pointer"
              >
                Sign In
              </Link>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have a wallet?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold hover:underline transition-colors cursor-pointer"
              >
                Create New Wallet
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Network Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-4 right-4 hidden sm:block"
      >
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600 dark:text-gray-400 font-medium">
              Network Online
            </span>
          </div>
        </div>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: easeInOut,
          }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: easeInOut,
            delay: 1,
          }}
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: easeInOut,
            delay: 2,
          }}
          className="absolute top-3/4 left-3/4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"
        />
      </div>
    </div>
  );
}
