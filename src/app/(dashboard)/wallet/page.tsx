"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  RefreshCw,
  CreditCard,
  Building2,
  History,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  TrendingUp,
  TrendingDown,
  Zap,
  DollarSign,
  Activity,
  Sparkles,
  Crown,
  Target,
  Download,
  Filter,
  ArrowUpDown,
  Banknote,
  Coins,
  PiggyBank,
  Send,
  Receipt,
  Star,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useWallet } from "@/components/providers/wallet-provider";
import { toast } from "sonner";

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

const mockTransactions: Transaction[] = [
  {
    id: "tx_001",
    type: "deposit",
    amount: 500,
    description: "Bank transfer deposit",
    timestamp: "2025-08-28T14:30:00Z",
    status: "completed",
    txHash: "0x1a2b3c4d5e6f789012345678901234567890abcdef",
    category: "Funding",
    counterparty: "Bank Account",
  },
  {
    id: "tx_002",
    type: "payment",
    amount: -89.99,
    description: "Product purchase - Wireless Gaming Mouse",
    timestamp: "2025-08-28T12:15:00Z",
    status: "completed",
    txHash: "0x2b3c4d5e6f7890123456789012345678901234567890",
    category: "Shopping",
    counterparty: "TechVendor Pro",
  },
  {
    id: "tx_003",
    type: "received",
    amount: 24.99,
    description: "Refund - Gaming Mousepad",
    timestamp: "2025-08-27T16:45:00Z",
    status: "completed",
    txHash: "0x3c4d5e6f78901234567890123456789012345678901",
    category: "Refund",
    counterparty: "Gaming Gear Co.",
  },
  {
    id: "tx_004",
    type: "withdrawal",
    amount: -200,
    description: "Withdrawal to bank account",
    timestamp: "2025-08-27T10:20:00Z",
    status: "pending",
    category: "Withdrawal",
    counterparty: "Bank Account",
  },
  {
    id: "tx_005",
    type: "payment",
    amount: -156.78,
    description: "Subscription payment - Premium Plan",
    timestamp: "2025-08-26T09:30:00Z",
    status: "completed",
    txHash: "0x4d5e6f78901234567890123456789012345678901234",
    category: "Services",
    counterparty: "ChainVanguard",
  },
  {
    id: "tx_006",
    type: "received",
    amount: 75.5,
    description: "Cashback reward",
    timestamp: "2025-08-25T18:20:00Z",
    status: "completed",
    txHash: "0x5e6f78901234567890123456789012345678901234567",
    category: "Rewards",
    counterparty: "ChainVanguard",
  },
];

