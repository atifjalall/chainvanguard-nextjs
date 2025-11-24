/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
  ChartBarIcon,
  SignalIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";

const timeRangeOptions = [
  { value: "1h", label: "Last 1 Hour" },
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];
import { usePageTitle } from "@/hooks/use-page-title";

export default function ConsensusPage() {
  usePageTitle("Consensus Monitoring");
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [consensusStatus, setConsensusStatus] = useState<any>(null);
  const [consensusMetrics, setConsensusMetrics] = useState<any>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState("24h");

  useEffect(() => {
    setIsVisible(true);
    loadConsensusData();
  }, []);

  useEffect(() => {
    loadConsensusMetrics();
  }, [selectedTimeRange]);

  const loadConsensusData = async () => {
    try {
      setIsLoading(true);
      const [statusResponse, metricsResponse] = await Promise.all([
        expertApi.getConsensusStatus(),
        expertApi.getConsensusMetrics(selectedTimeRange),
      ]);

      console.log("Consensus Status Response:", statusResponse);
      console.log("Consensus Metrics Response:", metricsResponse);

      if (
        typeof statusResponse === "object" &&
        statusResponse !== null &&
        "success" in statusResponse &&
        (statusResponse as any).success &&
        "data" in statusResponse
      ) {
        setConsensusStatus((statusResponse as any).data);
      }
      if (
        typeof metricsResponse === "object" &&
        metricsResponse !== null &&
        "success" in metricsResponse &&
        (metricsResponse as any).success &&
        "data" in metricsResponse
      ) {
        setConsensusMetrics((metricsResponse as any).data);
      }
    } catch (error) {
      console.error("Error loading consensus data:", error);
      toast.error("Failed to load consensus data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadConsensusMetrics = async () => {
    try {
      const response = await expertApi.getConsensusMetrics(selectedTimeRange);
      console.log("Metrics Response:", response);
      if (
        typeof response === "object" &&
        response !== null &&
        "success" in response &&
        (response as any).success
      ) {
        setConsensusMetrics((response as any).data);
      }
    } catch (error) {
      console.error("Error loading metrics:", error);
      toast.error("Failed to load consensus metrics");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "healthy":
      case "active":
      case "online":
        return badgeColors.green;
      case "warning":
      case "syncing":
        return badgeColors.yellow;
      case "critical":
      case "offline":
        return badgeColors.red;
      default:
        return badgeColors.blue;
    }
  };

  const getPeerStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "online":
      case "active":
        return <CheckCircleIcon className="h-4 w-4" />;
      case "offline":
        return <XCircleIcon className="h-4 w-4" />;
      case "syncing":
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <ServerIcon className="h-4 w-4" />;
    }
  };

  // Helper to format metrics: show "N/A" when null/undefined, otherwise format numbers
  const formatNumber = (
    val: any,
    decimals?: number,
    suffix?: string
  ): string => {
    if (val === undefined || val === null) return "N/A";
    const n = Number(val);
    if (Number.isNaN(n)) return String(val);
    if (decimals !== undefined) return `${n.toFixed(decimals)}${suffix ?? ""}`;
    return n.toLocaleString();
  };

  if (isLoading) {
    return (
      <div
        className={`p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative z-10 p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
    >
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/expert">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Consensus Monitoring</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              Consensus Monitoring
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Monitor blockchain consensus status and peer network health
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${getStatusColor(consensusStatus?.status).bg} ${
                  getStatusColor(consensusStatus?.status).border
                } ${getStatusColor(consensusStatus?.status).text} text-xs rounded-none flex items-center gap-1`}
              >
                {getPeerStatusIcon(consensusStatus?.status)}
                {consensusStatus?.status || "Active"}
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                Live Monitoring
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedTimeRange}
              onValueChange={setSelectedTimeRange}
            >
              <SelectTrigger
                className={`w-[180px] rounded-none text-xs ${colors.inputs.base}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-xs"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={loadConsensusData}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Block Count",
            value:
              consensusMetrics?.metrics?.blockCount ??
              consensusMetrics?.blockCount ??
              undefined,
            subtitle: "Total blocks",
            icon: CpuChipIcon,
            color: badgeColors.blue,
          },
          {
            title: "Transactions",
            value:
              consensusMetrics?.metrics?.transactionCount ??
              consensusMetrics?.transactionCount ??
              undefined,
            subtitle: `In ${selectedTimeRange}`,
            icon: ChartBarIcon,
            color: badgeColors.green,
          },
          {
            title: "Avg Block Time",
            value:
              consensusMetrics?.metrics?.avgBlockTime ??
              consensusMetrics?.avgBlockTime ??
              undefined,
            subtitle: "Block generation",
            icon: ClockIcon,
            color: badgeColors.yellow,
          },
          {
            title: "Avg TX/Block",
            value:
              consensusMetrics?.metrics?.avgTxPerBlock ??
              consensusMetrics?.avgTxPerBlock ??
              undefined,
            subtitle: "Transactions per block",
            icon: SignalIcon,
            color: badgeColors.purple,
          },
        ].map((stat, index) => (
          <Card
            key={stat.title || index}
            className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02]`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className={`text-xs font-medium ${colors.texts.secondary}`}
              >
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colors.texts.primary}`}>
                {(() => {
                  // Use different formatting based on stat
                  if (stat.title === "Avg Block Time") {
                    return formatNumber(stat.value, 2, "s");
                  }
                  if (stat.title === "Avg TX/Block") {
                    return formatNumber(stat.value, 1);
                  }
                  // Block Count / Transactions
                  return stat.value === undefined || stat.value === null
                    ? "N/A"
                    : Number(stat.value).toLocaleString();
                })()}
              </div>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Network Status */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle
                className={`text-lg font-semibold ${colors.texts.primary}`}
              >
                Network Status
              </CardTitle>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                Current blockchain network state and peer information
              </p>
            </div>
            <Badge
              className={`${getStatusColor(consensusStatus?.status).bg} ${
                getStatusColor(consensusStatus?.status).border
              } ${getStatusColor(consensusStatus?.status).text} text-xs rounded-none`}
            >
              {consensusStatus?.status || "Active"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-4 rounded-none border ${colors.borders.primary}`}
            >
              <div className={`text-xs ${colors.texts.secondary} mb-2`}>
                Network State
              </div>
              <div className={`text-lg font-bold ${colors.texts.primary}`}>
                {consensusStatus?.networkState?.state || "Active"}
              </div>
            </div>
            <div
              className={`p-4 rounded-none border ${colors.borders.primary}`}
            >
              <div className={`text-xs ${colors.texts.secondary} mb-2`}>
                Total Peers
              </div>
              <div className={`text-lg font-bold ${colors.texts.primary}`}>
                {consensusStatus?.peers?.length || 0}
              </div>
            </div>
            <div
              className={`p-4 rounded-none border ${colors.borders.primary}`}
            >
              <div className={`text-xs ${colors.texts.secondary} mb-2`}>
                Last Updated
              </div>
              <div className={`text-lg font-bold ${colors.texts.primary}`}>
                {consensusStatus?.timestamp
                  ? new Date(consensusStatus.timestamp).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "N/A"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peer Nodes Table */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader>
          <CardTitle
            className={`text-lg font-semibold ${colors.texts.primary}`}
          >
            Network Peers
          </CardTitle>
          <p className={`text-xs ${colors.texts.muted} mt-1`}>
            Connected peer nodes and their status
          </p>
        </CardHeader>
        <CardContent>
          {consensusStatus?.peers && consensusStatus.peers.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={colors.tables.header}>
                    <TableHead className="text-xs font-semibold">
                      Peer ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Block Height
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Version
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Last Seen
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {consensusStatus.peers.map((peer: any, index: number) => (
                    <TableRow
                      key={peer.id || index}
                      className={colors.tables.row}
                    >
                      <TableCell className="font-mono text-xs">
                        {peer.id || `Peer ${index + 1}`}
                      </TableCell>
                      <TableCell className="text-xs">
                        {peer.name || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                        >
                          {peer.type || "peer"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(peer.status).bg} ${
                            getStatusColor(peer.status).border
                          } ${getStatusColor(peer.status).text} text-xs rounded-none flex items-center gap-1 w-fit`}
                        >
                          {getPeerStatusIcon(peer.status)}
                          {peer.status || "online"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {peer.blockHeight === undefined ||
                        peer.blockHeight === null
                          ? "N/A"
                          : Number(peer.blockHeight).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {peer.version || "1.0.0"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {peer.lastSeen
                          ? new Date(peer.lastSeen).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : "Just now"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <ServerIcon className="h-12 w-12 mx-auto mb-4" />
              <div className={`text-sm ${colors.texts.secondary}`}>
                No peer information available
              </div>
              <p className={`text-xs ${colors.texts.muted} mt-2`}>
                Peer data will appear here once the network is active
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Trends */}
      {consensusMetrics?.trends && consensusMetrics.trends.length > 0 && (
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Performance Trends
            </CardTitle>
            <p className={`text-xs ${colors.texts.muted} mt-1`}>
              Block generation and transaction throughput over time
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {consensusMetrics.trends
                .slice(0, 10)
                .map((trend: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-none border ${colors.borders.primary}`}
                  >
                    <div className="flex items-center gap-4">
                      <ChartBarIcon className="h-5 w-5" />
                      <div>
                        <div
                          className={`text-xs font-medium ${colors.texts.primary}`}
                        >
                          {trend.timestamp
                            ? new Date(trend.timestamp).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : `Period ${index + 1}`}
                        </div>
                        <div className={`text-xs ${colors.texts.muted}`}>
                          {trend.blocks || 0} blocks • {trend.transactions || 0}{" "}
                          transactions
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className={`text-xs ${colors.texts.secondary}`}>
                          Avg Block Time
                        </div>
                        <div
                          className={`text-xs font-medium ${colors.texts.primary}`}
                        >
                          {trend.avgBlockTime === undefined ||
                          trend.avgBlockTime === null
                            ? "N/A"
                            : `${Number(trend.avgBlockTime).toFixed(2)}s`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xs ${colors.texts.secondary}`}>
                          TX/Block
                        </div>
                        <div
                          className={`text-xs font-medium ${colors.texts.primary}`}
                        >
                          {trend.avgTxPerBlock === undefined ||
                          trend.avgTxPerBlock === null
                            ? "N/A"
                            : Number(trend.avgTxPerBlock).toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
