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
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  CubeIcon,
  HashtagIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  ArrowTrendingDownIcon,
  CreditCardIcon,
  CheckIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import SupplierTransactionsSkeleton from "@/components/skeletons/supplierTransactionsSkeleton";
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
import { getMyRequests, getRequestById } from "@/lib/api/vendor.request.api";
import { invoiceApi } from "@/lib/api/invoice.api";
import { Loader2 } from "lucide-react";
import { FadeUp } from "@/components/animations/fade-up";

const RsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="h-5 w-5"
  >
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="8"
      fontWeight="600"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.2"
      fontFamily="Arial, sans-serif"
    >
      CVT
    </text>
    <path
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const sortOptions = [
  { value: "date-desc", label: "Date: Newest First" },
  { value: "date-asc", label: "Date: Oldest First" },
  { value: "amount-desc", label: "Amount: High to Low" },
  { value: "amount-asc", label: "Amount: Low to High" },
];

function getBadgeColor(type: string) {
  switch (type) {
    case "completed":
    case "sale":
      return badgeColors.green;
    case "pending":
    case "adjustment":
      return badgeColors.yellow;
    case "cancelled":
    case "purchase":
      return badgeColors.red;
    case "transfer":
    case "blue":
    case "Blockchain Verified":
      return badgeColors.blue;
    default:
      return badgeColors.blue;
  }
}

