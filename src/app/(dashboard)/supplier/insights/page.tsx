/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Users,
  Package,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Target,
  Clock,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Factory,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

// Supplier analytics data interfaces
interface SupplyData {
  date: string;
  revenue: number;
  orders: number;
  vendors: number;
  avgOrderValue: number;
  inventoryValue: number;
}

interface ProductSupplyPerformance {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  totalSupplied: number;
  avgOrderSize: number;
  stock: number;
}

interface VendorData {
  name: string;
  value: number;
  percentage: number;
  color: string;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

// Mock supplier analytics data
const mockSupplyData: SupplyData[] = [
  { date: "2025-08-01", revenue: 15250, orders: 12, vendors: 8, avgOrderValue: 1270.83, inventoryValue: 125000 },
  { date: "2025-08-02", revenue: 18900, orders: 15, vendors: 10, avgOrderValue: 1260.00, inventoryValue: 127000 },
  { date: "2025-08-03", revenue: 22400, orders: 18, vendors: 12, avgOrderValue: 1244.44, inventoryValue: 124000 },
  { date: "2025-08-04", revenue: 16800, orders: 14, vendors: 9, avgOrderValue: 1200.00, inventoryValue: 123000 },
  { date: "2025-08-05", revenue: 28750, orders: 23, vendors: 15, avgOrderValue: 1250.00, inventoryValue: 128000 },
  { date: "2025-08-06", revenue: 21400, orders: 17, vendors: 11, avgOrderValue: 1258.82, inventoryValue: 126000 },
  { date: "2025-08-07", revenue: 25600, orders: 20, vendors: 13, avgOrderValue: 1280.00, inventoryValue: 129000 },
  { date: "2025-08-08", revenue: 31200, orders: 25, vendors: 16, avgOrderValue: 1248.00, inventoryValue: 131000 },
  { date: "2025-08-09", revenue: 19600, orders: 16, vendors: 10, avgOrderValue: 1225.00, inventoryValue: 130000 },
  { date: "2025-08-10", revenue: 27300, orders: 21, vendors: 14, avgOrderValue: 1300.00, inventoryValue: 132000 },
  { date: "2025-08-11", revenue: 34500, orders: 27, vendors: 18, avgOrderValue: 1277.78, inventoryValue: 133000 },
  { date: "2025-08-12", revenue: 23800, orders: 19, vendors: 12, avgOrderValue: 1252.63, inventoryValue: 131000 },
  { date: "2025-08-13", revenue: 29400, orders: 23, vendors: 15, avgOrderValue: 1278.26, inventoryValue: 134000 },
  { date: "2025-08-14", revenue: 36700, orders: 29, vendors: 19, avgOrderValue: 1265.52, inventoryValue: 136000 },
  { date: "2025-08-15", revenue: 32100, orders: 25, vendors: 16, avgOrderValue: 1284.00, inventoryValue: 135000 },
  { date: "2025-08-16", revenue: 28900, orders: 22, vendors: 14, avgOrderValue: 1313.64, inventoryValue: 137000 },
];

const mockProductSupplyPerformance: ProductSupplyPerformance[] = [
  {
    id: "1",
    name: "Industrial Steel Rods",
    category: "Raw Materials",
    revenue: 89500,
    orders: 45,
    totalSupplied: 2250,
    avgOrderSize: 50,
    stock: 500,
  },
  {
    id: "2",
    name: "Organic Cotton Fabric",
    category: "Textiles & Fabrics",
    revenue: 62000,
    orders: 38,
    totalSupplied: 4960,
    avgOrderSize: 130,
    stock: 2000,
  },
  {
    id: "3",
    name: "Electronic Circuit Boards",
    category: "Electronics Components",
    revenue: 71500,
    orders: 28,
    totalSupplied: 795,
    avgOrderSize: 28,
    stock: 150,
  },
  {
    id: "4",
    name: "Chemical Catalysts",
    category: "Chemical Products",
    revenue: 45200,
    orders: 22,
    totalSupplied: 550,
    avgOrderSize: 25,
    stock: 120,
  },
  {
    id: "5",
    name: "Precision Machine Parts",
    category: "Machinery & Equipment",
    revenue: 53800,
    orders: 19,
    totalSupplied: 285,
    avgOrderSize: 15,
    stock: 85,
  },
];

const mockVendorData: VendorData[] = [
  { name: "TechVendor Pro", value: 125000, percentage: 32.1, color: "#3B82F6", orders: 85 },
  { name: "Fashion Hub", value: 98000, percentage: 25.2, color: "#10B981", orders: 62 },
  { name: "Industrial Solutions", value: 87000, percentage: 22.4, color: "#8B5CF6", orders: 54 },
  { name: "Manufacturing Corp", value: 79000, percentage: 20.3, color: "#F59E0B", orders: 48 },
];

const mockCategoryData: CategoryData[] = [
  { name: "Raw Materials", value: 158000, percentage: 42.5, color: "#3B82F6" },
  { name: "Electronics Components", value: 89000, percentage: 23.9, color: "#10B981" },
  { name: "Textiles & Fabrics", value: 76000, percentage: 20.4, color: "#8B5CF6" },
  { name: "Chemical Products", value: 49000, percentage: 13.2, color: "#F59E0B" },
];

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
];

