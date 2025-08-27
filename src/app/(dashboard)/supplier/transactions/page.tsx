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
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

const transactionTypes = [
  "All Types",
  "sale",
  "purchase",
  "adjustment",
  "transfer"
];

const transactionStatuses = [
  "All Status",
  "completed",
  "pending",
  "cancelled"
];

const sortOptions = [
  { value: "date-desc", label: "Date: Newest First" },
  { value: "date-asc", label: "Date: Oldest First" },
  { value: "amount-desc", label: "Amount: High to Low" },
  { value: "amount-asc", label: "Amount: Low to High" },
];

export default function SupplierTransactionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("date-desc");

  useEffect(() => {
    loadTransactions();
  }, [user?.id]);

  const loadTransactions = () => {
    setIsLoading(true);
    try {
      const savedTransactions = localStorage.getItem(`supplier_${user?.id}_transactions`);
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      } else {
        // Sample transaction data
        const sampleTransactions = [
          {
            id: "TXN-001",
            type: "sale",
            status: "completed",
            date: "2024-01-20T10:30:00Z",
            amount: 15000.00,
            description: "Sale of Industrial Steel Rods to TechVendor Pro",
            counterparty: "TechVendor Pro",
            productName: "Industrial Steel Rods",
            quantity: 100,
            unitPrice: 150.00,
            reference: "INV-2024-001",
            blockchainHash: "0x1234567890abcdef1234567890abcdef12345678"
          },
          {
            id: "TXN-002", 
            type: "purchase",
            status: "completed",
            date: "2024-01-18T14:15:00Z",
            amount: 8500.00,
            description: "Purchase of Raw Steel from Steel Corp Inc",
            counterparty: "Steel Corp Inc",
            productName: "Raw Steel Bars",
            quantity: 200,
            unitPrice: 42.50,
            reference: "PO-2024-002",
            blockchainHash: "0xabcdef1234567890abcdef1234567890abcdef12"
          },
          {
            id: "TXN-003",
            type: "sale",
            status: "pending",
            date: "2024-01-22T09:00:00Z",
            amount: 2500.00,
            description: "Sale of Organic Cotton Fabric to Fashion Hub",
            counterparty: "Fashion Hub",
            productName: "Organic Cotton Fabric",
            quantity: 200,
            unitPrice: 12.50,
            reference: "INV-2024-003",
            blockchainHash: "0x567890abcdef1234567890abcdef1234567890ab"
          },
          {
            id: "TXN-004",
            type: "adjustment",
            status: "completed",
            date: "2024-01-19T16:45:00Z",
            amount: -1200.00,
            description: "Inventory adjustment - damaged goods",
            counterparty: "Internal",
            productName: "Electronic Circuit Boards",
            quantity: -15,
            unitPrice: 80.00,
            reference: "ADJ-2024-001",
            blockchainHash: "0xcdef1234567890abcdef1234567890abcdef1234"
          }
        ];
        setTransactions(sampleTransactions);
        localStorage.setItem(`supplier_${user?.id}_transactions`, JSON.stringify(sampleTransactions));
      }
    } catch (error) {
      toast.error("Failed to load transactions");
      console.error("Error loading transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction: any) => {
      const matchesSearch =
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.productName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        selectedType === "All Types" || transaction.type === selectedType;

      const matchesStatus =
        selectedStatus === "All Status" || transaction.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort transactions
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "amount-desc":
          return Math.abs(b.amount) - Math.abs(a.amount);
        case "amount-asc":
          return Math.abs(a.amount) - Math.abs(b.amount);
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, searchTerm, selectedType, selectedStatus, sortBy]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sale":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "purchase":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      case "adjustment":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "transfer":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sale":
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case "purchase":
        return <ArrowDown className="h-4 w-4 text-blue-600" />;
      case "adjustment":
        return <ArrowUpDown className="h-4 w-4 text-yellow-600" />;
      case "transfer":
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      default:
        return <ArrowUpDown className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAmount = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    return (
      <span className={isNegative ? "text-red-600" : "text-green-600"}>
        {isNegative ? "-" : "+"}${absAmount.toFixed(2)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalTransactions = transactions.length;
  const completedTransactions = transactions.filter((t: any) => t.status === "completed").length;
  const pendingTransactions = transactions.filter((t: any) => t.status === "pending").length;
  const totalSales = transactions
    .filter((t: any) => t.type === "sale" && t.status === "completed")
    .reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalPurchases = transactions
    .filter((t: any) => t.type === "purchase" && t.status === "completed")
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground">
            View all supply chain transactions and blockchain records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadTransactions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => toast.info("Export feature coming soon")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Transactions</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalSales.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Revenue generated</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Purchases</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalPurchases.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Amount spent</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Completed</CardTitle>
            <ArrowUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{completedTransactions}</div>
            <p className="text-xs text-muted-foreground">Successful transactions</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingTransactions}</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-border bg-background"
                />
              </div>
            </div>

            {/* Type filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-sm">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {transactionStatuses.map((status) => (
                  <SelectItem key={status} value={status} className="text-sm">
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedTransactions.length} of {totalTransactions} transactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {filteredAndSortedTransactions.length > 0 ? (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
            <CardDescription className="text-muted-foreground">
              All supply chain transactions recorded on blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Date</TableHead>
                    <TableHead className="text-foreground">Type</TableHead>
                    <TableHead className="text-foreground">Description</TableHead>
                    <TableHead className="text-foreground">Counterparty</TableHead>
                    <TableHead className="text-foreground">Amount</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Reference</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedTransactions.map((transaction: any) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(transaction.type)}
                          <Badge
                            className={`text-xs px-2 py-1 ${getTypeColor(transaction.type)}`}
                            variant="secondary"
                          >
                            {transaction.type}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {transaction.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transaction.quantity} units @ ${transaction.unitPrice}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{transaction.counterparty}</span>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatAmount(transaction.amount)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`text-xs px-2 py-1 ${getStatusColor(transaction.status)}`}
                          variant="secondary"
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {transaction.reference}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => toast.info("Transaction details coming soon")}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              navigator.clipboard.writeText(transaction.blockchainHash);
                              toast.success("Blockchain hash copied to clipboard");
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12 border border-border bg-card">
          <CardContent>
            <ArrowUpDown className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {totalTransactions === 0 ? "No Transactions Yet" : "No Transactions Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {totalTransactions === 0
                ? "Start selling your supply products to see transactions here."
                : "Try adjusting your search terms or filters."}
            </p>
            {totalTransactions === 0 ? (
              <Button onClick={() => router.push("/supplier/products")}>
                View Products
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedType("All Types");
                  setSelectedStatus("All Status");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}