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
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ChartPieIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  CubeIcon,
  DocumentDuplicateIcon,
  HashtagIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ArrowTrendingDownIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import SupplierTransactionsSkeleton from "@/components/skeletons/supplierTransactionsSkeleton";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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

// BADGE COLOR MAP - Replaced with imported constants
// const badgeColors: Record<
//   string,
//   { bg: string; border: string; text: string; icon: string }
// > = {
//   green: {
//     bg: "bg-green-100/10 dark:bg-green-900/10",
//     border: "border border-green-200 dark:border-green-900",
//     text: "text-green-700 dark:text-green-400",
//     icon: "text-green-700 dark:text-green-400",
//   },
//   blue: {
//     bg: "bg-blue-100/10 dark:bg-blue-900/10",
//     border: "border border-blue-200 dark:border-blue-900",
//     text: "text-blue-700 dark:text-blue-400",
//     icon: "text-blue-700 dark:text-blue-400",
//   },
//   yellow: {
//     bg: "bg-yellow-100/10 dark:bg-yellow-900/10",
//     border: "border border-yellow-200 dark:border-yellow-900",
//     text: "text-yellow-700 dark:text-yellow-400",
//     icon: "text-yellow-700 dark:text-yellow-400",
//   },
//   red: {
//     bg: "bg-red-100/10 dark:bg-red-900/10",
//     border: "border border-red-200 dark:border-red-900",
//     text: "text-red-700 dark:text-red-400",
//     icon: "text-red-700 dark:text-red-400",
//   },
// };

