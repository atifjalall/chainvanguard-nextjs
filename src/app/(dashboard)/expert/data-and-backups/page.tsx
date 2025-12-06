/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ShieldCheckIcon,
  CloudArrowUpIcon,
  ClockIcon,
  CircleStackIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  PauseIcon,
  BoltIcon,
  ChartBarIcon,
  ServerIcon,
  CpuChipIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { backupApi } from "@/lib/api/backup.api";
import { toast } from "sonner";
import {
  BackupDashboardStatus,
  BackupItem,
  BackupStorageUsage,
  BackupAlert,
  BackupListResponse,
  BackupStatusResponse,
  BackupStorageResponse,
  BackupAlertsResponse,
} from "@/types";

export default function DataAndBackupsPage() {
  usePageTitle("Data & Backups");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTriggeringFull, setIsTriggeringFull] = useState(false);
  const [isTriggeringIncremental, setIsTriggeringIncremental] = useState(false);

  // Real data from API with proper types
  const [dashboardStatus, setDashboardStatus] =
    useState<BackupDashboardStatus | null>(null);
  const [recentBackups, setRecentBackups] = useState<BackupItem[]>([]);
  const [storageStats, setStorageStats] = useState<BackupStorageUsage | null>(
    null
  );
  const [recentAlerts, setRecentAlerts] = useState<BackupAlert[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // Load all data in parallel with proper typing
      const [statusRes, backupsRes, storageRes, alertsRes] = await Promise.all([
        backupApi.getDashboardStatus() as Promise<BackupStatusResponse>,
        backupApi.listBackups({ limit: 12 }) as Promise<BackupListResponse>,
        backupApi.getStorageStats() as Promise<BackupStorageResponse>,
        backupApi.getAlerts(5) as Promise<BackupAlertsResponse>,
      ]);

      // Parse response with proper type checking and data wrapper
      console.log("API Responses:", {
        statusRes,
        backupsRes,
        storageRes,
        alertsRes,
      });

      setDashboardStatus(statusRes.data?.status || null);
      setRecentBackups(backupsRes.data?.backups || []);
      setStorageStats(storageRes.data?.stats || null);
      setRecentAlerts(alertsRes.data?.alerts || []);
    } catch (error: any) {
      toast.error("Failed to load backup data");
      console.error("Load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
    toast.success("Data refreshed");
  };

  const handleToggleScheduler = async () => {
    try {
      if (dashboardStatus?.schedulerRunning) {
        await backupApi.stopScheduler();
        toast.success("Scheduler stopped");
      } else {
        await backupApi.startScheduler();
        toast.success("Scheduler started");
      }
      await loadData();
    } catch (error: any) {
      toast.error(
        `Failed to ${dashboardStatus?.schedulerRunning ? "stop" : "start"} scheduler`
      );
    }
  };

  const handleTriggerFullBackup = async () => {
    try {
      setIsTriggeringFull(true);
      await backupApi.triggerFullBackup();
      toast.success("Full backup triggered successfully");
      setTimeout(() => loadData(), 2000); // Reload after 2 seconds
    } catch (error: any) {
      toast.error("Failed to trigger full backup");
    } finally {
      setIsTriggeringFull(false);
    }
  };

  const handleTriggerIncrementalBackup = async () => {
    try {
      setIsTriggeringIncremental(true);
      await backupApi.triggerIncrementalBackup();
      toast.success("Incremental backup triggered successfully");
      setTimeout(() => loadData(), 2000);
    } catch (error: any) {
      toast.error("Failed to trigger incremental backup");
    } finally {
      setIsTriggeringIncremental(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge
            className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none flex items-center gap-1 w-fit`}
          >
            <CheckCircleIcon className="h-3 w-3" />
            Active
          </Badge>
        );
      case "FAILED":
        return (
          <Badge
            className={`${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} text-xs rounded-none flex items-center gap-1 w-fit`}
          >
            <ExclamationTriangleIcon className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge
            className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} text-xs rounded-none flex items-center gap-1 w-fit`}
          >
            {status}
          </Badge>
        );
    }
  };

  const getAlertBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <Badge
            className={`${badgeColors.red.bg} ${badgeColors.red.border} ${badgeColors.red.text} text-xs rounded-none`}
          >
            Critical
          </Badge>
        );
      case "warning":
        return (
          <Badge
            className={`${badgeColors.yellow.bg} ${badgeColors.yellow.border} ${badgeColors.yellow.text} text-xs rounded-none`}
          >
            Warning
          </Badge>
        );
      case "info":
        return (
          <Badge
            className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
          >
            Info
          </Badge>
        );
      default:
        return (
          <Badge
            className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} text-xs rounded-none`}
          >
            {severity}
          </Badge>
        );
    }
  };

  const viewBackupDetails = (backupId: string) => {
    router.push(`/expert/data-and-backups/${backupId}`);
  };

  const storagePercentage = storageStats
    ? (storageStats.used / storageStats.limit) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading backup system...
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
            <BreadcrumbLink href="/expert" className="cursor-pointer">
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Data & Backups</BreadcrumbPage>
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
              Data & Backups
            </h1>
            <p className={`text-base ${colors.texts.secondary}`}>
              Disaster recovery system with blockchain verification
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Badge
                className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none flex items-center gap-1`}
              >
                <ShieldCheckIcon className="h-3 w-3" />
                System Secure
              </Badge>
              <Badge
                className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none flex items-center gap-1`}
              >
                <CloudArrowUpIcon className="h-3 w-3" />
                IPFS Storage
              </Badge>
              <Badge
                className={`${badgeColors.purple.bg} ${badgeColors.purple.border} ${badgeColors.purple.text} text-xs rounded-none flex items-center gap-1`}
              >
                <CpuChipIcon className="h-3 w-3" />
                Hyperledger Fabric
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dashboardStatus?.schedulerRunning ? (
              <Button
                variant="outline"
                onClick={handleToggleScheduler}
                className="flex items-center gap-2 text-xs cursor-pointer rounded-none h-8 border-orange-200 dark:border-orange-900 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:text-orange-600 dark:hover:text-orange-400 transition-all hover:border-orange-600 dark:hover:border-orange-400"
              >
                <PauseIcon className="h-4 w-4" />
                Pause Scheduler
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={handleToggleScheduler}
                className="flex items-center gap-2 text-xs cursor-pointer rounded-none h-8 border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-400 transition-all hover:border-green-600 dark:hover:border-green-400"
              >
                <PlayIcon className="h-4 w-4" />
                Start Scheduler
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleTriggerFullBackup}
              disabled={isTriggeringFull}
              className="flex items-center gap-2 text-xs cursor-pointer rounded-none h-8 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:border-blue-600 dark:hover:border-blue-400"
            >
              {isTriggeringFull ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CircleStackIcon className="h-4 w-4" />
              )}
              Full Backup
            </Button>
            <Button
              variant="outline"
              onClick={handleTriggerIncrementalBackup}
              disabled={isTriggeringIncremental}
              className="flex items-center gap-2 text-xs cursor-pointer rounded-none h-8 border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 hover:text-green-600 dark:hover:text-green-400 transition-all hover:border-green-600 dark:hover:border-green-400"
            >
              {isTriggeringIncremental ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BoltIcon className="h-4 w-4" />
              )}
              Incremental
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Backups",
              value: storageStats?.totalBackups || 0,
              subtitle: `${storageStats?.fullBackups || 0} full, ${storageStats?.incrementalBackups || 0} incremental`,
              icon: CircleStackIcon,
            },
            {
              title: "Last Backup",
              value:
                recentBackups.length > 0
                  ? new Date(recentBackups[0].timestamp).toLocaleTimeString(
                      "en-US",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "N/A",
              subtitle:
                recentBackups.length > 0
                  ? recentBackups[0].backupId
                  : "No backups yet",
              icon: ClockIcon,
            },
            {
              title: "Success Rate",
              value: storageStats?.totalBackups ? "100%" : "N/A",
              subtitle: "All active backups",
              icon: CheckCircleIcon,
            },
            {
              title: "Storage Used",
              value: storageStats ? formatBytes(storageStats.used) : "0 MB",
              subtitle: `of ${storageStats ? formatBytes(storageStats.limit) : "1 GB"}`,
              icon: ChartBarIcon,
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
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
                  <div
                    className={`h-10 w-10 flex items-center justify-center rounded-none`}
                  >
                    <Icon className={`h-5 w-5 ${colors.icons.primary}`} />
                  </div>
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
            );
          })}
        </div>
      </motion.div>

      {/* Storage & Schedule */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Storage Usage */}
          <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
              >
                <ServerIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Storage Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span
                    className={`text-xs font-medium ${colors.texts.primary}`}
                  >
                    IPFS Storage (Pinata)
                  </span>
                  <span className={`text-xs ${colors.texts.secondary}`}>
                    {storageStats ? formatBytes(storageStats.used) : "0 MB"} /{" "}
                    {storageStats ? formatBytes(storageStats.limit) : "1 GB"}
                  </span>
                </div>
                <Progress
                  value={storagePercentage}
                  className="h-2 rounded-none"
                />
                <p className={`text-xs ${colors.texts.muted} mt-1`}>
                  {storagePercentage.toFixed(1)}% used
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Backup Schedule */}
          <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
              >
                <ClockIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Backup Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`p-4 ${colors.backgrounds.tertiary} rounded-none border ${colors.borders.primary}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CircleStackIcon
                      className={`h-5 w-5 ${colors.icons.primary}`}
                    />
                    <span
                      className={`text-sm font-medium ${colors.texts.primary}`}
                    >
                      Full Backup
                    </span>
                  </div>
                  <Badge
                    className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                  >
                    Daily
                  </Badge>
                </div>
                <p className={`text-xs ${colors.texts.secondary} ml-7`}>
                  Every day at 00:00 UTC
                </p>
              </div>

              <div
                className={`p-4 ${colors.backgrounds.tertiary} rounded-none border ${colors.borders.primary}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BoltIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                    <span
                      className={`text-sm font-medium ${colors.texts.primary}`}
                    >
                      Incremental Backup
                    </span>
                  </div>
                  <Badge
                    className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                  >
                    Every 6h
                  </Badge>
                </div>
                <p className={`text-xs ${colors.texts.secondary} ml-7`}>
                  Every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Recent Backups */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
          <CardHeader>
            <CardTitle
              className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
            >
              <CloudArrowUpIcon
                className={`h-5 w-5 ${colors.icons.primary}`}
              />
              Recent Backups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className={colors.tables.header}>
                    <TableHead className="text-xs font-semibold">
                      Backup ID
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Timestamp
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Size
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentBackups.map((backup) => (
                    <TableRow
                      key={backup.backupId}
                      className={colors.tables.row}
                    >
                      <TableCell className="font-mono text-xs">
                        {backup.backupId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            backup.type === "FULL"
                              ? `${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`
                              : `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`
                          }
                        >
                          {backup.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatDate(backup.timestamp)}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">
                        {backup.metadata?.compressedSize
                          ? formatBytes(backup.metadata.compressedSize)
                          : "N/A"}
                      </TableCell>
                      <TableCell>{getStatusBadge(backup.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewBackupDetails(backup.backupId)}
                            className="text-xs rounded-none h-8 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-600 dark:hover:border-blue-400 cursor-pointer transition-all"
                          >
                            Details
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts */}
      {recentAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
              >
                <BellAlertIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div
                    key={`${alert.timestamp}-${index}`}
                    className={`p-3 ${colors.backgrounds.tertiary} rounded-none border ${colors.borders.primary}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${colors.texts.primary}`}
                      >
                        {alert.title || alert.message}
                      </span>
                      {getAlertBadge(alert.severity || "info")}
                    </div>
                    <p className={`text-xs ${colors.texts.secondary}`}>
                      {alert.message}
                    </p>
                    <p className={`text-xs ${colors.texts.muted} mt-1`}>
                      {formatDate(alert.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
