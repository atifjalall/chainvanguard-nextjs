/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
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
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
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

// VendorRequest interface
interface VendorRequest {
  id: string;
  itemName: string;
  vendorName: string;
  vendorEmail: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: "new" | "pending" | "confirmed" | "cancelled";
  requestDate: string;
  notes?: string;
  category: string;
  urgency: "low" | "medium" | "high";
}

// Mock vendor requests data
const mockRequests: VendorRequest[] = [
  {
    id: "req-001",
    itemName: "Industrial Steel Pipes",
    vendorName: "TechCorp Industries",
    vendorEmail: "contact@techcorp.com",
    quantity: 50,
    unitPrice: 25.0,
    totalPrice: 1250.0,
    status: "new",
    requestDate: "2025-08-20T10:00:00Z",
    notes: "Urgent for upcoming project",
    category: "Materials",
    urgency: "high",
  },
  {
    id: "req-002",
    itemName: "Organic Cotton Fabric",
    vendorName: "Green Textiles Ltd",
    vendorEmail: "partnerships@greentextiles.com",
    quantity: 100,
    unitPrice: 15.5,
    totalPrice: 1550.0,
    status: "pending",
    requestDate: "2025-08-18T14:30:00Z",
    notes: "Sustainable sourcing required",
    category: "Textiles",
    urgency: "medium",
  },
  {
    id: "req-003",
    itemName: "Medical Gloves",
    vendorName: "Medical Supply Co",
    vendorEmail: "orders@medsupply.com",
    quantity: 200,
    unitPrice: 5.0,
    totalPrice: 1000.0,
    status: "confirmed",
    requestDate: "2025-08-15T09:15:00Z",
    notes: "FDA approved only",
    category: "Medical Supplies",
    urgency: "low",
  },
];

