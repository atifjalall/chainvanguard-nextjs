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
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MagnifyingGlassIcon,
  UsersIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  XCircleIcon,
  DocumentDuplicateIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import SupplierVendorsSkeleton from "@/components/skeletons/supplierVendorsSkeleton";
import { Activity } from "lucide-react";
import { badgeColors, colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const RsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="h-5 w-5"
  >
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="8"
      fontWeight="600"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.2"
      fontFamily="Arial, sans-serif"
    >
      Rs
    </text>
    <path
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

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
        return <CheckCircleIcon className="h-4 w-4" />;
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "inactive":
        return <XCircleIcon className="h-4 w-4" />;
      case "suspended":
        return <ExclamationCircleIcon className="h-4 w-4" />;
      default:
        return <ExclamationCircleIcon className="h-4 w-4" />;
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

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-100/10 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400";
      case "inactive":
      case "suspended":
        return "bg-red-100/10 dark:bg-red-900/10 border border-red-100 dark:border-red-900 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100/10 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-900 text-gray-700 dark:text-gray-300";
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
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
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
    return <SupplierVendorsSkeleton />;
  }

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vendors</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Vendor Partners
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Manage relationships with your supply chain vendor network
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadVendors}
                variant="outline"
                className={`hidden lg:flex items-center gap-2 text-xs cursor-pointer ${colors.buttons.outline} transition-all rounded-none`}
              >
                <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                className={`flex items-center gap-2 text-xs cursor-pointer ${colors.buttons.outline} transition-all rounded-none`}
              >
                <ArrowDownTrayIcon
                  className={`h-4 w-4 ${colors.icons.primary}`}
                />
                Export
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Total Vendors",
                value: totalVendors.toLocaleString(),
                subtitle: "Partner companies",
                icon: UsersIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Active Partners",
                value: activeVendors.toString(),
                subtitle: "Currently active",
                icon: CheckCircleIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Total Volume",
                value: formatCurrency(totalVolume),
                subtitle: "Partnership value",
                icon: RsIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Avg. Order Value",
                value: formatCurrency(avgOrderValue),
                subtitle: "Per transaction",
                icon: TagIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
              {
                title: "Pending",
                value: pendingVendors.toString(),
                subtitle: "Need attention",
                icon: ClockIcon,
                iconColor: "",
                iconBg: "bg-gray-100 dark:bg-gray-800",
              },
            ].map((stat, index) => (
              <Card
                key={index}
                className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle
                    className={`text-xs font-medium ${colors.texts.secondary}`}
                  >
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${colors.icons.primary}`} />
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-lg font-bold ${colors.texts.primary} mb-1`}
                  >
                    {stat.value}
                  </div>
                  <p className={`text-xs ${colors.texts.secondary}`}>
                    {stat.subtitle}
                  </p>
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
          <Card
            className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <FunnelIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                Filters & Search
              </CardTitle>
              <CardDescription className={`text-xs ${colors.texts.secondary}`}>
                Filter and search through your vendor partners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                  />
                  <Input
                    placeholder="Search vendors by name, email or business type"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200`}
                  />
                </div>
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger
                    className={`text-sm h-9 w-full min-w-[240px} ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200`}
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {statusOptions.map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-sm h-9"
                      >
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger
                    className={`text-sm h-9 w-full min-w-[240px} ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200`}
                  >
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {sortOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-sm h-9"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2 items-center mt-2">
                {searchTerm && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                  >
                    &quot;{searchTerm}&quot;
                    <button
                      onClick={() => setSearchTerm("")}
                      className={`ml-1 ${colors.texts.secondary} hover:${colors.texts.primary} cursor-pointer`}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedStatus !== "All Status" && (
                  <Badge
                    variant="outline"
                    className={`text-xs ${colors.backgrounds.primary} ${colors.borders.primary} ${colors.texts.secondary} rounded-none`}
                  >
                    {selectedStatus}
                    <button
                      onClick={() => setSelectedStatus("All Status")}
                      className={`ml-1 ${colors.texts.secondary} hover:${colors.texts.primary} cursor-pointer`}
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <span
                  className={`text-xs ${colors.texts.secondary} ml-2 whitespace-nowrap`}
                >
                  {filteredAndSortedVendors.length} vendors found
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - move out of Filters & Search, center after filters card */}
        <div
          className={`flex justify-center mt-6 transition-all duration-700 delay-350 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="w-full flex justify-center">
            {/* THEME-MATCHED TABS (like login page wallet selector) */}
            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full flex justify-center"
            >
              <TabsList
                className={`flex w-full max-w-2xl ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto`}
              >
                <TabsTrigger
                  value="all"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "all"
                      ? `${colors.backgrounds.primary} ${colors.texts.primary}`
                      : `${colors.texts.secondary} hover:${colors.texts.primary}`
                  } flex items-center gap-2 justify-center`}
                  onClick={() => setSelectedTab("all")}
                >
                  <UsersIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  All Vendors ({totalVendors})
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "active"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  } flex items-center gap-2 justify-center`}
                >
                  <CheckCircleIcon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  Active ({activeVendors})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "pending"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  } flex items-center gap-2 justify-center`}
                >
                  <ClockIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Pending ({pendingVendors})
                </TabsTrigger>
                <TabsTrigger
                  value="inactive"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "inactive"
                      ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  } flex items-center gap-2 justify-center`}
                >
                  <XCircleIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Inactive ({inactiveVendors})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
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
                        className={`${colors.cards.base} hover:${colors.cards.hover} overflow-hidden group rounded-none !shadow-none hover:!shadow-none`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4 mb-4">
                            <Avatar
                              className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
                            >
                              <AvatarImage
                                src={vendor.avatar}
                                alt={vendor.name}
                              />
                              <AvatarFallback
                                className={`${colors.texts.primary} font-bold rounded-none`}
                              >
                                {getInitials(vendor.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3
                                  className={`font-semibold ${colors.texts.primary} truncate`}
                                >
                                  {vendor.name}
                                </h3>
                                {getStatusIcon(vendor.status)}
                              </div>
                              <p
                                className={`text-sm ${colors.texts.muted} truncate`}
                              >
                                {vendor.email}
                              </p>
                              <div className="flex items-center gap-1 mt-1">
                                <Badge
                                  className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(vendor.status)}`}
                                  variant="secondary"
                                >
                                  {vendor.status}
                                </Badge>
                                {vendor.rating && (
                                  <div className="flex items-center gap-1">
                                    <StarIcon
                                      className={`h-3 w-3 ${colors.texts.warning} fill-current`}
                                    />
                                    <span
                                      className={`text-xs ${colors.texts.secondary}`}
                                    >
                                      {vendor.rating}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 mb-4">
                            <div
                              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                            >
                              <BuildingOffice2Icon
                                className={`h-4 w-4 ${colors.icons.muted}`}
                              />
                              <span className={`${colors.texts.primary}`}>
                                {vendor.businessType} • {vendor.companySize}{" "}
                                employees
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                            >
                              <MapPinIcon
                                className={`h-4 w-4 ${colors.icons.muted}`}
                              />
                              <span className={`${colors.texts.primary}`}>
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
                                    className={`text-xs ${colors.borders.secondary} rounded-none`}
                                  >
                                    {spec}
                                  </Badge>
                                ))}
                              {vendor.specialization.length > 2 && (
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${colors.borders.secondary} rounded-none`}
                                >
                                  +{vendor.specialization.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div
                              className={`text-center p-3 ${colors.backgrounds.accent} rounded-none`}
                            >
                              <p
                                className={`text-xl font-bold ${colors.texts.primary}`}
                              >
                                {vendor.totalOrders}
                              </p>
                              <p className={`text-xs ${colors.texts.muted}`}>
                                Total Orders
                              </p>
                            </div>
                            <div
                              className={`text-center p-3 ${colors.backgrounds.accent} rounded-none`}
                            >
                              <p
                                className={`text-xl font-bold ${colors.texts.success}`}
                              >
                                {formatCurrency(vendor.totalSpent)}
                              </p>
                              <p className={`text-xs ${colors.texts.muted}`}>
                                Total Spent
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className={`text-xs ${colors.texts.muted}`}>
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
                                className={`h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                              >
                                <EyeIcon
                                  className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                                />
                                Details
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card
                    className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
                  >
                    <CardContent className="p-0">
                      <div className="space-y-0">
                        {filteredAndSortedVendors.map((vendor, index) => (
                          <div
                            key={vendor.id}
                            className={`flex items-center gap-6 p-6 ${colors.backgrounds.hover} transition-colors ${
                              index !== filteredAndSortedVendors.length - 1
                                ? `${colors.borders.secondary}`
                                : ""
                            }`}
                          >
                            <Avatar
                              className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
                            >
                              <AvatarImage
                                src={vendor.avatar}
                                alt={vendor.name}
                              />
                              <AvatarFallback
                                className={`${colors.texts.primary} font-bold rounded-none`}
                              >
                                {getInitials(vendor.name)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                              <div className="md:col-span-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3
                                    className={`font-semibold ${colors.texts.primary}`}
                                  >
                                    {vendor.name}
                                  </h3>
                                  {getStatusIcon(vendor.status)}
                                </div>
                                <p className={`text-sm ${colors.texts.muted}`}>
                                  {vendor.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(vendor.status)}`}
                                    variant="secondary"
                                  >
                                    {vendor.status}
                                  </Badge>
                                  {vendor.rating && (
                                    <div className="flex items-center gap-1">
                                      <StarIcon
                                        className={`h-3 w-3 ${colors.texts.warning} fill-current`}
                                      />
                                      <span
                                        className={`text-xs ${colors.texts.secondary}`}
                                      >
                                        {vendor.rating}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p
                                  className={`text-sm font-medium ${colors.texts.primary}`}
                                >
                                  {vendor.businessType}
                                </p>
                                <p className={`text-xs ${colors.texts.muted}`}>
                                  {vendor.companySize} employees
                                </p>
                              </div>

                              <div>
                                <p
                                  className={`text-sm font-medium ${colors.texts.primary}`}
                                >
                                  {vendor.totalOrders}
                                </p>
                                <p className={`text-xs ${colors.texts.muted}`}>
                                  Orders
                                </p>
                              </div>

                              <div>
                                <p
                                  className={`text-sm font-bold ${colors.texts.success}`}
                                >
                                  {formatCurrency(vendor.totalSpent)}
                                </p>
                                <p className={`text-xs ${colors.texts.muted}`}>
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
                                  className={`h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                                >
                                  <EyeIcon
                                    className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                                  />
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
            <Card
              className={`text-center py-16 ${colors.cards.base} overflow-hidden rounded-none !shadow-none hover:!shadow-none`}
            >
              <CardContent>
                <div
                  className={`h-20 w-20 mx-auto mb-6 flex items-center justify-center ${colors.backgrounds.accent} backdrop-blur-sm rounded-none`}
                >
                  <UsersIcon className={`h-10 w-10 ${colors.texts.muted}`} />
                </div>
                <h3
                  className={`text-base font-semibold ${colors.texts.primary} mb-2`}
                >
                  {totalVendors === 0
                    ? "No Vendor Partners Yet"
                    : "No Vendors Found"}
                </h3>
                <p
                  className={`text-xs ${colors.texts.secondary} mb-6 max-w-md mx-auto`}
                >
                  {totalVendors === 0
                    ? "Start building your vendor network to expand your supply chain reach."
                    : "Try adjusting your search terms or filters to find vendor partners."}
                </p>
                {totalVendors !== 0 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedStatus("All Status");
                      setSelectedTab("all");
                    }}
                    className={`inline-flex items-center gap-2 cursor-pointer ${colors.buttons.outline} rounded-none`}
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
        <DialogContent
          style={{ width: "100%", maxWidth: "700px" }}
          className={`w-full max-w-[700px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-3 text-xl font-bold ${colors.texts.primary}`}
              >
                <div className="h-8 w-8 flex items-center justify-center">
                  <EyeIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                </div>
                Vendor Partner Details
              </DialogTitle>
              <DialogDescription
                className={`text-base ${colors.texts.secondary}`}
              >
                Complete information about your vendor partnership
              </DialogDescription>
            </DialogHeader>
            {selectedVendor && (
              <div className="space-y-6">
                {/* Vendor Header */}
                <div
                  className={`flex items-center gap-6 p-6 ${colors.backgrounds.secondary} rounded-none`}
                >
                  <Avatar
                    className={`h-20 w-20 ${colors.borders.secondary} rounded-none ${colors.backgrounds.tertiary}`}
                  >
                    <AvatarImage
                      src={selectedVendor.avatar}
                      alt={selectedVendor.name}
                    />
                    <AvatarFallback
                      className={`text-lg font-bold ${colors.texts.primary} rounded-none`}
                    >
                      {getInitials(selectedVendor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3
                        className={`text-xl font-bold ${colors.texts.primary}`}
                      >
                        {selectedVendor.name}
                      </h3>
                      <Badge
                        className={`flex items-center gap-1 text-sm px-3 py-1 rounded-none ${getStatusBadgeClass(selectedVendor.status)}`}
                        variant="secondary"
                      >
                        {selectedVendor.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div
                        className={`flex items-center gap-2 text-sm ${colors.texts.secondary}`}
                      >
                        <EnvelopeIcon
                          className={`h-4 w-4 ${colors.icons.secondary}`}
                        />
                        <span>{selectedVendor.email}</span>
                      </div>
                      {selectedVendor.phone && (
                        <div
                          className={`flex items-center gap-2 text-sm ${colors.texts.secondary}`}
                        >
                          <PhoneIcon
                            className={`h-4 w-4 ${colors.icons.secondary}`}
                          />
                          <span>{selectedVendor.phone}</span>
                        </div>
                      )}
                      <div
                        className={`flex items-center gap-2 text-sm ${colors.texts.secondary}`}
                      >
                        <MapPinIcon
                          className={`h-4 w-4 ${colors.icons.secondary}`}
                        />
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
                        <StarIcon
                          className={`h-5 w-5 ${colors.texts.warning} fill-current`}
                        />
                        <span
                          className={`text-base font-bold ${colors.texts.primary}`}
                        >
                          {selectedVendor.rating}
                        </span>
                      </div>
                    )}
                    <p className={`text-sm ${colors.texts.muted}`}>
                      Partner since {formatDate(selectedVendor.joinDate)}
                    </p>
                  </div>
                </div>

                {/* Business Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card
                    className={`border-0 shadow-none ${colors.backgrounds.secondary} rounded-none !shadow-none hover:!shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <BuildingOffice2Icon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Business Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Business Type
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedVendor.businessType}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Company Size
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedVendor.companySize} employees
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted} mb-2`}>
                          Specialization
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedVendor.specialization.map((spec, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`text-xs ${colors.borders.secondary} rounded-none`}
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`border-0 shadow-none ${colors.backgrounds.secondary} rounded-none !shadow-none hover:!shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <Activity
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Partnership Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div
                          className={`text-center p-3 ${colors.backgrounds.primary} rounded-none`}
                        >
                          <p
                            className={`text-xl font-bold ${colors.texts.primary}`}
                          >
                            {selectedVendor.totalOrders}
                          </p>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Total Orders
                          </p>
                        </div>
                        <div
                          className={`text-center p-3 ${colors.backgrounds.primary} rounded-none`}
                        >
                          <p
                            className={`text-xl font-bold ${colors.texts.success}`}
                          >
                            {formatCurrency(selectedVendor.totalSpent)}
                          </p>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Total Spent
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Average Order Value
                        </p>
                        <p
                          className={`text-base font-bold ${colors.texts.info}`}
                        >
                          {formatCurrency(selectedVendor.averageOrderValue)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Last Order
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatDate(selectedVendor.lastOrderDate)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <Card
                    className={`border-0 shadow-none ${colors.backgrounds.secondary} rounded-none !shadow-none hover:!shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <ShieldCheckIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Certifications & Contract
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className={`text-xs ${colors.texts.muted} mb-2`}>
                          Certifications
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedVendor.certifications.map((cert, index) => (
                            <Badge
                              key={index}
                              className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} border-0 rounded-none`}
                            >
                              <ShieldCheckIcon
                                className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                              />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {selectedVendor.contractExpiry && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Contract Expiry
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {formatDate(selectedVendor.contractExpiry)}
                          </p>
                        </div>
                      )}
                      {selectedVendor.walletAddress && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted} mb-1`}>
                            Blockchain Wallet
                          </p>
                          <div className="flex items-center gap-2">
                            <code
                              className={`text-xs ${colors.backgrounds.tertiary} px-2 py-1 rounded-none font-mono`}
                            >
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
                              className={`h-7 w-7 p-0 cursor-pointer ${colors.buttons.outline} rounded-none`}
                            >
                              <DocumentDuplicateIcon
                                className={`h-3 w-3 ${colors.icons.primary}`}
                              />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedVendor.notes && (
                    <Card
                      className={`border-0 shadow-none ${colors.backgrounds.secondary} rounded-none !shadow-none hover:!shadow-none`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle
                          className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                        >
                          <ChatBubbleLeftIcon
                            className={`h-5 w-5 ${colors.icons.primary}`}
                          />
                          Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm ${colors.texts.accent}`}>
                          {selectedVendor.notes}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3 px-6 pb-6 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className={`shadow-none hover:shadow-none transition-all duration-300 cursor-pointer ${colors.buttons.outline} rounded-none`}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsDetailsOpen(false);
                toast.success("Vendor contact initiated");
              }}
              className={`${colors.buttons.primary} shadow-none hover:shadow-none transition-all duration-300 cursor-pointer rounded-none`}
            >
              <ChatBubbleLeftIcon
                className={`h-4 w-4 mr-2 ${colors.texts.inverse}`}
              />
              Contact Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
