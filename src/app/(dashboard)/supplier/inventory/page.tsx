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
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  PencilIcon,
  ExclamationCircleIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartPieIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { Inventory } from "@/types";
import { toast } from "@/components/ui/sonner";
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

import {
  getSupplierInventory,
  getInventoryStats,
} from "@/lib/api/inventory.api";

const statusOptions = [
  "All Status",
  "Active",
  "Low Stock",
  "Out of Stock",
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

// Custom Rs Icon component
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
      Rs
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

export default function SupplierInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [stats, setStats] = useState({
    totalItems: 0,
    totalValue: 0,
    inStockItems: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    reservedItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("name-asc");

  useEffect(() => {
    setIsVisible(true);
    loadInventory();
  }, [user?.id]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const [inventoryResponse, statsResponse] = await Promise.all([
        getSupplierInventory(),
        getInventoryStats(),
      ]);

      setInventory(inventoryResponse.data || []);
      setStats(
        statsResponse.data || {
          totalItems: 0,
          totalValue: 0,
          inStockItems: 0,
          lowStockItems: 0,
          outOfStockItems: 0,
          reservedItems: 0,
        }
      );
      toast.success("Inventory loaded successfully");
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      toast.error(error?.message || "Failed to load inventory");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (item: Inventory) => {
    if (item.status === "inactive") return "inactive";
    if (item.stockStatus) return item.stockStatus;
    if (item.quantity === 0) return "out_of_stock";
    if (item.quantity <= item.minStockLevel) return "low_stock";
    return "active";
  };

  const filteredAndSortedInventory = useMemo(() => {
    const statusMapping: Record<string, string> = {
      Active: "active",
      "Low Stock": "low_stock",
      "Out of Stock": "out_of_stock",
      Inactive: "inactive",
    };

    const filtered = inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

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
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "quantity-asc":
          return a.quantity - b.quantity;
        case "quantity-desc":
          return b.quantity - a.quantity;
        case "value-asc":
          return (
            (a.stockValue || a.pricePerUnit * a.quantity) -
            (b.stockValue || b.pricePerUnit * b.quantity)
          );
        case "value-desc":
          return (
            (b.stockValue || b.pricePerUnit * b.quantity) -
            (a.stockValue || a.pricePerUnit * a.quantity)
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchTerm, selectedStatus, sortBy]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
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
        return badgeColors.red;
      case "inactive":
        return badgeColors.blue;
      default:
        return badgeColors.blue;
    }
  };

  const capitalizeStatus = (status: string) => {
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
            <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Inventory</BreadcrumbPage>
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
              Supply Chain Inventory
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Manage stock levels and track inventory across your supply chain
            </p>
            {/* Header badges */}
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
              >
                {stats.totalItems} Items
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} flex items-center gap-1 text-xs rounded-none`}
              >
                <CheckCircleIcon
                  className={`h-3 w-3 ${badgeColors.blue.icon}`}
                />
                Inventory Tracked
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadInventory}
              variant="outline"
              className={`hidden lg:flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowDownTrayIcon
                className={`h-4 w-4 ${colors.icons.primary}`}
              />
              Export
            </Button>
            <Button
              onClick={() => router.push("/supplier/add-inventory")}
              className={`flex items-center gap-2 px-4 py-2 rounded-none ${colors.buttons.primary} font-medium text-xs cursor-pointer transition-all`}
            >
              <PlusIcon className={`h-4 w-4 ${colors.texts.inverse}`} />
              Add Inventory
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={`transform transition-all duration-700 delay-200`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {[
            {
              title: "Total Items",
              value: stats.totalItems.toLocaleString(),
              subtitle: "Products in inventory",
              icon: CubeIcon,
            },
            {
              title: "Total Value",
              value: formatCurrencyAbbreviated(stats.totalValue),
              subtitle: "Inventory worth",
              icon: RsIcon,
            },
            {
              title: "In Stock",
              value: stats.inStockItems.toString(),
              subtitle: "Available items",
              icon: CheckCircleIcon,
            },
            {
              title: "Low Stock",
              value: stats.lowStockItems.toString(),
              subtitle: "Need restocking",
              icon: ExclamationTriangleIcon,
            },
            {
              title: "Out of Stock",
              value: stats.outOfStockItems.toString(),
              subtitle: "Require immediate attention",
              icon: XCircleIcon,
            },
            {
              title: "Reserved",
              value: stats.reservedItems.toString(),
              subtitle: "Items on hold",
              icon: ClockIcon,
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      {status.replace("_", " ")}
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
            <CardHeader className={`border-b ${colors.borders.primary}`}>
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
                    Inventory Overview
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
                    <TableRow
                      className={`border-b ${colors.borders.secondary}`}
                    >
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
                    {filteredAndSortedInventory.map((item: Inventory) => {
                      const itemStatus = getStatusDisplay(item);
                      const badgeColor = getStatusBadgeColor(itemStatus);
                      const totalValue =
                        item.stockValue || item.pricePerUnit * item.quantity;

                      return (
                        <TableRow
                          key={item._id}
                          className={`border-b ${colors.borders.secondary} ${colors.backgrounds.hover} transition-colors rounded-none`}
                        >
                          <TableCell className="pl-8 pr-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-none ${colors.backgrounds.primary} flex items-center justify-center`}
                              >
                                {item.images &&
                                item.images.length > 0 &&
                                item.images[0] ? (
                                  // Show image if exists
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      typeof item.images[0] === "string"
                                        ? item.images[0]
                                        : item.images[0]?.url
                                    }
                                    alt={item.name}
                                    className="h-10 w-10 object-cover rounded-none"
                                    style={{
                                      minWidth: 40,
                                      minHeight: 40,
                                      background: "#f3f4f6",
                                    }}
                                  />
                                ) : (
                                  // Fallback to CubeIcon
                                  <CubeIcon
                                    className={`h-5 w-5 ${colors.texts.primary}`}
                                  />
                                )}
                              </div>
                              <div>
                                <p
                                  className={`font-medium ${colors.texts.primary} text-xs`}
                                >
                                  {item.name}
                                </p>
                                <p className={`text-xs ${colors.texts.muted}`}>
                                  Origin: {item.supplierName || "N/A"}
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
                                Min: {item.minStockLevel}
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
                              {formatCurrencyAbbreviated(item.pricePerUnit)}
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
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/supplier/inventory/${item._id}/`
                                  )
                                }
                                className={`h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                              >
                                <EyeIcon className="h-3 w-3 mr-1 text-black dark:text-white" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  router.push(
                                    `/supplier/inventory/${item._id}/edit`
                                  )
                                }
                                className={`h-8 px-3 ${colors.buttons.secondary} cursor-pointer rounded-none`}
                              >
                                <PencilIcon className="h-3 w-3 mr-1 text-black dark:text-white" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                className={`h-20 w-20 mx-auto mb-6 ${colors.backgrounds.accent} backdrop-blur-sm rounded-none flex items-center justify-center`}
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
                  ? "Start by adding your first supply product to track inventory."
                  : "Try adjusting your search terms or filters to find items."}
              </p>
              {stats.totalItems === 0 ? (
                <Button
                  onClick={() => router.push("/supplier/add-inventory")}
                  className={`${colors.buttons.primary} shadow-none hover:shadow-none transition-all duration-300 text-xs cursor-pointer rounded-none`}
                >
                  <PlusIcon
                    className={`h-4 w-4 mr-2 ${colors.texts.inverse}`}
                  />
                  Add First Item
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
    </div>
  );
}
