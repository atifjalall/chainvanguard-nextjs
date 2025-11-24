/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  FunnelIcon,
  Squares2X2Icon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ClipboardDocumentIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";
import { useRouter } from "next/navigation";
import { formatCurrency, formatCurrencyAbbreviated } from "@/utils/currency";
import { usePageTitle } from "@/hooks/use-page-title";


export default function SecurityPage() {
  usePageTitle("Security & Access Control");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [securityData, setSecurityData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [disableReason, setDisableReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  // Unfreeze dialog state
  const [isUnfreezeOpen, setIsUnfreezeOpen] = useState(false);
  const [unfreezeReason, setUnfreezeReason] = useState("");
  const [isUnfreezeSubmitting, setIsUnfreezeSubmitting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // Tabs and sorting
  const [selectedTab, setSelectedTab] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadSecurityData();
  }, [
    currentPage,
    searchTerm,
    selectedStatus,
    selectedRole,
    sortBy,
    selectedTab,
  ]);

  const loadSecurityData = async () => {
    try {
      setIsLoading(true);

      // Load security overview
      const securityResponse = await expertApi.getSecurityOverview();
      if (securityResponse.success) {
        setSecurityData(securityResponse.data);
      }

      // Build balance filters based on selected tab
      let balanceMin: number | undefined;
      let balanceMax: number | undefined;

      if (selectedTab === "high_balance") {
        balanceMin = 1000;
      } else if (selectedTab === "low_balance") {
        balanceMax = 50;
      }

      // Load users with wallet information
      const walletsResponse = await expertApi.getSecurityWallets({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        role: selectedRole !== "all" ? selectedRole : undefined,
        sortBy: sortBy,
        sortOrder: "desc",
        balanceMin,
        balanceMax,
      });

      if (walletsResponse.success) {
        const walletsData = walletsResponse.data ?? [];
        const normalizedUsers = Array.isArray(walletsData) ? walletsData : [];
        setUsers(normalizedUsers);

        // Update pagination info
        if (walletsResponse.pagination) {
          setTotalPages(walletsResponse.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error("Error loading security data:", error);
      toast.error("Failed to load security data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableUser = async () => {
    if (!selectedUser || !disableReason.trim()) {
      toast.error("Please provide a reason for disabling this user");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await expertApi.disableUser(
        selectedUser.userId || selectedUser._id,
        disableReason
      );

      if (response.success) {
        toast.success("User wallet frozen successfully");
        setIsDisableOpen(false);
        setDisableReason("");
        setSelectedUser(null);
        loadSecurityData();
      } else {
        toast.error(response.message || "Failed to freeze wallet");
      }
    } catch (error: any) {
      console.error("Error disabling user:", error);
      toast.error(error.message || "Failed to freeze wallet");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDisableDialog = (user: any) => {
    setSelectedUser(user);
    setIsDisableOpen(true);
  };

  const openUnfreezeDialog = (user: any) => {
    setSelectedUser(user);
    setUnfreezeReason("");
    setIsUnfreezeOpen(true);
  };

  const handleUnfreezeUser = async () => {
    if (!selectedUser || !unfreezeReason.trim()) {
      toast.error("Please provide a reason for reactivating this user");
      return;
    }

    try {
      setIsUnfreezeSubmitting(true);
      const response = await expertApi.unfreezeUser(
        selectedUser.userId || selectedUser._id,
        unfreezeReason
      );

      if (response.success) {
        toast.success("User reactivated successfully");
        setIsUnfreezeOpen(false);
        setUnfreezeReason("");
        setSelectedUser(null);
        loadSecurityData();
      } else {
        toast.error(response.message || "Failed to reactivate user");
      }
    } catch (error: any) {
      console.error("Error unfreezing user:", error);
      toast.error(error.message || "Failed to reactivate user");
    } finally {
      setIsUnfreezeSubmitting(false);
    }
  };

  const viewUserDetails = (user: any) => {
    setSelectedUser(user);
    router.push(`/expert/security/${user.userId || user._id}`);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? badgeColors.green : badgeColors.red;
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

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "balance-desc", label: "Highest Balance" },
    { value: "balance-asc", label: "Lowest Balance" },
    { value: "name-asc", label: "Name A → Z" },
    { value: "name-desc", label: "Name Z → A" },
  ];

  const getStatusLabel = (val: string) => {
    switch (val) {
      case "all":
        return "All Status";
      case "active":
        return "Active";
      case "frozen":
        return "Frozen";
      default:
        return val;
    }
  };

  const copyToClipboard = async (text: string | undefined) => {
    if (!text) {
      toast.error("No address to copy");
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback for non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      toast.success("Wallet address copied");
      setCopiedAddress(text);
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedAddress(null);
      }, 3000);
    } catch (err) {
      console.error("Failed to copy wallet address:", err);
      toast.error("Failed to copy address");
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (isLoading && users.length === 0) {
    return (
      <div
        className={`p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div
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
            <BreadcrumbPage>Security & Access Control</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              Security & Access Control
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Monitor security events and manage user access controls
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${
                  securityData?.status === "secure"
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
                } text-xs rounded-none flex items-center gap-1`}
              >
                {securityData?.status === "secure" ? (
                  <ShieldCheckIcon className="h-3 w-3" />
                ) : (
                  <ShieldExclamationIcon className="h-3 w-3" />
                )}
                {securityData?.status === "secure" ? "Secure" : "Alert"}
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                {users.length} Total Users
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadSecurityData}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Security Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Security Events",
            value: securityData?.metrics?.securityEvents || 0,
            subtitle: "Last 24 hours",
            icon: ShieldCheckIcon,
            color: badgeColors.blue,
          },
          {
            title: "Failed Logins",
            value: securityData?.metrics?.failedLogins || 0,
            subtitle: "Last 24 hours",
            icon: ExclamationTriangleIcon,
            color: badgeColors.yellow,
          },
          {
            title: "Active Users",
            value: securityData?.metrics?.activeUsers || 0,
            subtitle: "Currently active",
            icon: UserIcon,
            color: badgeColors.green,
          },
          {
            title: "Frozen Wallets",
            value: securityData?.metrics?.inactiveUsers || 0,
            subtitle: "Disabled accounts",
            icon: LockClosedIcon,
            color: badgeColors.red,
          },
        ].map((stat, index) => (
          <Card
            key={stat.title || index}
            className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-xs font-medium ${colors.texts.secondary}`}
              >
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colors.texts.primary}`}>
                {stat.value.toLocaleString()}
              </div>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              User Management
            </CardTitle>
            <div className="ml-auto lg:hidden">
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
                placeholder="Name, email, wallet..."
                className={`pl-10 rounded-none text-xs ${colors.inputs.base} focus:outline-none focus:ring-0 focus-visible:outline-none`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2 items-stretch">
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger
                  className={`w-full min-w-[240px] rounded-none text-xs ${colors.inputs.base} focus:outline-none focus:ring-0 focus-visible:outline-none`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[240px] focus:outline-none focus-visible:outline-none">
                  <SelectItem value="all" className="text-xs">
                    All Status
                  </SelectItem>
                  <SelectItem value="active" className="text-xs">
                    Active
                  </SelectItem>
                  <SelectItem value="frozen" className="text-xs">
                    Frozen
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  className={`w-full rounded-none text-xs ${colors.inputs.base} focus:outline-none focus:ring-0 focus-visible:outline-none`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[240px] focus:outline-none focus-visible:outline-none">
                  {sortOptions.map((s) => (
                    <SelectItem
                      key={s.value}
                      value={s.value}
                      className="text-xs"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger
                  className={`w-full rounded-none text-xs ${colors.inputs.base} focus:outline-none focus:ring-0 focus-visible:outline-none`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[240px] focus:outline-none focus-visible:outline-none">
                  <SelectItem value="all" className="text-xs">
                    All Roles
                  </SelectItem>
                  <SelectItem value="supplier" className="text-xs">
                    Supplier
                  </SelectItem>
                  <SelectItem value="vendor" className="text-xs">
                    Vendor
                  </SelectItem>
                  <SelectItem value="customer" className="text-xs">
                    Customer
                  </SelectItem>
                  <SelectItem value="expert" className="text-xs">
                    Expert
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {searchTerm && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                  >
                    &quot;{searchTerm}&quot;
                    <button
                      onClick={() => setSearchTerm("")}
                      className={`ml-1 ${colors.texts.secondary} hover:${colors.texts.primary} cursor-pointer`}
                    >
                      ×
                    </button>
                  </Badge>
                )}

                {selectedStatus !== "all" && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                  >
                    {getStatusLabel(selectedStatus)}
                    <button
                      onClick={() => setSelectedStatus("all")}
                      className={`ml-1 ${colors.texts.secondary} hover:${colors.texts.primary} cursor-pointer`}
                    >
                      ×
                    </button>
                  </Badge>
                )}

                <span className={`text-xs ${colors.texts.secondary} ml-2`}>
                  {users.length} users found
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="transform transition-all duration-700">
        <div className="w-full max-w-6xl mx-auto">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList
              className={`flex justify-center mx-auto ${colors.borders.primary} ${colors.backgrounds.tertiary} rounded-none p-0.5`}
            >
              <TabsTrigger
                value="all"
                className={`rounded-none flex-1 py-1.5 px-4 min-w-[120px] md:min-w-[150px] text-xs ${selectedTab === "all" ? `${colors.backgrounds.primary} ${colors.texts.primary}` : colors.texts.secondary}`}
              >
                <Squares2X2Icon className={`h-4 w-4 ${colors.icons.primary}`} />
                All
              </TabsTrigger>

              <TabsTrigger
                value="active"
                className={`rounded-none flex-1 py-1.5 px-4 min-w-[120px] md:min-w-[150px] text-xs ${selectedTab === "active" ? `${colors.backgrounds.primary} ${colors.texts.primary}` : colors.texts.secondary}`}
              >
                <CheckCircleIcon
                  className={`h-4 w-4 ${colors.icons.primary}`}
                />
                Active
              </TabsTrigger>

              <TabsTrigger
                value="frozen"
                className={`rounded-none flex-1 py-1.5 px-4 min-w-[120px] md:min-w-[150px] text-xs ${selectedTab === "frozen" ? `${colors.backgrounds.primary} ${colors.texts.primary}` : colors.texts.secondary}`}
              >
                <XCircleIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Frozen
              </TabsTrigger>

              <TabsTrigger
                value="high_balance"
                className={`rounded-none flex-1 py-1.5 px-4 min-w-[120px] md:min-w-[150px] text-xs ${selectedTab === "high_balance" ? `${colors.backgrounds.primary} ${colors.texts.primary}` : colors.texts.secondary}`}
              >
                <BanknotesIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                High Balance
              </TabsTrigger>

              <TabsTrigger
                value="low_balance"
                className={`rounded-none flex-1 py-1.5 px-4 min-w-[120px] md:min-w-[150px] text-xs ${selectedTab === "low_balance" ? `${colors.backgrounds.primary} ${colors.texts.primary}` : colors.texts.secondary}`}
              >
                <ClockIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Low Balance
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Users table */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Users & Wallets
            </CardTitle>
            <div className={`text-xs ${colors.texts.secondary}`}>
              Showing {users.length} users
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className={colors.tables.header}>
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Role</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Balance (CVT)
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Wallet Address
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Last Activity
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className={`text-sm ${colors.texts.secondary}`}>
                        No users found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, index) => (
                    <TableRow
                      key={user._id || user.userId || index}
                      className={colors.tables.row}
                    >
                      <TableCell className="text-xs font-medium">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getRoleColor(user.role).bg} ${
                            getRoleColor(user.role).border
                          } ${getRoleColor(user.role).text} text-xs rounded-none`}
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {formatCurrencyAbbreviated(
                          Number(user.balance) || 0,
                          "CVT"
                        )}
                        {user.securityFlags &&
                          user.securityFlags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {user.securityFlags.includes("HIGH_BALANCE") && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 rounded-none"
                                >
                                  HIGH
                                </Badge>
                              )}
                              {user.securityFlags.includes("LOW_BALANCE") && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 rounded-none"
                                >
                                  LOW
                                </Badge>
                              )}
                            </div>
                          )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {user.walletAddress ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono truncate">
                              {`${user.walletAddress.substring(0, 8)}...${user.walletAddress.substring(
                                user.walletAddress.length - 6
                              )}`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(user.walletAddress)
                              }
                              aria-label={
                                copiedAddress === user.walletAddress
                                  ? "Address copied"
                                  : "Copy wallet address"
                              }
                              title={
                                copiedAddress === user.walletAddress
                                  ? "Address copied"
                                  : "Copy wallet address"
                              }
                              className="rounded-none text-xs"
                            >
                              {copiedAddress === user.walletAddress ? (
                                <CheckIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ClipboardDocumentIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(user.isActive).bg} ${
                            getStatusColor(user.isActive).border
                          } ${getStatusColor(user.isActive).text} text-xs rounded-none flex items-center gap-1 w-fit`}
                        >
                          {user.isActive ? (
                            <>
                              <LockOpenIcon className="h-3 w-3" />
                              Active
                            </>
                          ) : (
                            <>
                              <LockClosedIcon className="h-3 w-3" />
                              Frozen
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {user.lastActivity
                          ? new Date(user.lastActivity).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewUserDetails(user)}
                            className={`text-xs rounded-none ${colors.buttons.ghost}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {user.role !== "expert" && user.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDisableDialog(user)}
                              className={`text-xs rounded-none text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20`}
                              aria-label="Freeze Wallet"
                              title="Freeze Wallet"
                            >
                              {/* Show open lock icon for active users (status = unfrozen) */}
                              <LockOpenIcon className="h-4 w-4" />
                            </Button>
                          )}
                          {user.role !== "expert" && !user.isActive && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openUnfreezeDialog(user)}
                              className={`text-xs rounded-none text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20`}
                              aria-label="Reactivate Account"
                              title="Reactivate Account"
                            >
                              {/* Show closed lock icon for frozen users (status = frozen) */}
                              <LockClosedIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={`cursor-pointer rounded-none ${
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }`}
                    />
                  </PaginationItem>

                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(1)}
                        className="cursor-pointer rounded-none"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

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

                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink
                        onClick={() => setCurrentPage(totalPages)}
                        className="cursor-pointer rounded-none"
                      >
                        {totalPages}
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

      {/* Disable User Dialog */}
      <AlertDialog open={isDisableOpen} onOpenChange={setIsDisableOpen}>
        <AlertDialogContent className={`${colors.cards.base} rounded-none`}>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Freeze User Wallet
            </AlertDialogTitle>
            <AlertDialogDescription
              className={`text-xs ${colors.texts.secondary}`}
            >
              This action will freeze the user&apos;s wallet and prevent them
              from accessing the system. Please provide a reason for this
              action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            {selectedUser && (
              <div
                className={`p-3 rounded-none bg-gray-50 dark:bg-gray-900/20 border ${colors.borders.default}`}
              >
                <div className={`text-xs font-medium ${colors.texts.primary}`}>
                  {selectedUser.name}
                </div>
                <div className={`text-xs ${colors.texts.muted}`}>
                  {selectedUser.email} • {selectedUser.role}
                </div>
                <div className={`text-xs ${colors.texts.muted} mt-1`}>
                  Balance:{" "}
                  {formatCurrency(Number(selectedUser.balance) || 0, "CVT")}
                </div>
                <div
                  className={`flex items-center gap-2 text-xs ${colors.texts.muted} mt-1`}
                >
                  <span className="font-mono">
                    {selectedUser.walletAddress
                      ? `${selectedUser.walletAddress.substring(0, 8)}...${selectedUser.walletAddress.substring(
                          selectedUser.walletAddress.length - 6
                        )}`
                      : "-"}
                  </span>
                  {selectedUser.walletAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(selectedUser.walletAddress)
                      }
                      aria-label={
                        copiedAddress === selectedUser.walletAddress
                          ? "Address copied"
                          : "Copy wallet address"
                      }
                      title={
                        copiedAddress === selectedUser.walletAddress
                          ? "Address copied"
                          : "Copy wallet address"
                      }
                      className="rounded-none text-xs"
                    >
                      {copiedAddress === selectedUser.walletAddress ? (
                        <CheckIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div>
              <label
                className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
              >
                Reason for Freezing Wallet *
              </label>
              <Textarea
                placeholder="Enter the reason for freezing this wallet..."
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
                className={`rounded-none text-xs ${colors.inputs.base} min-h-[100px] focus:outline-none focus:ring-0 focus-visible:outline-none`}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableUser}
              disabled={isSubmitting || !disableReason.trim()}
              className="rounded-none text-xs bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Freezing..." : "Freeze Wallet"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unfreeze User Dialog */}
      <AlertDialog open={isUnfreezeOpen} onOpenChange={setIsUnfreezeOpen}>
        <AlertDialogContent className={`${colors.cards.base} rounded-none`}>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Reactivate User Account
            </AlertDialogTitle>
            <AlertDialogDescription
              className={`text-xs ${colors.texts.secondary}`}
            >
              This action will re-enable the user&apos;s account and unfreeze
              their wallet. Please provide a reason for this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 my-4">
            {selectedUser && (
              <div
                className={`p-3 rounded-none bg-gray-50 dark:bg-gray-900/20 border ${colors.borders.default}`}
              >
                <div className={`text-xs font-medium ${colors.texts.primary}`}>
                  {selectedUser.name}
                </div>
                <div className={`text-xs ${colors.texts.muted}`}>
                  {selectedUser.email} • {selectedUser.role}
                </div>
                <div className={`text-xs ${colors.texts.muted} mt-1`}>
                  Balance:{" "}
                  {formatCurrency(Number(selectedUser.balance) || 0, "CVT")}
                </div>
                <div
                  className={`flex items-center gap-2 text-xs ${colors.texts.muted} mt-1`}
                >
                  <span className="font-mono">
                    {selectedUser.walletAddress
                      ? `${selectedUser.walletAddress.substring(0, 8)}...${selectedUser.walletAddress.substring(selectedUser.walletAddress.length - 6)}`
                      : "-"}
                  </span>
                  {selectedUser.walletAddress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(selectedUser.walletAddress)
                      }
                      className="rounded-none text-xs"
                    >
                      {copiedAddress === selectedUser.walletAddress ? (
                        <CheckIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}
            <div>
              <label
                className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
              >
                Reason for Reactivating Account *
              </label>
              <Textarea
                placeholder="Enter the reason for reactivating this account..."
                value={unfreezeReason}
                onChange={(e) => setUnfreezeReason(e.target.value)}
                className={`rounded-none text-xs ${colors.inputs.base} min-h-[100px] focus:outline-none focus:ring-0 focus-visible:outline-none`}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-none text-xs">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnfreezeUser}
              disabled={isUnfreezeSubmitting || !unfreezeReason.trim()}
              className="rounded-none text-xs bg-green-600 hover:bg-green-700"
            >
              {isUnfreezeSubmitting ? "Reactivating..." : "Reactivate Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