export default function VendorRequestsPage() {
  const [requests, setRequests] = useState<VendorRequest[]>(mockRequests);
  const [autoApprove, setAutoApprove] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VendorRequest | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "pending":
        return <ClockIcon className="h-4 w-4" />;
      case "new":
        return <InboxIcon className="h-4 w-4" />;
      case "cancelled":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-100/10 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400";
      case "new":
        return "bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400";
      case "cancelled":
        return "bg-red-100/10 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100/10 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-900 text-gray-700 dark:text-gray-300";
    }
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

    const handleApprove = (id: string) => {
    setRequests(
      requests.map((req) =>
        req.id === id ? { ...req, status: "pending" as const } : req
      )
    );
    toast.success("Request approved and moved to pending");
  };

  // ADD THIS FUNCTION
  const handleCancel = (id: string) => {
    setRequests(
      requests.map((req) =>
        req.id === id ? { ...req, status: "cancelled" as const } : req
      )
    );
    toast.error("Request has been cancelled");
  };

  const handleUpdateStatus = (id: string, newStatus: string) => {
    setRequests(
      requests.map((req) =>
        req.id === id
          ? { ...req, status: newStatus as VendorRequest["status"] }
          : req
      )
    );
    toast.success(`Status updated to ${newStatus}`);
  };

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

  const statusOptions = [
    "All Status",
    "new",
    "pending",
    "confirmed",
    "cancelled",
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest" },
    { value: "name-asc", label: "Item Name: A to Z" },
    { value: "name-desc", label: "Item Name: Z to A" },
    { value: "value-desc", label: "Highest Value" },
    { value: "value-asc", label: "Lowest Value" },
  ];

  const filteredAndSortedRequests = useMemo(() => {
    const filtered = requests.filter((request) => {
      const matchesSearch =
        request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        selectedStatus === "All Status" || request.status === selectedStatus;

      const matchesTab =
        selectedTab === "all" ||
        (selectedTab === "new" &&
          request.status === "new" &&
          new Date(request.requestDate) >
            new Date(Date.now() - 24 * 60 * 60 * 1000)) ||
        (selectedTab === "pending" && request.status === "pending") ||
        (selectedTab === "confirmed" && request.status === "confirmed") ||
        (selectedTab === "cancelled" && request.status === "cancelled");

      return matchesSearch && matchesStatus && matchesTab;
    });

    // Sort requests
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return (
            new Date(b.requestDate).getTime() -
            new Date(a.requestDate).getTime()
          );
        case "oldest":
          return (
            new Date(a.requestDate).getTime() -
            new Date(b.requestDate).getTime()
          );
        case "name-asc":
          return a.itemName.localeCompare(b.itemName);
        case "name-desc":
          return b.itemName.localeCompare(a.itemName);
        case "value-desc":
          return b.totalPrice - a.totalPrice;
        case "value-asc":
          return a.totalPrice - b.totalPrice;
        default:
          return 0;
      }
    });

    return filtered;
  }, [requests, searchTerm, selectedStatus, selectedTab, sortBy]);

  // Calculate statistics (total, not filtered)
  const totalRequests = requests.length;
  const newRequests = requests.filter((r) => r.status === "new").length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const confirmedRequests = requests.filter(
    (r) => r.status === "confirmed"
  ).length;
  const cancelledRequests = requests.filter(
    (r) => r.status === "cancelled"
  ).length;
  const totalValue = requests.reduce((sum, r) => sum + r.totalPrice, 0);

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
                icon: InboxIcon,
              },
              {
                title: "New Requests",
                value: newRequests.toString(),
                subtitle: "Recently submitted",
                icon: InboxIcon,
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="relative w-full">
                  <MagnifyingGlassIcon
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                  />
                  <Input
                    placeholder="Search requests by item, vendor or category"
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
                  {filteredAndSortedRequests.length} requests found
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
                      ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm`
                      : `${colors.texts.secondary} hover:${colors.texts.primary}`
                  } flex items-center gap-2 justify-center`}
                  onClick={() => setSelectedTab("all")}
                >
                  <Squares2X2Icon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  All Requests ({totalRequests})
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
                  <InboxIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  New ({newRequests})
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
                  Pending ({pendingRequests})
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
                  Confirmed ({confirmedRequests})
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
                  Cancelled ({cancelledRequests})
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
                  onCheckedChange={setAutoApprove}
                  className="data-[state=checked]:bg-green-500"
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
                key={request.id}
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
                        {request.itemName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold ${colors.texts.primary} truncate`}
                        >
                          {request.itemName}
                        </h3>
                        {getStatusIcon(request.status)}
                      </div>
                      <p className={`text-sm ${colors.texts.muted} truncate`}>
                        {request.vendorName}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(request.status)}`}
                          variant="secondary"
                        >
                          {request.status}
                        </Badge>
                        {/* Urgency badge */}
                        <Badge
                          className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getUrgencyBadgeClass(request.urgency)}`}
                          variant="secondary"
                        >
                          {request.urgency} priority
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
                        Qty: {request.quantity} •{" "}
                        {formatCurrency(request.unitPrice)} each
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                    >
                      <TruckIcon className={`h-4 w-4 ${colors.icons.muted}`} />
                      <span className={`${colors.texts.primary}`}>
                        {request.category}
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
                        {formatCurrency(request.totalPrice)}
                      </p>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Total Value
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Requested: {formatDate(request.requestDate)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {request.status === "new" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(request.id)}
                          className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                        >
                          <CheckCircleIcon
                            className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                          />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(request.id)}
                          className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                        >
                          <XCircleIcon
                            className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                          />
                          Cancel
                        </Button>
                      </>
                    )}
                    {request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(request.id)}
                          className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                        >
                          <XCircleIcon
                            className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                          />
                          Cancel
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsDetailsOpen(true);
                      }}
                      className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none`}
                    >
                      <EyeIcon
                        className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                      />
                      {request.status === "confirmed" ? "Manage" : "View"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Request Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "600px" }}
          className={`w-full max-w-[600px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
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
              <div className="space-y-6">
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
                        Item Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Item Name
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.itemName}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Category
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.category}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Quantity
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.quantity}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Unit Price
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatCurrency(selectedRequest.unitPrice)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Total Price
                        </p>
                        <p
                          className={`font-bold ${colors.texts.success} text-sm`}
                        >
                          {formatCurrency(selectedRequest.totalPrice)}
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
                          {selectedRequest.vendorName}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>Email</p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedRequest.vendorEmail}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Status
                        </p>
                        <Badge
                          className={`text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(selectedRequest.status)}`}
                          variant="secondary"
                        >
                          {selectedRequest.status}
                        </Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Urgency
                        </p>
                        <Badge
                          className={`text-xs rounded-none px-2 py-0.5 ${getUrgencyBadgeClass(selectedRequest.urgency)}`}
                          variant="secondary"
                        >
                          {selectedRequest.urgency} priority
                        </Badge>
                      </div>
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Request Date
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {formatDate(selectedRequest.requestDate)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedRequest.notes && (
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
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`text-sm ${colors.texts.accent}`}>
                        {selectedRequest.notes}
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
              className={`shadow-none hover:shadow-none transition-all duration-300 cursor-pointer ${colors.buttons.outline}`}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
