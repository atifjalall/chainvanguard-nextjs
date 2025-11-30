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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  WalletIcon,
  ShieldCheckIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowTrendingDownIcon,
  DocumentDuplicateIcon,
  CheckIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePageTitle } from "@/hooks/use-page-title";
import { useWallet } from "@/components/providers/wallet-provider";

const transactionTypes = ["All Types", "deposit", "withdrawal", "payment", "received"];

const transactionStatuses = ["All Status", "completed", "pending", "failed"];

const sortOptions = [
  { value: "date-desc", label: "Date: Newest First" },
  { value: "date-asc", label: "Date: Oldest First" },
  { value: "amount-desc", label: "Amount: High to Low" },
  { value: "amount-asc", label: "Amount: Low to High" },
];

function getBadgeColor(type: string) {
  switch (type) {
    case "completed":
    case "deposit":
    case "received":
      return badgeColors.green;
    case "pending":
      return badgeColors.yellow;
    case "failed":
    case "withdrawal":
      return badgeColors.red;
    case "payment":
      return badgeColors.blue;
    default:
      return badgeColors.grey;
  }
}

export default function WalletTransactionsPage() {
  usePageTitle("Wallet Transactions");
  const { user } = useAuth();
  const router = useRouter();
  const { transactions: walletTransactions, refreshTransactions } = useWallet();

  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const transactions = (walletTransactions || []).map((tx: any) => ({
    id: tx.id,
    type: tx.type,
    amount: tx.amount,
    description: tx.description,
    timestamp: tx.timestamp,
    status: tx.status,
    txHash: tx.txHash,
    category: tx.category,
    counterparty: tx.counterparty,
  }));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "pending":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ExclamationCircleIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    const badgeColor = getBadgeColor(type);
    switch (type) {
      case "deposit":
      case "received":
        return <ArrowDownIcon className={`h-4 w-4 ${badgeColor.icon}`} />;
      case "withdrawal":
        return <ArrowUpIcon className={`h-4 w-4 ${badgeColor.icon}`} />;
      case "payment":
        return <ArrowUpIcon className={`h-4 w-4 ${badgeColor.icon}`} />;
      default:
        return <WalletIcon className={`h-4 w-4 ${badgeColor.icon}`} />;
    }
  };

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const matchesSearch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (transaction.counterparty &&
          transaction.counterparty
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

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
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "date-desc":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
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
  const totalDeposits = transactions
    .filter((t) => (t.type === "deposit" || t.type === "received") && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);

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

  const formatCurrencyAbbreviated = (amount: number) => {
    if (amount >= 1e9) {
      return `CVT ${(amount / 1e9).toFixed(2)} B`;
    } else if (amount >= 1e6) {
      return `CVT ${(amount / 1e6).toFixed(2)} M`;
    } else {
      return formatCVT(amount);
    }
  };

  // Helper function to format date as 'YYYY-MM-DD' or a readable format
  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const exportToCSV = () => {
    const headers = [
      "ID",
      "Date",
      "Type",
      "Status",
      "Description",
      "Counterparty",
      "Amount",
      "Transaction Hash",
    ];

    const rows = filteredAndSortedTransactions.map((t) => [
      t.id,
      formatDate(t.timestamp),
      t.type,
      t.status,
      t.description,
      t.counterparty || "N/A",
      t.amount,
      t.txHash || "N/A",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wallet-transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Transactions exported successfully");
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (refreshTransactions) await refreshTransactions();
      toast.success("Transactions refreshed");
    } catch (error) {
      toast.error("Failed to refresh transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const handleViewDetails = (transactionId: string) => {
    const transaction = filteredAndSortedTransactions.find(t => t.id === transactionId);
    if (transaction) {
      setSelectedTransaction(transaction);
      setIsDetailsOpen(true);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/wallet">Wallet</BreadcrumbLink>
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
                Wallet Transactions
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Track all your wallet activities and blockchain transactions
              </p>
              <div className={`flex items-center gap-3 mt-2`}>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  <WalletIcon
                    className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                  />
                  Wallet Connected
                </Badge>
                <Badge
                  className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <ShieldCheckIcon
                    className={`h-3 w-3 ${badgeColors.cyan.icon}`}
                  />
                  Blockchain Verified
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={isLoading}
                className={`hidden lg:flex items-center gap-2 text-xs cursor-pointer !rounded-none ${colors.buttons.secondary} transition-all hover:border-black dark:hover:border-white`}
              >
                <ArrowPathIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} ${colors.icons.primary}`} />
                Refresh
              </Button>
              <Button
                onClick={exportToCSV}
                variant="default"
                className={`flex items-center gap-2 text-xs cursor-pointer !rounded-none ${colors.buttons.primary} transition-all`}
              >
                <ArrowDownTrayIcon
                  className={`h-4 w-4 ${colors.icons.white}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Transactions",
                value: totalTransactions.toLocaleString(),
                subtitle: "All time transactions",
                icon: WalletIcon,
              },
              {
                title: "Total Volume",
                value: formatCurrencyAbbreviated(totalVolume),
                subtitle: "Transaction volume",
                icon: ArrowTrendingUpIcon,
              },
              {
                title: "Total Deposits",
                value: formatCurrencyAbbreviated(totalDeposits),
                subtitle: "Funds added",
                icon: ArrowDownIcon,
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
                Filter and search through your wallet transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search by description or transaction ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      {getTypeIcon(selectedType)}
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
                      {getStatusIcon(selectedStatus)}
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
                        <WalletIcon
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
                      className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} text-xs !rounded-none flex items-center`}
                    >
                      <ShieldCheckIcon
                        className={`h-3 w-3 mr-1 ${badgeColors.cyan.icon}`}
                      />
                      Blockchain Verified
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow
                        className={`border-b ${colors.borders.secondary} py-4 !rounded-none`}
                      >
                        <TableHead
                          className={`${colors.texts.primary} font-semibold`}
                        >
                          Transaction ID
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold`}
                        >
                          Date
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold`}
                        >
                          Type
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold`}
                        >
                          Status
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold`}
                        >
                          Description
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold`}
                        >
                          Amount
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold`}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedTransactions.map((transaction: any) => {
                        const isCredit = ["deposit", "received"].includes(transaction.type);

                        return (
                          <TableRow
                            key={transaction.id}
                            className={`border-b ${colors.borders.secondary} ${colors.backgrounds.hover} transition-colors py-4 !rounded-none`}
                          >
                            <TableCell className="px-2">
                              <code
                                className={`text-sm font-mono ${colors.backgrounds.tertiary} px-2 py-1 rounded-none`}
                              >
                                {transaction.id.slice(0, 8)}...
                              </code>
                            </TableCell>
                            <TableCell className="px-2">
                              <div className="flex items-center gap-2">
                                <CalendarIcon
                                  className={`h-3 w-3 ${colors.icons.muted}`}
                                />
                                <span
                                  className={`text-sm ${colors.texts.primary}`}
                                >
                                  {formatDate(transaction.timestamp)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-2">
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getBadgeColor(transaction.type).bg} ${getBadgeColor(transaction.type).border} ${getBadgeColor(transaction.type).text} flex items-center gap-1 !rounded-none`}
                                variant="secondary"
                              >
                                {getTypeIcon(transaction.type)}
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2">
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getBadgeColor(transaction.status).bg} ${getBadgeColor(transaction.status).border} ${getBadgeColor(transaction.status).text} flex items-center gap-1 !rounded-none`}
                                variant="secondary"
                              >
                                {getStatusIcon(transaction.status)}
                                {transaction.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {transaction.description}
                              </p>
                            </TableCell>
                            <TableCell className="px-2">
                              <div className="flex items-center gap-1">
                                {isCredit ? (
                                  <ArrowTrendingUpIcon className="h-3 w-3 text-green-500" />
                                ) : (
                                  <ArrowTrendingDownIcon className="h-3 w-3 text-red-500" />
                                )}
                                <span
                                  className={`font-bold ${
                                    isCredit
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {isCredit ? "+" : "-"}
                                  {formatCVT(transaction.amount)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="px-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleViewDetails(transaction.id)
                                }
                                className={`h-8 px-3 ${colors.buttons.outline} cursor-pointer !rounded-none transition-all hover:border-black dark:hover:border-white`}
                              >
                                <EyeIcon className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
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
                  className={`h-20 w-20 mx-auto mb-6 backdrop-blur-sm !rounded-none flex items-center justify-center`}
                >
                  <WalletIcon
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
                    ? "Start using your wallet to see transactions here."
                    : "Try adjusting your search terms or filters to find transactions."}
                </p>
                {totalTransactions > 0 && (
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

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent
            style={{ width: "100%", maxWidth: "900px" }}
            className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 shadow-none hover:shadow-none`}
          >
            <div className="p-6">
              <DialogHeader>
                <DialogTitle
                  className={`flex items-center gap-3 text-xl font-bold ${colors.texts.primary}`}
                >
                  <EyeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                  Transaction Details
                </DialogTitle>
                <DialogDescription
                  className={`text-base ${colors.texts.secondary}`}
                >
                  Detailed information about this wallet transaction
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                {/* Transaction Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <WalletIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Transaction Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Transaction ID
                        </p>
                        <div className="flex items-center justify-between gap-2 mt-1">
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm font-mono break-all`}
                          >
                            {selectedTransaction.id}
                          </p>
                          <button
                            onClick={() => copyToClipboard(selectedTransaction.id, "Transaction ID")}
                            className="shrink-0"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Type</p>
                        <Badge
                          className={`${getBadgeColor(selectedTransaction.type).bg} ${getBadgeColor(selectedTransaction.type).border} ${getBadgeColor(selectedTransaction.type).text} text-xs rounded-none mt-1 flex items-center gap-1 w-fit`}
                        >
                          {getTypeIcon(selectedTransaction.type)}
                          {selectedTransaction.type}
                        </Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Date & Time</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {formatDate(selectedTransaction.timestamp)} at {formatTime(selectedTransaction.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Amount
                        </p>
                        <p
                          className={`font-bold text-lg mt-1 ${
                            ["deposit", "received"].includes(selectedTransaction.type)
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {["deposit", "received"].includes(selectedTransaction.type) ? "+" : "-"}
                          {formatCVT(selectedTransaction.amount)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <CubeIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Status & Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Status
                        </p>
                        <Badge
                          className={`${getBadgeColor(selectedTransaction.status).bg} ${getBadgeColor(selectedTransaction.status).border} ${getBadgeColor(selectedTransaction.status).text} text-xs rounded-none mt-1 flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(selectedTransaction.status)}
                          {selectedTransaction.status}
                        </Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Description
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm mt-1`}
                        >
                          {selectedTransaction.description}
                        </p>
                      </div>
                      {selectedTransaction.category && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Category
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm capitalize mt-1`}
                          >
                            {selectedTransaction.category}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Transaction Flow
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm mt-1`}
                        >
                          {["deposit", "received"].includes(selectedTransaction.type) ? "Money Received" : "Money Sent"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Blockchain Information */}
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <ShieldCheckIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      Blockchain Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className={`text-xs ${colors.texts.muted} mb-1`}>
                        Transaction Hash
                      </p>
                      <div className="flex items-center gap-2">
                        <code
                          className={`text-xs font-mono ${colors.backgrounds.tertiary} px-2 py-1 rounded-none block break-all flex-1`}
                        >
                          {selectedTransaction.txHash || selectedTransaction.id}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              selectedTransaction.txHash || selectedTransaction.id,
                              "Transaction hash"
                            )
                          }
                          className={`h-8 w-8 p-0 ${colors.buttons.outline} cursor-pointer rounded-none transition-all hover:border-black dark:hover:border-white shrink-0`}
                        >
                          {copiedHash === (selectedTransaction.txHash || selectedTransaction.id) ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <DocumentDuplicateIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Network
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm mt-1`}
                        >
                          Hyperledger Fabric
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Verification Status
                        </p>
                        <Badge
                          className={`${selectedTransaction.status === "completed" ? badgeColors.blue.bg + " " + badgeColors.blue.border + " " + badgeColors.blue.text : badgeColors.yellow.bg + " " + badgeColors.yellow.border + " " + badgeColors.yellow.text} text-xs rounded-none mt-1`}
                        >
                          {selectedTransaction.status === "completed"
                            ? "Verified"
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Notice */}
                {selectedTransaction.status === "completed" && (
                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                        <div>
                          <p
                            className={`text-xs font-medium ${colors.texts.primary} mb-1`}
                          >
                            Blockchain Verified
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            This transaction has been verified and recorded on the
                            Hyperledger Fabric blockchain network. All details are immutable and cryptographically secured.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                    className={`${colors.buttons.outline} rounded-none transition-all hover:border-black dark:hover:border-white w-24 cursor-pointer`}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