// Helper to get badge color by status/type - Updated to use imported constants
function getBadgeColor(type: string) {
  switch (type) {
    case "completed":
    case "sale":
      return badgeColors.green;
    case "pending":
    case "adjustment":
      return badgeColors.yellow;
    case "cancelled":
    case "purchase":
      return badgeColors.red;
    case "transfer":
    case "blue":
    case "Blockchain Verified":
      return badgeColors.blue;
    default:
      return badgeColors.blue;
  }
}

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
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "pending":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "cancelled":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="h-4 w-4 text-gray-500" />;
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
        return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
      case "purchase":
        return <ArrowDownIcon className="h-4 w-4 text-blue-500" />;
      case "adjustment":
        return <ArrowsUpDownIcon className="h-4 w-4 text-orange-500" />;
      case "transfer":
        return <ArrowsUpDownIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <ChartPieIcon className="h-4 w-4 text-gray-500" />;
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
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
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
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Transactions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Supply Chain Transactions
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Track all blockchain transactions and financial activities
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadTransactions}
                variant="outline"
                className={`hidden lg:flex items-center gap-2 text-xs cursor-pointer !rounded-none ${colors.buttons.secondary} transition-all`}
              >
                <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                className={`flex items-center gap-2 text-xs cursor-pointer !rounded-none ${colors.buttons.secondary} transition-all`}
              >
                <ArrowDownTrayIcon
                  className={`h-4 w-4 ${colors.icons.primary}`}
                />
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
                icon: ReceiptPercentIcon,
              },
              {
                title: "Total Volume",
                value: formatCurrency(totalVolume),
                subtitle: "Transaction volume",
                icon: RsIcon,
              },
              {
                title: "Total Sales",
                value: formatCurrency(totalSales),
                subtitle: "Revenue generated",
                icon: ArrowTrendingUpIcon,
              },
              {
                title: "Total Purchases",
                value: formatCurrency(totalPurchases),
                subtitle: "Supply investments",
                icon: CreditCardIcon,
              },
              {
                title: "Completed",
                value: completedTransactions.toString(),
                subtitle: "Successfully processed",
                icon: CheckCircleIcon,
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 !rounded-none">
                  <CardTitle
                    className={`text-xs font-medium ${colors.texts.secondary}`}
                  >
                    {stat.title}
                  </CardTitle>
                  <div className="h-10 w-10 flex items-center justify-center !rounded-none">
                    <stat.icon className={`h-5 w-5 ${colors.icons.primary}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-lg font-bold ${colors.texts.primary} mb-1`}
                  >
                    {stat.value}
                  </div>
                  <p className={`text-xs ${colors.texts.secondary}`}>
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
          <Card className={`${colors.cards.base} !rounded-none`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="h-8 w-8 !rounded-none flex items-center justify-center">
                  <FunnelIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                </div>
                Filters & Search
              </CardTitle>
              <CardDescription className={`text-xs ${colors.texts.secondary}`}>
                Filter and search through your transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                  />
                  <Input
                    placeholder="Search by reference, vendor or product"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200`}
                  />
                </div>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 !rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] !rounded-none">
                    {transactionTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="text-sm h-9"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 !rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] !rounded-none">
                    {transactionStatuses.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-sm h-9"
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 !rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] !rounded-none">
                    {sortOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm h-9"
                      >
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
                      className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs !rounded-none`}
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
                      className={`${getBadgeColor(selectedType).bg} ${getBadgeColor(selectedType).border} ${getBadgeColor(selectedType).text} text-xs !rounded-none flex items-center gap-1`}
                    >
                      {/* Icon for type */}
                      {selectedType === "sale" && (
                        <ArrowUpIcon
                          className={`h-3 w-3 ${badgeColors.green.icon}`}
                        />
                      )}
                      {selectedType === "purchase" && (
                        <ArrowDownIcon
                          className={`h-3 w-3 ${badgeColors.red.icon}`}
                        />
                      )}
                      {selectedType === "adjustment" && (
                        <ArrowsUpDownIcon
                          className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                        />
                      )}
                      {selectedType === "transfer" && (
                        <ArrowsUpDownIcon
                          className={`h-3 w-3 ${badgeColors.blue.icon}`}
                        />
                      )}
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
                      className={`${getBadgeColor(selectedStatus).bg} ${getBadgeColor(selectedStatus).border} ${getBadgeColor(selectedStatus).text} text-xs !rounded-none flex items-center gap-1`}
                    >
                      {/* Icon for status */}
                      {selectedStatus === "completed" && (
                        <CheckCircleIcon
                          className={`h-3 w-3 ${badgeColors.green.icon}`}
                        />
                      )}
                      {selectedStatus === "pending" && (
                        <ClockIcon
                          className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                        />
                      )}
                      {selectedStatus === "cancelled" && (
                        <XCircleIcon
                          className={`h-3 w-3 ${badgeColors.red.icon}`}
                        />
                      )}
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
            <Card
              className={`${colors.cards.base} !rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardHeader
                className={`border-b ${colors.borders.primary} !rounded-none`}
              >
                <div className="flex flex-row items-center gap-4">
                  <div className="flex flex-col">
                    <CardTitle
                      className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                    >
                      <div className="h-8 w-8 !rounded-none flex items-center justify-center">
                        <BanknotesIcon
                          className={`h-4 w-4 ${colors.icons.primary}`}
                        />
                      </div>
                      Transaction History
                    </CardTitle>
                  </div>
                  <div className="flex-1" />
                  <div>
                    <Badge
                      variant="secondary"
                      className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs !rounded-none flex items-center`}
                    >
                      <ShieldCheckIcon
                        className={`h-3 w-3 mr-1 ${badgeColors.blue.icon}`}
                      />
                      Blockchain Verified
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow
                        className={`border-b ${colors.borders.secondary} py-4 !rounded-none`}
                      >
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Reference
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Date
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[120px]`}
                        >
                          Type
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[120px]`}
                        >
                          Status
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Vendor
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Product
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[120px]`}
                        >
                          Amount
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[160px]`}
                        >
                          Blockchain
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[120px]`}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedTransactions.map((transaction: any) => (
                        <TableRow
                          key={transaction.id}
                          className={`border-b ${colors.borders.secondary} ${colors.backgrounds.hover} transition-colors py-4 !rounded-none`}
                        >
                          <TableCell className="px-2">
                            <div className="flex items-center gap-3">
                              <div>
                                <code
                                  className={`text-sm font-mono ${colors.backgrounds.tertiary} px-2 py-1 rounded-none`}
                                >
                                  {transaction.reference}
                                </code>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon
                                className={`h-3 w-3 ${colors.icons.muted}`}
                              />
                              <span
                                className={`text-sm ${colors.texts.primary}`}
                              >
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              {/* REMOVE redundant icon, keep only badge with icon inside */}
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getBadgeColor(transaction.type).bg} ${getBadgeColor(transaction.type).border} ${getBadgeColor(transaction.type).text} flex items-center gap-1 !rounded-none`}
                                variant="secondary"
                              >
                                {transaction.type === "sale" && (
                                  <ArrowUpIcon
                                    className={`h-3 w-3 ${badgeColors.green.icon}`}
                                  />
                                )}
                                {transaction.type === "purchase" && (
                                  <ArrowDownIcon
                                    className={`h-3 w-3 ${badgeColors.red.icon}`}
                                  />
                                )}
                                {transaction.type === "adjustment" && (
                                  <ArrowsUpDownIcon
                                    className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                                  />
                                )}
                                {transaction.type === "transfer" && (
                                  <ArrowsUpDownIcon
                                    className={`h-3 w-3 ${badgeColors.blue.icon}`}
                                  />
                                )}
                                {transaction.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              {/* REMOVE redundant icon, keep only badge with icon inside */}
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getBadgeColor(transaction.status).bg} ${getBadgeColor(transaction.status).border} ${getBadgeColor(transaction.status).text} flex items-center gap-1 !rounded-none`}
                                variant="secondary"
                              >
                                {transaction.status === "completed" && (
                                  <CheckCircleIcon
                                    className={`h-3 w-3 ${badgeColors.green.icon}`}
                                  />
                                )}
                                {transaction.status === "pending" && (
                                  <ClockIcon
                                    className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                                  />
                                )}
                                {transaction.status === "cancelled" && (
                                  <XCircleIcon
                                    className={`h-3 w-3 ${badgeColors.red.icon}`}
                                  />
                                )}
                                {transaction.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <BuildingOffice2Icon className="h-3 w-3 text-gray-500" />
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
                                <ArrowTrendingUpIcon className="h-3 w-3 text-green-500" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-3 w-3 text-red-500" />
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
                              <HashtagIcon className="h-3 w-3 text-gray-500" />
                              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-none block">
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
                                className={`h-8 px-3 ${colors.buttons.outline} cursor-pointer !rounded-none`}
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
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
                                className={`h-8 w-8 p-0 ${colors.buttons.outline} cursor-pointer !rounded-none`}
                              >
                                <DocumentDuplicateIcon className="h-3 w-3" />
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
            <Card
              className={`text-center py-16 ${colors.cards.base} overflow-hidden !rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardContent>
                <div
                  className={`h-20 w-20 mx-auto mb-6 ${colors.backgrounds.accent} backdrop-blur-sm !rounded-none flex items-center justify-center`}
                >
                  <ArrowsUpDownIcon
                    className={`h-10 w-10 ${colors.icons.muted}`}
                  />
                </div>
                <h3
                  className={`text-base font-semibold ${colors.texts.primary} mb-2`}
                >
                  {totalTransactions === 0
                    ? "No Transactions Yet"
                    : "No Transactions Found"}
                </h3>
                <p
                  className={`text-xs ${colors.texts.secondary} mb-6 max-w-md mx-auto`}
                >
                  {totalTransactions === 0
                    ? "Start selling your supply products to see transactions here."
                    : "Try adjusting your search terms or filters to find transactions."}
                </p>
                {totalTransactions === 0 ? (
                  <Button
                    onClick={() => router.push("/supplier/products")}
                    className={`${colors.buttons.primary} shadow-none transition-all duration-300 text-xs cursor-pointer !rounded-none`}
                  >
                    <CubeIcon
                      className={`h-4 w-4 mr-2 ${colors.texts.inverse}`}
                    />
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
                    className={`inline-flex items-center gap-2 text-xs cursor-pointer ${colors.buttons.outline} transition-all`}
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
