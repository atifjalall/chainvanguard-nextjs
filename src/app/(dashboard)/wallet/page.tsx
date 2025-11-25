/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WalletIcon,
  PlusIcon,
  ArrowDownLeftIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CreditCardIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ChartPieIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import * as walletApi from "@/lib/api/wallet.api";
import { usePageTitle } from "@/hooks/use-page-title";
import { colors, badgeColors } from "@/lib/colorConstants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Transaction } from "@/types/index"; // Add this import to resolve the type

type Currency = "USD" | "CVT";

export default function WalletPage() {
  usePageTitle("Wallet");
  const { user } = useAuth();
  const {
    currentWallet,
    balance,
    transactions: walletTransactions,
    refreshBalance,
    refreshTransactions,
  } = useWallet();

  const [isVisible, setIsVisible] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currency, setCurrency] = useState<Currency>("CVT");
  const [activeAddTab, setActiveAddTab] = useState("amount");

  // Withdraw states
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [activeWithdrawTab, setActiveWithdrawTab] = useState("amount");

  // Payment form states
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  // Conversion rate: 1 USD = 278 CVT
  const CONVERSION_RATE = 278;

  // Map wallet provider transactions to local format
  const transactions: Transaction[] = (walletTransactions || []).map(
    (tx: any) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      description: tx.description,
      timestamp: tx.timestamp,
      status: tx.status,
      txHash: tx.txHash,
      category: tx.category,
      counterparty: tx.counterparty,
    })
  );

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Currency conversion helpers
  const convertAmount = (amountInCVT: number): number => {
    return currency === "USD" ? amountInCVT / CONVERSION_RATE : amountInCVT;
  };

  const formatUSD = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCVT = (amount: number): string => {
    if (amount >= 1e9) {
      return `CVT ${(amount / 1e9).toFixed(2)} B`;
    } else if (amount >= 1e6) {
      return `CVT ${(amount / 1e6).toFixed(2)} M`;
    } else {
      return `CVT ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  const formatCurrency = (amountInCVT: number): string => {
    if (currency === "USD") {
      const usdAmount = amountInCVT / CONVERSION_RATE;
      return formatUSD(usdAmount);
    } else {
      return formatCVT(amountInCVT);
    }
  };

  const formatCurrencyAbbreviated = (amountInCVT: number) => {
    if (currency === "USD") {
      const usdAmount = amountInCVT / CONVERSION_RATE;
      return formatUSD(usdAmount);
    } else {
      if (amountInCVT >= 1e9) {
        return `CVT ${(amountInCVT / 1e9).toFixed(2)} B`;
      } else if (amountInCVT >= 1e6) {
        return `CVT ${(amountInCVT / 1e6).toFixed(2)} M`;
      } else {
        return formatCVT(amountInCVT);
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Card number formatting (auto-space every 4 digits)
  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // Remove non-digits
    const limited = cleaned.slice(0, 16); // Max 16 digits
    const formatted = limited.match(/.{1,4}/g)?.join(" ") || limited;
    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  // Expiry date formatting (MM/YY with validation)
  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, ""); // Remove non-digits
    let limited = cleaned.slice(0, 4); // Max 4 digits (MMYY)

    // Validate month on the fly
    if (limited.length >= 2) {
      const month = parseInt(limited.slice(0, 2), 10);
      // If month is invalid, truncate it
      if (month > 12) {
        limited = limited.slice(0, 1); // Keep only first digit
      }
    }

    if (limited.length >= 3) {
      return `${limited.slice(0, 2)}/${limited.slice(2)}`;
    }
    return limited;
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpiryDate(e.target.value);
    setExpiryDate(formatted);
  };

  const validateExpiryDate = (value: string): boolean => {
    if (value.length !== 5) return false;

    const [month, year] = value.split("/");
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);

    // Validate month (01-12)
    if (monthNum < 1 || monthNum > 12) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100; // Get last 2 digits
    const currentMonth = currentDate.getMonth() + 1;

    // Year cannot be less than current year
    if (yearNum < currentYear) return false;
    // If same year, month must be current or future
    if (yearNum === currentYear && monthNum < currentMonth) return false;

    return true;
  };

  // Validation helpers
  const getCardNumberError = (): string => {
    if (!cardNumber) return "";
    const digitsOnly = cardNumber.replace(/\s/g, "");
    if (digitsOnly.length > 0 && digitsOnly.length < 16) {
      return "Card number must be 16 digits";
    }
    return "";
  };

  const getExpiryDateError = (): string => {
    if (!expiryDate) return "";
    if (expiryDate.length > 0 && expiryDate.length < 5) {
      return "Enter valid expiry date (MM/YY)";
    }
    if (expiryDate.length === 5 && !validateExpiryDate(expiryDate)) {
      return "Invalid or past date";
    }
    return "";
  };

  const getCvvError = (): string => {
    if (!cvv) return "";
    if (cvv.length > 0 && cvv.length < 3) {
      return "CVV must be 3 digits";
    }
    return "";
  };

  const getCardholderNameError = (): string => {
    if (!cardholderName) return "";
    if (cardholderName.trim().length < 3) {
      return "Name must be at least 3 characters";
    }
    return "";
  };

  // CVV formatting (only 3 digits)
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, ""); // Remove non-digits
    const limited = cleaned.slice(0, 3); // Max 3 digits
    setCvv(limited);
  };

  // Add Funds with Stripe Integration
  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Validate card details
    const cleanCardNumber = cardNumber.replace(/\s/g, "");
    if (cleanCardNumber.length !== 16) {
      toast.error("Invalid card number");
      return;
    }

    setIsLoading(true);

    try {
      const amountUSD = parseFloat(addAmount);

      // Step 1: Create payment intent
      const paymentIntentResponse = await walletApi.createPaymentIntent(
        amountUSD
      );

      if (!paymentIntentResponse.success) {
        throw new Error("Failed to create payment intent");
      }

      // Response structure: { success, message, data: { clientSecret, paymentIntentId, amount } }
      const { clientSecret, paymentIntentId } = paymentIntentResponse.data;

      // Step 2: Initialize Stripe
      const stripePublishableKey =
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      if (!stripePublishableKey) {
        throw new Error("Stripe publishable key not found");
      }

      const stripe = await loadStripe(stripePublishableKey);

      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      // Step 3: For test mode, use test payment method
      // In production, you'd use Stripe Elements instead
      const testPaymentMethod = "pm_card_visa"; // Stripe test payment method

      // Confirm payment using test payment method
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: testPaymentMethod,
        });

      if (stripeError) {
        throw new Error(stripeError.message || "Payment failed");
      }

      if (paymentIntent?.status !== "succeeded") {
        throw new Error("Payment was not successful");
      }

      // Step 4: Confirm payment on our backend (mints CVT tokens)
      const confirmResponse = await walletApi.confirmPayment(
        paymentIntentId,
        amountUSD
      );

      if (!confirmResponse.success) {
        throw new Error("Failed to add funds to wallet");
      }

      const cvtAmount = amountUSD * CONVERSION_RATE;

      toast.success(
        `Successfully added $${amountUSD} (${formatCVT(cvtAmount)} CVT) to your wallet!`
      );

      if (refreshBalance) await refreshBalance();
      if (refreshTransactions) await refreshTransactions();

      setAddAmount("");
      setPaymentMethod("");
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardholderName("");
      setAddFundsOpen(false);
      setActiveAddTab("amount");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Payment failed:", error);
      toast.error(`Payment failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manual refresh handler
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (refreshBalance) await refreshBalance();
      if (refreshTransactions) await refreshTransactions();
      toast.success("Wallet data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw Funds
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amountUSD = parseFloat(withdrawAmount);
    const cvtAmount = amountUSD * CONVERSION_RATE;

    // Check if user has enough balance
    if (cvtAmount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsLoading(true);

    try {
      const withdrawResponse = await walletApi.withdrawFunds({
        amount: amountUSD,
        withdrawalMethod: "bank",
        accountDetails: {},
      });

      if (!withdrawResponse.success) {
        throw new Error("Failed to withdraw funds");
      }

      toast.success(
        `Successfully withdrew $${amountUSD} (${formatCVT(cvtAmount)} CVT) from your wallet!`
      );

      if (refreshBalance) await refreshBalance();
      if (refreshTransactions) await refreshTransactions();

      setWithdrawAmount("");
      setWithdrawOpen(false);
      setActiveWithdrawTab("amount");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Withdrawal failed:", error);
      toast.error(`Withdrawal failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
      case "received":
        return (
          <ArrowDownLeftIcon className={`w-5 h-5 ${colors.icons.success}`} />
        );
      case "withdrawal":
      case "payment":
        return (
          <ArrowDownLeftIcon className={`w-5 h-5 ${colors.icons.danger}`} />
        );
      default:
        return <ClockIcon className={`w-5 h-5 ${colors.icons.secondary}`} />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          color: `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text}`,
          icon: CheckCircleIcon,
          label: "Completed",
        };
      case "pending":
        return {
          color: `${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text}`,
          icon: ClockIcon,
          label: "Pending",
        };
      case "failed":
        return {
          color: `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text}`,
          icon: ExclamationCircleIcon,
          label: "Failed",
        };
      default:
        return {
          color: `${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text}`,
          icon: ClockIcon,
          label: "Unknown",
        };
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedFilter === "all") return true;
    return tx.type === selectedFilter;
  });

  // Calculate stats
  const totalIncome = transactions
    .filter((tx) => ["deposit", "received"].includes(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => ["withdrawal", "payment"].includes(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const pendingTransactions = transactions.filter(
    (tx) => tx.status === "pending"
  ).length;

  // Note: Payment modal always uses USD

  if (!currentWallet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <Card
          className={`w-full max-w-md text-center ${colors.cards.base} rounded-none !shadow-none`}
        >
          <CardContent className="pt-8 pb-6">
            <div
              className={`h-20 w-20 mx-auto mb-6 ${colors.backgrounds.tertiary} flex items-center justify-center`}
            >
              <WalletIcon className={`w-10 h-10 ${colors.icons.primary}`} />
            </div>
            <h2 className={`text-2xl font-bold ${colors.texts.primary} mb-3`}>
              No Wallet Connected
            </h2>
            <p className={`${colors.texts.secondary} mb-6`}>
              Please connect your wallet to view balance and transactions
            </p>
            <button
              className={`flex items-center gap-2 px-6 h-10 ${colors.buttons.primary} rounded-none font-medium text-xs transition-all mx-auto cursor-pointer`}
            >
              <WalletIcon className="w-4 h-4" />
              Connect Wallet
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                ChainVanguard Wallet
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Welcome back, {user?.name || "User"}!
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  <WalletIcon className="h-3 w-3" />
                  Wallet Connected
                </Badge>
                <Badge
                  className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <ShieldCheckIcon className="h-3 w-3" />
                  Blockchain Secured
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Currency Toggle */}
              <div className="flex border border-gray-200 dark:border-gray-800">
                <Button
                  variant="nohover"
                  size="sm"
                  onClick={() => setCurrency("USD")}
                  className={cn(
                    "px-6 h-10 text-[10px] uppercase tracking-[0.2em] rounded-none flex items-center justify-center gap-2 cursor-pointer border border-transparent transition-colors",
                    currency === "USD"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-600 dark:text-gray-400 hover:border-black"
                  )}
                >
                  USD
                </Button>

                <Button
                  variant="nohover"
                  size="sm"
                  onClick={() => setCurrency("CVT")}
                  className={cn(
                    "px-6 h-10 text-[10px] uppercase tracking-[0.2em] rounded-none flex items-center justify-center gap-2 border-l border-gray-200 dark:border-gray-800 cursor-pointer border border-transparent transition-colors",
                    currency === "CVT"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-600 dark:text-gray-400 hover:border-black"
                  )}
                >
                  CVT
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
                className={`hidden lg:flex items-center gap-2 px-4 py-2 h-10 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:border-black dark:hover:border-white`}
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setShowBalance(!showBalance)}
                className={`flex items-center gap-2 px-4 py-2 h-10 rounded-none ${colors.buttons.primary} font-medium text-xs cursor-pointer transition-all`}
              >
                {showBalance ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
                {showBalance ? "Hide" : "Show"} Balance
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Wallet Card - Takes 2 columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Balance Card */}
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardContent className="p-12">
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                          Available Balance
                        </p>
                        <div className="flex items-baseline gap-3">
                          <p
                            className={`text-5xl font-extralight ${colors.texts.primary} tracking-tight`}
                          >
                            {showBalance ? formatCurrency(balance) : "••••••"}
                          </p>
                          {currency === "USD" && showBalance && (
                            <span className="text-sm text-gray-400 dark:text-gray-600">
                              ≈ {formatCVT(balance)}
                            </span>
                          )}
                        </div>
                      </div>
                      <WalletIcon
                        className={`h-16 w-16 ${colors.icons.primary} opacity-20`}
                      />
                    </div>

                    {/* Wallet Details */}
                    <div className={`pt-8 border-t ${colors.borders.primary}`}>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Wallet Name
                          </p>
                          <p
                            className={`text-sm ${colors.texts.primary} font-medium`}
                          >
                            {currentWallet?.name || "My Wallet"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Network
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 animate-pulse rounded-none" />
                            <p className={`text-xs ${colors.texts.primary}`}>
                              Hyperledger Fabric
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Wallet Address */}
                    <div className="space-y-2">
                      <Label className={`text-xs ${colors.texts.secondary}`}>
                        Wallet Address
                      </Label>
                      <div
                        className={`flex items-center gap-2 p-3 ${colors.backgrounds.tertiary} rounded-none ${colors.borders.primary}`}
                      >
                        <Avatar className="h-8 w-8 rounded-none">
                          <AvatarFallback
                            className={`${colors.backgrounds.quaternary} ${colors.texts.primary} text-xs rounded-none`}
                          >
                            {currentWallet.address.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <code
                          className={`text-sm font-mono ${colors.texts.primary} flex-1`}
                        >
                          {formatAddress(currentWallet.address)}
                        </code>
                        <button
                          onClick={() => copyToClipboard(currentWallet.address)}
                          className={`p-2 hover:${colors.backgrounds.hover} rounded-none transition-colors`}
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`pt-8 border-t ${colors.borders.primary}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setAddFundsOpen(true)}
                          className={`h-16 flex flex-col gap-2 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none !shadow-none hover:!shadow-none`}
                        >
                          <PlusIcon
                            className={`h-5 w-5 ${colors.texts.primary}`}
                          />
                          <span
                            className={`font-semibold ${colors.texts.primary} text-xs`}
                          >
                            Add Funds
                          </span>
                        </button>
                        <button
                          onClick={() => setWithdrawOpen(true)}
                          className={`h-16 flex flex-col gap-2 items-center justify-center ${colors.backgrounds.tertiary} ${colors.backgrounds.hover} ${colors.borders.primary} transition-all duration-300 cursor-pointer group rounded-none !shadow-none hover:!shadow-none`}
                        >
                          <ArrowDownLeftIcon
                            className={`h-5 w-5 ${colors.texts.primary} transform rotate-180`}
                          />
                          <span
                            className={`font-semibold ${colors.texts.primary} text-xs`}
                          >
                            Withdraw
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle
                      className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                    >
                      <ClockIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      Transaction History
                    </CardTitle>
                    <Select
                      value={selectedFilter}
                      onValueChange={setSelectedFilter}
                    >
                      <SelectTrigger
                        className={`w-32 h-10 ${colors.backgrounds.tertiary} rounded-none ${colors.borders.primary} text-xs`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="deposit">Deposits</SelectItem>
                        <SelectItem value="payment">Payments</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="withdrawal">Withdrawals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CardDescription
                    className={`text-xs ${colors.texts.secondary}`}
                  >
                    Your recent wallet transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                      <ClockIcon
                        className={`h-12 w-12 mx-auto ${colors.icons.secondary} mb-3`}
                      />
                      <p className={`text-sm ${colors.texts.secondary} mb-4`}>
                        {selectedFilter === "all"
                          ? "No transactions yet. Start by adding funds!"
                          : "No transactions match your filter."}
                      </p>
                      {selectedFilter !== "all" ? (
                        <Button
                          size="sm"
                          onClick={() => setSelectedFilter("all")}
                          className={`px-6 h-10 ${colors.buttons.primary} rounded-none text-xs font-medium transition-all`}
                        >
                          Clear Filters
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => setAddFundsOpen(true)}
                          className={`flex items-center gap-2 px-6 h-10 ${colors.buttons.primary} rounded-none text-xs font-medium transition-all mx-auto`}
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add Funds
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-0 border border-gray-200 dark:border-gray-800">
                      {filteredTransactions.slice(0, 5).map((transaction, index) => {
                        const statusConfig = getStatusConfig(
                          transaction.status
                        );
                        const StatusIcon = statusConfig.icon;
                        const isCredit = ["deposit", "received"].includes(
                          transaction.type
                        );

                        return (
                          <div
                            key={transaction.id}
                            className={`p-6 hover:${colors.backgrounds.hover} transition-colors cursor-pointer ${
                              index !== filteredTransactions.length - 1
                                ? `border-b ${colors.borders.primary}`
                                : ""
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div
                                  className={`h-10 w-10 flex items-center justify-center ${
                                    isCredit
                                      ? "bg-green-50 dark:bg-green-900/20"
                                      : "bg-gray-100 dark:bg-gray-900"
                                  }`}
                                >
                                  {getTransactionIcon(transaction.type)}
                                </div>

                                <div>
                                  <p
                                    className={`text-sm font-medium ${colors.texts.primary} mb-1`}
                                  >
                                    {transaction.description}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {new Date(
                                        transaction.timestamp
                                      ).toLocaleDateString()}
                                    </p>
                                    <Badge
                                      className={`${statusConfig.color} flex items-center gap-1 text-xs rounded-none`}
                                    >
                                      <StatusIcon className="h-3 w-3" />
                                      {statusConfig.label}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right">
                                <p
                                  className={`text-sm font-medium ${
                                    isCredit
                                      ? "text-green-600 dark:text-green-400"
                                      : colors.texts.primary
                                  }`}
                                >
                                  {isCredit ? "+" : "-"}
                                  {formatCurrencyAbbreviated(
                                    transaction.amount
                                  )}
                                </p>
                                {currency === "USD" && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formatCVT(transaction.amount)}
                                  </p>
                                )}
                                {transaction.txHash && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                                    {transaction.txHash.slice(0, 8)}...
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Stats and Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Stats Card */}
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardHeader>
                  <CardTitle
                    className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                  >
                    <ChartPieIcon
                      className={`h-5 w-5 ${colors.icons.primary}`}
                    />
                    Wallet Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Income
                      </span>
                      <span
                        className={`text-sm font-medium text-green-600 dark:text-green-400`}
                      >
                        {formatCurrencyAbbreviated(totalIncome)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Expenses
                      </span>
                      <span
                        className={`text-sm font-medium ${colors.texts.primary}`}
                      >
                        {formatCurrencyAbbreviated(totalExpenses)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Pending
                      </span>
                      <span
                        className={`text-sm font-medium ${colors.texts.primary}`}
                      >
                        {pendingTransactions}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Transactions
                      </span>
                      <span
                        className={`text-sm font-medium ${colors.texts.primary}`}
                      >
                        {transactions.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exchange Rate Card */}
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardHeader>
                  <CardTitle
                    className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                  >
                    <CurrencyDollarIcon
                      className={`h-5 w-5 ${colors.icons.primary}`}
                    />
                    Exchange Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-2">
                    <p
                      className={`text-2xl font-extralight ${colors.texts.primary}`}
                    >
                      $1
                    </p>
                    <span className="text-gray-400">=</span>
                    <p
                      className={`text-2xl font-extralight ${colors.texts.primary}`}
                    >
                      CVT {CONVERSION_RATE.toLocaleString("en-US")}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rate updates automatically
                  </p>
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Card
                className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p
                        className={`text-xs font-medium ${colors.texts.primary} mb-1`}
                      >
                        Blockchain Secured
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        All transactions are secured and verified on the
                        Hyperledger Fabric blockchain
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Add Funds Modal with Tabs */}
      <Dialog
        open={addFundsOpen}
        onOpenChange={(open) => {
          setAddFundsOpen(open);
          if (open) {
            // Auto-switch to USD when opening modal
            setCurrency("USD");
          }
          if (!open) {
            setActiveAddTab("amount");
            setAddAmount("");
            setPaymentMethod("");
            setCardNumber("");
            setExpiryDate("");
            setCvv("");
            setCardholderName("");
          }
        }}
      >
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          {/* Header */}
          <div className="p-6">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-3 text-xl font-bold ${colors.texts.primary}`}
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-none">
                  <PlusIcon className="h-5 w-" />
                </div>
                Add Funds to Wallet
              </DialogTitle>
              <DialogDescription
                className={`text-base ${colors.texts.secondary} mt-2`}
              >
                Securely add funds to your ChainVanguard wallet using Stripe
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeAddTab}
            onValueChange={setActiveAddTab}
            className="w-full"
          >
            <div className="flex justify-center px-6">
              <div className="w-full flex justify-center">
                <TabsList
                  className={`flex w-full max-w-2xl ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto`}
                >
                  <TabsTrigger
                    value="amount"
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                    ${
                      activeAddTab === "amount"
                        ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                        : `${colors.texts.secondary} hover:${colors.texts.primary}`
                    }`}
                  >
                    Amount
                  </TabsTrigger>
                  <TabsTrigger
                    value="payment"
                    disabled={!addAmount || parseFloat(addAmount) <= 0}
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                    ${
                      activeAddTab === "payment"
                        ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                        : `${colors.texts.secondary} hover:${colors.texts.primary}`
                    }`}
                  >
                    Payment
                  </TabsTrigger>
                  <TabsTrigger
                    value="review"
                    disabled={
                      !addAmount ||
                      parseFloat(addAmount) <= 0 ||
                      cardNumber.replace(/\s/g, "").length !== 16 ||
                      expiryDate.length !== 5 ||
                      !validateExpiryDate(expiryDate) ||
                      cvv.length !== 3 ||
                      cardholderName.trim().length < 3
                    }
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                    ${
                      activeAddTab === "review"
                        ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                        : `${colors.texts.secondary} hover:${colors.texts.primary}`
                    }`}
                  >
                    Review
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Amount Tab */}
              <TabsContent value="amount" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label
                        className={`text-xs font-medium ${colors.texts.primary}`}
                      >
                        Select Amount (USD)
                      </Label>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>Payments in USD only</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {/* Only show USD amounts in modal */}
                      {[50, 100, 200, 500].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setAddAmount(amount.toString())}
                          className={`h-9 flex items-center justify-center cursor-pointer ${
                            addAmount === amount.toString()
                              ? "bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white"
                              : `${colors.backgrounds.tertiary} border ${colors.borders.primary} ${colors.texts.primary} hover:border-black dark:hover:border-white`
                          } transition-all rounded-none text-xs font-medium`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-3">
                    <Label
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Or Enter Custom Amount
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={addAmount}
                        onChange={(e) => setAddAmount(e.target.value)}
                        className={`text-sm font-medium ${colors.inputs.base} h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                      />
                    </div>
                    {addAmount && parseFloat(addAmount) > 0 && (
                      <div
                        className={`flex items-center gap-2 text-xs ${colors.texts.secondary}`}
                      >
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        <span>
                          ≈ {formatCVT(parseFloat(addAmount) * CONVERSION_RATE)}{" "}
                          • Rate: $1 = CVT {CONVERSION_RATE.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {addAmount && parseFloat(addAmount) <= 0 && (
                      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        <span>Please enter an amount greater than 0</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (addAmount && parseFloat(addAmount) > 0) {
                        setActiveAddTab("payment");
                        setPaymentMethod("Card"); // Auto-select Card payment
                      }
                    }}
                    disabled={!addAmount || parseFloat(addAmount) <= 0}
                    className={`px-8 h-9 ${colors.buttons.primary} rounded-none flex items-center gap-2 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer`}
                  >
                    Continue to Payment
                  </Button>
                </div>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCardIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      <div>
                        <p
                          className={`text-sm font-semibold ${colors.texts.primary}`}
                        >
                          Credit / Debit Card
                        </p>
                        <p className={`text-xs ${colors.texts.secondary}`}>
                          Powered by Stripe • Instant processing
                        </p>
                      </div>
                    </div>

                    {/* Card Details Form */}
                    <div className="space-y-3">
                      {/* Card Number */}
                      <div>
                        <Label className={`text-xs ${colors.texts.secondary}`}>
                          Card Number *
                        </Label>
                        <div className="relative mt-1">
                          <CreditCardIcon
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                          />
                          <Input
                            type="text"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            className={`${colors.inputs.base} pl-10 h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                          />
                        </div>
                        {/* Reserved error space */}
                        <div className="h-4 mt-1">
                          {getCardNumberError() && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              <ExclamationCircleIcon className="h-3 w-3" />
                              {getCardNumberError()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Expiry and CVV */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label
                            className={`text-xs ${colors.texts.secondary}`}
                          >
                            Expiry Date *
                          </Label>
                          <div className="relative mt-1">
                            <ClockIcon
                              className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                            />
                            <Input
                              type="text"
                              placeholder="MM/YY"
                              value={expiryDate}
                              onChange={handleExpiryDateChange}
                              className={`${colors.inputs.base} pl-10 h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                            />
                          </div>
                          {/* Reserved error space */}
                          <div className="h-4 mt-1">
                            {getExpiryDateError() && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                <ExclamationCircleIcon className="h-3 w-3" />
                                {getExpiryDateError()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <Label
                            className={`text-xs ${colors.texts.secondary}`}
                          >
                            CVV *
                          </Label>
                          <div className="relative mt-1">
                            <ShieldCheckIcon
                              className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                            />
                            <Input
                              type="text"
                              placeholder="123"
                              value={cvv}
                              onChange={handleCvvChange}
                              className={`${colors.inputs.base} pl-10 h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                            />
                          </div>
                          {/* Reserved error space */}
                          <div className="h-4 mt-1">
                            {getCvvError() && (
                              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                <ExclamationCircleIcon className="h-3 w-3" />
                                {getCvvError()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cardholder Name */}
                      <div>
                        <Label className={`text-xs ${colors.texts.secondary}`}>
                          Cardholder Name *
                        </Label>
                        <div className="relative mt-1">
                          <UsersIcon
                            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                          />
                          <Input
                            type="text"
                            placeholder="John Doe"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            className={`${colors.inputs.base} pl-10 h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                          />
                        </div>
                        {/* Reserved error space */}
                        <div className="h-4 mt-1">
                          {getCardholderNameError() && (
                            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              <ExclamationCircleIcon className="h-3 w-3" />
                              {getCardholderNameError()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Stripe Badge */}
                      <div
                        className={`flex items-center gap-2 pt-3 border-t ${colors.borders.primary}`}
                      >
                        <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Secured by Stripe • Your payment information is
                          encrypted
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveAddTab("amount")}
                    className={`px-6 h-9 ${colors.buttons.outline} rounded-none text-xs font-medium transition-all hover:border-black dark:hover:border-white cursor-pointer`}
                  >
                    <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const cardDigits = cardNumber.replace(/\s/g, "");
                      const isValid =
                        cardDigits.length === 16 &&
                        expiryDate.length === 5 &&
                        validateExpiryDate(expiryDate) &&
                        cvv.length === 3 &&
                        cardholderName.trim().length >= 3;

                      if (isValid) {
                        setActiveAddTab("review");
                      } else {
                        toast.error(
                          "Please fill in all payment details correctly"
                        );
                      }
                    }}
                    disabled={
                      cardNumber.replace(/\s/g, "").length !== 16 ||
                      expiryDate.length !== 5 ||
                      !validateExpiryDate(expiryDate) ||
                      cvv.length !== 3 ||
                      cardholderName.trim().length < 3
                    }
                    className={`px-8 h-9 ${colors.buttons.primary} rounded-none flex items-center gap-2 text-xs font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Review Payment
                  </Button>
                </div>
              </TabsContent>

              {/* Review Tab */}
              <TabsContent value="review" className="mt-0 space-y-6">
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none !shadow-none hover:!shadow-none`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p
                        className={`text-base font-semibold ${colors.texts.primary}`}
                      >
                        Payment Summary
                      </p>
                      <Badge
                        className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                      >
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Ready to Process
                      </Badge>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex justify-between text-sm">
                        <span className={colors.texts.secondary}>Amount:</span>
                        <span
                          className={`font-semibold ${colors.texts.primary}`}
                        >
                          {formatCurrency(
                            currency === "USD"
                              ? parseFloat(addAmount) * CONVERSION_RATE
                              : parseFloat(addAmount)
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={colors.texts.secondary}>
                          Processing Fee:
                        </span>
                        <span
                          className={`font-semibold ${colors.texts.primary}`}
                        >
                          $0.00
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={colors.texts.secondary}>
                          Payment Method:
                        </span>
                        <span
                          className={`font-semibold ${colors.texts.primary} flex items-center gap-2`}
                        >
                          <CreditCardIcon className="h-4 w-4" />
                          Credit/Debit Card
                        </span>
                      </div>
                      <div
                        className={`pt-3 border-t border-gray-200 dark:border-gray-800`}
                      >
                        <div className="flex justify-between">
                          <span
                            className={`text-base font-semibold ${colors.texts.primary}`}
                          >
                            Total:
                          </span>
                          <span
                            className={`text-lg font-bold ${colors.texts.primary}`}
                          >
                            {formatCurrency(
                              currency === "USD"
                                ? parseFloat(addAmount) * CONVERSION_RATE
                                : parseFloat(addAmount)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-start gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800`}
                    >
                      <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p
                          className={`text-xs font-semibold ${colors.texts.primary} mb-1`}
                        >
                          Secure Payment
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Your payment is processed securely through Stripe.
                          Funds will be added to your wallet instantly upon
                          successful payment.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveAddTab("payment")}
                    disabled={isLoading}
                    className={`px-6 h-9 ${colors.buttons.outline} rounded-none text-xs font-medium disabled:opacity-50 transition-all hover:border-black dark:hover:border-white cursor-pointer`}
                  >
                    <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddFunds}
                    disabled={isLoading}
                    className={`px-8 h-9 ${colors.buttons.primary} rounded-none flex items-center gap-2 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer`}
                  >
                    {isLoading && (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Processing Payment..." : "Confirm & Pay"}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div
            className={`p-6 border-t ${colors.borders.primary} flex items-center justify-between`}
          >
            <div className={`text-xs ${colors.texts.secondary}`}>
              <p>Need help? Contact support@chainvanguard.com</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAddFundsOpen(false);
                setActiveAddTab("amount");
                setAddAmount("");
                setPaymentMethod("");
                setCardNumber("");
                setExpiryDate("");
                setCvv("");
                setCardholderName("");
              }}
              disabled={isLoading}
              className={`px-6 h-9 ${colors.buttons.outline} rounded-none text-xs font-medium disabled:opacity-50 transition-all hover:border-black dark:hover:border-white cursor-pointer`}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdraw Funds Modal */}
      <Dialog
        open={withdrawOpen}
        onOpenChange={(open) => {
          setWithdrawOpen(open);
          if (!open) {
            setActiveWithdrawTab("amount");
            setWithdrawAmount("");
          }
        }}
      >
        <DialogContent
          style={{ width: "100%", maxWidth: "600px" }}
          className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          {/* Header */}
          <div className="p-6">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-3 text-xl font-bold ${colors.texts.primary}`}
              >
                <div className="h-8 w-8 flex items-center justify-center rounded-none">
                  <ArrowDownLeftIcon className="h-5 w-5 transform rotate-180" />
                </div>
                Withdraw Funds
              </DialogTitle>
              <DialogDescription
                className={`text-base ${colors.texts.secondary} mt-2`}
              >
                Withdraw funds from your ChainVanguard wallet
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeWithdrawTab}
            onValueChange={setActiveWithdrawTab}
            className="w-full"
          >
            <div className="flex justify-center px-6">
              <div className="w-full flex justify-center">
                <TabsList
                  className={`flex w-full max-w-2xl ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto`}
                >
                  <TabsTrigger
                    value="amount"
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                    ${
                      activeWithdrawTab === "amount"
                        ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                        : `${colors.texts.secondary} hover:${colors.texts.primary}`
                    }`}
                  >
                    Amount
                  </TabsTrigger>
                  <TabsTrigger
                    value="review"
                    disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                    ${
                      activeWithdrawTab === "review"
                        ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                        : `${colors.texts.secondary} hover:${colors.texts.primary}`
                    }`}
                  >
                    Review
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Amount Tab */}
              <TabsContent value="amount" className="mt-0 space-y-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label
                        className={`text-xs font-medium ${colors.texts.primary}`}
                      >
                        Select Amount (USD)
                      </Label>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <CurrencyDollarIcon className="h-4 w-4" />
                        <span>Withdrawals in USD only</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {[50, 100, 200, 500].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setWithdrawAmount(amount.toString())}
                          disabled={amount * CONVERSION_RATE > balance}
                          className={`h-9 flex items-center justify-center cursor-pointer ${
                            withdrawAmount === amount.toString()
                              ? "bg-black dark:bg-white text-white dark:text-black border border-black dark:border-white"
                              : `${colors.backgrounds.tertiary} border ${colors.borders.primary} ${colors.texts.primary} hover:border-black dark:hover:border-white`
                          } transition-all rounded-none text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          ${amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-3">
                    <Label
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Or Enter Custom Amount
                    </Label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className={`text-sm font-medium ${colors.inputs.base} h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                      />
                    </div>
                    {withdrawAmount && parseFloat(withdrawAmount) > 0 && (
                      <div
                        className={`flex items-center gap-2 text-xs ${colors.texts.secondary}`}
                      >
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                        <span>
                          ≈ {formatCVT(parseFloat(withdrawAmount) * CONVERSION_RATE)}{" "}
                          will be burned • Available: {formatCVT(balance)}
                        </span>
                      </div>
                    )}
                    {withdrawAmount &&
                      parseFloat(withdrawAmount) * CONVERSION_RATE > balance && (
                        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                          <ExclamationCircleIcon className="h-4 w-4" />
                          <span>Insufficient balance</span>
                        </div>
                      )}
                    {withdrawAmount && parseFloat(withdrawAmount) <= 0 && (
                      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <ExclamationCircleIcon className="h-4 w-4" />
                        <span>Please enter an amount greater than 0</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    size="sm"
                    onClick={() => {
                      if (
                        withdrawAmount &&
                        parseFloat(withdrawAmount) > 0 &&
                        parseFloat(withdrawAmount) * CONVERSION_RATE <= balance
                      ) {
                        setActiveWithdrawTab("review");
                      }
                    }}
                    disabled={
                      !withdrawAmount ||
                      parseFloat(withdrawAmount) <= 0 ||
                      parseFloat(withdrawAmount) * CONVERSION_RATE > balance
                    }
                    className={`px-8 h-9 ${colors.buttons.primary} rounded-none flex items-center gap-2 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer`}
                  >
                    Continue to Review
                  </Button>
                </div>
              </TabsContent>

              {/* Review Tab */}
              <TabsContent value="review" className="mt-0 space-y-6">
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none !shadow-none hover:!shadow-none`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <p
                        className={`text-base font-semibold ${colors.texts.primary}`}
                      >
                        Withdrawal Summary
                      </p>
                      <Badge
                        className={`${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} text-xs rounded-none`}
                      >
                        <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                        Tokens will be burned
                      </Badge>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                      <div className="flex justify-between text-sm">
                        <span className={colors.texts.secondary}>
                          Withdrawal Amount (USD):
                        </span>
                        <span
                          className={`font-semibold ${colors.texts.primary}`}
                        >
                          ${parseFloat(withdrawAmount).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={colors.texts.secondary}>
                          Tokens to burn:
                        </span>
                        <span
                          className={`font-semibold ${colors.texts.primary}`}
                        >
                          {formatCVT(parseFloat(withdrawAmount) * CONVERSION_RATE)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={colors.texts.secondary}>
                          Processing Fee:
                        </span>
                        <span
                          className={`font-semibold ${colors.texts.primary}`}
                        >
                          $0.00
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={colors.texts.secondary}>
                          New Balance:
                        </span>
                        <span
                          className={`font-semibold ${colors.texts.primary}`}
                        >
                          {formatCVT(
                            balance - parseFloat(withdrawAmount) * CONVERSION_RATE
                          )}
                        </span>
                      </div>
                      <div
                        className={`pt-3 border-t border-gray-200 dark:border-gray-800`}
                      >
                        <div className="flex justify-between">
                          <span
                            className={`text-base font-semibold ${colors.texts.primary}`}
                          >
                            Total:
                          </span>
                          <span
                            className={`text-lg font-bold ${colors.texts.primary}`}
                          >
                            ${parseFloat(withdrawAmount).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-start gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-800`}
                    >
                      <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p
                          className={`text-xs font-semibold ${colors.texts.primary} mb-1`}
                        >
                          Secure Withdrawal
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Tokens will be burned on the blockchain and the
                          equivalent USD amount will be processed to your account.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveWithdrawTab("amount")}
                    disabled={isLoading}
                    className={`px-6 h-9 ${colors.buttons.outline} rounded-none text-xs font-medium disabled:opacity-50 transition-all hover:border-black dark:hover:border-white cursor-pointer`}
                  >
                    <ArrowLeftIcon className="h-4 w-4 inline mr-2" />
                    Back
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleWithdraw}
                    disabled={isLoading}
                    className={`px-8 h-9 ${colors.buttons.primary} rounded-none flex items-center gap-2 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer`}
                  >
                    {isLoading && (
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Processing..." : "Confirm Withdrawal"}
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Footer */}
          <div
            className={`p-6 border-t ${colors.borders.primary} flex items-center justify-between`}
          >
            <div className={`text-xs ${colors.texts.secondary}`}>
              <p>Need help? Contact support@chainvanguard.com</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setWithdrawOpen(false);
                setActiveWithdrawTab("amount");
                setWithdrawAmount("");
              }}
              disabled={isLoading}
              className={`px-6 h-9 ${colors.buttons.outline} rounded-none text-xs font-medium disabled:opacity-50 transition-all hover:border-black dark:hover:border-white cursor-pointer`}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
