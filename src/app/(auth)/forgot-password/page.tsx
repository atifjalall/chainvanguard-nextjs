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
  Check,
} from "lucide-react";
import { WalletData } from "@/types/web3";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "@/lib/api/auth.api";
import { AuthRouteGuard } from "@/components/guards/auth-route-guard";

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

  // Validation - SEPARATE STATE FOR EACH ERROR (Login/Register approach)
  const [walletError, setWalletError] = useState("");
  const [recoveryPhraseError, setRecoveryPhraseError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phraseWords, setPhraseWords] = useState<string[]>([]);

  // Password strength checks
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    special: false,
  });
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { getAllWallets } = useWallet();
  const router = useRouter();

  // Update password strength checks
  useEffect(() => {
    setPasswordChecks({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    });
  }, [newPassword]);

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
        setWalletError("");
        setRecoveryPhraseError("");
        setNewPasswordError("");
        setConfirmPasswordError("");
        setWalletInputMode("select");
        setIsVisible(true);
      }, 300);
    }
  };

  const progress = currentStep === 0 ? 0 : (currentStep / totalSteps) * 100;

  // ADD NEW FUNCTION - Verify wallet exists in database
  const verifyWalletExists = async (address: string): Promise<boolean> => {
    try {
      console.log("[FORGOT PASSWORD] 🔍 Checking if wallet exists:", address);

      const response = await authAPI.checkWalletExists(address);

      console.log("[FORGOT PASSWORD] ✅ Wallet exists");
      return true;
    } catch (error: any) {
      console.error("[FORGOT PASSWORD] ❌ Wallet not found:", error);
      return false;
    }
  };

  // Validation functions - UPDATED TO USE SEPARATE STATE
  const validateStep = (step: number): boolean => {
    let hasErrors = false;

    if (recoveryMode === "known-wallet") {
      switch (step) {
        case 1:
          if (walletInputMode === "select" && !selectedWallet) {
            setWalletError("Please select a wallet");
            hasErrors = true;
          } else if (walletInputMode === "manual" && !manualWalletAddress) {
            setWalletError("Please enter wallet address");
            hasErrors = true;
          } else if (
            walletInputMode === "manual" &&
            manualWalletAddress.length < 10
          ) {
            setWalletError("Please enter a valid wallet address");
            hasErrors = true;
          }
          break;
        case 2:
          if (!recoveryPhrase.trim()) {
            setRecoveryPhraseError("Recovery phrase is required");
            hasErrors = true;
          } else if (phraseWords.length !== 12) {
            setRecoveryPhraseError("Recovery phrase must be exactly 12 words");
            hasErrors = true;
          }
          break;
        case 3:
          if (!newPassword || newPassword.length < 8) {
            setNewPasswordError("Password must be at least 8 characters");
            hasErrors = true;
          }
          if (newPassword !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match");
            hasErrors = true;
          }
          break;
      }
    } else if (recoveryMode === "forgot-wallet") {
      switch (step) {
        case 1:
          if (!recoveryPhrase.trim()) {
            setRecoveryPhraseError("Recovery phrase is required");
            hasErrors = true;
          } else if (phraseWords.length !== 12) {
            setRecoveryPhraseError("Recovery phrase must be exactly 12 words");
            hasErrors = true;
          }
          break;
        case 2:
          if (!recoveredWallet) {
            setWalletError("Wallet recovery failed");
            hasErrors = true;
          }
          break;
        case 3:
          if (!newPassword || newPassword.length < 8) {
            setNewPasswordError("Password must be at least 8 characters");
            hasErrors = true;
          }
          if (newPassword !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match");
            hasErrors = true;
          }
          break;
      }
    }

    return !hasErrors;
  };

  const isStepValid = (step: number) => {
    if (recoveryMode === "known-wallet") {
      switch (step) {
        case 1:
          if (walletInputMode === "select") return !!selectedWallet;
          return manualWalletAddress.length >= 10;
        case 2:
          return phraseWords.length === 12;
        case 3:
          return newPassword.length >= 8 && newPassword === confirmPassword;
      }
    } else if (recoveryMode === "forgot-wallet") {
      switch (step) {
        case 1:
          return phraseWords.length === 12;
        case 2:
          return !!recoveredWallet;
        case 3:
          return newPassword.length >= 8 && newPassword === confirmPassword;
      }
    }
    return false;
  };

  // WALLET RECOVERY - FORGOT WALLET FLOW

  const handleRecoverWallet = async () => {
    if (phraseWords.length !== 12) {
      setRecoveryPhraseError("Recovery phrase must be exactly 12 words");
      toast.error("Recovery phrase must be exactly 12 words");
      return;
    }

    setIsRecoveringWallet(true);
    setRecoveryPhraseError("");

    try {
      console.log("[FORGOT PASSWORD] 🔍 Finding wallet by mnemonic...");

      // ✅ CALL BACKEND API
      const response = await authAPI.findWalletByMnemonic(
        recoveryPhrase.trim()
      );

      console.log(
        "[FORGOT PASSWORD] ✅ Wallet found:",
        response.data.walletAddress
      );

      // ✅ Set recovered wallet data
      const walletData: WalletData = {
        id: Date.now().toString(),
        name: response.data.walletName || "Recovered Wallet",
        address: response.data.walletAddress,
        createdAt: response.data.createdAt || new Date().toISOString(),
        encryptedPrivateKey: "",
      };

      setRecoveredWallet(walletData);

      // ✅ Save to localStorage for later use
      localStorage.setItem(
        "temp_recovered_wallet",
        JSON.stringify(response.data)
      );

      toast.success(
        `Wallet found: ${response.data.walletName || response.data.email}`
      );

      setTimeout(() => {
        nextStep();
      }, 1000);
    } catch (error: any) {
      console.error("[FORGOT PASSWORD] Error:", error);

      // ✅ BETTER USER-FRIENDLY ERROR MESSAGES
      let errorMessage = "Unable to find wallet with this recovery phrase";

      if (error.response) {
        const statusCode = error.response.status;
        const backendError = error.response.data?.error;

        console.error("[FORGOT PASSWORD] Backend error:", {
          status: statusCode,
          error: backendError,
          data: error.response.data,
        });

        // ✅ SIMPLIFIED ERROR MESSAGES
        if (statusCode === 404) {
          errorMessage = "No wallet found with this recovery phrase";
        } else if (statusCode === 429) {
          errorMessage =
            "⏳ Too many attempts. Please wait a few minutes and try again";
        } else if (statusCode === 500) {
          // ✅ BETTER MESSAGE FOR 500 ERROR
          errorMessage =
            "Invalid recovery phrase. Please check your 12 words and try again";
        } else if (statusCode === 400) {
          errorMessage =
            "Invalid recovery phrase format. Please check your words";
        } else {
          errorMessage =
            backendError ||
            "Unable to find wallet. Please verify your recovery phrase";
        }
      } else if (error.message) {
        // Network error
        if (error.message.includes("Network")) {
          errorMessage =
            "🌐 Network error. Please check your internet connection";
        } else {
          errorMessage = `${error.message}`;
        }
      }

      setRecoveryPhraseError(errorMessage);
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setIsRecoveringWallet(false);
    }
  };

  const handleContinue = async () => {
    setWalletError("");
    setRecoveryPhraseError("");
    setNewPasswordError("");
    setConfirmPasswordError("");

    let hasErrors = false;

    if (recoveryMode === "known-wallet") {
      switch (currentStep) {
        case 1:
          if (walletInputMode === "select" && !selectedWallet) {
            setWalletError("Please select a wallet");
            toast.error("Please select a wallet");
            hasErrors = true;
          } else if (walletInputMode === "manual" && !manualWalletAddress) {
            setWalletError("Please enter wallet address");
            toast.error("Please enter wallet address");
            hasErrors = true;
          } else if (
            walletInputMode === "manual" &&
            manualWalletAddress.length < 10
          ) {
            setWalletError("Please enter a valid wallet address");
            toast.error("Please enter a valid wallet address");
            hasErrors = true;
          } else if (walletInputMode === "manual") {
            setIsLoading(true);
            const walletExists = await verifyWalletExists(
              manualWalletAddress.trim()
            );
            setIsLoading(false);

            if (!walletExists) {
              setWalletError(
                "This wallet address is not registered. Please check and try again."
              );
              toast.error("Wallet not found!", { duration: 5000 });
              hasErrors = true;
            }
          }
          break;

        case 2:
          if (!recoveryPhrase.trim()) {
            setRecoveryPhraseError("Recovery phrase is required");
            toast.error("Recovery phrase is required");
            hasErrors = true;
          } else if (phraseWords.length !== 12) {
            setRecoveryPhraseError("Recovery phrase must be exactly 12 words");
            toast.error("Recovery phrase must be exactly 12 words");
            hasErrors = true;
          } else {
            setIsLoading(true);

            try {
              let walletAddress = "";
              if (walletInputMode === "manual") {
                walletAddress = manualWalletAddress.trim();
              } else {
                const wallet = availableWallets.find(
                  (w) => w.id === selectedWallet
                );
                if (wallet) {
                  walletAddress = wallet.address;
                }
              }

              if (!walletAddress) {
                throw new Error("No wallet address found");
              }

              const response = await authAPI.findWalletByMnemonic(
                recoveryPhrase.trim()
              );
              const recoveredAddress = response.data.walletAddress;

              console.log("[FORGOT PASSWORD] Comparing addresses:", {
                selected: walletAddress,
                recovered: recoveredAddress,
              });

              if (
                recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()
              ) {
                setRecoveryPhraseError(
                  "This recovery phrase does not match the selected wallet. Please verify your 12 words."
                );
                toast.error("Recovery phrase doesn't match this wallet", {
                  duration: 6000,
                });
                hasErrors = true;
              }
            } catch (error: any) {
              console.error(
                "[FORGOT PASSWORD] ❌ Mnemonic verification failed:",
                error
              );

              let errorMessage = "Invalid recovery phrase";

              if (error.response) {
                const statusCode = error.response.status;
                const backendError = error.response.data?.error;

                if (statusCode === 404) {
                  errorMessage = "No wallet found with this recovery phrase";
                } else if (statusCode === 500) {
                  errorMessage =
                    "Invalid recovery phrase. Please check your 12 words";
                } else {
                  errorMessage = backendError || "Invalid recovery phrase";
                }
              }

              setRecoveryPhraseError(errorMessage);
              toast.error(errorMessage, { duration: 5000 });
              hasErrors = true;
            } finally {
              setIsLoading(false);
            }
          }
          break;

        case 3:
          // ✅ STEP 3: VALIDATE PASSWORD
          if (!newPassword || newPassword.length < 8) {
            setNewPasswordError("Password must be at least 8 characters");
            toast.error("Password must be at least 8 characters");
            hasErrors = true;
          }
          if (newPassword !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match");
            toast.error("Passwords do not match");
            hasErrors = true;
          }
          break;
      }

      if (!hasErrors) {
        nextStep();
      }
    } else if (recoveryMode === "forgot-wallet") {
      // ✅ FORGOT WALLET FLOW
      if (currentStep === 1) {
        handleRecoverWallet();
        return;
      } else if (currentStep === 2 || currentStep === 3) {
        if (!validateStep(currentStep)) return;
        nextStep();
      }
    }
  };

  // PASSWORD RESET - BOTH FLOWS

  const handleResetPassword = async () => {
    if (!validateStep(totalSteps)) {
      if (!newPassword || newPassword.length < 8) {
        setNewPasswordError("Password must be at least 8 characters");
        toast.error("Password must be at least 8 characters");
      }
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        toast.error("Passwords do not match");
      }
      return;
    }

    setIsLoading(true);

    try {
      let walletAddress = "";

      // GET WALLET ADDRESS

      if (recoveryMode === "forgot-wallet") {
        // Use recovered wallet address
        walletAddress = recoveredWallet?.address || "";

        if (!walletAddress) {
          throw new Error("No wallet address found");
        }
      } else if (recoveryMode === "known-wallet") {
        // Get wallet address from selection or manual input
        if (walletInputMode === "manual") {
          walletAddress = manualWalletAddress.trim();
        } else {
          const wallet = availableWallets.find((w) => w.id === selectedWallet);
          if (wallet) {
            walletAddress = wallet.address;
          }
        }

        if (!walletAddress) {
          throw new Error("Please select a wallet");
        }
      }

      console.log(
        "[FORGOT PASSWORD] 🔐 Resetting password for:",
        walletAddress
      );

      // ✅ CALL BACKEND API TO RESET PASSWORD

      const response = await authAPI.recoverWalletPassword({
        mnemonic: recoveryPhrase.trim(),
        walletAddress: walletAddress,
        newPassword: newPassword,
      });

      console.log("[FORGOT PASSWORD] ✅ Password reset successful!");

      // UPDATE LOCAL STORAGE (Optional - for offline use)

      try {
        const walletsData = JSON.parse(
          localStorage.getItem("chainvanguard_wallets") || "[]"
        );

        // Find wallet by address
        const walletIndex = walletsData.findIndex(
          (w: any) => w.address.toLowerCase() === walletAddress.toLowerCase()
        );

        if (walletIndex !== -1) {
          // Update password in localStorage
          localStorage.setItem(
            `wallet_${walletsData[walletIndex].id}_password`,
            newPassword
          );
          console.log("[FORGOT PASSWORD] ✅ Local wallet password updated");
        }
      } catch (error) {
        console.warn(
          "[FORGOT PASSWORD] ⚠️ Could not update local wallet:",
          error
        );
        // Not critical - backend is source of truth
      }

      // CLEANUP & REDIRECT

      localStorage.removeItem("temp_recovered_wallet");

      toast.success(
        "Password reset successfully! You can now login with your new password.",
        { duration: 5000 }
      );

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      console.error("[FORGOT PASSWORD] Reset error:", error);

      setIsLoading(false);

      let errorMessage = "Unable to reset password";
      let fieldError: "recoveryPhrase" | "newPassword" | null = null;

      if (error.response) {
        const statusCode = error.response.status;
        const backendError = error.response.data?.error;

        console.error("[FORGOT PASSWORD] Backend error:", {
          status: statusCode,
          error: backendError,
        });

        switch (statusCode) {
          case 401:
            errorMessage = "Recovery phrase doesn't match this wallet";
            fieldError = "recoveryPhrase";
            break;
          case 404:
            errorMessage = "Wallet not found. Please check the wallet address";
            break;
          case 429:
            errorMessage =
              "⏳ Too many attempts. Please wait 10 minutes and try again";
            break;
          case 400:
            if (backendError?.includes("password")) {
              errorMessage = "Password must be at least 8 characters";
              fieldError = "newPassword";
            } else if (backendError?.includes("mnemonic")) {
              errorMessage =
                "Invalid recovery phrase. Please check your 12 words";
              fieldError = "recoveryPhrase";
            } else {
              errorMessage =
                backendError || "Invalid information. Please check all fields";
            }
            break;
          case 500:
            errorMessage =
              "Recovery phrase doesn't match this wallet. Please verify your words";
            fieldError = "recoveryPhrase";
            break;
          default:
            errorMessage =
              backendError || "Unable to reset password. Please try again";
        }
      } else if (error.message) {
        if (error.message.includes("Network")) {
          errorMessage = "Network error. Please check your internet connection";
        } else {
          errorMessage = `${error.message}`;
        }
      }

      if (fieldError === "newPassword") {
        setNewPasswordError(errorMessage);
      } else if (fieldError === "recoveryPhrase") {
        setRecoveryPhraseError(errorMessage);
      }

      toast.error(errorMessage, { duration: 6000 });
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
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
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
              <Link href="/login">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 rounded-none cursor-pointer text-xs h-9 px-4"
                >
                  Back to Login
                </Button>
              </Link>
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
            {/* Progress Bar */}
            <AnimatePresence mode="wait">
              {currentStep > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <span>
                      Step {currentStep} of {totalSteps}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-1.5 bg-gray-200 dark:bg-gray-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-gray-900 dark:bg-white transition-all duration-500 ease-out"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Recovery Card */}
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6">
              {/* Header */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center mb-6"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-3">
                    {getStepIcon()}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {getStepTitle()}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {getStepDescription()}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Form Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentStep}-${recoveryMode}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Step 0: Mode Selection */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex items-start gap-2">
                          <Shield className="h-3.5 w-3.5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Choose how you want to recover access to your wallet
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        {/* Known Wallet Option */}
                        <button
                          onClick={() => handleModeSelection("known-wallet")}
                          className="w-full p-4 text-left border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer rounded-none"
                        >
                          <div className="flex items-start gap-3">
                            <Wallet className="h-5 w-5 text-gray-900 dark:text-white mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                I Know My Wallet
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Select your wallet and reset password using
                                recovery phrase
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                          </div>
                        </button>

                        {/* Forgot Wallet Option */}
                        <button
                          onClick={() => handleModeSelection("forgot-wallet")}
                          className="w-full p-4 text-left border border-gray-200 dark:border-gray-800 hover:border-gray-900 dark:hover:border-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer rounded-none"
                        >
                          <div className="flex items-start gap-3">
                            <Search className="h-5 w-5 text-gray-900 dark:text-white mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                I Forgot My Wallet
                              </h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Use recovery phrase to find wallet, then reset
                                password
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-gray-400 mt-0.5" />
                          </div>
                        </button>
                      </div>

                      <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex items-start gap-2">
                          <BadgeCheck className="h-3.5 w-3.5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                              What You&apos;ll Need
                            </h4>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
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
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex items-start gap-2">
                          <Shield className="h-3.5 w-3.5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Have your 12-word recovery phrase ready before
                            continuing
                          </p>
                        </div>
                      </div>

                      {/* Wallet Input Mode Toggle */}
                      <div className="flex p-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <button
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

                      <AnimatePresence mode="wait">
                        {walletInputMode === "select" ? (
                          <motion.div
                            key="select"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-1.5"
                          >
                            <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                              <Wallet className="h-3 w-3" />
                              Select Your Wallet
                            </Label>
                            <Select
                              value={selectedWallet}
                              onValueChange={(value) => {
                                setSelectedWallet(value);
                                if (walletError) setWalletError("");
                              }}
                            >
                              <SelectTrigger className="h-9 w-full border rounded-none bg-white/50 dark:bg-gray-800/50 text-xs hover:border-gray-900 dark:hover:border-white transition-colors">
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
                                      <div className="p-1 bg-gray-900 dark:bg-white">
                                        <Wallet className="h-3 w-3 text-white dark:text-gray-900" />
                                      </div>
                                      <div>
                                        <div className="text-xs font-medium">
                                          {wallet.name}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">
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
                          </motion.div>
                        ) : (
                          <motion.div
                            key="manual"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-1.5"
                          >
                            <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                              <Edit3 className="h-3 w-3" />
                              Enter Wallet Address
                            </Label>
                            <Input
                              type="text"
                              placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                              value={manualWalletAddress}
                              onChange={(e) => {
                                setManualWalletAddress(e.target.value);
                                if (walletError) setWalletError("");
                              }}
                              className="h-9 border rounded-none bg-white/50 dark:bg-gray-800/50 font-mono text-xs placeholder:text-xs hover:border-gray-900 dark:hover:border-white transition-colors cursor-text"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {walletError && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {walletError}
                        </p>
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
                            <div className="p-3 bg-cyan-50/50 dark:bg-cyan-950/20 rounded-xl border border-cyan-200 dark:border-cyan-800">
                              <div className="flex items-start gap-2.5">
                                <BadgeCheck className="h-3.5 w-3.5 text-cyan-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h4 className="text-xs font-semibold text-cyan-900 dark:text-cyan-100 mb-1.5">
                                    Next Step
                                  </h4>
                                  <ul className="text-xs text-cyan-800 dark:text-cyan-200 space-y-0.5 leading-relaxed">
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
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex items-start gap-2">
                          <Search className="h-3.5 w-3.5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Enter your recovery phrase and we&apos;ll locate
                            your wallet
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <KeyRound className="h-3 w-3" />
                          Recovery Phrase (12 words)
                        </Label>
                        <textarea
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white focus:border-gray-900 dark:focus:border-white rounded-none resize-none h-24 transition-colors cursor-text bg-white/50 dark:bg-gray-800/50 font-mono text-xs placeholder:text-xs focus:outline-none"
                          placeholder="Enter your 12-word recovery phrase separated by spaces"
                          value={recoveryPhrase}
                          onChange={(e) => {
                            setRecoveryPhrase(e.target.value);
                            if (recoveryPhraseError) setRecoveryPhraseError("");
                          }}
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={
                              phraseWords.length === 12
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {phraseWords.length} / 12 words
                          </span>
                          {phraseWords.length === 12 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid count
                            </span>
                          )}
                        </div>
                        {recoveryPhraseError && (
                          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {recoveryPhraseError}
                          </p>
                        )}
                      </div>

                      {/* Word Preview Grid */}
                      {phraseWords.length > 0 && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Word Preview
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {phraseWords.slice(0, 12).map((word, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700"
                              >
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {index + 1}.
                                </span>
                                <span className="text-xs font-mono font-medium text-gray-900 dark:text-white truncate">
                                  {word}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Known Wallet - Recovery Phrase */}
                  {recoveryMode === "known-wallet" && currentStep === 2 && (
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Enter your recovery phrase exactly as provided. All
                            12 words in order.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                          <KeyRound className="h-3 w-3" />
                          Recovery Phrase (12 words)
                        </Label>
                        <textarea
                          className="w-full p-3 border border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white focus:border-gray-900 dark:focus:border-white rounded-none resize-none h-24 transition-colors cursor-text bg-white/50 dark:bg-gray-800/50 font-mono text-xs placeholder:text-xs focus:outline-none"
                          placeholder="Enter your 12-word recovery phrase separated by spaces"
                          value={recoveryPhrase}
                          onChange={(e) => setRecoveryPhrase(e.target.value)}
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={
                              phraseWords.length === 12
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {phraseWords.length} / 12 words
                          </span>
                          {phraseWords.length === 12 && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                              <CheckCircle2 className="h-3 w-3" />
                              Valid count
                            </span>
                          )}
                        </div>
                        {recoveryPhraseError && (
                          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {recoveryPhraseError}
                          </p>
                        )}
                      </div>

                      {phraseWords.length > 0 && (
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Word Preview
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {phraseWords.slice(0, 12).map((word, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700"
                              >
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {index + 1}.
                                </span>
                                <span className="text-xs font-mono font-medium text-gray-900 dark:text-white truncate">
                                  {word}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Forgot Wallet - Confirm Found Wallet */}
                  {recoveryMode === "forgot-wallet" &&
                    currentStep === 2 &&
                    recoveredWallet && (
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-900 dark:text-white">
                              Wallet found! Confirm this is correct before
                              proceeding
                            </p>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-gray-900 dark:bg-white">
                              <Wallet className="h-5 w-5 text-white dark:text-gray-900" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                {recoveredWallet.name}
                              </h3>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    Address
                                  </span>
                                  <span className="text-xs font-mono font-medium text-gray-900 dark:text-white">
                                    {formatAddress(recoveredWallet.address)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {/* Step 3: New Password (Both Flows) */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            {recoveryMode === "forgot-wallet"
                              ? "Wallet verified! Create a new secure password"
                              : "Recovery verified! Create a new secure password"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <Lock className="h-3 w-3" />
                            New Password
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              type={showNewPassword ? "text" : "password"}
                              placeholder="Minimum 8 characters"
                              value={newPassword}
                              onFocus={() => {
                                setPasswordFocused(true);
                                if (newPasswordError) setNewPasswordError("");
                              }}
                              onBlur={() => setPasswordFocused(false)}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (newPasswordError) setNewPasswordError("");
                              }}
                              className="h-9 pr-9 border rounded-none bg-white/50 dark:bg-gray-800/50 text-xs placeholder:text-xs hover:border-gray-900 dark:hover:border-white focus:border-gray-900 dark:focus:border-white transition-colors cursor-text"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-9 w-9 cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>

                          {/* Password Strength Indicator */}
                          <motion.div
                            initial={false}
                            animate={
                              passwordFocused || newPassword.length > 0
                                ? { height: "auto", opacity: 1, marginTop: 12 }
                                : { height: 0, opacity: 0, marginTop: 0 }
                            }
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-none px-3 py-2 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-xs">
                                <Check
                                  className={`h-3.5 w-3.5 ${passwordChecks.length ? "text-green-500" : "text-red-500"}`}
                                />
                                <span className="text-xs">
                                  At least 8 characters
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <Check
                                  className={`h-3.5 w-3.5 ${passwordChecks.uppercase ? "text-green-500" : "text-red-500"}`}
                                />
                                <span className="text-xs">
                                  One uppercase letter
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <Check
                                  className={`h-3.5 w-3.5 ${passwordChecks.special ? "text-green-500" : "text-red-500"}`}
                                />
                                <span className="text-xs">
                                  One special character
                                </span>
                              </div>
                            </div>
                          </motion.div>

                          {newPasswordError && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              {newPasswordError}
                            </p>
                          )}
                        </div>

                        <div>
                          <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                            <Lock className="h-3 w-3" />
                            Confirm New Password
                          </Label>
                          <div className="relative mt-1">
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Re-enter your password"
                              value={confirmPassword}
                              onFocus={() => {
                                if (confirmPasswordError)
                                  setConfirmPasswordError("");
                              }}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (confirmPasswordError)
                                  setConfirmPasswordError("");
                              }}
                              className="h-9 pr-9 border rounded-none bg-white/50 dark:bg-gray-800/50 text-xs placeholder:text-xs hover:border-gray-900 dark:hover:border-white focus:border-gray-900 dark:focus:border-white transition-colors cursor-text"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-9 w-9 cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                          {confirmPasswordError && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-1">
                              <AlertTriangle className="h-3 w-3" />
                              {confirmPasswordError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                {currentStep === 0 ? (
                  <Link href="/login">
                    <Button
                      variant="outline"
                      className="flex items-center gap-1.5 cursor-pointer border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-xs h-9 px-3 rounded-none"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to Login
                    </Button>
                  </Link>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={isLoading || isRecoveringWallet}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-9 rounded-none cursor-pointer"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    {currentStep === 1 ? "Change Method" : "Previous"}
                  </Button>
                )}

                {currentStep === 0 ? (
                  <div />
                ) : currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={handleContinue}
                    disabled={isRecoveringWallet || isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-9 rounded-none"
                  >
                    {isRecoveringWallet || isLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        {isRecoveringWallet
                          ? "Finding Wallet..."
                          : "Verifying..."}
                      </>
                    ) : (
                      <>
                        {recoveryMode === "forgot-wallet" &&
                        currentStep === 1 ? (
                          <>
                            <Search className="h-3.5 w-3.5" />
                            Find My Wallet
                          </>
                        ) : (
                          <>
                            Continue
                            <ChevronRight className="h-3.5 w-3.5" />
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-9 rounded-none"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Reset Password
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Help Links */}
            <div className="mt-4 text-center space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-gray-900 dark:text-white font-medium hover:underline transition-colors cursor-pointer"
                >
                  Sign In
                </Link>
              </p>
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
