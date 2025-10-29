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
import SupplierTransactionsSkeleton from "@/components/skeletons/supplierTransactionsSkeleton";

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
    });
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  if (isLoading) {
    return <SupplierTransactionsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Supply Chain Transactions
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Track all blockchain transactions and financial activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadTransactions}
                variant="outline"
                className="hidden lg:flex items-center gap-2 text-xs cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-xs cursor-pointer"
              >
                <Download className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Total Transactions",
                value: totalTransactions.toLocaleString(),
                subtitle: "All time transactions",
                icon: Receipt,
                iconColor: "text-blue-600",
                iconBg: "bg-blue-100 dark:bg-blue-900/30",
              },
              {
                title: "Total Volume",
                value: formatCurrency(totalVolume),
                subtitle: "Transaction volume",
                icon: DollarSign,
                iconColor: "text-green-600",
                iconBg: "bg-green-100 dark:bg-green-900/30",
              },
              {
                title: "Total Sales",
                value: formatCurrency(totalSales),
                subtitle: "Revenue generated",
                icon: TrendingUp,
                iconColor: "text-green-600",
                iconBg: "bg-green-100 dark:bg-green-900/30",
              },
              {
                title: "Total Purchases",
                value: formatCurrency(totalPurchases),
                subtitle: "Supply investments",
                icon: Banknote,
                iconColor: "text-blue-600",
                iconBg: "bg-blue-100 dark:bg-blue-900/30",
              },
              {
                title: "Completed",
                value: completedTransactions.toString(),
                subtitle: "Successfully processed",
                icon: CheckCircle,
                iconColor: "text-green-600",
                iconBg: "bg-green-100 dark:bg-green-900/30",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="border border-white/20 dark:border-gray-700/30 shadow-md hover:shadow-lg transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:scale-[1.02]"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`h-10 w-10 rounded-full ${stat.iconBg} flex items-center justify-center shadow-md`}
                  >
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
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
            ))}
          </div>
        </div>

        {/* Filters Card */}
        <div
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Filter className="h-4 w-4 text-purple-600" />
                </div>
                Filters & Search
              </CardTitle>
              <CardDescription className="text-xs">
                Filter and search through your transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by reference, vendor or product"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 cursor-pointer">
                    <SelectValue placeholder="All Types" />
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
                  <SelectTrigger className="h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 cursor-pointer">
                    <SelectValue placeholder="All Status" />
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
                  <SelectTrigger className="h-12 w-full min-w-[240px] bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 cursor-pointer">
                    <SelectValue placeholder="Sort by" />
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
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                    >
                      &quot;{searchTerm}&quot;
                      <button
                        onClick={() => setSearchTerm("")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedType !== "All Types" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                    >
                      {selectedType}
                      <button
                        onClick={() => setSelectedType("All Types")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedStatus !== "All Status" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-white/50 dark:bg-gray-900/50 border-gray-200/50 dark:border-gray-700/50"
                    >
                      {selectedStatus}
                      <button
                        onClick={() => setSelectedStatus("All Status")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                    {filteredAndSortedTransactions.length} transactions found
                  </span>
                </div>
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
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800">
                <div className="flex flex-row items-center gap-4">
                  <div className="flex flex-col">
                    <CardTitle className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-100">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      Transaction History
                    </CardTitle>
                  </div>
                  <div className="flex-1" />
                  <div>
                    <Badge
                      variant="secondary"
                      className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 text-xs"
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      Blockchain Verified
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200/50 dark:border-gray-800/50 py-4">
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[140px]">
                          Reference
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[140px]">
                          Date
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[120px]">
                          Type
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[120px]">
                          Status
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[140px]">
                          Vendor
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[140px]">
                          Product
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[120px]">
                          Amount
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[160px]">
                          Blockchain
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold min-w-[120px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedTransactions.map((transaction: any) => (
                        <TableRow
                          key={transaction.id}
                          className="border-b border-gray-200/30 dark:border-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors py-4"
                        >
                          <TableCell className="px-2">
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
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3 w-3 text-gray-500" />
                              <span className="text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
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
                          <TableCell className="px-2">
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
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3 w-3 text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {transaction.vendor}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {transaction.product}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Qty: {transaction.quantity}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-1">
                              {transaction.amount >= 0 ? (
                                <ArrowUpRight className="h-3 w-3 text-green-500" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3 text-red-500" />
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
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <Hash className="h-3 w-3 text-gray-500" />
                              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded block">
                                {transaction.blockchainHash.substring(0, 16)}...
                              </code>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toast.info("Transaction details coming soon")
                                }
                                className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 cursor-pointer"
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
                                className="h-8 w-8 p-0 hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-900/20 cursor-pointer"
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
            <Card className="text-center py-16 border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden">
              <CardContent>
                <div className="h-20 w-20 mx-auto mb-6 bg-gray-100/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <ArrowUpDown className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {totalTransactions === 0
                    ? "No Transactions Yet"
                    : "No Transactions Found"}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {totalTransactions === 0
                    ? "Start selling your supply products to see transactions here."
                    : "Try adjusting your search terms or filters to find transactions."}
                </p>
                {totalTransactions === 0 ? (
                  <Button
                    onClick={() => router.push("/supplier/products")}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 text-xs cursor-pointer"
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
                    className="inline-flex items-center gap-2 text-xs cursor-pointer"
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
