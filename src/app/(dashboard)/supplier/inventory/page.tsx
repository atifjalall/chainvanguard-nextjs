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
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Badge } from "@/components/_ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/_ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/_ui/table";
import { Label } from "@/components/_ui/label";
import { Textarea } from "@/components/_ui/textarea";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  ExclamationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ChartPieIcon,
  EyeIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
  SparklesIcon,
  BuildingLibraryIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  BoltIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";
import SupplierInventorySkeleton from "@/components/skeletons/supplierInventorySkeleton";

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
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case "low-stock":
        return <ExclamationCircleIcon className="h-4 w-4 text-yellow-500" />;
      case "out-of-stock":
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case "reserved":
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <CubeIcon className="h-4 w-4 text-gray-500" />;
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
      toast.error("Failed to Edit stock");
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

  // BADGE COLOR MAP
  const badgeColorMap: Record<
    string,
    { bg: string; border: string; text: string; icon: string }
  > = {
    green: {
      bg: "bg-green-100/10 dark:bg-green-900/10",
      border: "border border-green-200 dark:border-green-900",
      text: "text-green-700 dark:text-green-400",
      icon: "text-green-700 dark:text-green-400",
    },
    blue: {
      bg: "bg-blue-100/10 dark:bg-blue-900/10",
      border: "border border-blue-200 dark:border-blue-900",
      text: "text-blue-700 dark:text-blue-400",
      icon: "text-blue-700 dark:text-blue-400",
    },
    yellow: {
      bg: "bg-yellow-100/10 dark:bg-yellow-900/10",
      border: "border border-yellow-200 dark:border-yellow-900",
      text: "text-yellow-700 dark:text-yellow-400",
      icon: "text-yellow-700 dark:text-yellow-400",
    },
    red: {
      bg: "bg-red-100/10 dark:bg-red-900/10",
      border: "border border-red-200 dark:border-red-900",
      text: "text-red-700 dark:text-red-400",
      icon: "text-red-700 dark:text-red-400",
    },
  };

  // Helper to get badge color by status/type
  function getBadgeColor(type: string) {
    switch (type) {
      case "in-stock":
      case "active":
      case "Items":
        return badgeColorMap.green;
      case "low-stock":
      case "yellow":
      case "pending":
        return badgeColorMap.yellow;
      case "out-of-stock":
      case "red":
        return badgeColorMap.red;
      case "reserved":
      case "blue":
      case "Inventory Tracked":
      case "Live Data":
        return badgeColorMap.blue;
      default:
        return badgeColorMap.blue;
    }
  }

  if (isLoading) {
    return <SupplierInventorySkeleton />;
  }

  return (
    <div className="relative z-10 p-6 space-y-6 bg-white dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Supply Chain Inventory
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Manage stock levels and track inventory across your supply chain
            </p>
            {/* Header badges */}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${getBadgeColor("Items").bg} ${getBadgeColor("Items").border} ${getBadgeColor("Items").text} text-xs rounded-none`}
              >
                {totalItems} Items
              </Badge>
              <Badge
                className={`${getBadgeColor("blue").bg} ${getBadgeColor("blue").border} ${getBadgeColor("blue").text} flex items-center gap-1 text-xs rounded-none`}
              >
                <CheckCircleIcon
                  className={`h-3 w-3 text-blue-700 dark:text-blue-400`}
                />
                Inventory Tracked
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadInventory}
              variant="outline"
              className="hidden lg:flex items-center gap-2 text-xs cursor-pointer rounded-none border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
            >
              <ArrowPathIcon className="h-4 w-4 text-black dark:text-white" />
              Refresh
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 text-xs cursor-pointer rounded-none border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
            >
              <ArrowDownTrayIcon className="h-4 w-4 text-black dark:text-white" />
              Export
            </Button>
            <Button
              onClick={() => router.push("/supplier/add-inventory")}
              className="flex items-center gap-2 px-4 py-2 rounded-none bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-medium text-xs cursor-pointer transition-all"
            >
              <PlusIcon className="h-4 w-4 text-white dark:text-black" />
              Add Inventory
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: "Total Items",
              value: totalItems.toLocaleString(),
              subtitle: "Products in inventory",
              icon: CubeIcon,
            },
            {
              title: "Total Value",
              value: formatCurrency(totalValue),
              subtitle: "Inventory worth",
              icon: CurrencyDollarIcon,
            },
            {
              title: "In Stock",
              value: inStockItems.toString(),
              subtitle: "Available items",
              icon: CheckCircleIcon,
            },
            {
              title: "Low Stock",
              value: lowStockItems.toString(),
              subtitle: "Need restocking",
              icon: ExclamationTriangleIcon,
            },
            {
              title: "Out of Stock",
              value: outOfStockItems.toString(),
              subtitle: "Require immediate attention",
              icon: XCircleIcon,
            },
          ].map((stat, index) => (
            <Card
              key={index}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] rounded-none"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className="h-10 w-10 flex items-center justify-center rounded-none">
                  <stat.icon className="h-5 w-5 text-black dark:text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {stat.value}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters Card */}
      <div
        className={`transform transition-all duration-700 delay-300 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-900 rounded-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="h-8 w-8 rounded-none flex items-center justify-center">
                <FunnelIcon className="h-4 w-4 text-black dark:text-white" />
              </div>
              Filters & Search
            </CardTitle>
            <CardDescription className="text-xs">
              Filter and search through your inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search inventory by name, SKU, or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {statusOptions.map((status) => (
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
                <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
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
                    className={`${badgeColorMap.blue.bg} ${badgeColorMap.blue.border} ${badgeColorMap.blue.text} text-xs rounded-none`}
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
                {selectedStatus !== "All Status" && (
                  <Badge
                    variant="outline"
                    className={`${getBadgeColor(selectedStatus).bg} ${getBadgeColor(selectedStatus).border} ${getBadgeColor(selectedStatus).text} flex items-center gap-1 text-xs rounded-none`}
                  >
                    {/* Optionally, add icon for status badge if you want */}
                    {selectedStatus === "in-stock" && (
                      <CheckCircleIcon
                        className={`h-3 w-3 ${badgeColorMap.green.icon} dark:text-white`}
                      />
                    )}
                    {selectedStatus === "low-stock" && (
                      <ExclamationCircleIcon
                        className={`h-3 w-3 ${badgeColorMap.yellow.icon} dark:text-white`}
                      />
                    )}
                    {selectedStatus === "out-of-stock" && (
                      <XCircleIcon
                        className={`h-3 w-3 ${badgeColorMap.red.icon} dark:text-white`}
                      />
                    )}
                    {selectedStatus === "reserved" && (
                      <ClockIcon
                        className={`h-3 w-3 ${badgeColorMap.red.icon} dark:text-white`}
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
                  {filteredAndSortedInventory.length} items found
                </span>
              </div>
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
          <Card className="border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-900 rounded-none">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-row items-center gap-4">
                <div className="flex flex-col">
                  <CardTitle className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-100">
                    <div className="h-8 w-8 rounded-none flex items-center justify-center">
                      <BuildingStorefrontIcon className="h-4 w-4 text-black dark:text-white" />
                    </div>
                    Inventory Overview
                  </CardTitle>
                </div>
                <div className="flex-1" />
                <div>
                  {/* "Live Data" badge */}
                  <Badge
                    variant="secondary"
                    className={`${badgeColorMap.blue.bg} ${badgeColorMap.blue.border} ${badgeColorMap.blue.text} text-xs rounded-none flex items-center`}
                  >
                    <ChartPieIcon
                      className={`h-3 w-3 mr-1 ${badgeColorMap.blue.icon}`}
                    />
                    Live Data
                  </Badge>
                </div>
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
                        className="border-b border-gray-200/30 dark:border-gray-800/30 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors rounded-none"
                      >
                        <TableCell className="pl-8 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-none bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                              <CubeIcon className="h-5 w-5 text-black dark:text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                                {item.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                Origin: {item.origin}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="pl-4 pr-4">
                          <Badge
                            variant="outline"
                            className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-mono text-xs px-2 py-1 rounded-none"
                          >
                            {item.sku}
                          </Badge>
                        </TableCell>
                        <TableCell className="pl-4 pr-4">
                          <Badge
                            variant="outline"
                            className="font-medium text-xs border-0 rounded-none"
                          >
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="pl-4 pr-4">
                          <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                              {item.quantity.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Min: {item.minimumOrderQuantity || 1}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="pl-4 pr-4">
                          <div className="flex items-center gap-2">
                            {/* REMOVE getStatusIcon(item.inventoryStatus) here */}
                            <Badge
                              className={`text-xs px-2 py-1 font-medium ${
                                item.inventoryStatus === "in-stock"
                                  ? `${badgeColorMap.green.bg} ${badgeColorMap.green.border} ${badgeColorMap.green.text}`
                                  : item.inventoryStatus === "low-stock"
                                    ? `${badgeColorMap.yellow.bg} ${badgeColorMap.yellow.border} ${badgeColorMap.yellow.text}`
                                    : item.inventoryStatus === "out-of-stock"
                                      ? `${badgeColorMap.red.bg} ${badgeColorMap.red.border} ${badgeColorMap.red.text}`
                                      : item.inventoryStatus === "reserved"
                                        ? `${badgeColorMap.blue.bg} ${badgeColorMap.blue.border} ${badgeColorMap.blue.text}`
                                        : `${badgeColorMap.blue.bg} ${badgeColorMap.blue.border} ${badgeColorMap.blue.text}`
                              } flex items-center gap-1 rounded-none`}
                              variant="secondary"
                            >
                              {item.inventoryStatus === "in-stock" && (
                                <CheckCircleIcon
                                  className={`h-3 w-3 ${badgeColorMap.green.icon} dark:text-white`}
                                />
                              )}
                              {item.inventoryStatus === "low-stock" && (
                                <ExclamationCircleIcon
                                  className={`h-3 w-3 ${badgeColorMap.yellow.icon} dark:text-white`}
                                />
                              )}
                              {item.inventoryStatus === "out-of-stock" && (
                                <XCircleIcon
                                  className={`h-3 w-3 ${badgeColorMap.red.icon} dark:text-white`}
                                />
                              )}
                              {item.inventoryStatus === "reserved" && (
                                <ClockIcon
                                  className={`h-3 w-3 ${badgeColorMap.blue.icon} dark:text-white`}
                                />
                              )}
                              {![
                                "in-stock",
                                "low-stock",
                                "out-of-stock",
                                "reserved",
                              ].includes(item.inventoryStatus) && (
                                <CubeIcon
                                  className={`h-3 w-3 ${badgeColorMap.blue.icon} dark:text-white`}
                                />
                              )}
                              {item.inventoryStatus.replace("-", " ")}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="pl-4 pr-4">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                            {formatCurrency(item.price)}
                          </span>
                        </TableCell>
                        <TableCell className="pl-4 pr-4">
                          <span className="font-bold text-green-600 dark:text-green-400 text-xs">
                            {formatCurrency(item.totalValue)}
                          </span>
                        </TableCell>
                        <TableCell className="pl-4 pr-4">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {formatDate(item.lastUpdated)}
                          </span>
                        </TableCell>
                        <TableCell className="pl-4 pr-8">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(`/supplier/inventory/${item.id}/`)
                              }
                              className="h-8 px-3 hover:bg-gray-50 hover:border-gray-200 dark:hover:bg-gray-900/20 text-xs cursor-pointer rounded-none"
                            >
                              <EyeIcon className="h-3 w-3 mr-1 text-black dark:text-white" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                router.push(
                                  `/supplier/inventory/${item.id}/edit`
                                )
                              }
                              className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 text-xs cursor-pointer rounded-none"
                            >
                              <PencilIcon className="h-3 w-3 mr-1 text-black dark:text-white" />
                              Edit
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
          <Card className="text-center py-16 border border-gray-200 dark:border-gray-700 shadow-md bg-white dark:bg-gray-900 overflow-hidden rounded-none">
            <CardContent>
              <div className="h-20 w-20 mx-auto mb-6 bg-gray-100/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-none flex items-center justify-center">
                <CubeIcon className="h-10 w-10 text-black dark:text-white" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {totalItems === 0 ? "No Inventory Items" : "No Items Found"}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {totalItems === 0
                  ? "Start by adding your first supply product to track inventory."
                  : "Try adjusting your search terms or filters to find items."}
              </p>
              {totalItems === 0 ? (
                <Button
                  onClick={() => router.push("/supplier/add-product")}
                  className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 text-xs cursor-pointer rounded-none"
                >
                  <PlusIcon className="h-4 w-4 mr-2 text-white dark:text-black" />
                  Add First Item
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("All Status");
                  }}
                  className="inline-flex items-center gap-2 text-xs cursor-pointer rounded-none border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                >
                  {/* No icon here, but if you add one, use text-black */}
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-md rounded-none">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-base text-gray-900 dark:text-gray-100">
              <div className="h-8 w-8 rounded-none flex items-center justify-center">
                <PencilIcon className="h-4 w-4 text-black dark:text-white" />
              </div>
              Edit Stock Level
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 dark:text-gray-400">
              Edit inventory for &quot;{adjustingItem?.name}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-none border border-gray-200 dark:border-gray-700">
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Current Stock
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <CubeIcon className="h-4 w-4 text-black" />
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                  {adjustingItem?.quantity?.toLocaleString() || 0} units
                </span>
              </div>
            </div>

            <div>
              <Label
                htmlFor="adjustment-quantity"
                className="text-xs font-medium text-gray-700 dark:text-gray-300"
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
                className="mt-1 h-12 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none rounded-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use + for additions, - for reductions (e.g., +100, -25)
              </p>
            </div>

            <div>
              <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Adjustment Reason
              </Label>
              <Select
                value={adjustForm.reason}
                onValueChange={(value) =>
                  setAdjustForm((prev) => ({ ...prev, reason: value }))
                }
              >
                <SelectTrigger className="mt-1 h-12 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none rounded-none">
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
                className="text-xs font-medium text-gray-700 dark:text-gray-300"
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
                className="mt-1 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none rounded-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAdjustOpen(false)}
              className="shadow-lg hover:shadow-xl transition-all duration-300 text-xs cursor-pointer rounded-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdjustment}
              disabled={!adjustForm.quantity || !adjustForm.reason}
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 shadow-lg hover:shadow-xl transition-all duration-300 text-xs cursor-pointer rounded-none"
            >
              <CheckCircleIcon className="h-4 w-4 mr-2 text-black dark:text-white" />
              Save Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
