"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
} from "@/components/ui/dialog";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  AlertCircle,
  Filter,
  Search,
  Star,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Globe,
  Target,
  Award,
  Crown,
  Store,
  Truck,
  MapPin,
  Calendar,
  Heart,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product, Order } from "@/types";
import { toast } from "sonner";
import Link from "next/link";

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isVisible, setIsVisible] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    images: [] as string[],
    sku: "",
    weight: "",
    dimensions: "",
    manufacturingDate: "",
    expiryDate: "",
  });

  useEffect(() => {
    setIsVisible(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load from localStorage or initialize with empty data
      const savedProducts = localStorage.getItem(`vendor_${user?.id}_products`);
      const savedOrders = localStorage.getItem(`vendor_${user?.id}_orders`);

      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }

      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        // Mock initial orders
        const mockOrders: Order[] = [
          {
            id: "1",
            customerId: "4",
            customerName: "John Customer",
            vendorId: user?.id || "2",
            vendorName: user?.name || "Vendor",
            products: [
              {
                productId: "1",
                productName: "Sample Product",
                quantity: 2,
                price: 89.99,
                totalPrice: 179.98,
              },
            ],
            totalAmount: 179.98,
            status: "confirmed",
            shippingAddress: {
              street: "123 Main St",
              city: "New York",
              state: "NY",
              zipCode: "10001",
              country: "USA",
            },
            paymentMethod: "crypto",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            trackingId: "TRK123456789",
          },
        ];
        setOrders(mockOrders);
        localStorage.setItem(
          `vendor_${user?.id}_orders`,
          JSON.stringify(mockOrders)
        );
      }
    } catch (error) {
      toast.error("Failed to load dashboard data");
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

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.quantity) {
      toast.error("Please fill in all required fields");
      return;
    }

    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
      images:
        newProduct.images.length > 0
          ? newProduct.images
          : ["/placeholder-product.jpg"],
      supplierId: user?.id || "vendor1",
      supplierName: user?.name || "Vendor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
      sku: newProduct.sku || `SKU-${Date.now()}`,
      weight: newProduct.weight,
      dimensions: newProduct.dimensions,
      manufacturingDate: newProduct.manufacturingDate,
      expiryDate: newProduct.expiryDate,
    };

    const updatedProducts = [...products, product];
    saveProducts(updatedProducts);

    // Reset form
    setNewProduct({
      name: "",
      description: "",
      category: "",
      price: "",
      quantity: "",
      images: [],
      sku: "",
      weight: "",
      dimensions: "",
      manufacturingDate: "",
      expiryDate: "",
    });

    setIsAddProductOpen(false);
    toast.success("Product added successfully!");
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      images: product.images || [],
      sku: product.sku || "",
      weight: product.weight || "",
      dimensions: product.dimensions || "",
      manufacturingDate: product.manufacturingDate || "",
      expiryDate: product.expiryDate || "",
    });
    setIsEditProductOpen(true);
  };

  const handleUpdateProduct = () => {
    if (!editingProduct) return;

    const updatedProduct: Product = {
      ...editingProduct,
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      quantity: parseInt(newProduct.quantity),
      images:
        newProduct.images.length > 0
          ? newProduct.images
          : ["/placeholder-product.jpg"],
      updatedAt: new Date().toISOString(),
      sku: newProduct.sku,
      weight: newProduct.weight,
      dimensions: newProduct.dimensions,
      manufacturingDate: newProduct.manufacturingDate,
      expiryDate: newProduct.expiryDate,
    };

    const updatedProducts = products.map((p) =>
      p.id === editingProduct.id ? updatedProduct : p
    );
    saveProducts(updatedProducts);

    setIsEditProductOpen(false);
    setEditingProduct(null);
    toast.success("Product updated successfully!");
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const updatedProducts = products.filter((p) => p.id !== productId);
      saveProducts(updatedProducts);
      toast.success("Product deleted successfully");
    }
  };

  const handleOrderStatusUpdate = (
    orderId: string,
    newStatus: Order["status"]
  ) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId
        ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
        : order
    );
    setOrders(updatedOrders);
    localStorage.setItem(
      `vendor_${user?.id}_orders`,
      JSON.stringify(updatedOrders)
    );
    toast.success(`Order ${newStatus}`);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In a real app, you would upload to IPFS or cloud storage
      // For now, we'll create placeholder URLs
      const imageUrls = Array.from(files).map(
        (file, index) => URL.createObjectURL(file) // This creates a temporary URL for preview
      );
      setNewProduct((prev) => ({
        ...prev,
        images: [...prev.images, ...imageUrls],
      }));
      toast.success(`${files.length} image(s) uploaded`);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || product.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400";
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    return "V";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-sm"></div>
        </div>
      </div>
    );
  }

  const totalRevenue = orders.reduce(
    (sum, order) => sum + order.totalAmount,
    0
  );
  const pendingOrders = orders.filter(
    (order) => order.status === "pending"
  ).length;
  const lowStockProducts = products.filter((p) => p.quantity < 10).length;
  const categories = [...new Set(products.map((p) => p.category))].filter(
    Boolean
  );

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                <AvatarImage
                  src="/default-vendor-avatar.png"
                  alt={user?.name ?? "Vendor"}
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white text-lg font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full p-2">
                <Store className="h-4 w-4 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Welcome back, {user?.name || "Vendor"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
                Your blockchain marketplace dashboard
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Verified Vendor
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure Store
                </Badge>
                {products.length > 10 && (
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                    <Award className="h-3 w-3 mr-1" />
                    Top Seller
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add New Product
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-white" />
                  </div>
                  Add New Product
                </DialogTitle>
                <DialogDescription>
                  Create a new product listing for your blockchain marketplace
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="name"
                      className="flex items-center gap-2 text-sm font-medium mb-3"
                    >
                      <Package className="h-4 w-4" />
                      Product Name *
                    </Label>
                    <Input
                      id="name"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter product name"
                      className="h-12 text-base"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium mb-3 block"
                    >
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Enter product description"
                      rows={4}
                      className="text-base resize-none"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="category"
                      className="text-sm font-medium mb-3 block"
                    >
                      Category
                    </Label>
                    <Select
                      value={newProduct.category}
                      onValueChange={(value) =>
                        setNewProduct((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="food">Food & Beverages</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="home">Home & Garden</SelectItem>
                        <SelectItem value="books">Books</SelectItem>
                        <SelectItem value="sports">
                          Sports & Recreation
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="price"
                        className="flex items-center gap-2 text-sm font-medium mb-3"
                      >
                        <DollarSign className="h-4 w-4" />
                        Price ($) *
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            price: e.target.value,
                          }))
                        }
                        placeholder="0.00"
                        className="h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="quantity"
                        className="flex items-center gap-2 text-sm font-medium mb-3"
                      >
                        <Package className="h-4 w-4" />
                        Quantity *
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newProduct.quantity}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            quantity: e.target.value,
                          }))
                        }
                        placeholder="0"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label
                      htmlFor="sku"
                      className="text-sm font-medium mb-3 block"
                    >
                      SKU
                    </Label>
                    <Input
                      id="sku"
                      value={newProduct.sku}
                      onChange={(e) =>
                        setNewProduct((prev) => ({
                          ...prev,
                          sku: e.target.value,
                        }))
                      }
                      placeholder="Auto-generated if empty"
                      className="h-12 text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="weight"
                        className="text-sm font-medium mb-3 block"
                      >
                        Weight
                      </Label>
                      <Input
                        id="weight"
                        value={newProduct.weight}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                        placeholder="e.g., 1.5 kg"
                        className="h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="dimensions"
                        className="text-sm font-medium mb-3 block"
                      >
                        Dimensions
                      </Label>
                      <Input
                        id="dimensions"
                        value={newProduct.dimensions}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            dimensions: e.target.value,
                          }))
                        }
                        placeholder="e.g., 10 x 15 x 5 cm"
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="mfgDate"
                        className="text-sm font-medium mb-3 block"
                      >
                        Manufacturing Date
                      </Label>
                      <Input
                        id="mfgDate"
                        type="date"
                        value={newProduct.manufacturingDate}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            manufacturingDate: e.target.value,
                          }))
                        }
                        className="h-12 text-base"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="expDate"
                        className="text-sm font-medium mb-3 block"
                      >
                        Expiry Date
                      </Label>
                      <Input
                        id="expDate"
                        type="date"
                        value={newProduct.expiryDate}
                        onChange={(e) =>
                          setNewProduct((prev) => ({
                            ...prev,
                            expiryDate: e.target.value,
                          }))
                        }
                        className="h-12 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="images"
                      className="flex items-center gap-2 text-sm font-medium mb-3"
                    >
                      <Upload className="h-4 w-4" />
                      Product Images
                    </Label>
                    <div>
                      <Input
                        id="images"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="h-12 text-base mb-4"
                      />
                      {newProduct.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          {newProduct.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={image}
                                alt={`Product ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-6 py-2 h-11"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer px-6 py-2 h-11"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
              title: "My Products",
              value: products.length,
              subtitle:
                lowStockProducts > 0
                  ? `${lowStockProducts} low stock`
                  : "All products active",
              icon: Package,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
            },
            {
              title: "Total Orders",
              value: orders.length,
              subtitle: `${pendingOrders} pending`,
              icon: ShoppingCart,
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
            },
            {
              title: "Revenue",
              value: `$${totalRevenue.toFixed(2)}`,
              subtitle: "Total earnings",
              icon: DollarSign,
              gradient: "from-yellow-500 to-orange-500",
              bgGradient: "from-yellow-500/5 via-transparent to-orange-500/5",
            },
            {
              title: "Customers",
              value: new Set(orders.map((o) => o.customerId)).size,
              subtitle: "Unique customers",
              icon: Users,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}
                />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </CardTitle>
                  <div
                    className={`h-10 w-10 rounded-full bg-gradient-to-r ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {stat.subtitle}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px] bg-white/50 dark:bg-gray-950/50 backdrop-blur-xl border-0 shadow-lg">
            <TabsTrigger
              value="products"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white transition-all duration-300"
            >
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white transition-all duration-300"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            {/* Product Management Card */}
            <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Package className="h-4 w-4 text-white" />
                  </div>
                  Product Management
                </CardTitle>
                <CardDescription>
                  Manage your blockchain marketplace inventory
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-white/50 dark:bg-gray-900/50 backdrop-blur border-gray-200 dark:border-gray-700"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px] bg-white/50 dark:bg-gray-900/50 backdrop-blur">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-[180px] bg-white/50 dark:bg-gray-900/50 backdrop-blur">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Products List */}
                <div className="space-y-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Products Found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        {products.length === 0
                          ? "Start building your blockchain marketplace by adding your first product!"
                          : "No products match your current filters."}
                      </p>
                      {products.length === 0 && (
                        <Button
                          onClick={() => setIsAddProductOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Product
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="group flex items-center justify-between p-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm"
                      >
                        <div className="flex items-center space-x-6">
                          <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-500 rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-8 w-8 text-gray-500 dark:text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">
                              {product.name}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              {product.category && (
                                <Badge
                                  variant="outline"
                                  className="border-gray-300 dark:border-gray-600"
                                >
                                  {product.category}
                                </Badge>
                              )}
                              <Badge
                                className={getStatusColor(product.status)}
                                variant="secondary"
                              >
                                {product.status}
                              </Badge>
                              {product.quantity < 10 && (
                                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Low Stock
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                              ${product.price}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Stock: {product.quantity}
                            </p>
                            {product.sku && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/20"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="hover:bg-red-50 hover:border-red-200 text-red-600 hover:text-red-700 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-white" />
                  </div>
                  Order Management
                </CardTitle>
                <CardDescription>
                  Track and manage your blockchain transactions
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="space-y-4">
                  {orders.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-blue-200 to-cyan-300 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No Orders Yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        When customers purchase your products, their orders will
                        appear here.
                      </p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <div
                        key={order.id}
                        className="group p-6 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200 backdrop-blur-sm"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                              #{order.id}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                Order #{order.id}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.customerName}
                              </p>
                            </div>
                            <Badge
                              className={`${getStatusColor(order.status)} flex items-center gap-1`}
                              variant="secondary"
                            >
                              {getStatusIcon(order.status)}
                              {order.status}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-xl text-gray-900 dark:text-gray-100">
                              ${order.totalAmount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {order.products.length} items
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.products.map((item, index) => (
                            <div
                              key={index}
                              className="text-sm text-gray-600 dark:text-gray-400 flex justify-between"
                            >
                              <span>
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="font-medium">
                                ${item.totalPrice.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                          {order.status === "pending" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "confirmed")
                                }
                                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700 dark:bg-green-950/20 dark:hover:bg-green-950/30 dark:border-green-800 dark:text-green-400"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleOrderStatusUpdate(order.id, "cancelled")
                                }
                                className="bg-red-50 hover:bg-red-100 border-red-200 text-red-700 dark:bg-red-950/20 dark:hover:bg-red-950/30 dark:border-red-800 dark:text-red-400"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Cancel
                              </Button>
                            </>
                          )}
                          {order.status === "confirmed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOrderStatusUpdate(order.id, "shipped")
                              }
                              className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:hover:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Mark as Shipped
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    Top Selling Products
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {products.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        No Analytics Data
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Add products and receive orders to see analytics
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {products.slice(0, 5).map((product, index) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {product.category}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-gray-100">
                              ${product.price}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {product.quantity} in stock
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-white" />
                    </div>
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 mx-auto mb-4 bg-gradient-to-br from-orange-200 to-red-300 rounded-full flex items-center justify-center">
                        <Clock className="h-8 w-8 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        No Recent Activity
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Recent orders and activities will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-colors backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                              <ShoppingCart className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                Order #{order.id}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {order.customerName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                ${order.totalAmount.toFixed(2)}
                              </p>
                              <Badge
                                className={getStatusColor(order.status)}
                                variant="secondary"
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inventory Overview */}
              <Card className="lg:col-span-2 relative overflow-hidden border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-indigo-500/5" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 flex items-center justify-center">
                      <PieChart className="h-4 w-4 text-white" />
                    </div>
                    Inventory Overview
                  </CardTitle>
                  <CardDescription>
                    Real-time stock level analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  {products.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-violet-200 to-indigo-300 rounded-full flex items-center justify-center">
                        <Package className="h-10 w-10 text-violet-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        No Inventory Data
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Add products to see inventory overview
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      {[
                        {
                          label: "Well Stocked",
                          value: products.filter((p) => p.quantity > 50).length,
                          color: "green",
                          gradient: "from-green-500 to-emerald-500",
                          bgColor: "bg-green-50 dark:bg-green-950/20",
                        },
                        {
                          label: "Medium Stock",
                          value: products.filter(
                            (p) => p.quantity <= 50 && p.quantity > 10
                          ).length,
                          color: "yellow",
                          gradient: "from-yellow-500 to-orange-500",
                          bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
                        },
                        {
                          label: "Low Stock",
                          value: products.filter(
                            (p) => p.quantity <= 10 && p.quantity > 0
                          ).length,
                          color: "red",
                          gradient: "from-red-500 to-pink-500",
                          bgColor: "bg-red-50 dark:bg-red-950/20",
                        },
                        {
                          label: "Out of Stock",
                          value: products.filter((p) => p.quantity === 0)
                            .length,
                          color: "gray",
                          gradient: "from-gray-500 to-slate-500",
                          bgColor: "bg-gray-50 dark:bg-gray-800/50",
                        },
                      ].map((stat, index) => (
                        <div
                          key={index}
                          className={`text-center p-6 ${stat.bgColor} rounded-xl border border-gray-200/30 dark:border-gray-700/30 hover:shadow-lg transition-all duration-300 backdrop-blur-sm`}
                        >
                          <div
                            className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-full mb-3 shadow-lg`}
                          >
                            <Package className="h-6 w-6 text-white" />
                          </div>
                          <div
                            className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400 mb-1`}
                          >
                            {stat.value}
                          </div>
                          <div
                            className={`text-sm text-${stat.color}-700 dark:text-${stat.color}-300 font-medium`}
                          >
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Product Dialog - Same structure as Add but with edit functionality */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Edit className="h-4 w-4 text-white" />
              </div>
              Edit Product
            </DialogTitle>
            <DialogDescription>Update your product details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Name *
                </Label>
                <Input
                  id="edit-name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter product name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={newProduct.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter product description"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) =>
                    setNewProduct((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="books">Books</SelectItem>
                    <SelectItem value="sports">Sports & Recreation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="edit-price"
                    className="flex items-center gap-2"
                  >
                    <DollarSign className="h-4 w-4" />
                    Price ($) *
                  </Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-quantity"
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Quantity *
                  </Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-sku">SKU</Label>
                <Input
                  id="edit-sku"
                  value={newProduct.sku}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, sku: e.target.value }))
                  }
                  placeholder="Product SKU"
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-weight">Weight</Label>
                  <Input
                    id="edit-weight"
                    value={newProduct.weight}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        weight: e.target.value,
                      }))
                    }
                    placeholder="e.g., 1.5 kg"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dimensions">Dimensions</Label>
                  <Input
                    id="edit-dimensions"
                    value={newProduct.dimensions}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        dimensions: e.target.value,
                      }))
                    }
                    placeholder="e.g., 10 x 15 x 5 cm"
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-mfgDate">Manufacturing Date</Label>
                  <Input
                    id="edit-mfgDate"
                    type="date"
                    value={newProduct.manufacturingDate}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        manufacturingDate: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-expDate">Expiry Date</Label>
                  <Input
                    id="edit-expDate"
                    type="date"
                    value={newProduct.expiryDate}
                    onChange={(e) =>
                      setNewProduct((prev) => ({
                        ...prev,
                        expiryDate: e.target.value,
                      }))
                    }
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label
                  htmlFor="edit-images"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Product Images
                </Label>
                <div className="mt-2">
                  <Input
                    id="edit-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="mb-2"
                  />
                  {newProduct.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {newProduct.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border-2 border-gray-200 group-hover:border-blue-400 transition-colors"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditProductOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <Edit className="h-4 w-4 mr-2" />
              Update Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
