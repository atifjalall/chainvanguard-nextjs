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
  Copy,
  Factory,
  Building2,
  Globe,
  Shield,
  Truck,
  DollarSign,
  Sparkles,
  RefreshCw,
  Download,
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Crown,
  Zap,
  MoreVertical,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";

// Supplier-specific categories
const categories = [
  "All Categories",
  "Raw Materials",
  "Electronics Components",
  "Textiles & Fabrics",
  "Chemical Products",
  "Machinery & Equipment",
  "Automotive Parts",
  "Construction Materials",
  "Agricultural Products",
  "Medical Supplies",
  "Industrial Equipment",
  "Packaging Materials",
  "Energy & Utilities",
  "Food Ingredients",
  "Metal & Alloys",
];

const statusOptions = [
  "All Status",
  "active",
  "inactive",
  "out-of-stock",
  "discontinued",
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

export default function SupplierProductsPage() {
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
  const [isVisible, setIsVisible] = useState(false);

  // Edit form state with supplier-specific fields
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    status: "active" as Product["status"],
    minimumOrderQuantity: "",
    origin: "",
    certifications: "",
    warranty: "",
  });

  useEffect(() => {
    setIsVisible(true);
    loadProducts();
  }, [user?.id]);

  const loadProducts = () => {
    setIsLoading(true);
    try {
      const savedProducts = localStorage.getItem(
        `supplier_${user?.id}_products`
      );
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      } else {
        // Initialize with some sample supplier products if none exist
        const sampleProducts: Product[] = [
          {
            id: "1",
            name: "Industrial Steel Rods",
            description:
              "High-grade steel rods for construction and manufacturing industries",
            category: "Raw Materials",
            price: 45.99,
            quantity: 500,
            status: "active",
            supplierId: user?.id || "supplier-1",
            supplierName: user?.name || "Supplier",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sku: "ISR-001",
            minimumOrderQuantity: 50,
            origin: "USA",
            certifications: "ISO 9001, ASTM A36",
            warranty: "2 years",
            weight: "25kg per rod",
            material: "Carbon Steel",
          },
          {
            id: "2",
            name: "Organic Cotton Fabric",
            description:
              "Premium organic cotton fabric for textile manufacturing",
            category: "Textiles & Fabrics",
            price: 12.5,
            quantity: 2000,
            status: "active",
            supplierId: user?.id || "supplier-1",
            supplierName: user?.name || "Supplier",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            sku: "OCF-002",
            minimumOrderQuantity: 100,
            origin: "India",
            certifications: "GOTS, OEKO-TEX",
            warranty: "Quality guarantee",
            weight: "200gsm",
            material: "100% Organic Cotton",
          },
        ];
        setProducts(sampleProducts);
        localStorage.setItem(
          `supplier_${user?.id}_products`,
          JSON.stringify(sampleProducts)
        );
      }
    } catch (error) {
      toast.error("Failed to load supply products");
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };
  //
  const saveProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem(
      `supplier_${user?.id}_products`,
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
          product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.origin &&
          product.origin.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All Categories" ||
        product.category === selectedCategory;

      const matchesStatus =
        selectedStatus === "All Status" || product.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });

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
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, selectedStatus, sortBy]);

  // Product stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.status === "active").length;
  const lowStockProducts = products.filter((p) => p.quantity <= 50).length;
  const outOfStockProducts = products.filter((p) => p.quantity === 0).length;

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      status: product.status,
      minimumOrderQuantity: product.minimumOrderQuantity?.toString() || "",
      origin: product.origin || "",
      certifications: Array.isArray(product.certifications)
        ? product.certifications.join(", ")
        : product.certifications || "",
      warranty: product.warranty || "",
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
      minimumOrderQuantity: editForm.minimumOrderQuantity
        ? parseInt(editForm.minimumOrderQuantity)
        : undefined,
      origin: editForm.origin,
      certifications: editForm.certifications,
      warranty: editForm.warranty,
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

  const getStatusBadge = (status: Product["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300">
            <Clock className="h-3 w-3 mr-1" />
            Inactive
          </Badge>
        );
      case "out-of-stock":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Out of Stock
          </Badge>
        );
      case "discontinued":
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Discontinued
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const ProductCard = ({ product }: { product: Product }) => (
    <Card className="group bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardContent className="p-6 relative z-10">
        <div className="space-y-4">
          {/* Product Image Placeholder */}
          <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-8 w-8 text-gray-400" />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500"
                  onClick={() => handleDelete(product)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {product.description}
            </p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
              {product.origin && (
                <Badge variant="outline" className="text-xs">
                  <Globe className="h-2 w-2 mr-1" />
                  {product.origin}
                </Badge>
              )}
            </div>

            {getStatusBadge(product.status)}

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Price
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  ${product.price}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stock
                </p>
                <p
                  className={`text-lg font-bold ${
                    product.quantity === 0
                      ? "text-red-500"
                      : product.quantity <= 50
                        ? "text-orange-500"
                        : "text-green-500"
                  }`}
                >
                  {product.quantity}
                </p>
              </div>
            </div>

            {product.minimumOrderQuantity && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                MOQ: {product.minimumOrderQuantity} units
              </div>
            )}

            {product.sku && (
              <div className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                SKU: {product.sku}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ProductListItem = ({ product }: { product: Product }) => (
    <Card className="group bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          {/* Product Image */}
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="h-6 w-6 text-gray-400" />
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                {getStatusBadge(product.status)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleEdit(product)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-500"
                  onClick={() => handleDelete(product)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-1">
              {product.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Category
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {product.category}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Price
                </p>
                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  ${product.price}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Stock
                </p>
                <p
                  className={`text-sm font-bold ${
                    product.quantity === 0
                      ? "text-red-500"
                      : product.quantity <= 50
                        ? "text-orange-500"
                        : "text-green-500"
                  }`}
                >
                  {product.quantity}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">MOQ</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {product.minimumOrderQuantity || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Origin
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {product.origin || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">SKU</p>
                <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                  {product.sku || "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading supply products...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Supply Chain Products
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
                Manage your industrial and raw materials catalog
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Factory className="h-3 w-3 mr-1" />
                  {totalProducts} Products
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  <Shield className="h-3 w-3 mr-1" />
                  Blockchain Verified
                </Badge>
                {totalProducts > 10 && (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <Award className="h-3 w-3 mr-1" />
                    Established Supplier
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* View toggle */}
              <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={loadProducts}
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => router.push("/supplier/add-product")}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Products",
                value: totalProducts,
                subtitle: "Supply catalog",
                icon: Package,
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
              },
              {
                title: "Active Products",
                value: activeProducts,
                subtitle: "Currently available",
                icon: CheckCircle,
                gradient: "from-green-500 to-emerald-500",
                bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
              },
              {
                title: "Low Stock",
                value: lowStockProducts,
                subtitle: "Need restocking",
                icon: AlertCircle,
                gradient: "from-orange-500 to-red-500",
                bgGradient: "from-orange-500/5 via-transparent to-red-500/5",
              },
              {
                title: "Categories",
                value: new Set(products.map((p) => p.category)).size,
                subtitle: "Product types",
                icon: Building2,
                gradient: "from-purple-500 to-indigo-500",
                bgGradient: "from-purple-500/5 via-transparent to-indigo-500/5",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {stat.subtitle}
                      </p>
                    </div>
                    <div
                      className={`h-12 w-12 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
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
          <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <SlidersHorizontal className="h-5 w-5" />
                Filters & Search
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Find and filter your supply chain products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Search Products
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search name, SKU, origin..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category
                  </Label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={setSelectedStatus}
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Sort by" />
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
              </div>

              {/* Active Filters & Results */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {filteredAndSortedProducts.length} of {totalProducts}{" "}
                    products
                  </span>
                  {(searchTerm ||
                    selectedCategory !== "All Categories" ||
                    selectedStatus !== "All Status") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedCategory("All Categories");
                        setSelectedStatus("All Status");
                      }}
                      className="h-7 text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="text-xs">
                      Search: {searchTerm}
                    </Badge>
                  )}
                  {selectedCategory !== "All Categories" && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCategory}
                    </Badge>
                  )}
                  {selectedStatus !== "All Status" && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Products Grid/List */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
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
            <Card className="text-center py-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-transparent to-slate-500/5 rounded-lg" />
              <CardContent className="relative z-10">
                <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                  <Package className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {totalProducts === 0
                    ? "No Products Yet"
                    : "No Products Found"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {totalProducts === 0
                    ? "Start building your supply catalog by adding your first product."
                    : "Try adjusting your search terms or filters to find what you're looking for."}
                </p>
                {totalProducts === 0 ? (
                  <Button
                    onClick={() => router.push("/supplier/add-product")}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
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
                    className="shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Product Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Edit className="h-4 w-4 text-white" />
                </div>
                Edit Supply Product
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Update your product information for the supply chain network
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    Product Name *
                  </Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-category"
                    className="text-sm font-medium"
                  >
                    Category *
                  </Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
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
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-description"
                  className="text-sm font-medium"
                >
                  Description *
                </Label>
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
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-price" className="text-sm font-medium">
                    Price (USD) *
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-quantity"
                    className="text-sm font-medium"
                  >
                    Quantity *
                  </Label>
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
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-moq" className="text-sm font-medium">
                    Minimum Order Quantity
                  </Label>
                  <Input
                    id="edit-moq"
                    type="number"
                    value={editForm.minimumOrderQuantity}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        minimumOrderQuantity: e.target.value,
                      }))
                    }
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-origin" className="text-sm font-medium">
                    Country of Origin
                  </Label>
                  <Input
                    id="edit-origin"
                    value={editForm.origin}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        origin: e.target.value,
                      }))
                    }
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(value) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: value as Product["status"],
                      }))
                    }
                  >
                    <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.slice(1).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-warranty"
                    className="text-sm font-medium"
                  >
                    Warranty Period
                  </Label>
                  <Input
                    id="edit-warranty"
                    value={editForm.warranty}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        warranty: e.target.value,
                      }))
                    }
                    placeholder="e.g., 2 years"
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-certifications"
                  className="text-sm font-medium"
                >
                  Certifications
                </Label>
                <Input
                  id="edit-certifications"
                  value={editForm.certifications}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      certifications: e.target.value,
                    }))
                  }
                  placeholder="e.g., ISO 9001, CE Marking"
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                />
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                  <Trash2 className="h-4 w-4 text-white" />
                </div>
                Delete Product
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this product? This action cannot
                be undone.
              </DialogDescription>
            </DialogHeader>
            {deletingProduct && (
              <div className="py-4">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {deletingProduct.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {deletingProduct.description}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-500">
                      SKU: {deletingProduct.sku}
                    </span>
                    <span className="text-gray-500">
                      Price: ${deletingProduct.price}
                    </span>
                    <span className="text-gray-500">
                      Stock: {deletingProduct.quantity}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOpen(false)}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                className="shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
