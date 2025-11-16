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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UsersIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleOvalLeftIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  TrophyIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  Squares2X2Icon,
  Bars3Icon,
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { colors, badgeColors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

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
  status: "active" | "inactive" | "new";
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
    status: "active",
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
    status: "active",
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

const HEADER_GAP = "gap-3";

const formatCurrency = (amount: number) => {
  return `Rs ${amount.toLocaleString("en-PK")}`;
};

const statusOptions = ["All Status", "active", "inactive", "new"];

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
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState<"all" | "new" | "inactive">(
    "all"
  );
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
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In real app: const customers = await fetchVendorCustomers(user.id);
      setCustomers(mockCustomers);
    } catch (error) {
      // toast.error("Failed to load customers");
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
      case "active":
        return {
          color: badgeColors.green,
          icon: CheckCircleIcon,
          label: "Active",
        };
      case "new":
        return {
          color: badgeColors.blue,
          icon: UserPlusIcon,
          label: "New",
        };
      case "inactive":
        return {
          color: badgeColors.grey,
          icon: ClockIcon,
          label: "Inactive",
        };
      default:
        return {
          color: badgeColors.grey,
          icon: UsersIcon,
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
      // toast.error("Please enter a message");
      return;
    }

    // In real app: sendCustomerMessage(selectedCustomer.id, contactMessage);
    // toast.success(`Message sent to ${selectedCustomer.name}`);
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
      <Card
        className={`${colors.cards.base} hover:${colors.cards.hover} overflow-hidden group rounded-none !shadow-none hover:!shadow-none`}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar
              className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
            >
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback
                className={`${colors.texts.primary} font-bold rounded-none`}
              >
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={`font-semibold ${colors.texts.primary} truncate`}
                >
                  {customer.name}
                </h3>
                <StatusIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              </div>
              <div className="flex items-center gap-1 mt-1">
                <Badge
                  className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${statusConfig.color.bg} ${statusConfig.color.border} ${statusConfig.color.text}`}
                  variant="secondary"
                >
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div
              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
            >
              <EnvelopeIcon className={`h-4 w-4 ${colors.icons.muted}`} />
              <span className={`${colors.texts.primary}`}>
                {customer.email}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
            >
              <ShoppingBagIcon className={`h-4 w-4 ${colors.icons.muted}`} />
              <span className={`${colors.texts.primary}`}>
                {customer.totalOrders} orders
              </span>
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
            >
              <TrophyIcon className={`h-4 w-4 ${colors.icons.muted}`} />
              <span className={`${colors.texts.primary}`}>
                {customer.loyaltyPoints} points
              </span>
            </div>
          </div>
          <div className="mb-4">
            <div
              className={`text-center p-3 ${colors.backgrounds.accent} rounded-none`}
            >
              <p className={`text-xl font-bold ${colors.texts.success}`}>
                {formatCurrency(customer.totalSpent)}
              </p>
              <p className={`text-xs ${colors.texts.muted}`}>Total Spent</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className={`text-xs ${colors.texts.muted}`}>
              Last order: {daysSinceLastOrder}d ago
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(customer)}
              className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all`}
            >
              <EyeIcon className={`h-3 w-3 mr-1 ${colors.icons.primary}`} />
              View Details
            </Button>
            <Button
              size="sm"
              onClick={() => handleContactCustomer(customer)}
              className={`flex-1 h-8 px-3 ${colors.buttons.primary} cursor-pointer rounded-none transition-all`}
            >
              <EnvelopeIcon
                className={`h-3 w-3 mr-1 ${colors.texts.inverse}`}
              />
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
      <Card
        className={`${colors.cards.base} hover:${colors.cards.hover} overflow-hidden group rounded-none !shadow-none hover:!shadow-none`}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar
              className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
            >
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback
                className={`${colors.texts.primary} font-bold rounded-none`}
              >
                {getInitials(customer.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3
                  className={`font-semibold ${colors.texts.primary} truncate`}
                >
                  {customer.name}
                </h3>
                <div className="flex items-center gap-3">
                  <Badge
                    className={`flex items-center gap-1 ${statusConfig.color.bg} ${statusConfig.color.border} ${statusConfig.color.text}`}
                    variant="secondary"
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className={`${colors.texts.primary} truncate`}>
                    {customer.email}
                  </p>
                  <p className={`text-xs ${colors.texts.muted}`}>
                    {customer.location.city}, {customer.location.state}
                  </p>
                </div>
                <div>
                  <p className={`font-semibold ${colors.texts.primary}`}>
                    {customer.totalOrders} orders
                  </p>
                  <p className={`text-xs ${colors.texts.muted}`}>
                    Avg: {formatCurrency(customer.averageOrderValue)}
                  </p>
                </div>
                <div>
                  <p className={`font-semibold ${colors.texts.primary}`}>
                    {formatCurrency(customer.totalSpent)}
                  </p>
                  <p className={`text-xs ${colors.texts.muted}`}>
                    {customer.loyaltyPoints} points
                  </p>
                </div>
                <div>
                  <p className={`${colors.texts.primary}`}>
                    Last order: {daysSinceLastOrder}d ago
                  </p>
                  <p className={`text-xs ${colors.texts.muted}`}>
                    Joined: {formatDate(customer.joinDate)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 w-8 p-0 ${colors.buttons.outline} cursor-pointer rounded-none`}
                onClick={() => handleViewDetails(customer)}
              >
                <EyeIcon className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                className={`${colors.buttons.primary} cursor-pointer rounded-none`}
                onClick={() => handleContactCustomer(customer)}
              >
                <EnvelopeIcon className="h-3 w-3 mr-1" />
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalCustomers = customers.length;
  const newCustomers = customers.filter((c) => c.status === "new").length;
  const inactiveCustomers = customers.filter(
    (c) => c.status === "inactive"
  ).length;
  const averageSpend =
    customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length;

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Customers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Customers
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Manage customer relationships and track engagement
              </p>
              <div className={`flex items-center ${HEADER_GAP} mt-2`}>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <UsersIcon className={`h-3 w-3 ${badgeColors.green.icon}`} />
                  Customer Management
                </Badge>
                <Badge
                  className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <ShieldCheckIcon
                    className={`h-3 w-3 ${badgeColors.cyan.icon}`}
                  />
                  Blockchain Verified
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div
          className={`transform transition-all duration-700 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Customers",
                value: totalCustomers.toString(),
                icon: UsersIcon,
              },
              {
                title: "New Customers",
                value: newCustomers.toString(),
                icon: UserPlusIcon,
              },
              {
                title: "At Risk",
                value: inactiveCustomers.toString(),
                icon: ExclamationCircleIcon,
              },
              {
                title: "Avg. Spend",
                value: formatCurrency(averageSpend),
                icon: BanknotesIcon,
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
                    Customers
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div
          className={`transform transition-all duration-700 delay-300 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
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
                Filter and search through your customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search customers by name, email, or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  {filteredAndSortedCustomers.length} customers found
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2 items-center">
                  {/* Additional badges or content can go here if needed */}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${colors.texts.secondary} mr-2`}>
                    View:
                  </span>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-8 w-8 p-0 flex items-center justify-center transition-colors cursor-pointer ${
                      viewMode === "grid"
                        ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                        : "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 p-0 flex items-center justify-center transition-colors cursor-pointer ${
                      viewMode === "list"
                        ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                        : "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Bars3Icon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div
          className={`flex justify-center mt-6 transition-all duration-700 delay-350 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="w-full flex justify-center">
            <Tabs
              value={selectedTab}
              onValueChange={(value) =>
                setSelectedTab(value as "all" | "new" | "inactive")
              }
              className="w-full flex justify-center"
            >
              <TabsList
                className={`flex w-full max-w-2xl ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto`}
              >
                <TabsTrigger
                  value="all"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "all" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                >
                  <Squares2X2Icon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  All Customers
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "new" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                >
                  <UserPlusIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  New
                </TabsTrigger>
                <TabsTrigger
                  value="inactive"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "inactive" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                >
                  <ClockIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Inactive
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Customers List */}
        <div
          className={`transform transition-all duration-700 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          {filteredAndSortedCustomers.length > 0 ? (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
            <div className="text-center py-12">
              <UsersIcon
                className={`h-16 w-16 mx-auto ${colors.icons.muted} mb-4`}
              />
              <h3
                className={`text-lg font-medium ${colors.texts.primary} mb-2`}
              >
                No customers found
              </h3>
              <p className={`text-sm ${colors.texts.secondary}`}>
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          className={`w-full max-w-[600px] ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Customer Details
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Detailed information about the customer
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <UsersIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      Customer Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>Name</p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedCustomer.name}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>Email</p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedCustomer.email}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Location
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedCustomer.location.city},{" "}
                        {selectedCustomer.location.state},{" "}
                        {selectedCustomer.location.country}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <TrophyIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Total Orders
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedCustomer.totalOrders}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Total Spent
                      </p>
                      <p
                        className={`font-bold ${colors.texts.success} text-sm`}
                      >
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Loyalty Points
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedCustomer.loyaltyPoints}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {selectedCustomer.notes && (
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <ChatBubbleOvalLeftIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm ${colors.texts.accent}`}>
                      {selectedCustomer.notes}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className={`${colors.buttons.outline} rounded-none`}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsDetailsOpen(false);
                if (selectedCustomer) handleContactCustomer(selectedCustomer);
              }}
              className={`${colors.buttons.primary} rounded-none`}
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Contact Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Customer Dialog */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent
          className={`w-full max-w-[500px] ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Contact Customer
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Send a message to {selectedCustomer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label
                htmlFor="message"
                className={`text-sm font-medium ${colors.texts.primary}`}
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsContactOpen(false)}
              className={`${colors.buttons.outline} rounded-none`}
            >
              Cancel
            </Button>
            <Button
              onClick={sendMessage}
              className={`${colors.buttons.primary} rounded-none`}
            >
              <ChatBubbleOvalLeftIcon className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
