/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationCircleIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartPieIcon,
  EyeIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "@/components/ui/sonner";

// VendorInventory type matching backend structure
interface VendorInventoryItem {
  _id: string;
  vendorId: string;
  vendorName: string;
  vendorRequestId?: string;
  orderId: string;
  supplier: {
    supplierId: string;
    supplierName: string;
    contactEmail: string;
    contactPhone: string;
  };
  inventoryItem: {
    inventoryId: string;
    name: string;
    sku: string;
    category: string;
    subcategory: string;
    description: string;
    images: Array<{ url: string; _id?: string }>;
    specifications?: any;
  };
  quantity: {
    received: number;
    used: number;
    current: number;
    reserved: number;
    damaged: number;
    unit: string;
  };
  cost: {
    perUnit: number;
    totalCost: number;
    currency: string;
  };
  dates: {
    purchased: string | Date;
    approved?: string | Date;
    received: string | Date;
  };
  location: {
    warehouse: string;
    section: string;
    bin: string;
  };
  reorderLevel: number;
  reorderQuantity: number;
  status: string;
  qualityStatus: string;
  blockchain: {
    txId: string;
    verified: boolean;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}
import SupplierInventorySkeleton from "@/components/skeletons/supplierInventorySkeleton";
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
import {
  getVendorInventory,
  getInventoryStats,
  deleteVendorInventory,
} from "@/lib/api/vendor.inventory.api";

const statusOptions = [
  "All Status",
  "Active",
  "Low Stock",
  "Depleted",
  "Inactive",
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "quantity-asc", label: "Stock: Low to High" },
  { value: "quantity-desc", label: "Stock: High to Low" },
  { value: "value-asc", label: "Value: Low to High" },
  { value: "value-desc", label: "Value: High to Low" },
];

// Custom CVT Icon component
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

