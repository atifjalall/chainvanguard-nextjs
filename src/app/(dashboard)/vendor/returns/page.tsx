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

// Mock data for returns (replace with API call later)
type ReturnRequest = {
  _id: string;
  returnNumber: string;
  status: "new" | "approved" | "rejected";
  total: number;
  items: any[];
  createdAt: string;
  customerName: string;
  reason?: string;
  notes?: string;
};

const HEADER_GAP = "gap-3";

const mockReturns: ReturnRequest[] = [
  {
    _id: "1",
    returnNumber: "RET-001",
    status: "new",
    total: 15000,
    items: [],
    createdAt: "2023-10-01",
    customerName: "John Doe",
    reason: "Defective product",
  },
  {
    _id: "2",
    returnNumber: "RET-002",
    status: "approved",
    total: 25000,
    items: [],
    createdAt: "2023-09-15",
    customerName: "Jane Smith",
    reason: "Wrong item",
  },
  // Add more mock data as needed
];

export default function ReturnsPage() {
  const [allReturns, setAllReturns] = useState<ReturnRequest[]>(mockReturns);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState("all");

  useEffect(() => {
    setIsVisible(true);
    // Simulate data fetch
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "new":
        return <InboxIcon className="h-4 w-4" />;
      case "rejected":
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "new") {
      return "bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400";
    }
    if (status === "approved") {
      return "bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400";
    }
    if (status === "rejected") {
      return "bg-red-100/10 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400";
    }
    return "bg-gray-100/10 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-900 text-gray-700 dark:text-gray-300";
  };

  const getDisplayStatus = (status: string) => {
    return status;
  };

  const formatCurrency = (amount: number) => {
    return `Rs ${amount.toLocaleString("en-PK")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusOptions = ["All Status", "New", "Approved", "Rejected"];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest" },
    { value: "value-desc", label: "Highest Value" },
    { value: "value-asc", label: "Lowest Value" },
  ];

  // Filter returns based on selected tab
  const filteredByTab = useMemo(() => {
    if (selectedTab === "all") return allReturns;
    if (selectedTab === "new")
      return allReturns.filter((r) => r.status === "new");
    if (selectedTab === "approved")
      return allReturns.filter((r) => r.status === "approved");
    if (selectedTab === "rejected")
      return allReturns.filter((r) => r.status === "rejected");
    return allReturns;
  }, [allReturns, selectedTab]);

  // Apply search and filters
  const filteredAndSortedReturns = useMemo(() => {
    const filtered = filteredByTab.filter((returnRequest) => {
      const matchesSearch =
        returnRequest.returnNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        returnRequest.customerName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const displayStatus = getDisplayStatus(returnRequest.status);
      const matchesStatus =
        selectedStatus === "All Status" ||
        displayStatus === selectedStatus.toLowerCase();
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

  // Calculate statistics
  const totalReturns = allReturns.length;
  const newReturns = allReturns.filter((r) => r.status === "new").length;
  const approvedReturns = allReturns.filter(
    (r) => r.status === "approved"
  ).length;
  const rejectedReturns = allReturns.filter(
    (r) => r.status === "rejected"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading returns...</p>
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
              <BreadcrumbPage>Returns</BreadcrumbPage>
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
                Returns
              </h1>
              <p className={`text-base ${colors.texts.secondary}`}>
                View and manage customer return requests
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
          className={`transform transition-all duration-700 delay-200 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Total Returns",
                value: totalReturns.toString(),
                icon: InboxStackIcon,
              },
              {
                title: "New",
                value: newReturns.toString(),
                icon: InboxArrowDownIcon,
              },
              {
                title: "Approved",
                value: approvedReturns.toString(),
                icon: CheckCircleIcon,
              },
              {
                title: "Rejected",
                value: rejectedReturns.toString(),
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
                  <p className={`text-xs ${colors.texts.secondary}`}>Returns</p>
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
                Filter and search through return requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search returns by return number or customer name"
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
                  {filteredAndSortedReturns.length} returns found
                </span>
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
                  All Request
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "new" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`} flex items-center gap-2 justify-center`}
                >
                  <InboxArrowDownIcon
                    className={`h-4 w-4 ${colors.icons.primary}`}
                  />
                  New
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
                  <XCircleIcon className={`h-4 w-4 ${colors.icons.primary}`} />
                  Rejected
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Return Cards */}
        <div
          className={`transform transition-all duration-700 delay-500 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedReturns.map((returnRequest) => (
              <Card
                key={returnRequest._id}
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
                        {returnRequest.returnNumber
                          .substring(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold ${colors.texts.primary} truncate`}
                        >
                          {returnRequest.returnNumber}
                        </h3>
                        {getStatusIcon(returnRequest.status)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge
                          className={`flex items-center gap-1 text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(returnRequest.status)}`}
                          variant="secondary"
                        >
                          {getDisplayStatus(returnRequest.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mb-4">
                    <div
                      className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                    >
                      <UsersIcon className={`h-4 w-4 ${colors.icons.muted}`} />
                      <span className={`${colors.texts.primary}`}>
                        Customer: {returnRequest.customerName}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-2 text-sm ${colors.texts.accent}`}
                    >
                      <CubeIcon className={`h-4 w-4 ${colors.icons.muted}`} />
                      <span className={`${colors.texts.primary}`}>
                        Items: {returnRequest.items.length}
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
                        {formatCurrency(returnRequest.total)}
                      </p>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Return Value
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Requested: {formatDate(returnRequest.createdAt)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedReturn(returnRequest);
                        setIsDetailsOpen(true);
                      }}
                      className={`flex-1 h-8 px-3 ${colors.buttons.outline} cursor-pointer rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all`}
                    >
                      <EyeIcon
                        className={`h-3 w-3 mr-1 ${colors.icons.primary}`}
                      />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filteredAndSortedReturns.length === 0 && (
            <div className="text-center py-12">
              <InboxIcon
                className={`h-16 w-16 mx-auto ${colors.icons.muted} mb-4`}
              />
              <h3
                className={`text-lg font-medium ${colors.texts.primary} mb-2`}
              >
                No returns found
              </h3>
              <p className={`text-sm ${colors.texts.secondary}`}>
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Return Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          className={`w-full max-w-[600px] ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={`${colors.texts.primary}`}>
              Return Details
            </DialogTitle>
            <DialogDescription className={`${colors.texts.secondary}`}>
              Detailed information about the return request
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card
                  className={`border-0 shadow-sm ${colors.backgrounds.secondary} rounded-none shadow-none`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle
                      className={`text-base flex items-center gap-2 ${colors.texts.primary}`}
                    >
                      <CubeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                      Return Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Return Number
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedReturn.returnNumber}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Customer
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedReturn.customerName}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Total Items
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {selectedReturn.items.length}
                      </p>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Return Value
                      </p>
                      <p
                        className={`font-bold ${colors.texts.success} text-sm`}
                      >
                        {formatCurrency(selectedReturn.total)}
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
                        className={`text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(selectedReturn.status)}`}
                        variant="secondary"
                      >
                        {getDisplayStatus(selectedReturn.status)}
                      </Badge>
                    </div>
                    <div>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Request Date
                      </p>
                      <p
                        className={`font-medium ${colors.texts.primary} text-sm`}
                      >
                        {formatDate(selectedReturn.createdAt)}
                      </p>
                    </div>
                    {selectedReturn.reason && (
                      <div>
                        <p className={`text-xs ${colors.texts.muted}`}>
                          Reason
                        </p>
                        <p
                          className={`font-medium ${colors.texts.primary} text-sm`}
                        >
                          {selectedReturn.reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              {selectedReturn.notes && (
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
                      {selectedReturn.notes}
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
