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
  Building2,
  Truck,
  Factory,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Edit,
  Trash2,
  XCircle,
  Copy,
  ExternalLink,
  Store,
  Handshake,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";

// Vendor interface
interface Vendor {
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
  status: "active" | "inactive" | "pending" | "suspended";
  location: {
    city: string;
    state: string;
    country: string;
  };
  businessType: string;
  companySize: string;
  specialization: string[];
  notes?: string;
  walletAddress?: string;
  rating?: number;
  contractExpiry?: string;
  certifications: string[];
  preferredCategories: string[];
}

// Mock vendor data
const mockVendors: Vendor[] = [
  {
    id: "vend-001",
    name: "TechCorp Industries",
    email: "contact@techcorp.com",
    phone: "+1 (555) 123-4567",
    avatar: "",
    joinDate: "2024-01-15T08:00:00Z",
    lastOrderDate: "2025-08-25T14:30:00Z",
    totalOrders: 45,
    totalSpent: 125000.0,
    averageOrderValue: 2777.78,
    status: "active",
    location: {
      city: "San Francisco",
      state: "CA",
      country: "USA",
    },
    businessType: "Manufacturing",
    companySize: "500-1000",
    specialization: ["Electronics", "Semiconductors", "Tech Components"],
    notes: "Reliable partner, always pays on time",
    rating: 4.8,
    contractExpiry: "2025-12-31",
    certifications: ["ISO 9001", "ISO 14001", "RoHS"],
    preferredCategories: ["Electronics Components", "Industrial Equipment"],
    walletAddress: "0xa1b2c3d4e5f6789",
  },
  {
    id: "vend-002",
    name: "Green Textiles Ltd",
    email: "partnerships@greentextiles.com",
    phone: "+1 (555) 234-5678",
    avatar: "",
    joinDate: "2024-03-20T10:30:00Z",
    lastOrderDate: "2025-08-20T16:45:00Z",
    totalOrders: 32,
    totalSpent: 85000.0,
    averageOrderValue: 2656.25,
    status: "active",
    location: {
      city: "Portland",
      state: "OR",
      country: "USA",
    },
    businessType: "Retail",
    companySize: "100-500",
    specialization: [
      "Sustainable Textiles",
      "Organic Materials",
      "Eco-Friendly",
    ],
    notes: "Focuses on sustainable products",
    rating: 4.9,
    contractExpiry: "2026-03-31",
    certifications: ["GOTS", "OEKO-TEX", "Fair Trade"],
    preferredCategories: ["Textiles & Fabrics", "Raw Materials"],
    walletAddress: "0xb2c3d4e5f6789a1",
  },
  {
    id: "vend-003",
    name: "Manufacturing Corp",
    email: "procurement@mfgcorp.com",
    phone: "+1 (555) 345-6789",
    avatar: "",
    joinDate: "2024-06-10T09:15:00Z",
    lastOrderDate: "2025-08-15T11:20:00Z",
    totalOrders: 28,
    totalSpent: 95000.0,
    averageOrderValue: 3392.86,
    status: "active",
    location: {
      city: "Detroit",
      state: "MI",
      country: "USA",
    },
    businessType: "Manufacturing",
    companySize: "1000+",
    specialization: ["Heavy Machinery", "Automotive Parts", "Industrial"],
    notes: "Large volume orders, established relationship",
    rating: 4.6,
    contractExpiry: "2025-06-30",
    certifications: ["ISO 9001", "TS 16949", "IATF 16949"],
    preferredCategories: [
      "Machinery & Equipment",
      "Automotive Parts",
      "Metal & Alloys",
    ],
    walletAddress: "0xc3d4e5f6789a1b2",
  },
  {
    id: "vend-004",
    name: "Global Distributors",
    email: "sales@globaldist.com",
    phone: "+1 (555) 456-7890",
    avatar: "",
    joinDate: "2024-02-28T13:45:00Z",
    lastOrderDate: "2025-07-30T10:00:00Z",
    totalOrders: 15,
    totalSpent: 42000.0,
    averageOrderValue: 2800.0,
    status: "pending",
    location: {
      city: "Chicago",
      state: "IL",
      country: "USA",
    },
    businessType: "Distribution",
    companySize: "50-100",
    specialization: ["Multi-Category", "Global Distribution", "Logistics"],
    notes: "Pending contract renewal",
    rating: 4.2,
    contractExpiry: "2025-09-15",
    certifications: ["ISO 9001", "C-TPAT"],
    preferredCategories: ["Construction Materials", "Packaging Materials"],
    walletAddress: "0xd4e5f6789a1b2c3",
  },
  {
    id: "vend-005",
    name: "Medical Supply Co",
    email: "orders@medsupply.com",
    phone: "+1 (555) 567-8901",
    avatar: "",
    joinDate: "2024-08-05T07:30:00Z",
    lastOrderDate: "2025-06-20T15:10:00Z",
    totalOrders: 8,
    totalSpent: 18500.0,
    averageOrderValue: 2312.5,
    status: "inactive",
    location: {
      city: "Boston",
      state: "MA",
      country: "USA",
    },
    businessType: "Healthcare",
    companySize: "10-50",
    specialization: [
      "Medical Devices",
      "Healthcare Supplies",
      "Pharmaceuticals",
    ],
    notes: "Inactive for 2+ months, needs follow-up",
    rating: 4.4,
    contractExpiry: "2026-08-31",
    certifications: ["FDA", "ISO 13485", "GMP"],
    preferredCategories: ["Medical Supplies", "Chemical Products"],
    walletAddress: "0xe5f6789a1b2c3d4",
  },
];

