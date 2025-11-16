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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CubeIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChartPieIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlusIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { Inventory } from "@/types";
import { toast } from "@/components/ui/sonner";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

// Mock data for demonstration (same as browse page)
const mockInventory: Inventory[] = [
  {
    _id: "1",
    name: "Item 1",
    sku: "SKU1",
    category: "Category 1",
    subcategory: "Subcategory 1",
    supplierName: "Supplier 1",
    materialType: "Material 1",
    fabricType: "Fabric 1",
    pattern: "Pattern 1",
    finish: "Finish 1",
    imageUrl: "/path/to/image1.jpg",
    price: 100,
    stock: 10,
  },
  {
    _id: "2",
    name: "Item 2",
    sku: "SKU2",
    category: "Category 2",
    subcategory: "Subcategory 2",
    supplierName: "Supplier 2",
    materialType: "Material 2",
    fabricType: "Fabric 2",
    pattern: "Pattern 2",
    finish: "Finish 2",
    imageUrl: "/path/to/image2.jpg",
    price: 200,
    stock: 5,
  },
  // Add more mock items as needed
];

// Category options, subcategoryMap, etc. (copy from browse page)
const categoryOptions = [
  { value: "All Categories", label: "All Categories" },
  { value: "Category 1", label: "Category 1" },
  { value: "Category 2", label: "Category 2" },
  // Add more categories as needed
];

const subcategoryMap: { [key: string]: string[] } = {
  "Category 1": ["Subcategory 1", "Subcategory 2"],
  "Category 2": ["Subcategory 3", "Subcategory 4"],
};

const materialTypes = [
  { value: "All Types", label: "All Types" },
  { value: "Material 1", label: "Material 1" },
  { value: "Material 2", label: "Material 2" },
];

const fabricTypes = [
  { value: "All Fabric Types", label: "All Fabric Types" },
  { value: "Fabric 1", label: "Fabric 1" },
  { value: "Fabric 2", label: "Fabric 2" },
];

const patterns = [
  { value: "All Patterns", label: "All Patterns" },
  { value: "Pattern 1", label: "Pattern 1" },
  { value: "Pattern 2", label: "Pattern 2" },
];

const finishes = [
  { value: "All Finishes", label: "All Finishes" },
  { value: "Finish 1", label: "Finish 1" },
  { value: "Finish 2", label: "Finish 2" },
];

// InventoryCard component (copy from browse page)
interface InventoryCardProps {
  item: Inventory;
  onRequest: (item: Inventory) => void;
  onView: (id: string) => void;
  onToggleSaved: (id: string) => void;
  isSaved: boolean;
}

function InventoryCard({
  item,
  onRequest,
  onView,
  onToggleSaved,
  isSaved,
}: InventoryCardProps) {
  return (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none shadow-none">
      <div className="relative">
        <div className="absolute top-3 right-3">
          <button
            className="flex items-center justify-center flex-shrink-0 mt-0.5"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleSaved(item._id);
            }}
          >
            <BookmarkIcon
              className={`w-4 h-4 transition-colors cursor-pointer ${
                isSaved
                  ? "fill-black text-black"
                  : "text-gray-400 hover:text-black"
              }`}
            />
          </button>
        </div>
        <div className="cursor-pointer" onClick={() => onView(item._id)}>
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-40 object-cover rounded-t-none"
          />
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                  {item.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                  {item.sku}
                </CardDescription>
              </div>
              <div className="mt-2 sm:mt-0">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  ${item.price.toFixed(2)}
                </Badge>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2 flex-wrap">
                <span
                  className="text-xs rounded-full"
                  style={{
                    paddingLeft: "0.5rem",
                    paddingRight: "0.5rem",
                    paddingTop: "0.125rem",
                    paddingBottom: "0.125rem",
                    backgroundColor: colors.gray[100],
                    color: colors.gray[800],
                  }}
                >
                  {item.category}
                </span>
                <span
                  className="text-xs rounded-full"
                  style={{
                    paddingLeft: "0.5rem",
                    paddingRight: "0.5rem",
                    paddingTop: "0.125rem",
                    paddingBottom: "0.125rem",
                    backgroundColor: colors.gray[100],
                    color: colors.gray[800],
                  }}
                >
                  {item.subcategory}
                </span>
                <span
                  className="text-xs rounded-full"
                  style={{
                    paddingLeft: "0.5rem",
                    paddingRight: "0.5rem",
                    paddingTop: "0.125rem",
                    paddingBottom: "0.125rem",
                    backgroundColor: colors.gray[100],
                    color: colors.gray[800],
                  }}
                >
                  {item.materialType}
                </span>
                <span
                  className="text-xs rounded-full"
                  style={{
                    paddingLeft: "0.5rem",
                    paddingRight: "0.5rem",
                    paddingTop: "0.125rem",
                    paddingBottom: "0.125rem",
                    backgroundColor: colors.gray[100],
                    color: colors.gray[800],
                  }}
                >
                  {item.fabricType}
                </span>
              </div>
              <div className="mt-2 sm:mt-0">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRequest(item);
                  }}
                  variant="primary"
                  className="text-xs rounded-none"
                >
                  Request Sample
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}

