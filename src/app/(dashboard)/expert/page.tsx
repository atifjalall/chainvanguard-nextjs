/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  BoltIcon,
  ServerIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  UsersIcon,
  ClockIcon,
  CubeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";
import { Loader2 } from "lucide-react";

export default function ExpertDashboard() {
  usePageTitle("Dashboard");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [consensusStatus, setConsensusStatus] = useState<any>(null);
  const [faultStatus, setFaultStatus] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [consensusMetrics, setConsensusMetrics] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const isMounted = useRef(true);
  const isLoadingRef = useRef(false);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    loadDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  }, []);

  type ApiResponse<T = any> = { success: boolean; data: T; message?: string };

  const loadDashboardData = async () => {
    if (isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      const [dashboard, fault, security, consensus, status] =
        (await Promise.all([
          expertApi.getDashboardStats(),
          expertApi.getFaultToleranceStatus(),
          expertApi.getSecurityOverview(),
          expertApi.getConsensusMetrics("24h"),
          expertApi.getConsensusStatus(),
        ])) as [
          ApiResponse<any>,
          ApiResponse<any>,
          ApiResponse<any>,
          ApiResponse<any>,
          ApiResponse<any>,
        ];

      if (!isMounted.current) return;

      if ((dashboard as any).success) setStats((dashboard as any).data);
      if (fault.success) setFaultStatus(fault.data);
      if (security.success) setSecurityData(security.data);
      if (consensus.success) setConsensusMetrics(consensus.data);
      if (status && (status as any).success && "data" in status) {
        setConsensusStatus((status as any).data);
        setSystemHealth((status as any).data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      if (isMounted.current) {
        toast.error("Failed to load dashboard data");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
      isLoadingRef.current = false;
    }
  };

  const getPeerCount = () => {
    const fromStats = Number(
      stats?.systemHealth?.activePeers ??
        stats?.networkOverview?.activePeers ??
        0
    );
    const fromConsensus = Number(
      consensusStatus?.peers?.length ?? systemHealth?.peers?.length ?? 0
    );
    return fromStats || fromConsensus || 0;
  };

  const getOverallHealth = () => {
    const faultScore = parseFloat(faultStatus?.score || "0");
    const securityStatus = securityData?.status || "secure";

    if (faultScore >= 90 && securityStatus === "secure") {
      return {
        status: "Excellent",
        color: badgeColors.green,
        score: faultScore,
      };
    } else if (faultScore >= 70 && securityStatus === "secure") {
      return { status: "Good", color: badgeColors.blue, score: faultScore };
    } else if (faultScore >= 50) {
      return { status: "Fair", color: badgeColors.yellow, score: faultScore };
    } else {
      return { status: "Critical", color: badgeColors.red, score: faultScore };
    }
  };

  const overallHealth = getOverallHealth();

  // Helper to get icon for activity type
  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "transaction":
      case "transfer":
        return ChartBarIcon;
      case "security":
      case "login":
      case "auth":
        return ShieldCheckIcon;
      case "consensus":
      case "block":
        return CubeIcon;
      case "user":
      case "account":
        return UsersIcon;
      case "system":
      case "error":
        return ExclamationTriangleIcon;
      case "fault":
        return BoltIcon;
      default:
        return ClockIcon;
    }
  };

  // Helper to get color for activity type
  const getActivityColor = (type: string, status: string) => {
    if (status === "error" || status === "failed") return "text-red-500";
    if (status === "warning") return "text-yellow-500";

    switch (type?.toLowerCase()) {
      case "security":
        return "text-blue-500";
      case "consensus":
        return "text-purple-500";
      case "system":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading dashboard...
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
            System Dashboard
          </h1>
          <p className={`text-base ${colors.texts.secondary}`}>
            Real-time monitoring and system control
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge
              className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
            >
              {overallHealth.score}% Health
            </Badge>
            <Badge
              className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
            >
               {currentTime.toLocaleTimeString()}
            </Badge>
          </div>
        </div>
      </div>

      {/* Health Score Bar */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader>
          <CardTitle
            className={`text-lg font-semibold ${colors.texts.primary}`}
          >
            System Health Status
          </CardTitle>
          <p className={`text-xs ${colors.texts.muted} mt-1`}>
            Overall system health and performance metrics
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${colors.texts.secondary}`}>
                Health Score
              </span>
              <span className={`text-sm font-bold ${colors.texts.primary}`}>
                {overallHealth.score}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 overflow-hidden rounded-none">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallHealth.score}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${
                  overallHealth.score >= 90
                    ? "bg-green-500"
                    : overallHealth.score >= 70
                      ? "bg-blue-500"
                      : overallHealth.score >= 50
                        ? "bg-yellow-500"
                        : "bg-red-500"
                }`}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4">
                <div>
                  <div className={`text-xs ${colors.texts.secondary}`}>
                    Security
                  </div>
                  <div
                    className={`text-xs font-medium ${colors.texts.primary} capitalize`}
                  >
                    {securityData?.status || "Secure"}
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${colors.texts.secondary}`}>
                    Uptime
                  </div>
                  <div
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {faultStatus?.metrics?.uptime || "99"}%
                  </div>
                </div>
                <div>
                  <div className={`text-xs ${colors.texts.secondary}`}>
                    Active Peers
                  </div>
                  <div
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {getPeerCount()}
                  </div>
                </div>
              </div>
              <Badge
                className={`${overallHealth.color.bg} ${overallHealth.color.border} ${overallHealth.color.text} text-xs rounded-none`}
              >
                {overallHealth.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Transactions",
            value: consensusMetrics?.metrics?.transactionCount || 0,
            subtitle: "Last 24 hours",
            icon: ChartBarIcon,
            link: "/expert/all-transactions",
          },
          {
            title: "Blocks",
            value: consensusMetrics?.metrics?.blockCount || 0,
            subtitle: "Total blocks",
            icon: CubeIcon,
            link: "/expert/consensus",
          },
          {
            title: "Active Users",
            value: stats?.networkOverview?.activeUsers || 0,
            subtitle: "Currently active",
            icon: UsersIcon,
            link: "/expert/security",
          },
          {
            title: "Network Nodes",
            value: getPeerCount(),
            subtitle: "Connected peers",
            icon: ServerIcon,
            link: "/expert/consensus",
          },
        ].map((stat, index) => (
          <Card
            key={stat.title || index}
            onClick={() => router.push(stat.link)}
            className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none hover:!shadow-none transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
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
                {typeof stat.value === "number"
                  ? stat.value.toLocaleString()
                  : stat.value}
              </div>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fault Tolerance */}
        <Card
          className={`${colors.cards.base} rounded-none !shadow-none cursor-pointer`}
          onClick={() => router.push("/expert/fault-tolerance")}
        >
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-base ${colors.texts.primary}`}>
                Fault Tolerance
              </CardTitle>
              <BoltIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className={`text-xs ${colors.texts.secondary} mb-1`}>
                  Score
                </div>
                <div className={`text-xl font-bold ${colors.texts.primary}`}>
                  {faultStatus?.score || "0"}%
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${colors.texts.secondary}`}>
                    Failed TX
                  </span>
                  <span
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {faultStatus?.metrics?.failedTransactions || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${colors.texts.secondary}`}>
                    Uptime
                  </span>
                  <span
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {faultStatus?.metrics?.uptime || "99"}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card
          className={`${colors.cards.base} rounded-none !shadow-none cursor-pointer`}
          onClick={() => router.push("/expert/security")}
        >
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-base ${colors.texts.primary}`}>
                Security
              </CardTitle>
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className={`text-xs ${colors.texts.secondary} mb-1`}>
                  Status
                </div>
                <div
                  className={`text-xl font-bold ${colors.texts.primary} capitalize`}
                >
                  {securityData?.status || "Secure"}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${colors.texts.secondary}`}>
                    Events (24h)
                  </span>
                  <span
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {securityData?.metrics?.securityEvents || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${colors.texts.secondary}`}>
                    Failed Logins
                  </span>
                  <span
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {securityData?.metrics?.failedLogins || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consensus */}
        <Card
          className={`${colors.cards.base} rounded-none !shadow-none cursor-pointer`}
          onClick={() => router.push("/expert/consensus")}
        >
          <CardHeader className="border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-base ${colors.texts.primary}`}>
                Consensus
              </CardTitle>
              <ServerIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className={`text-xs ${colors.texts.secondary} mb-1`}>
                  Block Count
                </div>
                <div className={`text-xl font-bold ${colors.texts.primary}`}>
                  {consensusMetrics?.metrics?.blockCount || 0}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${colors.texts.secondary}`}>
                    Block Time
                  </span>
                  <span
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {consensusMetrics?.metrics?.avgBlockTime?.toFixed(2) || "0"}
                    s
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${colors.texts.secondary}`}>
                    Peers
                  </span>
                  <span
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    {getPeerCount()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <CardTitle className={`text-base ${colors.texts.primary}`}>
              Recent System Activity
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/expert/all-transactions")}
              className={`text-xs rounded-none ${colors.texts.secondary} hover:${colors.texts.primary}`}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stats?.recentLogs && stats.recentLogs.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {stats.recentLogs.slice(0, 6).map((log: any, index: number) => {
                const ActivityIcon = getActivityIcon(log.type);
                const iconColor = getActivityColor(log.type, log.status);

                return (
                  <motion.div
                    key={log.id || index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <ActivityIcon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div
                            className={`text-xs font-medium ${colors.texts.primary} truncate`}
                          >
                            {log.type} - {log.action}
                          </div>
                          <div className={`text-xs ${colors.texts.muted}`}>
                            {log.user?.name || "SYSTEM"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {log.status === "success" ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <div
                          className={`text-xs ${colors.texts.muted} whitespace-nowrap`}
                        >
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center">
              <ClockIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <div className={`text-sm ${colors.texts.secondary}`}>
                No recent activity
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
