/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ServerIcon,
  CpuChipIcon,
  ChartBarIcon,
  BoltIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { expertApi } from "@/lib/api/expert.api";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";

export default function SystemHealthPage() {
  usePageTitle("System Health");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  // Data states
  const [consensusStatus, setConsensusStatus] = useState<any>(null);
  const [consensusMetrics, setConsensusMetrics] = useState<any>(null);
  const [faultStatus, setFaultStatus] = useState<any>(null);
  const [securityData, setSecurityData] = useState<any>(null);

  useEffect(() => {
    setIsVisible(true);
    loadSystemHealthData();
  }, []);

  const loadSystemHealthData = async () => {
    try {
      setIsLoading(true);

      // Load all health data
      const [consensus, metrics, fault, security] = await Promise.all([
        expertApi.getConsensusStatus(),
        expertApi.getConsensusMetrics("24h"),
        expertApi.getFaultToleranceStatus(),
        expertApi.getSecurityOverview(),
      ]);

      if (consensus.success) setConsensusStatus(consensus.data);
      if (metrics.success) setConsensusMetrics(metrics.data);
      if (fault.success) setFaultStatus(fault.data);
      if (security.success) setSecurityData(security.data);
    } catch (error) {
      console.error("Error loading system health data:", error);
      toast.error("Failed to load system health data");
    } finally {
      setIsLoading(false);
    }
  };

  const getOverallHealth = () => {
    const faultScore = parseFloat(faultStatus?.score || "0");
    const securityStatus = securityData?.status || "secure";

    if (faultScore >= 90 && securityStatus === "secure") {
      return { status: "Excellent", color: badgeColors.green }; // changed from green -> blue
    } else if (faultScore >= 70 && securityStatus === "secure") {
      return { status: "Good", color: badgeColors.blue }; // changed from green -> blue
    } else if (faultScore >= 50) {
      return { status: "Fair", color: badgeColors.yellow };
    } else {
      return { status: "Critical", color: badgeColors.red };
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
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
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
            <BreadcrumbPage>System Health</BreadcrumbPage>
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
              System Health Overview
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Comprehensive view of network health, consensus, and fault
              tolerance
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                className={`${overallHealth.color.bg} ${overallHealth.color.border} ${overallHealth.color.text} text-xs rounded-none flex items-center gap-1`}
              >
                {overallHealth.status === "Excellent" ||
                overallHealth.status === "Good" ? (
                  <CheckCircleIcon className="h-3 w-3" />
                ) : overallHealth.status === "Fair" ? (
                  <ExclamationTriangleIcon className="h-3 w-3" />
                ) : (
                  <XCircleIcon className="h-3 w-3" />
                )}
                {overallHealth.status}
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
              onClick={loadSystemHealthData}
              variant="outline"
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none ${colors.buttons.secondary} transition-all`}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Overall System Status */}
      <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
        <CardHeader>
          <CardTitle
            className={`text-lg font-semibold ${colors.texts.primary}`}
          >
            Overall System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              className={`p-6 rounded-none border-l-4 border border-gray-200 dark:border-gray-700 ${
                overallHealth.status === "Excellent" ||
                overallHealth.status === "Good"
                  ? "border-l-blue-500" // changed to left-only blue border
                  : overallHealth.status === "Fair"
                    ? "border-l-yellow-500"
                    : "border-l-red-500"
              }`}
            >
              <div className={`text-xs ${colors.texts.secondary} mb-2`}>
                System Health
              </div>
              <div
                className={`text-3xl font-bold ${colors.texts.primary} mb-1`}
              >
                {overallHealth.status}
              </div>
              <div className={`text-xs ${colors.texts.muted}`}>
                All systems operational
              </div>
            </div>
            <div
              className={`p-6 rounded-none border-l-4 border border-gray-200 dark:border-gray-700`}
            >
              <div className={`text-xs ${colors.texts.secondary} mb-2`}>
                Fault Tolerance Score
              </div>
              <div
                className={`text-3xl font-bold ${colors.texts.primary} mb-1`}
              >
                {faultStatus?.score || "0"}%
              </div>
              <div className={`text-xs ${colors.texts.muted}`}>
                {faultStatus?.status || "Good"} resilience
              </div>
            </div>
            <div
              className={`p-6 rounded-none border-l-4 border border-gray-200 dark:border-gray-700`}
            >
              <div className={`text-xs ${colors.texts.secondary} mb-2`}>
                Security Status
              </div>
              <div
                className={`text-3xl font-bold ${colors.texts.primary} mb-1 capitalize`}
              >
                {securityData?.status || "Secure"}
              </div>
              <div className={`text-xs ${colors.texts.muted}`}>
                {securityData?.metrics?.securityEvents || 0} events (24h)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Network Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Block Count",
            value: consensusMetrics?.metrics?.blockCount || 0,
            subtitle: "Total blocks",
            icon: CpuChipIcon,
            color: badgeColors.blue,
            link: "/expert/consensus",
          },
          {
            title: "Transactions",
            value: consensusMetrics?.metrics?.transactionCount || 0,
            subtitle: "Last 24 hours",
            icon: ChartBarIcon,
            color: badgeColors.green,
            link: "/expert/all-transactions",
          },
          {
            title: "Failed Transactions",
            value: faultStatus?.metrics?.failedTransactions || 0,
            subtitle: "Error tracking",
            icon: XCircleIcon,
            color: badgeColors.red,
            link: "/expert/fault-tolerance",
          },
          {
            title: "System Uptime",
            value: `${faultStatus?.metrics?.uptime || "0"}%`,
            subtitle: "Availability",
            icon: ServerIcon,
            color: badgeColors.green,
            link: "/expert/fault-tolerance",
          },
        ].map((stat, index) => (
          <Card
            key={stat.title || index}
            onClick={() => stat.link && router.push(stat.link)}
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

      {/* System Components Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consensus Health */}
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  Consensus Health
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  Network consensus and peer status
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
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Network State
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      {consensusStatus?.status || "Active"}
                    </div>
                  </div>
                </div>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  Online
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ServerIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Active Peers
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      {consensusStatus?.peers?.length || 0} connected
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-medium ${colors.texts.primary}`}>
                  {consensusStatus?.peers?.length || 0}
                </div>
              </div>
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
                      Block generation speed
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-medium ${colors.texts.primary}`}>
                  {consensusMetrics?.metrics?.avgBlockTime?.toFixed(2) || "0"}s
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  Security Status
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  Access control and security events
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/expert/security")}
                className={`text-xs rounded-none ${colors.buttons.ghost}`}
              >
                View Details
                <ArrowRightIcon className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
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
                <div className={`text-xs font-medium ${colors.texts.primary}`}>
                  {securityData?.metrics?.securityEvents || 0}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Failed Logins
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Authentication failures
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-medium ${colors.texts.primary}`}>
                  {securityData?.metrics?.failedLogins || 0}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-5 w-5" />
                  <div>
                    <div
                      className={`text-xs font-medium ${colors.texts.primary}`}
                    >
                      Active Users
                    </div>
                    <div className={`text-xs ${colors.texts.muted}`}>
                      Currently active
                    </div>
                  </div>
                </div>
                <div className={`text-xs font-medium ${colors.texts.primary}`}>
                  {securityData?.metrics?.activeUsers || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peer Nodes Status */}
      {consensusStatus?.peers && consensusStatus.peers.length > 0 && (
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle
                  className={`text-lg font-semibold ${colors.texts.primary}`}
                >
                  Network Peers
                </CardTitle>
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  Connected nodes and their status
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/expert/consensus")}
                className={`text-xs rounded-none ${colors.buttons.ghost}`}
              >
                View All
                <ArrowRightIcon className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={colors.tables.header}>
                    <TableHead className="text-xs font-semibold">
                      Peer Name
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
                  {consensusStatus.peers
                    .slice(0, 5)
                    .map((peer: any, index: number) => (
                      <TableRow
                        key={peer.id || index}
                        className={colors.tables.row}
                      >
                        <TableCell className="text-xs font-medium">
                          {peer.name || `Peer ${index + 1}`}
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
                            className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none flex items-center gap-1 w-fit`}
                          >
                            <CheckCircleIcon className="h-3 w-3" />
                            {peer.status || "online"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {peer.blockHeight?.toLocaleString() || "0"}
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
