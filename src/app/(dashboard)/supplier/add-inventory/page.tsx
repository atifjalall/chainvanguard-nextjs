/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/_ui/card";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";
import { Textarea } from "@/components/_ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import { Badge } from "@/components/_ui/badge";
import { Progress } from "@/components/_ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/_ui/dialog";
import { Checkbox } from "@/components/_ui/checkbox";
import {
  ArchiveBoxIcon,
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ScaleIcon,
  PlusIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckIcon,
  CameraIcon,
  PhotoIcon,
  SwatchIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader2 } from "lucide-react";

// ========================================
// HARDCODED CATEGORIES (Matching Inventory.js schema exactly)
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
  internalCode: string;
  barcode: string;
  weight: string;
  dimensions: string;
  tags: string[];
  season: string;
  countryOfOrigin: string;
  manufacturer: string;
  supplierName: string;
  supplierContact: SupplierContact;
  qualityGrade: string;
  certifications: string[];
  isSustainable: boolean;
  complianceStandards: string[];
  sustainabilityCertifications: string[];
  leadTime: string;
  estimatedDeliveryDays: string;
  shelfLife: string;
  images: string[];
  notes: string;
  carbonFootprint: string;
  recycledContent: string;
  autoReorderEnabled: boolean;
  isBatchTracked: boolean;
  status: string;
};

type ErrorsType = {
  [key: string]: string;
};

