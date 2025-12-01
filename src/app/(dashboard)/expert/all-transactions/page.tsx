/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { usePageTitle } from "@/hooks/use-page-title";
import { Loader2 } from "lucide-react";

const statusOptions = ["All Status", "success", "failed", "pending"];
const typeOptions = [
  "All Types",
  "product",
  "order",
  "user",
  "payment",
  "inventory",
  "vendor-request",
];
// Add new sort options
const sortOptions = [
  "Newest",
  "Oldest",
  "Amount: High to Low",
  "Amount: Low to High",
];

export default function AllTransactionsPage() {
  usePageTitle("All Transactions");
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  // Removed selectedTransaction and isDetailOpen states

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedSort, setSelectedSort] = useState("Newest"); // new state for sort
  // store as Date | undefined to match Calendar's expected type
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage] = useState(20);

  // Add debounce for searchTerm to avoid sending excessive requests
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    setIsVisible(true);
    loadTransactions();
  }, [
    currentPage,
    selectedStatus,
    selectedType,
    selectedSort, // add selectedSort to dependencies
    startDate,
    endDate,
    debouncedSearch, // use debouncedSearch instead of searchTerm
  ]); // Add debouncedSearch to dependencies

  // Add effect to reset page when debounced search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearch, // Use debouncedSearch
      };

      if (selectedStatus !== "All Status") params.status = selectedStatus;
      if (selectedType !== "All Types") params.type = selectedType;
      if (selectedSort && selectedSort !== "Newest") params.sort = selectedSort; // add sort param if not default
      // Convert Date objects to ISO strings (backend expects parseable dates)
      if (startDate) params.startDate = startDate?.toISOString();
      if (endDate) params.endDate = endDate?.toISOString();

      const response = await expertApi.getAllTransactions(params);

      const typedResponse = response as {
        success: boolean;
        data?: any[];
        pagination?: { totalPages?: number; totalItems?: number };
      };

      if (typedResponse.success) {
        setTransactions(typedResponse.data || []);
        setTotalPages(typedResponse.pagination?.totalPages || 1);
        setTotalItems(typedResponse.pagination?.totalItems || 0);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return badgeColors.green;
      case "failed":
        return badgeColors.red;
      case "pending":
        return badgeColors.yellow;
      default:
        return badgeColors.blue;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "failed":
        return <XCircleIcon className="h-4 w-4" />;
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const filteredTransactions = useMemo(() => {
    // Remove client-side filtering since it's now server-side
    return transactions;
  }, [transactions]); // Remove searchTerm dependency

  const handleExport = async () => {
    try {
      toast.info("Exporting transactions...");
      const params: any = {
        limit: 10000, // Set a high limit to fetch all transactions; adjust if backend has a max
        // Optionally include filters: search, status, type, sort, dates if you want filtered export
        // For "all transactions", omit filters as per user request
      };

      const response = await expertApi.getAllTransactions(params);
      const typedResponse = response as {
        success: boolean;
        data?: any[];
      };

      if (typedResponse.success && typedResponse.data) {
        const transactions = typedResponse.data;

        // Generate CSV content
        const csvHeaders = [
          "Transaction ID",
          "Type",
          "User",
          "Status",
          "Timestamp",
        ];
        const csvRows = transactions.map((tx) => [
          tx.transactionId || tx.id || "N/A",
          tx.type || "",
          tx.user?.name || "System",
          tx.status || "",
          formatTimestamp(tx.timestamp || tx.createdAt),
        ]);

        const csvContent = [csvHeaders, ...csvRows]
          .map((row) => row.map((field) => `"${field}"`).join(","))
          .join("\n");

        // Create and download the CSV file
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "all_transactions.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Transactions exported successfully!");
      } else {
        toast.error("Failed to fetch transactions for export");
      }
    } catch (error) {
      console.error("Error exporting transactions:", error);
      toast.error("Export failed");
    }
  };

  // Add a helper to format timestamp with fallback
  const formatTimestamp = (ts?: string | Date) => {
    const raw = ts || (ts === undefined ? undefined : ts);
    if (!raw) return "Not Available";
    return new Date(raw).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to format pickers
  const formatPickerDate = (date: Date | undefined) =>
    date ? format(date, "MMM dd, yyyy") : "";

  // Reset page when filters change (optional but useful UX)
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    selectedStatus,
    selectedType,
    selectedSort,
    startDate,
    endDate,
  ]); // include selectedSort

  if (isLoading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading transactions...
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
            <BreadcrumbPage>All Transactions</BreadcrumbPage>
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
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              All Blockchain Transactions
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Monitor and analyze all network transactions
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                {totalItems} Total Transactions
              </Badge>
              <Badge
                className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
              >
                <ShieldCheckIcon
                  className={`h-3 w-3 ${badgeColors.cyan.icon}`}
                />
                Blockchain Verified
              </Badge>
              <Badge
                className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none flex items-center gap-1`}
              >
                <CheckCircleIcon className="h-3 w-3" />
                Live Data
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadTransactions}
              variant="outline"
              // Ensure the refresh button gets a black border on hover
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all hover:border-black`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              // Use the provided black button classes for export and keep text/icon white on hover
              className={`group flex items-center gap-2 px-4 py-2 h-10 rounded-none ${colors.buttons.primary} font-medium text-xs cursor-pointer transition-all hover:!text-white`}
            >
              <ArrowDownTrayIcon
                // Force icon color to stay white even on hover
                className="h-4 w-4 !text-white group-hover:!text-white"
              />
              <span className="!text-white group-hover:!text-white">
                Export
              </span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary} flex items-center gap-2`}
            >
              <FunnelIcon className={`h-5 w-5 ${colors.icons.primary}`} />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* New structured rows for filters */}
            <div className="space-y-4">
              {/* Row 1: Search */}
              <div className="grid grid-cols-1">
                <label
                  className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
                >
                  Search
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                  />
                  <Input
                    placeholder="Transaction ID, type, user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 rounded-none text-xs ${colors.inputs.base}`}
                  />
                </div>
              </div>

              {/* Row 2: three dropdowns (Status, Type, Sort) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
                  >
                    Status
                  </label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger
                      className={`w-full rounded-none text-xs ${colors.inputs.base}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="text-xs"
                        >
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
                  >
                    Type
                  </label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger
                      className={`w-full rounded-none text-xs ${colors.inputs.base}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typeOptions.map((type) => (
                        <SelectItem key={type} value={type} className="text-xs">
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort Filter (new) */}
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
                  >
                    Sort
                  </label>
                  <Select value={selectedSort} onValueChange={setSelectedSort}>
                    <SelectTrigger
                      className={`w-full rounded-none text-xs ${colors.inputs.base}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((sort) => (
                        <SelectItem key={sort} value={sort} className="text-xs">
                          {sort}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: Date pickers (Start & End) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
                  >
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full text-left rounded-none text-xs ${colors.inputs.base}`}
                      >
                        {startDate
                          ? formatPickerDate(startDate)
                          : "Select start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          if (!date) return;
                          // If endDate exists and is before the new startDate, clear endDate
                          if (endDate && date && endDate < date)
                            setEndDate(undefined);
                          setStartDate(date);
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* End Date */}
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
                  >
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full text-left rounded-none text-xs ${colors.inputs.base}`}
                      >
                        {endDate
                          ? formatPickerDate(endDate)
                          : "Select end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          if (!date) return;
                          // Enforce endDate >= startDate
                          if (startDate && date < startDate) {
                            toast.error(
                              "End date cannot be earlier than start date"
                            );
                            return;
                          }
                          setEndDate(date);
                        }}
                        // set minDate so the user can't select a date before startDate
                        {...(startDate ? { fromDate: startDate } : {})}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle
                className={`text-lg font-semibold ${colors.texts.primary}`}
              >
                Transactions List
              </CardTitle>
              <div className={`text-xs ${colors.texts.secondary}`}>
                Showing {filteredTransactions.length} of {totalItems}{" "}
                transactions
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={colors.tables.header}>
                    <TableHead className="text-xs font-semibold">
                      Transaction ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Type
                    </TableHead>
                    {/* Removed "Action" column */}
                    <TableHead className="text-xs font-semibold">
                      User
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Timestamp
                    </TableHead>
                    {/* Removed "Actions" column */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className={`text-sm ${colors.texts.secondary}`}>
                          No transactions found
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((tx, index) => (
                      <TableRow
                        key={tx.id || index}
                        className={colors.tables.row}
                      >
                        <TableCell className="font-mono text-xs">
                          {tx.transactionId || tx.id || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                          >
                            {tx.type}
                          </Badge>
                        </TableCell>
                        {/* Removed action column cell
                        <TableCell className="text-xs">{tx.action}</TableCell>
                        */}
                        <TableCell className="text-xs">
                          <div>{tx.user?.name || "System"}</div>
                          <div className={`text-xs ${colors.texts.muted}`}>
                            {tx.user?.role || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(tx.status).bg} ${
                              getStatusColor(tx.status).border
                            } ${getStatusColor(tx.status).text} text-xs rounded-none flex items-center gap-1 w-fit`}
                          >
                            {getStatusIcon(tx.status)}
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatTimestamp(tx.timestamp || tx.createdAt)}
                        </TableCell>
                        {/* Removed Actions column with Eye icon button */}
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
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                  {totalItems} transactions
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

                    {/* First page */}
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

                    {/* Ellipsis before current */}
                    {currentPage > 3 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Previous page */}
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

                    {/* Current page */}
                    <PaginationItem>
                      <PaginationLink isActive className="rounded-none">
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>

                    {/* Next page */}
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

                    {/* Ellipsis after current */}
                    {currentPage < totalPages - 2 && (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    )}

                    {/* Last page */}
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
      </motion.div>
    </motion.div>
  );
}
