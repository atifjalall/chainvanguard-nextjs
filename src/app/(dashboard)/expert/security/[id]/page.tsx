/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowPathIcon,
  ArrowLeftIcon,
  UserIcon,
  WalletIcon,
  BanknotesIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { apiClient } from "@/lib/api/client";
import { badgeColors, colors } from "@/lib/colorConstants";
import { useRouter } from "next/navigation";
import { formatCurrency as formatCurrencyUtil } from "@/utils/currency";
import { usePageTitle } from "@/hooks/use-page-title";
import { Loader2 } from "lucide-react";

interface UserDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  wallet?: any;
  pagination?: {
    totalPages?: number;
    [key: string]: any;
  };
};

const isApiResponse = (obj: unknown): obj is ApiResponse => {
  return !!obj && typeof obj === "object" && "success" in (obj as any);
};

const normalizeApiResponse = <T = any,>(
  res: unknown
): ApiResponse<T> | undefined => {
  if (!res) return undefined;
  // If it already has the success key, assume it's the API response
  if (isApiResponse(res)) return res as ApiResponse<T>;

  // If it's an array, treat it as a successful data array
  if (Array.isArray(res))
    return { success: true, data: res as any } as ApiResponse<T>;

  // If it's an object with data/wallet or shape similar to response, wrap it
  if (typeof res === "object") {
    const asAny = res as any;
    if ("data" in asAny || "wallet" in asAny) {
      return {
        success: true,
        data: asAny.data || asAny,
        wallet: asAny.wallet,
      } as ApiResponse<T>;
    }
  }

  return undefined;
};

