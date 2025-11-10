/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArchiveBoxIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CameraIcon,
  SwatchIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  InboxIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
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

// ========================================
// HARDCODED CATEGORIES
// ========================================
const inventoryCategories = [
  "Raw Material",
  "Fabric",
  "Yarn & Thread",
  "Dyes & Chemicals",
  "Trims & Accessories",
  "Packaging",
  "Semi-Finished",
  "Tools & Equipment",
];

const subcategoryMap: { [key: string]: string[] } = {
  "Raw Material": [
    "Cotton Fabric",
    "Polyester Fabric",
    "Silk Fabric",
    "Wool Fabric",
    "Linen Fabric",
    "Denim Fabric",
    "Jersey Fabric",
    "Blended Fabric",
  ],
  Fabric: [
    "Cotton Fabric",
    "Polyester Fabric",
    "Silk Fabric",
    "Wool Fabric",
    "Linen Fabric",
    "Denim Fabric",
    "Jersey Fabric",
    "Blended Fabric",
  ],
  "Yarn & Thread": [
    "Cotton Yarn",
    "Polyester Yarn",
    "Sewing Thread",
    "Embroidery Thread",
  ],
  "Dyes & Chemicals": [
    "Fabric Dye",
    "Bleach",
    "Softener",
    "Finishing Chemical",
  ],
  "Trims & Accessories": [
    "Buttons",
    "Zippers",
    "Elastic",
    "Lace",
    "Ribbon",
    "Labels",
    "Tags",
  ],
  Packaging: ["Poly Bags", "Hangers", "Boxes", "Tissue Paper"],
  "Semi-Finished": [
    "Cut Fabric",
    "Printed Fabric",
    "Dyed Fabric",
    "Stitched Panels",
  ],
  "Tools & Equipment": ["Scissors", "Needles", "Measuring Tools", "Other"],
};

const materialTypes = [
  "Raw Material",
  "Semi-Finished",
  "Finished Component",
  "Accessory",
  "Packaging",
  "Tool",
  "Consumable",
];

const fabricTypes = [
  "Cotton",
  "Polyester",
  "Silk",
  "Wool",
  "Linen",
  "Denim",
  "Jersey",
  "Chiffon",
  "Satin",
  "Velvet",
  "Fleece",
  "Rayon",
  "Nylon",
  "Spandex",
  "Blended",
];

const patterns = [
  "Solid",
  "Striped",
  "Checked",
  "Printed",
  "Floral",
  "Abstract",
  "Geometric",
  "Polka Dot",
  "Embroidered",
  "Plaid",
];

const finishes = [
  "Raw",
  "Bleached",
  "Dyed",
  "Printed",
  "Coated",
  "Plain",
  "Satin",
  "Plain Weave",
  "Twill",
  "Satin Weave",
  "Jacquard",
  "Houndstooth",
  "Tartan",
  "Chevron",
  "Geometric",
  "Abstract",
  "Digital",
  "3D",
  "Textured",
  "Metallic",
];

const units = [
  "pieces",
  "meters",
  "yards",
  "kilograms",
  "grams",
  "rolls",
  "boxes",
  "liters",
  "sets",
];

const qualityGrades = ["A", "B", "C", "Rejected"];

const certifications = [
  "ISO 9001",
  "ISO 14001",
  "GOTS",
  "OEKO-TEX",
  "Fair Trade",
  "Organic Certified",
  "GRS Certified",
  "BCI Cotton",
];

const seasons = ["Spring", "Summer", "Autumn", "Winter", "All Season"];

const statuses = [
  "draft",
  "active",
  "inactive",
  "out_of_stock",
  "discontinued",
  "archived",
  "low_stock",
  "on_order",
  "quarantined",
];

