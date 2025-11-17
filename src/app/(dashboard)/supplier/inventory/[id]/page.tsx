/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArchiveBoxIcon,
  PencilSquareIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClockIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  SwatchIcon,
  CalendarIcon,
  XCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { badgeColors, colors } from "@/lib/colorConstants";
import { getInventoryDetail, deleteInventory } from "@/lib/api/inventory.api";

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  materialType: string;
  sku: string;
  status: string;
  quantity: number;
  reservedQuantity: number;
  committedQuantity: number;
  damagedQuantity: number;
  availableQuantity: number;
  minStockLevel: number;
  reorderLevel: number;
  reorderQuantity: number;
  maximumQuantity: number;
  safetyStockLevel: number;
  unit: string;
  pricePerUnit: number;
  costPrice: number;
  originalPrice: number;
  discount: string;
  currency: string;
  totalValue: number;
  images: string[] | Array<{ url: string }>;
  textileDetails: {
    fabricType: string;
    composition: string;
    gsm: string;
    width: string;
    fabricWeight: string;
    color: string;
    colorCode: string;
    pattern: string;
    finish: string;
    careInstructions: string;
    shrinkage: string;
    washability: string;
  };
  supplier: {
    name: string;
    contact: {
      phone: string;
      email: string;
      address: string;
    };
  };
  certifications: string[];
  sustainabilityCertifications: string[];
  complianceStandards: string[];
  qualityGrade: string;
  countryOfOrigin: string;
  manufacturer: string;
  leadTime: string;
  estimatedDeliveryDays: string;
  shelfLife: string;
  tags: string[];
  season: string;
  weight: string;
  dimensions: string;
  notes: string;
  internalCode: string;
  barcode: string;
  carbonFootprint: string;
  recycledContent: string;
  autoReorderEnabled: boolean;
  isBatchTracked: boolean;
  isSustainable: boolean;
  warehouseLocation: string;
  storageLocations: Array<{
    warehouse: string;
    zone?: string;
    aisle?: string;
    rack?: string;
    bin?: string;
    quantityAtLocation: number;
  }>;
  specifications: {
    grade?: string;
    thickness?: string;
    density?: string;
    tensileStrength?: string;
    durability?: string;
    washability?: string;
    breathability?: string;
    stretchability?: string;
  };
  suitableFor: string[];
  manufactureDate: string | Date;
  expiryDate: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastRestocked: string | Date;
  qrCode: string;
  qrCodeImageUrl: string;
  qrCodeGenerated: boolean;
  totalScans: number;
  ipfsHash: string;
  blockchainInventoryId?: string;
  qrMetadata?: {
    generatedAt?: string | Date;
    generatedBy?: string;
    ipfsHash?: string;
    cloudinaryUrl?: string;
    trackingUrl?: string;
  };
};

