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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Users,
  Star,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  MessageCircle,
  Filter,
  UserPlus,
  Download,
  RefreshCw,
  Award,
  Clock,
  Package,
  MoreHorizontal,
  Heart,
  AlertCircle,
  CheckCircle,
  Grid3X3,
  List,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

// Customer interface
interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  joinDate: string;
  lastOrderDate: string;
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  status: "active" | "inactive" | "vip" | "new";
  location: {
    city: string;
    state: string;
    country: string;
  };
  favoriteCategories: string[];
  notes?: string;
  walletAddress?: string;
  loyaltyPoints: number;
  rating?: number;
  preferredPayment: "crypto" | "card";
}

// Mock customers data
const mockCustomers: Customer[] = [
  {
    id: "cust-001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    avatar: "",
    joinDate: "2025-01-15T10:30:00Z",
    lastOrderDate: "2025-08-16T14:20:00Z",
    totalOrders: 12,
    totalSpent: 2847.96,
    averageOrderValue: 237.33,
    status: "vip",
    location: {
      city: "New York",
      state: "NY",
      country: "USA",
    },
    favoriteCategories: ["Electronics", "Gaming"],
    notes: "Frequent buyer, prefers express shipping",
    loyaltyPoints: 2847,
    rating: 4.8,
    preferredPayment: "crypto",
    walletAddress: "0x742d35Cc6558C4d3b",
  },
  {
    id: "cust-002",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 987-6543",
    avatar: "",
    joinDate: "2025-02-28T16:45:00Z",
    lastOrderDate: "2025-08-15T09:30:00Z",
    totalOrders: 8,
    totalSpent: 1456.78,
    averageOrderValue: 182.10,
    status: "active",
    location: {
      city: "Los Angeles",
      state: "CA",
      country: "USA",
    },
    favoriteCategories: ["Fashion", "Health & Beauty"],
    notes: "Prefers eco-friendly products",
    loyaltyPoints: 1456,
    rating: 4.9,
    preferredPayment: "crypto",
    walletAddress: "0x8f3e2b9a1c5d7f4e6",
  },
  {
    id: "cust-003",
    name: "Mike Chen",
    email: "mike.chen@email.com",
    phone: "+1 (555) 456-7890",
    avatar: "",
    joinDate: "2025-03-10T12:15:00Z",
    lastOrderDate: "2025-08-14T18:45:00Z",
    totalOrders: 15,
    totalSpent: 3892.45,
    averageOrderValue: 259.50,
    status: "vip",
    location: {
      city: "Chicago",
      state: "IL",
      country: "USA",
    },
    favoriteCategories: ["Electronics", "Tools & Hardware"],
    notes: "Tech enthusiast, early adopter",
    loyaltyPoints: 3892,
    rating: 4.7,
    preferredPayment: "crypto",
    walletAddress: "0x2a5b8c9d3e6f7a1b4",
  },
  {
    id: "cust-004",
    name: "Emily Davis",
    email: "emily.davis@email.com",
    phone: "+1 (555) 321-0987",
    avatar: "",
    joinDate: "2025-07-20T08:30:00Z",
    lastOrderDate: "2025-08-13T15:20:00Z",
    totalOrders: 3,
    totalSpent: 456.23,
    averageOrderValue: 152.08,
    status: "new",
    location: {
      city: "Miami",
      state: "FL",
      country: "USA",
    },
    favoriteCategories: ["Home & Garden", "Books"],
    notes: "New customer, potential for growth",
    loyaltyPoints: 456,
    rating: 5.0,
    preferredPayment: "crypto",
    walletAddress: "0x9d7e5f3a8b2c6e1d9",
  },
  {
    id: "cust-005",
    name: "David Wilson",
    email: "david.w@email.com",
    phone: "+1 (555) 654-3210",
    avatar: "",
    joinDate: "2024-11-05T14:00:00Z",
    lastOrderDate: "2025-06-10T11:15:00Z",
    totalOrders: 5,
    totalSpent: 789.12,
    averageOrderValue: 157.82,
    status: "inactive",
    location: {
      city: "Seattle",
      state: "WA",
      country: "USA",
    },
    favoriteCategories: ["Sports & Recreation"],
    notes: "Hasn't ordered recently, needs re-engagement",
    loyaltyPoints: 789,
    rating: 4.2,
    preferredPayment: "crypto",
    walletAddress: "0x6c4a8e2f7b9d3a5c1",
  },
  {
    id: "cust-006",
    name: "Lisa Anderson",
    email: "lisa.anderson@email.com",
    phone: "+1 (555) 789-0123",
    avatar: "",
    joinDate: "2025-04-12T09:45:00Z",
    lastOrderDate: "2025-08-16T12:30:00Z",
    totalOrders: 7,
    totalSpent: 1234.56,
    averageOrderValue: 176.37,
    status: "active",
    location: {
      city: "Boston",
      state: "MA",
      country: "USA",
    },
    favoriteCategories: ["Books", "Office Supplies"],
    notes: "Professional buyer, bulk orders",
    loyaltyPoints: 1234,
    rating: 4.6,
    preferredPayment: "crypto",
    walletAddress: "0x3f8e1b6d9c2a5e7f4",
  },
];

