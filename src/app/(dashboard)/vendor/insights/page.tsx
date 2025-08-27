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
  ShoppingCart,
  Users,
  Package,
  Star,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Target,
  Clock,
  Award,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Filter,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

// Analytics data interfaces
interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  category: string;
  revenue: number;
  orders: number;
  views: number;
  conversionRate: number;
  stock: number;
}

interface CategoryData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CustomerMetrics {
  newCustomers: number;
  returningCustomers: number;
  customerRetention: number;
  averageLifetimeValue: number;
}

// Mock analytics data
const mockSalesData: SalesData[] = [
  { date: "2025-08-01", revenue: 1250, orders: 8, customers: 6, avgOrderValue: 156.25 },
  { date: "2025-08-02", revenue: 980, orders: 6, customers: 5, avgOrderValue: 163.33 },
  { date: "2025-08-03", revenue: 1680, orders: 12, customers: 9, avgOrderValue: 140.00 },
  { date: "2025-08-04", revenue: 890, orders: 5, customers: 4, avgOrderValue: 178.00 },
  { date: "2025-08-05", revenue: 2150, orders: 15, customers: 12, avgOrderValue: 143.33 },
  { date: "2025-08-06", revenue: 1450, orders: 9, customers: 7, avgOrderValue: 161.11 },
  { date: "2025-08-07", revenue: 1890, orders: 11, customers: 8, avgOrderValue: 171.82 },
  { date: "2025-08-08", revenue: 2340, orders: 16, customers: 13, avgOrderValue: 146.25 },
  { date: "2025-08-09", revenue: 1120, orders: 7, customers: 6, avgOrderValue: 160.00 },
  { date: "2025-08-10", revenue: 1780, orders: 10, customers: 8, avgOrderValue: 178.00 },
  { date: "2025-08-11", revenue: 2560, orders: 18, customers: 14, avgOrderValue: 142.22 },
  { date: "2025-08-12", revenue: 1340, orders: 8, customers: 7, avgOrderValue: 167.50 },
  { date: "2025-08-13", revenue: 1950, orders: 13, customers: 10, avgOrderValue: 150.00 },
  { date: "2025-08-14", revenue: 2780, orders: 19, customers: 15, avgOrderValue: 146.32 },
  { date: "2025-08-15", revenue: 2100, orders: 14, customers: 11, avgOrderValue: 150.00 },
  { date: "2025-08-16", revenue: 1680, orders: 9, customers: 7, avgOrderValue: 186.67 },
];

const mockProductPerformance: ProductPerformance[] = [
  {
    id: "1",
    name: "Wireless Gaming Mouse",
    category: "Electronics",
    revenue: 3599.60,
    orders: 40,
    views: 1250,
    conversionRate: 3.2,
    stock: 25,
  },
  {
    id: "2",
    name: "Bluetooth Headphones",
    category: "Electronics",
    revenue: 2999.75,
    orders: 15,
    views: 890,
    conversionRate: 1.7,
    stock: 12,
  },
  {
    id: "3",
    name: "Smart Watch Pro",
    category: "Electronics",
    revenue: 5999.85,
    orders: 20,
    views: 1580,
    conversionRate: 1.3,
    stock: 8,
  },
  {
    id: "4",
    name: "USB-C Hub",
    category: "Electronics",
    revenue: 1499.70,
    orders: 30,
    views: 750,
    conversionRate: 4.0,
    stock: 45,
  },
  {
    id: "5",
    name: "Laptop Stand",
    category: "Accessories",
    revenue: 1599.20,
    orders: 20,
    views: 520,
    conversionRate: 3.8,
    stock: 18,
  },
];

const mockCategoryData: CategoryData[] = [
  { name: "Electronics", value: 14099, percentage: 65.2, color: "#3B82F6" },
  { name: "Accessories", value: 3499, percentage: 16.2, color: "#10B981" },
  { name: "Gaming", value: 2899, percentage: 13.4, color: "#8B5CF6" },
  { name: "Office", value: 1099, percentage: 5.2, color: "#F59E0B" },
];

const timeRangeOptions = [
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "90d", label: "Last 3 Months" },
  { value: "1y", label: "Last Year" },
];

