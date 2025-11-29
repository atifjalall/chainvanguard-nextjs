"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";
import { usePageTitle } from "@/hooks/use-page-title";
import { toast } from "sonner";
import { getTransactionHistory, BackendTransaction } from "@/lib/api/wallet.api";
import { formatCVT } from "@/utils/currency";

type FilterType =
  | "all"
  | "credit"
  | "debit"
  | "pending"
  | "completed"
  | "failed";

export default function TransactionsPage() {
  usePageTitle("Transactions");
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<BackendTransaction[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [summary, setSummary] = useState({
    currentBalance: 0,
    currency: "CVT",
    totalTransactions: 0,
    statistics: {
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalSpent: 0,
      totalReceived: 0,
    },
  });

  // Load transactions from API
  useEffect(() => {
    loadTransactions(1);
  }, [filterType]);

  const loadTransactions = async (page: number) => {
    try {
      setLoading(true);
      const response = await getTransactionHistory(page, 20);

      if (response.success) {
        setTransactions(response.data);
        setPagination(response.pagination);
        setSummary(response.summary);
      } else {
        toast.error("Failed to load transactions");
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Map transaction type to credit/debit
  const getTransactionDisplayType = (type: string): "credit" | "debit" => {
    const creditTypes = ["deposit", "transfer_in", "refund", "sale"];
    return creditTypes.includes(type) ? "credit" : "debit";
  };

  // Filter transactions by search and type
  const filteredTransactions = transactions.filter((tx) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.metadata?.blockchainTxId?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const displayType = getTransactionDisplayType(tx.type);
    const matchesType =
      filterType === "all" ||
      displayType === filterType ||
      tx.status === filterType;

    return matchesSearch && matchesType;
  });

  // Calculate stats from summary
  const totalTransactions = summary.totalTransactions;
  const totalCredit = summary.statistics.totalReceived + summary.statistics.totalDeposited;
  const totalDebit = summary.statistics.totalSpent + summary.statistics.totalWithdrawn;
  const pendingCount = transactions.filter((tx) => tx.status === "pending").length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
        );
      case "pending":
        return (
          <ClockIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        );
      case "failed":
        return (
          <XCircleIcon className="h-4 w-4 text-red-600 dark:text-red-400" />
        );
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 dark:text-green-400";
      case "pending":
        return "text-yellow-600 dark:text-yellow-400";
      case "failed":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const handleExport = () => {
    // Export functionality
    toast.success("Exporting transactions...");
  };

  const handlePageChange = (newPage: number) => {
    loadTransactions(newPage);
  };

  // Get from/to for transaction display
  const getTransactionParties = (tx: BackendTransaction) => {
    const displayType = getTransactionDisplayType(tx.type);

    if (displayType === "credit") {
      // Money coming in
      const from = tx.metadata?.senderName || tx.metadata?.buyerName || "External";
      const to = "Your Wallet";
      return { from, to };
    } else {
      // Money going out
      const from = "Your Wallet";
      const to = tx.metadata?.recipientName || tx.metadata?.sellerName || "External";
      return { from, to };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Breadcrumb */}
      <div className="border-b border-gray-200 dark:border-gray-800">
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
              Transactions
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
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  Activity History
                </p>
              </div>
              <h1 className="text-5xl font-extralight text-gray-900 dark:text-white tracking-tight">
                Transactions
              </h1>
            </div>

            <button
              onClick={handleExport}
              className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Total Transactions
              </p>
              <p className="text-3xl font-extralight text-gray-900 dark:text-white">
                {totalTransactions}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Total Received
              </p>
              <p className="text-3xl font-extralight text-green-600 dark:text-green-400">
                ${totalCredit.toFixed(2)}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Total Spent
              </p>
              <p className="text-3xl font-extralight text-gray-900 dark:text-white">
                ${totalDebit.toFixed(2)}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Pending
              </p>
              <p className="text-3xl font-extralight text-yellow-600 dark:text-yellow-400">
                {pendingCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="py-8 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-600" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-8 pr-4 border-b border-gray-900 dark:border-white bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterType("all")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  filterType === "all"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType("credit")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  filterType === "credit"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Received
              </button>
              <button
                onClick={() => setFilterType("debit")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  filterType === "debit"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Sent
              </button>
              <button
                onClick={() => setFilterType("pending")}
                className={`h-11 px-6 uppercase tracking-[0.2em] text-[10px] font-medium transition-colors ${
                  filterType === "pending"
                    ? "bg-black dark:bg-white text-white dark:text-black"
                    : "border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white"
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Transactions List */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          {filteredTransactions.length > 0 ? (
            <>
              <div className="space-y-0 border border-gray-200 dark:border-gray-800">
                {filteredTransactions.map((transaction, index) => {
                  const displayType = getTransactionDisplayType(transaction.type);
                  const parties = getTransactionParties(transaction);
                  const category = transaction.metadata?.category || transaction.type.replace(/_/g, " ");

                  return (
                    <div
                      key={transaction._id}
                      className={`p-8 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
                        index !== filteredTransactions.length - 1
                          ? "border-b border-gray-200 dark:border-gray-800"
                          : ""
                      }`}
                      onClick={() =>
                        router.push(`/customer/transactions/${transaction._id}`)
                      }
                    >
                      <div className="flex items-start justify-between gap-8">
                        {/* Left Section */}
                        <div className="flex items-start gap-6 flex-1">
                          {/* Icon */}
                          <div
                            className={`h-12 w-12 flex items-center justify-center shrink-0 ${
                              displayType === "credit"
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-gray-100 dark:bg-gray-900"
                            }`}
                          >
                            {displayType === "credit" ? (
                              <ArrowDownIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowUpIcon className="h-5 w-5 text-gray-900 dark:text-white" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {transaction.description}
                              </h3>
                              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {category}
                              </span>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatDate(transaction.timestamp)}</span>
                              <span>•</span>
                              <span>{formatTime(transaction.timestamp)}</span>
                              <span>•</span>
                              <span className="font-mono">{transaction._id.slice(0, 8)}</span>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">
                                From:
                              </span>
                              <span className="text-gray-900 dark:text-white">
                                {parties.from}
                              </span>
                              <ChevronRightIcon className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-900 dark:text-white">
                                {parties.to}
                              </span>
                            </div>

                            {transaction.metadata?.blockchainTxId && (
                              <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
                                {transaction.metadata.blockchainTxId}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Section */}
                        <div className="text-right space-y-2 shrink-0">
                          <p
                            className={`text-lg font-normal ${
                              displayType === "credit"
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-900 dark:text-white"
                            }`}
                          >
                            {displayType === "credit" ? "+" : "-"}
                            {formatCVT(transaction.amount)}
                          </p>
                          <div
                            className={`flex items-center justify-end gap-1.5 text-xs ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {getStatusIcon(transaction.status)}
                            <span className="capitalize">{transaction.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {pagination.currentPage} of {pagination.totalPages} • {pagination.totalItems} total transactions
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage}
                      className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-6 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white px-6 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:border-black dark:hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-32 border border-gray-200 dark:border-gray-800">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extralight text-gray-900 dark:text-white">
                    No Transactions Found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Try adjusting your search or filters
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
