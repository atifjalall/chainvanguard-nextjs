/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { calculateTax } from "@/config/constants";
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  BookmarkIcon,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
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
import vendorBrowseApi from "@/lib/api/vendor.browse.api";
import vendorRequestApi from "@/lib/api/vendor.request.api";
import { usePageTitle } from "@/hooks/use-page-title";
import { Inventory } from "@/types";

export default function VendorInventoryDetailPage() {
  usePageTitle("Inventory Details");
  const router = useRouter();
  const params = useParams();
  const inventoryId = params?.id as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestNotes, setRequestNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [inventoryItem, setInventoryItem] = useState<Inventory | null>(null);

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
        const response = await vendorBrowseApi.getInventoryDetails(inventoryId);
        const inventoryData = response.data;
        setInventoryItem(inventoryData);

        // Check if saved
        const wishlistResponse = await vendorBrowseApi.getWishlist();
        const wishlistIds = new Set(
          wishlistResponse.wishlist.items
            .map((item) => {
              if (typeof item.productId === "string") {
                return item.productId;
              } else if (item.productId && typeof item.productId === "object") {
                return (item.productId as any)._id as string;
              }
              return null;
            })
            .filter((id): id is string => id !== null)
        );
        setIsSaved(wishlistIds.has(inventoryId));

        setTimeout(() => setIsVisible(true), 100);
      } catch (error: any) {
        toast.error(
          error?.response?.data?.message || "Failed to load inventory data"
        );
        console.error("Error fetching inventory:", error);
        router.push("/vendor/browse");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, [inventoryId, router]);

  const handleToggleSaved = async () => {
    const wasAdding = !isSaved;

    // Optimistic update
    setIsSaved(!isSaved);

    try {
      if (wasAdding) {
        await vendorBrowseApi.addToWishlist(inventoryId, {
          notifyOnPriceDrop: true,
          notifyOnBackInStock: true,
        });
        toast.success("Added to saved items");
      } else {
        await vendorBrowseApi.removeFromWishlist(inventoryId);
        toast.info("Removed from saved items");
      }
    } catch (error: any) {
      // Rollback
      setIsSaved(wasAdding);
      console.error("Error toggling wishlist:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update wishlist"
      );
    }
  };

  const handleRequest = () => {
    setRequestQuantity(1);
    setRequestNotes("");
    setRequestDialogOpen(true);
  };

  const handleQuantityChange = (delta: number) => {
    const maxQty = inventoryItem?.availableQuantity || 1;
    const newQty = Math.max(1, Math.min(maxQty, requestQuantity + delta));
    setRequestQuantity(newQty);
  };

  const submitRequest = async () => {
    if (!inventoryItem) return;

    setIsSubmitting(true);
    try {
      let extractedSupplierId: string;

      if (typeof inventoryItem.supplierId === "string") {
        extractedSupplierId = inventoryItem.supplierId;
      } else if (
        inventoryItem.supplierId &&
        typeof inventoryItem.supplierId === "object" &&
        "_id" in inventoryItem.supplierId
      ) {
        extractedSupplierId = inventoryItem.supplierId._id;
      } else {
        toast.error("Invalid supplier information");
        return;
      }

      const response = await vendorRequestApi.createRequest({
        supplierId: extractedSupplierId,
        items: [
          {
            inventoryId: inventoryItem._id,
            quantity: requestQuantity,
            notes: requestNotes || undefined,
          },
        ],
        vendorNotes: requestNotes || undefined,
      });

      if (response.success) {
        const requestNumber = (response as any).request?.requestNumber || "N/A";
        toast.success(
          `Request submitted successfully! Request #${requestNumber}`
        );
        setRequestDialogOpen(false);
        setRequestQuantity(1);
        setRequestNotes("");
      }
    } catch (error: any) {
      console.error("Error submitting request:", error);
      toast.error(error?.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStockStatus = () => {
    if (!inventoryItem) return { label: "Unknown", color: "grey" };
    const qty = inventoryItem.availableQuantity || 0;
    if (qty === 0) return { label: "Out of Stock", color: "red" };
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
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  const calculateTotal = () => {
    if (!inventoryItem) return { subtotal: 0, tax: 0, total: 0 };

    const subtotal = inventoryItem.pricePerUnit * requestQuantity;
    const tax = calculateTax(subtotal); // Pakistan Sales Tax (17%)
    const total = subtotal + tax;

    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotal();

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
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor/browse">
                Browse Inventory
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
                <Badge
                  className={`${
                    stockStatus.color === "green"
                      ? "bg-green-100/10 dark:bg-green-900/10 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400"
                      : "bg-red-100/10 dark:bg-red-900/10 border-red-100 dark:border-red-900 text-red-700 dark:text-red-400"
                  } border text-xs rounded-none`}
                >
                  {stockStatus.label}
                </Badge>
                <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none">
                  {inventoryItem.category}
                </Badge>
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

            <div className="flex items-center gap-3">
              <button
                className="flex items-center justify-center flex-shrink-0 mt-0.5"
                onClick={handleToggleSaved}
              >
                <BookmarkIcon
                  className={`w-6 h-6 transition-colors cursor-pointer ${
                    isSaved
                      ? "fill-black text-black"
                      : "text-gray-400 hover:text-black"
                  }`}
                />
              </button>
              <Button
                onClick={handleRequest}
                disabled={inventoryItem.availableQuantity === 0}
                size="sm"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none"
              >
                <PlusIcon className="h-3 w-3 mr-2" />
                Request Item
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <Card className="bg-white dark:bg-gray-900 transition-all duration-300 rounded-none shadow-none overflow-hidden p-0">
              <CardContent className="p-0">
                <div className="relative aspect-[4/5]">
                  {inventoryItem.images && inventoryItem.images.length > 0 ? (
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

                {inventoryItem.images && inventoryItem.images.length > 1 && (
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
                      CVT {inventoryItem.pricePerUnit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Available Quantity
                    </span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {inventoryItem.availableQuantity} {inventoryItem.unit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        No QR code available
                      </p>
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
                          Unit
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {inventoryItem.unit}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
                        {inventoryItem.supplierName}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Enhanced Request Dialog */}
        <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
          <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none shadow-none max-w-lg md:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                Request Material
              </DialogTitle>
              <DialogDescription className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Request {inventoryItem?.name} from {inventoryItem?.supplierName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Item Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-none space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">SKU:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {inventoryItem?.sku}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Category:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {inventoryItem?.category}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    Available:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {inventoryItem?.availableQuantity} {inventoryItem?.unit}
                  </span>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="space-y-2">
                <Label
                  htmlFor="quantity"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  Quantity ({inventoryItem?.unit})
                </Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={requestQuantity <= 1}
                    className="h-9 w-9 p-0 rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    max={inventoryItem?.availableQuantity}
                    value={requestQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const maxQty = inventoryItem?.availableQuantity || 1;
                      setRequestQuantity(Math.max(1, Math.min(maxQty, val)));
                    }}
                    className="flex-1 text-center rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white h-9"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuantityChange(1)}
                    disabled={
                      requestQuantity >= (inventoryItem?.availableQuantity || 1)
                    }
                    className="h-9 w-9 p-0 rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label
                  htmlFor="notes"
                  className="text-sm font-medium text-gray-900 dark:text-white"
                >
                  Notes{" "}
                  <span className="text-gray-500 font-normal">
                    (Optional, max 500 chars)
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements or instructions..."
                  value={requestNotes}
                  onChange={(e) =>
                    setRequestNotes(e.target.value.slice(0, 500))
                  }
                  maxLength={500}
                  rows={3}
                  className="rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white resize-none"
                />
                <p className="text-xs text-gray-500 text-right">
                  {requestNotes.length}/500
                </p>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-none space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Unit Price:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    CVT {inventoryItem?.pricePerUnit.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Quantity:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {requestQuantity} {inventoryItem?.unit}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Subtotal:
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    CVT {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax (17%):
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    CVT {tax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">
                    CVT {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={() => setRequestDialogOpen(false)}
                disabled={isSubmitting}
                size="sm"
                className="text-xs md:text-sm cursor-pointer h-8 md:h-9 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white rounded-none"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRequest}
                disabled={isSubmitting}
                size="sm"
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none"
              >
                {isSubmitting ? (
                  <>
                    <ArrowPathIcon className="h-3 w-3 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-3 w-3 mr-2" />
                    Submit Request
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
              {inventoryItem.images && inventoryItem.images.length > 1 && (
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
