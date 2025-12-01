/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CubeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  Squares2X2Icon,
  Bars3Icon,
  EllipsisVerticalIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { productAPI } from "@/lib/api/product.api";
import { badgeColors, colors } from "@/lib/colorConstants";

import { usePageTitle } from "@/hooks/use-page-title";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";

const categories = ["All Categories", "Men", "Women", "Kids", "Unisex"];
const statusOptions = ["All Status", "active", "inactive", "out_of_stock"];
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "quantity-asc", label: "Stock: Low to High" },
  { value: "quantity-desc", label: "Stock: High to Low" },
];

// Add consistent spacing and styling constants from add-product
const FORM_SPACING = "space-y-4 md:space-y-2";
const SECTION_MARGIN = "mb-4 md:mb-6";
const GRID_GAP = "gap-6";
const CONTAINER_PADDING = "p-4 md:p-6";
const FIELD_GAP = "gap-6";
const LABEL_MARGIN = "mb-1";
const ERROR_MARGIN = "mt-1";
const HEADER_GAP = "gap-3";
const NAVIGATION_MARGIN = "mt-6";

// Add currency formatting functions
const formatCurrency = (amount: number) => `CVT ${amount.toFixed(2)}`;

const formatCurrencyAbbreviated = (amount: number) => {
  if (amount >= 1e9) {
    return `${(amount / 1e9).toFixed(2)} B`;
  } else if (amount >= 1e6) {
    return `${(amount / 1e6).toFixed(2)} M`;
  } else {
    return formatCurrency(amount);
  }
};

