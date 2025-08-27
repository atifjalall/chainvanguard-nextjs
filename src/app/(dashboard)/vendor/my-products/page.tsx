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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Grid3X3,
  List,
  SlidersHorizontal,
  Star,
  Copy,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";

const categories = [
  "All Categories",
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Accessories",
  "Home & Garden",
  "Books",
  "Sports & Recreation",
  "Health & Beauty",
  "Automotive",
  "Tools & Hardware",
  "Toys & Games",
  "Office Supplies",
];

const statusOptions = [
  "All Status",
  "active",
  "inactive", 
  "out-of-stock",
  "discontinued"
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "quantity-asc", label: "Stock: Low to High" },
  { value: "quantity-desc", label: "Stock: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

export default function MyProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    status: "active" as Product["status"],
  });

  useEffect(() => {
    loadProducts();
  }, [user?.id]);

  const loadProducts = () => {
    setIsLoading(true);
    try {
      const savedProducts = localStorage.getItem(`vendor_${user?.id}_products`);
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    } catch (error) {
      toast.error("Failed to load products");
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem(
      `vendor_${user?.id}_products`,
      JSON.stringify(updatedProducts)
    );
  };

  // Filter and sort products
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

    // Sort products
    filtered.sort((a, b) => {
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
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      status: product.status,
    });
    setIsEditOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;

    const updatedProduct: Product = {
      ...editingProduct,
      name: editForm.name,
      description: editForm.description,
      category: editForm.category,
      price: parseFloat(editForm.price),
      quantity: parseInt(editForm.quantity),
      status: editForm.status,
      updatedAt: new Date().toISOString(),
    };

    const updatedProducts = products.map((p) =>
      p.id === editingProduct.id ? updatedProduct : p
    );
    saveProducts(updatedProducts);

    setIsEditOpen(false);
    setEditingProduct(null);
    toast.success("Product updated successfully!");
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (!deletingProduct) return;

    const updatedProducts = products.filter((p) => p.id !== deletingProduct.id);
    saveProducts(updatedProducts);

    setIsDeleteOpen(false);
    setDeletingProduct(null);
    toast.success("Product deleted successfully!");
  };

  const handleToggleStatus = (product: Product) => {
    const newStatus: Product["status"] = product.status === "active" ? "inactive" : "active";
    const updatedProducts = products.map((p) =>
      p.id === product.id
        ? { ...p, status: newStatus, updatedAt: new Date().toISOString() }
        : p
    );
    saveProducts(updatedProducts);
    toast.success(`Product ${newStatus === "active" ? "activated" : "deactivated"}`);
  };

  const handleDuplicate = (product: Product) => {
    const duplicatedProduct: Product = {
      ...product,
      id: Date.now().toString(),
      name: `${product.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedProducts = [...products, duplicatedProduct];
    saveProducts(updatedProducts);
    toast.success("Product duplicated successfully!");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      case "out-of-stock":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "discontinued":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: "Out of Stock", color: "text-red-600 dark:text-red-400" };
    if (quantity < 10) return { text: "Low Stock", color: "text-orange-600 dark:text-orange-400" };
    return { text: "In Stock", color: "text-green-600 dark:text-green-400" };
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product.quantity);

    return (
      <Card className="group hover:shadow-md transition-all duration-200 border border-border bg-card">
        <CardHeader className="p-0">
          <div className="relative overflow-hidden rounded-t-lg">
            <div className="w-full h-48 bg-muted flex items-center justify-center">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="h-16 w-16 text-muted-foreground" />
              )}
            </div>

            {/* Actions overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border"
                onClick={() => router.push(`/vendor/products/${product.id}`)}
              >
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border"
                onClick={() => handleEdit(product)}
              >
                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 bg-background/90 hover:bg-background border-border"
                onClick={() => handleDuplicate(product)}
              >
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>

            {/* Status badge */}
            <Badge
              className={`absolute top-2 right-2 text-xs px-2 py-1 ${getStatusColor(
                product.status
              )}`}
              variant="secondary"
            >
              {product.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Category */}
            <Badge variant="outline" className="text-xs text-muted-foreground border-border">
              {product.category}
            </Badge>

            {/* Product name */}
            <h3 className="font-medium text-sm text-foreground leading-tight group-hover:text-foreground transition-colors line-clamp-2">
              {product.name}
            </h3>

            {/* SKU */}
            {product.sku && (
              <p className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</p>
            )}

            {/* Price and stock */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">
                ${product.price.toFixed(2)}
              </span>
              <div className="text-right">
                <p className={`text-sm font-medium ${stockStatus.color}`}>
                  {product.quantity} units
                </p>
                <p className="text-xs text-muted-foreground">{stockStatus.text}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-border text-muted-foreground hover:text-foreground"
                onClick={() => handleToggleStatus(product)}
              >
                {product.status === "active" ? "Deactivate" : "Activate"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0 border-border text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => handleDelete(product)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProductListItem = ({ product }: { product: Product }) => {
    const stockStatus = getStockStatus(product.quantity);

    return (
      <Card className="hover:shadow-sm transition-shadow border border-border bg-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* Image */}
            <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Package className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Badge variant="outline" className="text-xs text-muted-foreground border-border">
                    {product.category}
                  </Badge>
                  <h3 className="font-medium text-foreground">{product.name}</h3>
                  {product.sku && (
                    <p className="text-xs text-muted-foreground font-mono">SKU: {product.sku}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-lg font-bold text-foreground">
                    ${product.price.toFixed(2)}
                  </span>
                  <Badge
                    className={`text-xs px-2 py-1 ${getStatusColor(product.status)}`}
                    variant="secondary"
                  >
                    {product.status}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className={`text-sm font-medium ${stockStatus.color}`}>
                      {product.quantity} units
                    </p>
                    <p className="text-xs text-muted-foreground">{stockStatus.text}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(product.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Updated: {new Date(product.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-border"
                    onClick={() => router.push(`/vendor/products/${product.id}`)}
                  >
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-border"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-border"
                    onClick={() => handleDuplicate(product)}
                  >
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`h-7 text-xs px-2 border-border ${
                      product.status === "active"
                        ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        : "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                    }`}
                    onClick={() => handleToggleStatus(product)}
                  >
                    {product.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 border-border text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleDelete(product)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const lowStockProducts = products.filter((p) => p.quantity < 10).length;
  const outOfStockProducts = products.filter((p) => p.quantity === 0).length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and track performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 border border-border rounded-md p-0.5">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              className={`h-7 w-7 p-0 ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className={`h-7 w-7 p-0 ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Button onClick={() => router.push("/vendor/add-product")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {lowStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">Products &lt; 10 units</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {outOfStockProducts}
            </div>
            <p className="text-xs text-muted-foreground">Products at 0 units</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {new Set(products.map((p) => p.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
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
                  placeholder="Search products, SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-border bg-background"
                />
              </div>
            </div>

            {/* Category filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 text-sm border-border bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category} className="text-sm">
                    {category}
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
                {statusOptions.map((status) => (
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

          {/* Results count and active filters */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedProducts.length} of {totalProducts} products
            </p>

            <div className="flex gap-2">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                  &quot;{searchTerm}&quot;
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedCategory !== "All Categories" && (
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                  {selectedCategory}
                  <button
                    onClick={() => setSelectedCategory("All Categories")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedStatus !== "All Status" && (
                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                  {selectedStatus}
                  <button
                    onClick={() => setSelectedStatus("All Status")}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      {filteredAndSortedProducts.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedProducts.map((product) =>
            viewMode === "grid" ? (
              <ProductCard key={product.id} product={product} />
            ) : (
              <ProductListItem key={product.id} product={product} />
            )
          )}
        </div>
      ) : (
        <Card className="text-center py-12 border border-border bg-card">
          <CardContent>
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {totalProducts === 0 ? "No Products Yet" : "No Products Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {totalProducts === 0
                ? "Start by adding your first product to get started."
                : "Try adjusting your search terms or filters."}
            </p>
            {totalProducts === 0 ? (
              <Button onClick={() => router.push("/vendor/add-product")}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("All Categories");
                  setSelectedStatus("All Status");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Product</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your product information
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-foreground">Product Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="border-border bg-background"
                />
              </div>
              <div>
                <Label htmlFor="edit-category" className="text-foreground">Category</Label>
                <Select
                  value={editForm.category}
                  onValueChange={(value) =>
                    setEditForm((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.slice(1).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-description" className="text-foreground">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="border-border bg-background"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-price" className="text-foreground">Price ($)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  className="border-border bg-background"
                />
              </div>
              <div>
                <Label htmlFor="edit-quantity" className="text-foreground">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  className="border-border bg-background"
                />
              </div>
              <div>
                <Label htmlFor="edit-status" className="text-foreground">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value: Product["status"]) =>
                    setEditForm((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger className="border-border bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Delete Product</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete &quot;{deletingProduct?.name}&quot;? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}