export default function SupplierAnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "orders" | "vendors">("revenue");

  useEffect(() => {
    loadAnalytics();
  }, [user?.id, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app: const analytics = await fetchSupplierAnalytics(user.id, timeRange);
    } catch (error) {
      toast.error("Failed to load supplier analytics");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const currentPeriodData = useMemo(() => {
    const totalRevenue = mockSupplyData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = mockSupplyData.reduce((sum, day) => sum + day.orders, 0);
    const totalVendors = mockSupplyData.reduce((sum, day) => sum + day.vendors, 0) / mockSupplyData.length;
    const avgOrderValue = totalRevenue / totalOrders;
    const avgInventoryValue = mockSupplyData.reduce((sum, day) => sum + day.inventoryValue, 0) / mockSupplyData.length;

    // Calculate growth (mock comparison with previous period)
    const revenueGrowth = 18.7;
    const ordersGrowth = 14.2;
    const vendorsGrowth = 22.1;
    const aovGrowth = 5.3;
    const inventoryGrowth = 8.9;

    return {
      revenue: { value: totalRevenue, growth: revenueGrowth },
      orders: { value: totalOrders, growth: ordersGrowth },
      vendors: { value: Math.round(totalVendors), growth: vendorsGrowth },
      avgOrderValue: { value: avgOrderValue, growth: aovGrowth },
      inventoryValue: { value: avgInventoryValue, growth: inventoryGrowth },
    };
  }, [timeRange]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-md p-3">
          <p className="text-sm font-medium text-foreground mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">{entry.dataKey}:</span>
              <span className="text-sm font-medium text-foreground">
                {entry.dataKey === "revenue" || entry.dataKey === "avgOrderValue" || entry.dataKey === "inventoryValue"
                  ? formatCurrency(entry.value)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const MetricCard = ({
    title,
    value,
    growth,
    icon: Icon,
    formatter = (val: number) => val.toString(),
  }: {
    title: string;
    value: number;
    growth: number;
    icon: any;
    formatter?: (val: number) => string;
  }) => (
    <Card className="border border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">
          {formatter(value)}
        </div>
        <div className="flex items-center gap-1">
          {growth >= 0 ? (
            <ArrowUpRight className="h-3 w-3 text-green-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-500" />
          )}
          <span
            className={`text-xs ${
              growth >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            }`}
          >
            {Math.abs(growth).toFixed(1)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Supply Chain Analytics</h1>
          <p className="text-muted-foreground">
            Track your supply performance and vendor relationships
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40 border-border bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={loadAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Revenue"
          value={currentPeriodData.revenue.value}
          growth={currentPeriodData.revenue.growth}
          icon={DollarSign}
          formatter={formatCurrency}
        />
        <MetricCard
          title="Supply Orders"
          value={currentPeriodData.orders.value}
          growth={currentPeriodData.orders.growth}
          icon={Truck}
        />
        <MetricCard
          title="Active Vendors"
          value={currentPeriodData.vendors.value}
          growth={currentPeriodData.vendors.growth}
          icon={Building2}
        />
        <MetricCard
          title="Avg Order Value"
          value={currentPeriodData.avgOrderValue.value}
          growth={currentPeriodData.avgOrderValue.growth}
          icon={Target}
          formatter={formatCurrency}
        />
        <MetricCard
          title="Inventory Value"
          value={currentPeriodData.inventoryValue.value}
          growth={currentPeriodData.inventoryValue.growth}
          icon={Package}
          formatter={formatCurrency}
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="supply" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="supply" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Supply Trends
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Factory className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supply" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Supply Revenue Trend</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Daily supply revenue over time
                    </CardDescription>
                  </div>
                  <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                    <SelectTrigger className="w-32 border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="vendors">Vendors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockSupplyData}>
                    <defs>
                      <linearGradient id="colorSupplyRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorSupplyRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders vs Inventory */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Orders vs Inventory Value</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Supply orders and inventory correlation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockSupplyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatDate}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="orders"
                      stroke="#10B981"
                      strokeWidth={2}
                      name="Supply Orders"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="inventoryValue"
                      stroke="#8B5CF6"
                      strokeWidth={2}
                      name="Inventory Value ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Average Order Value */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Average Supply Order Value</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track how your average B2B order value changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockSupplyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="avgOrderValue" fill="#8B5CF6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Top Supply Products</CardTitle>
              <CardDescription className="text-muted-foreground">
                Supply products ranked by revenue and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProductSupplyPerformance.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{product.name}</h4>
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-6 text-right">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {formatCurrency(product.revenue)}
                        </p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.orders}</p>
                        <p className="text-xs text-muted-foreground">Orders</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.totalSupplied}</p>
                        <p className="text-xs text-muted-foreground">Total Supplied</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.avgOrderSize}</p>
                        <p className="text-xs text-muted-foreground">Avg Order Size</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.stock}</p>
                        <p className="text-xs text-muted-foreground">Current Stock</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Performance Chart */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Category Revenue Distribution</CardTitle>
              <CardDescription className="text-muted-foreground">
                Revenue generated by supply categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockCategoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Vendor Revenue Pie Chart */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Revenue by Vendor</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Distribution of revenue across vendor partners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockVendorData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockVendorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vendor Performance */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Vendor Performance</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Detailed breakdown by vendor partner
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockVendorData.map((vendor, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: vendor.color }}
                          />
                          <span className="font-medium text-foreground">{vendor.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {formatCurrency(vendor.value)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vendor.orders} orders • {vendor.percentage}%
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${vendor.percentage}%`,
                            backgroundColor: vendor.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Performance Metrics */}
            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Order Fulfillment</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">+1.2%</span> vs last period
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Vendor Satisfaction</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">4.8</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">+0.2</span> vs last period
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Lead Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">3.2d</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">-0.5d</span> vs last period
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Quality Score</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">96.8%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">+0.8%</span> vs last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Supply Chain Insights */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Supply Chain Insights</CardTitle>
              <CardDescription className="text-muted-foreground">
                AI-powered recommendations to optimize your supply operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-300">
                      Excellent Supply Performance
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Your supply revenue increased by 18.7% this month. Raw Materials category is driving growth with strong vendor demand.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">
                      Expansion Opportunity
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      TechVendor Pro accounts for 32% of your revenue. Consider diversifying your vendor base or expanding capacity for this high-value relationship.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-300">
                      Inventory Optimization
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Electronic Circuit Boards have low stock (150 units) but high demand. Consider increasing inventory levels to avoid stockouts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-800 dark:text-purple-300">
                      Vendor Relationships
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Vendor satisfaction score of 4.8/5 is excellent. Continue providing quality products and reliable delivery to maintain strong partnerships.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Supply Goals & Targets */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Supply Chain Goals</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track your progress toward quarterly supply targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Quarterly Revenue Goal</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(currentPeriodData.revenue.value)} / {formatCurrency(750000)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentPeriodData.revenue.value / 750000) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentPeriodData.revenue.value / 750000) * 100).toFixed(1)}% completed
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Vendor Partnerships</span>
                    <span className="text-sm text-muted-foreground">
                      {currentPeriodData.vendors.value} / 25
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentPeriodData.vendors.value / 25) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentPeriodData.vendors.value / 25) * 100).toFixed(1)}% completed
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Supply Orders</span>
                    <span className="text-sm text-muted-foreground">
                      {currentPeriodData.orders.value} / 500
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentPeriodData.orders.value / 500) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentPeriodData.orders.value / 500) * 100).toFixed(1)}% completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription className="text-muted-foreground">
            Common supply chain actions based on your analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Factory className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Add Supply Product</div>
                <div className="text-xs text-muted-foreground">Expand catalog</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Building2 className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Manage Vendors</div>
                <div className="text-xs text-muted-foreground">Partner relationships</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Package className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Check Inventory</div>
                <div className="text-xs text-muted-foreground">Stock levels</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Download className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Export Report</div>
                <div className="text-xs text-muted-foreground">Supply chain data</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}