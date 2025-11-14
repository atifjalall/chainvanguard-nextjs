/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Badge } from "@/components/_ui/badge";
import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";
import { Separator } from "@/components/_ui/separator";
import { Avatar, AvatarFallback } from "@/components/_ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/_ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import {
  WalletIcon,
  PlusIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CreditCardIcon,
  BuildingLibraryIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BoltIcon,
  ChartPieIcon,
  SparklesIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  PaperAirplaneIcon,
  ReceiptPercentIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";
import * as walletApi from "@/lib/api/wallet.api";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "payment" | "received";
  amount: number;
  description: string;
  timestamp: string;
  status: "completed" | "pending" | "failed";
  txHash?: string;
  category?: string;
  counterparty?: string;
}

export default function WalletPage() {
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
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendAddress, setSendAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  // ✅ BACKEND: Add Funds
  const handleAddFunds = async () => {
    if (!addAmount || parseFloat(addAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsLoading(true);

    try {
      await walletApi.addFunds({
        amount: parseFloat(addAmount),
        paymentMethod,
        metadata: {
          cardLast4: "4242",
          cardType: paymentMethod,
        },
      });

      toast.success(`Successfully added $${addAmount} to your wallet`);

      if (refreshBalance) await refreshBalance();
      if (refreshTransactions) await refreshTransactions();

      setAddAmount("");
      setPaymentMethod("");
      setAddFundsOpen(false);
    } catch (error: any) {
      console.error("Add funds error:", error);
      toast.error(error.message || "Failed to add funds");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ BACKEND: Withdraw Funds
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(withdrawAmount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!bankAccount) {
      toast.error("Please enter bank account details");
      return;
    }

    setIsLoading(true);

    try {
      await walletApi.withdrawFunds({
        amount: parseFloat(withdrawAmount),
        withdrawalMethod: "bank",
        accountDetails: {
          accountNumber: bankAccount,
          accountHolderName: user?.name || "",
        },
      });

      toast.info(
        "Withdrawal initiated, will be processed within 1-3 business days"
      );

      if (refreshBalance) await refreshBalance();
      if (refreshTransactions) await refreshTransactions();

      setWithdrawAmount("");
      setBankAccount("");
      setWithdrawOpen(false);
    } catch (error: any) {
      console.error("Withdraw error:", error);
      toast.error(error.message || "Failed to withdraw funds");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ BACKEND: Send/Transfer Funds
  const handleSend = async () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(sendAmount) > balance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!sendAddress) {
      toast.error("Please enter recipient address or user ID");
      return;
    }

    setIsLoading(true);

    try {
      await walletApi.transferCredits({
        toUserId: sendAddress,
        amount: parseFloat(sendAmount),
        description: `Transfer to ${formatAddress(sendAddress)}`,
      });

      toast.success(`Successfully sent $${sendAmount}`);

      if (refreshBalance) await refreshBalance();
      if (refreshTransactions) await refreshTransactions();

      setSendAmount("");
      setSendAddress("");
      setSendOpen(false);
    } catch (error: any) {
      console.error("Send error:", error);
      toast.error(
        error.message ||
          "Failed to send funds. Please use the recipient's User ID, not wallet address."
      );
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

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeftIcon className="w-5 h-5 text-green-600" />;
      case "received":
        return <ArrowDownLeftIcon className="w-5 h-5 text-blue-600" />;
      case "withdrawal":
        return <ArrowUpRightIcon className="w-5 h-5 text-orange-600" />;
      case "payment":
        return <PaperAirplaneIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          color:
            "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          icon: CheckCircleIcon,
          label: "Completed",
        };
      case "pending":
        return {
          color:
            "bg-yellow-100/80 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
          icon: ClockIcon,
          label: "Pending",
        };
      case "failed":
        return {
          color:
            "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          icon: ExclamationCircleIcon,
          label: "Failed",
        };
      default:
        return {
          color:
            "bg-gray-100/80 text-gray-700 dark:bg-gray-800/30 dark:text-gray-300",
          icon: ClockIcon,
          label: "Unknown",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Funding":
        return <BuildingStorefrontIcon className="w-4 h-4" />;
      case "Shopping":
        return <ReceiptPercentIcon className="w-4 h-4" />;
      case "Services":
        return <StarIcon className="w-4 h-4" />;
      case "Rewards":
        return <SparklesIcon className="w-4 h-4" />;
      case "Transfer":
        return <PaperAirplaneIcon className="w-4 h-4" />;
      case "Withdrawal":
        return <BanknotesIcon className="w-4 h-4" />;
      case "Refund":
        return <ArrowPathIcon className="w-4 h-4" />;
      default:
        return <ChartPieIcon className="w-4 h-4" />;
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
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const pendingTransactions = transactions.filter(
    (tx) => tx.status === "pending"
  ).length;

  if (!currentWallet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
        <Card className="w-full max-w-md text-center border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <CardContent className="pt-8 pb-6">
            <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <WalletIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No Wallet Connected
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect your wallet to view balance and transactions
            </p>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl mx-auto">
              <WalletIcon className="w-4 h-4" />
              Connect Wallet
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statsData = [
    {
      title: "Current Balance",
      value: showBalance ? `$${balance.toFixed(2)}` : "••••••",
      subtitle: "Available funds",
      icon: WalletIcon,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Total Income",
      value: `$${totalIncome.toFixed(2)}`,
      subtitle: "All time received",
      icon: ArrowTrendingUpIcon,
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Total Expenses",
      value: `$${totalExpenses.toFixed(2)}`,
      subtitle: "All time spent",
      icon: ArrowTrendingDownIcon,
      iconColor: "text-red-600",
      iconBg: "bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Pending",
      value: pendingTransactions,
      subtitle: "Transactions processing",
      icon: ClockIcon,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  const quickActions = [
    {
      label: "Add Funds",
      sublabel: "Deposit money",
      icon: PlusIcon,
      iconColor: "text-green-600",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      onClick: () => setAddFundsOpen(true),
    },
    {
      label: "Send",
      sublabel: "Transfer funds",
      icon: PaperAirplaneIcon,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      onClick: () => setSendOpen(true),
    },
    {
      label: "Withdraw",
      sublabel: "Cash out",
      icon: ArrowUpRightIcon,
      iconColor: "text-orange-600",
      iconBg: "bg-orange-100 dark:bg-orange-900/30",
      onClick: () => setWithdrawOpen(true),
    },
    {
      label: "Refresh",
      sublabel: "Update data",
      icon: ArrowPathIcon,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      onClick: handleRefresh,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ChainVanguard Wallet
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Welcome back, {user?.name || "User"}! 👋
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 backdrop-blur-sm text-xs border-0">
                  Wallet Connected
                </Badge>
                <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 backdrop-blur-sm flex items-center gap-1 text-xs border-0">
                  <ShieldCheckIcon className="h-3 w-3" />
                  Blockchain Secured
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                disabled={isLoading}
                variant="outline"
                className="hidden lg:flex items-center gap-2 text-xs"
              >
                <ArrowPathIcon
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-all duration-300 text-xs font-medium cursor-pointer"
              >
                {showBalance ? (
                  <EyeSlashIcon className="w-4 h-4" />
                ) : (
                  <EyeIcon className="w-4 h-4" />
                )}
                {showBalance ? "Hide" : "Show"} Balance
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsData.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="border border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:scale-[1.02]"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`h-10 w-10 rounded-full ${stat.iconBg} flex items-center justify-center`}
                    >
                      <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {stat.value}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {stat.subtitle}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Content Grid */}
        <div
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Wallet Control Panel */}
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-base">
                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <WalletIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  Wallet Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Balance Display */}
                <div className="text-center p-6 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-900/30 shadow-md">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Available Balance
                  </p>
                  <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {showBalance ? `$${balance.toFixed(2)}` : "••••••"}
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Wallet Address
                  </Label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                        {currentWallet.address.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <code className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1">
                      {formatAddress(currentWallet.address)}
                    </code>
                    <button
                      onClick={() => copyToClipboard(currentWallet.address)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Separator />

                {/* Security Status */}
                <div className="p-4 bg-green-50/80 dark:bg-green-950/30 backdrop-blur-sm rounded-lg border border-green-100/50 dark:border-green-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-800 dark:text-green-300">
                      Security Status
                    </span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Wallet secured with blockchain technology
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl lg:col-span-2 hover:shadow-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <ClockIcon className="h-4 w-4 text-indigo-600" />
                    </div>
                    Transaction History
                  </CardTitle>
                  <Select
                    value={selectedFilter}
                    onValueChange={setSelectedFilter}
                  >
                    <SelectTrigger className="w-32 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="deposit">Deposits</SelectItem>
                      <SelectItem value="payment">Payments</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="withdrawal">Withdrawals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription className="text-xs">
                  Your recent wallet transactions and activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm mb-4">
                      <ClockIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {selectedFilter === "all"
                        ? "No transactions yet. Start by adding funds!"
                        : "No transactions match your filter."}
                    </p>
                    {selectedFilter !== "all" ? (
                      <button
                        onClick={() => setSelectedFilter("all")}
                        className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg hover:shadow-xl text-xs"
                      >
                        Clear Filters
                      </button>
                    ) : (
                      <button
                        onClick={() => setAddFundsOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors mx-auto text-xs"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add Funds
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => {
                      const statusConfig = getStatusConfig(transaction.status);
                      const StatusIcon = statusConfig.icon;
                      const CategoryIcon = getCategoryIcon(
                        transaction.category || ""
                      );

                      return (
                        <div
                          key={transaction.id}
                          className="flex items-center gap-4 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-800/80 transition-all border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md"
                        >
                          {/* Transaction Icon */}
                          <div className="relative">
                            <div className="h-12 w-12 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-md">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border-2 border-white dark:border-gray-800">
                              {CategoryIcon}
                            </div>
                          </div>

                          {/* Transaction Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                {transaction.description}
                              </h4>
                              <div
                                className={`font-bold text-lg ${
                                  transaction.amount > 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {transaction.amount > 0 ? "+" : ""}
                                $${Math.abs(transaction.amount).toFixed(2)}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`${statusConfig.color} flex items-center gap-1 text-xs backdrop-blur-sm border-0`}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig.label}
                                </Badge>
                                {transaction.category && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs border-0"
                                  >
                                    {transaction.category}
                                  </Badge>
                                )}
                              </div>

                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {getTimeAgo(transaction.timestamp)}
                              </span>
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
        </div>

        {/* Quick Actions */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-2xl transition-all duration-300 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <BoltIcon className="h-4 w-4 text-indigo-600" />
                </div>
                Quick Actions
              </CardTitle>
              <CardDescription className="text-xs">
                Manage your wallet efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <button
                  onClick={() => setAddFundsOpen(true)}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <PlusIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      Add Funds
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Deposit money
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setSendOpen(true)}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      Send
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Transfer funds
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setWithdrawOpen(true)}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowUpRightIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      Withdraw
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Cash out
                    </p>
                  </div>
                </button>
                <button
                  onClick={handleRefresh}
                  className="h-32 flex flex-col gap-3 items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-300 hover:shadow-xl cursor-pointer group"
                >
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <ArrowPathIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                      Refresh
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Update data
                    </p>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialogs */}
        {/* Add Funds Dialog */}
        <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
          <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <PlusIcon className="h-4 w-4 text-white" />
                </div>
                Add Funds to Wallet
              </DialogTitle>
              <DialogDescription>
                Choose your preferred payment method to add funds
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">
                      <div className="flex items-center gap-2">
                        <BuildingLibraryIcon className="w-4 h-4" />
                        Bank Transfer
                      </div>
                    </SelectItem>
                    <SelectItem value="Credit Card">
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4" />
                        Credit Card
                      </div>
                    </SelectItem>
                    <SelectItem value="Debit Card">
                      <div className="flex items-center gap-2">
                        <CreditCardIcon className="w-4 h-4" />
                        Debit Card
                      </div>
                    </SelectItem>
                    <SelectItem value="Cryptocurrency">
                      <div className="flex items-center gap-2">
                        <CurrencyDollarIcon className="w-4 h-4" />
                        Cryptocurrency
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => setAddFundsOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddFunds}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                )}
                {isLoading ? "Processing..." : "Add Funds"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Dialog */}
        <Dialog open={sendOpen} onOpenChange={setSendOpen}>
          <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <PaperAirplaneIcon className="h-4 w-4 text-white" />
                </div>
                Send Funds
              </DialogTitle>
              <DialogDescription>
                Send CVG tokens to another user (enter their User ID)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="send-amount">Amount</Label>
                <Input
                  id="send-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  max={balance}
                  className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Available: $${balance.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="send-address">Recipient User ID</Label>
                <Input
                  id="send-address"
                  placeholder="Enter recipient's User ID"
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                  className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                />
                <p className="text-xs text-gray-500">
                  Note: Enter the recipient&apos;s User ID, not wallet address
                </p>
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => setSendOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                )}
                {isLoading ? "Processing..." : "Send Funds"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Withdraw Dialog */}
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                  <ArrowUpRightIcon className="h-4 w-4 text-white" />
                </div>
                Withdraw Funds
              </DialogTitle>
              <DialogDescription>
                Withdraw funds from your wallet to your bank account
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  max={balance}
                  className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Available: $${balance.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank-account">Bank Account</Label>
                <Input
                  id="bank-account"
                  placeholder="Enter bank account details"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="h-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                />
              </div>
            </div>
            <DialogFooter>
              <button
                onClick={() => setWithdrawOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isLoading}
                className="px-4 py-2 rounded-md bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                )}
                {isLoading ? "Processing..." : "Withdraw"}
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
