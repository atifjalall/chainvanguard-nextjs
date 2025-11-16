/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlusIcon,
  BookmarkIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { Inventory } from "@/types";
import { toast } from "@/components/ui/sonner";
import { badgeColors } from "@/lib/colorConstants";
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
import vendorBrowseApi from "@/lib/api/vendor.browse.api";
import vendorRequestApi from "@/lib/api/vendor.request.api";

const categoryOptions = [
  "All Categories",
  "Raw Material",
  "Fabric",
  "Yarn & Thread",
  "Dyes & Chemicals",
  "Trims & Accessories",
  "Packaging",
  "Semi-Finished",
  "Tools & Equipment",
];

const subcategoryMap: { [key: string]: string[] } = {
  "Raw Material": [
    "Cotton Fabric",
    "Polyester Fabric",
    "Silk Fabric",
    "Wool Fabric",
    "Linen Fabric",
    "Denim Fabric",
    "Jersey Fabric",
    "Blended Fabric",
  ],
  Fabric: [
    "Cotton Fabric",
    "Polyester Fabric",
    "Silk Fabric",
    "Wool Fabric",
    "Linen Fabric",
    "Denim Fabric",
    "Jersey Fabric",
    "Blended Fabric",
  ],
  "Yarn & Thread": [
    "Cotton Yarn",
    "Polyester Yarn",
    "Sewing Thread",
    "Embroidery Thread",
  ],
  "Dyes & Chemicals": [
    "Fabric Dye",
    "Bleach",
    "Softener",
    "Finishing Chemical",
  ],
  "Trims & Accessories": [
    "Buttons",
    "Zippers",
    "Elastic",
    "Lace",
    "Ribbon",
    "Labels",
    "Tags",
  ],
  Packaging: ["Poly Bags", "Hangers", "Boxes", "Tissue Paper"],
  "Semi-Finished": [
    "Cut Fabric",
    "Printed Fabric",
    "Dyed Fabric",
    "Stitched Panels",
  ],
  "Tools & Equipment": ["Scissors", "Needles", "Measuring Tools", "Other"],
};

const materialTypes = [
  "All Types",
  "Raw Material",
  "Semi-Finished",
  "Finished Component",
  "Accessory",
  "Packaging",
  "Tool",
  "Consumable",
];

const fabricTypes = [
  "All Fabric Types",
  "Cotton",
  "Polyester",
  "Silk",
  "Wool",
  "Linen",
  "Denim",
  "Jersey",
  "Chiffon",
  "Satin",
  "Velvet",
  "Fleece",
  "Rayon",
  "Nylon",
  "Spandex",
  "Blended",
];

interface InventoryCardProps {
  item: Inventory;
  onRequest: (item: Inventory) => void;
  onView: (id: string) => void;
  onToggleSaved?: (id: string) => void;
  isSaved?: boolean;
}

