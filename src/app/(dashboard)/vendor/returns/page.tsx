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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  InboxIcon,
  InboxStackIcon,
  InboxArrowDownIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  DocumentTextIcon,
  TruckIcon,
  ArchiveBoxIcon,
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
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getVendorReturns,
  getReturnById,
  getVendorReturnStats,
  approveReturn,
  rejectReturn,
  markItemReceived,
  markInspected,
  processRefund,
  restockInventory,
  type ReturnRequest,
  type ReturnStatus,
  type VendorReturnStats,
  type ItemCondition,
} from "@/lib/api/vendor.return.api";
import { Loader2 } from "lucide-react";
import { FadeUp } from "@/components/animations/fade-up";

const HEADER_GAP = "gap-3";

type TabType = "all" | "requested" | "approved" | "rejected" | "refunded";

export default function VendorReturnsPage() {
  usePageTitle("Returns Management");

  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [stats, setStats] = useState<VendorReturnStats | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(
    null
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [sortBy, setSortBy] = useState("recent");
  const [selectedTab, setSelectedTab] = useState<TabType>("all");
  const [actionLoading, setActionLoading] = useState(false);

  // Action modal states
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState<
    "approve" | "reject" | "received" | "inspected" | "refund" | null
  >(null);
  const [actionNotes, setActionNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [restockingFee, setRestockingFee] = useState("");
  const [shippingRefund, setShippingRefund] = useState("");
  const [itemCondition, setItemCondition] = useState<ItemCondition>("good");

  useEffect(() => {
    setIsVisible(true);
    loadReturns();
    loadStats();
  }, [selectedTab]);

  const loadReturns = async () => {
    try {
      setLoading(true);
      const statusMap: Record<TabType, ReturnStatus | undefined> = {
        all: undefined,
        requested: "requested",
        approved: "approved",
        rejected: "rejected",
        refunded: "refunded",
      };

      const response = await getVendorReturns({
        status: statusMap[selectedTab],
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success && response.returns) {
        setReturns(response.returns);
      }
    } catch (error: any) {
      console.error("Error loading returns:", error);
      toast.error(error.message || "Failed to load returns");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getVendorReturnStats();
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const openDetailsModal = async (returnItem: ReturnRequest) => {
    try {
      const response = await getReturnById(returnItem._id);
      if (response.success && response.return) {
        setSelectedReturn(response.return);
        setIsDetailsOpen(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load return details");
    }
  };

  const openActionModal = (
    type: "approve" | "reject" | "received" | "inspected" | "refund",
    returnItem: ReturnRequest
  ) => {
    setSelectedReturn(returnItem);
    setActionType(type);
    setActionNotes("");
    setRejectionReason("");
    setRefundAmount(
      returnItem.refundAmount?.toString() || returnItem.returnAmount.toString()
    );
    setRestockingFee(returnItem.restockingFee?.toString() || "0");
    setShippingRefund(returnItem.shippingRefund?.toString() || "0");
    setItemCondition("good");
    setIsActionModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedReturn || !actionType) return;

    setActionLoading(true);
    try {
      let response;

      switch (actionType) {
        case "approve":
          response = await approveReturn(selectedReturn._id, {
            reviewNotes: actionNotes,
            refundAmount: parseFloat(refundAmount),
            restockingFee: parseFloat(restockingFee),
            shippingRefund: parseFloat(shippingRefund),
          });
          toast.success("Return approved successfully");
          break;

        case "reject":
          if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason");
            return;
          }
          response = await rejectReturn(selectedReturn._id, {
            rejectionReason,
          });
          toast.success("Return rejected");
          break;

        case "received":
          response = await markItemReceived(selectedReturn._id, {
            notes: actionNotes,
          });
          toast.success("Marked as item received");
          break;

        case "inspected":
          response = await restockInventory(selectedReturn._id, {
            condition: itemCondition,
            notes: actionNotes,
          });
          const stockMessage =
            itemCondition === "good"
              ? "Stock restored to inventory"
              : itemCondition === "damaged"
                ? "Marked as damaged inventory"
                : "Recorded as unsellable";
          toast.success(`Marked as inspected - ${stockMessage}`);
          break;

        case "refund":
          response = await processRefund(selectedReturn._id, {
            notes: actionNotes,
          });
          toast.success("Refund processed successfully");
          break;
      }

      setIsActionModalOpen(false);
      loadReturns();
      loadStats();
    } catch (error: any) {
      console.error("Action error:", error);
      toast.error(error.message || "Failed to process action");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "requested":
        return <InboxIcon className="h-4 w-4" />;
      case "rejected":
        return <XCircleIcon className="h-4 w-4" />;
      case "refunded":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "item_received":
        return <TruckIcon className="h-4 w-4" />;
      case "inspected":
        return <ArchiveBoxIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === "requested") {
      return "bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400";
    }
    if (status === "approved" || status === "refunded") {
      return "bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400";
    }
    if (status === "rejected") {
      return "bg-red-100/10 dark:bg-red-900/10 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400";
    }
    return "bg-gray-100/10 dark:bg-gray-900/10 border border-gray-200 dark:border-gray-900 text-gray-700 dark:text-gray-300";
  };

  const formatCurrency = (amount: number) => {
    return `CVT ${amount.toLocaleString("en-PK", { minimumFractionDigits: 2 })}`;
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
    "Requested",
    "Approved",
    "Rejected",
    "Refunded",
  ];

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "oldest", label: "Oldest" },
    { value: "value-desc", label: "Highest Value" },
    { value: "value-asc", label: "Lowest Value" },
  ];

  const filteredAndSortedReturns = useMemo(() => {
    const filtered = returns.filter((returnRequest) => {
      const matchesSearch =
        returnRequest.returnNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        returnRequest.customerName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        returnRequest.orderNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        selectedStatus === "All Status" ||
        returnRequest.status.toLowerCase() === selectedStatus.toLowerCase();
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
          return b.returnAmount - a.returnAmount;
        case "value-asc":
          return a.returnAmount - b.returnAmount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [returns, searchTerm, selectedStatus, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading returns...
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
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Returns</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <FadeUp delay={0}>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                Returns Management
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
        </FadeUp>

        {/* Statistics Cards */}
        <FadeUp delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                title: "Total Returns",
                value: stats?.total || 0,
                icon: InboxStackIcon,
              },
              {
                title: "Pending",
                value: stats?.requested || 0,
                icon: InboxArrowDownIcon,
              },
              {
                title: "Approved",
                value: stats?.approved || 0,
                icon: CheckCircleIcon,
              },
              {
                title: "Rejected",
                value: stats?.rejected || 0,
                icon: XCircleIcon,
              },
              {
                title: "Total Refunded",
                value: formatCurrency(stats?.totalRefunded || 0),
                subtitle: `${stats?.refunded || 0} returns`,
                icon: CurrencyDollarIcon,
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
                    {stat.subtitle || "Returns"}
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
                Filter and search through return requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="relative w-full">
                <MagnifyingGlassIcon
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${colors.icons.secondary}`}
                />
                <Input
                  placeholder="Search by return number, customer, or order..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${colors.inputs.base} pl-9 h-9 w-full ${colors.inputs.focus} transition-colors duration-200`}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger
                    className={`text-sm h-9 w-full ${colors.inputs.base} cursor-pointer ${colors.inputs.focus}`}
                  >
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
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
                    className={`text-sm h-9 w-full ${colors.inputs.base} cursor-pointer ${colors.inputs.focus}`}
                  >
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
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
              <div className="flex flex-wrap gap-2 items-center">
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
                <span className={`text-xs ${colors.texts.secondary} ml-2`}>
                  {filteredAndSortedReturns.length} returns found
                </span>
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
                className={`flex w-full max-w-3xl ${colors.borders.primary} ${colors.backgrounds.tertiary} p-0.5 rounded-none mx-auto`}
              >
                <TabsTrigger
                  value="all"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "all" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`}`}
                >
                  <Squares2X2Icon
                    className={`h-4 w-4 mr-1 ${colors.icons.primary}`}
                  />
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="requested"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "requested" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`}`}
                >
                  <InboxArrowDownIcon
                    className={`h-4 w-4 mr-1 ${colors.icons.primary}`}
                  />
                  New
                </TabsTrigger>
                <TabsTrigger
                  value="approved"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "approved" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`}`}
                >
                  <CheckCircleIcon
                    className={`h-4 w-4 mr-1 ${colors.icons.primary}`}
                  />
                  Approved
                </TabsTrigger>
                <TabsTrigger
                  value="rejected"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "rejected" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`}`}
                >
                  <XCircleIcon
                    className={`h-4 w-4 mr-1 ${colors.icons.primary}`}
                  />
                  Rejected
                </TabsTrigger>
                <TabsTrigger
                  value="refunded"
                  className={`flex-1 py-1.5 px-2.5 text-xs font-medium transition-all cursor-pointer rounded-none ${selectedTab === "refunded" ? `${colors.backgrounds.primary} ${colors.texts.primary} shadow-sm` : `${colors.texts.secondary} hover:${colors.texts.primary}`}`}
                >
                  <CurrencyDollarIcon
                    className={`h-4 w-4 mr-1 ${colors.icons.primary}`}
                  />
                  Refunded
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </FadeUp>

        {/* Return Cards */}
        <FadeUp delay={0.4}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedReturns.map((returnRequest) => (
              <Card
                key={returnRequest._id}
                className={`${colors.cards.base} hover:${colors.cards.hover} overflow-hidden group rounded-none !shadow-none hover:!shadow-none`}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(returnRequest.status)}
                          <h3
                            className={`font-semibold ${colors.texts.primary} text-sm`}
                          >
                            {returnRequest.returnNumber}
                          </h3>
                        </div>
                        <Badge
                          className={`text-xs rounded-none px-2 py-0.5 ${getStatusBadgeClass(returnRequest.status)}`}
                          variant="secondary"
                        >
                          {returnRequest.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Customer
                      </p>
                      <p
                        className={`text-sm font-medium ${colors.texts.primary}`}
                      >
                        {returnRequest.customerName}
                      </p>
                      <p className={`text-xs ${colors.texts.secondary}`}>
                        Order: {returnRequest.orderNumber}
                      </p>
                    </div>

                    {/* Amount */}
                    <div
                      className={`p-3 ${colors.backgrounds.accent} rounded-none`}
                    >
                      <p
                        className={`text-lg font-bold ${colors.texts.success}`}
                      >
                        {formatCurrency(returnRequest.returnAmount)}
                      </p>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        Return Amount
                      </p>
                    </div>

                    {/* Items Count */}
                    <div className="flex items-center justify-between">
                      <p className={`text-xs ${colors.texts.secondary}`}>
                        {returnRequest.items.length} item
                        {returnRequest.items.length !== 1 ? "s" : ""}
                      </p>
                      <p className={`text-xs ${colors.texts.muted}`}>
                        {formatDate(returnRequest.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailsModal(returnRequest)}
                        className="flex-1 h-8 px-3 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white hover:border-black dark:hover:border-white rounded-none transition-all cursor-pointer"
                      >
                        <EyeIcon className="h-3 w-3 mr-1" />
                        Details
                      </Button>

                      {returnRequest.status === "requested" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              openActionModal("approve", returnRequest)
                            }
                            className={`${colors.buttons.primary} rounded-none cursor-pointer`}
                          >
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                            Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="reject"
                            onClick={() =>
                              openActionModal("reject", returnRequest)
                            }
                            className="flex-1 h-8 px-3 rounded-none"
                          >
                            <XCircleIcon className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {returnRequest.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            openActionModal("received", returnRequest)
                          }
                          className={`${colors.buttons.primary} rounded-none cursor-pointer`}
                        >
                          <TruckIcon className="h-3 w-3 mr-1" />
                          Mark Received
                        </Button>
                      )}

                      {returnRequest.status === "item_received" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            openActionModal("inspected", returnRequest)
                          }
                          className={`${colors.buttons.primary} rounded-none cursor-pointer`}
                        >
                          <ArchiveBoxIcon className="h-3 w-3 mr-1" />
                          Mark Inspected
                        </Button>
                      )}

                      {returnRequest.status === "inspected" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            openActionModal("refund", returnRequest)
                          }
                          className={`${colors.buttons.primary} rounded-none cursor-pointer`}
                        >
                          <CurrencyDollarIcon className="h-3 w-3 mr-1" />
                          Process Refund
                        </Button>
                      )}
                    </div>
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
        </FadeUp>
      </div>

      {/* Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent
          style={{ width: "100%", maxWidth: "900px" }}
          className={`w-full max-w-[900px] max-h-[90vh] overflow-y-auto ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none p-0 !shadow-none hover:!shadow-none`}
        >
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className={`${colors.texts.primary}`}>
                Return Details
              </DialogTitle>
              <DialogDescription className={`${colors.texts.secondary}`}>
                Complete information about the return request
              </DialogDescription>
            </DialogHeader>
            {selectedReturn && (
              <div className="space-y-6 mt-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-1`}>
                      Return Number
                    </p>
                    <p
                      className={`text-sm font-medium ${colors.texts.primary}`}
                    >
                      {selectedReturn.returnNumber}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-1`}>
                      Status
                    </p>
                    <Badge
                      className={`text-xs rounded-none ${getStatusBadgeClass(selectedReturn.status)}`}
                    >
                      {selectedReturn.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-1`}>
                      Customer
                    </p>
                    <p
                      className={`text-sm font-medium ${colors.texts.primary}`}
                    >
                      {selectedReturn.customerName}
                    </p>
                    <p className={`text-xs ${colors.texts.secondary}`}>
                      {selectedReturn.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-1`}>
                      Order Number
                    </p>
                    <p
                      className={`text-sm font-medium ${colors.texts.primary}`}
                    >
                      {selectedReturn.orderNumber}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-1`}>
                      Return Amount
                    </p>
                    <p className={`text-sm font-bold ${colors.texts.success}`}>
                      {formatCurrency(selectedReturn.returnAmount)}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-1`}>
                      Refund Amount
                    </p>
                    <p className={`text-sm font-bold ${colors.texts.success}`}>
                      {formatCurrency(selectedReturn.refundAmount)}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <p className={`text-xs ${colors.texts.muted} mb-2`}>Reason</p>
                  <p
                    className={`text-sm ${colors.texts.primary} mb-2 capitalize`}
                  >
                    {selectedReturn.reason.replace(/_/g, " ")}
                  </p>
                  <p
                    className={`text-sm ${colors.texts.secondary} bg-gray-50 dark:bg-gray-900 p-3 rounded-none`}
                  >
                    {selectedReturn.reasonDetails}
                  </p>
                </div>

                {/* Items */}
                <div>
                  <p className={`text-xs ${colors.texts.muted} mb-3`}>
                    Items ({selectedReturn.items.length})
                  </p>
                  <div className="space-y-2">
                    {selectedReturn.items.map((item, index) => (
                      <div
                        key={index}
                        className={`flex justify-between items-center p-3 ${colors.backgrounds.tertiary} rounded-none`}
                      >
                        <div>
                          <p
                            className={`text-sm font-medium ${colors.texts.primary}`}
                          >
                            {item.productName}
                          </p>
                          <p className={`text-xs ${colors.texts.secondary}`}>
                            Qty: {item.quantity} × {formatCurrency(item.price)}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-medium ${colors.texts.primary}`}
                        >
                          {formatCurrency(item.subtotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Images */}
                {selectedReturn.images && selectedReturn.images.length > 0 && (
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-3`}>
                      Images ({selectedReturn.images.length})
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedReturn.images.map((imageUrl, index) => (
                        <a
                          key={index}
                          href={imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="aspect-square border border-gray-200 dark:border-gray-800 overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imageUrl}
                            alt={`Return ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                {selectedReturn.reviewNotes && (
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-2`}>
                      Review Notes
                    </p>
                    <p
                      className={`text-sm ${colors.texts.secondary} bg-green-50 dark:bg-green-950 p-3 rounded`}
                    >
                      {selectedReturn.reviewNotes}
                    </p>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedReturn.rejectionReason && (
                  <div>
                    <p className={`text-xs ${colors.texts.muted} mb-2`}>
                      Rejection Reason
                    </p>
                    <p
                      className={`text-sm ${colors.texts.secondary} bg-red-50 dark:bg-red-950 p-3 rounded`}
                    >
                      {selectedReturn.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className={colors.texts.muted}>Requested:</span>{" "}
                    <span className={colors.texts.primary}>
                      {formatDate(selectedReturn.createdAt)}
                    </span>
                  </div>
                  {selectedReturn.reviewedAt && (
                    <div>
                      <span className={colors.texts.muted}>Reviewed:</span>{" "}
                      <span className={colors.texts.primary}>
                        {formatDate(selectedReturn.reviewedAt)}
                      </span>
                    </div>
                  )}
                  {selectedReturn.refundedAt && (
                    <div>
                      <span className={colors.texts.muted}>Refunded:</span>{" "}
                      <span className={colors.texts.primary}>
                        {formatDate(selectedReturn.refundedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-3 px-6 pb-6 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailsOpen(false)}
              className="h-8 px-4 pb-2 pr-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-none transition-all cursor-pointer"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Modal */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent
          className={`max-w-2xl ${colors.backgrounds.modal} rounded-none`}
        >
          <DialogHeader>
            <DialogTitle className={colors.texts.primary}>
              {actionType === "approve" && "Approve Return"}
              {actionType === "reject" && "Reject Return"}
              {actionType === "received" && "Mark Item Received"}
              {actionType === "inspected" && "Mark as Inspected"}
              {actionType === "refund" && "Process Refund"}
            </DialogTitle>
            <DialogDescription className={colors.texts.secondary}>
              {actionType === "approve" &&
                "Set refund amount and provide review notes"}
              {actionType === "reject" &&
                "Provide a reason for rejecting this return"}
              {actionType === "received" &&
                "Confirm that you have received the returned item"}
              {actionType === "inspected" &&
                "Confirm that the item has been inspected"}
              {actionType === "refund" &&
                "Process the refund to customer's wallet"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {actionType === "approve" && (
              <>
                <div>
                  <label
                    className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                  >
                    Refund Amount (CVT)
                  </label>
                  <Input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="Enter refund amount"
                    className={`${colors.inputs.base} ${colors.inputs.focus}`}
                  />
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                  >
                    Restocking Fee (CVT)
                  </label>
                  <Input
                    type="number"
                    value={restockingFee}
                    onChange={(e) => setRestockingFee(e.target.value)}
                    placeholder="Enter restocking fee"
                    className={`${colors.inputs.base} ${colors.inputs.focus}`}
                  />
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                  >
                    Shipping Refund (CVT)
                  </label>
                  <Input
                    type="number"
                    value={shippingRefund}
                    onChange={(e) => setShippingRefund(e.target.value)}
                    placeholder="Enter shipping refund"
                    className={`${colors.inputs.base} ${colors.inputs.focus}`}
                  />
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                  >
                    Review Notes (Optional)
                  </label>
                  <Textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add any notes about this approval..."
                    className={`${colors.inputs.base} ${colors.inputs.focus}`}
                    rows={3}
                  />
                </div>
              </>
            )}

            {actionType === "reject" && (
              <div>
                <label
                  className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                >
                  Rejection Reason *
                </label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this return is being rejected..."
                  className={`${colors.inputs.base} ${colors.inputs.focus}`}
                  rows={4}
                />
              </div>
            )}

            {actionType === "inspected" && (
              <>
                <div>
                  <label
                    className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                  >
                    Item Condition *
                  </label>
                  <Select
                    value={itemCondition}
                    onValueChange={(v) => setItemCondition(v as ItemCondition)}
                  >
                    <SelectTrigger
                      className={`${colors.inputs.base} ${colors.inputs.focus}`}
                    >
                      <SelectValue placeholder="Select item condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Good Condition</span>
                          <span className="text-xs text-gray-500">
                            Item will be restocked and made available for sale
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="damaged">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Damaged</span>
                          <span className="text-xs text-gray-500">
                            Item will be marked as damaged inventory
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="unsellable">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Unsellable</span>
                          <span className="text-xs text-gray-500">
                            Item will be written off (no stock added)
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                  >
                    Inspection Notes
                  </label>
                  <Textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    placeholder="Add detailed inspection findings..."
                    className={`${colors.inputs.base} ${colors.inputs.focus}`}
                    rows={3}
                  />
                </div>
              </>
            )}

            {(actionType === "received" || actionType === "refund") && (
              <div>
                <label
                  className={`text-sm font-medium ${colors.texts.primary} mb-2 block`}
                >
                  Notes (Optional)
                </label>
                <Textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Add any relevant notes..."
                  className={`${colors.inputs.base} ${colors.inputs.focus}`}
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsActionModalOpen(false)}
              disabled={actionLoading}
              className="h-8 px-4 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-none transition-all cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={actionLoading}
              className={`h-8 px-4 rounded-none transition-all ${
                actionType === "reject"
                  ? "border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-600 dark:hover:border-red-400"
                  : `${colors.buttons.primary} cursor-pointer`
              }`}
            >
              {actionLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
