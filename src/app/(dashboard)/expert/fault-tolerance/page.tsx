/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  ExclamationTriangleIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";
import { Loader2 } from "lucide-react";

const timeRangeOptions = [
  { value: "24h", label: "Last 24 Hours" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
];

// Add types to ensure API responses aren't treated as unknown
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

type FaultStatusMetrics = {
  totalTransactions?: number | string | null;
  failedTransactions?: number | string | null;
  systemErrors?: number | string | null;
  uptime?: number | string | null;
  lastIncident?: string | null;
};

type FaultStatus = {
  status?: string | null;
  score?: number | string | null;
  metrics?: FaultStatusMetrics | null;
};

type FaultStat = {
  date?: string;
  total?: number | string | null;
  success?: number | string | null;
  failed?: number | string | null;
  errorRate?: number | string | null;
  avgExecutionTime?: number | string | null;
};

type FaultStatsResponseData = {
  stats: FaultStat[];
};

export default function FaultTolerancePage() {
  usePageTitle("Fault Tolerance");
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  // Use typed states instead of any
  const [faultStatus, setFaultStatus] = useState<FaultStatus | null>(null);
  const [faultStats, setFaultStats] = useState<FaultStatsResponseData | null>(
    null
  );
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d");

  useEffect(() => {
    setIsVisible(true);
    loadFaultToleranceData();
  }, []);

  useEffect(() => {
    loadFaultStats();
  }, [selectedTimeRange]);

  const loadFaultToleranceData = async () => {
    try {
      setIsLoading(true);
      // Cast the Promise.all result to the typed tuple to avoid unknown types
      const [statusResponse, statsResponse] = (await Promise.all([
        expertApi.getFaultToleranceStatus(),
        expertApi.getFaultToleranceStats(selectedTimeRange),
      ])) as [ApiResponse<FaultStatus>, ApiResponse<FaultStatsResponseData>];

      if (statusResponse?.success) {
        setFaultStatus(statusResponse.data);
      }
      if (statsResponse?.success) {
        setFaultStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error loading fault tolerance data:", error);
      toast.error("Failed to load fault tolerance data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadFaultStats = async () => {
    try {
      const response = (await expertApi.getFaultToleranceStats(
        selectedTimeRange
      )) as ApiResponse<FaultStatsResponseData>;
      if (response.success) {
        setFaultStats(response.data);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Failed to load fault tolerance stats");
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (String(status)?.toLowerCase()) {
      case "excellent":
        return badgeColors.green;
      case "good":
        return badgeColors.blue;
      case "fair":
        return badgeColors.yellow;
      case "poor":
        return badgeColors.red;
      default:
        return badgeColors.blue;
    }
  };

  const getScoreColor = (score: number | string | undefined | null) => {
    const num = typeof score === "string" ? parseFloat(score) : (score ?? 0);
    if (num >= 90) return badgeColors.green;
    if (num >= 70) return badgeColors.blue;
    if (num >= 50) return badgeColors.yellow;
    return badgeColors.red;
  };

  // Helper to show number or a dash when data is missing
  const displayNumberOrDash = (val: number | string | undefined | null) => {
    if (val === null || val === undefined) return "—";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (typeof num !== "number" || isNaN(num)) return "—";
    return num.toLocaleString();
  };

  // Helper for percentage (show dash when not available)
  const displayPercentOrDash = (val: number | string | undefined | null) => {
    if (val === null || val === undefined) return "—";
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (typeof num !== "number" || isNaN(num)) return "—";
    return `${num}%`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading fault tolerance data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
            <BreadcrumbPage>Fault Tolerance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              System Fault Tolerance
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Monitor system resilience and error recovery capabilities
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${getStatusColor(faultStatus?.status).bg} ${
                  getStatusColor(faultStatus?.status).border
                } ${getStatusColor(faultStatus?.status).text} text-xs rounded-none flex items-center gap-1`}
              >
                <BoltIcon className="h-3 w-3" />
                {faultStatus?.status || "Good"}
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                Score: {faultStatus?.score || "0"}%
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
              onClick={loadFaultToleranceData}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all hover:border-black`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Fault Tolerance Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Fault Tolerance Score
            </CardTitle>
            <p className={`text-xs ${colors.texts.muted} mt-1`}>
              Overall system resilience and reliability rating
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-300 dark:text-gray-800"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - parseFloat(String(faultStatus?.score ?? "0")) / 100)}`}
                      className={
                        parseFloat(String(faultStatus?.score ?? "0")) >= 90
                          ? "text-green-500"
                          : parseFloat(String(faultStatus?.score ?? "0")) >= 70
                            ? "text-blue-500"
                            : parseFloat(String(faultStatus?.score ?? "0")) >=
                                50
                              ? "text-yellow-500"
                              : "text-red-500"
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${colors.texts.primary}`}
                      >
                        {displayPercentOrDash(faultStatus?.score)}
                      </div>
                      <div className={`text-xs ${colors.texts.muted}`}>
                        {faultStatus?.status || "Good"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-none border ${colors.borders.primary}`}
                >
                  <div className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Total Transactions
                  </div>
                  <div className={`text-xl font-bold ${colors.texts.primary}`}>
                    {displayNumberOrDash(
                      faultStatus?.metrics?.totalTransactions
                    )}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-none border ${colors.borders.primary}`}
                >
                  <div className={`text-xs ${colors.texts.secondary} mb-1`}>
                    Failed Transactions
                  </div>
                  <div className={`text-xl font-bold ${colors.texts.primary}`}>
                    {displayNumberOrDash(
                      faultStatus?.metrics?.failedTransactions
                    )}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-none border ${colors.borders.primary}`}
                >
                  <div className={`text-xs ${colors.texts.secondary} mb-1`}>
                    System Errors
                  </div>
                  <div className={`text-xl font-bold ${colors.texts.primary}`}>
                    {displayNumberOrDash(faultStatus?.metrics?.systemErrors)}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-none border ${colors.borders.primary}`}
                >
                  <div className={`text-xs ${colors.texts.secondary} mb-1`}>
                    System Uptime
                  </div>
                  <div className={`text-xl font-bold ${colors.texts.primary}`}>
                    {displayPercentOrDash(faultStatus?.metrics?.uptime)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Metrics Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {[
          {
            title: "Total Transactions",
            value: faultStatus?.metrics?.totalTransactions ?? null,
            subtitle: "Last 24 hours",
            icon: ChartBarIcon,
            color: badgeColors.blue,
          },
          {
            title: "Failed",
            value: faultStatus?.metrics?.failedTransactions ?? null,
            subtitle: "Transaction failures",
            icon: XCircleIcon,
            color: badgeColors.red,
          },
          {
            title: "System Errors",
            value: faultStatus?.metrics?.systemErrors ?? null,
            subtitle: "Critical errors",
            icon: ExclamationTriangleIcon,
            color: badgeColors.yellow,
          },
          {
            title: "Uptime",
            value: faultStatus?.metrics?.uptime ?? null,
            subtitle: "System availability",
            icon: ServerIcon,
            color: badgeColors.green,
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
              <stat.icon className={`h-4 w-4`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${colors.texts.primary}`}>
                {stat.title === "Uptime"
                  ? displayPercentOrDash(
                      stat.value as number | undefined | null
                    )
                  : displayNumberOrDash(
                      stat.value as number | undefined | null
                    )}
              </div>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Daily Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <CardTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Daily Performance Metrics
            </CardTitle>
            <p className={`text-xs ${colors.texts.muted} mt-1`}>
              Transaction success rates and error trends over{" "}
              {selectedTimeRange}
            </p>
          </CardHeader>
          <CardContent>
            {faultStats?.stats && faultStats.stats.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className={colors.tables.header}>
                      <TableHead className="text-xs font-semibold">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Total
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Success
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Failed
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Error Rate
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Avg Execution
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {faultStats.stats.map((stat: FaultStat, index: number) => (
                      <TableRow key={index} className={colors.tables.row}>
                        <TableCell className="text-xs">
                          {new Date(stat.date ?? "").toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {displayNumberOrDash(stat.total)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-xs">
                              {displayNumberOrDash(stat.success)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <XCircleIcon className="h-4 w-4" />
                            <span className="text-xs">
                              {displayNumberOrDash(stat.failed)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              parseFloat(String(stat.errorRate ?? "0")) < 5
                                ? `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text}`
                                : parseFloat(String(stat.errorRate ?? "0")) < 15
                                  ? `${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text}`
                                  : `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text}`
                            } text-xs rounded-none`}
                          >
                            {String(stat.errorRate ?? "0")}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {displayNumberOrDash(stat.avgExecutionTime)}ms
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 mx-auto mb-4" />
                <div className={`text-sm ${colors.texts.secondary}`}>
                  No statistical data available
                </div>
                <p className={`text-xs ${colors.texts.muted} mt-2`}>
                  Statistics will appear here as the system processes
                  transactions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Last Incident */}
      {faultStatus?.metrics?.lastIncident && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card
            className={`${colors.cards.base} rounded-none !shadow-none border-l-4 border-yellow-500`}
          >
            <CardHeader>
              <CardTitle
                className={`text-lg font-semibold ${colors.texts.primary}`}
              >
                Last Incident
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-xs ${colors.texts.secondary}`}>
                {new Date(faultStatus.metrics.lastIncident).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
