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
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product, Order } from "@/types";
import { toast } from "sonner";

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
        return "bg-green-100 text-green-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Fill in the product details to add it to your inventory
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
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
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={newProduct.category}
                    onValueChange={(value) =>
                      setNewProduct((prev) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="price">Price ($) *</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
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
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sku">SKU</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
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
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="mfgDate">Manufacturing Date</Label>
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
                    />
                  </div>
                  <div>
                    <Label htmlFor="expDate">Expiry Date</Label>
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
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="images">Product Images</Label>
                  <div className="mt-2">
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="mb-2"
                    />
                    {newProduct.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {newProduct.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsAddProductOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleAddProduct}>Add Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {lowStockProducts > 0 && (
                <span className="text-orange-600">
                  {lowStockProducts} low stock
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingOrders} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(orders.map((o) => o.customerId)).size}
            </div>
            <p className="text-xs text-muted-foreground">Unique customers</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">My Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>
                Manage your product listings and inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
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
                  <SelectTrigger className="w-[180px]">
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

              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Products Found
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {products.length === 0
                        ? "You haven't added any products yet. Start by adding your first product!"
                        : "No products match your current filters."}
                    </p>
                    {products.length === 0 && (
                      <Button onClick={() => setIsAddProductOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Product
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {product.category && (
                              <Badge variant="outline">
                                {product.category}
                              </Badge>
                            )}
                            <Badge className={getStatusColor(product.status)}>
                              {product.status}
                            </Badge>
                            {product.quantity < 10 && (
                              <Badge variant="destructive">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Low Stock
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">${product.price}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {product.quantity}
                          </p>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
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

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage customer orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-muted-foreground">
                      When customers purchase your products, their orders will
                      appear here.
                    </p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">Order #{order.id}</h3>
                          <Badge
                            className={`${getStatusColor(order.status)} flex items-center gap-1`}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${order.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.customerName}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.products.map((item, index) => (
                          <div
                            key={index}
                            className="text-sm text-muted-foreground"
                          >
                            {item.quantity}x {item.productName} - $
                            {item.totalPrice.toFixed(2)}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        {order.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOrderStatusUpdate(order.id, "confirmed")
                              }
                            >
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOrderStatusUpdate(order.id, "cancelled")
                              }
                            >
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
                          >
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

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Analytics Data
                    </h3>
                    <p className="text-muted-foreground">
                      Add products and receive orders to see analytics
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {products.slice(0, 5).map((product, index) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.category}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${product.price}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} in stock
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Recent Activity
                    </h3>
                    <p className="text-muted-foreground">
                      Recent orders and activities will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Order #{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customerName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No Inventory Data
                    </h3>
                    <p className="text-muted-foreground">
                      Add products to see inventory overview
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {products.filter((p) => p.quantity > 50).length}
                      </div>
                      <div className="text-sm text-green-700">Well Stocked</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {
                          products.filter(
                            (p) => p.quantity <= 50 && p.quantity > 10
                          ).length
                        }
                      </div>
                      <div className="text-sm text-yellow-700">
                        Medium Stock
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {products.filter((p) => p.quantity <= 10).length}
                      </div>
                      <div className="text-sm text-red-700">Low Stock</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {products.filter((p) => p.quantity === 0).length}
                      </div>
                      <div className="text-sm text-gray-700">Out of Stock</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Product Dialog */}
      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter product name"
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
                  <SelectTrigger>
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-price">Price ($) *</Label>
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
                  />
                </div>
                <div>
                  <Label htmlFor="edit-quantity">Quantity *</Label>
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
                />
              </div>
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
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
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
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-images">Product Images</Label>
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
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Product ${index + 1}`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditProductOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct}>Update Product</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