function InventoryCard({
  item,
  onRequest,
  onView,
  onToggleSaved,
  isSaved = false,
}: InventoryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  const itemStatus = item.stockStatus || item.status;
  const isOutOfStock = itemStatus === "out_of_stock" || item.quantity === 0;
  const isLowStock = itemStatus === "low_stock";

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex(0);
    setImageKey((prev) => prev + 1);
  }, [item.images]);

  const handleMouseEnter = () => {
    if (item.images && item.images.length > 1 && !isOutOfStock) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const getImageSrc = () => {
    if (!item.images || item.images.length === 0 || imageError) {
      return "/placeholder-product.png";
    }
    const imageUrl =
      typeof item.images[currentImageIndex] === "string"
        ? item.images[currentImageIndex]
        : item.images[currentImageIndex]?.url;
    if (!imageUrl || typeof imageUrl !== "string") {
      return "/placeholder-product.png";
    }
    return imageUrl;
  };

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div
      className={`group relative w-full ${isOutOfStock ? "opacity-60" : ""}`}
    >
      <div className="relative bg-gray-100 w-full">
        <div
          className={`block ${isOutOfStock ? "cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => !isOutOfStock && onView(item._id)}
        >
          <div
            className="relative w-full aspect-[4/5] overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!imageError && item.images && item.images.length > 0 ? (
              <img
                key={`${imageKey}-${currentImageIndex}`}
                src={getImageSrc()}
                alt={item.name}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                } ${!isOutOfStock ? "group-hover:scale-105" : ""} ${
                  isOutOfStock ? "grayscale" : ""
                }`}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            ) : (
              <PlaceholderImage />
            )}

            {!imageLoaded &&
              !imageError &&
              item.images &&
              item.images.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
              )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-gray-500/40 backdrop-blur-[1px] flex items-center justify-center">
                <div className="bg-gray-800/90 px-3 py-1.5">
                  <span className="text-xs font-medium text-white uppercase tracking-wider">
                    Out of Stock
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {!isOutOfStock && (
          <button
            className="absolute bottom-3 left-3 w-5 h-5 bg-white flex items-center justify-center opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRequest(item);
            }}
          >
            <PlusIcon className="w-4 h-4 text-black" />
          </button>
        )}
      </div>

      <div className="pt-3 pb-4">
        <div className="mb-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800">
            <BuildingStorefrontIcon className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {item.supplierName}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className={`flex-1 ${isOutOfStock ? "cursor-not-allowed" : "cursor-pointer"}`}
            onClick={() => !isOutOfStock && onView(item._id)}
          >
            <h3
              className={`text-sm font-medium ${isOutOfStock ? "text-gray-400" : "text-gray-900 dark:text-white"} line-clamp-2 hover:text-gray-600 dark:hover:text-gray-300 transition-colors`}
            >
              {item.name}
            </h3>
          </div>
          {onToggleSaved && !isOutOfStock && (
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
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {item.sku} • {item.category}
        </p>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
          <div className="flex flex-col">
            <span
              className={`text-sm font-semibold ${isOutOfStock ? "text-gray-400" : "text-gray-900 dark:text-white"}`}
            >
              Rs {item.pricePerUnit.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">per {item.unit}</span>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`text-xs font-medium ${isOutOfStock ? "text-gray-400" : isLowStock ? "text-yellow-600" : "text-gray-600"}`}
            >
              {item.availableQuantity || item.quantity} {item.unit}
            </span>
            <span className="text-xs text-gray-500">available</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorBrowsePage() {
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
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const itemsPerPage = 20;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setIsVisible(true);
    loadInventory();
    loadWishlist();
  }, [
    currentPage,
    debouncedSearchTerm,
    selectedCategory,
    selectedSubcategory,
    selectedMaterialType,
    selectedFabricType,
  ]);

  const loadInventory = async () => {
    setIsLoading(true);
    try {
      const response = await vendorBrowseApi.browseInventory({
        search: debouncedSearchTerm || undefined,
        category:
          selectedCategory !== "All Categories" ? selectedCategory : undefined,
        subcategory:
          selectedSubcategory !== "All Subcategories"
            ? selectedSubcategory
            : undefined,
        materialType:
          selectedMaterialType !== "All Types"
            ? selectedMaterialType
            : undefined,
        fabricType:
          selectedFabricType !== "All Fabric Types"
            ? selectedFabricType
            : undefined,
        page: currentPage,
        limit: itemsPerPage,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success && response.data) {
        setInventory(response.data);
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.pages);
      }
    } catch (error: any) {
      console.error("Error loading inventory:", error);
      toast.error(error?.response?.data?.message || "Failed to load inventory");
      setInventory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWishlist = async () => {
    try {
      const response = await vendorBrowseApi.getWishlist();

      if (response.success && response.wishlist) {
        const items = response.wishlist.items;

        const wishlistIds = new Set(
          items
            .map((item) => {
              if (typeof item.productId === "string") {
                return item.productId;
              } else if (item.productId && typeof item.productId === "object") {
                return (item.productId as any)._id as string;
              }
              return null;
            })
            .filter((id): id is string => id !== null)
        );

        setSavedItems(wishlistIds);
      }
    } catch (error: any) {
      console.error("Error loading wishlist:", error);
    }
  };

  const handleRequest = (item: Inventory) => {
    setSelectedItem(item);
    setRequestQuantity(1);
    setRequestNotes("");
    setRequestDialogOpen(true);
  };

  const handleView = (id: string) => {
    router.push(`/vendor/browse/${id}`);
  };

  const handleToggleSaved = async (id: string) => {
    const wasAdding = !savedItems.has(id);

    // Optimistic update - update UI immediately
    if (savedItems.has(id)) {
      setSavedItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } else {
      setSavedItems((prev) => new Set(prev).add(id));
    }

    try {
      // Then sync with server in background
      if (wasAdding) {
        await vendorBrowseApi.addToWishlist(id, {
          notifyOnPriceDrop: true,
          notifyOnBackInStock: true,
        });
        toast.success("Added to saved items");
      } else {
        await vendorBrowseApi.removeFromWishlist(id);
        toast.info("Removed from saved items");
      }
    } catch (error: any) {
      // Rollback on error
      if (wasAdding) {
        setSavedItems((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      } else {
        setSavedItems((prev) => new Set(prev).add(id));
      }

      console.error("Error toggling wishlist:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update wishlist"
      );
    }
  };

  const handleQuantityChange = (delta: number) => {
    const maxQty =
      selectedItem?.availableQuantity || selectedItem?.quantity || 1;
    const newQty = Math.max(1, Math.min(maxQty, requestQuantity + delta));
    setRequestQuantity(newQty);
  };

  const submitRequest = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      // Extract supplier ID properly
      let extractedSupplierId: string;

      if (typeof selectedItem.supplierId === "string") {
        extractedSupplierId = selectedItem.supplierId;
      } else if (
        selectedItem.supplierId &&
        typeof selectedItem.supplierId === "object" &&
        "_id" in selectedItem.supplierId
      ) {
        extractedSupplierId = selectedItem.supplierId._id;
      } else {
        toast.error("Invalid supplier information");
        return;
      }

      const response = await vendorRequestApi.createRequest({
        supplierId: extractedSupplierId,
        items: [
          {
            inventoryId: selectedItem._id,
            quantity: requestQuantity,
            notes: requestNotes || undefined,
          },
        ],
        vendorNotes: requestNotes || undefined,
      });

      if (response.success) {
        // FIX: Backend returns 'request' not 'data'
        const requestNumber = (response as any).request?.requestNumber || "N/A";
        toast.success(
          `Request submitted successfully! Request #${requestNumber}`
        );
        setRequestDialogOpen(false);
        setRequestQuantity(1);
        setRequestNotes("");
        setSelectedItem(null);
      }
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error?.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const half = Math.floor(maxVisiblePages / 2);

    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("ellipsis-start");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("ellipsis-end");
      pages.push(totalPages);
    }

    return pages;
  };

  const calculateTotal = () => {
    if (!selectedItem) return { subtotal: 0, tax: 0, total: 0 };

    const subtotal = selectedItem.pricePerUnit * requestQuantity;
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-sm">
      <div className="relative z-10 p-4 md:p-6">
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Browse Inventory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div
          className={`mb-6 transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                Browse Supplier Inventory
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Discover and request inventory from verified suppliers
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  {totalItems} Items Available
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
          </div>
        </div>

        <div className="mb-6 transform transition-all duration-700 delay-300">
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <FunnelIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                Search & Filters
              </CardTitle>
              <CardDescription className="text-xs text-gray-600 dark:text-gray-400">
                Find the perfect inventory items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative w-full">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, SKU, category, or supplier"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                  }}
                  className="pl-9 h-9 w-full border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white rounded-none transition-colors duration-200"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      setSelectedSubcategory("All Subcategories");
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {categoryOptions.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="text-sm h-9"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subcategory
                  </Label>
                  <Select
                    value={selectedSubcategory}
                    onValueChange={(value) => {
                      setSelectedSubcategory(value);
                      setCurrentPage(1);
                    }}
                    disabled={selectedCategory === "All Categories"}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select a subcategory" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem
                        value="All Subcategories"
                        className="text-sm h-9"
                      >
                        All Subcategories
                      </SelectItem>
                      {selectedCategory !== "All Categories" &&
                        subcategoryMap[selectedCategory]?.map((subcat) => (
                          <SelectItem
                            key={subcat}
                            value={subcat}
                            className="text-sm h-9"
                          >
                            {subcat}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Material Type
                  </Label>
                  <Select
                    value={selectedMaterialType}
                    onValueChange={(value) => {
                      setSelectedMaterialType(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select material type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {materialTypes.map((type) => (
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
                </div>
                <div className="space-y-1">
                  <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fabric Type
                  </Label>
                  <Select
                    value={selectedFabricType}
                    onValueChange={(value) => {
                      setSelectedFabricType(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200">
                      <SelectValue placeholder="Select fabric type" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {fabricTypes.map((type) => (
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
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center flex-wrap">
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 border-blue-200 text-blue-700 text-xs rounded-none"
                    >
                      &quot;{searchTerm}&quot;
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setCurrentPage(1);
                        }}
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
                        onClick={() => {
                          setSelectedCategory("All Categories");
                          setSelectedSubcategory("All Subcategories");
                          setCurrentPage(1);
                        }}
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
                        onClick={() => {
                          setSelectedSubcategory("All Subcategories");
                          setCurrentPage(1);
                        }}
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
                        onClick={() => {
                          setSelectedMaterialType("All Types");
                          setCurrentPage(1);
                        }}
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
                        onClick={() => {
                          setSelectedFabricType("All Fabric Types");
                          setCurrentPage(1);
                        }}
                        className="ml-1 text-gray-600 hover:text-gray-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  <span className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                    {totalItems} items found
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="transform transition-all duration-700 delay-400">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loading inventory...
                </p>
              </div>
            </div>
          ) : inventory.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {inventory.map((item) => (
                <InventoryCard
                  key={item._id}
                  item={item}
                  onRequest={handleRequest}
                  onView={handleView}
                  onToggleSaved={handleToggleSaved}
                  isSaved={savedItems.has(item._id)}
                />
              ))}
            </div>
          ) : (
            <Card className="text-center py-16 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-none shadow-none">
              <CardContent>
                <div className="h-20 w-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-none flex items-center justify-center">
                  <CubeIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  No Items Found
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Try adjusting your search terms or filters to find items.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("All Categories");
                    setSelectedSubcategory("All Subcategories");
                    setSelectedMaterialType("All Types");
                    setSelectedFabricType("All Fabric Types");
                    setCurrentPage(1);
                  }}
                  className="inline-flex items-center gap-2 text-xs cursor-pointer border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-all rounded-none h-8"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          )}
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

        {/* Enhanced Request Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none shadow-none max-w-sm md:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                Request Material
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Request {selectedItem?.name} from {selectedItem?.supplierName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Item Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-none space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">SKU:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedItem?.sku}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Category:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedItem?.category}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Available:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedItem?.availableQuantity || selectedItem?.quantity}{" "}
                    {selectedItem?.unit}
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <Label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  Quantity ({selectedItem?.unit})
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={requestQuantity <= 1}
                    className="h-9 w-9 p-0 rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={
                      selectedItem?.availableQuantity || selectedItem?.quantity
                    }
                    value={requestQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxQty =
                        selectedItem?.availableQuantity ||
                        selectedItem?.quantity ||
                        1;
                      setRequestQuantity(Math.max(1, Math.min(maxQty, val)));
                    }}
                    className="flex-1 text-center rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      requestQuantity >=
                      (selectedItem?.availableQuantity ||
                        selectedItem?.quantity ||
                        1)
                    }
                    className="h-9 w-9 p-0 rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  Notes{" "}
                  <span className="text-gray-500 font-normal">
                    (Optional, max 500 chars)
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements or instructions..."
                  value={requestNotes}
                  onChange={(e) =>
                    setRequestNotes(e.target.value.slice(0, 500))
                  }
                  maxLength={500}
                  rows={3}
                  className="rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white resize-none"
                />
                <p className="text-xs text-gray-500 text-right">
                  {requestNotes.length}/500
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-none space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Unit Price:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Rs {selectedItem?.pricePerUnit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Quantity:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {requestQuantity} {selectedItem?.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Rs {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax (10%):
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Rs {tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">
                    Rs {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={() => setRequestDialogOpen(false)}
                disabled={isSubmitting}
                size="sm"
                className="text-xs md:text-sm cursor-pointer h-8 md:h-9 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRequest}
                disabled={isSubmitting}
                size="sm"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="h-3 w-3 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-3 w-3 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
