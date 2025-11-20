"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
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
} from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import {
  getTransactionHistory,
  addFunds,
  BackendTransaction,
} from "@/lib/api/wallet.api";

// Rs Icon Component
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
      Rs
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

type Currency = "USD" | "PKR";

export default function CustomerWalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWallet, balance } = useWallet(); // balance is in PKR from DB

  // Static conversion rate (will be dynamic later with API)
  const CONVERSION_RATE = 278; // 1 USD = 278 PKR

  const [currency, setCurrency] = useState<Currency>("PKR"); // Default to PKR since DB is in PKR
  const [showQRCode, setShowQRCode] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState("");
  const [isAddingFunds, setIsAddingFunds] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null
  );
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  // Currency conversion helper - amounts from DB are in PKR
  const convertAmount = (amountInPKR: number): number => {
    return currency === "USD" ? amountInPKR / CONVERSION_RATE : amountInPKR;
  };

  // Format USD with proper commas
  const formatUSD = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Format PKR with abbreviations for large amounts
  const formatPKR = (amount: number): string => {
    if (amount >= 1e9) {
      return `Rs ${(amount / 1e9).toFixed(2)} B`;
    } else if (amount >= 1e6) {
      return `Rs ${(amount / 1e6).toFixed(2)} M`;
    } else {
      return `Rs ${amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  // Format currency display based on selected currency - amount comes in PKR from DB
  const formatCurrency = (amountInPKR: number): string => {
    if (currency === "USD") {
      const usdAmount = amountInPKR / CONVERSION_RATE;
      return formatUSD(usdAmount);
    } else {
      return formatPKR(amountInPKR);
    }
  };

  // Format currency abbreviated (for PKR)
  const formatCurrencyAbbreviated = (amountInPKR: number) => {
    if (currency === "USD") {
      const usdAmount = amountInPKR / CONVERSION_RATE;
      return formatUSD(usdAmount);
    } else {
      if (amountInPKR >= 1e9) {
        return `Rs ${(amountInPKR / 1e9).toFixed(2)} B`;
      } else if (amountInPKR >= 1e6) {
        return `Rs ${(amountInPKR / 1e6).toFixed(2)} M`;
      } else {
        return formatPKR(amountInPKR);
      }
    }
  };

  // Get currency symbol
  const getCurrencySymbol = () => {
    return currency === "PKR" ? "Rs" : "$";
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addFundsAmount || parseFloat(addFundsAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setIsAddingFunds(true);
    try {
      // Convert to PKR if in USD before sending to API (API expects PKR)
      const amountInPKR =
        currency === "USD"
          ? parseFloat(addFundsAmount) * CONVERSION_RATE
          : parseFloat(addFundsAmount);

      const response = await addFunds({
        amount: amountInPKR,
        paymentMethod: "card",
      });
      if (response.success) {
        toast.success(`Added ${formatCurrency(amountInPKR)} to your wallet`);
        setAddFundsAmount("");
      } else {
        toast.error(response.message || "Failed to add funds");
      }
    } catch (error) {
      toast.error("Failed to add funds");
    } finally {
      setIsAddingFunds(false);
    }
  };

  // Fetch transactions on mount
  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getTransactionHistory(1, 20);
        if (response.success) {
          setTransactions(response.data?.transactions || []);
        } else {
          setTransactionError("Failed to load transactions");
        }
      } catch (error) {
        setTransactionError("Error fetching transactions");
      } finally {
        setIsLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, []);

  // Calculate dynamic stats - amounts from DB are in PKR
  const totalSpent = transactions
    ? transactions
        .filter((t) =>
          ["withdrawal", "payment", "transfer_out"].includes(t.type)
        )
        .reduce((sum, t) => sum + t.amount, 0)
    : 0;
  const totalAdded = transactions
    ? transactions
        .filter((t) => ["deposit", "transfer_in"].includes(t.type))
        .reduce((sum, t) => sum + t.amount, 0)
    : 0;

  // Quick amounts based on currency
  const quickAmounts =
    currency === "PKR" ? [5000, 10000, 25000, 50000] : [50, 100, 200, 500];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16 py-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/customer")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              Wallet
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
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
                {/* User and Wallet Info */}
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
                  <span>$</span>
                  USD
                </button>
                <button
                  onClick={() => setCurrency("PKR")}
                  className={`px-6 h-10 text-[10px] uppercase tracking-[0.2em] font-medium transition-colors flex items-center gap-2 border-l border-gray-200 dark:border-gray-800 ${
                    currency === "PKR"
                      ? "bg-black dark:bg-white text-white dark:text-black"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <RsIcon />
                  PKR
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
                          {formatCurrency(balance)}
                        </p>
                        {currency === "USD" && (
                          <span className="text-sm text-gray-400 dark:text-gray-600">
                            ≈ {formatPKR(balance)}
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
                    Top up your wallet balance in {currency}
                  </p>
                </div>

                <form onSubmit={handleAddFunds} className="space-y-8">
                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-4 gap-4">
                    {quickAmounts.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setAddFundsAmount(amount.toString())}
                        className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-4 h-12 text-sm font-medium hover:border-black dark:hover:border-white transition-colors"
                      >
                        {currency === "PKR"
                          ? `Rs ${amount.toLocaleString("en-US")}`
                          : `$${amount}`}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-3">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white font-medium">
                      Custom Amount ({currency})
                    </label>
                    <div className="border-b border-gray-900 dark:border-white pb-px">
                      <div className="flex items-center">
                        {currency === "PKR" ? (
                          <RsIcon />
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-white">
                            $
                          </span>
                        )}
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
                    {currency === "USD" && addFundsAmount && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        ≈{" "}
                        {formatPKR(
                          parseFloat(addFundsAmount) * CONVERSION_RATE
                        )}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingFunds}
                    className="bg-black dark:bg-white text-white dark:text-black px-12 h-12 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAddingFunds ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-4 w-4" />
                        Add Funds
                      </>
                    )}
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

                {isLoadingTransactions ? (
                  <div className="p-6 text-center text-gray-500">
                    Loading transactions...
                  </div>
                ) : transactionError ? (
                  <div className="p-6 text-center text-red-500">
                    {transactionError}
                  </div>
                ) : (
                  <div className="space-y-0 border border-gray-200 dark:border-gray-800">
                    {transactions.map((transaction, index) => {
                      const isCredit = ["deposit", "transfer_in"].includes(
                        transaction.type
                      );
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
                                {formatCurrencyAbbreviated(transaction.amount)}
                              </p>
                              {currency === "USD" && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {formatPKR(transaction.amount)}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1">
                                {transaction.metadata?.txHash
                                  ? `${transaction.metadata.txHash.slice(0, 8)}...`
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
                      Rs {CONVERSION_RATE.toLocaleString("en-US")}
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
                        {formatCurrencyAbbreviated(totalSpent)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Total Added
                      </span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatCurrencyAbbreviated(totalAdded)}
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
    </div>
  );
}
