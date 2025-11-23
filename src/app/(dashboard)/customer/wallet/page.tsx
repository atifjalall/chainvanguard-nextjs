"use client";

import React, { useState, useEffect } from "react";
import {
  WalletIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
  PlusIcon,
  ArrowPathIcon,
  UserIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  UsersIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";
import { createPaymentIntent, confirmPayment } from "@/lib/api/wallet.api";
import { toast } from "sonner";
import { useWallet } from "@/components/providers/wallet-provider";
import { useAuth } from "@/components/providers/auth-provider";
import {
  formatCurrency,
  formatCurrencyAbbreviated,
  formatUSD,
  formatCVT,
} from "@/utils/currency";

// CVT Icon Component
const RsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="h-5 w-5"
  >
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="8"
      fontWeight="600"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.2"
      fontFamily="Arial, sans-serif"
    >
      CVT
    </text>
    <path
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

type Currency = "USD" | "CVT";

// Payment Modal Component
interface PaymentModalProps {
  isOpen: boolean;
  addAmount: string;
  onClose: () => void;
  onSubmit: (
    amount: string,
    cardDetails: {
      cardNumber: string;
      expiryDate: string;
      cvv: string;
      cardholderName: string;
    }
  ) => void;
  isLoading: boolean;
}

function PaymentModal({
  isOpen,
  addAmount,
  onClose,
  onSubmit,
  isLoading,
}: PaymentModalProps) {
  const CONVERSION_RATE = 278;
  const [activeTab, setActiveTab] = useState<"card" | "review">("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab("card");
      setCardNumber("");
      setExpiryDate("");
      setCvv("");
      setCardholderName("");
    }
  }, [isOpen]);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 16);
    const formatted = limited.match(/.{1,4}/g)?.join(" ") || limited;
    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    let limited = cleaned.slice(0, 4);

    if (limited.length >= 2) {
      const month = parseInt(limited.slice(0, 2), 10);
      if (month > 12) {
        limited = limited.slice(0, 1);
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

    if (monthNum < 1 || monthNum > 12) return false;

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;

    if (yearNum < currentYear) return false;
    if (yearNum === currentYear && monthNum < currentMonth) return false;

    return true;
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    const limited = cleaned.slice(0, 3);
    setCvv(limited);
  };

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

  const isCardValid =
    cardNumber.replace(/\s/g, "").length === 16 &&
    expiryDate.length === 5 &&
    validateExpiryDate(expiryDate) &&
    cvv.length === 3 &&
    cardholderName.trim().length >= 3;

  const resetForm = () => {
    setActiveTab("card");
    setCardNumber("");
    setExpiryDate("");
    setCvv("");
    setCardholderName("");
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/10 z-[10000]"
        onClick={handleClose}
      />
      <div className="fixed inset-0 flex items-center justify-center z-[10001] p-4 overflow-hidden">
        <div className="bg-white w-full max-w-3xl flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="border-b border-gray-100 p-6">
            <h3 className="text-xl font-light text-gray-900 tracking-tight mb-1">
              Add Funds to Wallet
            </h3>
            <p className="text-xs text-gray-500">
              Securely add funds to your wallet using Stripe
            </p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => setActiveTab("card")}
              className={`flex-1 py-3 px-6 text-xs uppercase tracking-[0.2em] font-medium transition-colors ${
                activeTab === "card"
                  ? "text-gray-900 border-b-2 border-black"
                  : "text-gray-400 hover:text-gray-900"
              }`}
            >
              Card Information
            </button>
            <button
              onClick={() => setActiveTab("review")}
              disabled={!isCardValid}
              className={`flex-1 py-3 px-6 text-xs uppercase tracking-[0.2em] font-medium transition-colors ${
                activeTab === "review"
                  ? "text-gray-900 border-b-2 border-black"
                  : "text-gray-400 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              Review
            </button>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="overflow-y-auto flex-1 p-6">
            {/* Card Information Tab */}
            {activeTab === "card" && (
              <div className="space-y-5">
                <div className="flex items-center gap-3 pb-5 border-b border-gray-100">
                  <CreditCardIcon className="h-5 w-5 text-gray-900" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Credit / Debit Card
                    </p>
                    <p className="text-xs text-gray-400">
                      Powered by Stripe • Instant processing
                    </p>
                  </div>
                </div>

                {/* Card Number */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 font-medium block mb-2">
                    Card Number *
                  </label>
                  <div className="border-b border-gray-300 pb-px">
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full h-10 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                    />
                  </div>
                  <div className="h-4 mt-1">
                    {getCardNumberError() && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        {getCardNumberError()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expiry and CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 font-medium block mb-2">
                      Expiry Date *
                    </label>
                    <div className="border-b border-gray-300 pb-px">
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        className="w-full h-10 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                      />
                    </div>
                    <div className="h-4 mt-1">
                      {getExpiryDateError() && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-3 w-3" />
                          {getExpiryDateError()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 font-medium block mb-2">
                      CVV *
                    </label>
                    <div className="border-b border-gray-300 pb-px">
                      <input
                        type="text"
                        placeholder="123"
                        value={cvv}
                        onChange={handleCvvChange}
                        className="w-full h-10 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                      />
                    </div>
                    <div className="h-4 mt-1">
                      {getCvvError() && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <ExclamationCircleIcon className="h-3 w-3" />
                          {getCvvError()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 font-medium block mb-2">
                    Cardholder Name *
                  </label>
                  <div className="border-b border-gray-300 pb-px">
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      className="w-full h-10 bg-transparent text-sm text-gray-900 placeholder-gray-300 focus:outline-none"
                    />
                  </div>
                  <div className="h-4 mt-1">
                    {getCardholderNameError() && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        {getCardholderNameError()}
                      </p>
                    )}
                  </div>
                </div>

                {/* Stripe Badge */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 mt-5">
                  <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-gray-500">
                    Secured by Stripe • Your payment information is encrypted
                  </p>
                </div>
              </div>
            )}

            {/* Review Tab */}
            {activeTab === "review" && (
              <div className="space-y-4">
                <div className="border border-gray-100 p-5 bg-gray-50">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 uppercase tracking-[0.2em]">
                      Payment Summary
                    </p>
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      Ready
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Amount (USD):</span>
                      <span className="font-medium text-gray-900">
                        ${parseFloat(addAmount).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">You will receive:</span>
                      <span className="font-medium text-gray-900">
                        {formatCVT(parseFloat(addAmount) * CONVERSION_RATE)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Exchange Rate:</span>
                      <span className="font-medium text-gray-900">
                        $1 = CVT {CONVERSION_RATE.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Processing Fee:</span>
                      <span className="font-medium text-gray-900">$0.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Payment Method:</span>
                      <span className="font-medium text-gray-900 flex items-center gap-2">
                        <CreditCardIcon className="h-4 w-4" />
                        •••• {cardNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-100 mt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-medium text-gray-900 uppercase tracking-[0.1em]">
                          Total:
                        </span>
                        <span className="text-lg font-semibold text-gray-900">
                          ${parseFloat(addAmount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded">
                  <ShieldCheckIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-gray-900 mb-1">
                      Secure Payment
                    </p>
                    <p className="text-xs text-gray-600">
                      Your payment is processed securely through Stripe. Funds
                      will be added instantly.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-6 flex justify-between items-center bg-gray-50">
            <p className="text-xs text-gray-400">
              Need help? support@chainvanguard.com
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="border border-gray-300 text-gray-900 px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              {activeTab === "card" ? (
                <button
                  onClick={() => setActiveTab("review")}
                  disabled={!isCardValid}
                  className="bg-black text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Review
                </button>
              ) : (
                <button
                  onClick={() =>
                    onSubmit(addAmount, {
                      cardNumber,
                      expiryDate,
                      cvv,
                      cardholderName,
                    })
                  }
                  disabled={isLoading}
                  className="bg-black text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    "Confirm & Pay"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Main Wallet Component
export default function CustomerWalletPage() {
  const CONVERSION_RATE = 278;

  const [currency, setCurrency] = useState<Currency>("CVT");
  const [showQRCode, setShowQRCode] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Use real wallet data from provider
  const { user } = useAuth();
  const {
    currentWallet: walletData,
    balance: walletBalance,
    transactions: walletTransactions,
    refreshBalance,
    refreshTransactions,
  } = useWallet();

  const balance = walletBalance || 0;
  const currentWallet = {
    name: walletData?.name || "My Wallet",
    address:
      walletData?.address || "0x1234567890abcdef1234567890abcdef12345678",
  };

  // Map wallet transactions to component format
  const transactions = (walletTransactions || []).map((tx) => ({
    _id: tx.id,
    description: tx.description,
    amount: tx.amount,
    type: tx.type,
    status: tx.status,
    timestamp: tx.timestamp,
    txHash: tx.txHash,
    metadata: { blockchainTxId: tx.txHash },
  }));

  const convertAmount = (amountInCVT: number): number => {
    return currency === "USD" ? amountInCVT / CONVERSION_RATE : amountInCVT;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // Refresh wallet data on mount (empty deps to avoid infinite loop)
  useEffect(() => {
    if (refreshBalance) refreshBalance();
    if (refreshTransactions) refreshTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (
    amount: string,
    cardDetails: {
      cardNumber: string;
      expiryDate: string;
      cvv: string;
      cardholderName: string;
    }
  ) => {
    setIsAddingFunds(true);

    try {
      // Validate card details (basic validation)
      const cleanCardNumber = cardDetails.cardNumber.replace(/\s/g, "");
      if (cleanCardNumber.length !== 16) {
        throw new Error("Invalid card number");
      }

      // Step 1: Create payment intent
      const paymentIntentResponse = await createPaymentIntent(
        parseFloat(amount)
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
      const confirmResponse = await confirmPayment(
        paymentIntentId,
        parseFloat(amount)
      );

      if (!confirmResponse.success) {
        throw new Error("Failed to add funds to wallet");
      }

      // Success!
      toast.success(
        `Successfully added $${amount} (${formatCVT(parseFloat(amount) * CONVERSION_RATE)} CVT) to your wallet!`
      );

      setIsPaymentModalOpen(false);
      setAddFundsAmount("");

      // Refresh wallet data
      if (refreshBalance) await refreshBalance();
      if (refreshTransactions) await refreshTransactions();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("❌ Payment failed:", error);
      toast.error(`Payment failed: ${errorMessage}`);
    } finally {
      setIsAddingFunds(false);
    }
  };

  const totalSpent = transactions
    .filter((t) => ["withdrawal", "payment", "transfer_out"].includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAdded = transactions
    .filter((t) =>
      ["deposit", "transfer_in", "refund", "sale"].includes(t.type)
    )
    .reduce((sum, t) => sum + t.amount, 0);

  // Backdrop overlay state for white balance effect
  const [showBackdrop, setShowBackdrop] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* White Balance Backdrop when payment modal is open */}
      {isPaymentModalOpen && (
        <div
          className="fixed inset-0 bg-white/85 dark:bg-black/85 z-[9999]"
          onClick={() => {
            if (!isAddingFunds) {
              setIsPaymentModalOpen(false);
            }
          }}
          style={{ top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      {/* Breadcrumb */}
      <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
        <div className="flex items-center gap-2">
          <button className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Home
          </button>
          <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
            Wallet
          </span>
        </div>
      </div>

      {/* Header */}
      <section
        className={`py-16 border-b border-gray-200 dark:border-gray-800 transition-all duration-300 ${isPaymentModalOpen ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex items-end justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 mb-3">
                  Blockchain Wallet
                </p>
              </div>
              <div className="space-y-3">
                <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                  My Wallet
                </h1>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {user?.name || "User"}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-gray-200 dark:bg-gray-800" />
                  <div className="flex items-center gap-2">
                    <WalletIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {currentWallet?.name || "My Wallet"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">
                Currency
              </span>
              <div className="flex border border-gray-200 dark:border-gray-800">
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-6 h-10 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center gap-2 ${
                    currency === "USD"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrency("CVT")}
                  className={`px-6 h-10 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 ${
                    currency === "CVT"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  CVT
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wallet Content */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Balance Card */}
              <div className="border border-gray-200 dark:border-gray-800 p-12">
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Available Balance
                      </p>
                      <div className="flex items-baseline gap-3">
                        <p className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                          {formatCurrency(balance, currency)}
                        </p>
                        {currency === "USD" && (
                          <span className="text-sm text-gray-400 dark:text-gray-600">
                            ≈ {formatCVT(balance)}
                          </span>
                        )}
                      </div>
                    </div>
                    <WalletIcon className="h-16 w-16 text-gray-900 dark:text-white opacity-20" />
                  </div>

                  <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setShowQRCode(!showQRCode)}
                        className="border border-black dark:border-white text-black dark:text-white px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center justify-center gap-2"
                      >
                        <QrCodeIcon className="h-4 w-4" />
                        QR Code
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(currentWallet?.address || "")
                        }
                        className="bg-black dark:bg-white text-white dark:text-black px-6 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                        Copy Address
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Funds */}
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    Add Funds
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Top up your wallet balance in USD
                  </p>
                </div>

                <form onSubmit={handleAddFunds} className="space-y-8">
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-4">
                    {[50, 100, 200, 500].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setAddFundsAmount(amount.toString());
                        }}
                        className={`border px-4 h-12 text-sm font-medium transition-colors ${
                          addFundsAmount === amount.toString()
                            ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black"
                            : "border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Custom Amount (USD)
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 dark:text-white">
                          $
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={addFundsAmount}
                          onChange={(e) => setAddFundsAmount(e.target.value)}
                          className="flex-1 h-12 px-2 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    {addFundsAmount && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ≈{" "}
                        {formatCVT(
                          parseFloat(addFundsAmount) * CONVERSION_RATE
                        )}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      !addFundsAmount || parseFloat(addFundsAmount) <= 0
                    }
                    className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add Funds
                  </button>
                </form>
              </div>

              {/* Transaction History */}
              <div className="pt-12 border-t border-gray-200 dark:border-gray-800">
                <div className="mb-8">
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    Transaction History
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recent wallet activity
                  </p>
                </div>

                {transactions.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No transactions yet
                  </div>
                ) : (
                  <div className="space-y-0 border border-gray-200 dark:border-gray-800">
                    {transactions.map((transaction, index) => {
                      const isCredit = [
                        "deposit",
                        "transfer_in",
                        "refund",
                        "sale",
                      ].includes(transaction.type);
                      return (
                        <div
                          key={transaction._id}
                          className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
                            index !== transactions.length - 1
                              ? "border-b border-gray-200 dark:border-gray-800"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedTransaction(transaction._id)
                          }
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
                                {isCredit ? (
                                  <ArrowDownIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <ArrowUpIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                  {transaction.description}
                                </p>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(
                                      transaction.timestamp
                                    ).toLocaleDateString()}
                                  </p>
                                  {transaction.status === "pending" && (
                                    <>
                                      <span className="text-gray-400">•</span>
                                      <span className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                        <ClockIcon className="h-3 w-3" />
                                        Pending
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <p
                                className={`text-sm font-medium ${
                                  isCredit
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-gray-900 dark:text-white"
                                }`}
                              >
                                {isCredit ? "+" : "-"}
                                {formatCurrencyAbbreviated(
                                  transaction.amount,
                                  currency
                                )}
                              </p>
                              {currency === "USD" && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatCVT(transaction.amount)}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                                {transaction.metadata?.blockchainTxId
                                  ? `${transaction.metadata.blockchainTxId.slice(0, 8)}...`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Conversion Rate Info */}
              <div className="border border-gray-200 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-900">
                <div className="space-y-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Exchange Rate
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-extralight text-gray-900 dark:text-white">
                      $1
                    </p>
                    <span className="text-gray-400">=</span>
                    <p className="text-2xl font-extralight text-gray-900 dark:text-white">
                      CVT {CONVERSION_RATE.toLocaleString("en-US")}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rate updates automatically
                  </p>
                </div>
              </div>

              {/* Wallet Details */}
              <div className="border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Wallet Details
                  </p>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Wallet Name
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">
                        {currentWallet?.name || "My Wallet"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Wallet Address
                      </p>
                      <p className="text-xs text-gray-900 dark:text-white font-mono break-all">
                        {currentWallet?.address || "Not connected"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Network
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 animate-pulse" />
                        <p className="text-xs text-gray-900 dark:text-white">
                          Hyperledger Fabric
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Activity Summary
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Spent
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrencyAbbreviated(totalSpent, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Added
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrencyAbbreviated(totalAdded, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Transactions
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {transactions.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="border border-gray-200 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-900">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                        Blockchain Secured
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        All transactions are secured and verified on the
                        Hyperledger Fabric blockchain
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Modal */}
      {showQRCode && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowQRCode(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6">
            <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-12 max-w-md w-full">
              <div className="space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    Wallet QR Code
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Scan to receive funds
                  </p>
                </div>

                <div className="flex justify-center">
                  <div className="h-64 w-64 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <QrCodeIcon className="h-32 w-32 text-gray-400 dark:text-gray-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Wallet Address
                  </p>
                  <p className="text-xs text-gray-900 dark:text-white font-mono text-center break-all">
                    {currentWallet?.address}
                  </p>
                </div>

                <button
                  onClick={() => setShowQRCode(false)}
                  className="w-full bg-black dark:bg-white text-white dark:text-black h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        addAmount={addFundsAmount}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        isLoading={isAddingFunds}
      />
    </div>
  );
}
