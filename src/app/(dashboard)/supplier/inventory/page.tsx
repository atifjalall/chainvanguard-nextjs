/* eslint-disable @typescript-eslint/no-explicit-any */
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Plus,
  Edit,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Warehouse,
  Package,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";

const statusOptions = [
  "All Status",
  "in-stock",
  "low-stock", 
  "out-of-stock",
  "reserved"
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "quantity-asc", label: "Stock: Low to High" },
  { value: "quantity-desc", label: "Stock: High to Low" },
  { value: "value-asc", label: "Value: Low to High" },
  { value: "value-desc", label: "Value: High to Low" },
];

export default function SupplierInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("name-asc");
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<any>(null);

  // Adjustment form state
  const [adjustForm, setAdjustForm] = useState({
    quantity: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    loadInventory();
  }, [user?.id]);

  const loadInventory = () => {
    setIsLoading(true);
    try {
      // Load products and convert to inventory format
      const savedProducts = localStorage.getItem(`supplier_${user?.id}_products`);
      if (savedProducts) {
        const products: Product[] = JSON.parse(savedProducts);
        const inventoryData = products.map((product: Product) => ({
          ...product,
          inventoryStatus: getInventoryStatus(product.quantity, product.minimumOrderQuantity || 1),
          totalValue: product.price * product.quantity,
          lastUpdated: product.updatedAt,
        }));
        setInventory(inventoryData);
      } else {
        // Sample inventory data if no products exist
        const sampleInventory = [
          {
            id: "1",
            name: "Industrial Steel Rods",
            sku: "ISR-001",
            category: "Raw Materials",
            quantity: 500,
            minimumOrderQuantity: 50,
            price: 45.99,
            totalValue: 22995,
            origin: "USA",
            inventoryStatus: "in-stock",
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Organic Cotton Fabric",
            sku: "OCF-002", 
            category: "Textiles & Fabrics",
            quantity: 150,
            minimumOrderQuantity: 100,
            price: 12.50,
            totalValue: 1875,
            origin: "India",
            inventoryStatus: "low-stock",
            lastUpdated: new Date().toISOString(),
          },
          {
            id: "3",
            name: "Electronic Circuit Boards",
            sku: "ECB-003",
            category: "Electronics Components",
            quantity: 0,
            minimumOrderQuantity: 25,
            price: 89.99,
            totalValue: 0,
            origin: "Taiwan",
            inventoryStatus: "out-of-stock",
            lastUpdated: new Date().toISOString(),
          }
        ];
        setInventory(sampleInventory);
      }
    } catch (error) {
      toast.error("Failed to load inventory");
      console.error("Error loading inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInventoryStatus = (quantity: number, minOrder: number) => {
    if (quantity === 0) return "out-of-stock";
    if (quantity < minOrder * 2) return "low-stock";
    return "in-stock";
  };

  const saveInventory = (updatedInventory: any[]) => {
    setInventory(updatedInventory);
    // Also update the products in localStorage
    const productsData = updatedInventory.map((item: any) => ({
      ...item,
      status: item.inventoryStatus === "out-of-stock" ? "out-of-stock" : "active"
    }));
    localStorage.setItem(`supplier_${user?.id}_products`, JSON.stringify(productsData));
  };

  // Filter and sort inventory
  const filteredAndSortedInventory = useMemo(() => {
    const filtered = inventory.filter((item: any) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "All Status" || item.inventoryStatus === selectedStatus;

      return matchesSearch && matchesStatus;
    });

    // Sort inventory
    filtered.sort((a: any, b: any) => {
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
          return a.totalValue - b.totalValue;
        case "value-desc":
          return b.totalValue - a.totalValue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [inventory, searchTerm, selectedStatus, sortBy]);

  const handleAdjustment = (item: any) => {
    setAdjustingItem(item);
    setAdjustForm({
      quantity: "",
      reason: "",
      notes: "",
    });
    setIsAdjustOpen(true);
  };

  const handleSaveAdjustment = () => {
    if (!adjustingItem) return;

    const adjustment = parseInt(adjustForm.quantity);
    const newQuantity = Math.max(0, adjustingItem.quantity + adjustment);
    
    const updatedItem = {
      ...adjustingItem,
      quantity: newQuantity,
      totalValue: newQuantity * adjustingItem.price,
      inventoryStatus: getInventoryStatus(newQuantity, adjustingItem.minimumOrderQuantity),
      lastUpdated: new Date().toISOString(),
    };

    const updatedInventory = inventory.map((item: any) =>
      item.id === adjustingItem.id ? updatedItem : item
    );
    saveInventory(updatedInventory);

    setIsAdjustOpen(false);
    setAdjustingItem(null);
    toast.success("Inventory adjusted successfully!");
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case "in-stock":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
      case "low-stock":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
      case "out-of-stock":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300";
      case "reserved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case "in-stock":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "low-stock":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "out-of-stock":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "reserved":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalItems = inventory.length;
  const inStockItems = inventory.filter((item: any) => item.inventoryStatus === "in-stock").length;
  const lowStockItems = inventory.filter((item: any) => item.inventoryStatus === "low-stock").length;
  const outOfStockItems = inventory.filter((item: any) => item.inventoryStatus === "out-of-stock").length;
  const totalValue = inventory.reduce((sum: number, item: any) => sum + item.totalValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage your supply inventory levels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadInventory}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => toast.info("Export feature coming soon")}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => router.push("/supplier/add-product")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalItems}</div>
            <p className="text-xs text-muted-foreground">SKUs tracked</p>
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
            <CardTitle className="text-sm font-medium text-foreground">In Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {inStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Items available</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Low Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {lowStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {outOfStockItems}
            </div>
            <p className="text-xs text-muted-foreground">Items unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search SKU, name, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9 text-sm border-border bg-background"
                />
              </div>
            </div>

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

          {/* Results count */}
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedInventory.length} of {totalItems} items
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      {filteredAndSortedInventory.length > 0 ? (
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Inventory Items</CardTitle>
            <CardDescription className="text-muted-foreground">
              Current stock levels and values for all inventory items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">Product</TableHead>
                    <TableHead className="text-foreground">SKU</TableHead>
                    <TableHead className="text-foreground">Category</TableHead>
                    <TableHead className="text-foreground">Stock</TableHead>
                    <TableHead className="text-foreground">Status</TableHead>
                    <TableHead className="text-foreground">Unit Price</TableHead>
                    <TableHead className="text-foreground">Total Value</TableHead>
                    <TableHead className="text-foreground">Last Updated</TableHead>
                    <TableHead className="text-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedInventory.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{item.name}</p>
                          {item.origin && (
                            <p className="text-xs text-muted-foreground">Origin: {item.origin}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {item.sku}
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-foreground">{item.category}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{item.quantity}</p>
                          <p className="text-xs text-muted-foreground">
                            Min: {item.minimumOrderQuantity || 1}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.inventoryStatus)}
                          <Badge
                            className={`text-xs px-2 py-1 ${getStatusColor(item.inventoryStatus)}`}
                            variant="secondary"
                          >
                            {item.inventoryStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          ${item.price.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-foreground">
                          ${item.totalValue.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground">
                          {new Date(item.lastUpdated).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleAdjustment(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="text-center py-12 border border-border bg-card">
          <CardContent>
            <Warehouse className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {totalItems === 0 ? "No Inventory Items" : "No Items Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {totalItems === 0
                ? "Start by adding your first supply product."
                : "Try adjusting your search terms or filters."}
            </p>
            {totalItems === 0 ? (
              <Button onClick={() => router.push("/supplier/add-product")}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Item
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("All Status");
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Adjustment Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Adjust Stock</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Adjust inventory for &quot;{adjustingItem?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-stock" className="text-foreground">Current Stock</Label>
              <Input
                id="current-stock"
                value={adjustingItem?.quantity || 0}
                disabled
                className="border-border bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="adjustment-quantity" className="text-foreground">
                Adjustment (+/-)
              </Label>
              <Input
                id="adjustment-quantity"
                type="number"
                placeholder="e.g., +50 or -10"
                value={adjustForm.quantity}
                onChange={(e) =>
                  setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))
                }
                className="border-border bg-background"
              />
            </div>
            <div>
              <Label htmlFor="adjustment-reason" className="text-foreground">Reason</Label>
              <Select
                value={adjustForm.reason}
                onValueChange={(value) =>
                  setAdjustForm((prev) => ({ ...prev, reason: value }))
                }
              >
                <SelectTrigger className="border-border bg-background">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restock">Restocking</SelectItem>
                  <SelectItem value="sale">Sale/Order</SelectItem>
                  <SelectItem value="damaged">Damaged Goods</SelectItem>
                  <SelectItem value="recount">Stock Recount</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adjustment-notes" className="text-foreground">Notes (Optional)</Label>
              <Input
                id="adjustment-notes"
                placeholder="Additional notes..."
                value={adjustForm.notes}
                onChange={(e) =>
                  setAdjustForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="border-border bg-background"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdjustment}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}