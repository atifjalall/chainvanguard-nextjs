"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

// Mock transaction detail - in real app, fetch by ID
const MOCK_TRANSACTION = {
  id: "TX002",
  type: "debit",
  amount: 89.99,
  description: "Purchase - Classic Denim Jacket",
  category: "Purchase",
  date: "2024-01-14T15:45:00",
  status: "completed",
  txHash: "0x2345678901bcdef2345678901bcdef23456789012345678901bcdef234567890",
  blockNumber: 1234567,
  confirmations: 24,
  gasUsed: "0.00012 ETH",
  from: {
    name: "Your Wallet",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
  },
  to: {
    name: "Vendor: Fashion Store",
    address: "0x89abcdef0123456789abcdef0123456789abcdef",
  },
  product: {
    name: "Classic Denim Jacket",
    sku: "DENIM-001",
    quantity: 1,
    price: 89.99,
  },
  timeline: [
    {
      status: "initiated",
      label: "Transaction Initiated",
      timestamp: "2024-01-14T15:45:00",
      completed: true,
    },
    {
      status: "pending",
      label: "Pending Confirmation",
      timestamp: "2024-01-14T15:45:30",
      completed: true,
    },
    {
      status: "confirmed",
      label: "Blockchain Confirmed",
      timestamp: "2024-01-14T15:46:00",
      completed: true,
    },
    {
      status: "completed",
      label: "Transaction Completed",
      timestamp: "2024-01-14T15:46:30",
      completed: true,
    },
  ],
  metadata: {
    network: "Hyperledger Fabric",
    channel: "supply-chain",
    chaincode: "payment-contract",
    endorsers: 3,
  },
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const transactionId = params?.id || "TX002";

  const [transaction] = useState(MOCK_TRANSACTION);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDownloadReceipt = () => {
    toast.success("Downloading receipt...");
  };

  const handleViewOnBlockchain = () => {
    toast.success("Opening blockchain explorer...");
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case "completed":
        return (
          <CheckCircleIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
        );
      case "pending":
        return (
          <ClockIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
        );
      case "failed":
        return (
          <XCircleIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
        );
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (transaction.status) {
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
            <button
              onClick={() => router.push("/customer/transactions")}
              className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Transactions
            </button>
            <ChevronRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-600" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-900 dark:text-white">
              {transaction.id}
            </span>
          </div>
        </div>
      </div>

      {/* Header */}
      <section className="py-16 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="flex items-start justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-px w-16 bg-gray-300 dark:bg-gray-700" />
                <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400">
                  Transaction Details
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div
                  className={`h-16 w-16 flex items-center justify-center ${
                    transaction.type === "credit"
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-gray-100 dark:bg-gray-900"
                  }`}
                >
                  {transaction.type === "credit" ? (
                    <ArrowDownIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                  )}
                </div>

                <div>
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    {transaction.type === "credit" ? "+" : "-"}$
                    {transaction.amount.toFixed(2)}
                  </h1>
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <span className={`text-sm capitalize ${getStatusColor()}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownloadReceipt}
                className="border border-black dark:border-white text-black dark:text-white px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Receipt
              </button>
              <button
                onClick={handleViewOnBlockchain}
                className="bg-black dark:bg-white text-white dark:text-black px-8 h-11 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                View on Blockchain
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-[1600px] mx-auto px-12 lg:px-16">
          <div className="grid lg:grid-cols-3 gap-16">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              {/* Transaction Information */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Transaction Information
                </h2>

                <div className="border border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-2 gap-0">
                    <div className="p-6 border-b border-r border-gray-200 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Transaction ID
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white font-mono">
                        {transaction.id}
                      </p>
                    </div>

                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Category
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {transaction.category}
                      </p>
                    </div>

                    <div className="p-6 border-r border-gray-200 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Date
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(transaction.date)}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Time
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatTime(transaction.date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* From/To Addresses */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Transaction Flow
                </h2>

                <div className="space-y-6">
                  {/* From */}
                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                          From
                        </p>
                        <p className="text-lg font-normal text-gray-900 dark:text-white">
                          {transaction.from.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {transaction.from.address}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(transaction.from.address, "Address")
                        }
                        className="h-10 w-10 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white flex items-center justify-center transition-colors"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="h-12 w-12 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                      <ArrowDownIcon className="h-6 w-6 text-gray-900 dark:text-white" />
                    </div>
                  </div>

                  {/* To */}
                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                          To
                        </p>
                        <p className="text-lg font-normal text-gray-900 dark:text-white">
                          {transaction.to.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {transaction.to.address}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          copyToClipboard(transaction.to.address, "Address")
                        }
                        className="h-10 w-10 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white flex items-center justify-center transition-colors"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details (if purchase) */}
              {transaction.product && (
                <div>
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                    Purchase Details
                  </h2>

                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="space-y-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            {transaction.product.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            SKU: {transaction.product.sku}
                          </p>
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          ${transaction.product.price.toFixed(2)}
                        </p>
                      </div>

                      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Quantity
                        </span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {transaction.product.quantity}
                        </span>
                      </div>

                      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          Total
                        </span>
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          ${transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Timeline */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Transaction Timeline
                </h2>

                <div className="border border-gray-200 dark:border-gray-800 p-8">
                  <div className="space-y-8">
                    {transaction.timeline.map((step, index) => (
                      <div key={step.status} className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-8 w-8 flex items-center justify-center ${
                              step.completed
                                ? "bg-green-50 dark:bg-green-900/20"
                                : "bg-gray-100 dark:bg-gray-900"
                            }`}
                          >
                            {step.completed ? (
                              <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full" />
                            )}
                          </div>
                          {index !== transaction.timeline.length - 1 && (
                            <div
                              className={`w-px h-12 ${
                                step.completed
                                  ? "bg-green-600 dark:bg-green-400"
                                  : "bg-gray-200 dark:bg-gray-800"
                              }`}
                            />
                          )}
                        </div>

                        <div className="flex-1 pb-8">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                            {step.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(step.timestamp)} at{" "}
                            {formatTime(step.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Blockchain Details */}
              <div className="border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <CubeIcon className="h-5 w-5 text-gray-900 dark:text-white opacity-70" />
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      Blockchain Details
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Transaction Hash
                      </p>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-gray-900 dark:text-white font-mono break-all">
                          {formatAddress(transaction.txHash)}
                        </p>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              transaction.txHash,
                              "Transaction hash"
                            )
                          }
                          className="flex-shrink-0"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Block Number
                      </p>
                      <p className="text-xs text-gray-900 dark:text-white font-mono">
                        #{transaction.blockNumber}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Confirmations
                      </p>
                      <p className="text-xs text-gray-900 dark:text-white">
                        {transaction.confirmations}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        Gas Used
                      </p>
                      <p className="text-xs text-gray-900 dark:text-white">
                        {transaction.gasUsed}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Information */}
              <div className="border border-gray-200 dark:border-gray-800 p-8">
                <div className="space-y-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                    Network Information
                  </p>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Network
                      </span>
                      <span className="text-xs text-gray-900 dark:text-white">
                        {transaction.metadata.network}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Channel
                      </span>
                      <span className="text-xs text-gray-900 dark:text-white">
                        {transaction.metadata.channel}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Chaincode
                      </span>
                      <span className="text-xs text-gray-900 dark:text-white font-mono">
                        {transaction.metadata.chaincode}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Endorsers
                      </span>
                      <span className="text-xs text-gray-900 dark:text-white">
                        {transaction.metadata.endorsers}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Status */}
              <div className="border border-gray-200 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-900">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                        Blockchain Verified
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        This transaction has been verified and recorded on the
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
    </div>
  );
}
