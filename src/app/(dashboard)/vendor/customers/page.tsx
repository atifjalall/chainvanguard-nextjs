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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UsersIcon,
  ShoppingBagIcon,
  BanknotesIcon,
  EnvelopeIcon,
  EyeIcon,
  FunnelIcon,
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
import { usePageTitle } from "@/hooks/use-page-title";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import {
  getVendorCustomers,
  getCustomerStatsSummary,
  getCustomerDetails,
  getCustomerOrders,
  getNewCustomersThisMonth,
  getAtRiskCustomers,
} from "@/lib/api/vendor.customer.api";
import type { VendorCustomer, CustomerDetailResponse, Order } from "@/types";
import { Loader2 } from "lucide-react";
import { FadeUp } from "@/components/animations/fade-up";

const HEADER_GAP = "gap-3";

type TabType = "all" | "new" | "at-risk";

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "CVT 0.00";
  }
  return `CVT ${amount.toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const statusOptions = ["All Status", "active", "new", "at-risk"];

const sortOptions = [
  { value: "name-asc", label: "Name: A to Z" },
  { value: "name-desc", label: "Name: Z to A" },
  { value: "spent-desc", label: "Highest Spender" },
  { value: "spent-asc", label: "Lowest Spender" },
  { value: "orders-desc", label: "Most Orders" },
  { value: "orders-asc", label: "Least Orders" },
  { value: "recent", label: "Most Recent Order" },
  { value: "oldest", label: "Oldest Member" },
];

export default function VendorCustomersPage() {
  usePageTitle("Customers");

  // State
  const [customers, setCustomers] = useState<VendorCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState<"all" | "new" | "at-risk">(
    "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetailResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Stats
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [atRiskCustomers, setAtRiskCustomers] = useState(0);
  const [averageSpend, setAverageSpend] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(20);

  // Loading state for orders
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadInitialData();
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [currentPage, selectedTab, sortBy]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadCustomerStats(), loadCustomers()]);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      toast.error("Failed to load customer data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerStats = async () => {
    try {
      const stats = await getCustomerStatsSummary();
      setTotalCustomers(stats.totalCustomers);
      setAverageSpend(stats.avgCustomerValue);

      // Load new and at-risk customers
      const [newCust, atRisk] = await Promise.all([
        getNewCustomersThisMonth(),
        getAtRiskCustomers(),
      ]);
      setNewCustomers(newCust.length);
      setAtRiskCustomers(atRisk.length);
    } catch (error) {
      console.error("Failed to load customer stats:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      setIsLoading(true);

      let response;
      if (selectedTab === "new") {
        const newCust = await getNewCustomersThisMonth();
        setCustomers(newCust);
        setTotalPages(1);
      } else if (selectedTab === "at-risk") {
        const atRisk = await getAtRiskCustomers();
        setCustomers(atRisk);
        setTotalPages(1);
      } else {
        response = await getVendorCustomers({
          page: currentPage,
          limit,
          search: searchTerm,
          sortBy: sortBy.includes("spent")
            ? "totalSpent"
            : sortBy.includes("orders")
              ? "totalOrders"
              : sortBy.includes("name")
                ? "name"
                : undefined,
          sortOrder: sortBy.includes("desc") ? "desc" : "asc",
        });
        setCustomers(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast.error("Failed to load customers");
      setCustomers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (customer: VendorCustomer) => {
    try {
      setIsLoadingOrders(true);
      const details = await getCustomerDetails(customer.id);
      setSelectedCustomer(details);
      setIsDetailsOpen(true);
    } catch (error) {
      console.error("Failed to load customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleContactCustomer = (customer: VendorCustomer) => {
    setSelectedCustomer({
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: {
          street: customer.address,
          city: customer.city,
          state: customer.state,
          country: customer.country,
          postalCode: customer.postalCode,
        },
        memberSince: customer.memberSince,
        loyaltyPoints: customer.loyaltyPoints,
      },
      statistics: {
        totalOrders: customer.stats.totalOrders,
        totalSpent: customer.stats.totalSpent,
        avgOrderValue: customer.stats.avgOrderValue,
        lastOrderDate: customer.stats.lastOrderDate ?? undefined,
        ordersByStatus: {},
      },
      recentOrders: [],
      success: true,
    });
  };

  const handleRefresh = () => {
    loadInitialData();
    toast.success("Customer data refreshed");
  };

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = [...customers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.city?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (selectedStatus !== "All Status") {
      if (selectedStatus === "active") {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        filtered = filtered.filter((c) => {
          if (!c.stats.lastOrderDate) return false;
          return new Date(c.stats.lastOrderDate) >= sixtyDaysAgo;
        });
      } else if (selectedStatus === "new") {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filtered = filtered.filter(
          (c) => new Date(c.memberSince) >= oneMonthAgo
        );
      } else if (selectedStatus === "at-risk") {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        filtered = filtered.filter((c) => {
          if (!c.stats.lastOrderDate) return false;
          return new Date(c.stats.lastOrderDate) < sixtyDaysAgo;
        });
      }
    }

    // Sort customers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "spent-desc":
          return b.stats.totalSpent - a.stats.totalSpent;
        case "spent-asc":
          return a.stats.totalSpent - b.stats.totalSpent;
        case "orders-desc":
          return b.stats.totalOrders - a.stats.totalOrders;
        case "orders-asc":
          return a.stats.totalOrders - b.stats.totalOrders;
        case "recent":
          if (!a.stats.lastOrderDate) return 1;
          if (!b.stats.lastOrderDate) return -1;
          return (
            new Date(b.stats.lastOrderDate).getTime() -
            new Date(a.stats.lastOrderDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.memberSince).getTime() -
            new Date(b.memberSince).getTime()
          );
        default:
          return 0;
      }
    });

    return filtered;
  }, [customers, searchTerm, selectedStatus, sortBy]);

  const getCustomerStatus = (
    customer: VendorCustomer
  ): "active" | "new" | "at-risk" => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    if (new Date(customer.memberSince) >= oneMonthAgo) {
      return "new";
    }

    if (
      customer.stats.lastOrderDate &&
      new Date(customer.stats.lastOrderDate) < sixtyDaysAgo
    ) {
      return "at-risk";
    }

    return "active";
  };

  const getStatusConfig = (status: "active" | "new" | "at-risk") => {
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
      case "at-risk":
        return {
          color: badgeColors.red,
          icon: ExclamationCircleIcon,
          label: "At Risk",
        };
      default:
        return {
          color: badgeColors.grey,
          icon: UsersIcon,
          label: "Unknown",
        };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
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

  const getDaysSinceLastOrder = (lastOrderDate: string | null) => {
    if (!lastOrderDate) return Infinity;
    return Math.floor(
      (new Date().getTime() - new Date(lastOrderDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
  };

  const CustomerCard = ({ customer }: { customer: VendorCustomer }) => {
    const status = getCustomerStatus(customer);
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;
    const daysSinceLastOrder = getDaysSinceLastOrder(
      customer.stats.lastOrderDate
    );

    return (
      <Card
        className={`${colors.cards.base} hover:${colors.cards.hover} overflow-hidden group rounded-none !shadow-none hover:!shadow-none transition-all duration-300`}
      >
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Avatar
              className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
            >
              <AvatarImage src="" alt={customer.name} />
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
              <span className={`${colors.texts.primary} truncate`}>
                {customer.email}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
            >
              <ShoppingBagIcon className={`h-4 w-4 ${colors.icons.muted}`} />
              <span className={`${colors.texts.primary}`}>
                {customer.stats.totalOrders} orders
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
                {formatCurrency(customer.stats.totalSpent)}
              </p>
              <p className={`text-xs ${colors.texts.muted}`}>Total Spent</p>
            </div>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className={`text-xs ${colors.texts.muted}`}>
              Last order:{" "}
              {daysSinceLastOrder === Infinity
                ? "Never"
                : `${daysSinceLastOrder}d ago`}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewDetails(customer)}
              className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:border-black dark:hover:border-white`}
            >
              <EyeIcon className={`h-3 w-3 mr-1 ${colors.icons.primary}`} />
              View Details
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const mailtoLink = `mailto:${customer.email}?subject=${encodeURIComponent("Message from ChainVanguard Vendor")}`;
                window.location.href = mailtoLink;
              }}
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

  const CustomerListItem = ({ customer }: { customer: VendorCustomer }) => {
    const status = getCustomerStatus(customer);
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;
    const daysSinceLastOrder = getDaysSinceLastOrder(
      customer.stats.lastOrderDate
    );

    return (
      <Card
        className={`${colors.cards.base} hover:${colors.cards.hover} overflow-hidden group rounded-none !shadow-none hover:!shadow-none transition-all duration-300`}
      >
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar
              className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
            >
              <AvatarImage src="" alt={customer.name} />
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
                    className={`flex items-center gap-1 rounded-none ${statusConfig.color.bg} ${statusConfig.color.border} ${statusConfig.color.text}`}
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
                    {customer.city}, {customer.state}
                  </p>
                </div>
                <div>
                  <p className={`font-semibold ${colors.texts.primary}`}>
                    {customer.stats.totalOrders} orders
                  </p>
                  <p className={`text-xs ${colors.texts.muted}`}>
                    Avg: {formatCurrency(customer.stats.avgOrderValue)}
                  </p>
                </div>
                <div>
                  <p className={`font-semibold ${colors.texts.primary}`}>
                    {formatCurrency(customer.stats.totalSpent)}
                  </p>
                  <p className={`text-xs ${colors.texts.muted}`}>
                    {customer.loyaltyPoints} points
                  </p>
                </div>
                <div>
                  <p className={`${colors.texts.primary}`}>
                    Last order:{" "}
                    {daysSinceLastOrder === Infinity
                      ? "Never"
                      : `${daysSinceLastOrder}d ago`}
                  </p>
                  <p className={`text-xs ${colors.texts.muted}`}>
                    Joined: {formatDate(customer.memberSince)}
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
                onClick={() => {
                  const mailtoLink = `mailto:${customer.email}?subject=${encodeURIComponent("Message from ChainVanguard Vendor")}`;
                  window.location.href = mailtoLink;
                }}
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

  if (isLoading && customers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading customers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.backgrounds.secondary}`}>
      <div className="relative z-10 p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/vendor">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Customers</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <FadeUp delay={0}>
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
            <Button
              onClick={handleRefresh}
              variant="outline"
              className={`${colors.buttons.outline} rounded-none`}
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </FadeUp>

        {/* Statistics Cards */}
        <FadeUp delay={0.1}>
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
                value: atRiskCustomers.toString(),
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
                    {stat.title === "Avg. Spend" ? "Per Customer" : "Customers"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeUp>

        {/* Filters and Search */}
        <FadeUp delay={0.2}>
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
                    className={`text-sm h-9 w-full min-w-[240px] ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200`}
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
                    className={`text-sm h-9 w-full min-w-[240px] ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200`}
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
                <div className="flex gap-2 items-center"></div>
                <div className="flex items-center gap-1">
                  <span className={`text-xs ${colors.texts.secondary} mr-2`}>
                    View:
                  </span>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`h-8 w-8 p-0 flex items-center justify-center transition-colors cursor-pointer rounded-none ${
                      viewMode === "grid"
                        ? "bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                        : "text-gray-700 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 p-0 flex items-center justify-center transition-colors cursor-pointer rounded-none ${
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
        </FadeUp>

        {/* Tabs */}
        <FadeUp delay={0.3}>
          <div className="flex justify-center mt-6">
            <Tabs
              value={selectedTab}
              onValueChange={(v) => setSelectedTab(v as TabType)}
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
                  value="at-risk"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "at-risk" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                >
                  <ClockIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  At Risk
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </FadeUp>

        {/* Customers List */}
        <FadeUp delay={0.4}>
          <div>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Loading customers...
                </p>
              </div>
            ) : filteredAndSortedCustomers.length > 0 ? (
              <>
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`${colors.buttons.outline} rounded-none`}
                    >
                      Previous
                    </Button>
                    <span className={`text-sm ${colors.texts.secondary}`}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className={`${colors.buttons.outline} rounded-none`}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
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
        </FadeUp>
      </div>

      {/* Customer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Customer Details
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Detailed information about the customer and order history
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                        {selectedCustomer.customer.name}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>Email</p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm break-all`}
                      >
                        {selectedCustomer.customer.email}
                      </p>
                    </div>
                    {selectedCustomer.customer.phone && (
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Phone</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedCustomer.customer.phone}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Location
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedCustomer.customer.address.city},{" "}
                        {selectedCustomer.customer.address.state},{" "}
                        {selectedCustomer.customer.address.country}
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
                        {selectedCustomer.statistics.totalOrders}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Total Spent
                      </p>
                      <p
                        className={`font-bold ${colors.texts.success} text-sm`}
                      >
                        {formatCurrency(selectedCustomer.statistics.totalSpent)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Avg Order Value
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {formatCurrency(
                          selectedCustomer.statistics.avgOrderValue
                        )}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Loyalty Points
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedCustomer.customer.loyaltyPoints}
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
                      <ShieldCheckIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Member Since
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {formatDate(selectedCustomer.customer.memberSince)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        First Order
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {formatDate(
                          selectedCustomer.statistics.firstOrderDate || null
                        )}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Last Order
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {formatDate(
                          selectedCustomer.statistics.lastOrderDate || null
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Orders */}
              {isLoadingOrders ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                </div>
              ) : selectedCustomer?.recentOrders &&
                selectedCustomer.recentOrders.length > 0 ? (
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <ShoppingBagIcon
                        className={`h-5 w-5 ${colors.icons.primary}`}
                      />
                      Recent Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedCustomer.recentOrders
                        .slice(0, 5)
                        .map((order) => (
                          <div
                            key={order.id}
                            className="flex justify-between items-start gap-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-0"
                          >
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${colors.texts.primary}`}
                              >
                                {order.orderNumber}
                              </p>
                              <p
                                className={`text-xs ${colors.texts.muted} mt-0.5`}
                              >
                                {formatDate(order.date)}
                              </p>
                              {order.blockchainTxId && (
                                <div className="mt-1">
                                  <p
                                    className={`text-xs ${colors.texts.muted} flex items-center gap-1`}
                                  >
                                    <ShieldCheckIcon className="h-3 w-3" />
                                    <span
                                      className="font-mono text-xs truncate max-w-[200px]"
                                      title={order.blockchainTxId}
                                    >
                                      {order.blockchainTxId}
                                    </span>
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p
                                className={`text-sm font-semibold ${colors.texts.success}`}
                              >
                                {formatCurrency(order.amount)}
                              </p>
                              <Badge
                                variant="secondary"
                                className={`text-xs rounded-none mt-1 ${
                                  order.status === "delivered"
                                    ? badgeColors.green.bg +
                                      " " +
                                      badgeColors.green.text
                                    : order.status === "refunded"
                                      ? badgeColors.red.bg +
                                        " " +
                                        badgeColors.red.text
                                      : badgeColors.blue.bg +
                                        " " +
                                        badgeColors.blue.text
                                }`}
                              >
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className={`${colors.buttons.outline} rounded-none transition-all hover:border-black dark:hover:border-white cursor-pointer`}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsDetailsOpen(false);
                if (selectedCustomer) {
                  const mailtoLink = `mailto:${selectedCustomer.customer.email}?subject=${encodeURIComponent("Message from ChainVanguard Vendor")}`;
                  window.location.href = mailtoLink;
                  toast.success(
                    `Opening email client to contact ${selectedCustomer.customer.name}`
                  );
                }
              }}
              className={`${colors.buttons.primary} rounded-none cursor-pointer`}
            >
              <EnvelopeIcon className="h-4 w-4 mr-2" />
              Contact Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
