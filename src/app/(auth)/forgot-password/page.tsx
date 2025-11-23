/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import {
  WalletIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  CheckBadgeIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { WalletData } from "@/types/web3";
import { motion, AnimatePresence } from "framer-motion";
import { authAPI } from "@/lib/api/auth.api";
import { AuthRouteGuard } from "@/components/guards/auth-route-guard";
import { usePageTitle } from "@/hooks/use-page-title";

type RecoveryMode = "known-wallet" | "forgot-wallet" | null;
type WalletInputMode = "select" | "manual";

export default function ForgotPasswordPage() {
  usePageTitle("Forgot Password");
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(3);
  const [isVisible, setIsVisible] = useState(false);

  const [availableWallets, setAvailableWallets] = useState<WalletData[]>([]);
  const [walletInputMode, setWalletInputMode] =
    useState<WalletInputMode>("select");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [manualWalletAddress, setManualWalletAddress] = useState("");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [recoveredWallet, setRecoveredWallet] = useState<WalletData | null>(
    null
  );
  const [isRecoveringWallet, setIsRecoveringWallet] = useState(false);

  const [walletError, setWalletError] = useState("");
  const [recoveryPhraseError, setRecoveryPhraseError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phraseWords, setPhraseWords] = useState<string[]>([]);

  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    uppercase: false,
    special: false,
  });
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { getAllWallets } = useWallet();
  const router = useRouter();

  useEffect(() => {
    setPasswordChecks({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
    });
  }, [newPassword]);

  useEffect(() => {
    setIsVisible(true);
    const wallets = getAllWallets();
    setAvailableWallets(wallets);
  }, [getAllWallets]);

  useEffect(() => {
    const words = recoveryPhrase.trim().split(/\s+/).filter(Boolean);
    setPhraseWords(words);
  }, [recoveryPhrase]);

  useEffect(() => {
    if (recoveryMode === "known-wallet") {
      setTotalSteps(3);
    } else if (recoveryMode === "forgot-wallet") {
      setTotalSteps(3);
    }
  }, [recoveryMode]);

  const handleModeSelection = (mode: RecoveryMode) => {
    setRecoveryMode(mode);
    setIsVisible(false);
    setTimeout(() => {
      setCurrentStep(1);
      setIsVisible(true);
    }, 300);
  };

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

  const verifyWalletExists = async (address: string): Promise<boolean> => {
    try {
      await authAPI.checkWalletExists(address);
      return true;
    } catch (error: any) {
      return false;
    }
  };

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

  const handleRecoverWallet = async () => {
    if (phraseWords.length !== 12) {
      setRecoveryPhraseError("Recovery phrase must be exactly 12 words");
      toast.error("Recovery phrase must be exactly 12 words");
      return;
    }

    setIsRecoveringWallet(true);
    setRecoveryPhraseError("");

    try {
      const response = await authAPI.findWalletByMnemonic(
        recoveryPhrase.trim()
      );

      const walletData: WalletData = {
        id: Date.now().toString(),
        name: response.data.walletName || "Recovered Wallet",
        address: response.data.walletAddress,
        createdAt: response.data.createdAt || new Date().toISOString(),
        encryptedPrivateKey: "",
      };

      setRecoveredWallet(walletData);

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
      let errorMessage = "Unable to find wallet with this recovery phrase";

      if (error.response) {
        const statusCode = error.response.status;
        const backendError = error.response.data?.error;

        if (statusCode === 404) {
          errorMessage = "No wallet found with this recovery phrase";
        } else if (statusCode === 429) {
          errorMessage =
            "Too many attempts. Please wait a few minutes and try again";
        } else if (statusCode === 500) {
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
        if (error.message.includes("Network")) {
          errorMessage = "Network error. Please check your internet connection";
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
      if (currentStep === 1) {
        handleRecoverWallet();
        return;
      } else if (currentStep === 2 || currentStep === 3) {
        if (!validateStep(currentStep)) return;
        nextStep();
      }
    }
  };

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

      if (recoveryMode === "forgot-wallet") {
        walletAddress = recoveredWallet?.address || "";

        if (!walletAddress) {
          throw new Error("No wallet address found");
        }
      } else if (recoveryMode === "known-wallet") {
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

      await authAPI.recoverWalletPassword({
        mnemonic: recoveryPhrase.trim(),
        walletAddress: walletAddress,
        newPassword: newPassword,
      });

      try {
        const walletsData = JSON.parse(
          localStorage.getItem("chainvanguard_wallets") || "[]"
        );

        const walletIndex = walletsData.findIndex(
          (w: any) => w.address.toLowerCase() === walletAddress.toLowerCase()
        );

        if (walletIndex !== -1) {
          localStorage.setItem(
            `wallet_${walletsData[walletIndex].id}_password`,
            newPassword
          );
        }
      } catch (error) {
        console.warn("Could not update local wallet:", error);
      }

      localStorage.removeItem("temp_recovered_wallet");

      toast.success(
        "Password reset successfully! You can now login with your new password.",
        { duration: 5000 }
      );

      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setIsLoading(false);

      let errorMessage = "Unable to reset password";
      let fieldError: "recoveryPhrase" | "newPassword" | null = null;

      if (error.response) {
        const statusCode = error.response.status;
        const backendError = error.response.data?.error;

        switch (statusCode) {
          case 401:
            errorMessage = "Recovery phrase doesn't match this wallet";
            fieldError = "recoveryPhrase";
            break;
          case 404:
            errorMessage = "Wallet not found. Please check the wallet address";
            break;
          case 429:
            errorMessage = "Too many attempts. Please wait 10 minutes";
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

  const getSelectedWalletName = () => {
    const wallet = availableWallets.find((w) => w.id === selectedWallet);
    return wallet ? wallet.name : "Select your wallet";
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

  return (
    <AuthRouteGuard>
      <div className="min-h-screen bg-white dark:bg-gray-950">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-950">
          <div className="max-w-[1600px] mx-auto px-12 lg:px-16 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <span className="text-lg font-light text-gray-900 dark:text-white tracking-wide">
                ChainVanguard
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/login">
                <button className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                  Back to Login
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-black dark:bg-white text-white dark:text-black px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors">
                  Create Account
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex items-center justify-center min-h-screen py-16 pt-16">
          <div className="w-full max-w-3xl mx-auto px-12 lg:px-16">
            {/* Progress Bar */}
            <AnimatePresence mode="wait">
              {currentStep > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-8 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                    <span>
                      Step {currentStep} of {totalSteps}
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-px bg-gray-200 dark:bg-gray-800 overflow-hidden">
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
            <div className="space-y-12">
              {/* Header */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-center space-y-4"
                >
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight">
                    {getStepTitle()}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-light max-w-md mx-auto">
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
                  className="space-y-4"
                >
                  {/* Step 0: Mode Selection */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheckIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Choose how you want to recover access to your wallet
                          </p>
                        </div>
                      </div>

                      <div className="space-y-0">
                        {/* Known Wallet Option */}
                        <button
                          onClick={() => handleModeSelection("known-wallet")}
                          className="w-full p-6 text-left border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <WalletIcon className="h-5 w-5 text-gray-900 dark:text-white mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                I Know My Wallet
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Select your wallet and reset password using
                                recovery phrase
                              </p>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                          </div>
                        </button>

                        {/* Forgot Wallet Option */}
                        <button
                          onClick={() => handleModeSelection("forgot-wallet")}
                          className="w-full p-6 text-left border-t-0 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-900 dark:text-white mt-0.5" />
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                I Forgot My Wallet
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Use recovery phrase to find wallet, then reset
                                password
                              </p>
                            </div>
                            <ChevronRightIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                          </div>
                        </button>
                      </div>

                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <CheckBadgeIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                              What You&apos;ll Need
                            </h4>
                            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
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
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <ShieldCheckIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Have your 12-word recovery phrase ready before
                            continuing
                          </p>
                        </div>
                      </div>

                      {/* Wallet Input Mode Toggle */}
                      <div className="flex border border-gray-200 dark:border-gray-800">
                        <button
                          type="button"
                          onClick={() => setWalletInputMode("select")}
                          className={`flex-1 h-11 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${
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
                          className={`flex-1 h-11 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors ${
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
                                    } pb-px`}
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
                                        onClick={() =>
                                          setShowWalletDropdown(false)
                                        }
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
                                                if (walletError)
                                                  setWalletError("");
                                              }}
                                              className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors border-b border-gray-200 dark:border-gray-800 last:border-0"
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
                                    onChange={(e) => {
                                      setManualWalletAddress(e.target.value);
                                      if (walletError) setWalletError("");
                                    }}
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
                    </div>
                  )}

                  {/* Forgot Wallet Flow - Step 1: Enter Recovery Phrase */}
                  {recoveryMode === "forgot-wallet" && currentStep === 1 && (
                    <div className="space-y-4">
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Enter your recovery phrase and we&apos;ll locate
                            your wallet
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                            Recovery Phrase (12 words)
                          </label>
                          <textarea
                            className="w-full p-3 border border-gray-200 dark:border-gray-800 resize-none h-24 transition-colors bg-transparent font-mono text-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
                            placeholder="Enter your 12-word recovery phrase separated by spaces"
                            value={recoveryPhrase}
                            onChange={(e) => {
                              setRecoveryPhrase(e.target.value);
                              if (recoveryPhraseError)
                                setRecoveryPhraseError("");
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
                                <CheckCircleIcon className="h-3 w-3" />
                                Valid count
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-4 mt-1">
                          {recoveryPhraseError && (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <p className="text-xs text-red-500">
                                {recoveryPhraseError}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Word Preview Grid */}
                      {phraseWords.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-800 p-4">
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-[0.1em]">
                            Word Preview
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {phraseWords.slice(0, 12).map((word, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
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
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <ExclamationTriangleIcon className="h-4 w-4 text-gray-900 dark:text-white flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            Enter your recovery phrase exactly as provided. All
                            12 words in order.
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="space-y-3">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                            Recovery Phrase (12 words)
                          </label>
                          <textarea
                            className="w-full p-3 border border-gray-200 dark:border-gray-800 resize-none h-24 transition-colors bg-transparent font-mono text-sm placeholder-gray-400 focus:outline-none focus:border-gray-900 dark:focus:border-white"
                            placeholder="Enter your 12-word recovery phrase separated by spaces"
                            value={recoveryPhrase}
                            onChange={(e) => {
                              setRecoveryPhrase(e.target.value);
                              if (recoveryPhraseError)
                                setRecoveryPhraseError("");
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
                                <CheckCircleIcon className="h-3 w-3" />
                                Valid count
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="h-4 mt-1">
                          {recoveryPhraseError && (
                            <div className="flex items-center gap-2">
                              <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                              <p className="text-xs text-red-500">
                                {recoveryPhraseError}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {phraseWords.length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-800 p-4">
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-3 uppercase tracking-[0.1em]">
                            Word Preview
                          </h4>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {phraseWords.slice(0, 12).map((word, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
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
                        <div className="border border-gray-200 dark:border-gray-800 p-4">
                          <div className="flex items-start gap-3">
                            <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-900 dark:text-white">
                              Wallet found! Confirm this is correct before
                              proceeding
                            </p>
                          </div>
                        </div>

                        <div className="border border-gray-200 dark:border-gray-800 p-6">
                          <div className="flex items-start gap-4">
                            <WalletIcon className="h-6 w-6 text-gray-900 dark:text-white" />
                            <div className="flex-1 space-y-3">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {recoveredWallet.name}
                              </h3>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.1em]">
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
                      <div className="border border-gray-200 dark:border-gray-800 p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-900 dark:text-white">
                            {recoveryMode === "forgot-wallet"
                              ? "Wallet verified! Create a new secure password"
                              : "Recovery verified! Create a new secure password"}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                              New Password
                            </label>
                            <div className="relative">
                              <div
                                className={`border-b ${
                                  newPasswordError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px`}
                              >
                                <div className="flex items-center">
                                  <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Minimum 8 characters"
                                    value={newPassword}
                                    onFocus={() => {
                                      setPasswordFocused(true);
                                      if (newPasswordError)
                                        setNewPasswordError("");
                                    }}
                                    onBlur={() => setPasswordFocused(false)}
                                    onChange={(e) => {
                                      setNewPassword(e.target.value);
                                      if (newPasswordError)
                                        setNewPasswordError("");
                                    }}
                                    className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowNewPassword(!showNewPassword)
                                    }
                                    className="h-12 px-3 -mr-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                  >
                                    {showNewPassword ? (
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
                            {newPasswordError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {newPasswordError}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* Password Strength Indicator */}
                            <motion.div
                              initial={false}
                              animate={
                                passwordFocused || newPassword.length > 0
                                  ? {
                                      height: "auto",
                                      opacity: 1,
                                    }
                                  : { height: 0, opacity: 0 }
                              }
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 space-y-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <CheckIcon
                                    className={`h-3.5 w-3.5 ${passwordChecks.length ? "text-black" : "text-gray-300"}`}
                                  />
                                  <span>At least 8 characters</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                  <CheckIcon
                                    className={`h-3.5 w-3.5 ${passwordChecks.uppercase ? "text-black" : "text-gray-300"}`}
                                  />
                                  <span>One uppercase letter</span>
                                </div>

                                <div className="flex items-center gap-2 text-xs">
                                  <CheckIcon
                                    className={`h-3.5 w-3.5 ${passwordChecks.special ? "text-black" : "text-gray-300"}`}
                                  />
                                  <span>One special character</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>

                        <div>
                          <div className="space-y-3">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                              Confirm New Password
                            </label>
                            <div className="relative">
                              <div
                                className={`border-b ${
                                  confirmPasswordError
                                    ? "border-red-500 dark:border-red-500"
                                    : "border-gray-900 dark:border-white"
                                } pb-px`}
                              >
                                <div className="flex items-center">
                                  <input
                                    type={
                                      showConfirmPassword ? "text" : "password"
                                    }
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
                                    className="flex-1 h-12 px-0 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowConfirmPassword(
                                        !showConfirmPassword
                                      )
                                    }
                                    className="h-12 px-3 -mr-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                  >
                                    {showConfirmPassword ? (
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
                            {confirmPasswordError && (
                              <div className="flex items-center gap-2">
                                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                                <p className="text-xs text-red-500">
                                  {confirmPasswordError}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-800">
                {currentStep === 0 ? (
                  <Link href="/login">
                    <button className="border border-black dark:border-white text-black dark:text-white px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2">
                      <ArrowLeftIcon className="h-3.5 w-3.5" />
                      Back to Login
                    </button>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={isLoading || isRecoveringWallet}
                    className="border border-black dark:border-white text-black dark:text-white px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                    {currentStep === 1 ? "Change Method" : "Previous"}
                  </button>
                )}

                {currentStep === 0 ? (
                  <div />
                ) : currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleContinue}
                    disabled={isRecoveringWallet || isLoading}
                    className="bg-black dark:bg-white text-white dark:text-black px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRecoveringWallet || isLoading ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        {isRecoveringWallet
                          ? "Finding Wallet..."
                          : "Verifying..."}
                      </>
                    ) : (
                      <>
                        {recoveryMode === "forgot-wallet" &&
                        currentStep === 1 ? (
                          <>
                            <MagnifyingGlassIcon className="h-3.5 w-3.5" />
                            Find My Wallet
                          </>
                        ) : (
                          <>
                            Continue
                            <ChevronRightIcon className="h-3.5 w-3.5" />
                          </>
                        )}
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={!isStepValid(totalSteps) || isLoading}
                    className="bg-black dark:bg-white text-white dark:text-black px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Reset Password
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Help Links */}
            <div className="mt-8 text-center space-y-2 pt-8 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-gray-900 dark:text-white hover:underline transition-colors"
                >
                  Sign In
                </Link>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Don&apos;t have a wallet?{" "}
                <Link
                  href="/register"
                  className="text-gray-900 dark:text-white hover:underline transition-colors"
                >
                  Create New Wallet
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Network Status */}
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
