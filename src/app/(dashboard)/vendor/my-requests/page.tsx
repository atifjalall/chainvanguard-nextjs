/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UsersIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CubeIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  InboxIcon,
  InboxStackIcon,
  InboxArrowDownIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  BanknotesIcon,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FadeUp } from "@/components/animations/fade-up";

// Import API functions and types

import { usePageTitle } from "@/hooks/use-page-title";
import {
  getMyRequests,
  getRequestStats,
  cancelRequest,
  cancelApprovedRequest,
  payForRequest,
  VendorRequest,
  RequestStatsResponse,
  ShippingAddress,
  PaymentResponse,
} from "@/lib/api/vendor.request.api";
import { authAPI } from "@/lib/api/auth.api";
import { Loader2 } from "lucide-react";

const HEADER_GAP = "gap-3";

export default function MyRequestsPage() {
  usePageTitle("My Requests");
  const [allRequests, setAllRequests] = useState<VendorRequest[]>([]);
  const [stats, setStats] = useState<RequestStatsResponse["stats"] | null>(
    null
  );
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState("all");

  // Cancel modals
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelApprovedDialogOpen, setIsCancelApprovedDialogOpen] =
    useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Payment modal
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Pakistan",
  });
  const [loadingUserData, setLoadingUserData] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all requests EXCEPT completed ones (they go to transactions page)
        const requestsResponse = await getMyRequests({ limit: 1000 });
        // Filter out completed requests
        const activeRequests = requestsResponse.requests.filter(
          (req) => req.status !== "completed"
        );
        setAllRequests(activeRequests);
        // Fetch stats
        const statsResponse = await getRequestStats();
        setStats(statsResponse.stats);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refetchData = async () => {
    try {
      const requestsResponse = await getMyRequests({ limit: 1000 });
      // Filter out completed requests (they belong on transactions page)
      const activeRequests = requestsResponse.requests.filter(
        (req) => req.status !== "completed"
      );
      setAllRequests(activeRequests);
      const statsResponse = await getRequestStats();
      setStats(statsResponse.stats);
    } catch (err: any) {
      console.error("Failed to refresh data:", err);
    }
  };

  // Fetch and pre-populate user data when payment dialog opens
  const loadUserDataIntoForm = useCallback(async () => {
    try {
      setLoadingUserData(true);
      const profileResponse = await authAPI.getProfile();
      const user = profileResponse.data;

      // Pre-populate shipping address with user data
      setShippingAddress({
        name: user.name || "",
        phone: user.phone || "",
        addressLine1: user.address || "",
        addressLine2: "",
        city: user.city || "",
        state: user.state || "",
        postalCode: user.postalCode || "",
        country: user.country || "Pakistan",
      });
    } catch (err: any) {
      console.error("Failed to load user data:", err);
      // Don't show error to user, just leave form empty
    } finally {
      setLoadingUserData(false);
    }
  }, []);

  // Load user data when payment dialog opens
  useEffect(() => {
    if (isPaymentDialogOpen) {
      loadUserDataIntoForm();
    }
  }, [isPaymentDialogOpen, loadUserDataIntoForm]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "pending":
        return <InboxIcon className="h-4 w-4" />;
      case "rejected":
      case "cancelled":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "pending") {
      return "bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400";
    }
    if (status === "approved") {
      return "bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400";
    }
    if (status === "rejected" || status === "cancelled") {
      return "bg-red-100/10 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400";
    }
    return "bg-gray-100/10 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-900 text-gray-700 dark:text-gray-300";
  };

  const getDisplayStatus = (status: string) => {
    if (status === "pending") return "applied";
    return status;
  };

  const formatCurrency = (amount: number) => {
    return `CVT ${amount.toLocaleString("en-PK")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusOptions = [
    "All Status",
    "Applied",
    "Approved",
    "Rejected",
    "Cancelled",
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest" },
    { value: "value-desc", label: "Highest Value" },
    { value: "value-asc", label: "Lowest Value" },
  ];

  // Filter requests based on selected tab
  const filteredByTab = useMemo(() => {
    if (selectedTab === "all") return allRequests;
    if (selectedTab === "applied")
      return allRequests.filter((r) => r.status === "pending");
    if (selectedTab === "approved")
      return allRequests.filter((r) => r.status === "approved");
    if (selectedTab === "rejected")
      return allRequests.filter((r) => r.status === "rejected");
    if (selectedTab === "cancelled")
      return allRequests.filter((r) => r.status === "cancelled");
    return allRequests;
  }, [allRequests, selectedTab]);

  // Apply search and filters
  const filteredAndSortedRequests = useMemo(() => {
    const filtered = filteredByTab.filter((request) => {
      const matchesSearch = request.requestNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const displayStatus = getDisplayStatus(request.status);
      const matchesStatus =
        selectedStatus === "All Status" ||
        displayStatus === selectedStatus.toLowerCase().replace(" ", "_");
      return matchesSearch && matchesStatus;
    });

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

  // Update statistics calculation to use fetched stats if available, fallback to calculation
  const totalRequests = stats?.total ?? allRequests.length;
  const appliedRequests =
    stats?.pending ?? allRequests.filter((r) => r.status === "pending").length;
  const approvedRequests =
    stats?.approved ??
    allRequests.filter((r) => r.status === "approved").length;
  const rejectedRequests =
    stats?.rejected ??
    allRequests.filter((r) => r.status === "rejected").length;
  const cancelledRequests =
    stats?.cancelled ??
    allRequests.filter((r) => r.status === "cancelled").length;

  // Handle cancel pending request
  const handleCancelPendingRequest = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      await cancelRequest(selectedRequest._id);
      toast.success(
        `Request ${selectedRequest.requestNumber} has been cancelled successfully.`
      );
      setIsCancelDialogOpen(false);
      setIsDetailsOpen(false);
      await refetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel the request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle cancel approved request
  const handleCancelApprovedRequest = async () => {
    if (!selectedRequest || !cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    try {
      setIsProcessing(true);
      await cancelApprovedRequest(selectedRequest._id, cancellationReason);
      toast.success(
        `Approved request ${selectedRequest.requestNumber} has been cancelled.`
      );
      setIsCancelApprovedDialogOpen(false);
      setIsDetailsOpen(false);
      setCancellationReason("");
      await refetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel the approved request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment
  const handlePayment = async () => {
    if (!selectedRequest) return;

    // Validate shipping address
    const requiredFields: (keyof ShippingAddress)[] = [
      "name",
      "phone",
      "addressLine1",
      "city",
      "state",
      "postalCode",
      "country",
    ];
    const missingFields = requiredFields.filter(
      (field) => !shippingAddress[field]
    );

    if (missingFields.length > 0) {
      toast.error(
        `Please fill in all required fields: ${missingFields.join(", ")}`
      );
      return;
    }

    try {
      setIsProcessing(true);
      const result: PaymentResponse = await payForRequest(
        selectedRequest._id,
        shippingAddress
      );

      // Access the correct response structure with proper typing
      const orderNumber = result.data?.order?.orderNumber || "N/A";
      const totalAmount = result.data?.order?.total || selectedRequest.total;

      toast.success(
        `Payment processed successfully. Order ${orderNumber} created for ${formatCurrency(totalAmount)}`
      );
      setIsPaymentDialogOpen(false);
      setIsDetailsOpen(false);
      // Reset shipping address
      setShippingAddress({
        name: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Pakistan",
      });
      await refetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading requests...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error Loading Requests
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            Retry
          </Button>
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
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>My Requests</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <FadeUp delay={0}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                My Requests
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                View and manage your submitted requests
              </p>
              <div className={`flex items-center ${HEADER_GAP} mt-2`}>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <InboxStackIcon
                    className={`h-3 w-3 ${badgeColors.green.icon}`}
                  />
                  Request Management
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
        </FadeUp>

        {/* Statistics Cards */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Total Requests",
                value: totalRequests.toString(),
                icon: InboxStackIcon,
              },
              {
                title: "Applied",
                value: appliedRequests.toString(),
                icon: InboxArrowDownIcon,
              },
              {
                title: "Approved",
                value: approvedRequests.toString(),
                icon: CheckCircleIcon,
              },
              {
                title: "Rejected",
                value: rejectedRequests.toString(),
                icon: XCircleIcon,
              },
              {
                title: "Cancelled",
                value: cancelledRequests.toString(),
                icon: XCircleIcon,
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
                    Requests
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
                Filter and search through your requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search requests by request number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${colors.inputs.base} pl-9 h-9 w-full min-w-[240px] ${colors.inputs.focus} transition-colors duration-200 hover:border-black`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger
                    className={`text-sm h-9 w-full min-w-[240px} ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200 hover:border-black`}
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
                    className={`text-sm h-9 w-full min-w-[240px} ${colors.inputs.base} cursor-pointer ${colors.inputs.focus} transition-colors duration-200 hover:border-black`}
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
                  {filteredAndSortedRequests.length} requests found
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeUp>

        {/* Tabs */}
        <FadeUp delay={0.3}>
          <div className="flex justify-center mt-6">
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
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "all" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                  >
                    <Squares2X2Icon
                      className={`h-4 w-4 ${colors.icons.primary}`}
                    />
                    All Requests
                  </TabsTrigger>
                  <TabsTrigger
                    value="applied"
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "applied" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                  >
                    <InboxArrowDownIcon
                      className={`h-4 w-4 ${colors.icons.primary}`}
                    />
                    Applied
                  </TabsTrigger>
                  <TabsTrigger
                    value="approved"
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "approved" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                  >
                    <CheckCircleIcon
                      className={`h-4 w-4 ${colors.icons.primary}`}
                    />
                    Approved
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "rejected" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                  >
                    <XCircleIcon
                      className={`h-4 w-4 ${colors.icons.primary}`}
                    />
                    Rejected
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "cancelled" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                  >
                    <XCircleIcon
                      className={`h-4 w-4 ${colors.icons.primary}`}
                    />
                    Cancelled
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </FadeUp>

        {/* Request Cards */}
        <FadeUp delay={0.4}>
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
                        {request.requestNumber.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold ${colors.texts.primary} truncate`}
                        >
                          {request.requestNumber}
                        </h3>
                        {getStatusIcon(request.status)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(request.status)}`}
                          variant="secondary"
                        >
                          {getDisplayStatus(request.status).replace("_", " ")}
                        </Badge>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDetailsOpen(true);
                      }}
                      className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:border-black dark:hover:border-white`}
                    >
                      <EyeIcon
                        className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                      />
                      View Details
                    </Button>
                    {request.status === "approved" && !request.orderId && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsPaymentDialogOpen(true);
                        }}
                        className={`flex-1 h-8 px-3 ${colors.buttons.primary} cursor-pointer rounded-none`}
                      >
                        <CreditCardIcon className="h-4 w-4 mr-2 text-white" />
                        Pay Now
                      </Button>
                    )}
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
        </FadeUp>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Request Details
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Complete information about your request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 mt-6">
              {/* Request Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <CubeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
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
                      Status Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>Status</p>
                      <Badge
                        className={`text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(selectedRequest.status)}`}
                        variant="secondary"
                      >
                        {getDisplayStatus(selectedRequest.status).replace(
                          "_",
                          " "
                        )}
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
                    {selectedRequest.reviewedAt && (
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Reviewed Date
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatDate(selectedRequest.reviewedAt)}
                        </p>
                      </div>
                    )}
                    {selectedRequest.orderId && (
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Order ID
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.orderId}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Items List */}
              <Card
                className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
              >
                <CardHeader className="pb-3">
                  <CardTitle
                    className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                  >
                    <CubeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                    Requested Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedRequest.items.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 ${colors.backgrounds.tertiary} rounded-none`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p
                              className={`font-medium ${colors.texts.primary} text-sm`}
                            >
                              {item.inventory?.name || item.inventoryName}
                            </p>
                            {item.inventory?.category && (
                              <p className={`text-xs ${colors.texts.muted}`}>
                                Category: {item.inventory.category}
                              </p>
                            )}
                          </div>
                          <p
                            className={`font-bold ${colors.texts.success} text-sm`}
                          >
                            {formatCurrency(item.subtotal)}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className={colors.texts.muted}>
                              Quantity:
                            </span>
                            <span
                              className={`ml-1 font-medium ${colors.texts.primary}`}
                            >
                              {item.quantity} {item.inventory?.unit || "units"}
                            </span>
                          </div>
                          <div>
                            <span className={colors.texts.muted}>
                              Price/Unit:
                            </span>
                            <span
                              className={`ml-1 font-medium ${colors.texts.primary}`}
                            >
                              {formatCurrency(item.pricePerUnit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address Section - Only show if paid */}
              {selectedRequest.shippingAddress &&
                selectedRequest.shippingAddress.name && (
                  <Card
                    className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle
                        className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                      >
                        <CreditCardIcon
                          className={`h-5 w-5 ${colors.icons.primary}`}
                        />
                        Shipping Address
                      </CardTitle>
                      <CardDescription
                        className={`text-xs ${colors.texts.secondary}`}
                      >
                        Your items will be delivered to this address
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Name</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.shippingAddress.name}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Phone</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.shippingAddress.phone}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Address
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.shippingAddress.addressLine1}
                          {selectedRequest.shippingAddress.addressLine2 &&
                            `, ${selectedRequest.shippingAddress.addressLine2}`}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            City
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {selectedRequest.shippingAddress.city}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            State/Province
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {selectedRequest.shippingAddress.state}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Postal Code
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {selectedRequest.shippingAddress.postalCode}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.muted}`}>
                            Country
                          </p>
                          <p
                            className={`font-medium ${colors.texts.primary} text-sm`}
                          >
                            {selectedRequest.shippingAddress.country}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              {/* Vendor Notes */}
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
                      Your Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm ${colors.texts.accent}`}>
                      {selectedRequest.vendorNotes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Supplier Notes */}
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

              {/* Rejection Reason */}
              {selectedRequest.rejectionReason && (
                <Card
                  className={`border-0 shadow-sm bg-red-50 dark:bg-red-900/10 rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 text-red-700 dark:text-red-400`}
                    >
                      <XCircleIcon className={`h-5 w-5`} />
                      Rejection Reason
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm text-red-600 dark:text-red-300`}>
                      {selectedRequest.rejectionReason}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            {selectedRequest?.status === "pending" && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsCancelDialogOpen(true);
                }}
                className="text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400"
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Cancel Request
              </Button>
            )}
            {selectedRequest?.status === "approved" &&
              !selectedRequest?.orderId && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCancelApprovedDialogOpen(true);
                    }}
                    className="text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400"
                  >
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setIsPaymentDialogOpen(true);
                    }}
                    className={`${colors.buttons.primary} rounded-none cursor-pointer`}
                  >
                    <CreditCardIcon className="h-4 w-4 mr-2 text-white" />
                    Pay Now
                  </Button>
                </>
              )}
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className={`${colors.buttons.outline} rounded-none cursor-pointer transition-all hover:border-black dark:hover:border-white`}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Pending Request Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "672px" }}
          className={`w-full max-w-[672px] ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Cancel Request
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Are you sure you want to cancel this request? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div
                className={`p-4 ${colors.backgrounds.tertiary} rounded-none`}
              >
                <p className={`text-sm font-medium ${colors.texts.primary}`}>
                  Request: {selectedRequest.requestNumber}
                </p>
                <p className={`text-sm ${colors.texts.muted} mt-1`}>
                  Total: {formatCurrency(selectedRequest.total)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isProcessing}
              className="rounded-none cursor-pointer transition-all hover:border-black dark:hover:border-white"
            >
              No, Keep It
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelPendingRequest}
              disabled={isProcessing}
              className="text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400"
            >
              {isProcessing ? "Cancelling..." : "Yes, Cancel Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Approved Request Dialog */}
      <Dialog
        open={isCancelApprovedDialogOpen}
        onOpenChange={setIsCancelApprovedDialogOpen}
      >
        <DialogContent
          style={{ width: "100%", maxWidth: "672px" }}
          className={`w-full max-w-[672px] ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Cancel Approved Request
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Please provide a reason for cancelling this approved request.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 mt-4">
              <div
                className={`p-4 ${colors.backgrounds.tertiary} rounded-none`}
              >
                <p className={`text-sm font-medium ${colors.texts.primary}`}>
                  Request: {selectedRequest.requestNumber}
                </p>
                <p className={`text-sm ${colors.texts.muted} mt-1`}>
                  Total: {formatCurrency(selectedRequest.total)}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancellation-reason">
                  Cancellation Reason *
                </Label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Please explain why you're cancelling this approved request..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows={4}
                  className="rounded-none hover:border-black"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelApprovedDialogOpen(false);
                setCancellationReason("");
              }}
              disabled={isProcessing}
              className="rounded-none cursor-pointer transition-all hover:border-black dark:hover:border-white"
            >
              Back
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelApprovedRequest}
              disabled={isProcessing || !cancellationReason.trim()}
              className="text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400"
            >
              {isProcessing ? "Cancelling..." : "Cancel Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle
              className={`flex items-center gap-2 ${colors.texts.primary}`}
            >
              <BanknotesIcon className="h-5 w-5" />
              Process Payment
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Enter shipping address to complete payment for this request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6 mt-6">
              {/* Payment Summary */}
              <Card
                className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className={`text-base ${colors.texts.primary}`}>
                    Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className={colors.texts.muted}>Request:</span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      {selectedRequest.requestNumber}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={colors.texts.muted}>Items:</span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      {selectedRequest.items.length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={colors.texts.muted}>Subtotal:</span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      {formatCurrency(selectedRequest.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={colors.texts.muted}>Tax:</span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      {formatCurrency(selectedRequest.tax)}
                    </span>
                  </div>
                  <div
                    className={`flex justify-between text-base font-bold pt-2 border-t ${colors.borders.primary}`}
                  >
                    <span className={colors.texts.primary}>Total:</span>
                    <span className={colors.texts.success}>
                      {formatCurrency(selectedRequest.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address Form */}
              <div className="space-y-4">
                <h3
                  className={`text-base font-semibold ${colors.texts.primary}`}
                >
                  Shipping Address
                </h3>
                {loadingUserData && (
                  <p className={`text-sm ${colors.texts.secondary}`}>
                    Loading your details...
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={shippingAddress.name}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          name: e.target.value,
                        })
                      }
                      disabled={loadingUserData}
                      className="rounded-none hover:border-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="+92-300-1234567"
                      value={shippingAddress.phone}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          phone: e.target.value,
                        })
                      }
                      disabled={loadingUserData}
                      className="rounded-none hover:border-black"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    placeholder="Street address"
                    value={shippingAddress.addressLine1}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        addressLine1: e.target.value,
                      })
                    }
                    disabled={loadingUserData}
                    className="rounded-none hover:border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2</Label>
                  <Input
                    id="addressLine2"
                    placeholder="Apartment, suite, etc. (optional)"
                    value={shippingAddress.addressLine2}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        addressLine2: e.target.value,
                      })
                    }
                    disabled={loadingUserData}
                    className="rounded-none hover:border-black"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Karachi"
                      value={shippingAddress.city}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          city: e.target.value,
                        })
                      }
                      disabled={loadingUserData}
                      className="rounded-none hover:border-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input
                      id="state"
                      placeholder="Sindh"
                      value={shippingAddress.state}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          state: e.target.value,
                        })
                      }
                      disabled={loadingUserData}
                      className="rounded-none hover:border-black"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code *</Label>
                    <Input
                      id="postalCode"
                      placeholder="75500"
                      value={shippingAddress.postalCode}
                      onChange={(e) =>
                        setShippingAddress({
                          ...shippingAddress,
                          postalCode: e.target.value,
                        })
                      }
                      disabled={loadingUserData}
                      className="rounded-none hover:border-black"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="Pakistan"
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress({
                        ...shippingAddress,
                        country: e.target.value,
                      })
                    }
                    disabled={loadingUserData}
                    className="rounded-none hover:border-black"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={isProcessing}
              className="rounded-none cursor-pointer transition-all hover:border-black dark:hover:border-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className={`${colors.buttons.primary} rounded-none cursor-pointer`}
            >
              {isProcessing ? "Processing..." : "Complete Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
