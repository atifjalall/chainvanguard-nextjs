/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CircleStackIcon,
  CloudArrowUpIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  BoltIcon,
  ChartBarIcon,
  CloudArrowDownIcon,
} from "@heroicons/react/24/outline";
import { badgeColors, colors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { backupApi } from "@/lib/api/backup.api";

export default function BackupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const backupId = params?.id as string;

  usePageTitle(`Backup: ${backupId}`);

  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [backup, setBackup] = useState<any>(null);

  useEffect(() => {
    if (backupId) {
      loadBackupDetails();
    }
  }, [backupId]);

  const loadBackupDetails = async () => {
    try {
      setIsLoading(true);
      const response = (await backupApi.getBackupDetails(backupId)) as any;
      setBackup(response.data.backup);
    } catch (error: any) {
      toast.error("Failed to load backup details");
      console.error("Load error:", error);
    } finally {
      setIsLoading(false);
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
      second: "2-digit",
    });
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success(`\${label} copied to clipboard`);
      setTimeout(() => setCopiedText(null), 3000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await backupApi.restoreBackup(backupId);
      toast.success("Backup restored successfully");
      setShowRestoreDialog(false);
      await loadBackupDetails(); // Reload backup details after restore
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to restore backup");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await backupApi.verifyBackup(backupId);
      toast.success("Backup verified successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to verify backup");
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading backup details...
          </p>
        </div>
      </div>
    );
  }

  if (!backup) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Backup not found
          </p>
          <Button
            onClick={() => router.push("/expert/data-and-backups")}
            className="mt-4"
          >
            Go Back
          </Button>
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
            <BreadcrumbLink
              href="/expert/data-and-backups"
              className="cursor-pointer"
            >
              Data & Backups
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{backup.backupId}</BreadcrumbPage>
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
              {backup.backupId}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge
                className={
                  backup.type === "FULL"
                    ? `${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`
                    : `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`
                }
              >
                {backup.type}
              </Badge>
              <Badge
                className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none flex items-center gap-1`}
              >
                <CheckCircleIcon className="h-3 w-3" />
                {backup.status}
              </Badge>
              <Badge
                className={`${badgeColors.purple.bg} ${badgeColors.purple.border} ${badgeColors.purple.text} text-xs rounded-none`}
              >
                {backup.triggeredBy || "SYSTEM"}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleVerify}
              disabled={isVerifying}
              className={`flex items-center gap-2 text-xs cursor-pointer rounded-none h-8 border ${colors.buttons.secondary} hover:border-black dark:hover:border-white transition-all`}
            >
              {isVerifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheckIcon
                  className={`h-4 w-4 ${colors.icons.primary}`}
                />
              )}
              Verify
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(true)}
              className="flex items-center gap-2 text-xs cursor-pointer rounded-none h-8 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
            >
              <CloudArrowDownIcon className="h-4 w-4" />
              Restore
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Documents",
              value: backup.metadata?.totalDocuments?.toLocaleString() || "N/A",
              subtitle: "Total backed up",
              icon: CircleStackIcon,
            },
            {
              title: "Compressed Size",
              value: backup.metadata?.compressedSize
                ? formatBytes(backup.metadata.compressedSize)
                : "N/A",
              subtitle:
                backup.metadata?.compressedSize &&
                backup.metadata?.uncompressedSize
                  ? `${((1 - backup.metadata.compressedSize / backup.metadata.uncompressedSize) * 100).toFixed(1)}% reduction`
                  : "Compressed",
              icon: CloudArrowUpIcon,
            },
            {
              title: "Backup Date",
              value: new Date(backup.timestamp).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              subtitle: new Date(backup.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
              icon: ClockIcon,
            },
            {
              title: "Collections",
              value: backup.metadata?.collections
                ? Object.keys(backup.metadata.collections).length
                : 0,
              subtitle: "Database collections",
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
                  <Icon className={`h-5 w-5 ${colors.icons.primary}`} />
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

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
              >
                <BoltIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Backup Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary}`}
                  >
                    Backup ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-sm font-mono ${colors.texts.primary}`}>
                      {backup.backupId}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(backup.backupId, "Backup ID")
                      }
                      className="rounded-none p-1"
                    >
                      {copiedText === backup.backupId ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary}`}
                  >
                    IPFS CID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <p
                      className={`text-sm font-mono ${colors.texts.primary} truncate`}
                    >
                      {backup.cid}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(backup.cid, "CID")}
                      className="rounded-none p-1"
                    >
                      {copiedText === backup.cid ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                {backup.txId && (
                  <div>
                    <label
                      className={`text-xs font-medium ${colors.texts.secondary}`}
                    >
                      Blockchain TX
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={`text-sm font-mono ${colors.texts.primary} truncate`}
                      >
                        {backup.txId}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(backup.txId, "TX ID")}
                        className="rounded-none p-1"
                      >
                        {copiedText === backup.txId ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary}`}
                  >
                    Created At
                  </label>
                  <p className={`text-sm ${colors.texts.primary} mt-1`}>
                    {formatDate(backup.timestamp)}
                  </p>
                </div>
                <div>
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary}`}
                  >
                    Triggered By
                  </label>
                  <p className={`text-sm ${colors.texts.primary} mt-1`}>
                    {backup.triggeredBy || "SYSTEM"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${colors.cards.base} rounded-none !shadow-none`}>
            <CardHeader>
              <CardTitle
                className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
              >
                <CpuChipIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                Storage Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {backup.metadata?.uncompressedSize && (
                  <div>
                    <label
                      className={`text-xs font-medium ${colors.texts.secondary}`}
                    >
                      Original Size
                    </label>
                    <p className={`text-sm ${colors.texts.primary} mt-1`}>
                      {formatBytes(backup.metadata.uncompressedSize)}
                    </p>
                  </div>
                )}
                {backup.metadata?.compressedSize && (
                  <div>
                    <label
                      className={`text-xs font-medium ${colors.texts.secondary}`}
                    >
                      Compressed Size
                    </label>
                    <p className={`text-sm ${colors.texts.primary} mt-1`}>
                      {formatBytes(backup.metadata.compressedSize)}
                    </p>
                  </div>
                )}
                {backup.metadata?.compressedSize &&
                  backup.metadata?.uncompressedSize && (
                    <div>
                      <label
                        className={`text-xs font-medium ${colors.texts.secondary}`}
                      >
                        Compression Ratio
                      </label>
                      <p className={`text-sm ${colors.texts.primary} mt-1`}>
                        {(
                          (1 -
                            backup.metadata.compressedSize /
                              backup.metadata.uncompressedSize) *
                          100
                        ).toFixed(1)}
                        % reduction
                      </p>
                    </div>
                  )}
                {backup.pinataId && (
                  <div>
                    <label
                      className={`text-xs font-medium ${colors.texts.secondary}`}
                    >
                      Pinata ID
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <p
                        className={`text-sm font-mono ${colors.texts.primary}`}
                      >
                        {backup.pinataId}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(backup.pinataId, "Pin ID")
                        }
                        className="rounded-none p-1"
                      >
                        {copiedText === backup.pinataId ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <ClipboardDocumentIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <label
                    className={`text-xs font-medium ${colors.texts.secondary}`}
                  >
                    Gateway URL
                  </label>
                  <a
                    href={`https://gateway.pinata.cloud/ipfs/${backup.cid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 mt-1 block truncate"
                  >
                    https://gateway.pinata.cloud/ipfs/{backup.cid}
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Collections */}
      {backup.metadata?.collections && (
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
                <CircleStackIcon
                  className={`h-5 w-5 ${colors.icons.primary}`}
                />
                Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(backup.metadata.collections).map(
                  ([name, data]: [string, any]) => (
                    <div
                      key={name}
                      className={`p-4 ${colors.backgrounds.tertiary} rounded-none border ${colors.borders.primary}`}
                    >
                      <h4
                        className={`text-sm font-semibold ${colors.texts.primary} mb-2 capitalize`}
                      >
                        {name}
                      </h4>
                      <div className="space-y-1">
                        {data.count !== undefined && (
                          <div className="flex justify-between items-center">
                            <span
                              className={`text-xs ${colors.texts.secondary}`}
                            >
                              Documents
                            </span>
                            <span
                              className={`text-xs font-medium ${colors.texts.primary}`}
                            >
                              {data.count?.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {data.size !== undefined && (
                          <div className="flex justify-between items-center">
                            <span
                              className={`text-xs ${colors.texts.secondary}`}
                            >
                              Size
                            </span>
                            <span
                              className={`text-xs font-medium ${colors.texts.primary}`}
                            >
                              {formatBytes(data.size)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Restore Dialog */}
      <AlertDialog
        open={showRestoreDialog}
        onOpenChange={(open) => {
          if (!isRestoring) {
            setShowRestoreDialog(open);
          }
        }}
      >
        <AlertDialogContent className={`${colors.cards.base} rounded-none`}>
          <AlertDialogHeader>
            <AlertDialogTitle
              className={`text-lg font-semibold ${colors.texts.primary}`}
            >
              Restore Backup
            </AlertDialogTitle>
            <AlertDialogDescription
              className={`text-xs ${colors.texts.secondary}`}
            >
              This will restore the database from this backup. This action
              cannot be undone. All current data will be replaced with the
              backup data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-none">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className={`text-sm font-medium ${colors.texts.primary}`}>
                  Warning: Data Loss Risk
                </p>
                <p className={`text-xs ${colors.texts.secondary} mt-1`}>
                  Make sure you have a recent backup before proceeding.
                </p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isRestoring}
              className="rounded-none text-xs cursor-pointer h-8 hover:border-black dark:hover:border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleRestore}
              disabled={isRestoring}
              className="flex items-center gap-2 text-xs cursor-pointer rounded-none h-8 bg-transparent border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:border-blue-600 dark:hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>Restore Backup</>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
