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
  CubeIcon,
  TagIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  InboxIcon,
  ShoppingCartIcon,
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

type InventoryItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sku: string;
  status: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unit: string;
  pricePerUnit: number;
  costPrice: number;
  totalValue: number;
  images: string[];
  textileDetails: {
    fabricType: string;
    composition: string;
    gsm: string;
    width: string;
    color: string;
    pattern: string;
    finish: string;
    careInstructions: string;
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
  qualityGrade: string;
  countryOfOrigin: string;
  leadTime: string;
  reorderLevel: number;
  minStockLevel: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  lastRestocked: string;
};

export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params?.id as string;

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  const [inventoryItem, setInventoryItem] = useState<InventoryItem | null>(
    null
  );

  // Fetch inventory data
  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!inventoryId) return;

      setIsLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/inventory/${inventoryId}`);
        // const data = await response.json();

        // Mock data
        const mockData: InventoryItem = {
          id: inventoryId,
          name: "Premium Cotton Fabric",
          description:
            "High-quality 100% cotton fabric suitable for premium garments. Perfect for shirts, dresses, and lightweight apparel. Pre-washed and shrink-resistant.",
          category: "Fabric",
          subcategory: "Cotton Fabric",
          sku: "FAB-COT-001",
          status: "active",
          quantity: 500,
          reservedQuantity: 100,
          availableQuantity: 400,
          unit: "meters",
          pricePerUnit: 25.5,
          costPrice: 20.0,
          totalValue: 12750,
          images: [
            "https://via.placeholder.com/800x600?text=Cotton+Fabric+View+1",
            "https://via.placeholder.com/800x600?text=Cotton+Fabric+View+2",
            "https://via.placeholder.com/800x600?text=Cotton+Fabric+View+3",
            "https://via.placeholder.com/800x600?text=Cotton+Fabric+View+4",
          ],
          textileDetails: {
            fabricType: "Cotton",
            composition: "100% Cotton",
            gsm: "180",
            width: "150cm",
            color: "Navy Blue",
            pattern: "Solid",
            finish: "Dyed",
            careInstructions: "Machine wash cold, tumble dry low",
          },
          supplier: {
            name: "ABC Textiles Ltd.",
            contact: {
              phone: "+92 300 1234567",
              email: "contact@abctextiles.com",
              address: "123 Textile Street, Karachi, Pakistan",
            },
          },
          certifications: ["GOTS", "OEKO-TEX", "Organic Certified"],
          qualityGrade: "A",
          countryOfOrigin: "Pakistan",
          leadTime: "10 days",
          reorderLevel: 150,
          minStockLevel: 100,
          tags: ["premium", "cotton", "navy", "organic"],
          createdAt: "2024-01-15T10:30:00Z",
          updatedAt: "2024-11-05T14:20:00Z",
          lastRestocked: "2024-10-20T09:00:00Z",
        };

        setInventoryItem(mockData);
        setTimeout(() => setIsVisible(true), 100);
      } catch (error) {
        toast.error("Failed to load inventory data");
        console.error("Error fetching inventory:", error);
        router.push("/supplier/inventory");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventoryData();
  }, [inventoryId, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // TODO: API call to delete inventory
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Inventory item deleted successfully");
      router.push("/supplier/inventory");
    } catch (error) {
      toast.error("Failed to delete inventory item");
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div
        className={`${colors.backgrounds.primary} flex items-center justify-center`}
      >
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
    <div className={`${colors.backgrounds.primary}`}>
      <div className="relative z-10 p-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/supplier/inventory">
                Inventory
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{inventoryItem.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 mb-6 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className={`text-2xl font-bold ${colors.texts.primary}`}>
                  {inventoryItem.name}
                </h1>
              </div>
              <p className={`text-sm ${colors.texts.secondary}`}>
                SKU: {inventoryItem.sku}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                className={`${badgeColors[stockStatus.color as keyof typeof badgeColors].bg} ${badgeColors[stockStatus.color as keyof typeof badgeColors].border} ${badgeColors[stockStatus.color as keyof typeof badgeColors].text} text-xs rounded-none`}
                >
                  {stockStatus.label}
                </Badge>
                <Badge
                  className={`${badgeColors.blue.bg} ${badgeColors.blue.border} ${badgeColors.blue.text} text-xs rounded-none`}
                >
                  {inventoryItem.category}
                </Badge>
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  <ShieldCheckIcon
                    className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                  />
                  Grade {inventoryItem.qualityGrade}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/supplier/inventory/edit/${inventoryId}`)
                }
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <PencilSquareIcon className="h-3 w-3 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-xs cursor-pointer h-8 border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 rounded-none"
              >
                <TrashIcon className="h-3 w-3 mr-2 text-red-600 dark:text-red-400" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Image Gallery */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none overflow-hidden border-0 -mt-6`}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square group">
                  {inventoryItem.images.length > 0 ? (
                    <>
                      <img
                        src={inventoryItem.images[currentImageIndex]}
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
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-none backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {inventoryItem.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex
                                    ? "bg-gray-600 w-6"
                                    : "bg-gray-400"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ArchiveBoxIcon className="h-20 w-20 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
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
                          src={image}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
            >
              <CardHeader className="pb-3">
                <h3 className={`text-sm font-semibold ${colors.texts.primary}`}>
                  Quick Actions
                </h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-9 rounded-none border-gray-200 dark:border-gray-700"
                  onClick={() =>
                    router.push(`/supplier/inventory/edit/${inventoryId}`)
                  }
                >
                  <PencilSquareIcon className="h-4 w-4 mr-2" />
                  Edit Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-9 rounded-none border-gray-200 dark:border-gray-700"
                  disabled
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  Restock Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs h-9 rounded-none border-gray-200 dark:border-gray-700"
                  disabled
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                  Transfer Stock
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="w-full justify-start bg-transparent rounded-none p-0 h-auto mb-6">
                <TabsTrigger
                  value="basic"
                  className="mr-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white"
                >
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger
                  value="textile"
                  className="mr-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white"
                >
                  <CubeIcon className="h-4 w-4 mr-2" />
                  Textile Details
                </TabsTrigger>
                <TabsTrigger
                  value="stock"
                  className="mr-2 rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white"
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-2" />
                  Stock & Pricing
                </TabsTrigger>
                <TabsTrigger
                  value="supplier"
                  className="rounded-none bg-transparent data-[state=active]:bg-gray-900 data-[state=active]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-gray-900 text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 data-[state=active]:border-gray-900 dark:data-[state=active]:border-white hover:border-black dark:hover:border-white"
                >
                  <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
                  Supplier
                </TabsTrigger>
              </TabsList>

              {/* Basic Info Tab */}
              <TabsContent value="basic" className="mt-0 space-y-6">
                {/* Description */}
                <Card
                  className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
                >
                  <CardHeader>
                    <h3
                      className={`text-sm font-semibold ${colors.texts.primary}`}
                    >
                      Description
                    </h3>
                  </CardHeader>
                  <Separator className="mb-4" />
                  <CardContent>
                    <p
                      className={`text-sm ${colors.texts.secondary} leading-relaxed`}
                    >
                      {inventoryItem.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Pricing Information */}
                <Card
                  className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
                >
                  <CardHeader>
                    <h3
                      className={`text-sm font-semibold ${colors.texts.primary}`}
                    >
                      Pricing & Value
                    </h3>
                  </CardHeader>
                  <Separator className="mb-4" />
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className={`text-xs ${colors.texts.accent}`}>
                          Unit Price
                        </p>
                        <p
                          className={`text-lg font-bold ${colors.texts.primary}`}
                        >
                          Rs {inventoryItem.pricePerUnit.toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs ${colors.texts.accent}`}>
                          Cost Price
                        </p>
                        <p
                          className={`text-lg font-bold ${colors.texts.primary}`}
                        >
                          Rs {inventoryItem.costPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs ${colors.texts.accent}`}>
                          Profit Margin
                        </p>
                        <p
                          className={`text-lg font-bold ${colors.texts.success}`}
                        >
                          {(
                            ((inventoryItem.pricePerUnit -
                              inventoryItem.costPrice) /
                              inventoryItem.pricePerUnit) *
                            100
                          ).toFixed(1)}
                          %
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className={`text-xs ${colors.texts.accent}`}>
                          Total Inventory Value
                        </p>
                        <p
                          className={`text-lg font-bold ${colors.texts.primary}`}
                        >
                          Rs {inventoryItem.totalValue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Management */}
                <Card
                  className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
                >
                  <CardHeader>
                    <h3
                      className={`text-sm font-semibold ${colors.texts.primary}`}
                    >
                      Stock Management
                    </h3>
                  </CardHeader>
                  <Separator className="mb-4" />
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.accent}`}>
                            Reorder Level
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.reorderLevel} {inventoryItem.unit}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.accent}`}>
                            Min Stock Level
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.minStockLevel} {inventoryItem.unit}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className={`text-xs ${colors.texts.accent}`}>
                            Lead Time
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.leadTime}
                          </p>
                        </div>
                      </div>

                      {inventoryItem.availableQuantity <
                        inventoryItem.reorderLevel && (
                        <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 rounded-none">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p
                              className={`text-xs ${colors.texts.accent} mb-1`}
                            >
                              Reorder Alert
                            </p>
                            <p
                              className={`text-xs ${colors.texts.secondary} mt-1`}
                            >
                              Stock level is below reorder point. Consider
                              restocking soon.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Tags & Certifications */}
                <Card
                  className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
                >
                  <CardHeader>
                    <h3
                      className={`text-sm font-semibold ${colors.texts.primary}`}
                    >
                      Tags & Certifications
                    </h3>
                  </CardHeader>
                  <Separator className="mb-4" />
                  <CardContent className="space-y-4">
                    <div>
                      <p className={`text-xs ${colors.texts.accent} mb-2`}>
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {inventoryItem.tags.map((tag) => (
                          <Badge
                            key={tag}
                            className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} text-xs rounded-none`}
                          >
                            <TagIcon
                              className={`h-3 w-3 mr-1 ${badgeColors.grey.icon}`}
                            />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className={`text-xs ${colors.texts.accent} mb-2`}>
                        Certifications
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {inventoryItem.certifications.map((cert) => (
                          <Badge
                            key={cert}
                            className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                          >
                            <CheckCircleIcon
                              className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                            />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Textile Details Tab */}
              <TabsContent value="textile" className="mt-0">
                <Card
                  className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
                >
                  <CardHeader>
                    <h3
                      className={`text-sm font-semibold ${colors.texts.primary}`}
                    >
                      Textile Specifications
                    </h3>
                  </CardHeader>
                  <Separator className="mb-4" />
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Fabric Type
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.textileDetails.fabricType}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Composition
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.textileDetails.composition}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            GSM (Grams per Square Meter)
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.textileDetails.gsm}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Width
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.textileDetails.width}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Color
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-none border border-gray-200 dark:border-gray-700 bg-[#001f3f]" />
                            <p
                              className={`text-sm font-semibold ${colors.texts.primary}`}
                            >
                              {inventoryItem.textileDetails.color}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Pattern
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.textileDetails.pattern}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Finish
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.textileDetails.finish}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Country of Origin
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.countryOfOrigin}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div>
                      <p className={`text-xs ${colors.texts.accent} mb-2`}>
                        Care Instructions
                      </p>
                      <p
                        className={`text-sm ${colors.texts.secondary} leading-relaxed`}
                      >
                        {inventoryItem.textileDetails.careInstructions}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Stock & Pricing Tab */}
              <TabsContent value="stock" className="mt-0">
                <Card
                  className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
                >
                  <CardHeader>
                    <h3
                      className={`text-sm font-semibold ${colors.texts.primary}`}
                    >
                      Stock & Pricing Details
                    </h3>
                  </CardHeader>
                  <Separator className="mb-4" />
                  <CardContent>
                    <div className="space-y-6">
                      {/* Stock Levels */}
                      <div>
                        <p className={`text-xs ${colors.texts.accent} mb-3`}>
                          Stock Levels
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Current Quantity
                            </p>
                            <p
                              className={`text-lg font-bold ${colors.texts.primary}`}
                            >
                              {inventoryItem.quantity} {inventoryItem.unit}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Available Quantity
                            </p>
                            <p
                              className={`text-lg font-bold ${colors.texts.primary}`}
                            >
                              {inventoryItem.availableQuantity}{" "}
                              {inventoryItem.unit}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Reserved Quantity
                            </p>
                            <p
                              className={`text-sm font-semibold ${colors.texts.primary}`}
                            >
                              {inventoryItem.reservedQuantity}{" "}
                              {inventoryItem.unit}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Last Restocked
                            </p>
                            <p
                              className={`text-sm font-semibold ${colors.texts.primary}`}
                            >
                              {formatDate(inventoryItem.lastRestocked)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Pricing Details */}
                      <div>
                        <p className={`text-xs ${colors.texts.accent} mb-3`}>
                          Pricing Details
                        </p>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Unit Price
                            </p>
                            <p
                              className={`text-lg font-bold ${colors.texts.primary}`}
                            >
                              Rs {inventoryItem.pricePerUnit.toFixed(2)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Cost Price
                            </p>
                            <p
                              className={`text-lg font-bold ${colors.texts.primary}`}
                            >
                              Rs {inventoryItem.costPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Profit Margin
                            </p>
                            <p
                              className={`text-lg font-bold ${colors.texts.success}`}
                            >
                              {(
                                ((inventoryItem.pricePerUnit -
                                  inventoryItem.costPrice) /
                                  inventoryItem.pricePerUnit) *
                                100
                              ).toFixed(1)}
                              %
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className={`text-xs ${colors.texts.accent}`}>
                              Total Value
                            </p>
                            <p
                              className={`text-lg font-bold ${colors.texts.primary}`}
                            >
                              Rs {inventoryItem.totalValue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Supplier Tab */}
              <TabsContent value="supplier" className="mt-0">
                <Card
                  className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
                >
                  <CardHeader>
                    <h3
                      className={`text-sm font-semibold ${colors.texts.primary}`}
                    >
                      Supplier Information
                    </h3>
                  </CardHeader>
                  <Separator className="mb-4" />
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <p className={`text-xs ${colors.texts.accent} mb-1`}>
                          Supplier Name
                        </p>
                        <p
                          className={`text-base font-bold ${colors.texts.primary}`}
                        >
                          {inventoryItem.supplier.name}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Phone
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.supplier.contact.phone}
                          </p>
                        </div>
                        <div>
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Email
                          </p>
                          <p
                            className={`text-sm font-semibold ${colors.texts.primary}`}
                          >
                            {inventoryItem.supplier.contact.email}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className={`text-xs ${colors.texts.accent} mb-1`}>
                          Address
                        </p>
                        <p
                          className={`text-sm font-semibold ${colors.texts.primary}`}
                        >
                          {inventoryItem.supplier.contact.address}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-6">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-none">
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Lead Time
                          </p>
                          <p
                            className={`text-sm font-bold ${colors.texts.primary}`}
                          >
                            {inventoryItem.leadTime}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-none">
                          <p className={`text-xs ${colors.texts.accent} mb-1`}>
                            Last Restocked
                          </p>
                          <p
                            className={`text-sm font-bold ${colors.texts.primary}`}
                          >
                            {formatDate(inventoryItem.lastRestocked)}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-9 rounded-none border-gray-200 dark:border-gray-700"
                        disabled
                      >
                        <BuildingStorefrontIcon className="h-4 w-4 mr-2" />
                        View Supplier Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent
            className={`${colors.backgrounds.modal} ${colors.borders.primary} rounded-none shadow-none`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-base font-bold flex items-center gap-3 ${colors.texts.primary}`}
              >
                <TrashIcon className="h-5 w-5 text-red-600" />
                Delete Inventory Item
              </DialogTitle>
              <DialogDescription
                className={`text-xs ${colors.texts.secondary}`}
              >
                This action cannot be undone. This will permanently delete the
                inventory item and remove all associated data.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 p-4 rounded-none">
              <p className="text-xs text-red-800 dark:text-red-300">
                <strong>Warning:</strong> Deleting this item will remove it from
                blockchain records and affect any pending orders or
                reservations.
              </p>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
                size="sm"
                className="text-xs h-8 rounded-none border-gray-200 dark:border-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white text-xs h-8 rounded-none"
              >
                {isDeleting ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <TrashIcon className="h-3 w-3 mr-2" />
                )}
                {isDeleting ? "Deleting..." : "Delete Item"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-4xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none p-0">
            <div className="relative aspect-video bg-black">
              <img
                src={inventoryItem.images[currentImageIndex]}
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
