/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UsersIcon,
  CubeIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BoltIcon,
  ServerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";

export default function ExpertDashboard() {
  usePageTitle("Dashboard");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [faultStatus, setFaultStatus] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);
  const [consensusMetrics, setConsensusMetrics] = useState<any>(null);

  useEffect(() => {
    setIsVisible(true);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [dashboard, fault, security, consensus] = await Promise.all([
        expertApi.getDashboardStats(),
        expertApi.getFaultToleranceStatus(),
        expertApi.getSecurityOverview(),
        expertApi.getConsensusMetrics("24h"),
      ]);

      if ((dashboard as any).success) {
        setStats((dashboard as any).data);
      }
      if (fault.success) {
        setFaultStatus(fault.data);
      }
      if (security.success) {
        setSecurityData(security.data);
      }
      if (consensus.success) {
        setConsensusMetrics(consensus.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setIsLoading(false);
    }
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

  if (isLoading) {
    return (
      <div
        className={`p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative z-10 p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
    >
      {/* Header */}
      <div
        className={`transform transition-all duration-700 ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
              System Monitoring & Control
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Real-time blockchain network monitoring and administration
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadDashboardData}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section - Critical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transform transition-all duration-700 delay-100">
        {/* System Health */}
        <Card
          className={`${colors.cards.base} rounded-none !shadow-none border ${colors.borders.primary} hover:scale-[1.02] transition-transform cursor-pointer`}
          onClick={() => router.push("/expert/system-health")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm ${colors.texts.secondary}`}>
                System Health
              </CardTitle>
              <ServerIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`text-3xl font-semibold ${colors.texts.primary}`}>
              {overallHealth.status}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${overallHealth.color.bg} ${overallHealth.color.border} ${overallHealth.color.text} text-xs rounded-none`}
              >
                {overallHealth.score}% Score
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none flex items-center gap-1`}
              >
                <CheckCircleIcon className="h-3 w-3" />
                Active
              </Badge>
            </div>
            <p className={`text-xs ${colors.texts.muted} mt-2`}>
              All systems operational
            </p>
          </CardContent>
        </Card>

        {/* Fault Tolerance */}
        <Card
          className={`${colors.cards.base} rounded-none !shadow-none border ${colors.borders.primary} hover:scale-[1.02] transition-transform cursor-pointer`}
          onClick={() => router.push("/expert/fault-tolerance")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm ${colors.texts.secondary}`}>
                Fault Tolerance
              </CardTitle>
              <BoltIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className={`text-3xl font-semibold ${colors.texts.primary}`}>
              {faultStatus?.score || "0"}%
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
              >
                {faultStatus?.status || "Good"}
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                {faultStatus?.metrics?.uptime || "99"}% Uptime
              </Badge>
            </div>
            <p className={`text-xs ${colors.texts.muted} mt-2`}>
              {faultStatus?.metrics?.failedTransactions || 0} failed
              transactions
            </p>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card
          className={`${colors.cards.base} rounded-none !shadow-none border ${colors.borders.primary} hover:scale-[1.02] transition-transform cursor-pointer`}
          onClick={() => router.push("/expert/security")}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-sm ${colors.texts.secondary}`}>
                Security Status
              </CardTitle>
              <ShieldCheckIcon className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div
              className={`text-3xl font-semibold ${colors.texts.primary} capitalize`}
            >
              {securityData?.status || "Secure"}
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={`${
                  securityData?.status === "secure"
                    ? `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text}`
                    : `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text}`
                } text-xs rounded-none`}
              >
                {securityData?.metrics?.securityEvents || 0} Events (24h)
              </Badge>
            </div>
            <p className={`text-xs ${colors.texts.muted} mt-2`}>
              {securityData?.metrics?.activeUsers || 0} active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transform transition-all duration-700 delay-200">
        {[
          {
            title: "Total Users",
            value: stats?.networkOverview?.totalUsers || 0,
            subtitle: `${stats?.networkOverview?.activeUsers || 0} active`,
            icon: UsersIcon,
            color: badgeColors.blue,
          },
          {
            title: "Total Products",
            value: stats?.networkOverview?.totalProducts || 0,
            subtitle: `${stats?.networkOverview?.activeProducts || 0} in stock`,
            icon: CubeIcon,
            color: badgeColors.purple,
          },
          {
            title: "Total Orders",
            value: stats?.networkOverview?.totalOrders || 0,
            subtitle: "Completed",
            icon: ShoppingBagIcon,
            color: badgeColors.green,
          },
          {
            title: "Network Peers",
            value: stats?.systemHealth?.activePeers || 0,
            subtitle: "Connected nodes",
            icon: ServerIcon,
            color: badgeColors.yellow,
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
                {stat.value.toLocaleString()}
              </div>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 transform transition-all duration-700 delay-300">
        {/* Left Column - Network Performance */}
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  Network Performance
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  Blockchain transaction metrics (24h)
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/expert/consensus")}
                className={`text-xs rounded-none ${colors.buttons.ghost}`}
              >
                View Details
                <ArrowRightIcon className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-none border ${colors.borders.primary}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ChartBarIcon className="h-4 w-4" />
                  <div className={`text-xs ${colors.texts.secondary}`}>
                    Block Count
                  </div>
                </div>
                <div className={`text-xl font-bold ${colors.texts.primary}`}>
                  {consensusMetrics?.metrics?.blockCount || 0}
                </div>
              </div>
              <div
                className={`p-4 rounded-none border ${colors.borders.primary}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  <div className={`text-xs ${colors.texts.secondary}`}>
                    Transactions
                  </div>
                </div>
                <div className={`text-xl font-bold ${colors.texts.primary}`}>
                  {consensusMetrics?.metrics?.transactionCount || 0}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Avg Block Time
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Generation speed
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${colors.texts.primary}`}>
                  {consensusMetrics?.metrics?.avgBlockTime?.toFixed(2) || "0"}s
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Success Rate
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Transaction success
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${colors.texts.primary}`}>
                  {stats?.transactions?.successRate || 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Security Overview */}
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  Security Overview
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  Access control and monitoring (24h)
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/expert/security")}
                className={`text-xs rounded-none ${colors.buttons.ghost}`}
              >
                Manage Users
                <ArrowRightIcon className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`p-4 rounded-none border ${colors.borders.primary}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <UsersIcon className="h-4 w-4" />
                  <div className={`text-xs ${colors.texts.secondary}`}>
                    Active Users
                  </div>
                </div>
                <div className={`text-xl font-bold ${colors.texts.primary}`}>
                  {securityData?.metrics?.activeUsers || 0}
                </div>
              </div>
              <div
                className={`p-4 rounded-none border ${colors.borders.primary}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <div className={`text-xs ${colors.texts.secondary}`}>
                    Failed Logins
                  </div>
                </div>
                <div className={`text-xl font-bold ${colors.texts.primary}`}>
                  {securityData?.metrics?.failedLogins || 0}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Security Events
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Last 24 hours
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${colors.texts.primary}`}>
                  {securityData?.metrics?.securityEvents || 0}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <XCircleIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Frozen Wallets
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Disabled accounts
                    </div>
                  </div>
                </div>
                <div className={`text-sm font-bold ${colors.texts.primary}`}>
                  {securityData?.metrics?.inactiveUsers || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Distribution by Role */}
      <Card
        className={`${colors.cards.base} rounded-none !shadow-none transform transition-all duration-700 delay-400`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle
                className={`text-lg font-semibold ${colors.texts.primary}`}
              >
                User Distribution by Role
              </CardTitle>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                Platform user breakdown across different roles
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats?.networkOverview?.usersByRole || {}).map(
              ([role, count]: [string, any]) => (
                <div
                  key={role}
                  className={`p-6 rounded-none ${colors.cards.hover} border ${colors.borders.primary} hover:scale-[1.02] transition-transform`}
                >
                  <div
                    className={`text-xs ${colors.texts.secondary} uppercase mb-2 font-semibold`}
                  >
                    {role}
                  </div>
                  <div className={`text-3xl font-bold ${colors.texts.primary}`}>
                    {count}
                  </div>
                  <div className={`text-xs ${colors.texts.muted} mt-1`}>
                    {(
                      (count / stats?.networkOverview?.totalUsers) * 100 || 0
                    ).toFixed(1)}
                    % of total
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card
        className={`${colors.cards.base} rounded-none !shadow-none transform transition-all duration-700 delay-500`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle
                className={`text-lg font-semibold ${colors.texts.primary}`}
              >
                Recent Blockchain Activity
              </CardTitle>
              <p className={`text-xs ${colors.texts.muted} mt-1`}>
                Latest transactions and system events
              </p>
            </div>
            <Button
              variant="outline"
              className={`text-xs rounded-none ${colors.buttons.secondary}`}
              onClick={() => router.push("/expert/all-transactions")}
            >
              View All Transactions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.recentLogs?.slice(0, 5).map((log: any, index: number) => (
              <div
                key={log.id || index}
                className={`flex items-center justify-between p-4 rounded-none border ${colors.borders.primary} hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors`}
              >
                <div className="flex items-center gap-4">
                  {log.status === "success" ? (
                    <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
                      <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                  )}
                  <div>
                    <div
                      className={`text-sm font-medium ${colors.texts.primary}`}
                    >
                      {log.type} - {log.action}
                    </div>
                    <div className={`text-xs ${colors.texts.muted} mt-1`}>
                      {log.user?.name || "System"} •{" "}
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge
                  className={`${
                    log.status === "success"
                      ? `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text}`
                      : `${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text}`
                  } text-xs rounded-none`}
                >
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transform transition-all duration-700 delay-600">
        {[
          {
            title: "Consensus Monitoring",
            description: "View peer nodes and block generation",
            icon: ServerIcon,
            link: "/expert/consensus",
          },
          {
            title: "System Health",
            description: "Monitor overall system health",
            icon: BoltIcon,
            link: "/expert/system-health",
          },
          {
            title: "Security & Access",
            description: "Manage user access and security",
            icon: ShieldCheckIcon,
            link: "/expert/security",
          },
          {
            title: "All Transactions",
            description: "View complete transaction history",
            icon: ChartBarIcon,
            link: "/expert/all-transactions",
          },
        ].map((item, index) => (
          <Card
            key={index}
            className={`${colors.cards.base} ${colors.cards.hover} rounded-none !shadow-none border ${colors.borders.primary} cursor-pointer hover:scale-[1.02] transition-transform`}
            onClick={() => router.push(item.link)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <item.icon className="h-6 w-6" />
                <CardTitle className={`text-sm ${colors.texts.primary}`}>
                  {item.title}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-xs ${colors.texts.muted}`}>
                {item.description}
              </p>
              <div className="flex items-center gap-1 mt-3">
                <span className={`text-xs ${colors.texts.secondary}`}>
                  View Details
                </span>
                <ArrowRightIcon className="h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