export default function VendorAnalyticsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "orders" | "customers">("revenue");

  useEffect(() => {
    loadAnalytics();
  }, [user?.id, timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app: const analytics = await fetchVendorAnalytics(user.id, timeRange);
    } catch (error) {
      toast.error("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const currentPeriodData = useMemo(() => {
    const totalRevenue = mockSalesData.reduce((sum, day) => sum + day.revenue, 0);
    const totalOrders = mockSalesData.reduce((sum, day) => sum + day.orders, 0);
    const totalCustomers = mockSalesData.reduce((sum, day) => sum + day.customers, 0);
    const avgOrderValue = totalRevenue / totalOrders;

    // Calculate growth (mock comparison with previous period)
    const revenueGrowth = 12.5;
    const ordersGrowth = 8.3;
    const customersGrowth = 15.2;
    const aovGrowth = 3.8;

    return {
      revenue: { value: totalRevenue, growth: revenueGrowth },
      orders: { value: totalOrders, growth: ordersGrowth },
      customers: { value: totalCustomers, growth: customersGrowth },
      avgOrderValue: { value: avgOrderValue, growth: aovGrowth },
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
                {entry.dataKey === "revenue" || entry.dataKey === "avgOrderValue"
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
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your sales performance and business insights
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value={currentPeriodData.revenue.value}
          growth={currentPeriodData.revenue.growth}
          icon={DollarSign}
          formatter={formatCurrency}
        />
        <MetricCard
          title="Total Orders"
          value={currentPeriodData.orders.value}
          growth={currentPeriodData.orders.growth}
          icon={ShoppingCart}
        />
        <MetricCard
          title="Unique Customers"
          value={currentPeriodData.customers.value}
          growth={currentPeriodData.customers.growth}
          icon={Users}
        />
        <MetricCard
          title="Avg Order Value"
          value={currentPeriodData.avgOrderValue.value}
          growth={currentPeriodData.avgOrderValue.growth}
          icon={Target}
          formatter={formatCurrency}
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Sales Trends
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground">Revenue Trend</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Daily revenue over time
                    </CardDescription>
                  </div>
                  <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                    <SelectTrigger className="w-32 border-border bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="orders">Orders</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockSalesData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders vs Revenue */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Orders vs Revenue</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Order volume and revenue correlation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockSalesData}>
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
                      name="Orders"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Average Order Value */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Average Order Value Trend</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track how your average order value changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockSalesData}>
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
              <CardTitle className="text-foreground">Top Performing Products</CardTitle>
              <CardDescription className="text-muted-foreground">
                Products ranked by revenue and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockProductPerformance.map((product, index) => (
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
                    <div className="grid grid-cols-4 gap-6 text-right">
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
                        <p className="text-sm font-medium text-foreground">{product.views}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {product.conversionRate}%
                        </p>
                        <p className="text-xs text-muted-foreground">Conversion</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Product Performance Chart */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Product Revenue Comparison</CardTitle>
              <CardDescription className="text-muted-foreground">
                Revenue generated by each product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockProductPerformance} layout="horizontal">
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
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Revenue by Category</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Distribution of revenue across product categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {mockCategoryData.map((entry, index) => (
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

            {/* Category Performance */}
            <Card className="border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">Category Performance</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Detailed breakdown by category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCategoryData.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium text-foreground">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            {formatCurrency(category.value)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {category.percentage}%
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
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
                <CardTitle className="text-sm font-medium text-foreground">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">2.8%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">+0.3%</span> vs last period
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">8,950</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">+12%</span> vs last period
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Customer Rating</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">4.7</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">+0.1</span> vs last period
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">2.4h</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600 dark:text-green-400">-0.6h</span> vs last period
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Performance Insights</CardTitle>
              <CardDescription className="text-muted-foreground">
                AI-powered recommendations to improve your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800 dark:text-green-300">
                      Strong Performance
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-400">
                      Your conversion rate increased by 15% this month. Consider expanding your top-performing Electronics category.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 dark:text-blue-300">
                      Optimization Opportunity
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Products in the Accessories category have high views but low conversion. Consider adjusting pricing or product descriptions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <Award className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-300">
                      Customer Satisfaction
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Your average rating of 4.7/5 is excellent! Maintain quality standards to keep customers happy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-800 dark:text-purple-300">
                      Inventory Alert
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-400">
                      Smart Watch Pro is running low on stock (8 units). Consider restocking soon to avoid stockouts.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goals & Targets */}
          <Card className="border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Goals & Targets</CardTitle>
              <CardDescription className="text-muted-foreground">
                Track your progress toward monthly and quarterly goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Monthly Revenue Goal</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(currentPeriodData.revenue.value)} / {formatCurrency(30000)}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentPeriodData.revenue.value / 30000) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentPeriodData.revenue.value / 30000) * 100).toFixed(1)}% completed
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Customer Acquisition</span>
                    <span className="text-sm text-muted-foreground">
                      {currentPeriodData.customers.value} / 200
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentPeriodData.customers.value / 200) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentPeriodData.customers.value / 200) * 100).toFixed(1)}% completed
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-foreground">Order Volume</span>
                    <span className="text-sm text-muted-foreground">
                      {currentPeriodData.orders.value} / 300
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((currentPeriodData.orders.value / 300) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {((currentPeriodData.orders.value / 300) * 100).toFixed(1)}% completed
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
            Common actions based on your analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Package className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Add Product</div>
                <div className="text-xs text-muted-foreground">Expand inventory</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Users className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">View Customers</div>
                <div className="text-xs text-muted-foreground">Manage relationships</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <ShoppingCart className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Check Orders</div>
                <div className="text-xs text-muted-foreground">Process pending</div>
              </div>
            </Button>

            <Button variant="outline" className="justify-start h-auto p-4 flex-col gap-2">
              <Download className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Export Report</div>
                <div className="text-xs text-muted-foreground">Download data</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}