export default function WalletPage() {
  const { user } = useAuth();
  const { currentWallet, balance, updateBalance } = useWallet();
  const [transactions, setTransactions] =
    useState<Transaction[]>(mockTransactions);
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

    setTimeout(() => {
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: "deposit",
        amount: parseFloat(addAmount),
        description: `Deposit via ${paymentMethod}`,
        timestamp: new Date().toISOString(),
        status: "pending",
        category: "Funding",
        counterparty: paymentMethod,
      };

      setTransactions((prev) => [newTransaction, ...prev]);

      setTimeout(() => {
        updateBalance(balance + parseFloat(addAmount));
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === newTransaction.id
              ? { ...tx, status: "completed" as const }
              : tx
          )
        );
        toast.success(`Successfully added ${addAmount} CVG to your wallet`);
      }, 2000);

      setAddAmount("");
      setPaymentMethod("");
      setAddFundsOpen(false);
      setIsLoading(false);
      toast.info("Transaction initiated, processing...");
    }, 1000);
  };

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

    setTimeout(() => {
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: "withdrawal",
        amount: -parseFloat(withdrawAmount),
        description: `Withdrawal to ${bankAccount}`,
        timestamp: new Date().toISOString(),
        status: "pending",
        category: "Withdrawal",
        counterparty: bankAccount,
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      updateBalance(balance - parseFloat(withdrawAmount));

      setWithdrawAmount("");
      setBankAccount("");
      setWithdrawOpen(false);
      setIsLoading(false);
      toast.info(
        "Withdrawal initiated, will be processed within 1-3 business days"
      );
    }, 1000);
  };

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
      toast.error("Please enter recipient address");
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newTransaction: Transaction = {
        id: `tx_${Date.now()}`,
        type: "payment",
        amount: -parseFloat(sendAmount),
        description: `Send to ${formatAddress(sendAddress)}`,
        timestamp: new Date().toISOString(),
        status: "completed",
        txHash: `0x${Math.random().toString(16).substr(2, 40)}`,
        category: "Transfer",
        counterparty: formatAddress(sendAddress),
      };

      setTransactions((prev) => [newTransaction, ...prev]);
      updateBalance(balance - parseFloat(sendAmount));

      setSendAmount("");
      setSendAddress("");
      setSendOpen(false);
      setIsLoading(false);
      toast.success(`Successfully sent ${sendAmount} CVG`);
    }, 1000);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
      case "received":
        return <ArrowDownLeft className="w-5 h-5 text-blue-600" />;
      case "withdrawal":
        return <ArrowUpRight className="w-5 h-5 text-orange-600" />;
      case "payment":
        return <Send className="w-5 h-5 text-red-600" />;
      default:
        return <History className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
          icon: CheckCircle,
          label: "Completed",
        };
      case "pending":
        return {
          color:
            "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
          icon: Clock,
          label: "Pending",
        };
      case "failed":
        return {
          color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
          icon: AlertCircle,
          label: "Failed",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: Clock,
          label: "Unknown",
        };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Funding":
        return <PiggyBank className="w-4 h-4" />;
      case "Shopping":
        return <Receipt className="w-4 h-4" />;
      case "Services":
        return <Star className="w-4 h-4" />;
      case "Rewards":
        return <Sparkles className="w-4 h-4" />;
      case "Transfer":
        return <Send className="w-4 h-4" />;
      case "Withdrawal":
        return <Banknote className="w-4 h-4" />;
      case "Refund":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      <div className="flex items-center justify-center min-h-screen p-6">
        <Card className="w-full max-w-md text-center border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg" />
          <CardContent className="pt-8 pb-6 relative z-10">
            <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No Wallet Connected
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect your wallet to view balance and transactions
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300">
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              ChainVanguard Wallet
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Manage your digital assets and transactions securely
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Shield className="h-3 w-3 mr-1" />
                Secure Wallet
              </Badge>
              <Badge variant="outline" className="border-gray-300">
                <Zap className="h-3 w-3 mr-1" />
                Instant Transfers
              </Badge>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Current Balance",
              value: showBalance ? `${balance} CVG` : "••••••",
              subtitle: "Available funds",
              icon: Wallet,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
            },
            {
              title: "Total Income",
              value: `${totalIncome.toFixed(2)} CVG`,
              subtitle: "All time received",
              icon: TrendingUp,
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
            },
            {
              title: "Total Expenses",
              value: `${totalExpenses.toFixed(2)} CVG`,
              subtitle: "All time spent",
              icon: TrendingDown,
              gradient: "from-red-500 to-pink-500",
              bgGradient: "from-red-500/5 via-transparent to-pink-500/5",
            },
            {
              title: "Pending",
              value: pendingTransactions,
              subtitle: "Transactions processing",
              icon: Clock,
              gradient: "from-orange-500 to-amber-500",
              bgGradient: "from-orange-500/5 via-transparent to-amber-500/5",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}
                />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Wallet Control Panel */}
        <div
          className={`lg:col-span-1 transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5 rounded-lg" />
            <CardHeader className="pb-4 relative z-10">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-white" />
                  </div>
                  Wallet Control
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBalance(!showBalance)}
                  className="hover:bg-white/20 dark:hover:bg-gray-800/20"
                >
                  {showBalance ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {/* Balance Display */}
              <div className="text-center p-6 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {showBalance ? `${balance}` : "••••••"}
                </div>
                <div className="text-lg text-gray-600 dark:text-gray-400 mb-1">
                  CVG
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Available Balance
                </p>
              </div>

              {/* Wallet Address */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Wallet Address
                </Label>
                <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs">
                      {currentWallet.address.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <code className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1">
                    {formatAddress(currentWallet.address)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(currentWallet.address)}
                    className="h-8 w-8 p-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-3">
                <Dialog open={addFundsOpen} onOpenChange={setAddFundsOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
                      <ArrowDownLeft className="w-5 h-5 mr-2" />
                      Add Funds
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                          <Plus className="h-4 w-4 text-white" />
                        </div>
                        Add Funds to Wallet
                      </DialogTitle>
                      <DialogDescription>
                        Choose your preferred payment method to add funds
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount (CVG)</Label>
                        <Input
                          id="amount"
                          type="number"
                          placeholder="Enter amount"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select
                          value={paymentMethod}
                          onValueChange={setPaymentMethod}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bank Transfer">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Bank Transfer
                              </div>
                            </SelectItem>
                            <SelectItem value="Credit Card">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Credit Card
                              </div>
                            </SelectItem>
                            <SelectItem value="Debit Card">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Debit Card
                              </div>
                            </SelectItem>
                            <SelectItem value="Cryptocurrency">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4" />
                                Cryptocurrency
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setAddFundsOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddFunds}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isLoading ? "Processing..." : "Add Funds"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="grid grid-cols-2 gap-3">
                  <Dialog open={sendOpen} onOpenChange={setSendOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <Send className="h-4 w-4 text-white" />
                          </div>
                          Send Funds
                        </DialogTitle>
                        <DialogDescription>
                          Send CVG tokens to another wallet address
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="send-amount">Amount (CVG)</Label>
                          <Input
                            id="send-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={sendAmount}
                            onChange={(e) => setSendAmount(e.target.value)}
                            max={balance}
                            className="h-12"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Available: {balance} CVG
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="send-address">
                            Recipient Address
                          </Label>
                          <Input
                            id="send-address"
                            placeholder="Enter wallet address (0x...)"
                            value={sendAddress}
                            onChange={(e) => setSendAddress(e.target.value)}
                            className="h-12"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setSendOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSend}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isLoading ? "Processing..." : "Send Funds"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-12 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex items-center justify-center">
                            <ArrowUpRight className="h-4 w-4 text-white" />
                          </div>
                          Withdraw Funds
                        </DialogTitle>
                        <DialogDescription>
                          Withdraw funds from your wallet to your bank account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="withdraw-amount">Amount (CVG)</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            max={balance}
                            className="h-12"
                          />
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Available: {balance} CVG
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-account">Bank Account</Label>
                          <Input
                            id="bank-account"
                            placeholder="Enter bank account details"
                            value={bankAccount}
                            onChange={(e) => setBankAccount(e.target.value)}
                            className="h-12"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setWithdrawOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleWithdraw}
                          disabled={isLoading}
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {isLoading ? "Processing..." : "Withdraw"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div
          className={`lg:col-span-2 transform transition-all duration-700 delay-600 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 rounded-lg" />
            <CardHeader className="relative z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                      <History className="h-4 w-4 text-white" />
                    </div>
                    Transaction History
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Your recent wallet transactions and activities
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedFilter}
                    onValueChange={setSelectedFilter}
                  >
                    <SelectTrigger className="w-32 h-10 border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => {
                    const statusConfig = getStatusConfig(transaction.status);
                    const StatusIcon = statusConfig.icon;
                    const CategoryIcon = getCategoryIcon(
                      transaction.category || ""
                    );

                    return (
                      <div
                        key={transaction.id}
                        className="group flex items-center gap-4 p-4 bg-white/50 dark:bg-gray-900/50 backdrop-blur rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-all duration-300"
                      >
                        {/* Transaction Icon */}
                        <div className="relative">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shadow-lg">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center border-2 border-white dark:border-gray-900">
                            {CategoryIcon}
                          </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {transaction.description}
                            </h3>
                            <div
                              className={`font-bold text-lg ${
                                transaction.amount > 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {transaction.amount > 0 ? "+" : ""}
                              {transaction.amount.toFixed(2)} CVG
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge
                                className={`${statusConfig.color} flex items-center gap-1 text-xs`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig.label}
                              </Badge>
                              {transaction.category && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.category}
                                </Badge>
                              )}
                              {transaction.counterparty && (
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {transaction.counterparty}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {getTimeAgo(transaction.timestamp)}
                              </span>
                              {transaction.txHash && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                  onClick={() =>
                                    copyToClipboard(transaction.txHash!)
                                  }
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {transaction.txHash && (
                            <div className="mt-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <code className="text-xs text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {formatAddress(transaction.txHash)}
                              </code>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                      <History className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No Transactions Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      No transactions match your current filter selection.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFilter("all")}
                      className="shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              {filteredTransactions.length > 0 && (
                <div className="mt-6 text-center">
                  <Button
                    variant="outline"
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <History className="w-4 h-4 mr-2" />
                    Load More Transactions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Security & Settings */}
      <div
        className={`transform transition-all duration-700 delay-800 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-emerald-500/5 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              Security & Features
            </CardTitle>
            <CardDescription>
              Wallet security features and quick access options
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Security Status */}
              <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-300">
                      Security Status
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Fully Secured
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-green-700 dark:text-green-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Multi-signature enabled
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    2FA authentication active
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Hardware wallet connected
                  </li>
                </ul>
              </div>

              {/* Quick Stats */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300">
                      Activity Summary
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      This Month
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-blue-700 dark:text-blue-400">
                    <span>Transactions:</span>
                    <span className="font-medium">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-400">
                    <span>Volume:</span>
                    <span className="font-medium">
                      {Math.abs(totalIncome + totalExpenses).toFixed(2)} CVG
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-700 dark:text-blue-400">
                    <span>Average:</span>
                    <span className="font-medium">
                      {(
                        Math.abs(totalIncome + totalExpenses) /
                        transactions.length
                      ).toFixed(2)}{" "}
                      CVG
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-purple-800 dark:text-purple-300">
                      Quick Actions
                    </h4>
                    <p className="text-sm text-purple-600 dark:text-purple-400">
                      Common Tasks
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-8 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Export Statement
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-8 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Set Spending Limits
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-8 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