export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params?.id as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(
    null
  );

  // Add constants for consistent spacing
  const CARD_HEADER_PADDING = "px-6 pb-0";
  const CARD_CONTENT_PADDING = "px-6 pt-0";

  // Helper function to get image URL as string
  const getImageUrl = (
    image: string | { url: string },
    index: number
  ): string => {
    if (typeof image === "string") return image;
    return image.url || "";
  };

  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!inventoryId) return;

      setIsLoading(true);
      try {
        const response = await getInventoryDetail(inventoryId);
        const inventoryData = response.data;

        // Transform the backend data to match frontend structure
        const transformedData: InventoryItem = {
          id: inventoryData._id || inventoryData.id || inventoryId,
          name: inventoryData.name,
          description: inventoryData.description,
          category: inventoryData.category,
          subcategory: inventoryData.subcategory,
          materialType: inventoryData.materialType || "",
          sku: inventoryData.sku,
          status: inventoryData.status,
          quantity: inventoryData.quantity,
          reservedQuantity: inventoryData.reservedQuantity || 0,
          committedQuantity: inventoryData.committedQuantity || 0,
          damagedQuantity: inventoryData.damagedQuantity || 0,
          availableQuantity:
            inventoryData.quantity -
            (inventoryData.reservedQuantity || 0) -
            (inventoryData.committedQuantity || 0) -
            (inventoryData.damagedQuantity || 0),
          minStockLevel: inventoryData.minStockLevel,
          reorderLevel: inventoryData.reorderLevel,
          reorderQuantity: inventoryData.reorderQuantity,
          maximumQuantity: inventoryData.maximumQuantity || 0,
          safetyStockLevel: inventoryData.safetyStockLevel || 0,
          unit: inventoryData.unit,
          pricePerUnit: inventoryData.pricePerUnit,
          costPrice: inventoryData.costPrice || inventoryData.pricePerUnit,
          originalPrice:
            inventoryData.originalPrice || inventoryData.pricePerUnit,
          discount: inventoryData.discount?.toString() || "0",
          currency: inventoryData.currency,
          totalValue: inventoryData.quantity * inventoryData.pricePerUnit,
          images: Array.isArray(inventoryData.images)
            ? inventoryData.images
                .map((img: any) =>
                  typeof img === "string"
                    ? img
                    : img.url || img.cloudinaryUrl || ""
                )
                .filter(Boolean)
            : [],
          textileDetails: {
            fabricType: inventoryData.textileDetails?.fabricType || "",
            composition: inventoryData.textileDetails?.composition || "",
            gsm: inventoryData.textileDetails?.gsm?.toString() || "",
            width: inventoryData.textileDetails?.width?.toString() || "",
            fabricWeight: inventoryData.textileDetails?.fabricWeight || "",
            color: inventoryData.textileDetails?.color || "",
            colorCode: inventoryData.textileDetails?.colorCode || "",
            pattern: inventoryData.textileDetails?.pattern || "",
            finish: inventoryData.textileDetails?.finish || "",
            careInstructions:
              inventoryData.textileDetails?.careInstructions || "",
            shrinkage: inventoryData.textileDetails?.shrinkage || "",
            washability: inventoryData.textileDetails?.washability || "",
          },
          supplier: {
            name:
              typeof inventoryData.supplierId === "object"
                ? inventoryData.supplierId?.name ||
                  inventoryData.supplierId?.companyName ||
                  "N/A"
                : inventoryData.supplierName || "N/A",
            contact: {
              phone: inventoryData.supplierContact?.phone || "",
              email: inventoryData.supplierContact?.email || "",
              address: inventoryData.supplierContact?.address || "",
            },
          },
          certifications: inventoryData.certifications || [],
          sustainabilityCertifications:
            inventoryData.sustainabilityCertifications || [],
          complianceStandards: inventoryData.complianceStandards || [],
          qualityGrade: inventoryData.qualityGrade || "",
          countryOfOrigin: inventoryData.countryOfOrigin || "",
          manufacturer: inventoryData.manufacturer || "",
          leadTime: inventoryData.leadTime?.toString() || "0",
          estimatedDeliveryDays:
            inventoryData.estimatedDeliveryDays?.toString() || "0",
          shelfLife: inventoryData.shelfLife?.toString() || "",
          tags: inventoryData.tags || [],
          season: inventoryData.season || "",
          weight: inventoryData.weight?.toString() || "",
          dimensions: inventoryData.dimensions
            ? typeof inventoryData.dimensions === "string"
              ? inventoryData.dimensions
              : JSON.stringify(inventoryData.dimensions)
            : "",
          notes: inventoryData.notes || "",
          internalCode: inventoryData.internalCode || "",
          barcode: inventoryData.barcode || "",
          carbonFootprint: inventoryData.carbonFootprint?.toString() || "",
          recycledContent: inventoryData.recycledContent?.toString() || "",
          autoReorderEnabled: inventoryData.autoReorderEnabled || false,
          isBatchTracked: inventoryData.isBatchTracked || false,
          isSustainable: inventoryData.isSustainable || false,
          warehouseLocation:
            inventoryData.primaryLocation ||
            inventoryData.warehouseLocation ||
            "",
          storageLocations: (inventoryData.storageLocations || []).map(
            (loc: any) => ({
              warehouse: loc.warehouse,
              zone: loc.zone,
              aisle: loc.aisle,
              rack: loc.rack,
              bin: loc.bin,
              quantityAtLocation: loc.quantityAtLocation,
            })
          ),
          specifications: inventoryData.specifications || {},
          suitableFor: inventoryData.suitableFor || [],
          manufactureDate: inventoryData.batches?.[0]?.manufactureDate
            ? typeof inventoryData.batches[0].manufactureDate === "string"
              ? inventoryData.batches[0].manufactureDate
              : new Date(inventoryData.batches[0].manufactureDate).toISOString()
            : inventoryData.manufactureDate
              ? typeof inventoryData.manufactureDate === "string"
                ? inventoryData.manufactureDate
                : new Date(inventoryData.manufactureDate).toISOString()
              : "",
          expiryDate: inventoryData.batches?.[0]?.expiryDate
            ? typeof inventoryData.batches[0].expiryDate === "string"
              ? inventoryData.batches[0].expiryDate
              : new Date(inventoryData.batches[0].expiryDate).toISOString()
            : inventoryData.expiryDate
              ? typeof inventoryData.expiryDate === "string"
                ? inventoryData.expiryDate
                : new Date(inventoryData.expiryDate).toISOString()
              : "",
          createdAt:
            typeof inventoryData.createdAt === "string"
              ? inventoryData.createdAt
              : new Date(inventoryData.createdAt).toISOString(),
          updatedAt:
            typeof inventoryData.updatedAt === "string"
              ? inventoryData.updatedAt
              : new Date(inventoryData.updatedAt).toISOString(),
          lastRestocked: inventoryData.lastRestockedAt
            ? typeof inventoryData.lastRestockedAt === "string"
              ? inventoryData.lastRestockedAt
              : new Date(inventoryData.lastRestockedAt).toISOString()
            : typeof inventoryData.createdAt === "string"
              ? inventoryData.createdAt
              : new Date(inventoryData.createdAt).toISOString(),

          qrCode: inventoryData.qrCode || "",
          qrCodeImageUrl:
            inventoryData.qrCodeImageUrl ||
            inventoryData.qrMetadata?.cloudinaryUrl ||
            "",
          qrCodeGenerated: inventoryData.qrCodeGenerated || false,
          totalScans: inventoryData.totalScans || 0,
          blockchainInventoryId: inventoryData.blockchainInventoryId || "",
          ipfsHash:
            inventoryData.ipfsHash || inventoryData.qrMetadata?.ipfsHash || "",
          qrMetadata: inventoryData.qrMetadata
            ? {
                generatedAt: inventoryData.qrMetadata.generatedAt,
                generatedBy: inventoryData.qrMetadata.generatedBy,
                ipfsHash: inventoryData.qrMetadata.ipfsHash,
                cloudinaryUrl: inventoryData.qrMetadata.cloudinaryUrl,
                trackingUrl: inventoryData.qrMetadata.trackingUrl,
              }
            : undefined,
        };

        setInventoryItem(transformedData);
        setTimeout(() => setIsVisible(true), 100);
      } catch (error: any) {
        toast.error(error?.message || "Failed to load inventory data");
        console.error("Error fetching inventory:", error);
        router.push("/supplier/inventory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, [inventoryId, router]);

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteInventory(inventoryId);
      toast.success("Inventory item deleted successfully");
      router.push("/supplier/inventory");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete inventory item");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const getStockStatus = () => {
    if (!inventoryItem) return { label: "Unknown", color: "grey" };
    const qty = inventoryItem.availableQuantity;
    if (qty === 0) return { label: "Out of Stock", color: "red" };
    if (qty < inventoryItem.minStockLevel)
      return { label: "Low Stock", color: "yellow" };
    return { label: "In Stock", color: "green" };
  };

  const nextImage = () => {
    if (!inventoryItem) return;
    setCurrentImageIndex((prev) =>
      prev === inventoryItem.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!inventoryItem) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? inventoryItem.images.length - 1 : prev - 1
    );
  };

  const formatDate = (dateInput: string | Date) => {
    const date =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return ""; // handle invalid date
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case "A":
        return badgeColors.blue;
      case "B":
        return badgeColors.green;
      case "C":
        return badgeColors.yellow;
      case "Rejected":
        return badgeColors.red;
      default:
        return badgeColors.grey;
    }
  };

  const handleCopyHash = async () => {
    if (inventoryItem?.blockchainInventoryId) {
      try {
        await navigator.clipboard.writeText(
          inventoryItem.blockchainInventoryId
        );
        toast.success("Blockchain hash copied to clipboard");
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (error) {
        toast.error("Failed to copy hash");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading inventory details...
          </p>
        </div>
      </div>
    );
  }

  if (!inventoryItem) {
    return null;
  }

  const stockStatus = getStockStatus();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative z-10 p-4 md:p-6">
        <Breadcrumb className="mb-4 md:mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/supplier">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/supplier/inventory">
                Inventory
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{inventoryItem.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div
          className={`transform transition-all duration-700 mb-4 md:mb-6 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {inventoryItem.name}
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                SKU: {inventoryItem.sku}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Badge
                    className={`${
                      stockStatus.color === "green"
                        ? "bg-green-100/10 dark:bg-green-900/10 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                        : ""
                    }
                    ${
                      stockStatus.color === "yellow"
                        ? "bg-yellow-100/10 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400"
                        : ""
                    }
                    ${
                      stockStatus.color === "red"
                        ? "bg-red-100/10 dark:bg-red-900/10 border-red-100 dark:border-red-900 text-red-700 dark:text-red-400"
                        : ""
                    } border text-xs rounded-none`}
                  >
                    {stockStatus.label}
                  </Badge>
                  <Badge
                    className={`${getGradeColor(inventoryItem.qualityGrade).bg} ${getGradeColor(inventoryItem.qualityGrade).border} ${getGradeColor(inventoryItem.qualityGrade).text} text-xs rounded-none`}
                  >
                    {inventoryItem.qualityGrade === "Rejected" ? (
                      <XCircleIcon
                        className={`h-3 w-3 mr-1 ${getGradeColor(inventoryItem.qualityGrade).icon}`}
                      />
                    ) : (
                      <CheckCircleIcon
                        className={`h-3 w-3 mr-1 ${getGradeColor(inventoryItem.qualityGrade).icon}`}
                      />
                    )}
                    Grade {inventoryItem.qualityGrade}
                  </Badge>
                  {inventoryItem.isSustainable && (
                    <Badge className="bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-xs rounded-none">
                      Sustainable
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none">
                    {inventoryItem.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/supplier/inventory/${inventoryId}/edit`)
                }
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:border-black dark:hover:border-white"
              >
                <PencilSquareIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                className="text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400"
              >
                <TrashIcon className="h-3 w-3 md:h-4 md:w-4 mr-2 text-red-600 dark:text-red-400" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <Card className="bg-white dark:bg-gray-900 transition-all duration-300 rounded-none shadow-none overflow-hidden p-0">
              <CardContent className="p-0">
                <div className="relative aspect-[3/4]">
                  {inventoryItem.images.length > 0 ? (
                    <>
                      <img
                        src={getImageUrl(
                          inventoryItem.images[currentImageIndex],
                          currentImageIndex
                        )}
                        alt={inventoryItem.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setIsImageModalOpen(true)}
                      />
                      {inventoryItem.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-none backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronLeftIcon className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-none backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRightIcon className="h-4 w-4 md:h-5 md:w-5" />
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {inventoryItem.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex
                                    ? "bg-white w-6"
                                    : "bg-white/50"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                      <ArchiveBoxIcon className="h-16 w-16 md:h-20 md:w-20 text-gray-400" />
                    </div>
                  )}
                </div>

                {inventoryItem.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 dark:bg-gray-800">
                    {inventoryItem.images.slice(0, 4).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square rounded-none overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-gray-900 dark:border-white"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={getImageUrl(image, index)}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
              <CardHeader className={CARD_HEADER_PADDING}>
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                  Stock Summary
                </h3>
              </CardHeader>
              <Separator className="-mt-2" />
              <CardContent className={CARD_CONTENT_PADDING + " space-y-3"}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Total Quantity
                    </p>
                    <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                      {inventoryItem.quantity} {inventoryItem.unit}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Available
                    </p>
                    <p className="text-sm md:text-base font-bold text-green-600 dark:text-green-400">
                      {inventoryItem.availableQuantity} {inventoryItem.unit}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Total Sold
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {inventoryItem.reservedQuantity} {inventoryItem.unit}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Damaged
                    </p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                      {inventoryItem.damagedQuantity} {inventoryItem.unit}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
              <CardHeader className={CARD_HEADER_PADDING}>
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                  Pricing Information
                </h3>
              </CardHeader>
              <Separator className="-mt-2" />
              <CardContent className={CARD_CONTENT_PADDING + " space-y-3"}>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Unit Price
                    </span>
                    <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                      {inventoryItem.currency}{" "}
                      {inventoryItem.pricePerUnit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Cost Price
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {inventoryItem.currency}{" "}
                      {inventoryItem.costPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Profit Margin
                    </span>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {(
                        ((inventoryItem.pricePerUnit -
                          inventoryItem.costPrice) /
                          inventoryItem.pricePerUnit) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <Separator className="-mt-2" />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Total Value
                    </span>
                    <span className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                      {inventoryItem.currency}{" "}
                      {inventoryItem.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {inventoryItem.blockchainInventoryId && (
              <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                <CardHeader className={CARD_HEADER_PADDING}>
                  <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                    Blockchain Information
                  </h3>
                </CardHeader>
                <Separator className="-mt-2" />
                <CardContent className={CARD_CONTENT_PADDING}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Blockchain Hash
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono text-gray-900 dark:text-white truncate max-w-[200px]">
                        {inventoryItem.blockchainInventoryId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyHash}
                        className="p-1 h-6 w-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        {isCopied ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
              <CardHeader className={CARD_HEADER_PADDING}>
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                  QR Code & Tracking
                </h3>
              </CardHeader>
              <Separator className="-mt-2" />
              <CardContent className={CARD_CONTENT_PADDING}>
                <div className="flex flex-col items-center space-y-4">
                  {inventoryItem.qrCodeImageUrl ? (
                    <>
                      <div className="relative bg-white p-4 rounded-none border border-gray-200 dark:border-gray-700">
                        <img
                          src={inventoryItem.qrCodeImageUrl}
                          alt="QR Code"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                      <div className="w-full space-y-3">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-none">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            QR Code
                          </span>
                          <code className="text-xs font-mono font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.qrCode}
                          </code>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-none">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Total Scans
                          </span>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {inventoryItem.totalScans || 0}
                          </span>
                        </div>
                        {inventoryItem.qrMetadata?.trackingUrl && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Tracking URL
                            </p>
                            <a
                              href={inventoryItem.qrMetadata.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                            >
                              {inventoryItem.qrMetadata.trackingUrl}
                            </a>
                          </div>
                        )}
                        {inventoryItem.ipfsHash && (
                          <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-none">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              IPFS Hash
                            </span>
                            <code className="text-xs font-mono text-gray-900 dark:text-white truncate max-w-[200px]">
                              {inventoryItem.ipfsHash}
                            </code>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = inventoryItem.qrCodeImageUrl!;
                            link.download = `QR-${inventoryItem.sku}.png`;
                            link.click();
                          }}
                          className="w-full text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:border-black dark:hover:border-white"
                        >
                          Download QR Code
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        No QR code generated yet
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          toast.info("QR code generation feature coming soon");
                        }}
                        className="text-xs cursor-pointer h-8 rounded-none"
                      >
                        Generate QR Code
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full justify-start bg-transparent rounded-none p-0 h-auto mb-2 md:mb-3 flex-wrap">
                <TabsTrigger
                  value="basic"
                  className="mr-3 mb-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <DocumentTextIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="textile"
                  className="mr-3 mb-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <SwatchIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Textile Details
                </TabsTrigger>
                <TabsTrigger
                  value="stock"
                  className="mr-3 mb-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <ArchiveBoxIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Stock Management
                </TabsTrigger>
                <TabsTrigger
                  value="supplier"
                  className="mb-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <BuildingStorefrontIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Supplier
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="basic"
                className="mt-0 space-y-4 md:space-y-6"
              >
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Item Description
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING}>
                    <p
                      className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed break-words overflow-wrap-anywhere"
                      style={{ whiteSpace: "pre-wrap", textAlign: "justify" }}
                    >
                      {inventoryItem.description}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Classification
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Category
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.category}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Subcategory
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.subcategory}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Material Type
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.materialType}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Season
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.season}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Quality & Compliance
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING + " space-y-4"}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Quality Grade
                        </p>
                        <Badge
                          className={`${getGradeColor(inventoryItem.qualityGrade).bg} ${getGradeColor(inventoryItem.qualityGrade).border} ${getGradeColor(inventoryItem.qualityGrade).text} text-xs rounded-none`}
                        >
                          {inventoryItem.qualityGrade === "Rejected" ? (
                            <XCircleIcon
                              className={`h-3 w-3 mr-1 ${getGradeColor(inventoryItem.qualityGrade).icon}`}
                            />
                          ) : (
                            <CheckCircleIcon
                              className={`h-3 w-3 mr-1 ${getGradeColor(inventoryItem.qualityGrade).icon}`}
                            />
                          )}
                          Grade {inventoryItem.qualityGrade}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Country of Origin
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.countryOfOrigin}
                        </p>
                      </div>
                    </div>

                    {inventoryItem.certifications.length > 0 && (
                      <>
                        <Separator className="-mt-2" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Certifications
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {inventoryItem.certifications.map((cert) => (
                              <Badge
                                key={cert}
                                className="bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-xs rounded-none"
                              >
                                <CheckCircleIcon className="h-3 w-3 mr-1 text-green-700 dark:text-green-400" />
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {(inventoryItem.internalCode ||
                  inventoryItem.barcode ||
                  inventoryItem.notes) && (
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                    <CardHeader className={CARD_HEADER_PADDING}>
                      <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                        Additional Information
                      </h3>
                    </CardHeader>
                    <Separator className="-mt-2" />
                    <CardContent
                      className={CARD_CONTENT_PADDING + " space-y-3"}
                    >
                      {inventoryItem.internalCode && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Internal Code
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.internalCode}
                          </p>
                        </div>
                      )}
                      {inventoryItem.barcode && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Barcode
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.barcode}
                          </p>
                        </div>
                      )}
                      {inventoryItem.notes && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Notes
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {inventoryItem.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="textile" className="mt-0">
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Textile Specifications
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Fabric Type
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.textileDetails.fabricType}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Composition
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.textileDetails.composition}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            GSM
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.textileDetails.gsm}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Width
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.textileDetails.width}cm
                          </p>
                        </div>
                        {inventoryItem.textileDetails.fabricWeight && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Fabric Weight
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.textileDetails.fabricWeight}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Color
                          </p>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded-none border border-gray-200 dark:border-gray-700"
                              style={{
                                backgroundColor:
                                  inventoryItem.textileDetails.colorCode,
                              }}
                            />
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.textileDetails.color}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Pattern
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.textileDetails.pattern}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Finish
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.textileDetails.finish}
                          </p>
                        </div>
                        {inventoryItem.textileDetails.shrinkage && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Shrinkage
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.textileDetails.shrinkage}
                            </p>
                          </div>
                        )}
                        {inventoryItem.textileDetails.washability && (
                          <div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Washability
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.textileDetails.washability}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {inventoryItem.textileDetails.careInstructions && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            Care Instructions
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {inventoryItem.textileDetails.careInstructions}
                          </p>
                        </div>
                      </>
                    )}

                    {Object.keys(inventoryItem.specifications).length > 0 && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                            Additional Specifications
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            {Object.entries(inventoryItem.specifications).map(
                              ([key, value]) =>
                                value && (
                                  <div key={key} className="space-y-1">
                                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                                      {key.replace(/([A-Z])/g, " $1").trim()}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                      {value}
                                    </p>
                                  </div>
                                )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="stock"
                className="mt-0 space-y-4 md:space-y-6"
              >
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Stock Levels
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING}>
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Total Quantity
                        </p>
                        <p className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                          {inventoryItem.quantity} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Available
                        </p>
                        <p className="text-base md:text-lg font-bold text-green-600 dark:text-green-400">
                          {inventoryItem.availableQuantity} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Total Sold
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.reservedQuantity} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Committed
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.committedQuantity} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Damaged
                        </p>
                        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                          {inventoryItem.damagedQuantity} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Last Restocked
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatDate(inventoryItem.lastRestocked)}
                        </p>
                      </div>
                    </div>

                    {inventoryItem.availableQuantity <
                      inventoryItem.reorderLevel && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 rounded-none mt-4">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                            Reorder Alert
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            Stock level is below reorder point. Consider
                            restocking soon.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Stock Management Settings
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING}>
                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Min Stock Level
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.minStockLevel} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Reorder Level
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.reorderLevel} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Reorder Quantity
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.reorderQuantity} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Safety Stock
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.safetyStockLevel} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Maximum Quantity
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.maximumQuantity} {inventoryItem.unit}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Auto Reorder
                        </p>
                        <Badge
                          className={`${
                            inventoryItem.autoReorderEnabled
                              ? "bg-green-100/10 dark:bg-green-900/10 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                              : "bg-gray-100/10 dark:bg-gray-800/10 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-400"
                          } border text-xs rounded-none`}
                        >
                          {inventoryItem.autoReorderEnabled
                            ? "Enabled"
                            : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {inventoryItem.warehouseLocation && (
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                    <CardHeader className={CARD_HEADER_PADDING}>
                      <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                        Storage Location
                      </h3>
                    </CardHeader>
                    <Separator className="-mt-2" />
                    <CardContent className={CARD_CONTENT_PADDING}>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Primary Warehouse
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.warehouseLocation}
                          </p>
                        </div>

                        {inventoryItem.storageLocations.length > 0 && (
                          <>
                            <Separator className="-mt-2" />
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                Detailed Storage Locations
                              </p>
                              {inventoryItem.storageLocations.map(
                                (location, index) => (
                                  <div
                                    key={index}
                                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-none mb-2 last:mb-0"
                                  >
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          Warehouse
                                        </p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                          {location.warehouse}
                                        </p>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                          Quantity
                                        </p>
                                        <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                          {location.quantityAtLocation}{" "}
                                          {inventoryItem.unit}
                                        </p>
                                      </div>
                                      {location.zone && (
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Zone
                                          </p>
                                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {location.zone}
                                          </p>
                                        </div>
                                      )}
                                      {location.aisle && (
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Aisle
                                          </p>
                                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {location.aisle}
                                          </p>
                                        </div>
                                      )}
                                      {location.rack && (
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Rack
                                          </p>
                                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {location.rack}
                                          </p>
                                        </div>
                                      )}
                                      {location.bin && (
                                        <div className="space-y-1">
                                          <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Bin
                                          </p>
                                          <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                            {location.bin}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {inventoryItem.isBatchTracked && (
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                    <CardHeader className={CARD_HEADER_PADDING}>
                      <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                        Batch Tracking
                      </h3>
                    </CardHeader>
                    <Separator className="-mt-2" />
                    <CardContent className={CARD_CONTENT_PADDING}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Manufacture Date
                          </p>
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatDate(inventoryItem.manufactureDate)}
                            </p>
                          </div>
                        </div>
                        {inventoryItem.expiryDate && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Expiry Date
                            </p>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {formatDate(inventoryItem.expiryDate)}
                              </p>
                            </div>
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Shelf Life
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.shelfLife} days
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Batch Tracking
                          </p>
                          <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none">
                            Enabled
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(inventoryItem.weight ||
                  inventoryItem.dimensions ||
                  inventoryItem.carbonFootprint ||
                  inventoryItem.recycledContent) && (
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                    <CardHeader className={CARD_HEADER_PADDING}>
                      <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                        Physical & Environmental Data
                      </h3>
                    </CardHeader>
                    <Separator className="-mt-2" />
                    <CardContent className={CARD_CONTENT_PADDING}>
                      <div className="grid grid-cols-2 gap-4">
                        {inventoryItem.weight && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Weight
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.weight}
                            </p>
                          </div>
                        )}
                        {inventoryItem.dimensions && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Dimensions
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.dimensions}
                            </p>
                          </div>
                        )}
                        {inventoryItem.carbonFootprint && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Carbon Footprint
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.carbonFootprint}
                            </p>
                          </div>
                        )}
                        {inventoryItem.recycledContent && (
                          <div className="space-y-1">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Recycled Content
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              {inventoryItem.recycledContent}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent
                value="supplier"
                className="mt-0 space-y-4 md:space-y-6"
              >
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Supplier Information
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING + " space-y-4"}>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Supplier Name
                      </p>
                      <p className="text-base font-bold text-gray-900 dark:text-white">
                        {inventoryItem.supplier.name}
                      </p>
                    </div>

                    <Separator className="-mt-2" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Phone
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.supplier.contact.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Email
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.supplier.contact.email}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Address
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {inventoryItem.supplier.contact.address}
                      </p>
                    </div>

                    {inventoryItem.manufacturer && (
                      <>
                        <Separator className="-mt-2" />
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Manufacturer
                          </p>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inventoryItem.manufacturer}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className={CARD_HEADER_PADDING}>
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Delivery Information
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className={CARD_CONTENT_PADDING}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-none">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Lead Time
                        </p>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {inventoryItem.leadTime} days
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-none">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Estimated Delivery
                        </p>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {inventoryItem.estimatedDeliveryDays} days
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent
            className={`max-w-md ${colors.backgrounds.modal} ${colors.borders.primary} rounded-none shadow-none`}
          >
            <DialogHeader>
              <DialogTitle
                className={`flex items-center gap-3 text-base ${colors.texts.primary}`}
              >
                <div className="h-10 w-10 flex items-center justify-center">
                  <TrashIcon className="h-5 w-5 text-red-600" />
                </div>
                Delete Inventory Item
              </DialogTitle>
              <DialogDescription
                className={`text-xs ${colors.texts.secondary}`}
              >
                Are you sure you want to delete &quot;{inventoryItem?.name}
                &quot;? This action cannot be undone and will permanently remove
                the item from your inventory.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button
                onClick={() => setIsDeleteOpen(false)}
                disabled={isDeleting}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white bg-transparent border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors cursor-pointer rounded-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
              >
                Cancel
              </button>
              <Button
                variant="outline"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center justify-center gap-1 px-3 py-2 text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
              >
                {isDeleting ? (
                  <>
                    <ArrowPathIcon className="h-3 w-3 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-3 w-3 mr-2" />
                    Delete Item
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none p-0">
            <div className="relative aspect-video bg-black">
              <img
                src={getImageUrl(
                  inventoryItem.images[currentImageIndex],
                  currentImageIndex
                )}
                alt={inventoryItem.name}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-none backdrop-blur-sm"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              {inventoryItem.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-none backdrop-blur-sm"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-none backdrop-blur-sm"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
