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
  Sparkles,
  Shield,
  Crown,
  Activity,
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
    averageOrderValue: 182.1,
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
    averageOrderValue: 259.5,
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

const statusOptions = ["All Status", "active", "inactive", "vip", "new"];

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
  const [selectedTab, setSelectedTab] = useState<
    "all" | "vip" | "new" | "inactive"
  >("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadCustomers();
  }, [user?.id]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
        selectedTab === "all" || customer.status === selectedTab;

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
          return (
            new Date(b.lastOrderDate).getTime() -
            new Date(a.lastOrderDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()
          );
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
          color:
            "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
          icon: Crown,
          label: "VIP",
        };
      case "active":
        return {
          color:
            "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
          icon: CheckCircle,
          label: "Active",
        };
      case "new":
        return {
          color:
            "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
          icon: Sparkles,
          label: "New",
        };
      case "inactive":
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
          icon: Clock,
          label: "Inactive",
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
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
      (new Date().getTime() - new Date(customer.lastOrderDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg" />
        <CardContent className="relative z-10 p-6">
          {/* Customer Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-white dark:border-gray-800 shadow-lg">
                <AvatarImage src={customer.avatar} alt={customer.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                  {getInitials(customer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1">
                <StatusIcon className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                {customer.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {customer.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className={`${statusConfig.color} flex items-center gap-1 text-xs`}
                  variant="secondary"
                >
                  <StatusIcon className="h-3 w-3" />
                  {statusConfig.label}
                </Badge>
                {customer.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {customer.rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg backdrop-blur">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {customer.totalOrders}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Orders</p>
            </div>
            <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg backdrop-blur">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                ${customer.totalSpent.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Total Spent
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {customer.location.city}, {customer.location.state}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-3 w-3 text-gray-500 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                Last order: {daysSinceLastOrder}d ago
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-3 w-3 text-gray-500 dark:text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {customer.loyaltyPoints} loyalty points
              </span>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-2 font-medium">
              Favorite Categories
            </p>
            <div className="flex flex-wrap gap-1">
              {customer.favoriteCategories
                .slice(0, 2)
                .map((category, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-gray-300 dark:border-gray-600"
                  >
                    {category}
                  </Badge>
                ))}
              {customer.favoriteCategories.length > 2 && (
                <Badge
                  variant="outline"
                  className="text-xs border-gray-300 dark:border-gray-600"
                >
                  +{customer.favoriteCategories.length - 2}
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
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
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
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
      (new Date().getTime() - new Date(customer.lastOrderDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return (
      <Card className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5 rounded-lg" />
        <CardContent className="relative z-10 p-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar className="h-14 w-14 border-2 border-white dark:border-gray-800 shadow-lg">
                <AvatarImage src={customer.avatar} alt={customer.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                  {getInitials(customer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-1">
                <StatusIcon className="h-3 w-3 text-white" />
              </div>
            </div>

            {/* Customer Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                  {customer.name}
                </h3>
                <div className="flex items-center gap-3">
                  {customer.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {customer.rating}
                      </span>
                    </div>
                  )}
                  <Badge
                    className={`${statusConfig.color} flex items-center gap-1`}
                    variant="secondary"
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 truncate">
                    {customer.email}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {customer.location.city}, {customer.location.state}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {customer.totalOrders} orders
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Avg: ${customer.averageOrderValue.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    ${customer.totalSpent.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {customer.loyaltyPoints} points
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">
                    Last order: {daysSinceLastOrder}d ago
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Joined: {formatDate(customer.joinDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleViewDetails(customer)}
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                onClick={() => handleContactCustomer(customer)}
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Contact
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
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-sm"></div>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalCustomers = customers.length;
  const vipCustomers = customers.filter((c) => c.status === "vip").length;
  const newCustomers = customers.filter((c) => c.status === "new").length;
  const inactiveCustomers = customers.filter(
    (c) => c.status === "inactive"
  ).length;
  const averageSpend =
    customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
              Manage customer relationships and track engagement
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                <Users className="h-3 w-3 mr-1" />
                {totalCustomers} Customers
              </Badge>
              <Badge variant="outline" className="border-gray-300">
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Secured
              </Badge>
              {vipCustomers > 0 && (
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  {vipCustomers} VIP
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
              onClick={loadCustomers}
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
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div
        className={`transform transition-all duration-700 delay-200 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: "Total Customers",
              value: totalCustomers,
              subtitle: "Active relationships",
              icon: Users,
              gradient: "from-blue-500 to-cyan-500",
              bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
            },
            {
              title: "VIP Customers",
              value: vipCustomers,
              subtitle: "High-value customers",
              icon: Crown,
              gradient: "from-purple-500 to-indigo-500",
              bgGradient: "from-purple-500/5 via-transparent to-indigo-500/5",
            },
            {
              title: "New Customers",
              value: newCustomers,
              subtitle: "Recent acquisitions",
              icon: Sparkles,
              gradient: "from-green-500 to-emerald-500",
              bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
            },
            {
              title: "At Risk",
              value: inactiveCustomers,
              subtitle: "Need attention",
              icon: AlertCircle,
              gradient: "from-orange-500 to-red-500",
              bgGradient: "from-orange-500/5 via-transparent to-red-500/5",
            },
            {
              title: "Avg. Spend",
              value: `$${averageSpend.toFixed(0)}`,
              subtitle: "Per customer",
              icon: DollarSign,
              gradient: "from-yellow-500 to-amber-500",
              bgGradient: "from-yellow-500/5 via-transparent to-amber-500/5",
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

      {/* Filters and Controls */}
      <div
        className={`transform transition-all duration-700 delay-400 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-indigo-500/5 rounded-lg" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                <SlidersHorizontal className="h-4 w-4 text-white" />
              </div>
              Filters & Search
            </CardTitle>
            <CardDescription>
              Filter and search through your customer base
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 w-fit bg-white/50 dark:bg-gray-900/50 backdrop-blur">
              <Button
                variant={selectedTab === "all" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "all"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("all")}
              >
                All Customers
              </Button>
              <Button
                variant={selectedTab === "vip" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "vip"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("vip")}
              >
                <Crown className="h-4 w-4 mr-1" />
                VIP ({vipCustomers})
              </Button>
              <Button
                variant={selectedTab === "new" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "new"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("new")}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                New ({newCustomers})
              </Button>
              <Button
                variant={selectedTab === "inactive" ? "default" : "ghost"}
                size="sm"
                className={`h-9 text-sm ${
                  selectedTab === "inactive"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                }`}
                onClick={() => setSelectedTab("inactive")}
              >
                <Clock className="h-4 w-4 mr-1" />
                Inactive ({inactiveCustomers})
              </Button>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10"
                />
              </div>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10">
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

            {/* Results and Active Filters */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredAndSortedCustomers.length} of {totalCustomers}{" "}
                customers
              </p>

              <div className="flex gap-2">
                {searchTerm && (
                  <Badge variant="outline" className="text-xs">
                    &quot;{searchTerm}&quot;
                    <button
                      onClick={() => setSearchTerm("")}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedStatus !== "All Status" && (
                  <Badge variant="outline" className="text-xs">
                    {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("All Status")}
                      className="ml-1 text-gray-600 hover:text-gray-800"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers List */}
      <div
        className={`transform transition-all duration-700 delay-600 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {filteredAndSortedCustomers.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-6"
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
          <Card className="text-center py-16 border-0 shadow-xl bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 via-transparent to-slate-500/5 rounded-lg" />
            <CardContent className="relative z-10">
              <div className="h-20 w-20 mx-auto mb-6 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center">
                <Users className="h-10 w-10 text-gray-500 dark:text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {totalCustomers === 0
                  ? "No Customers Yet"
                  : "No Customers Found"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {totalCustomers === 0
                  ? "When customers make purchases, they will appear here."
                  : "Try adjusting your search terms or filters."}
              </p>
              {totalCustomers === 0 ? (
                <Button
                  onClick={() => window.open("/vendor/my-products", "_self")}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
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
                  className="shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Eye className="h-4 w-4 text-white" />
              </div>
              Customer Details
            </DialogTitle>
            <DialogDescription>
              View detailed customer information and history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage
                    src={selectedCustomer.avatar}
                    alt={selectedCustomer.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-lg font-bold">
                    {getInitials(selectedCustomer.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCustomer.email}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge
                      className={`text-xs ${getStatusConfig(selectedCustomer.status).color}`}
                    >
                      {getStatusConfig(selectedCustomer.status).label}
                    </Badge>
                    {selectedCustomer.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedCustomer.rating}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedCustomer.totalOrders}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Orders
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${selectedCustomer.totalSpent.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Total Spent
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    ${selectedCustomer.averageOrderValue.toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Avg Order
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {selectedCustomer.loyaltyPoints}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Loyalty Points
                  </p>
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
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Contact Information
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCustomer.email}
                          </span>
                        </div>
                        {selectedCustomer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedCustomer.phone}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedCustomer.location.city},{" "}
                            {selectedCustomer.location.state},{" "}
                            {selectedCustomer.location.country}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Account Information
                      </Label>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Join Date:
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatDate(selectedCustomer.joinDate)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Last Order:
                          </span>
                          <span className="text-gray-900 dark:text-gray-100">
                            {formatDate(selectedCustomer.lastOrderDate)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Payment Method:
                          </span>
                          <span className="text-gray-900 dark:text-gray-100 capitalize">
                            {selectedCustomer.preferredPayment}
                          </span>
                        </div>
                        {selectedCustomer.walletAddress && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                              Wallet:
                            </span>
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                              {selectedCustomer.walletAddress}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Favorite Categories
                    </Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedCustomer.favoriteCategories.map(
                        (category, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {category}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Customer Notes
                    </Label>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
            <Button
              onClick={() => {
                setIsDetailsOpen(false);
                if (selectedCustomer) handleContactCustomer(selectedCustomer);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
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
            <DialogTitle className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-white" />
              </div>
              Contact Customer
            </DialogTitle>
            <DialogDescription>
              Send a message to {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="message"
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                Message
              </Label>
              <Textarea
                id="message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="mt-1"
              />
            </div>
            {selectedCustomer && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={selectedCustomer.avatar}
                      alt={selectedCustomer.name}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-bold">
                      {getInitials(selectedCustomer.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsContactOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
