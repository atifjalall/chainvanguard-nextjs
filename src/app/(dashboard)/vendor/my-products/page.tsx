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
} from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Badge } from "@/components/_ui/badge";
import { Label } from "@/components/_ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/_ui/dropdown-menu";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  TrendingUp,
  TrendingDown,
  Grid3X3,
  List,
  SlidersHorizontal,
  MoreVertical,
  DollarSign,
  Sparkles,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";
import Link from "next/link";
import { productAPI } from "@/lib/api/product.api";

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

export default function VendorMyProductsPage() {
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
      const response = await productAPI.getVendorProducts({
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700";
      case "out_of_stock":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-3 w-3" />;
      case "inactive":
        return <XCircle className="h-3 w-3" />;
      case "out_of_stock":
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStockStatusBadge = (product: Product) => {
    if (product.quantity === 0) {
      return (
        <Badge
          variant="outline"
          className="border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Out of Stock
        </Badge>
      );
    } else if (product.quantity <= product.minStockLevel) {
      return (
        <Badge
          variant="outline"
          className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
        >
          <TrendingDown className="h-3 w-3 mr-1" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="outline"
          className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
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
      <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
        {/* Image Section */}
        <div className="relative w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 overflow-hidden">
          {showPlaceholder ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                No Image
              </span>
            </div>
          ) : (
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          )}

          {/* Actions Menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => handleViewProduct(product._id)}
                  className="text-xs"
                >
                  <Eye className="h-3.5 w-3.5 mr-2" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleEditProduct(product._id)}
                  className="text-xs"
                >
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDelete(product)}
                  className="text-xs text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-3 space-y-2.5">
          {/* Title */}
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 line-clamp-2">
            {product.name}
          </h3>

          {/* Category & Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {product.category}
            </span>
            <Badge
              variant="outline"
              className={`${getStatusColor(product.status)} text-xs py-0 h-5`}
            >
              {getStatusIcon(product.status)}
              <span className="ml-1 capitalize">
                {product.status.replace("_", " ")}
              </span>
            </Badge>
          </div>

          {/* Badges Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.isFeatured && (
              <Badge className="bg-amber-500 text-white text-xs border-0 h-5">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Featured
              </Badge>
            )}
            {product.blockchainVerified && (
              <Badge className="bg-blue-500 text-white text-xs border-0 h-5">
                <Shield className="h-2.5 w-2.5 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Price & Stock */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
              <p className="text-base font-bold text-gray-900 dark:text-gray-100">
                ${product.price.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Stock</p>
              <p
                className={`text-base font-bold ${
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
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {product.views || 0}
              </p>
            </div>
            <div className="text-center border-x border-gray-100 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">Sold</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {product.totalSold || 0}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {product.averageRating?.toFixed(1) || "N/A"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewProduct(product._id)}
              className="w-full h-8 text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              size="sm"
              onClick={() => handleEditProduct(product._id)}
              className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
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
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              {showPlaceholder ? (
                <div className="flex flex-col items-center justify-center gap-2">
                  <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No Image
                  </span>
                </div>
              ) : (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleViewProduct(product._id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleEditProduct(product._id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Product
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(product)}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge
                  variant="outline"
                  className="font-normal bg-white dark:bg-gray-800"
                >
                  {product.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="font-normal bg-white dark:bg-gray-800"
                >
                  {product.subcategory}
                </Badge>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(product.status)} flex items-center gap-1`}
                >
                  {getStatusIcon(product.status)}
                  <span className="capitalize">
                    {product.status.replace("_", " ")}
                  </span>
                </Badge>
                {getStockStatusBadge(product)}
                {product.isFeatured && (
                  <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 shadow-md">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {product.blockchainVerified && (
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0 shadow-md">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Price
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    ${product.price.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Stock
                  </p>
                  <p
                    className={`text-lg font-bold ${
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
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {product.views || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Sold
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {product.totalSold || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Rating
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {product.averageRating?.toFixed(1) || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading your products...
          </p>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
        <Card className="max-w-md w-full mx-4 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <CardContent className="p-8 text-center">
            <div className="h-20 w-20 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Failed to Load Products
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button
              onClick={loadProducts}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 p-6 space-y-6">
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                My Products
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Manage your blockchain-verified inventory
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={loadProducts}
                variant="outline"
                className="hidden lg:flex items-center gap-2 text-xs"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Link href="/vendor/add-product">
                <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-xs text-white font-medium transition-colors cursor-pointer shadow-md hover:shadow-lg">
                  <Plus className="h-4 w-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total Products
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-md">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {totalProducts}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Total inventory items
                </p>
              </CardContent>
            </Card>

            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Active Products
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {activeProducts}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Currently listed
                </p>
              </CardContent>
            </Card>

            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Low Stock
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shadow-md">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {lowStockProducts}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Need restocking
                </p>
              </CardContent>
            </Card>

            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Out of Stock
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shadow-md">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {outOfStockProducts}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Total Value
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shadow-md">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  ${totalValue.toFixed(2)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Inventory value
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <SlidersHorizontal className="h-4 w-4 text-blue-600" />
                    </div>
                    Filters & Search
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Find and manage your products easily
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden border-2 border-gray-200 dark:border-gray-700 text-xs"
                >
                  <Filter className="h-3 w-3 mr-2" />
                  {showFilters ? "Hide" : "Show"} Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className={`space-y-4 ${showFilters ? "block" : "hidden lg:block"}`}
              >
                <div>
                  <Label
                    htmlFor="search"
                    className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Search Products
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="Search by name, description, or SKU..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 text-xs border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="category"
                      className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Category
                    </Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="w-full h-10 text-xs border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
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
                  </div>

                  <div>
                    <Label
                      htmlFor="status"
                      className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Status
                    </Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger className="w-full h-10 text-xs border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
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
                  </div>

                  <div>
                    <Label
                      htmlFor="sort"
                      className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Sort By
                    </Label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full h-10 text-xs border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
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
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 mr-2">
                      View:
                    </span>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`h-8 w-8 p-0 rounded-md flex items-center justify-center transition-colors ${
                        viewMode === "grid"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`h-8 w-8 p-0 rounded-md flex items-center justify-center transition-colors ${
                        viewMode === "list"
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <Badge
                    variant="outline"
                    className="text-xs px-4 py-2 bg-white dark:bg-gray-800"
                  >
                    <Package className="h-3 w-3 mr-2" />
                    {filteredAndSortedProducts.length}{" "}
                    {filteredAndSortedProducts.length === 1
                      ? "product"
                      : "products"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredAndSortedProducts.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-6"
              }
            >
              {filteredAndSortedProducts.map((product) =>
                viewMode === "grid" ? (
                  <ProductCard key={product._id} product={product} />
                ) : (
                  <ProductListItem key={product._id} product={product} />
                )
              )}
            </div>
          ) : (
            <Card className="text-center py-16 border-0 shadow-md bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardContent>
                <div className="h-20 w-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {totalProducts === 0
                    ? "No products yet"
                    : "No products found"}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {totalProducts === 0
                    ? "Start building your blockchain marketplace by adding your first product!"
                    : "We couldn't find any products matching your filters. Try adjusting your search criteria."}
                </p>
                {totalProducts === 0 ? (
                  <Link href="/vendor/add-product">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-xs text-white font-medium transition-colors cursor-pointer mx-auto shadow-md hover:shadow-lg">
                      <Plus className="h-3 w-3" />
                      Add Your First Product
                    </button>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("All Categories");
                      setSelectedStatus("All Status");
                    }}
                    className="flex items-center gap-2 px-6 py-3 mx-auto rounded-md border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs font-medium transition-colors cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Clear Filters
                  </button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md border-0 shadow-md bg-white dark:bg-gray-900 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-base">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              Delete Product
            </DialogTitle>
            <DialogDescription className="text-xs">
              Are you sure you want to delete &quot;{deletingProduct?.name}
              &quot;? This action cannot be undone and will permanently remove
              the product from your inventory.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
              className="border-2 border-gray-200 dark:border-gray-700 text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-xs"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-3 w-3 mr-2" />
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
