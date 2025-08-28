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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  Plus,
  Edit,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Package,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BarChart3,
  Activity,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Factory,
  Building2,
  Shield,
  Zap,
  Target,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";

const statusOptions = [
  "All Status",
  "in-stock",
  "low-stock",
  "out-of-stock",
  "reserved",
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "quantity-asc", label: "Stock: Low to High" },
  { value: "quantity-desc", label: "Stock: High to Low" },
  { value: "value-asc", label: "Value: Low to High" },
  { value: "value-desc", label: "Value: High to Low" },
];

export default function SupplierInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<any>(null);

  // Adjustment form state
  const [adjustForm, setAdjustForm] = useState({
    quantity: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    setIsVisible(true);
    loadInventory();
  }, [user?.id]);

  const loadInventory = () => {
    setIsLoading(true);
    try {
      // Load products and convert to inventory format
      const savedProducts = localStorage.getItem(
        `supplier_${user?.id}_products`
      );
      if (savedProducts) {
        const products: Product[] = JSON.parse(savedProducts);
        const inventoryData = products.map((product: Product) => ({
          ...product,
          inventoryStatus: getInventoryStatus(
            product.quantity,
            product.minimumOrderQuantity || 1
          ),
          totalValue: product.price * product.quantity,
          lastUpdated: product.updatedAt,
        }));
        setInventory(inventoryData);
      } else {
        // Sample inventory data if no products exist
        const sampleInventory = [
          {
            id: "1",
            name: "Industrial Steel Rods",
            sku: "ISR-001",
            category: "Raw Materials",
            quantity: 500,
            minimumOrderQuantity: 50,
            price: 45.99,
            totalValue: 22995,
            inventoryStatus: "in-stock",
            lastUpdated: "2025-08-28T10:00:00Z",
            origin: "Local Foundry",
          },
          {
            id: "2",
            name: "Silicon Wafers",
            sku: "SW-002",
            category: "Electronics Components",
            quantity: 25,
            minimumOrderQuantity: 10,
            price: 125.5,
            totalValue: 3137.5,
            inventoryStatus: "low-stock",
            lastUpdated: "2025-08-27T15:30:00Z",
            origin: "Tech Suppliers Inc",
          },
          {
            id: "3",
            name: "Organic Cotton Rolls",
            sku: "OCR-003",
            category: "Textiles & Fabrics",
            quantity: 0,
            minimumOrderQuantity: 100,
            price: 8.99,
            totalValue: 0,
            inventoryStatus: "out-of-stock",
            lastUpdated: "2025-08-26T09:15:00Z",
            origin: "Green Textiles Co",
          },
          {
            id: "4",
            name: "Chemical Catalyst X1",
            sku: "CCX-004",
            category: "Chemical Products",
            quantity: 150,
            minimumOrderQuantity: 25,
            price: 89.99,
            totalValue: 13498.5,
            inventoryStatus: "reserved",
            lastUpdated: "2025-08-25T14:20:00Z",
            origin: "ChemLab Solutions",
          },
        ];
        setInventory(sampleInventory);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      toast.error("Failed to load inventory");
    } finally {
      setIsLoading(false);
    }
  };

  const getInventoryStatus = (quantity: number, minQuantity: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity <= minQuantity * 2) return "low-stock";
    return "in-stock";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-stock":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "low-stock":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "out-of-stock":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "reserved":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-stock":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "low-stock":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "out-of-stock":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      case "reserved":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const handleAdjustStock = (item: any) => {
    setAdjustingItem(item);
    setAdjustForm({
      quantity: "",
      reason: "",
      notes: "",
    });
    setIsAdjustOpen(true);
  };

  const handleSaveAdjustment = async () => {
    if (!adjustingItem || !adjustForm.quantity) {
      toast.error("Please enter an adjustment quantity");
      return;
    }

    try {
      const adjustment = parseInt(adjustForm.quantity);
      const newQuantity = Math.max(0, adjustingItem.quantity + adjustment);

      // Update inventory
      const updatedInventory = inventory.map((item) =>
        item.id === adjustingItem.id
          ? {
              ...item,
              quantity: newQuantity,
              totalValue: item.price * newQuantity,
              inventoryStatus: getInventoryStatus(
                newQuantity,
                item.minimumOrderQuantity || 1
              ),
              lastUpdated: new Date().toISOString(),
            }
          : item
      );

      setInventory(updatedInventory);

      // Update products in localStorage if exists
      const savedProducts = localStorage.getItem(
        `supplier_${user?.id}_products`
      );
      if (savedProducts) {
        const products: Product[] = JSON.parse(savedProducts);
        const updatedProducts = products.map((product) =>
          product.id === adjustingItem.id
            ? {
                ...product,
                quantity: newQuantity,
                updatedAt: new Date().toISOString(),
              }
            : product
        );
        localStorage.setItem(
          `supplier_${user?.id}_products`,
          JSON.stringify(updatedProducts)
        );
      }

      toast.success(
        `Stock adjusted successfully. ${adjustment > 0 ? "Added" : "Removed"} ${Math.abs(
          adjustment
        )} units.`
      );
      setIsAdjustOpen(false);
      setAdjustingItem(null);
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock");
    }
  };

  const filteredAndSortedInventory = useMemo(() => {
    const filtered = inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "All Status" ||
        item.inventoryStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "quantity-asc":
          return a.quantity - b.quantity;
        case "quantity-desc":
          return b.quantity - a.quantity;
        case "value-asc":
          return a.totalValue - b.totalValue;
        case "value-desc":
          return b.totalValue - a.totalValue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchTerm, selectedStatus, sortBy]);

  // Calculate statistics
  const totalItems = inventory.length;
  const totalValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
  const inStockItems = inventory.filter(
    (item) => item.inventoryStatus === "in-stock"
  ).length;
  const lowStockItems = inventory.filter(
    (item) => item.inventoryStatus === "low-stock"
  ).length;
  const outOfStockItems = inventory.filter(
    (item) => item.inventoryStatus === "out-of-stock"
  ).length;
  const reservedItems = inventory.filter(
    (item) => item.inventoryStatus === "reserved"
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/10">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-gray-100 dark:via-blue-400 dark:to-gray-100 bg-clip-text text-transparent">
                Supply Chain Inventory
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Manage stock levels and track inventory across your supply chain
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={loadInventory}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => router.push("/supplier/add-product")}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {[
              {
                title: "Total Items",
                value: totalItems.toLocaleString(),
                subtitle: "Products in inventory",
                icon: Package,
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
                iconBg: "from-blue-500 to-cyan-500",
              },
              {
                title: "Total Value",
                value: formatCurrency(totalValue),
                subtitle: "Inventory worth",
                icon: DollarSign,
                gradient: "from-green-500 to-emerald-500",
                bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
                iconBg: "from-green-500 to-emerald-500",
              },
              {
                title: "In Stock",
                value: inStockItems.toString(),
                subtitle: "Available items",
                icon: CheckCircle,
                gradient: "from-green-500 to-teal-500",
                bgGradient: "from-green-500/5 via-transparent to-teal-500/5",
                iconBg: "from-green-500 to-teal-500",
              },
              {
                title: "Low Stock",
                value: lowStockItems.toString(),
                subtitle: "Need restocking",
                icon: AlertTriangle,
                gradient: "from-yellow-500 to-orange-500",
                bgGradient: "from-yellow-500/5 via-transparent to-orange-500/5",
                iconBg: "from-yellow-500 to-orange-500",
              },
              {
                title: "Out of Stock",
                value: outOfStockItems.toString(),
                subtitle: "Require immediate attention",
                icon: XCircle,
                gradient: "from-red-500 to-pink-500",
                bgGradient: "from-red-500/5 via-transparent to-pink-500/5",
                iconBg: "from-red-500 to-pink-500",
              },
              {
                title: "Reserved",
                value: reservedItems.toString(),
                subtitle: "Allocated items",
                icon: Shield,
                gradient: "from-purple-500 to-indigo-500",
                bgGradient: "from-purple-500/5 via-transparent to-indigo-500/5",
                iconBg: "from-purple-500 to-indigo-500",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}
                />
                <CardContent className="relative z-10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-r ${stat.iconBg} flex items-center justify-center shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    {index === 1 && (
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {stat.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {stat.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search inventory by name, SKU, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full lg:w-48 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="All Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-48 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Sort by" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredAndSortedInventory.length > 0 ? (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                        <Warehouse className="h-4 w-4 text-white" />
                      </div>
                      Inventory Overview
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {filteredAndSortedInventory.length} items found
                    </CardDescription>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Live Data
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-200/50 dark:border-gray-800/50">
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Product
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          SKU
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Category
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Stock
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Status
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Unit Price
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Total Value
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Last Updated
                        </TableHead>
                        <TableHead className="text-gray-900 dark:text-gray-100 font-semibold">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedInventory.map((item: any) => (
                        <TableRow
                          key={item.id}
                          className="border-b border-gray-200/30 dark:border-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                <Package className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {item.name}
                                </p>
                                {item.origin && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Origin: {item.origin}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                              {item.sku}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-medium">
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                {item.quantity.toLocaleString()}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Min: {item.minimumOrderQuantity || 1}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item.inventoryStatus)}
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${getStatusColor(item.inventoryStatus)}`}
                                variant="secondary"
                              >
                                {item.inventoryStatus.replace("-", " ")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {formatCurrency(item.price)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {formatCurrency(item.totalValue)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(item.lastUpdated)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAdjustStock(item)}
                                className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Adjust
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
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center mb-6">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {totalItems === 0 ? "No Inventory Items" : "No Items Found"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {totalItems === 0
                    ? "Start by adding your first supply product to track inventory."
                    : "Try adjusting your search terms or filters to find items."}
                </p>
                {totalItems === 0 ? (
                  <Button
                    onClick={() => router.push("/supplier/add-product")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStatus("All Status");
                    }}
                    className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0"
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Edit className="h-4 w-4 text-white" />
              </div>
              Adjust Stock Level
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Adjust inventory for &quot;{adjustingItem?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-lg border border-gray-200/50 dark:border-gray-800/50">
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Current Stock
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {adjustingItem?.quantity?.toLocaleString() || 0} units
                </span>
              </div>
            </div>

            <div>
              <Label
                htmlFor="adjustment-quantity"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Adjustment Amount
              </Label>
              <Input
                id="adjustment-quantity"
                type="number"
                placeholder="e.g., +50 or -10"
                value={adjustForm.quantity}
                onChange={(e) =>
                  setAdjustForm((prev) => ({
                    ...prev,
                    quantity: e.target.value,
                  }))
                }
                className="mt-1 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use + for additions, - for reductions (e.g., +100, -25)
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Adjustment Reason
              </Label>
              <Select
                value={adjustForm.reason}
                onValueChange={(value) =>
                  setAdjustForm((prev) => ({ ...prev, reason: value }))
                }
              >
                <SelectTrigger className="mt-1 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restocking</SelectItem>
                  <SelectItem value="sold">Items Sold</SelectItem>
                  <SelectItem value="damaged">Damaged/Lost</SelectItem>
                  <SelectItem value="returned">Customer Return</SelectItem>
                  <SelectItem value="transfer">Warehouse Transfer</SelectItem>
                  <SelectItem value="audit">Stock Audit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label
                htmlFor="adjustment-notes"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Notes (Optional)
              </Label>
              <Textarea
                id="adjustment-notes"
                placeholder="Add any additional notes about this adjustment..."
                value={adjustForm.notes}
                onChange={(e) =>
                  setAdjustForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="mt-1 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAdjustOpen(false)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdjustment}
              disabled={!adjustForm.quantity || !adjustForm.reason}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
