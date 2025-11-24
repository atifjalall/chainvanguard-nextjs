/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UsersIcon,
  CubeIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ServerIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";

export default function ExpertDashboard() {
  usePageTitle("Dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setIsVisible(true);
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await expertApi.getDashboardStats();
      if ((response as any).success) {
        setStats((response as any).data);
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return badgeColors.green;
      case "warning":
        return badgeColors.yellow;
      case "critical":
        return badgeColors.red;
      default:
        return badgeColors.blue;
    }
  };

  if (isLoading) {
    return (
      <div
        className={`p-6 space-y-6 ${colors.backgrounds.secondary} min-h-screen`}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
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
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none flex items-center gap-1`}
              >
                <CheckCircleIcon className="h-3 w-3" />
                Network Active
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
              >
                Live Monitoring
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={loadDashboardStats}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className={`h-4 w-4 ${colors.icons.primary}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="transform transition-all duration-700 delay-200">
        <h2 className={`text-lg font-semibold ${colors.texts.primary} mb-4`}>
          Network Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              subtitle: `${stats?.networkOverview?.activeProducts || 0} active`,
              icon: CubeIcon,
              color: badgeColors.green,
            },
            {
              title: "Total Orders",
              value: stats?.networkOverview?.totalOrders || 0,
              subtitle: "Completed transactions",
              icon: ShoppingBagIcon,
              color: badgeColors.purple,
            },
            {
              title: "System Health",
              value: stats?.systemHealth?.status || "healthy",
              subtitle: `${stats?.systemHealth?.errorRate || 0}% error rate`,
              icon: ServerIcon,
              color: getHealthStatusColor(stats?.systemHealth?.status),
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
                <div
                  className={`text-xl font-bold ${colors.texts.primary} capitalize`}
                >
                  {stat.value.toLocaleString()}
                </div>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="transform transition-all duration-700 delay-300">
        <h2 className={`text-lg font-semibold ${colors.texts.primary} mb-4`}>
          Blockchain Transactions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Transactions",
              value: stats?.transactions?.total || 0,
              icon: ChartBarIcon,
              color: badgeColors.blue,
            },
            {
              title: "Successful",
              value: stats?.transactions?.successful || 0,
              subtitle: `${stats?.transactions?.successRate || 0}% success rate`,
              icon: CheckCircleIcon,
              color: badgeColors.green,
            },
            {
              title: "Failed",
              value: stats?.transactions?.failed || 0,
              icon: XCircleIcon,
              color: badgeColors.red,
            },
            {
              title: "Pending",
              value: stats?.transactions?.pending || 0,
              icon: ClockIcon,
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
                <div className={`text-xl font-bold ${colors.texts.primary}`}>
                  {stat.value.toLocaleString()}
                </div>
                {stat.subtitle && (
                  <p className={`text-xs ${colors.texts.muted} mt-1`}>
                    {stat.subtitle}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* User Distribution */}
      <div className="transform transition-all duration-700 delay-400">
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  User Distribution by Role
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  Breakdown of users across different roles
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
                    className={`p-4 rounded-none ${colors.cards.hover} border ${colors.borders.primary}`}
                  >
                    <div
                      className={`text-xs ${colors.texts.secondary} uppercase mb-2`}
                    >
                      {role}
                    </div>
                    <div
                      className={`text-2xl font-bold ${colors.texts.primary}`}
                    >
                      {count}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="transform transition-all duration-700 delay-500">
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  Recent Activity (Last 24 Hours)
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  New registrations and transactions
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  label: "New Users",
                  value: stats?.recentActivity?.last24Hours?.users || 0,
                  icon: UsersIcon,
                },
                {
                  label: "New Products",
                  value: stats?.recentActivity?.last24Hours?.products || 0,
                  icon: CubeIcon,
                },
                {
                  label: "New Orders",
                  value: stats?.recentActivity?.last24Hours?.orders || 0,
                  icon: ShoppingBagIcon,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-4 p-4 rounded-none border border-gray-200 dark:border-gray-800"
                >
                  <item.icon className="h-8 w-8" />
                  <div>
                    <div className={`text-xs ${colors.texts.secondary}`}>
                      {item.label}
                    </div>
                    <div
                      className={`text-2xl font-bold ${colors.texts.primary}`}
                    >
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
      <div className="transform transition-all duration-700 delay-600">
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  Recent Blockchain Transactions
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  Latest system events and transactions
                </p>
              </div>
              <Button
                variant="outline"
                className={`text-xs rounded-none ${colors.buttons.secondary}`}
                onClick={() =>
                  (window.location.href = "/expert/all-transactions")
                }
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentLogs?.slice(0, 5).map((log: any, index: number) => (
                <div
                  key={log.id || index}
                  className={`flex items-center justify-between p-3 rounded-none border ${colors.borders.primary}`}
                >
                  <div className="flex items-center gap-3">
                    {log.status === "success" ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <XCircleIcon className="h-4 w-4" />
                    )}
                    <div>
                      <div
                        className={`text-xs font-medium ${colors.texts.primary}`}
                      >
                        {log.type} - {log.action}
                      </div>
                      <div className={`text-xs ${colors.texts.muted}`}>
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
      </div>
    </div>
  );
}
