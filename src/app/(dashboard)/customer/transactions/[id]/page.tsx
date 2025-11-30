"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  DocumentDuplicateIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import { getTransactionById, BackendTransaction } from "@/lib/api/wallet.api";
import { formatCVT } from "@/utils/currency";

export default function TransactionDetailPage() {
  usePageTitle("Transaction Details");
  const router = useRouter();
  const params = useParams();
  const transactionId = (params?.id as string) || "";

  const [transaction, setTransaction] = useState<BackendTransaction | null>(null);
  const [loading, setLoading] = useState(true);

  // Load transaction data
  useEffect(() => {
    const loadTransaction = async () => {
      try {
        setLoading(true);
        const response = await getTransactionById(transactionId);

        if (response.success && response.data) {
          setTransaction(response.data);
        } else {
          toast.error("Failed to load transaction details");
          router.push("/customer/transactions");
        }
      } catch (error) {
        console.error("Error loading transaction:", error);
        toast.error("Failed to load transaction details");
        router.push("/customer/transactions");
      } finally {
        setLoading(false);
      }
    };

    if (transactionId) {
      loadTransaction();
    }
  }, [transactionId, router]);

  // Helper functions
  const getTransactionDisplayType = (type: string): "credit" | "debit" => {
    const creditTypes = ["deposit", "transfer_in", "refund", "sale"];
    return creditTypes.includes(type) ? "credit" : "debit";
  };

  const getTransactionParties = (tx: BackendTransaction) => {
    const displayType = getTransactionDisplayType(tx.type);

    if (displayType === "credit") {
      // Money coming in (refunds, sales, transfers)
      let from = "External Source";
      let fromAddress = "N/A";

      if (tx.type === "refund") {
        from = tx.metadata?.storeName || tx.metadata?.vendorName || "Store";
        fromAddress = tx.metadata?.vendorWallet || "N/A";
      } else if (tx.type === "sale") {
        from = tx.metadata?.buyerName || tx.metadata?.customerName || "Customer";
        fromAddress = tx.metadata?.buyerWallet || tx.metadata?.buyerWalletAddress || "N/A";
      } else if (tx.type === "transfer_in") {
        from = tx.metadata?.senderName || "User";
        fromAddress = tx.metadata?.senderWallet || "N/A";
      } else if (tx.type === "deposit") {
        from = tx.metadata?.paymentMethod
          ? `Payment via ${tx.metadata.paymentMethod}${tx.metadata.cardLast4 ? ` (****${tx.metadata.cardLast4})` : ''}`
          : "Payment Source";
        fromAddress = "N/A";
      }

      const to = "Your Wallet";
      const toAddress = "Your Account";
      return { from, fromAddress, to, toAddress };
    } else {
      // Money going out (payments, withdrawals, transfers)
      const from = "Your Wallet";
      const fromAddress = "Your Account";
      let to = "External Recipient";
      let toAddress = "N/A";

      if (tx.type === "payment") {
        to = tx.metadata?.storeName || tx.metadata?.vendorName || tx.metadata?.sellerName || "Store";
        toAddress = tx.metadata?.vendorWallet || tx.metadata?.sellerWalletAddress || "N/A";

        // Add product name if available
        if (tx.metadata?.productName) {
          to = `${to} (${tx.metadata.productName})`;
        }
      } else if (tx.type === "withdrawal") {
        const method = tx.metadata?.withdrawalMethod || "Bank Account";
        const account = tx.metadata?.accountNumber
          ? ` (****${String(tx.metadata.accountNumber).slice(-4)})`
          : "";
        to = `${method}${account}`;
        toAddress = "N/A";
      } else if (tx.type === "transfer_out") {
        to = tx.metadata?.recipientName || "User";
        toAddress = tx.metadata?.recipientWallet || "N/A";
      }

      return { from, fromAddress, to, toAddress };
    }
  };

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
    if (!address || address === "N/A") return address;
    if (address.length < 18) return address;
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading transaction details...
          </p>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transaction not found
          </p>
        </div>
      </div>
    );
  }

  const displayType = getTransactionDisplayType(transaction.type);
  const parties = getTransactionParties(transaction);
  const category = transaction.metadata?.category || transaction.type.replace(/_/g, " ");

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
              {transaction._id.slice(0, 8)}
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
                    displayType === "credit"
                      ? "bg-green-50 dark:bg-green-900/20"
                      : "bg-gray-100 dark:bg-gray-900"
                  }`}
                >
                  {displayType === "credit" ? (
                    <ArrowDownIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpIcon className="h-8 w-8 text-gray-900 dark:text-white" />
                  )}
                </div>

                <div>
                  <h1 className="text-4xl font-extralight text-gray-900 dark:text-white tracking-tight mb-2">
                    {displayType === "credit" ? "+" : "-"}
                    {formatCVT(transaction.amount)}
                  </h1>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(transaction.status)}
                    <span className={`text-sm capitalize ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              </div>
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
                        {transaction._id}
                      </p>
                    </div>

                    <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Category
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white capitalize">
                        {category}
                      </p>
                    </div>

                    <div className="p-6 border-r border-gray-200 dark:border-gray-800">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Date
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatDate(transaction.timestamp)}
                      </p>
                    </div>

                    <div className="p-6">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400 mb-3">
                        Time
                      </p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {formatTime(transaction.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Description
                </h2>

                <div className="border border-gray-200 dark:border-gray-800 p-8">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {transaction.description}
                  </p>
                </div>
              </div>

              {/* From/To */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Transaction Flow
                </h2>

                <div className="space-y-6">
                  {/* From */}
                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                          From
                        </p>
                        <p className="text-lg font-normal text-gray-900 dark:text-white">
                          {parties.from}
                        </p>
                        {parties.fromAddress !== "N/A" && parties.fromAddress !== "Your Account" && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                            {parties.fromAddress}
                          </p>
                        )}
                      </div>
                      {parties.fromAddress !== "N/A" && parties.fromAddress !== "Your Account" && (
                        <button
                          onClick={() =>
                            copyToClipboard(parties.fromAddress, "Address")
                          }
                          className="h-10 w-10 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white flex items-center justify-center transition-colors ml-4 shrink-0"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                        </button>
                      )}
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
                      <div className="space-y-3 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                          To
                        </p>
                        <p className="text-lg font-normal text-gray-900 dark:text-white">
                          {parties.to}
                        </p>
                        {parties.toAddress !== "N/A" && parties.toAddress !== "Your Account" && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono break-all">
                            {parties.toAddress}
                          </p>
                        )}
                      </div>
                      {parties.toAddress !== "N/A" && parties.toAddress !== "Your Account" && (
                        <button
                          onClick={() =>
                            copyToClipboard(parties.toAddress, "Address")
                          }
                          className="h-10 w-10 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white flex items-center justify-center transition-colors ml-4 shrink-0"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4 text-gray-900 dark:text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Reference */}
              {transaction.relatedOrderId && (
                <div>
                  <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                    Related Order
                  </h2>

                  <div className="border border-gray-200 dark:border-gray-800 p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Order Reference
                        </p>
                        <p className="text-sm text-gray-900 dark:text-white font-mono">
                          {transaction.metadata?.orderReference || transaction.relatedOrderId}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push(`/customer/orders/${transaction.relatedOrderId}`)}
                        className="border border-black dark:border-white text-black dark:text-white px-6 h-10 uppercase tracking-[0.2em] text-[10px] font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                      >
                        View Order
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Balance Change */}
              <div>
                <h2 className="text-2xl font-extralight text-gray-900 dark:text-white tracking-tight mb-8">
                  Balance Impact
                </h2>

                <div className="border border-gray-200 dark:border-gray-800 p-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Balance Before
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {formatCVT(transaction.balanceBefore)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Transaction Amount
                      </span>
                      <span className={`text-sm font-medium ${displayType === "credit" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {displayType === "credit" ? "+" : "-"}{formatCVT(transaction.amount)}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        Balance After
                      </span>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        {formatCVT(transaction.balanceAfter)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Blockchain Details */}
              {transaction.metadata?.blockchainTxId && (
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
                            {formatAddress(transaction.metadata.blockchainTxId)}
                          </p>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                transaction.metadata?.blockchainTxId || "",
                                "Transaction hash"
                              )
                            }
                            className="shrink-0"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                        Hyperledger Fabric
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Status
                      </span>
                      <span className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                        {transaction.status}
                      </span>
                    </div>
                    {transaction.metadata?.txHash && (
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Internal TX Hash
                        </p>
                        <p className="text-xs text-gray-900 dark:text-white font-mono break-all">
                          {formatAddress(transaction.metadata.txHash)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Network Status */}
              {transaction.status === "completed" && (
                <div className="border border-gray-200 dark:border-gray-800 p-8 bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
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
              )}

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