export default function VendorSavedItemsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedSubcategory, setSelectedSubcategory] =
    useState("All Subcategories");
  const [selectedMaterialType, setSelectedMaterialType] = useState("All Types");
  const [selectedFabricType, setSelectedFabricType] =
    useState("All Fabric Types");
  const [selectedPattern, setSelectedPattern] = useState("All Patterns");
  const [selectedFinish, setSelectedFinish] = useState("All Finishes");
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setIsVisible(true);
    loadInventory();
    loadSavedItems();
  }, []);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      // Replace with actual API call
      setInventory(mockInventory);
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      toast.error(error?.message || "Failed to load inventory");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedItems = () => {
    const saved = localStorage.getItem("savedItems");
    if (saved) {
      setSavedItems(new Set(JSON.parse(saved)));
    }
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (!savedItems.has(item._id)) return false;
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "All Categories" ||
        item.category === selectedCategory;

      const matchesSubcategory =
        selectedSubcategory === "All Subcategories" ||
        item.subcategory === selectedSubcategory;

      const matchesMaterialType =
        selectedMaterialType === "All Types" ||
        item.materialType === selectedMaterialType;

      const matchesFabricType =
        selectedFabricType === "All Fabric Types" ||
        item.fabricType === selectedFabricType;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesMaterialType &&
        matchesFabricType
      );
    });
  }, [
    inventory,
    savedItems,
    searchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedMaterialType,
    selectedFabricType,
  ]);

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);
  const paginatedInventory = filteredInventory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRequest = (item: Inventory) => {
    setSelectedItem(item);
    setRequestQuantity(1);
    setRequestNotes("");
    setRequestDialogOpen(true);
  };

  const handleView = (id: string) => {
    router.push(`/vendor/browse/${id}`);
  };

  const handleToggleSaved = (id: string) => {
    setSavedItems((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      toast.info("Removed from saved items");
      return newSet;
    });
  };

  const submitRequest = () => {
    if (!selectedItem) return;
    toast.success(`Request submitted for ${selectedItem.name}`);
    setRequestDialogOpen(false);
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }
    return [1, 2, ...range, totalPages];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading saved items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-sm">
      <div className="relative z-10 p-4 md:p-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Saved Items</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`mb-6 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                Saved Items
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Your wishlist of saved inventory items
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  {filteredInventory.length} Saved Items
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="mb-6 transform transition-all duration-700 delay-300">
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <FunnelIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                Search & Filters
              </CardTitle>
              <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                Filter your saved items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search saved items by name, SKU, category, or supplier"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 w-full border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white rounded-none transition-colors duration-200"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subcategory
                  </Label>
                  <Select
                    value={
                      selectedCategory === "All Categories"
                        ? ""
                        : selectedSubcategory
                    }
                    onValueChange={setSelectedSubcategory}
                    disabled={selectedCategory === "All Categories"}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select category first" />
                    </SelectTrigger>
                    <SelectContent>
                      {(subcategoryMap[selectedCategory] || []).map(
                        (option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Material Type
                  </Label>
                  <Select
                    value={selectedMaterialType}
                    onValueChange={setSelectedMaterialType}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent>
                      {materialTypes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fabric Type
                  </Label>
                  <Select
                    value={selectedFabricType}
                    onValueChange={setSelectedFabricType}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select fabric type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fabricTypes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center flex-wrap">
                  {/* Filter badges (copy and adapt from browse page) */}
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 border-blue-200 text-blue-700 text-xs rounded-none"
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
                  {selectedCategory !== "All Categories" && (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 border-gray-200 text-gray-700 flex items-center gap-1 text-xs rounded-none"
                    >
                      {selectedCategory}
                      <button
                        onClick={() => setSelectedCategory("All Categories")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedSubcategory !== "All Subcategories" && (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 border-gray-200 text-gray-700 flex items-center gap-1 text-xs rounded-none"
                    >
                      {selectedSubcategory}
                      <button
                        onClick={() =>
                          setSelectedSubcategory("All Subcategories")
                        }
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedMaterialType !== "All Types" && (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 border-gray-200 text-gray-700 flex items-center gap-1 text-xs rounded-none"
                    >
                      {selectedMaterialType}
                      <button
                        onClick={() => setSelectedMaterialType("All Types")}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {selectedFabricType !== "All Fabric Types" && (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 border-gray-200 text-gray-700 flex items-center gap-1 text-xs rounded-none"
                    >
                      {selectedFabricType}
                      <button
                        onClick={() =>
                          setSelectedFabricType("All Fabric Types")
                        }
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                    {filteredInventory.length} saved items found
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Grid */}
        <div className="transform transition-all duration-700 delay-400">
          {paginatedInventory.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {paginatedInventory.map((item) => (
                <InventoryCard
                  key={item._id}
                  item={item}
                  onRequest={handleRequest}
                  onView={handleView}
                  onToggleSaved={handleToggleSaved}
                  isSaved={true} // Always true for saved items page
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none shadow-none">
              <CardContent>
                <div className="h-20 w-20 mx-auto mb-6 bg-transparent rounded-none flex items-center justify-center">
                  <BookmarkIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  No Saved Items
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  You haven't saved any items yet. Browse inventory to add some.
                </p>
                <Button
                  onClick={() => router.push("/vendor/browse")}
                  className="inline-flex items-center gap-2 text-xs cursor-pointer bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all rounded-none h-8"
                >
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  Browse Inventory
                </Button>
              </CardContent>
            </Card>
          )}
          {/* Pagination (copy from browse page) */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      className={cn(
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      )}
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis-start" || page === "ellipsis-end" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          onClick={() => setCurrentPage(page as number)}
                          isActive={page === currentPage}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      className={cn(
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      )}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* Request Dialog (copy from browse page) */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none shadow-none max-w-sm md:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm md:text-base font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                <ShoppingBagIcon className="h-4 w-4" />
                Request Item
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Request {selectedItem?.name} from {selectedItem?.supplierName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  Quantity ({selectedItem?.unit})
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedItem?.quantity}
                  value={requestQuantity}
                  onChange={(e) =>
                    setRequestQuantity(parseInt(e.target.value) || 1)
                  }
                  className="rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white h-9"
                />
                <p className="text-xs text-gray-500">
                  Available: {selectedItem?.quantity} {selectedItem?.unit}
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  Notes (Optional)
                </Label>
                <Input
                  id="notes"
                  placeholder="Any special requirements..."
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  className="rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white h-9"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-none space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Unit Price:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Rs {selectedItem?.pricePerUnit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">
                    Rs{" "}
                    {(
                      (selectedItem?.pricePerUnit || 0) * requestQuantity
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 md:gap-3">
              <Button
                onClick={() => setRequestDialogOpen(false)}
                variant="outline"
                size="sm"
                className="text-xs md:text-sm cursor-pointer h-8 md:h-9 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRequest}
                size="sm"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none"
              >
                <CheckCircleIcon className="h-3 w-3 mr-2" />
                Submit Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
