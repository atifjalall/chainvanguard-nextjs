/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { usePageTitle } from "@/hooks/use-page-title";

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

  const handleExport = () => {
    toast.info("Export functionality coming soon");
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
  }, [debouncedSearch, selectedStatus, selectedType, startDate, endDate]);

  if (isLoading && currentPage === 1) {
    return (
      <div
        className={`p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700"></div>
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
            <BreadcrumbPage>All Transactions</BreadcrumbPage>
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
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowDownTrayIcon
                className={`h-4 w-4 ${colors.icons.primary}`}
              />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
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

            {/* Status Filter */}
            <div>
              <label
                className={`text-xs font-medium ${colors.texts.secondary} mb-2 block`}
              >
                Status
              </label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger
                  className={`w-full rounded-none text-xs ${colors.inputs.base}`}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status} className="text-xs">
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
                    {endDate ? formatPickerDate(endDate) : "Select end date"}
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
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Transactions List
            </CardTitle>
            <div className={`text-xs ${colors.texts.secondary}`}>
              Showing {filteredTransactions.length} of {totalItems} transactions
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
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  {/* Removed "Action" column */}
                  <TableHead className="text-xs font-semibold">User</TableHead>
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
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
    </div>
  );
}
