/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArchiveBoxIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  BanknotesIcon,
  StarIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  TagIcon,
  CubeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Product } from "@/types";
import { AnimatePresence, motion } from "framer-motion";
import { productAPI } from "@/lib/api/product.api";
import Image from "next/image";
import { badgeColors } from "@/lib/colorConstants";
import { usePageTitle } from "@/hooks/use-page-title";

type BadgeKey = keyof typeof badgeColors;

export default function VendorProductDetailPage() {
  usePageTitle("Product Details");
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockQuantity, setStockQuantity] = useState("");
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const response = await productAPI.getProductById(productId);

      if (response.success && response.product) {
        setProduct(response.product);
        setStockQuantity(response.product.quantity?.toString() || "0");
      } else {
        throw new Error("Product not found");
      }
    } catch (error: any) {
      console.error("Error loading product:", error);
      toast.error(error.message || "Failed to load product");
      router.push("/vendor/my-products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      setIsDeleting(true);
      await productAPI.deleteProduct(product._id);
      toast.success("Product deleted successfully");
      router.push("/vendor/my-products");
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "Failed to delete product");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleUpdateStock = async () => {
    if (!product) return;

    const newQuantity = parseInt(stockQuantity);
    if (isNaN(newQuantity) || newQuantity < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      setIsUpdatingStock(true);
      await productAPI.updateStock(product._id, newQuantity);
      toast.success("Stock updated successfully");
      setIsStockModalOpen(false);
      loadProduct();
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast.error(error.message || "Failed to update stock");
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStockStatus = () => {
    if (!product) return { key: "grey", text: "Unknown", bg: "bg-gray-50" };

    if (product.quantity === 0) {
      return {
        key: "red",
        text: "Out of Stock",
        bg: "bg-red-50 dark:bg-red-950/30",
      };
    } else if (product.quantity <= product.minStockLevel) {
      return {
        key: "yellow",
        text: `Low Stock (${product.quantity})`,
        bg: "bg-orange-50 dark:bg-orange-950/30",
      };
    } else if (product.quantity <= 20) {
      return {
        key: "yellow",
        text: `${product.quantity} in stock`,
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
      };
    }
    return {
      key: "green",
      text: `In Stock (${product.quantity})`,
      bg: "bg-green-50 dark:bg-green-950/30",
    };
  };

  const stockStatus = getStockStatus();

  const nextImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product && product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            Loading product details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-orange-600" />
            <h3 className="text-xl font-semibold mb-2">Product Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The product you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push("/vendor/my-products")}>
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative z-10 p-2 md:p-4 lg:px-6 pt-0">
        {" "}
        <Breadcrumb className="mb-2 md:mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/vendor">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/vendor/my-products">
                My Products
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="mb-2 md:mb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2 md:space-y-1">
              <div className="flex items-center gap-6">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  {product.name}
                </h1>
              </div>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                SKU: {product.sku}
              </p>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <Badge
                  className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                >
                  {product.category}
                </Badge>
                <Badge
                  className={`${badgeColors[stockStatus.key as BadgeKey].bg} ${badgeColors[stockStatus.key as BadgeKey].border} ${badgeColors[stockStatus.key as BadgeKey].text} text-xs rounded-none`}
                >
                  {stockStatus.text}
                </Badge>
                {product.isFeatured && (
                  <Badge
                    className={`${badgeColors.purple.bg} ${badgeColors.purple.border} ${badgeColors.purple.text} text-xs rounded-none`}
                  >
                    Featured
                  </Badge>
                )}
                {product.isSustainable && (
                  <Badge
                    className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                  >
                    Sustainable
                  </Badge>
                )}
                {product.blockchainVerified && (
                  <Badge
                    className={`${badgeColors.cyan.bg} ${badgeColors.cyan.border} ${badgeColors.cyan.text} text-xs rounded-none`}
                  >
                    <ShieldCheckIcon className="h-3 w-3 md:h-4 " />
                    Blockchain Verified
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/vendor/my-products/${product._id}/edit`)
                }
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all hover:border-black dark:hover:border-white"
              >
                <PencilSquareIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none transition-all hover:border-red-600 dark:hover:border-red-400"
              >
                <TrashIcon className="h-3 w-3 md:h-4 md:w-4 mr-2 text-red-600 dark:text-red-400" />
                Delete
              </Button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-white dark:bg-gray-900 transition-all duration-300 rounded-none shadow-none overflow-hidden border border-gray-200 dark:border-gray-700 p-0">
              <CardContent className="p-0 m-0">
                <div className="relative aspect-[3/4] group m-0">
                  {product.images && product.images.length > 0 ? (
                    <>
                      <Image
                        src={
                          product.images[currentImageIndex]?.url ||
                          "/placeholder-product.png"
                        }
                        alt={product.name}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => setIsImageModalOpen(true)}
                      />
                      {product.images.length > 1 && (
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
                            {product.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-none transition-all ${
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

                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 p-3 mt-3 bg-gray-50 dark:bg-gray-800">
                    {product.images.slice(0, 4).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`aspect-square rounded-none overflow-hidden border-2 transition-all ${
                          index === currentImageIndex
                            ? "border-gray-900 dark:border-white"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <Image
                          src={image.url || "/placeholder-product.png"}
                          alt={`View ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
              <CardHeader className="px-6 pb-0">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                  Stock Summary
                </h3>
              </CardHeader>
              <Separator className="-mt-2" />
              <CardContent className="px-6 pt-0 space-y-3">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Total Quantity
                    </p>
                    <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                      {product.quantity}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Available
                    </p>
                    <p className="text-sm md:text-base font-bold text-green-600 dark:text-green-400">
                      {product.quantity}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
              <CardHeader className="px-6 pb-0">
                <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                  Pricing Information
                </h3>
              </CardHeader>
              <Separator className="-mt-2" />
              <CardContent className="px-6 pt-0 space-y-3">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Unit Price
                    </span>
                    <span className="text-sm md:text-base font-bold text-gray-900 dark:text-white">
                      CVT {product.price.toFixed(2)}
                    </span>
                  </div>
                  {product.costPrice && product.costPrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Cost Price
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        CVT {product.costPrice.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {product.costPrice && product.costPrice > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        Profit Margin
                      </span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {(
                          ((product.price - product.costPrice) /
                            product.price) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Total Value
                    </span>
                    <span className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                      CVT {(product.quantity * product.price).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="w-full justify-start bg-transparent rounded-none p-0 h-auto mb-2 md:mb-4 flex-wrap">
                <TabsTrigger
                  value="details"
                  className="mr-2 mb-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <DocumentTextIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Details
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="mr-2 mb-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <ChartBarIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="mb-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <ClockIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="-mt-1 space-y-6">
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className="px-6 pb-0">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Product Description
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className="px-6 pt-0">
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {product.description}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className="px-6 pb-0">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Classification
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className="px-6 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Category
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {product.category}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Subcategory
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {product.subcategory}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className="px-6 pb-0">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Apparel Details
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className="px-6 pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Size
                        </p>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {product.apparelDetails?.size || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Color
                        </p>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {product.apparelDetails?.color || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                          Material
                        </p>
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                          {product.apparelDetails?.material || "N/A"}
                        </p>
                      </div>
                      {product.apparelDetails?.fit && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Fit
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.apparelDetails.fit}
                          </p>
                        </div>
                      )}
                      {product.apparelDetails?.pattern && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Pattern
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.apparelDetails.pattern}
                          </p>
                        </div>
                      )}
                      {product.apparelDetails?.fabricType && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Fabric
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.apparelDetails.fabricType}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardHeader className="px-6 pb-0">
                    <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                      Additional Information
                    </h3>
                  </CardHeader>
                  <Separator className="-mt-2" />
                  <CardContent className="px-6 pt-0">
                    <div className="grid grid-cols-2 gap-6">
                      {product.brand && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Brand
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.brand}
                          </p>
                        </div>
                      )}
                      {product.season && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Season
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.season}
                          </p>
                        </div>
                      )}
                      {product.manufacturer && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Manufacturer
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.manufacturer}
                          </p>
                        </div>
                      )}
                      {product.countryOfOrigin && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Origin
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.countryOfOrigin}
                          </p>
                        </div>
                      )}
                      {product.weight && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Weight
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.weight} kg
                          </p>
                        </div>
                      )}
                      {product.dimensions && (
                        <div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                            Dimensions
                          </p>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100">
                            {product.dimensions}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {product.tags && product.tags.length > 0 && (
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                    <CardHeader className="px-6 pb-0">
                      <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                        Tags
                      </h3>
                    </CardHeader>
                    <Separator className="-mt-2" />
                    <CardContent className="px-6 pt-0">
                      <div className="flex flex-wrap gap-3">
                        {product.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} rounded-none`}
                          >
                            <TagIcon
                              className={`${badgeColors.grey.icon} h-3 w-3 mr-1`}
                            />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {product.certifications &&
                  product.certifications.length > 0 && (
                    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                      <CardHeader className="px-6 pb-0">
                        <h3 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                          Certifications
                        </h3>
                      </CardHeader>
                      <Separator className="-mt-2" />
                      <CardContent className="px-6 pt-0">
                        <div className="flex flex-wrap gap-3">
                          {product.certifications.map((cert, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} rounded-none`}
                            >
                              <ShieldCheckIcon
                                className={`${badgeColors.green.icon} h-3 w-3 mr-1`}
                              />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              <TabsContent value="analytics" className="-mt-1 space-y-6">
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          {
                            label: "Views",
                            value: product.views || 0,
                            icon: EyeIcon,
                          },
                          {
                            label: "Sold",
                            value: product.totalSold || 0,
                            icon: ShoppingCartIcon,
                          },
                          {
                            label: "Rating",
                            value: product.averageRating?.toFixed(1) || "N/A",
                            icon: StarIcon,
                          },
                          {
                            label: "Revenue",
                            value: `CVT ${((product.totalSold || 0) * product.price).toFixed(0)}`,
                            icon: BanknotesIcon,
                          },
                        ].map((stat) => {
                          const Icon = stat.icon;
                          return (
                            <div key={stat.label} className="text-center">
                              <Icon className="h-6 w-6 mx-auto mb-2 text-gray-900 dark:text-gray-100" />
                              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {stat.label}
                              </p>
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {stat.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none">
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          Average Order Value
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          CVT {product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="-mt-1 space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  key="history"
                >
                  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 transition-all duration-300 rounded-none shadow-none">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex-shrink-0">
                          <CubeIcon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Product Created
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(product.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 rounded-none">
                        <div className="flex-shrink-0">
                          <ArrowPathIcon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            Last Updated
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {new Date(product.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {product.lastRestockedAt && (
                        <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 rounded-none">
                          <div className="flex-shrink-0">
                            <CubeIcon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              Last Restocked
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(
                                product.lastRestockedAt
                              ).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}

                      {product.lastSoldAt && (
                        <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 rounded-none">
                          <div className="flex-shrink-0">
                            <ShoppingCartIcon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              Last Sold
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {new Date(product.lastSoldAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {product.blockchainProductId && (
                    <Card className="mt-6 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-none shadow-none">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-6 mb-4">
                          <ShieldCheckIcon className="h-5 w-5 text-cyan-600" />
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            Blockchain Information
                          </h4>
                        </div>
                        <div className="space-y-6 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">
                              Product ID:
                            </span>
                            <div className="flex items-center gap-6">
                              <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-none">
                                {product.blockchainProductId.substring(0, 8)}...
                              </code>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    product.blockchainProductId || "",
                                    "blockchain"
                                  )
                                }
                                className="text-cyan-600 hover:text-cyan-700"
                              >
                                {copiedField === "blockchain" ? (
                                  <CheckIcon className="h-4 w-4" />
                                ) : (
                                  <ClipboardDocumentIcon className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">
                              Status:
                            </span>
                            <Badge
                              className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} rounded-none`}
                            >
                              <ShieldCheckIcon
                                className={`${badgeColors.green.icon} h-3 w-3 mr-1`}
                              />
                              Verified
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <Dialog
              open={isDeleteModalOpen}
              onOpenChange={setIsDeleteModalOpen}
            >
              <DialogContent
                className={`max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none shadow-none`}
              >
                <DialogHeader>
                  <DialogTitle
                    className={`flex items-center gap-3 text-base text-gray-900 dark:text-white`}
                  >
                    <div className="h-10 w-10 flex items-center justify-center">
                      <TrashIcon className="h-5 w-5 text-red-600" />
                    </div>
                    Delete Product
                  </DialogTitle>
                  <DialogDescription
                    className={`text-xs text-gray-600 dark:text-gray-400`}
                  >
                    Are you sure you want to delete &quot;{product.name}
                    &quot;? This action cannot be undone and will permanently
                    remove the product from your inventory.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-900 dark:text-white bg-transparent border border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors cursor-pointer rounded-none focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                  <Button
                    variant="outline"
                    onClick={handleDelete}
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
                        Delete Product
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
        {/* Update Stock Modal */}
        <AnimatePresence>
          {isStockModalOpen && (
            <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
              <DialogContent className="max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none shadow-none">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-6">
                    <CubeIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
                    Update Stock Quantity
                  </DialogTitle>
                  <DialogDescription>
                    Current stock: <strong>{product.quantity} units</strong>
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label htmlFor="stock-quantity" className="mb-2 block">
                    New Quantity
                  </Label>
                  <Input
                    id="stock-quantity"
                    type="number"
                    min="0"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    placeholder="Enter new quantity"
                    className="w-full rounded-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Minimum stock level: {product.minStockLevel} units
                  </p>
                </div>
                <DialogFooter className="gap-6">
                  <Button
                    variant="outline"
                    onClick={() => setIsStockModalOpen(false)}
                    disabled={isUpdatingStock}
                    className="rounded-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStock}
                    disabled={isUpdatingStock}
                    className="rounded-none bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                  >
                    {isUpdatingStock ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckIcon className="h-4 w-4 mr-2" />
                        Update Stock
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
        {/* Image Modal */}
        <AnimatePresence>
          {isImageModalOpen && (
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
              <DialogContent className="max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none p-0">
                <div className="relative aspect-video bg-black">
                  <Image
                    src={
                      product.images && product.images[currentImageIndex]?.url
                        ? product.images[currentImageIndex].url
                        : "/placeholder-product.png"
                    }
                    alt={product.name}
                    fill
                    className="object-contain"
                  />
                  <button
                    onClick={() => setIsImageModalOpen(false)}
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-none backdrop-blur-sm"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                  {product.images && product.images.length > 1 && (
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