export default function VendorMyInventoryPage() {
  usePageTitle("My Inventory");
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<VendorInventoryItem[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    inStockItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    reservedItems: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [inventoryItem, setInventoryItem] =
    useState<VendorInventoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadInventory();
  }, [user?.id]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      console.log("🔄 Loading vendor inventory...");
      const [inventoryResponse, statsResponse] = await Promise.all([
        getVendorInventory({ limit: 1000 }), // Load up to 1000 items
        getInventoryStats(),
      ]);

      console.log("📦 Inventory Response:", inventoryResponse);
      console.log("📊 Stats Response:", statsResponse);

      // The API returns { success, data } where data is the inventory array
      const inventoryData = Array.isArray(inventoryResponse)
        ? inventoryResponse
        : inventoryResponse.data || [];

      setInventory(inventoryData);

      // Calculate stats from actual inventory data
      const calculatedStats = {
        totalItems: inventoryData.length,
        totalValue: inventoryData.reduce(
          (sum: any, item: { cost: { totalCost: any } }) =>
            sum + (item.cost?.totalCost || 0),
          0
        ),
        inStockItems: inventoryData.filter(
          (item: { quantity: { current: number }; reorderLevel: number }) =>
            item.quantity?.current > item.reorderLevel
        ).length,
        lowStockItems: inventoryData.filter(
          (item: { quantity: { current: number }; reorderLevel: number }) =>
            item.quantity?.current > 0 &&
            item.quantity?.current <= item.reorderLevel
        ).length,
        outOfStockItems: inventoryData.filter(
          (item: { quantity: { current: number } }) =>
            item.quantity?.current === 0
        ).length,
        reservedItems: inventoryData.reduce(
          (sum: any, item: { quantity: { reserved: any } }) =>
            sum + (item.quantity?.reserved || 0),
          0
        ),
      };

      setStats(calculatedStats);

      console.log("✅ Inventory set:", inventoryData.length, "items");
      console.log("✅ Stats calculated:", calculatedStats);
      toast.success("Inventory loaded successfully");
    } catch (error: any) {
      console.error("❌ Error loading inventory:", error);
      toast.error(error?.message || "Failed to load inventory");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    const item = inventory.find((inv) => inv._id === id);
    if (item) {
      setInventoryItem(item);
      setIsDeleteOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!inventoryItem) return;

    setIsDeleting(true);
    try {
      await deleteVendorInventory(inventoryItem._id);
      toast.success("Inventory item deleted successfully");
      setIsDeleteOpen(false);
      setInventoryItem(null);
      // Reload inventory after deletion
      loadInventory();
    } catch (error: any) {
      console.error("Error deleting inventory:", error);
      toast.error(error?.message || "Failed to delete inventory item");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusDisplay = (item: VendorInventoryItem) => {
    if (item.status === "inactive") return "inactive";
    if (item.quantity.current === 0) return "out_of_stock";
    if (item.quantity.current <= item.reorderLevel) return "low_stock";
    return "active";
  };

  const filteredAndSortedInventory = useMemo(() => {
    const statusMapping: Record<string, string> = {
      Active: "active",
      "Low Stock": "low_stock",
      Depleted: "out_of_stock",
      Inactive: "inactive",
    };

    const filtered = inventory.filter((item) => {
      const matchesSearch =
        item.inventoryItem.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.inventoryItem.sku
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.inventoryItem.category
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const itemStatus = getStatusDisplay(item);
      const normalizedSelectedStatus =
        statusMapping[selectedStatus] ||
        selectedStatus.toLowerCase().replace(/ /g, "_");
      const matchesStatus =
        selectedStatus === "All Status" ||
        itemStatus === normalizedSelectedStatus ||
        item.status === normalizedSelectedStatus;

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.inventoryItem.name.localeCompare(b.inventoryItem.name);
        case "name-desc":
          return b.inventoryItem.name.localeCompare(a.inventoryItem.name);
        case "quantity-asc":
          return a.quantity.current - b.quantity.current;
        case "quantity-desc":
          return b.quantity.current - a.quantity.current;
        case "value-asc":
          return a.cost.totalCost - b.cost.totalCost;
        case "value-desc":
          return b.cost.totalCost - a.cost.totalCost;
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchTerm, selectedStatus, sortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "CVT",
    }).format(amount);
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

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
      case "in_stock":
        return badgeColors.green;
      case "low_stock":
        return badgeColors.yellow;
      case "out_of_stock":
      case "depleted":
        return badgeColors.red;
      case "inactive":
        return badgeColors.blue;
      default:
        return badgeColors.blue;
    }
  };

  const capitalizeStatus = (status: string) => {
    // Replace out_of_stock with depleted for vendor context
    if (status === "out_of_stock") {
      return "Depleted";
    }
    return status
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return <SupplierInventorySkeleton />;
  }

  return (
    <div
      className={`relative z-10 p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>My Inventory</BreadcrumbPage>
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
              My Inventory
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              View and manage inventory purchased from suppliers
            </p>
            {/* Header badges */}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                {stats.totalItems} Items
              </Badge>
              <Badge
                className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
              >
                <ShieldCheckIcon
                  className={`h-3 w-3 ${badgeColors.cyan.icon}`}
                />
                Blockchain Verified
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              className={`flex items-center gap-2 text-xs cursor-pointer !rounded-none ${colors.buttons.primary} transition-all`}
            >
              <ArrowDownTrayIcon className={`h-4 w-4 ${colors.icons.white}`} />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={`transform transition-all duration-700 delay-200`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Materials",
              value: stats.totalItems.toLocaleString(),
              subtitle: "Raw materials in stock",
              icon: CubeIcon,
            },
            {
              title: "Total Investment",
              value: formatCurrencyAbbreviated(stats.totalValue),
              subtitle: "Materials worth",
              icon: RsIcon,
            },
            {
              title: "Available Stock",
              value: stats.inStockItems.toString(),
              subtitle: "Ready to use",
              icon: CheckCircleIcon,
            },
            {
              title: "Low Stock",
              value: stats.lowStockItems.toString(),
              subtitle: "Need reordering",
              icon: ExclamationCircleIcon,
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
                <div className="h-10 w-10 flex items-center justify-center rounded-none">
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
      </div>

      {/* Filters Card */}
      <div className={`transform transition-all duration-700 delay-300`}>
        <Card className={`${colors.cards.base} rounded-none shadow-none`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-base">
              <div className="h-8 w-8 rounded-none flex items-center justify-center">
                <FunnelIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              </div>
              Filters & Search
            </CardTitle>
            <CardDescription className={`text-xs ${colors.texts.secondary}`}>
              Filter and search through your inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-6">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search inventory by name, SKU, or category"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 ${colors.borders.primary} rounded-none cursor-pointer hover:${colors.borders.hover} hover:border-black focus:${colors.borders.focus} outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-sm h-9"
                      >
                        {status.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 ${colors.borders.primary} rounded-none cursor-pointer hover:${colors.borders.hover} hover:border-black focus:${colors.borders.focus} outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
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
            </div>
            <div className="flex items-center justify-between">
              <div className="flex gap-2 items-center">
                {searchTerm && (
                  <Badge
                    variant="outline"
                    className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
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
                    className={`${getStatusBadgeColor(selectedStatus).bg} ${getStatusBadgeColor(selectedStatus).border} ${getStatusBadgeColor(selectedStatus).text} flex items-center gap-1 text-xs rounded-none`}
                  >
                    {selectedStatus.replace("_", " ")}
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
      <div className={`transform transition-all duration-700 delay-400`}>
        {filteredAndSortedInventory.length > 0 ? (
          <Card
            className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
          >
            <CardHeader className={`${colors.borders.primary}`}>
              <div className="flex flex-row items-center gap-4">
                <div className="flex flex-col">
                  <CardTitle
                    className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                  >
                    <div className="h-8 w-8 rounded-none flex items-center justify-center">
                      <BuildingStorefrontIcon
                        className={`h-4 w-4 ${colors.icons.primary}`}
                      />
                    </div>
                    My Inventory Overview
                  </CardTitle>
                </div>
                <div className="flex-1" />
                <div>
                  <Badge
                    variant="secondary"
                    className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none flex items-center`}
                  >
                    <ChartPieIcon
                      className={`h-3 w-3 mr-1 ${badgeColors.blue.icon}`}
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
                    <TableRow className={`${colors.borders.secondary}`}>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Product
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        SKU
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Category
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Stock
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Status
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Unit Price
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Total Value
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Last Updated
                      </TableHead>
                      <TableHead
                        className={`${colors.texts.primary} font-semibold`}
                      >
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedInventory.map(
                      (item: VendorInventoryItem) => {
                        const itemStatus = getStatusDisplay(item);
                        const badgeColor = getStatusBadgeColor(itemStatus);
                        const totalValue = item.cost.totalCost;

                        return (
                          <TableRow
                            key={item._id}
                            className={`${colors.borders.secondary} ${colors.backgrounds.hover} transition-colors rounded-none`}
                          >
                            <TableCell className="pl-8 pr-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`h-10 w-10 rounded-none ${colors.backgrounds.primary} flex items-center justify-center`}
                                >
                                  {item.inventoryItem.images &&
                                  item.inventoryItem.images.length > 0 &&
                                  item.inventoryItem.images[0] ? (
                                    <img
                                      src={item.inventoryItem.images[0].url}
                                      alt={item.inventoryItem.name}
                                      className="h-10 w-10 object-cover rounded-none"
                                      style={{
                                        minWidth: 40,
                                        minHeight: 40,
                                        background: "#f3f4f6",
                                      }}
                                    />
                                  ) : (
                                    <CubeIcon
                                      className={`h-5 w-5 ${colors.texts.primary}`}
                                    />
                                  )}
                                </div>
                                <div>
                                  <p
                                    className={`font-medium ${colors.texts.primary} text-xs`}
                                  >
                                    {item.inventoryItem.name}
                                  </p>
                                  <p
                                    className={`text-xs ${colors.texts.muted}`}
                                  >
                                    From: {item.supplier.supplierName}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="pl-4 pr-4">
                              <Badge
                                variant="outline"
                                className="bg-gray-100 dark:bg-gray-800 ${colors.borders.primary} text-gray-700 dark:text-gray-300 font-mono text-xs px-2 py-1 rounded-none"
                              >
                                {item.inventoryItem.sku}
                              </Badge>
                            </TableCell>
                            <TableCell className="pl-4 pr-4">
                              <Badge
                                variant="outline"
                                className="font-medium text-xs ${colors.borders.primary} rounded-none"
                              >
                                {item.inventoryItem.category}
                              </Badge>
                            </TableCell>
                            <TableCell className="pl-4 pr-4">
                              <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs">
                                  {item.quantity.current.toLocaleString()}{" "}
                                  {item.quantity.unit}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                  Min: {item.reorderLevel}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="pl-4 pr-4">
                              <Badge
                                className={`text-xs px-2 py-1 font-medium ${badgeColor.bg} ${badgeColor.border} ${badgeColor.text} flex items-center gap-1 rounded-none`}
                                variant="secondary"
                              >
                                {itemStatus === "active" && (
                                  <CheckCircleIcon
                                    className={`h-3 w-3 ${badgeColor.icon}`}
                                  />
                                )}
                                {itemStatus === "low_stock" && (
                                  <ExclamationCircleIcon
                                    className={`h-3 w-3 ${badgeColor.icon}`}
                                  />
                                )}
                                {itemStatus === "out_of_stock" && (
                                  <XCircleIcon
                                    className={`h-3 w-3 ${badgeColor.icon}`}
                                  />
                                )}
                                {itemStatus === "inactive" && (
                                  <ClockIcon
                                    className={`h-3 w-3 ${badgeColor.icon}`}
                                  />
                                )}
                                {capitalizeStatus(itemStatus)}
                              </Badge>
                            </TableCell>
                            <TableCell className="pl-4 pr-4">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-xs">
                                {formatCurrencyAbbreviated(item.cost.perUnit)}
                              </span>
                            </TableCell>
                            <TableCell className="pl-4 pr-4">
                              <span className="font-bold text-green-600 dark:text-green-400 text-xs">
                                {formatCurrencyAbbreviated(totalValue)}
                              </span>
                            </TableCell>
                            <TableCell className="pl-4 pr-4">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {formatDate(item.updatedAt)}
                              </span>
                            </TableCell>
                            <TableCell className="pl-4 pr-8">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => handleDeleteClick(item._id)}
                                  disabled={isDeleting}
                                  className="flex items-center justify-center gap-1 px-3 py-2 text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                                >
                                  {isDeleting ? (
                                    <>
                                      <ArrowPathIcon className="h-3 w-3 mr-2 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <TrashIcon className="h-3 w-3 mr-2" />
                                      Delete Item
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className={`text-center py-16 ${colors.cards.base} overflow-hidden rounded-none !shadow-none hover:!shadow-none`}
          >
            <CardContent>
              <div
                className={`h-20 w-20 mx-auto mb-6 backdrop-blur-sm rounded-none flex items-center justify-center`}
              >
                <CubeIcon className={`h-10 w-10 ${colors.texts.primary}`} />
              </div>
              <h3
                className={`text-base font-semibold ${colors.texts.primary} mb-2`}
              >
                {stats.totalItems === 0
                  ? "No Inventory Items"
                  : "No Items Found"}
              </h3>
              <p
                className={`text-xs ${colors.texts.secondary} mb-6 max-w-md mx-auto`}
              >
                {stats.totalItems === 0
                  ? "You haven't purchased any raw materials yet. Browse supplier inventory to get started."
                  : "Try adjusting your search terms or filters to find materials."}
              </p>
              {stats.totalItems === 0 ? (
                <Button
                  onClick={() => router.push("/vendor/supplier-inventory")}
                  className={`${colors.buttons.primary} shadow-none hover:shadow-none transition-all duration-300 text-xs cursor-pointer rounded-none`}
                >
                  <MagnifyingGlassIcon
                    className={`h-4 w-4 ${colors.texts.inverse}`}
                  />
                  Browse Supplier Inventory
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("All Status");
                  }}
                  className={`inline-flex items-center gap-2 text-xs cursor-pointer ${colors.buttons.outline} transition-all rounded-none`}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent
          className={`max-w-md ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none shadow-none`}
        >
          <DialogHeader>
            <DialogTitle
              className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
            >
              <div className="h-10 w-10 flex items-center justify-center">
                <TrashIcon className="h-5 w-5 text-red-600" />
              </div>
              Delete Inventory Item
            </DialogTitle>
            <DialogDescription className={`text-xs ${colors.texts.secondary}`}>
              Are you sure you want to delete &quot;
              {inventoryItem?.inventoryItem.name}
              &quot;? This action cannot be undone and will permanently remove
              the item from your inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white bg-transparent border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors cursor-pointer rounded-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
            >
              Cancel
            </button>
            <Button
              variant="outline"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
            >
              {isDeleting ? (
                <>
                  <ArrowPathIcon className="h-3 w-3 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="h-3 w-3 mr-2" />
                  Delete Item
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