const statusOptions = [
  "All Status",
  "active",
  "inactive",
  "pending",
  "suspended",
];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "spent-desc", label: "Highest Spender" },
  { value: "spent-asc", label: "Lowest Spender" },
  { value: "orders-desc", label: "Most Orders" },
  { value: "orders-asc", label: "Least Orders" },
  { value: "recent", label: "Most Recent" },
  { value: "oldest", label: "Oldest Partnership" },
];

export default function SupplierVendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>(mockVendors);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadVendors();
  }, []);

  const loadVendors = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "inactive":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case "suspended":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
      case "inactive":
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
      case "suspended":
        return "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800";
    }
  };

  const filteredAndSortedVendors = useMemo(() => {
    const filtered = vendors.filter((vendor) => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.businessType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.specialization.some((spec) =>
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesStatus =
        selectedStatus === "All Status" || vendor.status === selectedStatus;

      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "active" && vendor.status === "active") ||
        (selectedTab === "pending" && vendor.status === "pending") ||
        (selectedTab === "inactive" &&
          (vendor.status === "inactive" || vendor.status === "suspended"));

      return matchesSearch && matchesStatus && matchesTab;
    });

    // Sort vendors
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
  }, [vendors, searchTerm, selectedStatus, selectedTab, sortBy]);

  // Calculate statistics
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.status === "active").length;
  const pendingVendors = vendors.filter((v) => v.status === "pending").length;
  const inactiveVendors = vendors.filter(
    (v) => v.status === "inactive" || v.status === "suspended"
  ).length;
  const totalVolume = vendors.reduce((sum, v) => sum + v.totalSpent, 0);
  const avgOrderValue =
    totalVolume / vendors.reduce((sum, v) => sum + v.totalOrders, 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading vendor partners...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-blue-900/10">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 dark:from-gray-100 dark:via-blue-400 dark:to-gray-100 bg-clip-text text-transparent">
                Vendor Partners
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Manage relationships with your supply chain vendor network
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={loadVendors}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                onClick={() => setIsAddVendorOpen(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
            {[
              {
                title: "Total Vendors",
                value: totalVendors.toLocaleString(),
                subtitle: "Partner companies",
                icon: Users,
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-500/5 via-transparent to-cyan-500/5",
                iconBg: "from-blue-500 to-cyan-500",
              },
              {
                title: "Active Partners",
                value: activeVendors.toString(),
                subtitle: "Currently active",
                icon: CheckCircle,
                gradient: "from-green-500 to-emerald-500",
                bgGradient: "from-green-500/5 via-transparent to-emerald-500/5",
                iconBg: "from-green-500 to-emerald-500",
              },
              {
                title: "Total Volume",
                value: formatCurrency(totalVolume),
                subtitle: "Partnership value",
                icon: DollarSign,
                gradient: "from-green-500 to-teal-500",
                bgGradient: "from-green-500/5 via-transparent to-teal-500/5",
                iconBg: "from-green-500 to-teal-500",
              },
              {
                title: "Avg. Order Value",
                value: formatCurrency(avgOrderValue),
                subtitle: "Per transaction",
                icon: TrendingUp,
                gradient: "from-purple-500 to-indigo-500",
                bgGradient: "from-purple-500/5 via-transparent to-indigo-500/5",
                iconBg: "from-purple-500 to-indigo-500",
              },
              {
                title: "Pending",
                value: pendingVendors.toString(),
                subtitle: "Need attention",
                icon: Clock,
                gradient: "from-yellow-500 to-orange-500",
                bgGradient: "from-yellow-500/5 via-transparent to-orange-500/5",
                iconBg: "from-yellow-500 to-orange-500",
              },
              {
                title: "Inactive",
                value: inactiveVendors.toString(),
                subtitle: "Require follow-up",
                icon: AlertCircle,
                gradient: "from-gray-500 to-slate-500",
                bgGradient: "from-gray-500/5 via-transparent to-slate-500/5",
                iconBg: "from-gray-500 to-slate-500",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}
                />
                <CardContent className="relative z-10 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-r ${stat.iconBg} flex items-center justify-center shadow-lg`}
                    >
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    {index === 2 && (
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {stat.value}
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {stat.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {stat.subtitle}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filters and Controls */}
        <div
          className={`transform transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search vendors by name, email, business type, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger className="w-full lg:w-48 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="All Status" />
                    </div>
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
                  <SelectTrigger className="w-full lg:w-48 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4 text-gray-500" />
                      <SelectValue placeholder="Sort by" />
                    </div>
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

              {/* Tabs and View Controls */}
              <div className="flex items-center justify-between">
                <Tabs
                  value={selectedTab}
                  onValueChange={setSelectedTab}
                  className="w-full"
                >
                  <div className="flex items-center justify-between">
                    <TabsList className="bg-gray-100/50 dark:bg-gray-900/50 backdrop-blur-sm">
                      <TabsTrigger value="all" className="px-6">
                        All Vendors ({totalVendors})
                      </TabsTrigger>
                      <TabsTrigger value="active" className="px-6">
                        Active ({activeVendors})
                      </TabsTrigger>
                      <TabsTrigger value="pending" className="px-6">
                        Pending ({pendingVendors})
                      </TabsTrigger>
                      <TabsTrigger value="inactive" className="px-6">
                        Inactive ({inactiveVendors})
                      </TabsTrigger>
                    </TabsList>

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
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
                  </div>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Content */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {filteredAndSortedVendors.length > 0 ? (
            <Tabs value={selectedTab} className="space-y-6">
              <TabsContent value={selectedTab} className="mt-0">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedVendors.map((vendor) => (
                      <Card
                        key={vendor.id}
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl overflow-hidden group"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                              <AvatarImage
                                src={vendor.avatar}
                                alt={vendor.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                                {getInitials(vendor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {vendor.name}
                                </h3>
                                {getStatusIcon(vendor.status)}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {vendor.email}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge
                                  className={`text-xs px-2 py-0.5 ${getStatusColor(vendor.status)}`}
                                  variant="secondary"
                                >
                                  {vendor.status}
                                </Badge>
                                {vendor.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {vendor.rating}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Building2 className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {vendor.businessType} • {vendor.companySize}{" "}
                                employees
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {vendor.location.city}, {vendor.location.state}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {vendor.specialization
                                .slice(0, 2)
                                .map((spec, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs px-2 py-0.5"
                                  >
                                    {spec}
                                  </Badge>
                                ))}
                              {vendor.specialization.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
                                >
                                  +{vendor.specialization.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {vendor.totalOrders}
                              </p>
                              <p className="text-xs text-gray-500">
                                Total Orders
                              </p>
                            </div>
                            <div className="text-center p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(vendor.totalSpent)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Total Spent
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              Last order: {formatDate(vendor.lastOrderDate)}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedVendor(vendor);
                                  setIsDetailsOpen(true);
                                }}
                                className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
                    <CardContent className="p-0">
                      <div className="space-y-0">
                        {filteredAndSortedVendors.map((vendor, index) => (
                          <div
                            key={vendor.id}
                            className={`flex items-center gap-6 p-6 hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors ${
                              index !== filteredAndSortedVendors.length - 1
                                ? "border-b border-gray-200/50 dark:border-gray-800/50"
                                : ""
                            }`}
                          >
                            <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                              <AvatarImage
                                src={vendor.avatar}
                                alt={vendor.name}
                              />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                                {getInitials(vendor.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {vendor.name}
                                  </h3>
                                  {getStatusIcon(vendor.status)}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {vendor.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    className={`text-xs px-2 py-0.5 ${getStatusColor(vendor.status)}`}
                                    variant="secondary"
                                  >
                                    {vendor.status}
                                  </Badge>
                                  {vendor.rating && (
                                    <div className="flex items-center gap-1">
                                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                      <span className="text-xs text-gray-600 dark:text-gray-400">
                                        {vendor.rating}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {vendor.businessType}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {vendor.companySize} employees
                                </p>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {vendor.totalOrders}
                                </p>
                                <p className="text-xs text-gray-500">Orders</p>
                              </div>

                              <div>
                                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                                  {formatCurrency(vendor.totalSpent)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Total Spent
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedVendor(vendor);
                                    setIsDetailsOpen(true);
                                  }}
                                  className="h-8 px-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {totalVendors === 0
                    ? "No Vendor Partners Yet"
                    : "No Vendors Found"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  {totalVendors === 0
                    ? "Start building your vendor network to expand your supply chain reach."
                    : "Try adjusting your search terms or filters to find vendor partners."}
                </p>
                {totalVendors === 0 ? (
                  <Button
                    onClick={() => setIsAddVendorOpen(true)}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Vendor
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStatus("All Status");
                      setSelectedTab("all");
                    }}
                    className="shadow-lg hover:shadow-xl transition-all duration-300 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-0"
                  >
                    Clear All Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Vendor Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                <Eye className="h-4 w-4 text-white" />
              </div>
              Vendor Partner Details
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Complete information about your vendor partnership
            </DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6">
              {/* Vendor Header */}
              <div className="flex items-center gap-6 p-6 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage
                    src={selectedVendor.avatar}
                    alt={selectedVendor.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xl font-bold">
                    {getInitials(selectedVendor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedVendor.name}
                    </h3>
                    <Badge
                      className={`text-sm px-3 py-1 ${getStatusColor(selectedVendor.status)}`}
                      variant="secondary"
                    >
                      {selectedVendor.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span>{selectedVendor.email}</span>
                    </div>
                    {selectedVendor.phone && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Phone className="h-4 w-4" />
                        <span>{selectedVendor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {selectedVendor.location.city},{" "}
                        {selectedVendor.location.state},{" "}
                        {selectedVendor.location.country}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {selectedVendor.rating && (
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-500 fill-current" />
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {selectedVendor.rating}
                      </span>
                    </div>
                  )}
                  <p className="text-sm text-gray-500">
                    Partner since {formatDate(selectedVendor.joinDate)}
                  </p>
                </div>
              </div>

              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm bg-gray-50/30 dark:bg-gray-900/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Building2 className="h-5 w-5" />
                      Business Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Business Type</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedVendor.businessType}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Company Size</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedVendor.companySize} employees
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Specialization
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {selectedVendor.specialization.map((spec, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gray-50/30 dark:bg-gray-900/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Activity className="h-5 w-5" />
                      Partnership Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {selectedVendor.totalOrders}
                        </p>
                        <p className="text-sm text-gray-500">Total Orders</p>
                      </div>
                      <div className="text-center p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(selectedVendor.totalSpent)}
                        </p>
                        <p className="text-sm text-gray-500">Total Spent</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">
                        Average Order Value
                      </p>
                      <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {formatCurrency(selectedVendor.averageOrderValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Last Order</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(selectedVendor.lastOrderDate)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <Card className="border-0 shadow-sm bg-gray-50/30 dark:bg-gray-900/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <Shield className="h-5 w-5" />
                      Certifications & Contract
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2">
                        Certifications
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedVendor.certifications.map((cert, index) => (
                          <Badge
                            key={index}
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                          >
                            <Shield className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {selectedVendor.contractExpiry && (
                      <div>
                        <p className="text-sm text-gray-500">Contract Expiry</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(selectedVendor.contractExpiry)}
                        </p>
                      </div>
                    )}
                    {selectedVendor.walletAddress && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Blockchain Wallet
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
                            {selectedVendor.walletAddress}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                selectedVendor.walletAddress || ""
                              );
                              toast.success("Wallet address copied!");
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedVendor.notes && (
                  <Card className="border-0 shadow-sm bg-gray-50/30 dark:bg-gray-900/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <MessageCircle className="h-5 w-5" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">
                        {selectedVendor.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsDetailsOpen(false);
                toast.success("Vendor contact initiated");
              }}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Contact Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
        <DialogContent className="max-w-2xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-white" />
              </div>
              Add New Vendor Partner
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              Create a new vendor partnership for your supply chain network
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name *
                </Label>
                <Input
                  placeholder="Enter company name"
                  className="mt-1 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address *
                </Label>
                <Input
                  placeholder="vendor@company.com"
                  type="email"
                  className="mt-1 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </Label>
                <Input
                  placeholder="+1 (555) 123-4567"
                  className="mt-1 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Type *
                </Label>
                <Select>
                  <SelectTrigger className="mt-1 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="distribution">Distribution</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Specialization Areas
              </Label>
              <Input
                placeholder="e.g., Electronics, Textiles, Raw Materials (comma separated)"
                className="mt-1 h-12 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Notes
              </Label>
              <Textarea
                placeholder="Add any additional notes about this vendor partnership..."
                className="mt-1 border-0 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm focus:ring-2 focus:ring-green-500/20"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsAddVendorOpen(false)}
              className="shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsAddVendorOpen(false);
                toast.success("Vendor partnership invitation sent!");
              }}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Handshake className="h-4 w-4 mr-2" />
              Add Vendor Partner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
