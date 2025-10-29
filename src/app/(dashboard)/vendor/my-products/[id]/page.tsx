/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Package,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  Star,
  ShoppingCart,
  BarChart3,
  History,
  Shield,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
  Leaf,
  Tag,
  Box,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  FileText,
  Share2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { productAPI } from "@/lib/api/product.api";
import type { Product } from "@/types";

export default function VendorProductDetailPage() {
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
      loadProduct(); // Reload product data
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
    if (!product)
      return { color: "text-gray-500", text: "Unknown", bg: "bg-gray-50" };

    if (product.quantity === 0) {
      return {
        color: "text-red-600 dark:text-red-400",
        text: "Out of Stock",
        bg: "bg-red-50 dark:bg-red-950/30",
      };
    } else if (product.quantity <= product.minStockLevel) {
      return {
        color: "text-orange-600 dark:text-orange-400",
        text: `Low Stock (${product.quantity})`,
        bg: "bg-orange-50 dark:bg-orange-950/30",
      };
    } else if (product.quantity <= 20) {
      return {
        color: "text-yellow-600 dark:text-yellow-400",
        text: `${product.quantity} in stock`,
        bg: "bg-yellow-50 dark:bg-yellow-950/30",
      };
    }
    return {
      color: "text-green-600 dark:text-green-400",
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 pb-8 max-w-[1800px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/vendor/my-products")}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Products
            </Button>

            <div className="flex gap-2">
              <button
                onClick={loadProduct}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                onClick={() =>
                  router.push(`/vendor/my-products/${product._id}/edit`)
                }
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-sm text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs text-blue-600 border-blue-600"
                >
                  {product.category}
                </Badge>
                <span className="text-sm text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  SKU: {product.sku}
                </span>
                <span className="text-sm text-muted-foreground">•</span>
                <Badge
                  className={`text-xs ${stockStatus.bg + " " + stockStatus.color}`}
                >
                  {stockStatus.text}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${product.price.toFixed(2)}
              </div>
              {product.costPrice && product.costPrice > 0 && (
                <div className="text-xs text-muted-foreground">
                  Cost: ${product.costPrice.toFixed(2)} • Margin:{" "}
                  <span className="text-green-600 dark:text-green-400 font-semibold">
                    ${(product.price - product.costPrice).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Feature Badges */}
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            {product.isFeatured && (
              <Badge className="text-xs bg-purple-100/80 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
            {product.isNewArrival && (
              <Badge className="text-xs bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm backdrop-blur-sm">
                New Arrival
              </Badge>
            )}
            {product.isBestseller && (
              <Badge className="text-xs bg-orange-100/80 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shadow-sm backdrop-blur-sm">
                <TrendingUp className="h-3 w-3 mr-1" />
                Bestseller
              </Badge>
            )}
            {product.isSustainable && (
              <Badge className="text-xs bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm backdrop-blur-sm">
                <Leaf className="h-3 w-3 mr-1" />
                Sustainable
              </Badge>
            )}
            {product.blockchainVerified && (
              <Badge className="text-xs bg-cyan-100/80 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 shadow-sm backdrop-blur-sm">
                <Shield className="h-3 w-3 mr-1" />
                Blockchain Verified
              </Badge>
            )}
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Left Column - Images & Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Main Image */}
                  <div className="relative max-w-md mx-auto aspect-square bg-gray-100 dark:bg-gray-800">
                    {product.images && product.images.length > 0 ? (
                      <>
                        <img
                          src={
                            product.images[currentImageIndex]?.url ||
                            "/placeholder-product.png"
                          }
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Navigation Arrows */}
                        {product.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 p-2 rounded-full shadow-lg transition-all"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900 p-2 rounded-full shadow-lg transition-all"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>
                          </>
                        )}

                        {/* Image Counter */}
                        <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                          {currentImageIndex + 1} / {product.images.length}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-24 w-24 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {product.images && product.images.length > 1 && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex gap-2 overflow-x-auto">
                        {product.images.map((image, index) => (
                          <motion.button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                              currentImageIndex === index
                                ? "border-blue-600 scale-105"
                                : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <img
                              src={image.url || "/placeholder-product.png"}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs - Details, Analytics, History */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <Tabs defaultValue="details" className="w-full">
                  <CardHeader>
                    <TabsList className="w-full grid grid-cols-3 bg-transparent h-12 gap-2">
                      <TabsTrigger
                        value="details"
                        className="text-xs font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200 py-2"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="analytics"
                        className="text-xs font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200 py-2"
                      >
                        <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                        Analytics
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="text-xs font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all duration-200 py-2"
                      >
                        <History className="h-3.5 w-3.5 mr-1.5" />
                        History
                      </TabsTrigger>
                    </TabsList>
                  </CardHeader>

                  <CardContent className="relative overflow-hidden p-6">
                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-8 mt-0">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        key="details"
                      >
                        {/* Description */}
                        <div>
                          <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                            Description
                          </h3>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {product.description}
                          </p>
                        </div>

                        <Separator className="my-4" />

                        {/* Apparel Details */}
                        <div>
                          <h3 className="text-sm font-semibold mb-5 text-gray-900 dark:text-gray-100">
                            Apparel Details
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                Size
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {product.apparelDetails?.size || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                Color
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {product.apparelDetails?.color || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                Material
                              </p>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {product.apparelDetails?.material || "N/A"}
                              </p>
                            </div>
                            {product.apparelDetails?.fit && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Fit
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.apparelDetails.fit}
                                </p>
                              </div>
                            )}
                            {product.apparelDetails?.pattern && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Pattern
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.apparelDetails.pattern}
                                </p>
                              </div>
                            )}
                            {product.apparelDetails?.fabricType && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Fabric
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.apparelDetails.fabricType}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Additional Info */}
                        <div>
                          <h3 className="text-sm font-semibold mb-5 text-gray-900 dark:text-gray-100">
                            Additional Information
                          </h3>
                          <div className="grid grid-cols-2 gap-5">
                            {product.brand && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Brand
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.brand}
                                </p>
                              </div>
                            )}
                            {product.season && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Season
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.season}
                                </p>
                              </div>
                            )}
                            {product.manufacturer && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Manufacturer
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.manufacturer}
                                </p>
                              </div>
                            )}
                            {product.countryOfOrigin && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Origin
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.countryOfOrigin}
                                </p>
                              </div>
                            )}
                            {product.weight && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Weight
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.weight} kg
                                </p>
                              </div>
                            )}
                            {product.dimensions && (
                              <div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                                  Dimensions
                                </p>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {product.dimensions}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        {product.tags && product.tags.length > 0 && (
                          <>
                            <Separator className="my-4" />
                            <div>
                              <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                Tags
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag, index) => (
                                  <Badge key={index} variant="outline">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* Certifications */}
                        {product.certifications &&
                          product.certifications.length > 0 && (
                            <>
                              <Separator className="my-4" />
                              <div>
                                <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-gray-100">
                                  Certifications
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                  {product.certifications.map((cert, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="bg-green-50 dark:bg-green-950/30"
                                    >
                                      <Shield className="h-3 w-3 mr-1" />
                                      {cert}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                      </motion.div>
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value="analytics" className="space-y-8 mt-0">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        key="analytics"
                      >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            {
                              label: "Views",
                              value: product.views || 0,
                              icon: Eye,
                              color: "text-blue-500",
                            },
                            {
                              label: "Sold",
                              value: product.totalSold || 0,
                              icon: ShoppingCart,
                              color: "text-green-500",
                            },
                            {
                              label: "Rating",
                              value: product.averageRating?.toFixed(1) || "N/A",
                              icon: Star,
                              color: "text-yellow-500",
                            },
                            {
                              label: "Revenue",
                              value: `$${((product.totalSold || 0) * product.price).toFixed(0)}`,
                              icon: DollarSign,
                              color: "text-purple-500",
                            },
                          ].map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                              <motion.div
                                key={stat.label}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{
                                  duration: 0.4,
                                  delay: index * 0.1,
                                }}
                              >
                                <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:scale-[1.02]">
                                  <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                          {stat.label}
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                          {stat.value}
                                        </p>
                                      </div>
                                      <div
                                        className={`h-12 w-12 rounded-full flex items-center justify-center shadow-md ${stat.color.includes("blue") ? "bg-blue-100 dark:bg-blue-900/30" : stat.color.includes("green") ? "bg-green-100 dark:bg-green-900/30" : stat.color.includes("yellow") ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-purple-100 dark:bg-purple-900/30"}`}
                                      >
                                        <Icon
                                          className={`h-6 w-6 ${stat.color}`}
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            );
                          })}
                        </div>

                        <Separator className="my-4" />

                        <div>
                          <h3 className="text-sm font-semibold mb-5 text-gray-900 dark:text-gray-100">
                            Performance Insights
                          </h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Conversion Rate
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {product.views && product.totalSold
                                  ? (
                                      (product.totalSold / product.views) *
                                      100
                                    ).toFixed(1)
                                  : "0"}
                                %
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Average Order Value
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                ${product.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                Stock Turn Rate
                              </span>
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {product.totalSold && product.quantity
                                  ? (
                                      (product.totalSold /
                                        (product.totalSold +
                                          product.quantity)) *
                                      100
                                    ).toFixed(1)
                                  : "0"}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-8 mt-0">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                        key="history"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start gap-3 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full">
                              <Package className="h-4 w-4 text-blue-600" />
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

                          <div className="flex items-start gap-3 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                              <RefreshCw className="h-4 w-4 text-green-600" />
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
                            <div className="flex items-start gap-3 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-full">
                                <Box className="h-4 w-4 text-purple-600" />
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
                            <div className="flex items-start gap-3 p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-100/50 dark:border-gray-700/50 hover:shadow-md transition-all">
                              <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full">
                                <ShoppingCart className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  Last Sold
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {new Date(
                                    product.lastSoldAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {product.blockchainProductId && (
                          <>
                            <Separator className="my-4" />
                            <div className="p-4 bg-cyan-50 dark:bg-cyan-950/30 rounded-lg border border-cyan-200 dark:border-cyan-800">
                              <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-5 w-5 text-cyan-600" />
                                <h4 className="font-semibold">
                                  Blockchain Information
                                </h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">
                                    Product ID:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded">
                                      {product.blockchainProductId.substring(
                                        0,
                                        8
                                      )}
                                      ...
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
                                        <Check className="h-4 w-4" />
                                      ) : (
                                        <Copy className="h-4 w-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground">
                                    Status:
                                  </span>
                                  <Badge className="bg-green-600">
                                    Verified
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={() =>
                                    router.push(
                                      `/vendor/my-products/${product._id}/history`
                                    )
                                  }
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Full Blockchain History
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Quick Info & Actions */}
          <div className="space-y-8">
            {/* Quick Stats */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Stock
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        {product.quantity}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsStockModalOpen(true)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Price
                      </span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  {product.costPrice && product.costPrice > 0 && (
                    <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Profit Margin
                        </span>
                      </div>
                      <span className="font-bold text-lg text-green-600 dark:text-green-400">
                        ${(product.price - product.costPrice).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Total Sold
                      </span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {product.totalSold || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Views
                      </span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      {product.views || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Rating
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        {product.averageRating?.toFixed(1) || "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Status */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    Product Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-lg ${stockStatus.bg}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Availability
                      </span>
                      <Badge
                        className={`${stockStatus.color.includes("green") ? "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400" : stockStatus.color.includes("red") ? "bg-red-100/80 text-red-700 dark:bg-red-900/30 dark:text-red-400" : stockStatus.color.includes("orange") ? "bg-amber-100/80 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"} shadow-sm backdrop-blur-sm text-xs`}
                      >
                        {stockStatus.text}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-shadow">
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      Status
                    </span>
                    <Badge
                      className={
                        product.status === "active"
                          ? "bg-green-100/80 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm backdrop-blur-sm text-xs"
                          : "bg-gray-100/80 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400 shadow-sm backdrop-blur-sm text-xs"
                      }
                    >
                      {product.status}
                    </Badge>
                  </div>

                  {product.freeShipping && (
                    <div className="flex items-center justify-between p-4 bg-blue-50/80 dark:bg-blue-950/30 backdrop-blur-sm rounded-lg border border-blue-100/50 dark:border-blue-900/30 hover:shadow-md transition-shadow">
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Shipping
                      </span>
                      <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm backdrop-blur-sm text-xs">
                        Free Shipping
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <button
                    onClick={() =>
                      router.push(`/vendor/my-products/${product._id}/edit`)
                    }
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors cursor-pointer text-left"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    Edit Product
                  </button>

                  <button
                    onClick={() => setIsStockModalOpen(true)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors cursor-pointer text-left"
                  >
                    <Box className="h-3.5 w-3.5" />
                    Update Stock
                  </button>

                  <button
                    onClick={() =>
                      window.open(`/products/${product._id}`, "_blank")
                    }
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors cursor-pointer text-left"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View as Customer
                  </button>

                  <button
                    onClick={() => copyToClipboard(product.sku || "", "sku")}
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors cursor-pointer text-left"
                  >
                    {copiedField === "sku" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    Copy SKU
                  </button>

                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/products/${product._id}`;
                      copyToClipboard(shareUrl, "share");
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium transition-colors cursor-pointer text-left"
                  >
                    {copiedField === "share" ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                    Share Product
                  </button>

                  <div className="border-t my-3"></div>

                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center gap-2 w-full px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-700 text-xs text-white font-medium transition-colors cursor-pointer shadow-lg hover:shadow-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Product
                  </button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Product Info */}
            <motion.div
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Product Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Created
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Last Updated
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {new Date(product.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      SKU
                    </span>
                    <code className="text-xs bg-white dark:bg-gray-900 px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                      {product.sku}
                    </code>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Category
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {product.category}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Subcategory
                    </span>
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                      {product.subcategory}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Product
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  Are you sure you want to delete{" "}
                  <strong>{product.name}</strong>? This action cannot be undone
                  and will permanently remove the product from your inventory.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-blue-600" />
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
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum stock level: {product.minStockLevel} units
                </p>
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsStockModalOpen(false)}
                  disabled={isUpdatingStock}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateStock} disabled={isUpdatingStock}>
                  {isUpdatingStock ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Update Stock
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
