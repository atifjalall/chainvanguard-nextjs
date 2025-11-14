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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  XCircleIcon,
  TagIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import SupplierVendorsSkeleton from "@/components/skeletons/supplierVendorsSkeleton";
import { Activity } from "lucide-react";
import { colors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import * as vendorCustomerApi from "@/lib/api/supplier.vendor.api";

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

// Vendor interface based on backend response
interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalRequests: number;
    totalAmount: number;
    avgRequestValue: number;
    lastRequestDate?: string;
    pendingRequests: number;
    completedRequests: number;
  };
}

const statusOptions = ["All Status", "active", "inactive"];

const sortOptions = [
  { value: "totalAmount", label: "Highest Spender" },
  { value: "totalRequests", label: "Most Orders" },
  { value: "name", label: "Name: A to Z" },
  { value: "createdAt", label: "Most Recent" },
];

export default function SupplierVendorsPage() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("totalAmount");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTab, setSelectedTab] = useState("all");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [detailedVendor, setDetailedVendor] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setIsLoading(true);
    try {
      const response = await vendorCustomerApi.getVendorCustomers({
        status:
          selectedStatus === "All Status"
            ? "all"
            : (selectedStatus as "active" | "inactive"),
        sortBy,
        sortOrder,
      });

      if (response.success) {
        setVendors(response.vendors || response.customers || []);
      } else {
        toast.error("Failed to load vendors");
      }
    } catch (error: any) {
      console.error("Error loading vendors:", error);
      toast.error(error.message || "Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const loadVendorDetails = async (vendorId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await vendorCustomerApi.getVendorCustomerById(vendorId);

      if (response.success) {
        // Backend returns both 'vendor' and 'customer' keys with same data
        const vendorData = response.vendor || response.customer;
        const statsData = response.stats || response.statistics;

        setDetailedVendor({
          ...response,
          vendor: vendorData,
          stats: statsData,
        });
      }
    } catch (error: any) {
      console.error("Error loading vendor details:", error);
      toast.error("Failed to load vendor details");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircleIcon className="h-4 w-4" />
    ) : (
      <XCircleIcon className="h-4 w-4" />
    );
  };

  const getStatusBadgeClass = (isActive: boolean) => {
    return isActive
      ? "bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
      : "bg-red-100/10 dark:bg-red-900/10 border border-red-100 dark:border-red-900 text-red-700 dark:text-red-400";
  };

  const filteredAndSortedVendors = useMemo(() => {
    const filtered = vendors.filter((vendor) => {
      const matchesSearch =
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (vendor.companyName &&
          vendor.companyName.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        selectedStatus === "All Status" ||
        (selectedStatus === "active" && vendor.isActive) ||
        (selectedStatus === "inactive" && !vendor.isActive);

      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "active" && vendor.isActive) ||
        (selectedTab === "inactive" && !vendor.isActive);

      return matchesSearch && matchesStatus && matchesTab;
    });

    return filtered;
  }, [vendors, searchTerm, selectedStatus, selectedTab]);

  // Calculate statistics
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.isActive).length;
  const inactiveVendors = vendors.filter((v) => !v.isActive).length;
  const totalVolume = vendors.reduce((sum, v) => sum + v.stats.totalAmount, 0);
  const totalOrders = vendors.reduce(
    (sum, v) => sum + v.stats.totalRequests,
    0
  );
  const avgOrderValue = totalOrders > 0 ? totalVolume / totalOrders : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleViewDetails = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsDetailsOpen(true);
    await loadVendorDetails(vendor._id);
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
              },
              {
                title: "Active Partners",
                value: activeVendors.toString(),
                subtitle: "Currently active",
                icon: CheckCircleIcon,
              },
              {
                title: "Total Volume",
                value: formatCurrency(totalVolume),
                subtitle: "Partnership value",
                icon: RsIcon,
              },
              {
                title: "Avg. Order Value",
                value: formatCurrency(avgOrderValue),
                subtitle: "Per transaction",
                icon: TagIcon,
              },
              {
                title: "Total Orders",
                value: totalOrders.toString(),
                subtitle: "All requests",
                icon: ShoppingCartIcon,
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
                    placeholder="Search vendors by name, email or company"
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

        {/* Tabs */}
        <div
          className={`flex justify-center mt-6 transition-all duration-700 delay-350 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="w-full flex justify-center">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedVendors.map((vendor) => (
                    <Card
                      key={vendor._id}
                      className={`${colors.cards.base} hover:${colors.cards.hover} overflow-hidden group rounded-none !shadow-none hover:!shadow-none`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <Avatar
                            className={`h-12 w-12 ${colors.borders.primary} rounded-none ${colors.backgrounds.tertiary}`}
                          >
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
                              {getStatusIcon(vendor.isActive)}
                            </div>
                            <p
                              className={`text-sm ${colors.texts.muted} truncate`}
                            >
                              {vendor.email}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(vendor.isActive)}`}
                                variant="secondary"
                              >
                                {vendor.isActive ? "active" : "inactive"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          {vendor.companyName && (
                            <div
                              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                            >
                              <BuildingOffice2Icon
                                className={`h-4 w-4 ${colors.icons.muted}`}
                              />
                              <span className={`${colors.texts.primary}`}>
                                {vendor.companyName}
                              </span>
                            </div>
                          )}
                          {vendor.city && (
                            <div
                              className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                            >
                              <MapPinIcon
                                className={`h-4 w-4 ${colors.icons.muted}`}
                              />
                              <span className={`${colors.texts.primary}`}>
                                {vendor.city}
                                {vendor.state && `, ${vendor.state}`}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div
                            className={`text-center p-3 ${colors.backgrounds.accent} rounded-none`}
                          >
                            <p
                              className={`text-xl font-bold ${colors.texts.primary}`}
                            >
                              {vendor.stats.totalRequests}
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
                              {formatCurrency(vendor.stats.totalAmount)}
                            </p>
                            <p className={`text-xs ${colors.texts.muted}`}>
                              Total Spent
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className={`text-xs ${colors.texts.muted}`}>
                            {vendor.stats.lastRequestDate
                              ? `Last order: ${formatDate(vendor.stats.lastRequestDate)}`
                              : "No orders yet"}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(vendor)}
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
                        className={`flex items-center gap-1 text-sm px-3 py-1 rounded-none ${getStatusBadgeClass(selectedVendor.isActive)}`}
                        variant="secondary"
                      >
                        {selectedVendor.isActive ? "active" : "inactive"}
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
                      {selectedVendor.city && (
                        <div
                          className={`flex items-center gap-2 text-sm ${colors.texts.secondary}`}
                        >
                          <MapPinIcon
                            className={`h-4 w-4 ${colors.icons.secondary}`}
                          />
                          <span>
                            {selectedVendor.city}
                            {selectedVendor.state &&
                              `, ${selectedVendor.state}`}
                            {selectedVendor.country &&
                              `, ${selectedVendor.country}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${colors.texts.muted}`}>
                      Partner since{" "}
                      {(() => {
                        // Try multiple sources for the partner date
                        let partnerDate = null;

                        if (detailedVendor?.vendor?.memberSince) {
                          partnerDate = detailedVendor.vendor.memberSince;
                        } else if (detailedVendor?.customer?.memberSince) {
                          partnerDate = detailedVendor.customer.memberSince;
                        } else if (detailedVendor?.stats?.firstRequestDate) {
                          partnerDate = detailedVendor.stats.firstRequestDate;
                        } else if (
                          detailedVendor?.statistics?.firstRequestDate
                        ) {
                          partnerDate =
                            detailedVendor.statistics.firstRequestDate;
                        } else if (selectedVendor.createdAt) {
                          partnerDate = selectedVendor.createdAt;
                        }

                        if (
                          partnerDate &&
                          !isNaN(new Date(partnerDate).getTime())
                        ) {
                          return formatDate(partnerDate);
                        }
                        return "N/A";
                      })()}
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
                      {selectedVendor.companyName && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Company Name
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {selectedVendor.companyName}
                          </p>
                        </div>
                      )}
                      {selectedVendor.address && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Address
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {selectedVendor.address}
                          </p>
                        </div>
                      )}
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
                            {selectedVendor.stats.totalRequests}
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
                            {formatCurrency(selectedVendor.stats.totalAmount)}
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
                          {formatCurrency(selectedVendor.stats.avgRequestValue)}
                        </p>
                      </div>
                      {selectedVendor.stats.lastRequestDate && (
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Last Order
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {formatDate(selectedVendor.stats.lastRequestDate)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                {isLoadingDetails ? (
                  <div className="text-center py-8">
                    <p className={colors.texts.secondary}>
                      Loading detailed information...
                    </p>
                  </div>
                ) : (
                  detailedVendor &&
                  detailedVendor.recentRequests &&
                  detailedVendor.recentRequests.length > 0 && (
                    <Card
                      className={`border-0 shadow-none ${colors.backgrounds.secondary} rounded-none !shadow-none hover:!shadow-none`}
                    >
                      <CardHeader className="pb-3">
                        <CardTitle
                          className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                        >
                          <ClockIcon
                            className={`h-5 w-5 ${colors.icons.primary}`}
                          />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {detailedVendor.recentRequests
                            .slice(0, 5)
                            .map((request: any, idx: number) => {
                              // Backend returns 'date' and 'amount' fields
                              const requestDate =
                                request.date || request.createdAt;
                              const requestAmount =
                                request.amount || request.total || 0;

                              return (
                                <div
                                  key={idx}
                                  className={`flex justify-between items-center p-2 ${colors.backgrounds.primary} rounded-none`}
                                >
                                  <div>
                                    <p
                                      className={`text-sm font-medium ${colors.texts.primary}`}
                                    >
                                      {request.requestNumber || "N/A"}
                                    </p>
                                    <p
                                      className={`text-xs ${colors.texts.muted}`}
                                    >
                                      {requestDate &&
                                      !isNaN(new Date(requestDate).getTime())
                                        ? formatDate(requestDate)
                                        : "N/A"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p
                                      className={`text-sm font-bold ${colors.texts.success}`}
                                    >
                                      {formatCurrency(requestAmount)}
                                    </p>
                                    <Badge
                                      className="text-xs rounded-none"
                                      variant="outline"
                                    >
                                      {request.status || "unknown"}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
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