export default function AddInventoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 5;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // ========================================
  // UPDATED FORM DATA (Matching backend Inventory model)
  // ========================================
  const [formData, setFormData] = useState<FormDataType>({
    // Basic Info
    name: "",
    description: "",
    category: "",
    subcategory: "",
    materialType: "Raw Material",
    brand: "",

    // Textile Details (matching backend textileDetails structure)
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

    // Pricing (matching backend field names)
    pricePerUnit: "",
    costPrice: "",
    originalPrice: "",
    discount: "",

    // Stock & Quantities
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

    // Identifiers
    sku: "",
    internalCode: "",
    barcode: "",

    // Physical Properties
    weight: "",
    dimensions: "",

    // Metadata
    tags: [],
    season: "All Season",
    countryOfOrigin: "",
    manufacturer: "",

    // Supplier Info
    supplierName: "",
    supplierContact: {
      phone: "",
      email: "",
      address: "",
    },

    // Quality & Compliance
    qualityGrade: "",
    certifications: [],
    isSustainable: false,
    complianceStandards: [],
    sustainabilityCertifications: [],

    // Timing
    leadTime: "7",
    estimatedDeliveryDays: "7",
    shelfLife: "",

    // Media
    images: [],

    // Additional
    notes: "",
    carbonFootprint: "",
    recycledContent: "",
    autoReorderEnabled: false,
    isBatchTracked: false,

    // Status
    status: "active",
  });

  const [errors, setErrors] = useState<ErrorsType>({});
  const [tagInput, setTagInput] = useState<string>("");
  const [complianceInput, setComplianceInput] = useState<string>("");

  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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
      id: `draft_${Date.now()}`,
      ...formData,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    drafts.push(draft);
    localStorage.setItem("inventory_drafts", JSON.stringify(drafts));
    toast.success("Inventory item saved as draft");
  };

  const resetForm = () => {
    setFormData({
      // Basic Info
      name: "",
      description: "",
      category: "",
      subcategory: "",
      materialType: "Raw Material",
      brand: "",

      // Textile Details (matching backend textileDetails structure)
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

      // Pricing (matching backend field names)
      pricePerUnit: "",
      costPrice: "",
      originalPrice: "",
      discount: "",

      // Stock & Quantities
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

      // Identifiers
      sku: "",
      internalCode: "",
      barcode: "",

      // Physical Properties
      weight: "",
      dimensions: "",

      // Metadata
      tags: [],
      season: "All Season",
      countryOfOrigin: "",
      manufacturer: "",

      // Supplier Info
      supplierName: "",
      supplierContact: { phone: "", email: "", address: "" },

      // Quality & Compliance
      qualityGrade: "",
      certifications: [],
      isSustainable: false,
      complianceStandards: [],
      sustainabilityCertifications: [],

      // Timing
      leadTime: "7",
      estimatedDeliveryDays: "7",
      shelfLife: "",

      // Media
      images: [],

      // Additional
      notes: "",
      carbonFootprint: "",
      recycledContent: "",
      autoReorderEnabled: false,
      isBatchTracked: false,

      // Status
      status: "active",
    });
    setCurrentStep(1);
    setErrors({});
  };

  // ========================================
  // UPDATED SUBMIT HANDLER (API call)
  // ========================================
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);

    try {
      // Prepare form data for API
      const formDataToSend = new FormData();

      // Add all text fields
      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("subcategory", formData.subcategory);
      formDataToSend.append("materialType", formData.materialType);
      formDataToSend.append("brand", formData.brand);

      // Add textile details as JSON string
      formDataToSend.append(
        "textileDetails",
        JSON.stringify(formData.textileDetails)
      );

      // Add pricing
      formDataToSend.append("pricePerUnit", formData.pricePerUnit);
      formDataToSend.append("costPrice", formData.costPrice || "0");
      formDataToSend.append(
        "originalPrice",
        formData.originalPrice || formData.pricePerUnit
      );
      formDataToSend.append("discount", formData.discount || "0");

      // Add stock quantities
      formDataToSend.append("quantity", formData.quantity);
      formDataToSend.append("reservedQuantity", formData.reservedQuantity);
      formDataToSend.append("committedQuantity", formData.committedQuantity);
      formDataToSend.append("damagedQuantity", formData.damagedQuantity);
      formDataToSend.append("minStockLevel", formData.minStockLevel);
      formDataToSend.append("reorderLevel", formData.reorderLevel);
      formDataToSend.append("reorderQuantity", formData.reorderQuantity);
      formDataToSend.append("maximumQuantity", formData.maximumQuantity || "0");
      formDataToSend.append("safetyStockLevel", formData.safetyStockLevel);
      formDataToSend.append("unit", formData.unit);

      // Add identifiers
      formDataToSend.append("sku", formData.sku || `INV-${Date.now()}`);
      formDataToSend.append("internalCode", formData.internalCode);
      formDataToSend.append("barcode", formData.barcode);

      // Add physical properties
      formDataToSend.append("weight", formData.weight || "0");
      formDataToSend.append("dimensions", formData.dimensions);

      // Add metadata
      formDataToSend.append("tags", JSON.stringify(formData.tags));
      formDataToSend.append("season", formData.season);
      formDataToSend.append("countryOfOrigin", formData.countryOfOrigin);
      formDataToSend.append("manufacturer", formData.manufacturer);

      // Add supplier info
      formDataToSend.append("supplierName", formData.supplierName);
      formDataToSend.append(
        "supplierContact",
        JSON.stringify(formData.supplierContact)
      );

      // Add quality & compliance
      formDataToSend.append("qualityGrade", formData.qualityGrade);
      formDataToSend.append(
        "certifications",
        JSON.stringify(formData.certifications)
      );
      formDataToSend.append("isSustainable", formData.isSustainable.toString());
      formDataToSend.append(
        "complianceStandards",
        JSON.stringify(formData.complianceStandards)
      );

      // Add timing
      formDataToSend.append("leadTime", formData.leadTime);
      formDataToSend.append(
        "estimatedDeliveryDays",
        formData.estimatedDeliveryDays
      );
      formDataToSend.append("shelfLife", formData.shelfLife || "0");

      // Add additional fields
      formDataToSend.append("notes", formData.notes);
      formDataToSend.append("carbonFootprint", formData.carbonFootprint || "0");
      formDataToSend.append("recycledContent", formData.recycledContent || "0");
      formDataToSend.append(
        "autoReorderEnabled",
        formData.autoReorderEnabled.toString()
      );
      formDataToSend.append(
        "isBatchTracked",
        formData.isBatchTracked.toString()
      );
      formDataToSend.append("status", formData.status);

      // Add images (if any were uploaded)
      // Note: Images would be actual File objects from file input
      // For now, we'll skip images as they're mock URLs

      // Try API call first
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/inventory`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formDataToSend,
          }
        );

        const result = await response.json();

        if (response.ok && result.success) {
          toast.success("Inventory item added successfully!");
          router.push("/supplier/inventory");
          return;
        } else {
          throw new Error(result.message || "Failed to add inventory item");
        }
      } catch (apiError) {
        console.warn(
          "API call failed, falling back to localStorage:",
          apiError instanceof Error ? apiError.message : String(apiError)
        );

        // Fallback to localStorage if API fails
        const inventoryItem = {
          _id: `inv_${Date.now()}`,
          ...formData,
          supplierId: user?.id || "supplier1",
          supplierWalletAddress: user?.walletAddress || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sku: formData.sku || `INV-${Date.now()}`,
          blockchainVerified: false,
          isVerified: false,
          isFeatured: false,
          totalConsumed: 0,
          totalReceived: parseInt(formData.quantity) || 0,
          totalRevenue: 0,
          views: 0,
          averageRating: 0,
          totalReviews: 0,
          averageMonthlyConsumption: 0,
          turnoverRate: 0,
          movements: [],
          qualityChecks: [],
          reorderAlerts: [],
          storageLocations: [],
          batches: [],
          documents: [],
          alerts: [],
          images: formData.images.map((url, index) => ({
            url,
            viewType: index === 0 ? "front" : "detail",
            isMain: index === 0,
          })),
        };

        const existingInventory = JSON.parse(
          localStorage.getItem(`supplier_${user?.id}_products`) || "[]"
        );
        const updatedInventory = [...existingInventory, inventoryItem];
        localStorage.setItem(
          `supplier_${user?.id}_products`,
          JSON.stringify(updatedInventory)
        );

        toast.success("Inventory item added successfully (offline mode)!");
        router.push("/supplier/inventory");
      }
    } catch (error) {
      toast.error("Failed to add inventory item");
      console.error("Error adding inventory:", error);
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

  if (previewMode) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2 text-xs cursor-pointer h-8"
                size="sm"
              >
                <ArrowLeftIcon className="h-3 w-3" />
                Back to Edit
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Inventory Item Preview
                </h1>
                <p className="text-base text-gray-600 dark:text-gray-400 mt-1">
                  Preview how your inventory item will appear
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              size="sm"
              className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
            >
              {isLoading ? (
                <ArrowPathIcon className="h-3 w-3 animate-spin mr-2" />
              ) : (
                <CheckCircleIcon className="h-3 w-3 mr-2" />
              )}
              {isLoading ? "Adding..." : "Add to Inventory"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-200 dark:border-gray-800 shadow-md bg-white dark:bg-gray-950">
              <CardContent className="p-6">
                {formData.images.length > 0 ? (
                  <div className="space-y-4">
                    <img
                      src={formData.images[0]}
                      alt={formData.name}
                      className="w-full aspect-video object-cover rounded-none"
                    />
                    {formData.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {formData.images.slice(1, 5).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${formData.name} ${index + 2}`}
                            className="aspect-square object-cover rounded-none"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video rounded-none bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-800 shadow-md bg-white dark:bg-gray-950">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                    {formData.name || "Item Name"}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none">
                      <ArchiveBoxIcon className="h-3 w-3 mr-1 text-blue-700 dark:text-blue-400" />
                      Inventory Management
                    </Badge>
                    <Badge className="bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 flex items-center gap-1 text-xs rounded-none">
                      <ShieldCheckIcon className="h-3 w-3 text-green-700 dark:text-green-400" />
                      Blockchain Tracked
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formData.description || "Description..."}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-none p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Price per {formData.unit}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        ${formData.pricePerUnit || "0.00"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Available
                      </p>
                      <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {formData.quantity || "0"} {formData.unit}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "SKU", value: formData.sku },
                    { label: "Brand", value: formData.brand },
                    { label: "Color", value: formData.textileDetails.color },
                    {
                      label: "Fabric Type",
                      value: formData.textileDetails.fabricType,
                    },
                    { label: "Reorder Level", value: formData.reorderLevel },
                    { label: "Lead Time", value: `${formData.leadTime} days` },
                  ]
                    .filter((item) => item.value)
                    .map((item, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-none p-3"
                      >
                        <p className="text-xs text-gray-500 uppercase">
                          {item.label}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {item.value}
                        </p>
                      </div>
                    ))}
                </div>

                {formData.certifications.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2 text-gray-900 dark:text-white">
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert, index) => (
                        <Badge
                          key={index}
                          className="bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-xs rounded-none"
                        >
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="relative z-10 p-6 space-y-6">
        {/* Header - matching dashboard style */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Inventory Item
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Add new textile materials and components to inventory
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none">
                  <ArchiveBoxIcon className="h-3 w-3 mr-1 text-blue-700 dark:text-blue-400" />
                  Inventory Management
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
                onClick={resetForm}
                size="sm"
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                <ArrowPathIcon className="h-3 w-3 mr-2" />
                Reset
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
                onClick={() => setPreviewMode(true)}
                size="sm"
                className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
              >
                <EyeIcon className="h-3 w-3 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar - matching dashboard card style */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-md bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-300 rounded-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Step {currentStep} of {totalSteps}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {Math.round(getStepProgress())}% Complete
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2 mb-4" />
            <div className="grid grid-cols-5 gap-3">
              {[
                { step: 1, title: "Basic Info", icon: DocumentTextIcon },
                { step: 2, title: "Textile Details", icon: SwatchIcon },
                { step: 3, title: "Stock & Pricing", icon: ArchiveBoxIcon },
                { step: 4, title: "Quality", icon: ShieldCheckIcon },
                { step: 5, title: "Media", icon: CameraIcon },
              ].map(({ step, title, icon: Icon }) => {
                const isSelected = step === currentStep;
                return (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    className={`flex items-center gap-2 p-2 rounded-none transition-all cursor-pointer hover:shadow-md ${
                      isSelected
                        ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                        : step < currentStep
                          ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          : "bg-gray-50 dark:bg-gray-900 text-gray-500"
                    }`}
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

        {/* Form Content - matching dashboard card style */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-md bg-white dark:bg-gray-950 hover:shadow-lg transition-all duration-300 rounded-none">
          <CardContent className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Basic Item Information
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Essential details about the inventory item
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="name"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
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
                      className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                        errors.name ? " border-red-500" : ""
                      } border-gray-200 dark:border-gray-700`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

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
                        className={`text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                          errors.category ? " border-red-500" : ""
                        } border-gray-200 dark:border-gray-700`}
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
                        className={`text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                          errors.subcategory ? " border-red-500" : ""
                        } border-gray-200 dark:border-gray-700`}
                      >
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {formData.category &&
                          subcategoryMap[formData.category]?.map((subcat) => (
                            <SelectItem
                              key={subcat}
                              value={subcat}
                              className="text-sm"
                            >
                              {subcat}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.subcategory && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        {errors.subcategory}
                      </p>
                    )}
                  </div>

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
                      <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none" />
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
                      htmlFor="sku"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      SKU / Item Code
                    </Label>
                    <Input
                      id="sku"
                      placeholder="e.g., INV-2025-001"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Leave empty to auto-generate
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="brand"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Brand / Manufacturer
                    </Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Textile Solutions Inc."
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="unit"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Unit of Measurement *
                    </Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) =>
                        handleInputChange("unit", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none" />
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="supplierName"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Supplier Name *
                    </Label>
                    <Input
                      id="supplierName"
                      placeholder="e.g., ABC Textiles Ltd."
                      value={formData.supplierName}
                      onChange={(e) =>
                        handleInputChange("supplierName", e.target.value)
                      }
                      className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                        errors.supplierName ? " border-red-500" : ""
                      }`}
                    />
                    {errors.supplierName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        {errors.supplierName}
                      </p>
                    )}
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
                    rows={6}
                    className={`text-sm resize-none bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                      errors.description ? " border-red-500" : ""
                    } border-gray-200 dark:border-gray-700`}
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

                <div className="flex justify-end">
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
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
                      Specific textile characteristics and specifications
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="color"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Color *
                    </Label>
                    <Input
                      id="color"
                      placeholder="e.g., Navy Blue"
                      value={formData.textileDetails.color}
                      onChange={(e) =>
                        handleTextileDetailChange("color", e.target.value)
                      }
                      className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                        errors["textileDetails.color"] ? " border-red-500" : ""
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
                    <Label
                      htmlFor="colorCode"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Color Code
                    </Label>
                    <Input
                      id="colorCode"
                      placeholder="e.g., #001F3F or Pantone 19-4052"
                      value={formData.textileDetails.colorCode}
                      onChange={(e) =>
                        handleTextileDetailChange("colorCode", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="fabricType"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Fabric Type
                    </Label>
                    <Select
                      value={formData.textileDetails.fabricType}
                      onValueChange={(value) =>
                        handleTextileDetailChange("fabricType", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
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
                    <Label
                      htmlFor="composition"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Composition
                    </Label>
                    <Input
                      id="composition"
                      placeholder="e.g., 100% Cotton"
                      value={formData.textileDetails.composition}
                      onChange={(e) =>
                        handleTextileDetailChange("composition", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="pattern"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Pattern
                    </Label>
                    <Select
                      value={formData.textileDetails.pattern}
                      onValueChange={(value) =>
                        handleTextileDetailChange("pattern", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                        <SelectValue />
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
                    <Label
                      htmlFor="finish"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Finish
                    </Label>
                    <Select
                      value={formData.textileDetails.finish}
                      onValueChange={(value) =>
                        handleTextileDetailChange("finish", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                        <SelectValue placeholder="Select finish" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {finishes.map((finish) => (
                          <SelectItem
                            key={finish}
                            value={finish}
                            className="text-sm"
                          >
                            {finish}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="gsm"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      GSM (Grams per Square Meter)
                    </Label>
                    <Input
                      id="gsm"
                      type="number"
                      placeholder="e.g., 180"
                      value={formData.textileDetails.gsm}
                      onChange={(e) =>
                        handleTextileDetailChange("gsm", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="width"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Width (cm or inches)
                    </Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="e.g., 150"
                      value={formData.textileDetails.width}
                      onChange={(e) =>
                        handleTextileDetailChange("width", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="fabricWeight"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Fabric Weight
                    </Label>
                    <Input
                      id="fabricWeight"
                      placeholder="e.g., Medium Weight"
                      value={formData.textileDetails.fabricWeight}
                      onChange={(e) =>
                        handleTextileDetailChange(
                          "fabricWeight",
                          e.target.value
                        )
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="shrinkage"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Shrinkage
                    </Label>
                    <Input
                      id="shrinkage"
                      placeholder="e.g., 2-3%"
                      value={formData.textileDetails.shrinkage}
                      onChange={(e) =>
                        handleTextileDetailChange("shrinkage", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="washability"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Washability
                    </Label>
                    <Input
                      id="washability"
                      placeholder="e.g., Machine Washable at 30°C"
                      value={formData.textileDetails.washability}
                      onChange={(e) =>
                        handleTextileDetailChange("washability", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="weight"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Weight
                    </Label>
                    <div className="relative">
                      <ScaleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="weight"
                        placeholder="e.g., 2.5 kg"
                        value={formData.weight}
                        onChange={(e) =>
                          handleInputChange("weight", e.target.value)
                        }
                        className="pl-10 text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="careInstructions"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Care Instructions
                  </Label>
                  <Textarea
                    id="careInstructions"
                    placeholder="e.g., Machine wash cold, tumble dry low..."
                    value={formData.textileDetails.careInstructions}
                    onChange={(e) =>
                      handleTextileDetailChange(
                        "careInstructions",
                        e.target.value
                      )
                    }
                    rows={6}
                    className="resize-none text-sm bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                  />
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    size="sm"
                    className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
                  >
                    Next Step
                    <ArrowRightIcon className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Stock & Pricing - Update all Inputs to have consistent background */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">

                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Stock Management & Pricing
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Inventory levels and pricing information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="price"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Unit Price *
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.pricePerUnit}
                        onChange={(e) =>
                          handleInputChange("pricePerUnit", e.target.value)
                        }
                        className={`pl-8 text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                          errors.pricePerUnit ? " border-red-500" : ""
                        } outline-none ring-0 shadow-none`}
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
                    <Label
                      htmlFor="costPrice"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Cost Price
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                        $
                      </span>
                      <Input
                        id="costPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.costPrice}
                        onChange={(e) =>
                          handleInputChange("costPrice", e.target.value)
                        }
                        className="pl-8 text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="discount"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Discount %
                    </Label>
                    <Input
                      id="discount"
                      type="number"
                      step="0.1"
                      max="100"
                      placeholder="0"
                      value={formData.discount}
                      onChange={(e) =>
                        handleInputChange("discount", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="quantity"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Current Quantity *
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange("quantity", e.target.value)
                      }
                      className={`text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none${
                        errors.quantity ? " border-red-500" : ""
                      } outline-none ring-0 shadow-none`}
                    />
                    {errors.quantity && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <ExclamationCircleIcon className="h-3 w-3" />
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="minStockLevel"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Minimum Stock Level
                    </Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      placeholder="10"
                      value={formData.minStockLevel}
                      onChange={(e) =>
                        handleInputChange("minStockLevel", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="reorderLevel"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Reorder Level
                    </Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      placeholder="20"
                      value={formData.reorderLevel}
                      onChange={(e) =>
                        handleInputChange("reorderLevel", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="reorderQuantity"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Reorder Quantity
                    </Label>
                    <Input
                      id="reorderQuantity"
                      type="number"
                      placeholder="50"
                      value={formData.reorderQuantity}
                      onChange={(e) =>
                        handleInputChange("reorderQuantity", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="safetyStockLevel"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Safety Stock Level
                    </Label>
                    <Input
                      id="safetyStockLevel"
                      type="number"
                      placeholder="15"
                      value={formData.safetyStockLevel}
                      onChange={(e) =>
                        handleInputChange("safetyStockLevel", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="maximumQuantity"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Maximum Quantity
                    </Label>
                    <Input
                      id="maximumQuantity"
                      type="number"
                      placeholder="e.g., 5000"
                      value={formData.maximumQuantity}
                      onChange={(e) =>
                        handleInputChange("maximumQuantity", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="leadTime"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Lead Time (days)
                    </Label>
                    <Input
                      id="leadTime"
                      type="number"
                      placeholder="7"
                      value={formData.leadTime}
                      onChange={(e) =>
                        handleInputChange("leadTime", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="shelfLife"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Shelf Life (days)
                    </Label>
                    <Input
                      id="shelfLife"
                      type="number"
                      placeholder="e.g., 365"
                      value={formData.shelfLife}
                      onChange={(e) =>
                        handleInputChange("shelfLife", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoReorder"
                      checked={formData.autoReorderEnabled}
                      onCheckedChange={(checked: boolean) =>
                        handleInputChange("autoReorderEnabled", !!checked)
                      }
                    />
                    <Label
                      htmlFor="autoReorder"
                      className="cursor-pointer text-sm"
                    >
                      Enable Auto Reorder
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="batchTracked"
                      checked={formData.isBatchTracked}
                      onCheckedChange={(checked: boolean) =>
                        handleInputChange("isBatchTracked", !!checked)
                      }
                    />
                    <Label
                      htmlFor="batchTracked"
                      className="cursor-pointer text-sm"
                    >
                      Enable Batch Tracking
                    </Label>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    size="sm"
                    className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
                  >
                    Next Step
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Quality & Compliance */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Quality & Compliance Standards
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Certifications and quality information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="qualityGrade"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Quality Grade
                    </Label>
                    <Select
                      value={formData.qualityGrade}
                      onValueChange={(value) =>
                        handleInputChange("qualityGrade", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                        <SelectValue placeholder="Select quality grade" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {qualityGrades.map((grade) => (
                          <SelectItem
                            key={grade}
                            value={grade}
                            className="text-sm"
                          >
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="season"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Season
                    </Label>
                    <Select
                      value={formData.season}
                      onValueChange={(value) =>
                        handleInputChange("season", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-9 w-full min-w-[240px] bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {seasons.map((season) => (
                          <SelectItem
                            key={season}
                            value={season}
                            className="text-sm"
                          >
                            {season}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="countryOfOrigin"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Country of Origin
                    </Label>
                    <Input
                      id="countryOfOrigin"
                      placeholder="e.g., India"
                      value={formData.countryOfOrigin}
                      onChange={(e) =>
                        handleInputChange("countryOfOrigin", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="manufacturer"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Manufacturer
                    </Label>
                    <Input
                      id="manufacturer"
                      placeholder="e.g., ABC Mills Pvt Ltd"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        handleInputChange("manufacturer", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="barcode"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Barcode
                    </Label>
                    <Input
                      id="barcode"
                      placeholder="e.g., 1234567890123"
                      value={formData.barcode}
                      onChange={(e) =>
                        handleInputChange("barcode", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="internalCode"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Internal Code
                    </Label>
                    <Input
                      id="internalCode"
                      placeholder="e.g., IC-2025-001"
                      value={formData.internalCode}
                      onChange={(e) =>
                        handleInputChange("internalCode", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    Certifications
                  </Label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
                                certifications: [...prev.certifications, cert],
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sustainable"
                    checked={formData.isSustainable}
                    onCheckedChange={(checked) =>
                      handleInputChange("isSustainable", !!checked)
                    }
                  />
                  <Label
                    htmlFor="sustainable"
                    className="cursor-pointer text-sm"
                  >
                    This is a sustainable/eco-friendly product
                  </Label>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-medium">
                    Compliance Standards
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., REACH Compliant"
                      value={complianceInput}
                      onChange={(e) => setComplianceInput(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addComplianceStandard();
                        }
                      }}
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addComplianceStandard}
                      size="sm"
                      className="rounded-none"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.complianceStandards.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.complianceStandards.map((standard, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-100/10 dark:bg-green-900/10 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-400 text-xs rounded-none"
                        >
                          {standard}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0 rounded-none"
                            onClick={() => removeComplianceStandard(standard)}
                          >
                            <XMarkIcon className="h-3 w-3 text-green-700 dark:text-green-400" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="carbonFootprint"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Carbon Footprint (kg CO2)
                    </Label>
                    <Input
                      id="carbonFootprint"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 2.5"
                      value={formData.carbonFootprint}
                      onChange={(e) =>
                        handleInputChange("carbonFootprint", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="recycledContent"
                      className="text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Recycled Content %
                    </Label>
                    <Input
                      id="recycledContent"
                      type="number"
                      max="100"
                      placeholder="e.g., 30"
                      value={formData.recycledContent}
                      onChange={(e) =>
                        handleInputChange("recycledContent", e.target.value)
                      }
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    Supplier Contact Information
                  </Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="supplierPhone"
                        className="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        Phone
                      </Label>
                      <Input
                        id="supplierPhone"
                        placeholder="e.g., +1 234 567 8900"
                        value={formData.supplierContact.phone}
                        onChange={(e) =>
                          handleSupplierContactChange("phone", e.target.value)
                        }
                        className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="supplierEmail"
                        className="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        Email
                      </Label>
                      <Input
                        id="supplierEmail"
                        type="email"
                        placeholder="e.g., contact@supplier.com"
                        value={formData.supplierContact.email}
                        onChange={(e) =>
                          handleSupplierContactChange("email", e.target.value)
                        }
                        className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label
                        htmlFor="supplierAddress"
                        className="text-xs font-medium text-gray-700 dark:text-gray-300"
                      >
                        Address
                      </Label>
                      <Textarea
                        id="supplierAddress"
                        placeholder="Full supplier address..."
                        value={formData.supplierContact.address}
                        onChange={(e) =>
                          handleSupplierContactChange("address", e.target.value)
                        }
                        rows={2}
                        className="resize-none text-sm bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    size="sm"
                    className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
                  >
                    Next Step
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Media & Final */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                      Media Upload & Final Details
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Add images, tags, and finalize your inventory item
                    </p>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    Product Images
                  </Label>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-none p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
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
                            ? "Uploading to IPFS..."
                            : "Upload Item Images"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Drag and drop or click to browse
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Supports: JPG, PNG, WebP (Max 10MB each)
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
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-none text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
                          isUploading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-700 dark:hover:bg-gray-200"
                        }`}
                      >
                        Choose Images
                      </label>
                    </div>

                    {isUploading && (
                      <div className="mt-4">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-center text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {uploadProgress}% uploaded
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {formData.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-none overflow-hidden"
                        >
                          <img
                            src={image}
                            alt={`Item ${index + 1}`}
                            className="w-full h-full object-cover rounded-none"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-none"
                              onClick={() => removeImage(index)}
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </Button>
                          </div>
                          {index === 0 && (
                            <Badge className="absolute top-2 left-2 bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none">
                              Main
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    Item Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag (e.g., premium, durable)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      className="shrink-0 rounded-none"
                      size="sm"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-blue-100/10 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 text-xs rounded-none"
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0 rounded-none"
                            onClick={() => removeTag(tag)}
                          >
                            <XMarkIcon className="h-3 w-3 text-blue-700 dark:text-blue-400" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dimensions */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    Dimensions (Optional)
                  </Label>
                  <Input
                    placeholder="e.g., 100cm x 50cm x 20cm"
                    value={formData.dimensions}
                    onChange={(e) =>
                      handleInputChange("dimensions", e.target.value)
                    }
                    className="text-sm h-9 bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label
                    htmlFor="notes"
                    className="text-xs font-medium text-gray-700 dark:text-gray-300"
                  >
                    Additional Notes (Internal)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information for internal use..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="resize-none text-sm bg-white dark:bg-gray-900 border rounded-none hover:border-black dark:hover:border-white focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none"
                  />
                </div>

                {/* Summary Card - matching dashboard style */}
                <Card className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 backdrop-blur-sm rounded-none">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <CheckIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                      Inventory Item Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Name</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.name || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Category
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.category || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Price
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          ${formData.pricePerUnit || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Quantity
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.quantity || "0"} {formData.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Color
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.textileDetails.color || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Fabric Type
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.textileDetails.fabricType || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Reorder Level
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.reorderLevel || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Supplier
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.supplierName || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Images
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.images.length} uploaded
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Certifications
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.certifications.length} selected
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Quality Grade
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.qualityGrade
                            ? `Grade ${formData.qualityGrade}`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Auto Reorder
                        </p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                          {formData.autoReorderEnabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    size="sm"
                    className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={isLoading}
                      size="sm"
                      className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                      ) : (
                        <CheckCircleIcon className="h-3 w-3 mr-2" />
                      )}
                      {isLoading ? "Adding..." : "Confirm & Add"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog - matching dashboard style */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="bg-white dark:bg-gray-950 backdrop-blur-xl border border-gray-200 dark:border-gray-800 shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-3 text-gray-900 dark:text-gray-100">
                <div className="h-8 w-8 flex items-center justify-center rounded-none">
                  <ArchiveBoxIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                </div>
                Add to Inventory
              </DialogTitle>
              <DialogDescription className="text-xs">
                Are you ready to add this item to the inventory? This action
                will:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-none p-4">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    Create inventory record on blockchain
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    Store item images securely on IPFS
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    Enable stock tracking and management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    Set up automated reorder alerts
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900 rounded-none p-4">
                <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <ExclamationCircleIcon className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
                  Once added, inventory information will be recorded on the
                  blockchain for traceability.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                size="sm"
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none hover:bg-gray-50 dark:hover:bg-gray-900 transition-all"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="sm"
                className="bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 text-xs cursor-pointer h-8 rounded-none transition-all"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-3 w-3 mr-2" />
                )}
                {isLoading ? "Adding..." : "Confirm & Add"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
