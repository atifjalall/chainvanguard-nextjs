/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Activity,
  Sparkles,
  Shield,
  Zap,
  Building2,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  FileText,
  Hash,
  CreditCard,
  Banknote,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

const transactionTypes = [
  "All Types",
  "sale",
  "purchase",
  "adjustment",
  "transfer",
];

const transactionStatuses = ["All Status", "completed", "pending", "cancelled"];

const sortOptions = [
  { value: "date-desc", label: "Date: Newest First" },
  { value: "date-asc", label: "Date: Oldest First" },
  { value: "amount-desc", label: "Amount: High to Low" },
  { value: "amount-asc", label: "Amount: Low to High" },
];

export default function SupplierTransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    setIsVisible(true);
    loadTransactions();
  }, [user?.id]);

  const loadTransactions = () => {
    setIsLoading(true);
    try {
      // Load transactions from localStorage or use sample data
      const savedTransactions = localStorage.getItem(
        `supplier_${user?.id}_transactions`
      );
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      } else {
        // Sample transaction data
        const sampleTransactions = [
          {
            id: "txn_001",
            reference: "TXN-2025-001",
            date: "2025-08-28T10:30:00Z",
            type: "sale",
            status: "completed",
            amount: 2500.0,
            vendor: "TechCorp Industries",
            product: "Silicon Wafers",
            quantity: 20,
            blockchainHash:
              "0x742d35cc6e4c1c4b2c4e8f8a9c5d8e7f6a5b4c3d2e1f0g9h8i7j6k5l4m3n2o1p",
            gasUsed: 21000,
            description: "Bulk supply of premium silicon wafers",
            
          },
          {
            id: "txn_002",
            reference: "TXN-2025-002",
            date: "2025-08-27T14:15:00Z",
            type: "purchase",
            status: "completed",
            amount: -1200.5,
            vendor: "Raw Materials Co.",
            product: "Industrial Steel Rods",
            quantity: 50,
            blockchainHash:
              "0xa1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g",
            gasUsed: 19500,
            description: "Raw materials procurement for manufacturing",
          },
          {
            id: "txn_003",
            reference: "TXN-2025-003",
            date: "2025-08-26T09:45:00Z",
            type: "sale",
            status: "pending",
            amount: 1850.75,
            vendor: "Green Textiles Ltd",
            product: "Organic Cotton Rolls",
            quantity: 100,
            blockchainHash:
              "0xf1e2d3c4b5a6978e5d4c3b2a1f0e9d8c7b6a5948372615a4b3c2d1e0f9e8d7c6b",
            gasUsed: 22500,
            description: "Sustainable textile supply order",
          },
          {
            id: "txn_004",
            reference: "TXN-2025-004",
            date: "2025-08-25T16:20:00Z",
            type: "adjustment",
            status: "completed",
            amount: -450.0,
            vendor: "Internal Adjustment",
            product: "Chemical Catalyst X1",
            quantity: -5,
            blockchainHash:
              "0x9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2i1h0g9f8e7d6c5b4a3928170g5f4e3d",
            gasUsed: 18000,
            description: "Inventory adjustment - damaged goods write-off",
          },
          {
            id: "txn_005",
            reference: "TXN-2025-005",
            date: "2025-08-24T11:10:00Z",
            type: "transfer",
            status: "completed",
            amount: 0,
            vendor: "Warehouse B",
            product: "Mixed Components",
            quantity: 75,
            blockchainHash:
              "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g",
            gasUsed: 25000,
            description: "Inter-warehouse inventory transfer",
          },
        ];
        setTransactions(sampleTransactions);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case "purchase":
        return <ArrowDown className="h-4 w-4 text-blue-500" />;
      case "adjustment":
        return <ArrowUpDown className="h-4 w-4 text-orange-500" />;
      case "transfer":
        return <ArrowUpDown className="h-4 w-4 text-purple-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "purchase":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      case "adjustment":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800";
      case "transfer":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const matchesSearch =
        transaction.reference
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType =
        selectedType === "All Types" || transaction.type === selectedType;

      const matchesStatus =
        selectedStatus === "All Status" ||
        transaction.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "amount-asc":
          return Math.abs(a.amount) - Math.abs(b.amount);
        case "amount-desc":
          return Math.abs(b.amount) - Math.abs(a.amount);
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, selectedType, selectedStatus, sortBy]);

  // Calculate statistics
  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter(
    (t) => t.status === "completed"
  ).length;
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending"
  ).length;
  const totalVolume = transactions
    .filter((t) => t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalSales = transactions
    .filter((t) => t.type === "sale" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPurchases = transactions
    .filter((t) => t.type === "purchase" && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/10">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-gray-100 dark:via-blue-400 dark:to-gray-100 bg-clip-text text-transparent">
                Supply Chain Transactions
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Track all blockchain transactions and financial activities
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={loadTransactions}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {[
              {
                title: "Total Transactions",
                value: totalTransactions.toLocaleString(),
                subtitle: "All time transactions",
                icon: Receipt,
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
                iconBg: "from-blue-500 to-cyan-500",
              },
              {
                title: "Total Volume",
                value: formatCurrency(totalVolume),
                subtitle: "Transaction volume",
                icon: DollarSign,
                gradient: "from-green-500 to-emerald-500",
                bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
                iconBg: "from-green-500 to-emerald-500",
              },
              {
                title: "Total Sales",
                value: formatCurrency(totalSales),
                subtitle: "Revenue generated",
                icon: TrendingUp,
                gradient: "from-green-500 to-teal-500",
                bgGradient: "from-green-500/5 via-transparent to-teal-500/5",
                iconBg: "from-green-500 to-teal-500",
              },
              {
                title: "Total Purchases",
                value: formatCurrency(totalPurchases),
                subtitle: "Supply investments",
                icon: Banknote,
                gradient: "from-blue-500 to-indigo-500",
                bgGradient: "from-blue-500/5 via-transparent to-indigo-500/5",
                iconBg: "from-blue-500 to-indigo-500",
              },
              {
                title: "Completed",
                value: completedTransactions.toString(),
                subtitle: "Successfully processed",
                icon: CheckCircle,
                gradient: "from-green-500 to-emerald-500",
                bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
                iconBg: "from-green-500 to-emerald-500",
              },
              {
                title: "Pending",
                value: pendingTransactions.toString(),
                subtitle: "Awaiting confirmation",
                icon: Clock,
                gradient: "from-yellow-500 to-orange-500",
                bgGradient: "from-yellow-500/5 via-transparent to-orange-500/5",
                iconBg: "from-yellow-500 to-orange-500",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}
                />
                <CardContent className="relative z-10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-r ${stat.iconBg} flex items-center justify-center shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    {index === 1 && (
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {stat.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {stat.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search by reference, vendor, product, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full lg:w-48 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="All Types" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {transactionTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full lg:w-48 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="All Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {transactionStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-48 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredAndSortedTransactions.length > 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-white" />
                      </div>
                      Transaction History
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {filteredAndSortedTransactions.length} transactions found
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    Blockchain Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200/50 dark:border-gray-800/50">
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Reference
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Date & Time
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Type
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Vendor
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Product
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Amount
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Blockchain
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedTransactions.map((transaction: any) => (
                        <TableRow
                          key={transaction.id}
                          className="border-b border-gray-200/30 dark:border-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <code className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                  {transaction.reference}
                                </code>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(transaction.type)}
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getTypeColor(transaction.type)}`}
                                variant="secondary"
                              >
                                {transaction.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(transaction.status)}
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getStatusColor(transaction.status)}`}
                                variant="secondary"
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {transaction.vendor}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {transaction.product}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Qty: {transaction.quantity}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {transaction.amount >= 0 ? (
                                <ArrowUpRight className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-500" />
                              )}
                              <span
                                className={`font-bold ${
                                  transaction.amount >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {transaction.amount >= 0 ? "+" : ""}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4 text-gray-500" />
                              <div className="space-y-1">
                                <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block">
                                  {transaction.blockchainHash.substring(0, 16)}
                                  ...
                                </code>
                                <p className="text-xs text-gray-500">
                                  Gas:{" "}
                                  {transaction.gasUsed?.toLocaleString() ||
                                    "N/A"}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toast.info("Transaction details coming soon")
                                }
                                className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  copyToClipboard(
                                    transaction.blockchainHash,
                                    "Blockchain hash"
                                  )
                                }
                                className="h-8 w-8 p-0 hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-900/20"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center mb-6">
                  <ArrowUpDown className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {totalTransactions === 0
                    ? "No Transactions Yet"
                    : "No Transactions Found"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {totalTransactions === 0
                    ? "Start selling your supply products to see transactions here."
                    : "Try adjusting your search terms or filters to find transactions."}
                </p>
                {totalTransactions === 0 ? (
                  <Button
                    onClick={() => router.push("/supplier/products")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    View Products
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedType("All Types");
                      setSelectedStatus("All Status");
                    }}
                    className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