export default function VendorMyProductsPage() {
  usePageTitle("My Products");
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20; // 20 products per page

  useEffect(() => {
    setIsVisible(true);
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("[My Products] Loading products for user:", user?._id);

      if (typeof window !== "undefined") {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("product_")) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
      }

      const timestamp = Date.now();
      // Add a high limit to fetch all products (adjust if backend has a max limit)
      const response = await productAPI.getVendorProducts({
        limit: 100,
        _t: timestamp,
      } as any);

      console.log("[My Products] API Response:", response);

      const productsData = response.data || [];

      if (response.success && productsData.length > 0) {
        const normalizedProducts = productsData.map((p: any) => {
          const imagesWithTimestamp =
            p.images?.map((img: any) => {
              const baseUrl = img.url.split("?")[0];
              return {
                ...img,
                url: `${baseUrl}?t=${timestamp}`,
              };
            }) || [];

          return {
            ...p,
            id: p.id ?? p._id,
            images: imagesWithTimestamp,
          };
        });

        setProducts(normalizedProducts as Product[]);
        console.log(
          "[My Products] Loaded products with fresh images:",
          productsData.length
        );
      } else {
        console.warn("[My Products] No products in response");
        setProducts([]);
      }
    } catch (error: any) {
      console.error("[My Products] Error loading products:", error);
      setError(error.message || "Failed to load products");
      toast.error(error.message || "Failed to load products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku &&
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All Categories" ||
        product.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All Status" || product.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "quantity-asc":
          return a.quantity - b.quantity;
        case "quantity-desc":
          return b.quantity - a.quantity;
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "newest":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return sorted;
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Paginate the filtered products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAndSortedProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredAndSortedProducts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / pageSize);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus, sortBy]);

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;

    try {
      setIsDeleting(true);
      await productAPI.deleteProduct(deletingProduct._id);
      toast.success("Product deleted successfully");
      setIsDeleteOpen(false);
      setDeletingProduct(null);
      loadProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/vendor/my-products/${productId}`);
  };

  const handleEditProduct = (productId: string) => {
    router.push(`/vendor/my-products/${productId}/edit`);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active":
        return badgeColors.green;
      case "inactive":
        return badgeColors.grey;
      case "out_of_stock":
        return badgeColors.red;
      default:
        return badgeColors.blue;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircleIcon className="h-3 w-3" />;
      case "inactive":
        return <XCircleIcon className="h-3 w-3" />;
      case "out_of_stock":
        return <ExclamationTriangleIcon className="h-3 w-3" />;
      default:
        return <ClockIcon className="h-3 w-3" />;
    }
  };

  const getStockStatusBadge = (product: Product) => {
    if (product.quantity === 0) {
      return (
        <Badge
          variant="outline"
          className={`${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} text-[10px] h-5 px-2 rounded-none flex-shrink-0`}
        >
          <ExclamationTriangleIcon className="h-2.5 w-2.5 mr-1" />
          Out of Stock
        </Badge>
      );
    } else if (product.quantity <= product.minStockLevel) {
      return (
        <Badge
          variant="outline"
          className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} text-[10px] h-5 px-2 rounded-none flex-shrink-0`}
        >
          <ArrowTrendingDownIcon className="h-2.5 w-2.5 mr-1" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-[10px] h-5 px-2 rounded-none flex-shrink-0`}
        >
          <ArrowTrendingUpIcon className="h-2.5 w-2.5 mr-1" />
          In Stock
        </Badge>
      );
    }
  };

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const lowStockProducts = products.filter(
    (p) => p.quantity <= p.minStockLevel && p.quantity > 0
  ).length;
  const outOfStockProducts = products.filter((p) => p.quantity === 0).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  const ProductCard = ({ product }: { product: Product }) => {
    const [imageError, setImageError] = useState(false);

    const getImageSrc = () => {
      if (
        !product.images ||
        product.images.length === 0 ||
        !product.images[0].url ||
        typeof product.images[0].url !== "string"
      ) {
        return null;
      }
      return product.images[0].url;
    };

    const imageSrc = getImageSrc();
    const showPlaceholder = !imageSrc || imageError;

    return (
      <div className="group relative w-full">
        {/* Image Container */}
        <div className="relative bg-gray-100 w-full">
          <div className="relative w-full aspect-[3/4] overflow-hidden">
            {showPlaceholder ? (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
                <CubeIcon className="h-16 w-16 text-gray-400" />
              </div>
            ) : (
              <Image
                src={imageSrc}
                alt={product.name}
                fill
                className="w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105 transition-transform duration-500"
                onError={() => setImageError(true)}
              />
            )}

            {/* Status overlay for out of stock */}
            {product.quantity === 0 && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Out of Stock
                </span>
              </div>
            )}
          </div>

          {/* Actions Menu - Top Right */}
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 bg-white flex items-center justify-center cursor-pointer">
                  <EllipsisVerticalIcon className="h-4 w-4 text-black" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 rounded-none">
                <DropdownMenuItem
                  onClick={() => handleViewProduct(product._id)}
                  className="text-xs cursor-pointer"
                >
                  <EyeIcon className="h-3.5 w-3.5 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleEditProduct(product._id)}
                  className="text-xs cursor-pointer"
                >
                  <PencilIcon className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(product)}
                  className="text-xs text-red-600 dark:text-red-400 cursor-pointer"
                >
                  <TrashIcon className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content Below Image */}
        <div className="pt-2 pb-4 px-4 ${colors.borders.primary}">
          {/* Product Name & Status */}
          <div className="flex items-start justify-between mb-1 gap-2">
            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wide flex-1">
              {product.name}
            </h3>
            <Badge
              variant="outline"
              className={`${getStatusBadgeColor(product.status).bg} ${getStatusBadgeColor(product.status).border} ${getStatusBadgeColor(product.status).text} text-[10px] py-0 h-5 px-2 rounded-none flex-shrink-0`}
            >
              {getStatusIcon(product.status)}
              <span className="ml-1 capitalize">
                {product.status.replace("_", " ")}
              </span>
            </Badge>
          </div>

          {/* Category */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {product.category} • {product.subcategory}
          </p>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-sm font-normal text-gray-900 dark:text-white">
              CVT {product.price.toFixed(2)}
            </span>
            {product.costPrice && product.costPrice > product.price && (
              <span className="text-xs text-gray-400 line-through">
                CVT {product.costPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {product.isFeatured && (
              <Badge
                variant="outline"
                className={`${badgeColors.amber.bg} ${badgeColors.amber.border} ${badgeColors.amber.text} text-[10px] h-5 px-2 rounded-none`}
              >
                <SparklesIcon className="h-2.5 w-2.5 mr-1" />
                Featured
              </Badge>
            )}
            {product.blockchainVerified && (
              <Badge
                variant="outline"
                className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} text-[10px] h-5 px-2 rounded-none`}
              >
                <ShieldCheckIcon className="h-2.5 w-2.5 mr-1" />
                Verified
              </Badge>
            )}
            {getStockStatusBadge(product)}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 py-3 ${colors.borders.primary} ${colors.borders.primary}">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Stock
              </p>
              <p
                className={`text-sm font-semibold ${
                  product.quantity === 0
                    ? "text-red-600"
                    : product.quantity <= product.minStockLevel
                      ? "text-orange-600"
                      : "text-green-600"
                }`}
              >
                {product.quantity}
              </p>
            </div>
            <div className="text-center ${colors.borders.primary}">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Sold
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {product.totalSold || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                Rating
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {product.averageRating?.toFixed(1) || "N/A"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-3">
            <button
              onClick={() => handleViewProduct(product._id)}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white bg-transparent ${colors.borders.primary} rounded-none transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <EyeIcon className="h-3 w-3" />
              View
            </button>
            <button
              onClick={() => handleEditProduct(product._id)}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-white bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <PencilIcon className="h-3 w-3" />
              Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ProductListItem = ({ product }: { product: Product }) => {
    const [imageError, setImageError] = useState(false);

    const getImageSrc = () => {
      if (
        !product.images ||
        product.images.length === 0 ||
        !product.images[0].url ||
        typeof product.images[0].url !== "string"
      ) {
        return null;
      }
      return product.images[0].url;
    };

    const imageSrc = getImageSrc();
    const showPlaceholder = !imageSrc || imageError;

    return (
      <div className="group relative w-full ${colors.borders.primary} bg-white dark:bg-gray-900">
        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Image */}
            <div className="relative w-40 h-52 bg-gray-100 flex-shrink-0 overflow-hidden">
              {showPlaceholder ? (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
                  <CubeIcon className="h-16 w-16 text-gray-400" />
                </div>
              ) : (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={() => setImageError(true)}
                />
              )}

              {product.quantity === 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-900 uppercase tracking-wider">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-normal text-gray-900 dark:text-white uppercase tracking-wide mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {product.category} • {product.subcategory}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={`${getStatusBadgeColor(product.status).bg} ${getStatusBadgeColor(product.status).border} ${getStatusBadgeColor(product.status).text} text-[10px] h-5 px-2 rounded-none`}
                  >
                    {getStatusIcon(product.status)}
                    <span className="ml-1 capitalize">
                      {product.status.replace("_", " ")}
                    </span>
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                        <EllipsisVerticalIcon className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-40 rounded-none"
                    >
                      <DropdownMenuItem
                        onClick={() => handleViewProduct(product._id)}
                        className="text-xs cursor-pointer"
                      >
                        <EyeIcon className="h-3.5 w-3.5 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditProduct(product._id)}
                        className="text-xs cursor-pointer"
                      >
                        <PencilIcon className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(product)}
                        className="text-xs text-red-600 dark:text-red-400 cursor-pointer"
                      >
                        <TrashIcon className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {product.isFeatured && (
                  <Badge
                    variant="outline"
                    className={`${badgeColors.amber.bg} ${badgeColors.amber.border} ${badgeColors.amber.text} text-[10px] h-5 px-2 rounded-none`}
                  >
                    <SparklesIcon className="h-2.5 w-2.5 mr-1" />
                    Featured
                  </Badge>
                )}
                {product.blockchainVerified && (
                  <Badge
                    variant="outline"
                    className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} text-[10px] h-5 px-2 rounded-none`}
                  >
                    <ShieldCheckIcon className="h-2.5 w-2.5 mr-1" />
                    Verified
                  </Badge>
                )}
                {getStockStatusBadge(product)}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-5 gap-6 pt-4 ${colors.borders.primary} ${colors.borders.primary}">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Price
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      CVT {product.price.toFixed(2)}
                    </p>
                    {product.costPrice && product.costPrice > product.price && (
                      <span className="text-xs text-gray-400 line-through">
                        CVT {product.costPrice.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Stock
                  </p>
                  <p
                    className={`text-base font-semibold ${
                      product.quantity === 0
                        ? "text-red-600"
                        : product.quantity <= product.minStockLevel
                          ? "text-orange-600"
                          : "text-green-600"
                    }`}
                  >
                    {product.quantity}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Views
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {product.views || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Sold
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {product.totalSold || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Rating
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {product.averageRating?.toFixed(1) || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading your products...
          </p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div
        className={`flex items-center justify-center min-h-screen ${colors.backgrounds.secondary}`}
      >
        <Card
          className={`${colors.cards.base} max-w-md w-full mx-4 rounded-none`}
        >
          <CardContent className="p-8 text-center">
            <div className="h-20 w-20 mx-auto mb-6 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3
              className={`text-xl font-semibold ${colors.texts.primary} mb-2`}
            >
              Failed to Load Products
            </h3>
            <p className={`${colors.texts.secondary} mb-6`}>{error}</p>
            <Button
              onClick={loadProducts}
              className={`${colors.buttons.primary} text-white`}
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className={`relative z-10 ${CONTAINER_PADDING}`}>
        {/* Breadcrumbs */}
        <Breadcrumb className={SECTION_MARGIN}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>My Products</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 mb-4 md:mb-6 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div
            className={`flex flex-col lg:flex-row justify-between items-start lg:items-center ${GRID_GAP}`}
          >
            <div className={FORM_SPACING}>
              <h1
                className={`text-lg md:text-2xl font-bold ${colors.texts.primary}`}
              >
                My Products
              </h1>
              <p className={`text-sm md:text-base ${colors.texts.secondary}`}>
                Manage your blockchain-verified inventory
              </p>
              <div className={`flex items-center ${HEADER_GAP} mt-2`}>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  <CubeIcon
                    className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                  />
                  Product Management
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
            <div className={`flex flex-wrap items-center ${HEADER_GAP}`}>
              <Link href="/vendor/add-product">
                <button
                  className={`flex items-center gap-2 px-4 py-2 text-xs text-white font-medium transition-colors cursor-pointer ${colors.buttons.primary}`}
                >
                  <PlusIcon className="h-4 w-4" />
                  Add New Product
                </button>
              </Link>
            </div>
          </div>
        </div>

        <div
          className={`transform transition-all duration-700 delay-100 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 ${GRID_GAP}`}
          >
            <Card
              className={`${colors.cards.base} hover:scale-[1.02] transition-all duration-300 rounded-none`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-xs font-medium ${colors.texts.secondary}`}
                >
                  Total Products
                </CardTitle>
                <div className="h-10 w-10 flex items-center justify-center">
                  <CubeIcon className={`h-5 w-5 ${colors.texts.primary}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${colors.texts.primary}`}>
                  {totalProducts}
                </div>
                <p className={`text-xs ${colors.texts.tertiary} mt-1`}>
                  Total inventory items
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${colors.cards.base} hover:scale-[1.02] transition-all duration-300 rounded-none`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-xs font-medium ${colors.texts.secondary}`}
                >
                  Active Products
                </CardTitle>
                <div className="h-10 w-10 flex items-center justify-center">
                  <CheckCircleIcon
                    className={`h-5 w-5 ${colors.texts.primary}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${colors.texts.primary}`}>
                  {activeProducts}
                </div>
                <p className={`text-xs ${colors.texts.tertiary} mt-1`}>
                  Currently listed
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${colors.cards.base} hover:scale-[1.02] transition-all duration-300 rounded-none`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-xs font-medium ${colors.texts.secondary}`}
                >
                  Low Stock
                </CardTitle>
                <div className="h-10 w-10 flex items-center justify-center">
                  <ArrowTrendingDownIcon
                    className={`h-5 w-5 ${colors.texts.primary}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${colors.texts.primary}`}>
                  {lowStockProducts}
                </div>
                <p className={`text-xs ${colors.texts.tertiary} mt-1`}>
                  Need restocking
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${colors.cards.base} hover:scale-[1.02] transition-all duration-300 rounded-none`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-xs font-medium ${colors.texts.secondary}`}
                >
                  Out of Stock
                </CardTitle>
                <div className="h-10 w-10 flex items-center justify-center">
                  <ExclamationTriangleIcon
                    className={`h-5 w-5 ${colors.texts.primary}`}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${colors.texts.primary}`}>
                  {outOfStockProducts}
                </div>
                <p className={`text-xs ${colors.texts.tertiary} mt-1`}>
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card
              className={`${colors.cards.base} hover:scale-[1.02] transition-all duration-300 rounded-none`}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-xs font-medium ${colors.texts.secondary}`}
                >
                  Total Value
                </CardTitle>
                <div className="h-10 w-10 flex items-center justify-center">
                  <RsIcon />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-lg font-bold ${colors.texts.primary}`}>
                  {formatCurrencyAbbreviated(totalValue)}
                </div>
                <p className={`text-xs ${colors.texts.tertiary} mt-1`}>
                  Inventory value
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          className={`transform transition-all duration-700 delay-200 mt-6 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className={`${colors.cards.base} rounded-none`}>
            <CardHeader>
              <div className={`flex items-center justify-between`}>
                <div>
                  <CardTitle
                    className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
                  >
                    <div className="h-8 w-8 flex items-center justify-center">
                      <FunnelIcon
                        className={`h-4 w-4 ${colors.texts.primary}`}
                      />
                    </div>
                    Filters & Search
                  </CardTitle>
                  <CardDescription
                    className={`text-xs ${colors.texts.secondary}`}
                  >
                    Find and manage your products easily
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-2 border-gray-200 dark:border-gray-700 text-xs"
                >
                  <FunnelIcon className="h-3 w-3 mr-2" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}
              >
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                  />
                  <Input
                    placeholder="Search by name, description, or SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200`}
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {categories.map((category) => (
                        <SelectItem
                          key={category}
                          value={category}
                          className="text-xs"
                        >
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {statusOptions.map((status) => (
                        <SelectItem
                          key={status}
                          value={status}
                          className="text-xs"
                        >
                          <span className="capitalize">
                            {status.replace("_", " ")}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      {sortOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2 items-center">
                    {searchTerm && (
                      <Badge
                        variant="outline"
                        className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} text-xs rounded-none`}
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
                        className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
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
                      {paginatedProducts.length} of{" "}
                      {filteredAndSortedProducts.length} products
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs ${colors.texts.secondary} mr-2`}>
                      View:
                    </span>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`h-8 w-8 p-0 flex items-center justify-center transition-colors cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`h-8 w-8 p-0 flex items-center justify-center transition-colors cursor-pointer ${
                        viewMode === "list"
                          ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                          : "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Bars3Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className={`transform transition-all duration-700 delay-300 mt-6 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredAndSortedProducts.length > 0 ? (
            <>
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-6"
                }
              >
                {paginatedProducts.map((product) =>
                  viewMode === "grid" ? (
                    <ProductCard key={product._id} product={product} />
                  ) : (
                    <ProductListItem key={product._id} product={product} />
                  )
                )}
              </div>
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <Pagination className="mt-8 rounded-none">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setCurrentPage(Math.max(1, currentPage - 1))
                        }
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setCurrentPage(Math.min(totalPages, currentPage + 1))
                        }
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          ) : (
            <Card
              className={`text-center py-16 ${colors.cards.base} rounded-none`}
            >
              <CardContent>
                <div className="h-20 w-20 mx-auto mb-6 flex items-center justify-center">
                  <CubeIcon className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                <h3
                  className={`text-base font-semibold ${colors.texts.primary} mb-2`}
                >
                  {totalProducts === 0
                    ? "No products yet"
                    : "No products found"}
                </h3>
                <p
                  className={`text-xs ${colors.texts.secondary} mb-6 max-w-md mx-auto`}
                >
                  {totalProducts === 0
                    ? "Start building your blockchain marketplace by adding your first product!"
                    : "We couldn't find any products matching your filters. Try adjusting your search criteria."}
                </p>
                {totalProducts === 0 ? (
                  <div className="flex justify-center">
                    {" "}
                    {/* Center the button */}
                    <Link href="/vendor/add-product">
                      <button
                        className={`flex items-center gap-2 px-4 py-2 text-xs text-white font-medium transition-colors cursor-pointer ${colors.buttons.primary}`}
                      >
                        <PlusIcon className="h-3 w-3" />
                        Add Your First Product
                      </button>
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All Categories");
                      setSelectedStatus("All Status");
                    }}
                    className={`flex items-center gap-2 px-6 py-3 mx-auto border-2 ${colors.borders.primary} ${colors.backgrounds.primary} ${colors.texts.primary} text-xs font-medium transition-colors cursor-pointer`}
                  >
                    <ArrowPathIcon className="h-3 w-3" />
                    Clear Filters
                  </button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

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
              Delete Product
            </DialogTitle>
            <DialogDescription className={`text-xs ${colors.texts.secondary}`}>
              Are you sure you want to delete &quot;{deletingProduct?.name}
              &quot;? This action cannot be undone and will permanently remove
              the product from your inventory.
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
              onClick={confirmDelete}
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
                  Delete Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
