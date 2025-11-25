"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ShoppingCartIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  QrCodeIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { badgeColors, colors } from "@/lib/colorConstants";
import { toast } from "sonner";
import { usePageTitle } from "@/hooks/use-page-title";
import { QRCodeSVG } from "qrcode.react";

interface TrackingData {
  type: "inventory" | "product";
  inventory?: {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    supplier: {
      id: string;
      name: string;
      walletAddress: string;
    };
    totalQuantity: number;
    currentQuantity: number;
    reservedQuantity: number;
    committedQuantity: number;
    damagedQuantity: number;
    unit: string;
    pricePerUnit: number;
    images: Array<{ url: string; isMain?: boolean }>;
    status: string;
    blockchainVerified: boolean;
    blockchainInventoryId: string;
  };
  product?: {
    id: string;
    name: string;
    description: string;
    category: string;
    subcategory: string;
    price: number;
    images: Array<{ url: string; isMain?: boolean }>;
    sku: string;
    vendor: {
      id: string;
      name: string;
      companyName: string;
      walletAddress: string;
    };
    manufacturedDate: string;
    status: string;
    totalSold: number;
    blockchainVerified: boolean;
    blockchainProductId: string;
  };
  transfers?: Array<{
    type?: string;
    to: string;
    toId: string;
    from: string;
    fromId: string;
    quantity: number;
    unit: string;
    date: string;
    blockchainTx?: string;
    verified?: boolean;
    notes?: string;
  }>;
  currentOwners?: Array<{
    owner: string;
    ownerId: string;
    role: string;
    quantity: number;
    unit: string;
    received?: number;
    used?: number;
  }>;
  materialsUsed?: Array<{
    materialName: string;
    supplier: string;
    supplierId: string;
    quantityUsed: number;
    unit: string;
    addedAt: string;
    inventoryQRCode?: string;
    canScanInventoryQR: boolean;
  }>;
  blockchainHistory?: Array<{
    type?: string;
    event?: string;
    action: string;
    date: string;
    performedBy: string;
    txHash?: string;
    status: string;
    data?: Record<string, unknown>;
  }>;
  salesHistory?: Array<{
    orderNumber: string;
    customer: string;
    quantity: number;
    amount: number;
    status: string;
    date: string;
  }>;
  authenticity?: string;
  qrInfo: {
    code: string;
    scanCount: number;
    createdAt: string;
  };
}

