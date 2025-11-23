"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
import { usePageTitle } from "@/hooks/use-page-title";
  ChevronRightIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

// Mock Transaction Data
const MOCK_TRANSACTIONS = [
  {
    id: "TX001",
    type: "credit",
    amount: 500.0,
    description: "Added Funds",
    category: "Deposit",
    date: "2024-01-15T10:30:00",
    status: "completed",
    txHash: "0x1234567890abcdef1234567890abcdef12345678",
    from: "Bank Account",
    to: "Your Wallet",
  },
  {
    id: "TX002",
    type: "debit",
    amount: 89.99,
    description: "Purchase - Classic Denim Jacket",
    category: "Purchase",
    date: "2024-01-14T15:45:00",
    status: "completed",
    txHash: "0x2345678901bcdef2345678901bcdef23456789",
    from: "Your Wallet",
    to: "Vendor: Fashion Store",
  },
  {
    id: "TX003",
    type: "debit",
    amount: 29.99,
    description: "Purchase - Premium Cotton T-Shirt",
    category: "Purchase",
    date: "2024-01-12T09:15:00",
    status: "completed",
    txHash: "0x3456789012cdef3456789012cdef34567890",
    from: "Your Wallet",
    to: "Vendor: Style Hub",
  },
  {
    id: "TX004",
    type: "credit",
    amount: 50.0,
    description: "Refund - Summer Dress",
    category: "Refund",
    date: "2024-01-10T14:20:00",
    status: "completed",
    txHash: "0x4567890123def4567890123def45678901",
    from: "Vendor: Fashion Store",
    to: "Your Wallet",
  },
  {
    id: "TX005",
    type: "debit",
    amount: 79.99,
    description: "Purchase - Casual Sneakers",
    category: "Purchase",
    date: "2024-01-08T11:30:00",
    status: "pending",
    txHash: "0x5678901234ef5678901234ef56789012",
    from: "Your Wallet",
    to: "Vendor: Shoe Palace",
  },
  {
    id: "TX006",
    type: "debit",
    amount: 149.99,
    description: "Purchase - Leather Jacket",
    category: "Purchase",
    date: "2024-01-05T16:00:00",
    status: "completed",
    txHash: "0x6789012345f6789012345f67890123",
    from: "Your Wallet",
    to: "Vendor: Premium Outfits",
  },
  {
    id: "TX007",
    type: "credit",
    amount: 300.0,
    description: "Added Funds",
    category: "Deposit",
    date: "2024-01-03T08:45:00",
    status: "completed",
    txHash: "0x7890123456789012345678901234567890",
    from: "Bank Account",
    to: "Your Wallet",
  },
  {
    id: "TX008",
    type: "debit",
    amount: 39.99,
    description: "Purchase - Sports Watch",
    category: "Purchase",
    date: "2024-01-02T13:20:00",
    status: "failed",
    txHash: "0x8901234567890123456789012345678901",
    from: "Your Wallet",
    to: "Vendor: Tech Accessories",
  },
];

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
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [showFilters, setShowFilters] = useState(false);

  // Filter transactions
  const filteredTransactions = MOCK_TRANSACTIONS.filter((tx) => {
    // Search filter
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.txHash.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType =
      filterType === "all" ||
      tx.type === filterType ||
      tx.status === filterType;

    return matchesSearch && matchesType;
  });

  // Calculate stats
  const totalTransactions = filteredTransactions.length;
  const totalCredit = filteredTransactions
    .filter((tx) => tx.type === "credit" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalDebit = filteredTransactions
    .filter((tx) => tx.type === "debit" && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const pendingCount = filteredTransactions.filter(
    (tx) => tx.status === "pending"
  ).length;

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
            <div className="space-y-0 border border-gray-200 dark:border-gray-800">
              {filteredTransactions.map((transaction, index) => (
                <div
                  key={transaction.id}
                  className={`p-8 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer ${
                    index !== filteredTransactions.length - 1
                      ? "border-b border-gray-200 dark:border-gray-800"
                      : ""
                  }`}
                  onClick={() =>
                    router.push(`/customer/transactions/${transaction.id}`)
                  }
                >
                  <div className="flex items-start justify-between gap-8">
                    {/* Left Section */}
                    <div className="flex items-start gap-6 flex-1">
                      {/* Icon */}
                      <div
                        className={`h-12 w-12 flex items-center justify-center flex-shrink-0 ${
                          transaction.type === "credit"
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "bg-gray-100 dark:bg-gray-900"
                        }`}
                      >
                        {transaction.type === "credit" ? (
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
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatDate(transaction.date)}</span>
                          <span>•</span>
                          <span>{formatTime(transaction.date)}</span>
                          <span>•</span>
                          <span className="font-mono">{transaction.id}</span>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500 dark:text-gray-400">
                            From:
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            {transaction.from}
                          </span>
                          <ChevronRightIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {transaction.to}
                          </span>
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
                          {transaction.txHash}
                        </p>
                      </div>
                    </div>

                    {/* Right Section */}
                    <div className="text-right space-y-2 flex-shrink-0">
                      <p
                        className={`text-lg font-normal ${
                          transaction.type === "credit"
                            ? "text-green-600 dark:text-green-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}$
                        {transaction.amount.toFixed(2)}
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
              ))}
            </div>
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
