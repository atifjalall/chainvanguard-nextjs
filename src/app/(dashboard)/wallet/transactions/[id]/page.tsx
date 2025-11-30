/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  HashtagIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  CubeIcon,
  WalletIcon,
  EyeIcon,
  CheckIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function WalletTransactionDetailPage() {
  usePageTitle("Transaction Details");
  const router = useRouter();
  const params = useParams();
  const transactionId = (params?.id as string) || "";
  const { transactions: walletTransactions } = useWallet();

  const [transaction, setTransaction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Load transaction data
  useEffect(() => {
    const loadTransaction = () => {
      try {
        setLoading(true);
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

        const foundTransaction = transactions.find(
          (tx: any) => tx.id === transactionId
        );

        if (foundTransaction) {
          setTransaction(foundTransaction);
          setIsDetailsOpen(true);
        } else {
          toast.error("Transaction not found");
          router.push("/wallet/transactions");
        }
      } catch (error) {
        console.error("Error loading transaction:", error);
        toast.error("Failed to load transaction details");
        router.push("/wallet/transactions");
      } finally {
        setLoading(false);
      }
    };

    if (transactionId && walletTransactions) {
      loadTransaction();
    }
  }, [transactionId, walletTransactions, router]);

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatCVT = (amount: number): string => {
    return `CVT ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "pending":
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return badgeColors.green;
      case "pending":
        return badgeColors.yellow;
      case "failed":
        return badgeColors.red;
      default:
        return badgeColors.grey;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "deposit":
      case "received":
        return badgeColors.green;
      case "withdrawal":
        return badgeColors.red;
      case "payment":
        return badgeColors.blue;
      default:
        return badgeColors.grey;
    }
  };

  const getTypeIcon = (type: string) => {
    const badgeColor = getTypeBadgeColor(type);
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

  if (loading) {
    return (
      <div className={`min-h-screen ${colors.backgrounds.secondary} flex items-center justify-center`}>
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
    return null;
  }

  const isCredit = ["deposit", "received"].includes(transaction.type);
  const typeBadgeColor = getTypeBadgeColor(transaction.type);

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
              <BreadcrumbLink href="/wallet/transactions">
                Transactions
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Details</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              Transaction Details
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              View detailed information about this transaction
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/wallet/transactions")}
            className={`flex items-center gap-2 px-4 h-10 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:border-black dark:hover:border-white text-xs`}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Transactions
          </Button>
        </div>

        {/* Transaction Details Modal */}
        <Dialog open={isDetailsOpen} onOpenChange={(open) => {
          if (!open) {
            router.push("/wallet/transactions");
          }
        }}>
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
                            {transaction.id}
                          </p>
                          <button
                            onClick={() => copyToClipboard(transaction.id, "Transaction ID")}
                            className="shrink-0"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Type</p>
                        <Badge
                          className={`${typeBadgeColor.bg} ${typeBadgeColor.border} ${typeBadgeColor.text} text-xs rounded-none mt-1 flex items-center gap-1 w-fit`}
                        >
                          {getTypeIcon(transaction.type)}
                          {transaction.type}
                        </Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Date & Time</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {formatDate(transaction.timestamp)} at {formatTime(transaction.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Amount
                        </p>
                        <p
                          className={`font-bold text-lg mt-1 ${
                            isCredit
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {isCredit ? "+" : "-"}
                          {formatCVT(transaction.amount)}
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
                          className={`${getBadgeColor(transaction.status).bg} ${getBadgeColor(transaction.status).border} ${getBadgeColor(transaction.status).text} text-xs rounded-none mt-1 flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(transaction.status)}
                          {transaction.status}
                        </Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Description
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm mt-1`}
                        >
                          {transaction.description}
                        </p>
                      </div>
                      {transaction.category && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Category
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm capitalize mt-1`}
                          >
                            {transaction.category}
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
                          {isCredit ? "Money Received" : "Money Sent"}
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
                          {transaction.txHash || transaction.id}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard(
                              transaction.txHash || transaction.id,
                              "Transaction hash"
                            )
                          }
                          className={`h-8 w-8 p-0 ${colors.buttons.outline} cursor-pointer rounded-none transition-all hover:border-black dark:hover:border-white shrink-0`}
                        >
                          {copiedHash === (transaction.txHash || transaction.id) ? (
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
                          className={`${transaction.status === "completed" ? badgeColors.blue.bg + " " + badgeColors.blue.border + " " + badgeColors.blue.text : badgeColors.yellow.bg + " " + badgeColors.yellow.border + " " + badgeColors.yellow.text} text-xs rounded-none mt-1`}
                        >
                          {transaction.status === "completed"
                            ? "Verified"
                            : "Pending"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Notice */}
                {transaction.status === "completed" && (
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
                    onClick={() => router.push("/wallet/transactions")}
                    className={`${colors.buttons.outline} rounded-none transition-all hover:border-black dark:hover:border-white w-24 cursor-pointer`}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