const TrackingPage = () => {
  usePageTitle("QR Tracking");
  const params = useParams();
  const router = useRouter();
  const qrCode = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const baseUrl = apiBaseUrl.endsWith("/api") ? apiBaseUrl : `${apiBaseUrl}/api`;

        const isInventoryQR = qrCode.includes("INVENTORY");
        const isProductQR = qrCode.includes("PRODUCT");

        let response;

        if (isInventoryQR) {
          response = await fetch(`${baseUrl}/qr/track/inventory/${qrCode}`);
          if (!response.ok && !isProductQR) {
            response = await fetch(`${baseUrl}/qr/track/product/${qrCode}/enhanced`);
          }
        } else {
          response = await fetch(`${baseUrl}/qr/track/product/${qrCode}/enhanced`);
          if (!response.ok) {
            response = await fetch(`${baseUrl}/qr/track/inventory/${qrCode}`);
          }
        }

        const result = await response.json();

        if (!result.success) {
          setError(result.message || "Failed to load tracking data");
          return;
        }

        const trackingData: TrackingData = {
          type: result.data.inventory ? "inventory" : "product",
          ...result.data,
        };

        setData(trackingData);
        setTimeout(() => setIsVisible(true), 100);
      } catch (err) {
        console.error("Error fetching tracking data:", err);
        setError(err instanceof Error ? err.message : "An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    if (qrCode) {
      fetchTrackingData();
    }
  }, [qrCode]);

  const handleCopyHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      toast.success("Hash copied to clipboard");
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy hash");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="h-12 w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className={`text-sm ${colors.texts.secondary}`}>Loading tracking data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <Card className={`${colors.cards.base} max-w-md mx-auto rounded-none shadow-none`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
              <CardTitle className={colors.texts.primary}>Tracking Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${colors.texts.secondary} mb-4`}>
              {error || "No data available"}
            </p>
            <Button
              onClick={() => router.back()}
              className={`${colors.buttons.primary} rounded-none shadow-none text-xs px-4 py-2 cursor-pointer`}
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const entity = data.type === "inventory" ? data.inventory! : data.product!;
  const mainImage = entity.images?.find((img) => img.isMain)?.url || entity.images?.[0]?.url;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative z-10 p-4 md:p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                {data.type === "inventory" ? "Inventory Tracking" : "Product Tracking"}
              </h1>
              <p className={`text-sm ${colors.texts.secondary}`}>
                QR Code: <span className="font-mono">{data.qrInfo.code}</span>
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} flex items-center gap-1 text-xs rounded-none`}
                >
                  <ShieldCheckIcon className={`h-3 w-3 ${badgeColors.cyan.icon}`} />
                  {entity.blockchainVerified ? "Blockchain Verified" : "Verification Pending"}
                </Badge>
                <Badge
                  className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                >
                  Scanned {data.qrInfo.scanCount} times
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Entity Details */}
              <Card className={`${colors.cards.base} rounded-none shadow-none`}>
                <CardHeader className="px-6 pb-0">
                  <div className="flex items-start gap-4">
                    {mainImage && (
                      <div className="relative w-24 h-24 rounded-none overflow-hidden shrink-0">
                        <Image src={mainImage} alt={entity.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className={`text-2xl ${colors.texts.primary}`}>
                        {entity.name}
                      </CardTitle>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <Badge
                          className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                        >
                          {entity.category}
                        </Badge>
                        <Badge
                          className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                        >
                          {entity.subcategory}
                        </Badge>
                        {data.type === "product" && data.product?.sku && (
                          <Badge
                            className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} text-xs rounded-none`}
                          >
                            SKU: {data.product.sku}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent className="px-6 pt-0">
                  <p
                    className={`text-sm ${colors.texts.secondary} leading-relaxed`}
                    style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}
                  >
                    {entity.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {data.type === "inventory" ? (
                      <>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Supplier</p>
                          <p className={`font-medium ${colors.texts.primary}`}>
                            {data.inventory!.supplier.name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Price per Unit</p>
                          <p className={`font-medium ${colors.texts.primary}`}>
                            {data.inventory!.pricePerUnit} CVT
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Total Quantity</p>
                          <p className={`font-medium ${colors.texts.primary}`}>
                            {data.inventory!.totalQuantity} {data.inventory!.unit}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Current Quantity</p>
                          <p className={`font-medium text-lg ${colors.texts.primary}`}>
                            {data.inventory!.currentQuantity} {data.inventory!.unit}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Vendor</p>
                          <p className={`font-medium ${colors.texts.primary}`}>
                            {data.product!.vendor.name}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Price</p>
                          <p className={`font-medium text-lg ${colors.texts.primary}`}>
                            {data.product!.price} CVT
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Manufactured</p>
                          <p className={`font-medium ${colors.texts.primary}`}>
                            {new Date(data.product!.manufacturedDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.secondary}`}>Total Sold</p>
                          <p className={`font-medium ${colors.texts.primary}`}>
                            {data.product!.totalSold} units
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  {(data.inventory?.blockchainInventoryId ||
                    data.product?.blockchainProductId) && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-none">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-xs ${colors.texts.secondary} mb-1`}>
                            Blockchain ID
                          </p>
                          <code className={`text-xs font-mono ${colors.texts.primary}`}>
                            {data.inventory?.blockchainInventoryId ||
                              data.product?.blockchainProductId}
                          </code>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleCopyHash(
                              data.inventory?.blockchainInventoryId ||
                                data.product?.blockchainProductId ||
                                ""
                            )
                          }
                          className="p-2 h-8 w-8"
                        >
                          {isCopied ? (
                            <CheckIcon className="h-4 w-4" />
                          ) : (
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transfer History */}
              {data.transfers && data.transfers.length > 0 && (
                <Card className={`${colors.cards.base} rounded-none shadow-none`}>
                  <CardHeader className="px-6 pb-0">
                    <CardTitle className={`flex items-center gap-3 text-base ${colors.texts.primary}`}>
                      <ArrowPathIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                      Transfer History
                    </CardTitle>
                  </CardHeader>
                  <Separator className="my-4" />
                  <CardContent className="px-6 pt-0">
                    <div className="space-y-4">
                      {data.transfers.map((transfer, index) => {
                        // Fallback logic for 'from' field
                        const fromName = transfer.from ||
                          (data.type === "inventory" && data.inventory?.supplier.name) ||
                          (data.type === "product" && data.product?.vendor.name) ||
                          "Unknown";

                        return (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-4 ${colors.backgrounds.tertiary} rounded-none ${colors.borders.primary}`}
                        >
                          <div
                            className={`mt-1 p-2 rounded-none ${
                              transfer.type === "used_in_production"
                                ? "bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                                : transfer.verified
                                ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            <ArrowRightIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs ${colors.texts.secondary}`}>From:</span>
                                <span className={`text-xs ${colors.texts.primary}`}>
                                  {fromName}
                                </span>
                                <ArrowRightIcon className="h-4 w-4 text-gray-400 mx-1" />
                                <span className={`text-xs ${colors.texts.secondary}`}>To:</span>
                                <span className={`text-xs ${colors.texts.primary}`}>
                                  {transfer.to}
                                </span>
                              </div>
                              <Badge
                                className={`${
                                  transfer.verified
                                    ? `${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text}`
                                    : `${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text}`
                                } text-xs rounded-none`}
                              >
                                {transfer.verified ? "Verified" : "Pending"}
                              </Badge>
                            </div>
                            <p className={`text-sm ${colors.texts.secondary} mt-1`}>
                              {transfer.quantity} {transfer.unit}
                              {transfer.type === "used_in_production" &&
                                " used in production"}
                            </p>
                            <p className={`text-xs ${colors.texts.muted} mt-1`}>
                              {new Date(transfer.date).toLocaleString()}
                            </p>
                            {transfer.blockchainTx && (
                              <p className={`text-xs font-mono ${colors.texts.muted} mt-1`}>
                                TX: {transfer.blockchainTx.substring(0, 16)}...
                              </p>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Materials Used (Product only) */}
              {data.materialsUsed && data.materialsUsed.length > 0 && (
                <Card className={`${colors.cards.base} rounded-none shadow-none`}>
                  <CardHeader className="px-6 pb-0">
                    <CardTitle className={`flex items-center gap-3 text-base ${colors.texts.primary}`}>
                      <CubeIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                      Materials Used
                    </CardTitle>
                  </CardHeader>
                  <Separator className="my-4" />
                  <CardContent className="px-6 pt-0">
                    <div className="space-y-3">
                      {data.materialsUsed.map((material, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 ${colors.backgrounds.tertiary} rounded-none ${colors.borders.primary}`}
                        >
                          <div className="flex-1">
                            <p className={`font-medium ${colors.texts.primary}`}>
                              {material.materialName}
                            </p>
                            <p className={`text-sm ${colors.texts.secondary}`}>
                              Supplier: {material.supplier}
                            </p>
                            <p className={`text-sm ${colors.texts.secondary}`}>
                              Quantity: {material.quantityUsed} {material.unit}
                            </p>
                          </div>
                          {material.canScanInventoryQR && material.inventoryQRCode && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                router.push(`/track/inventory/${material.inventoryQRCode}`)
                              }
                              className={`text-xs cursor-pointer h-8 ${colors.borders.primary} rounded-none`}
                            >
                              View Source
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sales History (Product only) */}
              {data.salesHistory && data.salesHistory.length > 0 && (
                <Card className={`${colors.cards.base} rounded-none shadow-none`}>
                  <CardHeader className="px-6 pb-0">
                    <CardTitle className={`flex items-center gap-3 text-base ${colors.texts.primary}`}>
                      <ShoppingCartIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                      Sales History
                    </CardTitle>
                  </CardHeader>
                  <Separator className="my-4" />
                  <CardContent className="px-6 pt-0">
                    <div className="space-y-3">
                      {data.salesHistory.map((sale, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 ${colors.backgrounds.tertiary} rounded-none ${colors.borders.primary}`}
                        >
                          <div>
                            <p className={`font-medium ${colors.texts.primary}`}>
                              Order #{sale.orderNumber}
                            </p>
                            <p className={`text-sm ${colors.texts.secondary}`}>
                              Customer: {sale.customer}
                            </p>
                            <p className={`text-xs ${colors.texts.muted}`}>
                              {new Date(sale.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${colors.texts.primary}`}>
                              {sale.amount} CVT
                            </p>
                            <p className={`text-sm ${colors.texts.secondary}`}>
                              Qty: {sale.quantity}
                            </p>
                            <Badge
                              className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} mt-1 text-xs rounded-none`}
                            >
                              {sale.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Blockchain History */}
              {data.blockchainHistory && data.blockchainHistory.length > 0 && (
                <Card className={`${colors.cards.base} rounded-none shadow-none`}>
                  <CardHeader className="px-6 pb-0">
                    <CardTitle className={`flex items-center gap-3 text-base ${colors.texts.primary}`}>
                      <ShieldCheckIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                      Blockchain History
                    </CardTitle>
                  </CardHeader>
                  <Separator className="my-4" />
                  <CardContent className="px-6 pt-0">
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {data.blockchainHistory.map((log, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-3 p-3 ${colors.backgrounds.tertiary} rounded-none ${colors.borders.primary}`}
                        >
                          <div
                            className={`mt-1 p-1.5 rounded-none ${
                              log.status === "success"
                                ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                                : log.status === "failed"
                                ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                                : "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
                            }`}
                          >
                            {log.status === "success" ? (
                              <CheckCircleIcon className="h-3 w-3" />
                            ) : log.status === "failed" ? (
                              <XCircleIcon className="h-3 w-3" />
                            ) : (
                              <ClockIcon className="h-3 w-3" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${colors.texts.primary}`}>
                              {log.action}
                            </p>
                            <p className={`text-xs ${colors.texts.secondary}`}>
                              By {log.performedBy} •{" "}
                              {new Date(log.date).toLocaleString()}
                            </p>
                            {log.txHash && (
                              <p className={`text-xs font-mono ${colors.texts.muted} mt-1`}>
                                {log.txHash.substring(0, 20)}...
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Current Owners */}
              {data.currentOwners && data.currentOwners.length > 0 && (
                <Card className={`${colors.cards.base} rounded-none shadow-none`}>
                  <CardHeader className="px-6 pb-0">
                    <CardTitle className={`flex items-center gap-3 text-base ${colors.texts.primary}`}>
                      <UserGroupIcon className={`h-5 w-5 ${colors.icons.primary}`} />
                      Current Owners
                    </CardTitle>
                  </CardHeader>
                  <Separator className="my-4" />
                  <CardContent className="px-6 pt-0">
                    <div className="space-y-3">
                      {data.currentOwners.map((owner, index) => (
                        <div
                          key={index}
                          className={`p-3 ${colors.backgrounds.tertiary} rounded-none ${colors.borders.primary}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className={`font-medium ${colors.texts.primary}`}>
                              {owner.owner}
                            </p>
                            <Badge
                              className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                            >
                              {owner.role}
                            </Badge>
                          </div>
                          <p className={`text-sm ${colors.texts.secondary}`}>
                            {owner.quantity} {owner.unit}
                          </p>
                          {owner.received !== undefined && (
                            <p className={`text-xs ${colors.texts.muted}`}>
                              Received: {owner.received} {owner.unit}
                            </p>
                          )}
                          {owner.used !== undefined && owner.used > 0 && (
                            <p className={`text-xs ${colors.texts.muted}`}>
                              Used: {owner.used} {owner.unit}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Statistics */}
              <Card className={`${colors.cards.base} rounded-none shadow-none`}>
                <CardHeader className="px-6 pb-0">
                  <CardTitle className={`text-base ${colors.texts.primary}`}>
                    Statistics
                  </CardTitle>
                </CardHeader>
                <Separator className="my-4" />
                <CardContent className="px-6 pt-0 space-y-3">
                  {data.type === "inventory" && data.inventory && (
                    <>
                      <div className="flex justify-between">
                        <span className={`text-sm ${colors.texts.secondary}`}>Available Value</span>
                        <span className={`font-medium ${colors.texts.primary}`}>
                          {(
                            data.inventory.currentQuantity * data.inventory.pricePerUnit
                          ).toFixed(2)}{" "}
                          CVT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${colors.texts.secondary}`}>Total Value</span>
                        <span className={`font-medium ${colors.texts.primary}`}>
                          {(
                            data.inventory.totalQuantity * data.inventory.pricePerUnit
                          ).toFixed(2)}{" "}
                          CVT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${colors.texts.secondary}`}>Distributed</span>
                        <span className={`font-medium ${colors.texts.primary}`}>
                          {data.currentOwners && data.currentOwners.length > 1
                            ? `${data.currentOwners.length - 1} vendors`
                            : "Not distributed"}
                        </span>
                      </div>
                    </>
                  )}
                  {data.type === "product" && data.product && (
                    <>
                      <div className="flex justify-between">
                        <span className={`text-sm ${colors.texts.secondary}`}>Total Revenue</span>
                        <span className={`font-medium ${colors.texts.primary}`}>
                          {(data.product.totalSold * data.product.price).toFixed(2)} CVT
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${colors.texts.secondary}`}>Sales Count</span>
                        <span className={`font-medium ${colors.texts.primary}`}>
                          {data.salesHistory?.length || 0}
                        </span>
                      </div>
                    </>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className={`text-sm ${colors.texts.secondary}`}>Transfers</span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      {data.transfers?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${colors.texts.secondary}`}>
                      Blockchain Records
                    </span>
                    <span className={`font-medium ${colors.texts.primary}`}>
                      {data.blockchainHistory?.length || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