export default function VendorTransactionsPage() {
  usePageTitle("Transactions");
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("date-desc");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  useEffect(() => {
    setIsVisible(true);
    loadTransactions();
  }, [user?.id]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch completed requests from vendor API
      const response = await getMyRequests({
        status: "completed",
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success && response.requests) {
        // Transform backend data to match UI structure
        const transformedTransactions = response.requests.map((req: any) => {
          const supplierInfo =
            typeof req.supplierId === "object" ? req.supplierId : null;

          return {
            id: req._id,
            reference: req.requestNumber,
            date: req.createdAt,
            type: "purchase", // All are purchases for vendors
            status: "completed",
            amount: req.total || 0,
            vendor:
              supplierInfo?.name ||
              supplierInfo?.companyName ||
              "Unknown Supplier",
            product:
              req.items?.length > 0
                ? req.items[0].inventoryName || "Multiple Items"
                : "Items",
            quantity:
              req.items?.reduce(
                (sum: number, item: any) => sum + item.quantity,
                0
              ) || 0,
            blockchainHash: req.blockchainTxId || "0x" + "0".repeat(64),
            gasUsed: 21000,
            description: req.vendorNotes || "Completed vendor request",
          };
        });

        setTransactions(transformedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error loading transactions:", error);
      toast.error("Failed to load transactions");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Dynamically compute transaction types from data
  const transactionTypes = useMemo(() => {
    const types = new Set(transactions.map((t) => t.type));
    return ["All Types", ...Array.from(types)];
  }, [transactions]);

  // Dynamically compute transaction statuses from data
  const transactionStatuses = useMemo(() => {
    const statuses = new Set(transactions.map((t) => t.status));
    return ["All Status", ...Array.from(statuses)];
  }, [transactions]);

  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const matchesSearch =
        transaction.reference
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || // Searches supplier
        transaction.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

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
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
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
  const totalSales = transactions
    .filter((t) => t.type === "sale" && t.status === "completed")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalPurchases = transactions
    .filter((t) => t.type === "purchase" && t.status === "completed")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "CVT",
    }).format(Math.abs(amount));
  };

  const formatCurrencyAbbreviated = (amount: number) => {
    if (amount >= 1e9) {
      return `${(amount / 1e9).toFixed(2)} B`;
    } else if (amount >= 1e6) {
      return `${(amount / 1e6).toFixed(2)} M`;
    } else {
      return formatCurrency(amount);
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

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownloadInvoice = async (transactionId: string) => {
    try {
      toast.loading("Downloading invoice...");

      // Get invoices for this vendor request
      const response =
        await invoiceApi.getInvoicesByVendorRequest(transactionId);

      if (response.success && response.data?.invoices?.length > 0) {
        const invoice = response.data.invoices[0]; // Get the first invoice

        // Download the invoice PDF
        const downloadResponse = await invoiceApi.downloadInvoiceById(
          invoice._id
        );

        if (downloadResponse.success && downloadResponse.data) {
          // Trigger download
          invoiceApi.triggerDownload(
            downloadResponse.data,
            `invoice-${invoice.invoiceNumber}.pdf`
          );
          toast.dismiss();
          toast.success("Invoice downloaded successfully!");
        } else {
          toast.dismiss();
          toast.error(downloadResponse.message || "Failed to download invoice");
        }
      } else {
        toast.dismiss();
        toast.error("No invoice found for this transaction");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.dismiss();
      toast.error("Failed to download invoice");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Reference",
      "Date",
      "Type",
      "Status",
      "Supplier", // Renamed
      "Product",
      "Quantity",
      "Amount",
      "Blockchain Hash",
    ];

    const rows = filteredAndSortedTransactions.map((t) => [
      t.reference,
      formatDate(t.date),
      t.type,
      t.status,
      t.vendor, // Supplier
      t.product,
      t.quantity,
      t.amount,
      t.blockchainHash,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast.success("Transactions exported successfully");
  };

  const handleViewDetails = async (transactionId: string) => {
    setLoadingDetails(true);
    try {
      const response = await getRequestById(transactionId);
      if (response.success) {
        setSelectedRequest(response.request);
        setIsDetailsOpen(true);
      }
    } catch (error: any) {
      console.error("Error loading request details:", error);
      toast.error(error.message || "Failed to load request details");
    } finally {
      setLoadingDetails(false);
    }
  };

  if (isLoading) {
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
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Transactions</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <FadeUp delay={0}>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Vendor Purchase Transactions
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Track all completed purchases and financial activities
              </p>
            </div>
            <div className="flex items-center gap-3">
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
        </FadeUp>

        {/* Statistics Cards */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Transactions",
                value: totalTransactions.toLocaleString(),
                subtitle: "All time transactions",
                icon: ReceiptPercentIcon,
              },
              {
                title: "Total Volume",
                value: formatCurrencyAbbreviated(totalVolume),
                subtitle: "Transaction volume",
                icon: RsIcon,
              },
              {
                title: "Total Purchases",
                value: formatCurrencyAbbreviated(totalPurchases),
                subtitle: "Amount spent on completed purchases",
                icon: CreditCardIcon,
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
        </FadeUp>

        {/* Filters Card */}
        <FadeUp delay={0.2}>
          <Card className={`${colors.cards.base} !rounded-none`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <div className="h-8 w-8 !rounded-none flex items-center justify-center">
                  <FunnelIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                </div>
                Filters & Search
              </CardTitle>
              <CardDescription className={`text-xs ${colors.texts.secondary}`}>
                Filter and search through your transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search by reference, supplier or product"
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
                      {selectedType === "sale" && (
                        <ArrowUpIcon
                          className={`h-3 w-3 ${badgeColors.green.icon}`}
                        />
                      )}
                      {selectedType === "purchase" && (
                        <ArrowDownIcon
                          className={`h-3 w-3 ${badgeColors.red.icon}`}
                        />
                      )}
                      {selectedType === "adjustment" && (
                        <ArrowsUpDownIcon
                          className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                        />
                      )}
                      {selectedType === "transfer" && (
                        <ArrowsUpDownIcon
                          className={`h-3 w-3 ${badgeColors.blue.icon}`}
                        />
                      )}
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
                      {selectedStatus === "completed" && (
                        <CheckCircleIcon
                          className={`h-3 w-3 ${badgeColors.green.icon}`}
                        />
                      )}
                      {selectedStatus === "pending" && (
                        <ClockIcon
                          className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                        />
                      )}
                      {selectedStatus === "cancelled" && (
                        <XCircleIcon
                          className={`h-3 w-3 ${badgeColors.red.icon}`}
                        />
                      )}
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
        </FadeUp>

        {/* Transactions Table */}
        <FadeUp delay={0.3}>
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
                        <BanknotesIcon
                          className={`h-4 w-4 ${colors.icons.primary}`}
                        />
                      </div>
                      Purchase History
                    </CardTitle>
                  </div>
                  <div className="flex-1" />
                  <div>
                    <Badge
                      variant="secondary"
                      className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs !rounded-none flex items-center`}
                    >
                      <ShieldCheckIcon
                        className={`h-3 w-3 mr-1 ${badgeColors.blue.icon}`}
                      />
                      Blockchain Verified
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow
                        className={`border-b ${colors.borders.secondary} py-4 !rounded-none`}
                      >
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Reference
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Date
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[120px]`}
                        >
                          Type
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[120px]`}
                        >
                          Status
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Supplier
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[140px]`}
                        >
                          Product
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[120px]`}
                        >
                          Amount
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[160px]`}
                        >
                          Blockchain
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[100px]`}
                        >
                          Invoice
                        </TableHead>
                        <TableHead
                          className={`${colors.texts.primary} font-semibold min-w-[100px]`}
                        >
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedTransactions.map((transaction: any) => (
                        <TableRow
                          key={transaction.id}
                          className={`border-b ${colors.borders.secondary} ${colors.backgrounds.hover} transition-colors py-4 !rounded-none`}
                        >
                          <TableCell className="px-2">
                            <div className="flex items-center gap-3">
                              <div>
                                <code
                                  className={`text-sm font-mono ${colors.backgrounds.tertiary} px-2 py-1 rounded-none`}
                                >
                                  {transaction.reference}
                                </code>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon
                                className={`h-3 w-3 ${colors.icons.muted}`}
                              />
                              <span
                                className={`text-sm ${colors.texts.primary}`}
                              >
                                {formatDate(transaction.date)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getBadgeColor(transaction.type).bg} ${getBadgeColor(transaction.type).border} ${getBadgeColor(transaction.type).text} flex items-center gap-1 !rounded-none`}
                                variant="secondary"
                              >
                                {transaction.type === "sale" && (
                                  <ArrowUpIcon
                                    className={`h-3 w-3 ${badgeColors.green.icon}`}
                                  />
                                )}
                                {transaction.type === "purchase" && (
                                  <ArrowDownIcon
                                    className={`h-3 w-3 ${badgeColors.red.icon}`}
                                  />
                                )}
                                {transaction.type === "adjustment" && (
                                  <ArrowsUpDownIcon
                                    className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                                  />
                                )}
                                {transaction.type === "transfer" && (
                                  <ArrowsUpDownIcon
                                    className={`h-3 w-3 ${badgeColors.blue.icon}`}
                                  />
                                )}
                                {transaction.type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getBadgeColor(transaction.status).bg} ${getBadgeColor(transaction.status).border} ${getBadgeColor(transaction.status).text} flex items-center gap-1 !rounded-none`}
                                variant="secondary"
                              >
                                {transaction.status === "completed" && (
                                  <CheckCircleIcon
                                    className={`h-3 w-3 ${badgeColors.green.icon}`}
                                  />
                                )}
                                {transaction.status === "pending" && (
                                  <ClockIcon
                                    className={`h-3 w-3 ${badgeColors.yellow.icon}`}
                                  />
                                )}
                                {transaction.status === "cancelled" && (
                                  <XCircleIcon
                                    className={`h-3 w-3 ${badgeColors.red.icon}`}
                                  />
                                )}
                                {transaction.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <BuildingOffice2Icon className="h-3 w-3 text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-gray-100">
                                {transaction.vendor}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {transaction.product}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Qty: {transaction.quantity}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-1">
                              {transaction.amount >= 0 ? (
                                <ArrowTrendingUpIcon className="h-3 w-3 text-green-500" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-3 w-3 text-red-500" />
                              )}
                              <span
                                className={`font-bold ${
                                  transaction.amount >= 0
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {transaction.amount >= 0 ? "+" : ""}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <div className="flex items-center gap-2">
                              <HashtagIcon className="h-2.5 w-2.5 text-gray-500" />
                              <code className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-none block">
                                {transaction.blockchainHash.substring(0, 16)}...
                              </code>
                            </div>
                          </TableCell>
                          <TableCell className="px-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDownloadInvoice(transaction.id)
                              }
                              className={`h-8 w-8 p-0 ${colors.buttons.outline} cursor-pointer !rounded-none transition-all hover:border-black dark:hover:border-white`}
                            >
                              <ArrowDownTrayIcon className="h-3 w-3" />
                            </Button>
                          </TableCell>
                          <TableCell className="px-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(transaction.id)}
                              className={`h-8 px-3 ${colors.buttons.outline} cursor-pointer !rounded-none transition-all hover:border-black dark:hover:border-white`}
                            >
                              <EyeIcon className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                  <ArrowsUpDownIcon
                    className={`h-10 w-10 ${colors.icons.muted}`}
                  />
                </div>
                <h3
                  className={`text-base font-semibold ${colors.texts.primary} mb-2`}
                >
                  {totalTransactions === 0
                    ? "No Purchases Yet"
                    : "No Purchases Found"}
                </h3>
                <p
                  className={`text-xs ${colors.texts.secondary} mb-6 max-w-md mx-auto`}
                >
                  {totalTransactions === 0
                    ? "Start purchasing from suppliers to see transactions here."
                    : "Try adjusting your search terms or filters to find purchases."}
                </p>
                {totalTransactions === 0 ? null : (
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
        </FadeUp>
      </div>

      {/* Transaction Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-3 text-xl font-bold ${colors.texts.primary}`}
              >
                <EyeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Purchase Details
              </DialogTitle>
              <DialogDescription
                className={`text-base ${colors.texts.secondary}`}
              >
                Detailed information about the completed purchase
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        Request Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Request Number
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.requestNumber}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Total Items
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.items?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Subtotal
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatCurrency(selectedRequest.subtotal)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Tax</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatCurrency(selectedRequest.tax)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Total Price
                        </p>
                        <p
                          className={`font-bold ${colors.texts.success} text-sm`}
                        >
                          {formatCurrency(selectedRequest.total)}
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
                        <BuildingOffice2Icon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Supplier Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Supplier Name
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {typeof selectedRequest.supplierId === "object"
                            ? selectedRequest.supplierId?.name
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Company Name
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {typeof selectedRequest.supplierId === "object"
                            ? selectedRequest.supplierId?.companyName
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Email</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {typeof selectedRequest.supplierId === "object"
                            ? selectedRequest.supplierId?.email
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Status
                        </p>
                        <Badge
                          className={`${getBadgeColor(selectedRequest.status).bg} ${getBadgeColor(selectedRequest.status).border} ${getBadgeColor(selectedRequest.status).text} text-xs !rounded-none`}
                        >
                          {selectedRequest.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Items Table */}
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <CubeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                      Requested Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className={colors.tables.header}>
                            <TableHead className="px-2">Item Name</TableHead>
                            <TableHead className="px-2">Quantity</TableHead>
                            <TableHead className="px-2">Price/Unit</TableHead>
                            <TableHead className="px-2">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRequest.items?.map(
                            (item: any, index: number) => (
                              <TableRow
                                key={index}
                                className={colors.tables.row}
                              >
                                <TableCell className="px-2">
                                  <p
                                    className={`font-medium ${colors.texts.primary}`}
                                  >
                                    {item.inventoryName || item.inventory?.name}
                                  </p>
                                </TableCell>
                                <TableCell className="px-2">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="px-2">
                                  {formatCurrency(item.pricePerUnit)}
                                </TableCell>
                                <TableCell className="px-2">
                                  <span className="font-bold">
                                    {formatCurrency(item.subtotal)}
                                  </span>
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Blockchain Info */}
                {selectedRequest.blockchainTxId && (
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
                            {selectedRequest.blockchainTxId}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(
                                selectedRequest.blockchainTxId,
                                "Transaction hash"
                              )
                            }
                            className={`h-8 w-8 p-0 ${colors.buttons.outline} cursor-pointer !rounded-none transition-all hover:border-black dark:hover:border-white flex-shrink-0`}
                          >
                            {copiedHash === selectedRequest.blockchainTxId ? (
                              <CheckIcon className="h-3 w-3" />
                            ) : (
                              <DocumentDuplicateIcon className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Verification Status
                        </p>
                        <Badge
                          className={`${selectedRequest.blockchainVerified ? badgeColors.blue.bg + " " + badgeColors.blue.border + " " + badgeColors.blue.text : badgeColors.yellow.bg + " " + badgeColors.yellow.border + " " + badgeColors.yellow.text} text-xs !rounded-none`}
                        >
                          {selectedRequest.blockchainVerified
                            ? "Verified"
                            : "Pending"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {(selectedRequest.vendorNotes ||
                  selectedRequest.supplierNotes) && (
                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedRequest.vendorNotes && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Vendor Notes
                          </p>
                          <p className={`text-sm ${colors.texts.primary}`}>
                            {selectedRequest.vendorNotes}
                          </p>
                        </div>
                      )}
                      {selectedRequest.supplierNotes && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Supplier Notes
                          </p>
                          <p className={`text-sm ${colors.texts.primary}`}>
                            {selectedRequest.supplierNotes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setIsDetailsOpen(false)}
                    className={`${colors.buttons.outline} !rounded-none`}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