const statusOptions = [
  "All Status",
  "active",
  "inactive",
  "vip",
  "new",
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "spent-desc", label: "Highest Spender" },
  { value: "spent-asc", label: "Lowest Spender" },
  { value: "orders-desc", label: "Most Orders" },
  { value: "orders-asc", label: "Least Orders" },
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest Customer" },
];

export default function VendorCustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState<"all" | "vip" | "new" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");

  useEffect(() => {
    loadCustomers();
  }, [user?.id]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In real app: const customers = await fetchVendorCustomers(user.id);
      setCustomers(mockCustomers);
    } catch (error) {
      toast.error("Failed to load customers");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = customers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.location.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "All Status" || customer.status === selectedStatus;

      const matchesTab =
        selectedTab === "all" ||
        customer.status === selectedTab;

      return matchesSearch && matchesStatus && matchesTab;
    });

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "spent-desc":
          return b.totalSpent - a.totalSpent;
        case "spent-asc":
          return a.totalSpent - b.totalSpent;
        case "orders-desc":
          return b.totalOrders - a.totalOrders;
        case "orders-asc":
          return a.totalOrders - b.totalOrders;
        case "recent":
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        case "oldest":
          return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, selectedStatus, sortBy, selectedTab]);

  const getStatusConfig = (status: Customer["status"]) => {
    switch (status) {
      case "vip":
        return {
          color: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
          icon: Star,
          label: "VIP",
        };
      case "active":
        return {
          color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
          icon: CheckCircle,
          label: "Active",
        };
      case "new":
        return {
          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
          icon: UserPlus,
          label: "New",
        };
      case "inactive":
        return {
          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: Clock,
          label: "Inactive",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: Users,
          label: "Unknown",
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  const handleContactCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setContactMessage("");
    setIsContactOpen(true);
  };

  const sendMessage = () => {
    if (!selectedCustomer || !contactMessage.trim()) {
      toast.error("Please enter a message");
      return;
    }

    // In real app: sendCustomerMessage(selectedCustomer.id, contactMessage);
    toast.success(`Message sent to ${selectedCustomer.name}`);
    setIsContactOpen(false);
    setContactMessage("");
  };

  const CustomerCard = ({ customer }: { customer: Customer }) => {
    const statusConfig = getStatusConfig(customer.status);
    const StatusIcon = statusConfig.icon;
    const daysSinceLastOrder = Math.floor(
      (new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="group hover:shadow-md transition-all duration-200 border border-border bg-card">
        <CardContent className="p-4">
          {/* Customer Header */}
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">{customer.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`text-xs px-2 py-1 ${statusConfig.color}`} variant="secondary">
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
                {customer.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-muted-foreground">{customer.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{customer.totalOrders}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">${customer.totalSpent.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {customer.location.city}, {customer.location.state}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                Last order: {daysSinceLastOrder}d ago
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {customer.loyaltyPoints} points
              </span>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Favorite Categories</p>
            <div className="flex flex-wrap gap-1">
              {customer.favoriteCategories.slice(0, 2).map((category, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
              {customer.favoriteCategories.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{customer.favoriteCategories.length - 2}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleViewDetails(customer)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => handleContactCustomer(customer)}
            >
              <MessageCircle className="h-3 w-3 mr-1" />
              Contact
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const CustomerListItem = ({ customer }: { customer: Customer }) => {
    const statusConfig = getStatusConfig(customer.status);
    const StatusIcon = statusConfig.icon;
    const daysSinceLastOrder = Math.floor(
      (new Date().getTime() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="hover:shadow-sm transition-shadow border border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>

            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-medium text-foreground truncate">{customer.name}</h3>
                <div className="flex items-center gap-2">
                  {customer.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">{customer.rating}</span>
                    </div>
                  )}
                  <Badge className={`text-xs px-2 py-1 ${statusConfig.color}`} variant="secondary">
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground truncate">{customer.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.location.city}, {customer.location.state}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">{customer.totalOrders} orders</p>
                  <p className="text-xs text-muted-foreground">
                    Avg: ${customer.averageOrderValue.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-foreground">${customer.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.loyaltyPoints} points
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">
                    Last order: {daysSinceLastOrder}d ago
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined: {formatDate(customer.joinDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleViewDetails(customer)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleContactCustomer(customer)}
              >
                <MessageCircle className="h-3 w-3" />
              </Button>
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
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter((c) => c.status === "vip").length;
  const newCustomers = customers.filter((c) => c.status === "new").length;
  const inactiveCustomers = customers.filter((c) => c.status === "inactive").length;
  const averageSpend = customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage customer relationships and track engagement
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

          <Button variant="outline" size="sm" onClick={loadCustomers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Active relationships</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">VIP Customers</CardTitle>
            <Star className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{vipCustomers}</div>
            <p className="text-xs text-muted-foreground">High-value customers</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">New Customers</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{newCustomers}</div>
            <p className="text-xs text-muted-foreground">Recent acquisitions</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{inactiveCustomers}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Avg. Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${averageSpend.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border border-border rounded-md p-0.5 w-fit">
        <Button
          variant={selectedTab === "all" ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs ${
            selectedTab === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setSelectedTab("all")}
        >
          All Customers
        </Button>
        <Button
          variant={selectedTab === "vip" ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs ${
            selectedTab === "vip"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setSelectedTab("vip")}
        >
          <Star className="h-3 w-3 mr-1" />
          VIP ({vipCustomers})
        </Button>
        <Button
          variant={selectedTab === "new" ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs ${
            selectedTab === "new"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setSelectedTab("new")}
        >
          <UserPlus className="h-3 w-3 mr-1" />
          New ({newCustomers})
        </Button>
        <Button
          variant={selectedTab === "inactive" ? "default" : "ghost"}
          size="sm"
          className={`h-7 text-xs ${
            selectedTab === "inactive"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setSelectedTab("inactive")}
        >
          <Clock className="h-3 w-3 mr-1" />
          Inactive ({inactiveCustomers})
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-9 text-sm border-border bg-background"
              />
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

          {/* Results count and active filters */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedCustomers.length} of {totalCustomers} customers
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

      {/* Customers List */}
      {filteredAndSortedCustomers.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
          }
        >
          {filteredAndSortedCustomers.map((customer) =>
            viewMode === "grid" ? (
              <CustomerCard key={customer.id} customer={customer} />
            ) : (
              <CustomerListItem key={customer.id} customer={customer} />
            )
          )}
        </div>
      ) : (
        <Card className="text-center py-12 border border-border bg-card">
          <CardContent>
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {totalCustomers === 0 ? "No Customers Yet" : "No Customers Found"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {totalCustomers === 0
                ? "When customers make purchases, they will appear here."
                : "Try adjusting your search terms or filters."}
            </p>
            {totalCustomers === 0 ? (
              <Button onClick={() => window.open("/vendor/my-products", "_self")}>
                <Package className="h-4 w-4 mr-2" />
                Manage Products
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedStatus("All Status");
                  setSelectedTab("all");
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Customer Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View detailed customer information and history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
                  <AvatarFallback className="bg-muted text-muted-foreground text-lg">
                    {getInitials(selectedCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{selectedCustomer.name}</h3>
                  <p className="text-muted-foreground">{selectedCustomer.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`text-xs ${getStatusConfig(selectedCustomer.status).color}`}>
                      {getStatusConfig(selectedCustomer.status).label}
                    </Badge>
                    {selectedCustomer.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-muted-foreground">{selectedCustomer.rating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{selectedCustomer.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">${selectedCustomer.totalSpent.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">${selectedCustomer.averageOrderValue.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Avg Order</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{selectedCustomer.loyaltyPoints}</p>
                  <p className="text-xs text-muted-foreground">Loyalty Points</p>
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground">Contact Information</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{selectedCustomer.email}</span>
                        </div>
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{selectedCustomer.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {selectedCustomer.location.city}, {selectedCustomer.location.state}, {selectedCustomer.location.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-foreground">Account Information</Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Join Date:</span>
                          <span className="text-foreground">{formatDate(selectedCustomer.joinDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Order:</span>
                          <span className="text-foreground">{formatDate(selectedCustomer.lastOrderDate)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Payment Method:</span>
                          <span className="text-foreground capitalize">{selectedCustomer.preferredPayment}</span>
                        </div>
                        {selectedCustomer.walletAddress && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Wallet:</span>
                            <span className="text-foreground font-mono text-xs">{selectedCustomer.walletAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Favorite Categories</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCustomer.favoriteCategories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Customer Notes</Label>
                    <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {selectedCustomer.notes || "No notes available"}
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailsOpen(false);
              if (selectedCustomer) handleContactCustomer(selectedCustomer);
            }}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Customer Dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Contact Customer</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send a message to {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message" className="text-sm font-medium text-foreground">Message</Label>
              <Textarea
                id="message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="mt-1 border-border bg-background"
              />
            </div>
            {selectedCustomer && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
                    <AvatarFallback className="bg-muted text-muted-foreground">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{selectedCustomer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendMessage}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}