// ================== Types ==================
type TextileDetails = {
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

type SupplierContact = {
  phone: string;
  email: string;
  address: string;
};

type FormDataType = {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  materialType: string;
  brand: string;
  textileDetails: TextileDetails;
  pricePerUnit: string;
  costPrice: string;
  originalPrice: string;
  discount: string;
  quantity: string;
  reservedQuantity: string;
  committedQuantity: string;
  damagedQuantity: string;
  minStockLevel: string;
  reorderLevel: string;
  reorderQuantity: string;
  maximumQuantity: string;
  safetyStockLevel: string;
  unit: string;
  sku: string;
  weight: string;
  dimensions: string;
  tags: string[];
  season: string;
  countryOfOrigin: string;
  manufacturer: string;
  supplierName: string;
  supplierContact: SupplierContact;
  status: string;
  isSustainable: boolean;
  certifications: string[];
  sustainabilityCertifications: string[];
  complianceStandards: string[];
  qualityGrade: string;
  leadTime: string;
  estimatedDeliveryDays: string;
  shelfLife: string;
  images: string[];
  notes: string;
  internalCode: string;
  barcode: string;
  carbonFootprint: string;
  recycledContent: string;
  autoReorderEnabled: boolean;
  isBatchTracked: boolean;
};

type ErrorsType = {
  [key: string]: string;
};

// Preview Card Component
const PreviewCard = ({ formData }: { formData: FormDataType }) => {
  const getStockStatus = () => {
    const qty = parseInt(formData.quantity) || 0;
    if (qty === 0) return { label: "Out of Stock", color: "red" };
    if (qty < 20) return { label: "Low Stock", color: "yellow" };
    return { label: "In Stock", color: "green" };
  };

  const stockStatus = getStockStatus();

  return (
    <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 rounded-none overflow-hidden w-full p-0 shadow-none">
      {/* Image Section */}
      <div className="relative w-full h-72 bg-gray-100 dark:bg-gray-800 overflow-hidden m-0">
        {formData.images.length > 0 ? (
          <img
            src={formData.images[0]}
            alt={formData.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            <ArchiveBoxIcon className="h-20 w-20" />
          </div>
        )}

        {/* Stock Status Badge */}
        <div className="absolute top-2 right-2">
          <Badge
            className={`
              ${stockStatus.color === "green" ? "bg-green-100/10 dark:bg-green-900/10 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400" : ""}
              ${stockStatus.color === "yellow" ? "bg-yellow-100/10 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400" : ""}
              ${stockStatus.color === "red" ? "bg-red-100/10 dark:bg-red-900/10 border-red-100 dark:border-red-900 text-red-700 dark:text-red-400" : ""}
              border text-xs rounded-none backdrop-blur-sm
            `}
          >
            {stockStatus.label}
          </Badge>
        </div>

        {/* Category Badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none backdrop-blur-sm">
            {formData.category || "Category"}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-3 space-y-2.5">
        {/* Name and SKU */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5 line-clamp-2 leading-tight">
            {formData.name || "Sample Inventory Item"}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            SKU: {formData.sku || "N/A"}
          </p>
        </div>

        {/* Price Section */}
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-none">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Unit Price
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
              Rs {parseFloat(formData.pricePerUnit || "0").toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              Available Quantity
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formData.quantity || "0"} {formData.unit}
            </span>
          </div>
        </div>

        {/* Textile Details Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-none">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
              Color
            </p>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {formData.textileDetails?.color || "N/A"}
            </p>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-none">
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-0.5">
              Fabric Type
            </p>
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
              {formData.textileDetails?.fabricType || "N/A"}
            </p>
          </div>
        </div>

        {/* Total Value */}
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-2 rounded-none">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Total Inventory Value
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Rs{" "}
              {(
                parseFloat(formData.pricePerUnit || "0") *
                parseInt(formData.quantity || "0")
              ).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full text-xs font-medium h-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white rounded-none cursor-not-allowed opacity-90"
          >
            <InboxIcon className="h-4 w-4 mr-1.5" />
            Request
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="w-full text-xs font-medium h-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-900 dark:border-white rounded-none cursor-not-allowed"
          >
            <EyeIcon className="h-4 w-4 mr-1.5 text-gray-900 dark:text-gray-100" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function EditInventoryPage() {
  const router = useRouter();
  const params = useParams();
  const inventoryId = params?.id as string;
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    materialType: "Raw Material",
    brand: "",
    textileDetails: {
      fabricType: "",
      composition: "",
      gsm: "",
      width: "",
      fabricWeight: "",
      color: "",
      colorCode: "",
      pattern: "Solid",
      finish: "",
      careInstructions: "",
      shrinkage: "",
      washability: "",
    },
    pricePerUnit: "",
    costPrice: "",
    originalPrice: "",
    discount: "",
    quantity: "",
    reservedQuantity: "0",
    committedQuantity: "0",
    damagedQuantity: "0",
    minStockLevel: "10",
    reorderLevel: "20",
    reorderQuantity: "50",
    maximumQuantity: "",
    safetyStockLevel: "15",
    unit: "pieces",
    sku: "",
    weight: "",
    dimensions: "",
    tags: [],
    season: "All Season",
    countryOfOrigin: "",
    manufacturer: "",
    supplierName: "",
    supplierContact: {
      phone: "",
      email: "",
      address: "",
    },
    status: "active",
    isSustainable: false,
    certifications: [],
    sustainabilityCertifications: [],
    complianceStandards: [],
    qualityGrade: "",
    leadTime: "7",
    estimatedDeliveryDays: "7",
    shelfLife: "",
    images: [],
    notes: "",
    internalCode: "",
    barcode: "",
    carbonFootprint: "",
    recycledContent: "",
    autoReorderEnabled: false,
    isBatchTracked: false,
  });

  const [errors, setErrors] = useState<ErrorsType>({});
  const [tagInput, setTagInput] = useState<string>("");
  const [complianceInput, setComplianceInput] = useState<string>("");
  const [sustainabilityInput, setSustainabilityInput] = useState<string>("");

  // Fetch existing inventory data
  useEffect(() => {
    const fetchInventoryData = async () => {
      if (!inventoryId) return;

      setIsFetching(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/inventory/${inventoryId}`);
        // const data = await response.json();

        // Mock data for demonstration
        const mockData: FormDataType = {
          name: "Premium Cotton Fabric",
          description: "High-quality 100% cotton fabric suitable for garments",
          category: "Fabric",
          subcategory: "Cotton Fabric",
          materialType: "Raw Material",
          brand: "Textile Pro",
          textileDetails: {
            fabricType: "Cotton",
            composition: "100% Cotton",
            gsm: "180",
            width: "150",
            fabricWeight: "180",
            color: "Navy Blue",
            colorCode: "#001f3f",
            pattern: "Solid",
            finish: "Dyed",
            careInstructions: "Machine wash cold",
            shrinkage: "2-3%",
            washability: "Machine Washable",
          },
          pricePerUnit: "25.50",
          costPrice: "20.00",
          originalPrice: "25.50",
          discount: "0",
          quantity: "500",
          reservedQuantity: "50",
          committedQuantity: "100",
          damagedQuantity: "5",
          minStockLevel: "100",
          reorderLevel: "150",
          reorderQuantity: "300",
          maximumQuantity: "1000",
          safetyStockLevel: "120",
          unit: "meters",
          sku: "FAB-COT-001",
          weight: "180",
          dimensions: "150cm x 100m",
          tags: ["premium", "cotton", "navy"],
          season: "All Season",
          countryOfOrigin: "Pakistan",
          manufacturer: "Cotton Mills Ltd",
          supplierName: "ABC Textiles Ltd.",
          supplierContact: {
            phone: "+92 300 1234567",
            email: "contact@abctextiles.com",
            address: "123 Textile Street, Karachi",
          },
          status: "active",
          isSustainable: true,
          certifications: ["GOTS", "OEKO-TEX"],
          sustainabilityCertifications: ["Organic Certified"],
          complianceStandards: ["ISO 9001"],
          qualityGrade: "A",
          leadTime: "10",
          estimatedDeliveryDays: "10",
          shelfLife: "24 months",
          images: [
            "https://via.placeholder.com/400x300?text=Cotton+Fabric+1",
            "https://via.placeholder.com/400x300?text=Cotton+Fabric+2",
          ],
          notes: "Premium quality fabric",
          internalCode: "INT-001",
          barcode: "1234567890123",
          carbonFootprint: "Low",
          recycledContent: "0%",
          autoReorderEnabled: true,
          isBatchTracked: true,
        };

        setFormData(mockData);
        toast.success("Inventory data loaded successfully");
      } catch (error) {
        toast.error("Failed to load inventory data");
        console.error("Error fetching inventory:", error);
        router.push("/supplier/inventory");
      } finally {
        setIsFetching(false);
        setIsVisible(true);
      }
    };

    fetchInventoryData();
  }, [inventoryId, router]);

  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "pricePerUnit" || field === "costPrice") {
      const unitPrice =
        parseFloat(field === "pricePerUnit" ? value : formData.pricePerUnit) ||
        0;
      const costPrice =
        parseFloat(field === "costPrice" ? value : formData.costPrice) || 0;
      if (unitPrice > 0) {
        const discount = ((unitPrice - costPrice) / unitPrice) * 100;
        setFormData((prev) => ({ ...prev, discount: discount.toFixed(2) }));
      } else {
        setFormData((prev) => ({ ...prev, discount: "0.00" }));
      }
    }
  };

  const handleTextileDetailChange = (
    field: keyof TextileDetails,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      textileDetails: { ...prev.textileDetails, [field]: value },
    }));
  };

  const handleSupplierContactChange = (
    field: keyof SupplierContact,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      supplierContact: { ...prev.supplierContact, [field]: value },
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addComplianceStandard = () => {
    if (
      complianceInput.trim() &&
      !formData.complianceStandards.includes(complianceInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        complianceStandards: [
          ...prev.complianceStandards,
          complianceInput.trim(),
        ],
      }));
      setComplianceInput("");
    }
  };

  const removeComplianceStandard = (standard: string) => {
    setFormData((prev) => ({
      ...prev,
      complianceStandards: prev.complianceStandards.filter(
        (s) => s !== standard
      ),
    }));
  };

  const addSustainabilityCertification = () => {
    if (
      sustainabilityInput.trim() &&
      !formData.sustainabilityCertifications.includes(
        sustainabilityInput.trim()
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        sustainabilityCertifications: [
          ...prev.sustainabilityCertifications,
          sustainabilityInput.trim(),
        ],
      }));
      setSustainabilityInput("");
    }
  };

  const removeSustainabilityCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      sustainabilityCertifications: prev.sustainabilityCertifications.filter(
        (c) => c !== cert
      ),
    }));
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newImages: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const mockImageUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(
          file.name
        )}`;
        newImages.push(mockImageUrl);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));

      toast.success(`${files.length} image(s) uploaded successfully!`);
    } catch (error) {
      toast.error("Failed to upload images");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors: ErrorsType = {};

    if (!formData.name.trim()) newErrors.name = "Item name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subcategory)
      newErrors.subcategory = "Subcategory is required";
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0)
      newErrors.pricePerUnit = "Valid price is required";
    if (!formData.quantity || parseInt(formData.quantity) < 0)
      newErrors.quantity = "Valid quantity is required";
    if (!formData.textileDetails.color.trim())
      newErrors["textileDetails.color"] = "Color is required";
    if (!formData.supplierName.trim())
      newErrors.supplierName = "Supplier name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveAsDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("inventory_drafts") || "[]");
    const draft = {
      id: inventoryId,
      ...formData,
      status: "draft",
      updatedAt: new Date().toISOString(),
    };
    const existingIndex = drafts.findIndex((d: any) => d.id === inventoryId);
    if (existingIndex >= 0) {
      drafts[existingIndex] = draft;
    } else {
      drafts.push(draft);
    }
    localStorage.setItem("inventory_drafts", JSON.stringify(drafts));
    toast.success("Changes saved as draft");
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);

    try {
      // TODO: API call implementation
      // await fetch(`/api/inventory/${inventoryId}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(formData)
      // });

      console.log("Updating inventory data:", formData);
      toast.success("Inventory item updated successfully!");
      router.push("/supplier/inventory");
    } catch (error) {
      toast.error("Failed to update inventory item");
      console.error("Error updating inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepProgress = () => (currentStep / totalSteps) * 100;

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900 dark:text-gray-100 mx-auto mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Loading inventory data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              <BreadcrumbPage>Edit Item</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Inventory Item
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Update textile materials and components information
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none">
                  <PencilSquareIcon className="h-3 w-3 mr-1 text-blue-700 dark:text-blue-400" />
                  Editing: {formData.sku}
                </Badge>
                <Badge className="bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 flex items-center gap-1 text-xs rounded-none">
                  <ShieldCheckIcon className="h-3 w-3 text-green-700 dark:text-green-400" />
                  Blockchain Tracked
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/supplier/inventory")}
                size="sm"
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                <XMarkIcon className="h-3 w-3 mr-2" />
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={saveAsDraft}
                size="sm"
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                <DocumentDuplicateIcon className="h-3 w-3 mr-2" />
                Save Draft
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                size="sm"
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                {showPreview ? (
                  <>
                    <EyeSlashIcon className="h-3 w-3 mr-2" />
                    Hide Preview
                  </>
                ) : (
                  <>
                    <EyeIcon className="h-3 w-3 mr-2" />
                    Show Preview
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content - Form with Preview */}
        <div
          className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}
        >
          {/* Form Section with Progress Bar */}
          <div className={showPreview ? "lg:col-span-9" : "lg:col-span-12"}>
            {/* Progress Bar */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none mb-6 shadow-none`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    Step {currentStep} of {totalSteps}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.round(getStepProgress())}% Complete
                  </span>
                </div>
                <Progress
                  value={getStepProgress()}
                  className="h-2 mb-4 rounded-none"
                />
                <div className="grid grid-cols-6 gap-3">
                  {[
                    { step: 1, title: "Basic Info", icon: DocumentTextIcon },
                    { step: 2, title: "Textile Details", icon: SwatchIcon },
                    { step: 3, title: "Stock & Pricing", icon: ArchiveBoxIcon },
                    { step: 4, title: "Quality", icon: ShieldCheckIcon },
                    { step: 5, title: "Supplier", icon: DocumentTextIcon },
                    { step: 6, title: "Media", icon: CameraIcon },
                  ].map(({ step, title, icon: Icon }) => {
                    const isSelected = step === currentStep;
                    return (
                      <button
                        key={step}
                        onClick={() => setCurrentStep(step)}
                        className={`flex items-center gap-2 p-2 rounded-none transition-all cursor-pointer
                          ${
                            isSelected
                              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                              : step < currentStep
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                : "bg-gray-50 dark:bg-gray-900 text-gray-500"
                          }
                          ${
                            !isSelected
                              ? "border border-transparent hover:border-black dark:hover:border-white"
                              : ""
                          }
                        `}
                        style={{
                          outline: "none",
                        }}
                        type="button"
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isSelected
                              ? "text-white dark:text-gray-900"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        />
                        <span className="text-xs font-medium">{title}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Form Card */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
            >
              <CardContent className="p-6">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3
                          className={`text-base font-semibold ${colors.texts.primary}`}
                        >
                          Basic Item Information
                        </h3>
                        <p className={`text-xs ${colors.texts.secondary}`}>
                          Essential details about the inventory item
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className={`text-xs font-medium ${colors.texts.accent}`}
                        >
                          Item Name *
                        </Label>
                        <Input
                          id="name"
                          placeholder="e.g., Premium Cotton Fabric"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className={`text-sm h-9 ${colors.inputs.base} ${colors.inputs.focus} transition-colors duration-200 ${
                            errors.name ? `border-red-500` : ""
                          }`}
                        />
                        {errors.name && (
                          <p
                            className={`text-xs ${colors.texts.error} flex items-center gap-1`}
                          >
                            <ExclamationCircleIcon className="h-3 w-3" />
                            {errors.name}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="category"
                            className="text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Category *
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => {
                              handleInputChange("category", value);
                              handleInputChange("subcategory", "");
                            }}
                          >
                            <SelectTrigger
                              className={`text-sm h-9 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer hover:border-black dark:hover:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ${
                                errors.category
                                  ? "border-red-500"
                                  : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"
                              }`}
                            >
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {inventoryCategories.map((cat) => (
                                <SelectItem
                                  key={cat}
                                  value={cat}
                                  className="text-sm h-9"
                                >
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {errors.category && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationCircleIcon className="h-3 w-3" />
                              {errors.category}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="subcategory"
                            className="text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Subcategory *
                          </Label>
                          <Select
                            value={formData.subcategory}
                            onValueChange={(value) =>
                              handleInputChange("subcategory", value)
                            }
                            disabled={!formData.category}
                          >
                            <SelectTrigger
                              className={`text-sm h-9 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer hover:border-black dark:hover:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ${
                                errors.subcategory
                                  ? "border-red-500"
                                  : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"
                              }`}
                            >
                              <SelectValue placeholder="Select subcategory" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {formData.category &&
                                subcategoryMap[formData.category]?.map(
                                  (subcat) => (
                                    <SelectItem
                                      key={subcat}
                                      value={subcat}
                                      className="text-sm"
                                    >
                                      {subcat}
                                    </SelectItem>
                                  )
                                )}
                            </SelectContent>
                          </Select>
                          {errors.subcategory && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationCircleIcon className="h-3 w-3" />
                              {errors.subcategory}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label
                            htmlFor="materialType"
                            className="text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Material Type
                          </Label>
                          <Select
                            value={formData.materialType}
                            onValueChange={(value) =>
                              handleInputChange("materialType", value)
                            }
                          >
                            <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                              <SelectValue placeholder="Select material type" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {materialTypes.map((type) => (
                                <SelectItem
                                  key={type}
                                  value={type}
                                  className="text-sm"
                                >
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="unit"
                            className="text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Unit *
                          </Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) =>
                              handleInputChange("unit", value)
                            }
                          >
                            <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {units.map((unit) => (
                                <SelectItem
                                  key={unit}
                                  value={unit}
                                  className="text-sm"
                                >
                                  {unit}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="description"
                          className="text-xs font-medium text-gray-700 dark:text-gray-300"
                        >
                          Item Description *
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Provide a detailed description of the inventory item..."
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          maxLength={1000}
                          rows={8}
                          className={`text-sm resize-none bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ${
                            errors.description
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        <div className="flex justify-between items-center">
                          {errors.description ? (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationCircleIcon className="h-3 w-3" />
                              {errors.description}
                            </p>
                          ) : (
                            <span />
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formData.description.length}/1000 characters
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className={`${colors.buttons.primary} text-xs cursor-pointer h-8 rounded-none transition-all`}
                      >
                        Next Step
                        <ArrowRightIcon className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Textile Details */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Textile Details & Properties
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Specific textile characteristics
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Color *
                        </Label>
                        <Input
                          placeholder="e.g., Navy Blue"
                          value={formData.textileDetails.color}
                          onChange={(e) =>
                            handleTextileDetailChange("color", e.target.value)
                          }
                          className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 ${
                            errors["textileDetails.color"]
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors["textileDetails.color"] && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationCircleIcon className="h-3 w-3" />
                            {errors["textileDetails.color"]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Fabric Type
                        </Label>
                        <Select
                          value={formData.textileDetails.fabricType}
                          onValueChange={(value) =>
                            handleTextileDetailChange("fabricType", value)
                          }
                        >
                          <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white">
                            <SelectValue placeholder="Select fabric type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {fabricTypes.map((type) => (
                              <SelectItem
                                key={type}
                                value={type}
                                className="text-sm"
                              >
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Composition
                        </Label>
                        <Input
                          placeholder="e.g., 100% Cotton"
                          value={formData.textileDetails.composition}
                          onChange={(e) =>
                            handleTextileDetailChange(
                              "composition",
                              e.target.value
                            )
                          }
                          className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Pattern
                        </Label>
                        <Select
                          value={formData.textileDetails.pattern}
                          onValueChange={(value) =>
                            handleTextileDetailChange("pattern", value)
                          }
                        >
                          <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white">
                            <SelectValue placeholder="Select pattern" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {patterns.map((pattern) => (
                              <SelectItem
                                key={pattern}
                                value={pattern}
                                className="text-sm"
                              >
                                {pattern}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          GSM
                        </Label>
                        <Input
                          type="number"
                          placeholder="e.g., 180"
                          value={formData.textileDetails.gsm}
                          onChange={(e) =>
                            handleTextileDetailChange("gsm", e.target.value)
                          }
                          className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Width (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="e.g., 150"
                          value={formData.textileDetails.width}
                          onChange={(e) =>
                            handleTextileDetailChange("width", e.target.value)
                          }
                          className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs cursor-pointer h-8 rounded-none"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none"
                      >
                        Next Step
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Stock & Pricing */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Stock Management & Pricing
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Inventory levels and pricing
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Unit Price *
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.pricePerUnit}
                            onChange={(e) =>
                              handleInputChange("pricePerUnit", e.target.value)
                            }
                            className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none ${
                              errors.pricePerUnit
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                        </div>
                        {errors.pricePerUnit && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationCircleIcon className="h-3 w-3" />
                            {errors.pricePerUnit}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Current Quantity *
                        </Label>
                        <Input
                          type="number"
                          placeholder="e.g., 1000"
                          value={formData.quantity}
                          onChange={(e) =>
                            handleInputChange("quantity", e.target.value)
                          }
                          className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none ${
                            errors.quantity
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.quantity && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationCircleIcon className="h-3 w-3" />
                            {errors.quantity}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Reorder Level
                        </Label>
                        <Input
                          type="number"
                          placeholder="20"
                          value={formData.reorderLevel}
                          onChange={(e) =>
                            handleInputChange("reorderLevel", e.target.value)
                          }
                          className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Min Stock Level
                        </Label>
                        <Input
                          type="number"
                          placeholder="10"
                          value={formData.minStockLevel}
                          onChange={(e) =>
                            handleInputChange("minStockLevel", e.target.value)
                          }
                          className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs cursor-pointer h-8 rounded-none"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none"
                      >
                        Next Step
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Quality */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Quality & Compliance
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Certifications and quality information
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Quality Grade
                        </Label>
                        <Select
                          value={formData.qualityGrade}
                          onValueChange={(value) =>
                            handleInputChange("qualityGrade", value)
                          }
                        >
                          <SelectTrigger className="text-sm h-9 w-full bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white">
                            <SelectValue placeholder="Select quality grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {qualityGrades.map((grade) => (
                              <SelectItem key={grade} value={grade}>
                                Grade {grade}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Country of Origin
                        </Label>
                        <Input
                          placeholder="e.g., Pakistan"
                          value={formData.countryOfOrigin}
                          onChange={(e) =>
                            handleInputChange("countryOfOrigin", e.target.value)
                          }
                          className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-medium">
                        Certifications
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {certifications.map((cert) => (
                          <label
                            key={cert}
                            className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 border rounded-none cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
                          >
                            <Checkbox
                              checked={formData.certifications.includes(cert)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    certifications: [
                                      ...prev.certifications,
                                      cert,
                                    ],
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    certifications: prev.certifications.filter(
                                      (c) => c !== cert
                                    ),
                                  }));
                                }
                              }}
                            />
                            <span className="text-xs">{cert}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs cursor-pointer h-8 rounded-none"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none"
                      >
                        Next Step
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5: Supplier */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Supplier Information
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Supplier details and contact
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Supplier Name *
                        </Label>
                        <Input
                          placeholder="e.g., ABC Textiles Ltd."
                          value={formData.supplierName}
                          onChange={(e) =>
                            handleInputChange("supplierName", e.target.value)
                          }
                          className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none ${
                            errors.supplierName
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          }`}
                        />
                        {errors.supplierName && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationCircleIcon className="h-3 w-3" />
                            {errors.supplierName}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Phone
                          </Label>
                          <Input
                            placeholder="e.g., +1 234 567 8900"
                            value={formData.supplierContact.phone}
                            onChange={(e) =>
                              handleSupplierContactChange(
                                "phone",
                                e.target.value
                              )
                            }
                            className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            Email
                          </Label>
                          <Input
                            type="email"
                            placeholder="e.g., contact@supplier.com"
                            value={formData.supplierContact.email}
                            onChange={(e) =>
                              handleSupplierContactChange(
                                "email",
                                e.target.value
                              )
                            }
                            className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs cursor-pointer h-8 rounded-none"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none"
                      >
                        Next Step
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 6: Media & Final */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                          Media Upload
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Update images and finalize changes
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-xs font-medium">
                        Product Images
                      </Label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-none p-6 bg-white/30 dark:bg-gray-800/30">
                        <div className="text-center">
                          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-none mb-3">
                            {isUploading ? (
                              <Loader2 className="h-6 w-6 text-gray-900 dark:text-gray-100 animate-spin" />
                            ) : (
                              <ArrowUpTrayIcon className="h-6 w-6 text-gray-900 dark:text-gray-100" />
                            )}
                          </div>
                          <div className="mb-3">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {isUploading
                                ? "Uploading..."
                                : "Upload Item Images"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Drag and drop or click to browse
                            </p>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files)}
                            className="hidden"
                            id="image-upload"
                            disabled={isUploading}
                          />
                          <label
                            htmlFor="image-upload"
                            className={`inline-flex items-center gap-2 px-4 py-2 ${colors.buttons.primary} text-sm font-medium cursor-pointer rounded-none`}
                          >
                            Choose Images
                          </label>
                        </div>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                          {formData.images.map((image, index) => (
                            <div
                              key={index}
                              className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-none overflow-hidden"
                            >
                              <img
                                src={image}
                                alt={`Item ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 rounded-none"
                                  onClick={() => removeImage(index)}
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </Button>
                              </div>
                              {index === 0 && (
                                <Badge className="absolute top-2 left-2 bg-blue-100/10 text-blue-700 text-xs rounded-none">
                                  Main
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs cursor-pointer h-8 rounded-none"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={() => setIsConfirmOpen(true)}
                        disabled={isLoading}
                        size="sm"
                        className={`${colors.buttons.primary} text-xs cursor-pointer h-8 rounded-none`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <CheckCircleIcon className="h-3 w-3 mr-2" />
                        )}
                        {isLoading ? "Updating..." : "Update Inventory"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="lg:col-span-3">
              <div className="sticky top-6">
                <PreviewCard formData={formData} />
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent
            className={`${colors.backgrounds.modal} ${colors.borders.primary} rounded-none shadow-none`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-base font-bold flex items-center gap-3 ${colors.texts.primary}`}
              >
                <PencilSquareIcon className="h-4 w-4" />
                Update Inventory Item
              </DialogTitle>
              <DialogDescription
                className={`text-xs ${colors.texts.secondary}`}
              >
                Are you ready to save these changes to the inventory?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className={`${badgeColors.blue.bg} rounded-none p-4`}>
                <ul className={`space-y-2 text-xs ${colors.texts.primary}`}>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className={`h-4 w-4 ${colors.texts.success}`}
                    />
                    Update blockchain record
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className={`h-4 w-4 ${colors.texts.success}`}
                    />
                    Sync updated information
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className={`h-4 w-4 ${colors.texts.success}`}
                    />
                    Maintain audit trail
                  </li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                size="sm"
                className={`text-xs cursor-pointer h-8 ${colors.buttons.outline} shadow-none hover:shadow-none`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="sm"
                className={`${colors.buttons.primary} text-xs cursor-pointer h-8 rounded-none shadow-none hover:shadow-none`}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-3 w-3 mr-2" />
                )}
                {isLoading ? "Updating..." : "Confirm Update"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
