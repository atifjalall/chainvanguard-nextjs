/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as vendorRequestApi from "@/lib/api/vendor.request.api";
import type { VendorRequest, VendorRequestStats } from "@/types";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
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
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CubeIcon,
  TruckIcon,
  ShoppingBagIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  InboxIcon,
  ArrowTopRightOnSquareIcon,
  InboxStackIcon,
  InboxArrowDownIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { colors, badgeColors } from "@/lib/colorConstants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const HEADER_GAP = "gap-3";

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

export default function VendorRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allRequests, setAllRequests] = useState<VendorRequest[]>([]);
  const [stats, setStats] = useState<VendorRequestStats | null>(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [supplierNotes, setSupplierNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Initial data fetch
  useEffect(() => {
    setIsVisible(true);
    fetchAllData();
  }, []);

  // New effect to update searchTerm from URL params
  useEffect(() => {
    const searchParam = searchParams ? searchParams.get("search") : null;
    if (searchParam) {
      console.log("📝 Setting search from URL param:", searchParam);
      setSearchTerm(searchParam);
    } else {
      setSearchTerm(""); // Clear if no param
    }
  }, [searchParams]);

  // New effect to update URL on searchTerm change
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (searchTerm.trim()) {
        params.set("search", searchTerm.trim());
      } else {
        params.delete("search");
      }
      router.replace(`${window.location.pathname}?${params.toString()}`);
    }
  }, [searchTerm, router]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchRequests(),
        fetchStats(),
        fetchSupplierSettings(),
      ]);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await vendorRequestApi.getSupplierRequests({
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      setAllRequests(response.requests || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch requests");
      console.error("Failed to fetch requests:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await vendorRequestApi.getRequestStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchSupplierSettings = async () => {
    try {
      const response = await vendorRequestApi.getSupplierSettings();
      setAutoApprove(response.settings.autoApproveRequests || false);
    } catch (error) {
      console.error("Failed to fetch supplier settings:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setActionLoading(true);
      await vendorRequestApi.approveRequest(selectedRequest._id, {
        supplierNotes: supplierNotes,
      });

      toast.success("Request approved successfully");
      setIsApproveDialogOpen(false);
      setSupplierNotes("");

      // Refresh data without page reload
      await fetchRequests();
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(true);
      await vendorRequestApi.rejectRequest(selectedRequest._id, {
        rejectionReason: rejectionReason,
      });

      toast.success("Request rejected");
      setIsRejectDialogOpen(false);
      setRejectionReason("");

      // Refresh data without page reload
      await fetchRequests();
      await fetchStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (request: VendorRequest) => {
    try {
      setActionLoading(true);
      await vendorRequestApi.completeRequest(request._id, {
        notes: "Request completed and ready for transaction",
      });

      toast.success("Request marked as completed and moved to transactions");

      // Refresh data without page reload
      await fetchRequests();
      await fetchStats();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to complete request"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoApproveToggle = async (checked: boolean) => {
    try {
      await vendorRequestApi.toggleAutoApprove();
      setAutoApprove(checked);
      toast.success(checked ? "Auto-approve enabled" : "Auto-approve disabled");
    } catch (error: any) {
      toast.error("Failed to update auto-approve setting");
      setAutoApprove(!checked); // Revert on error
    }
  };

  // Navigate to inventory detail page
  const handleViewInventoryItem = (inventoryId: string) => {
    router.push(`/supplier/inventory/${inventoryId}`);
    setIsDetailsOpen(false); // Close the modal
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "pending":
        return <InboxIcon className="h-4 w-4" />;
      case "rejected":
      case "cancelled":
        return <XCircleIcon className="h-4 w-4" />;
      case "completed":
        return <TruckIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (request: VendorRequest) => {
    // New = pending status, no approval yet
    if (request.status === "pending") {
      return "bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400";
    }
    // Pending = approved but no payment
    if (request.status === "approved" && !request.orderId) {
      return "bg-yellow-100/10 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400";
    }
    // Confirmed = has orderId
    if (
      request.status === "approved" &&
      request.orderId &&
      !request.isCompleted
    ) {
      return "bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400";
    }
    // Cancelled/Rejected
    if (request.status === "cancelled" || request.status === "rejected") {
      return "bg-red-100/10 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400";
    }
    return "bg-gray-100/10 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-900 text-gray-700 dark:text-gray-300";
  };

  const getDisplayStatus = (request: VendorRequest) => {
    if (request.status === "pending") return "new";
    if (request.status === "approved" && !request.orderId) return "pending";
    if (
      request.status === "approved" &&
      request.orderId &&
      !request.isCompleted
    )
      return "confirmed";
    if (request.status === "cancelled") return "cancelled";
    if (request.status === "rejected") return "rejected";
    return request.status;
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case "high":
        return `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text}`;
      case "medium":
        return `${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text}`;
      case "low":
        return `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text}`;
      default:
        return `${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text}`;
    }
  };

  const getVendorName = (request: VendorRequest) => {
    if (typeof request.vendorId === "string") return "Vendor";
    return (
      request.vendorId.name || request.vendorId.companyName || "Unknown Vendor"
    );
  };

  const getVendorEmail = (request: VendorRequest) => {
    if (typeof request.vendorId === "string") return "";
    return request.vendorId.email || "";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusOptions = [
    "All Status",
    "New",
    "Pending",
    "Confirmed",
    "Cancelled",
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest" },
    { value: "name-asc", label: "Vendor Name: A to Z" },
    { value: "name-desc", label: "Vendor Name: Z to A" },
    { value: "value-desc", label: "Highest Value" },
    { value: "value-asc", label: "Lowest Value" },
  ];

  // Filter requests based on selected tab
  const filteredByTab = useMemo(() => {
    if (selectedTab === "all") return allRequests;
    if (selectedTab === "new")
      return allRequests.filter((r) => r.status === "pending");
    if (selectedTab === "pending")
      return allRequests.filter((r) => r.status === "approved" && !r.orderId);
    if (selectedTab === "confirmed")
      return allRequests.filter(
        (r) => r.status === "approved" && r.orderId && !r.isCompleted
      );
    if (selectedTab === "cancelled")
      return allRequests.filter(
        (r) => r.status === "cancelled" || r.status === "rejected"
      );
    return allRequests;
  }, [allRequests, selectedTab]);

  // Apply search and filters
  const filteredAndSortedRequests = useMemo(() => {
    const filtered = filteredByTab.filter((request) => {
      const vendorName = getVendorName(request).toLowerCase();
      const requestNumber = request.requestNumber.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        vendorName.includes(searchLower) || requestNumber.includes(searchLower);

      const displayStatus = getDisplayStatus(request);
      const matchesStatus =
        selectedStatus === "All Status" ||
        displayStatus === selectedStatus.toLowerCase().replace(" ", "_");

      return matchesSearch && matchesStatus;
    });

    // Sort requests
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "name-asc":
          return getVendorName(a).localeCompare(getVendorName(b));
        case "name-desc":
          return getVendorName(b).localeCompare(getVendorName(a));
        case "value-desc":
          return b.total - a.total;
        case "value-asc":
          return a.total - b.total;
        default:
          return 0;
      }
    });

    return filtered;
  }, [filteredByTab, searchTerm, selectedStatus, sortBy]);

  // Calculate statistics from all requests
  const totalRequests = allRequests.length;
  const newRequests = allRequests.filter((r) => r.status === "pending").length;
  const pendingRequests = allRequests.filter(
    (r) => r.status === "approved" && !r.orderId
  ).length;
  const confirmedRequests = allRequests.filter(
    (r) => r.status === "approved" && r.orderId && !r.isCompleted
  ).length;
  const cancelledRequests = allRequests.filter(
    (r) => r.status === "cancelled" || r.status === "rejected"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
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
              <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Vendor Requests</BreadcrumbPage>
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
                Vendor Requests
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                Manage incoming requests from your vendor partners
              </p>
              <div className={`flex items-center ${HEADER_GAP} mt-2`}>
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
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Requests",
                value: totalRequests.toString(),
                subtitle: "All requests",
                icon: InboxStackIcon,
              },
              {
                title: "New Requests",
                value: newRequests.toString(),
                subtitle: "Recently submitted",
                icon: InboxArrowDownIcon,
              },
              {
                title: "Pending",
                value: pendingRequests.toString(),
                subtitle: "Awaiting payment",
                icon: ClockIcon,
              },
              {
                title: "Confirmed",
                value: confirmedRequests.toString(),
                subtitle: "Payment confirmed",
                icon: CheckCircleIcon,
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
                Filter and search through your vendor requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6 mb-4">
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                  />
                  <Input
                    placeholder="Search requests by vendor or request number"
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
                  {filteredAndSortedRequests.length} requests found
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs - Removed numbers */}
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
                      ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                      : `${colors.texts.secondary} hover:${colors.texts.primary}`
                  } flex items-center gap-2 justify-center`}
                >
                  <Squares2X2Icon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  All Requests
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "new"
                      ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                      : `${colors.texts.secondary} hover:${colors.texts.primary}`
                  } flex items-center gap-2 justify-center`}
                >
                  <InboxArrowDownIcon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  New
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "pending"
                      ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                      : `${colors.texts.secondary} hover:${colors.texts.primary}`
                  } flex items-center gap-2 justify-center`}
                >
                  <ClockIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Pending
                </TabsTrigger>
                <TabsTrigger
                  value="confirmed"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "confirmed"
                      ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                      : `${colors.texts.secondary} hover:${colors.texts.primary}`
                  } flex items-center gap-2 justify-center`}
                >
                  <CheckCircleIcon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  Confirmed
                </TabsTrigger>
                <TabsTrigger
                  value="cancelled"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none
                  ${
                    selectedTab === "cancelled"
                      ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                      : `${colors.texts.secondary} hover:${colors.texts.primary}`
                  } flex items-center gap-2 justify-center`}
                >
                  <XCircleIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Cancelled
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Auto Approve Toggle */}
        <div
          className={`transform transition-all duration-700 delay-400 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card
            className={`${colors.cards.base} rounded-none !shadow-none hover:!shadow-none`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    className={`text-base font-medium ${colors.texts.primary}`}
                  >
                    Auto Approve Requests
                  </Label>
                  <p className={`text-sm ${colors.texts.secondary}`}>
                    Automatically approve requests below a certain threshold
                  </p>
                </div>
                <Switch
                  checked={autoApprove}
                  onCheckedChange={handleAutoApproveToggle}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Cards */}
        <div
          className={`transform transition-all duration-700 delay-500 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRequests.map((request) => (
              <Card
                key={request._id}
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
                        {getVendorName(request).substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold ${colors.texts.primary} truncate`}
                        >
                          {getVendorName(request)}
                        </h3>
                        {getStatusIcon(getDisplayStatus(request))}
                      </div>
                      <p className={`text-sm ${colors.texts.muted} truncate`}>
                        {getVendorEmail(request)}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(request)}`}
                          variant="secondary"
                        >
                          {getDisplayStatus(request).replace("_", " ")}
                        </Badge>
                        {request.urgency && (
                          <Badge
                            className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getUrgencyBadgeClass(request.urgency)}`}
                            variant="secondary"
                          >
                            {request.urgency} priority
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div
                      className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                    >
                      <CubeIcon className={`h-4 w-4 ${colors.icons.muted}`} />
                      <span className={`${colors.texts.primary}`}>
                        Items: {request.items.length}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                    >
                      <ShoppingBagIcon
                        className={`h-4 w-4 ${colors.icons.muted}`}
                      />
                      <span className={`${colors.texts.primary}`}>
                        Request #{request.requestNumber}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div
                      className={`text-center p-3 ${colors.backgrounds.accent} rounded-none`}
                    >
                      <p
                        className={`text-xl font-bold ${colors.texts.success}`}
                      >
                        {formatCurrency(request.total)}
                      </p>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Total Value
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Requested: {formatDate(request.createdAt)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsApproveDialogOpen(true);
                          }}
                          disabled={actionLoading}
                          className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all`}
                        >
                          <CheckCircleIcon
                            className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                          />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setIsRejectDialogOpen(true);
                          }}
                          disabled={actionLoading}
                          className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all`}
                        >
                          <XCircleIcon
                            className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                          />
                          Reject
                        </Button>
                      </>
                    )}

                    {request.status === "approved" &&
                      request.orderId &&
                      !request.isCompleted && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(request)}
                          disabled={actionLoading}
                          className={`${colors.buttons.primary} text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all`}
                        >
                          <CheckCircleIcon
                            className={`h-3 w-3 mr-1 text-white dark:text-gray-900`}
                          />
                          Mark Complete
                        </Button>
                      )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDetailsOpen(true);
                      }}
                      className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all`}
                    >
                      <EyeIcon
                        className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                      />
                      {request.status === "approved" &&
                      request.orderId &&
                      !request.isCompleted
                        ? "Manage"
                        : "View"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAndSortedRequests.length === 0 && (
            <div className="text-center py-12">
              <InboxIcon
                className={`h-16 w-16 mx-auto ${colors.icons.muted} mb-4`}
              />
              <h3
                className={`text-lg font-medium ${colors.texts.primary} mb-2`}
              >
                No requests found
              </h3>
              <p className={`text-sm ${colors.texts.secondary}`}>
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent
          className={`${colors.backgrounds.modal} rounded-none max-w-md`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Approve Request
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Add notes for the vendor (optional)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className={`${colors.texts.primary}`}>
                Supplier Notes
              </Label>
              <Textarea
                value={supplierNotes}
                onChange={(e) => setSupplierNotes(e.target.value)}
                placeholder="Enter any notes for the vendor..."
                className={`${colors.inputs.base} rounded-none mt-2`}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsApproveDialogOpen(false);
                setSupplierNotes("");
              }}
              className={`${colors.buttons.outline} rounded-none`}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className={`${colors.buttons.primary} rounded-none`}
            >
              {actionLoading ? "Approving..." : "Approve Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent
          className={`${colors.backgrounds.modal} rounded-none max-w-md`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Reject Request
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Please provide a reason for rejection (required)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className={`${colors.texts.primary}`}>
                Rejection Reason *
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you're rejecting this request..."
                className={`${colors.inputs.base} rounded-none mt-2`}
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRejectDialogOpen(false);
                setRejectionReason("");
              }}
              className={`${colors.buttons.outline} rounded-none`}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              className="rounded-none"
            >
              {actionLoading ? "Rejecting..." : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Details Dialog with Clickable Items */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-3 text-xl font-bold ${colors.texts.primary}`}
              >
                <EyeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Request Details
              </DialogTitle>
              <DialogDescription
                className={`text-base ${colors.texts.secondary}`}
              >
                Detailed information about the vendor request
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <CubeIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Request Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Request Number
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.requestNumber}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Total Items
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.items.length}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Subtotal
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatCurrency(selectedRequest.subtotal)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Tax</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatCurrency(selectedRequest.tax)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Total Price
                        </p>
                        <p
                          className={`font-bold ${colors.texts.success} text-sm`}
                        >
                          {formatCurrency(selectedRequest.total)}
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
                        <UsersIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Vendor Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Vendor Name
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {getVendorName(selectedRequest)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Email</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {getVendorEmail(selectedRequest)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Status
                        </p>
                        <Badge
                          className={`text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(selectedRequest)}`}
                          variant="secondary"
                        >
                          {getDisplayStatus(selectedRequest).replace("_", " ")}
                        </Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Request Date
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatDate(selectedRequest.createdAt)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Clickable Items List */}
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
                      Requested Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedRequest.items.map((item, index) => {
                        // Add a type for inventoryId
                        type InventoryObj = { _id: string; name?: string };
                        const inventoryId =
                          typeof item.inventoryId === "object" &&
                          item.inventoryId !== null &&
                          "_id" in item.inventoryId
                            ? (item.inventoryId as InventoryObj)._id
                            : item.inventoryId;

                        return (
                          <button
                            key={index}
                            onClick={() => handleViewInventoryItem(inventoryId)}
                            className={`w-full p-3 ${colors.backgrounds.tertiary} rounded-none hover:${colors.backgrounds.accent} transition-colors duration-200 cursor-pointer text-left group`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <p
                                  className={`font-medium ${colors.texts.primary} text-sm group-hover:${colors.texts.success}`}
                                >
                                  {typeof item.inventoryId === "object" &&
                                  item.inventoryId !== null &&
                                  "name" in item.inventoryId
                                    ? (item.inventoryId as InventoryObj).name
                                    : item.inventoryName || "Unknown Item"}
                                </p>
                                <ArrowTopRightOnSquareIcon
                                  className={`h-4 w-4 ${colors.icons.muted} group-hover:${colors.icons.success} transition-colors`}
                                />
                              </div>
                              <p
                                className={`font-bold ${colors.texts.success} text-sm`}
                              >
                                {formatCurrency(item.subtotal)}
                              </p>
                            </div>
                            <div
                              className={`flex gap-4 text-xs ${colors.texts.muted}`}
                            >
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>
                                {formatCurrency(item.pricePerUnit)} per unit
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {selectedRequest.vendorNotes && (
                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <DocumentDuplicateIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Vendor Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-sm ${colors.texts.accent}`}>
                        {selectedRequest.vendorNotes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {selectedRequest.supplierNotes && (
                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <DocumentDuplicateIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Supplier Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-sm ${colors.texts.accent}`}>
                        {selectedRequest.supplierNotes}
                      </p>
                    </CardContent>
                  </Card>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