export default function UserDetailPage({ params }: UserDetailPageProps) {
  usePageTitle("User Details");
  const router = useRouter();
  const { id: userId } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [walletData, setWalletData] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [blockchainLogs, setBlockchainLogs] = useState<any[]>([]);

  // Filters
  const [selectedTab, setSelectedTab] = useState("wallet");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setIsVisible(true);
    loadUserData();
  }, [userId, selectedTab, currentPage, filterType, filterStatus, searchTerm]);

  const loadUserData = async () => {
    try {
      setIsLoading(true);

      // Load user details
      const userResponseRaw = await apiClient.get(`/auth/users/${userId}`);
      const userResponse = normalizeApiResponse<any>(userResponseRaw);
      if (userResponse?.success) {
        setUserData(userResponse.data);
      }

      // Load wallet data using expertApi endpoint (fallbacks handled inside expertApi)
      const walletResponseRaw = await expertApi.getWalletByUserId(userId);
      let walletResponse = normalizeApiResponse<any>(walletResponseRaw) || {
        success: false,
        message: "Unknown wallet response",
      };

      // If the expertApi helper returned a structured failure, try direct /wallet route as last fallback
      if (!walletResponse?.success) {
        try {
          const fallbackRaw = await apiClient.get(`/wallet/${userId}`);
          const fallback = normalizeApiResponse<any>(fallbackRaw);
          if (fallback?.success) {
            walletResponse = fallback;
          } else {
            walletResponse = {
              success: false,
              message:
                fallback?.message ||
                (fallbackRaw && (fallbackRaw as any).message) ||
                "Wallet not found",
            };
          }
        } catch (fallbackErr) {
          walletResponse = {
            success: false,
            message: (fallbackErr as any)?.message || "Failed to fetch wallet",
          };
        }
      }

      if (walletResponse?.success) {
        setWalletData(walletResponse.data || walletResponse.wallet);

        // Set wallet transactions if available
        const walletTx =
          walletResponse.data?.transactions ||
          walletResponse.wallet?.transactions ||
          [];
        if (Array.isArray(walletTx)) {
          setTransactions(walletTx);
        }
      } else {
        // graceful fallback: keep walletData null but don't throw
        console.warn("Could not load wallet:", walletResponse?.message);
      }

      // Load blockchain transactions for this user
      if (selectedTab === "blockchain") {
        const blockchainResponseRaw = await expertApi.getAllTransactions({
          userId: userId,
          page: currentPage,
          limit: itemsPerPage,
          type: filterType !== "all" ? filterType : undefined,
          status: filterStatus !== "all" ? filterStatus : undefined,
          search: searchTerm || undefined,
        });

        const blockchainResponse =
          normalizeApiResponse<any>(blockchainResponseRaw) ||
          (Array.isArray(blockchainResponseRaw)
            ? ({
                success: true,
                data: blockchainResponseRaw,
              } as ApiResponse<any>)
            : { success: false });

        if (blockchainResponse.success) {
          const data = Array.isArray(blockchainResponse.data)
            ? blockchainResponse.data
            : blockchainResponse.data?.items || [];
          setBlockchainLogs(data);
          if (blockchainResponse.pagination) {
            setTotalPages(blockchainResponse.pagination.totalPages || 1);
          }
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    const typeColors: any = {
      deposit: badgeColors.green,
      withdrawal: badgeColors.red,
      transfer_in: badgeColors.blue,
      transfer_out: badgeColors.yellow,
      payment: badgeColors.purple,
      refund: badgeColors.green,
    };
    return typeColors[type] || badgeColors.blue;
  };

  const getStatusColor = (status: string) => {
    const statusColors: any = {
      completed: badgeColors.green,
      pending: badgeColors.yellow,
      failed: badgeColors.red,
      cancelled: badgeColors.grey,
      success: badgeColors.green,
    };
    return statusColors[status] || badgeColors.blue;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "expert":
        return badgeColors.purple;
      case "supplier":
        return badgeColors.blue;
      case "vendor":
        return badgeColors.green;
      case "customer":
        return badgeColors.yellow;
      default:
        return badgeColors.blue;
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter wallet transactions
  const filteredWalletTransactions = transactions.filter((tx) => {
    if (filterType !== "all" && tx.type !== filterType) return false;
    if (filterStatus !== "all" && tx.status !== filterStatus) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(search) ||
        tx.type?.toLowerCase().includes(search) ||
        tx.amount?.toString().includes(search)
      );
    }
    return true;
  });

  const paginatedWalletTx = filteredWalletTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading && !userData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading user details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative z-10 p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/expert">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/expert/security">
              Security & Access Control
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>User Details</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                {userData?.name || "User Details"}
              </h1>
            </div>
            <p className={`text-base ${colors.texts.secondary}`}>
              Complete transaction history and wallet details
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${getRoleColor(userData?.role).bg} ${getRoleColor(userData?.role).border} ${getRoleColor(userData?.role).text} text-xs rounded-none`}
              >
                {userData?.role}
              </Badge>
              <Badge
                className={`${
                  userData?.isActive
                    ? badgeColors.green.bg +
                      " " +
                      badgeColors.green.border +
                      " " +
                      badgeColors.green.text
                    : badgeColors.red.bg +
                      " " +
                      badgeColors.red.border +
                      " " +
                      badgeColors.red.text
                } text-xs rounded-none`}
              >
                {userData?.isActive ? "Active" : "Frozen"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadUserData}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* User Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card
          className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-xs font-medium ${colors.texts.secondary}`}
            >
              Wallet Balance
            </CardTitle>
            <WalletIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colors.texts.primary}`}>
              {formatCurrencyUtil(walletData?.balance || 0, "CVT")}
            </div>
            <p className={`text-xs ${colors.texts.muted} mt-1`}>
              {walletData?.currency || "CVT"}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-xs font-medium ${colors.texts.secondary}`}
            >
              Total Deposited
            </CardTitle>
            <ArrowDownIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colors.texts.primary}`}>
              {formatCurrencyUtil(walletData?.totalDeposited || 0, "CVT")}
            </div>
            <p className={`text-xs ${colors.texts.muted} mt-1`}>Lifetime</p>
          </CardContent>
        </Card>

        <Card
          className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-xs font-medium ${colors.texts.secondary}`}
            >
              Total Withdrawn
            </CardTitle>
            <ArrowUpIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colors.texts.primary}`}>
              {formatCurrencyUtil(walletData?.totalWithdrawn || 0, "CVT")}
            </div>
            <p className={`text-xs ${colors.texts.muted} mt-1`}>Lifetime</p>
          </CardContent>
        </Card>

        <Card
          className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle
              className={`text-xs font-medium ${colors.texts.secondary}`}
            >
              Total Transactions
            </CardTitle>
            <BanknotesIcon className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${colors.texts.primary}`}>
              {transactions.length || 0}
            </div>
            <p className={`text-xs ${colors.texts.muted} mt-1`}>All time</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Details Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              User Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <div
                  className={`text-xs font-medium ${colors.texts.secondary} mb-1`}
                >
                  Email
                </div>
                <div className={`text-sm ${colors.texts.primary}`}>
                  {userData?.email || "-"}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs font-medium ${colors.texts.secondary} mb-1`}
                >
                  Wallet Address
                </div>
                <div className={`text-sm ${colors.texts.primary} font-mono`}>
                  {walletData?.walletAddress
                    ? `${walletData.walletAddress.substring(0, 12)}...${walletData.walletAddress.substring(
                        walletData.walletAddress.length - 8
                      )}`
                    : "-"}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs font-medium ${colors.texts.secondary} mb-1`}
                >
                  Last Activity
                </div>
                <div className={`text-sm ${colors.texts.primary}`}>
                  {walletData?.lastActivity
                    ? formatDate(walletData.lastActivity)
                    : "-"}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs font-medium ${colors.texts.secondary} mb-1`}
                >
                  Member Since
                </div>
                <div className={`text-sm ${colors.texts.primary}`}>
                  {userData?.createdAt ? formatDate(userData.createdAt) : "-"}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs font-medium ${colors.texts.secondary} mb-1`}
                >
                  Daily Limit
                </div>
                <div className={`text-sm ${colors.texts.primary}`}>
                  {formatCurrencyUtil(
                    walletData?.dailyWithdrawalLimit || 0,
                    "CVT"
                  )}
                </div>
              </div>
              <div>
                <div
                  className={`text-xs font-medium ${colors.texts.secondary} mb-1`}
                >
                  Today&apos;s Withdrawn
                </div>
                <div className={`text-sm ${colors.texts.primary}`}>
                  {formatCurrencyUtil(walletData?.dailyWithdrawn || 0, "CVT")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="transform transition-all duration-700"
      >
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList
            className={`flex justify-center mx-auto ${colors.borders.primary} ${colors.backgrounds.tertiary} rounded-none p-0.5`}
          >
            <TabsTrigger
              value="wallet"
              className={`rounded-none flex-1 py-1.5 px-4 min-w-[150px] text-xs ${
                selectedTab === "wallet"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary}`
                  : colors.texts.secondary
              }`}
            >
              <WalletIcon className={`h-4 w-4 ${colors.icons.primary} mr-2`} />
              Wallet Transactions
            </TabsTrigger>

            <TabsTrigger
              value="blockchain"
              className={`rounded-none flex-1 py-1.5 px-4 min-w-[150px] text-xs ${
                selectedTab === "blockchain"
                  ? `${colors.backgrounds.primary} ${colors.texts.primary}`
                  : colors.texts.secondary
              }`}
            >
              <ShieldCheckIcon
                className={`h-4 w-4 ${colors.icons.primary} mr-2`}
              />
              Blockchain Logs
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle
                className={`text-lg font-semibold ${colors.texts.primary}`}
              >
                {selectedTab === "wallet"
                  ? "Wallet Transactions"
                  : "Blockchain Activity"}
              </CardTitle>
              <div className="lg:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-none text-xs"
                >
                  <FunnelIcon className="h-3 w-3 mr-2" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`${showFilters ? "block" : "hidden lg:block"}`}>
              <div className="relative w-full mb-4">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search transactions..."
                  className={`pl-10 rounded-none text-xs ${colors.inputs.base}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger
                    className={`w-full rounded-none text-xs ${colors.inputs.base}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Types
                    </SelectItem>
                    {selectedTab === "wallet" ? (
                      <>
                        <SelectItem value="deposit" className="text-xs">
                          Deposit
                        </SelectItem>
                        <SelectItem value="withdrawal" className="text-xs">
                          Withdrawal
                        </SelectItem>
                        <SelectItem value="transfer_in" className="text-xs">
                          Transfer In
                        </SelectItem>
                        <SelectItem value="transfer_out" className="text-xs">
                          Transfer Out
                        </SelectItem>
                        <SelectItem value="payment" className="text-xs">
                          Payment
                        </SelectItem>
                        <SelectItem value="refund" className="text-xs">
                          Refund
                        </SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="user-action" className="text-xs">
                          User Action
                        </SelectItem>
                        <SelectItem value="product-action" className="text-xs">
                          Product Action
                        </SelectItem>
                        <SelectItem value="order-action" className="text-xs">
                          Order Action
                        </SelectItem>
                        <SelectItem
                          value="inventory-action"
                          className="text-xs"
                        >
                          Inventory Action
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger
                    className={`w-full rounded-none text-xs ${colors.inputs.base}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">
                      All Status
                    </SelectItem>
                    <SelectItem value="completed" className="text-xs">
                      Completed
                    </SelectItem>
                    <SelectItem value="pending" className="text-xs">
                      Pending
                    </SelectItem>
                    <SelectItem value="failed" className="text-xs">
                      Failed
                    </SelectItem>
                    <SelectItem value="success" className="text-xs">
                      Success
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={colors.tables.header}>
                    <TableHead className="text-xs font-semibold">
                      Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Amount
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Description
                    </TableHead>
                    {selectedTab === "blockchain" && (
                      <TableHead className="text-xs font-semibold">
                        Action
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedTab === "wallet" ? (
                    paginatedWalletTx.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          <div className={`text-sm ${colors.texts.secondary}`}>
                            No transactions found
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedWalletTx.map((tx, index) => (
                        <TableRow
                          key={tx._id || index}
                          className={colors.tables.row}
                        >
                          <TableCell className="text-xs">
                            {formatDate(tx.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getTransactionTypeColor(tx.type).bg} ${
                                getTransactionTypeColor(tx.type).border
                              } ${getTransactionTypeColor(tx.type).text} text-xs rounded-none`}
                            >
                              {tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold">
                            {formatCurrencyUtil(Number(tx.amount) || 0, "CVT")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusColor(tx.status).bg} ${
                                getStatusColor(tx.status).border
                              } ${getStatusColor(tx.status).text} text-xs rounded-none`}
                            >
                              {tx.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {tx.description || "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )
                  ) : blockchainLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className={`text-sm ${colors.texts.secondary}`}>
                          No blockchain logs found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    blockchainLogs.map((log, index) => (
                      <TableRow
                        key={log.id || index}
                        className={colors.tables.row}
                      >
                        <TableCell className="text-xs">
                          {formatDate(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                          >
                            {log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          {log.transactionId?.substring(0, 12) || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(log.status).bg} ${
                              getStatusColor(log.status).border
                            } ${getStatusColor(log.status).text} text-xs rounded-none`}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.action || "-"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.executionTime ? `${log.executionTime}ms` : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className={`text-xs ${colors.texts.secondary}`}>
                  Page {currentPage} of {totalPages}
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        className={`cursor-pointer rounded-none ${
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      />
                    </PaginationItem>

                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className="cursor-pointer rounded-none"
                        >
                          {currentPage - 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationLink isActive className="rounded-none">
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>

                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(currentPage + 1)}
                          className="cursor-pointer rounded-none"
                        >
                          {currentPage + 1}
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        className={`cursor-pointer rounded-none ${
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }`}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
