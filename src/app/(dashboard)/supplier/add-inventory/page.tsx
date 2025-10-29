"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Package,
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  Camera,
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  CheckCircle,
  Tag,
  Ruler,
  Weight,
  Award,
  Plus,
  Minus,
  RotateCcw,
  Settings,
  Box,
  Layers,
  Sparkles,
  Shield,
  Globe,
  Factory,
  Palette,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

// Inventory Categories matching schema
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

// Subcategories matching schema
const subcategoryMap = {
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

const finishes = ["Raw", "Bleached", "Dyed", "Printed", "Coated"];

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

export default function AddInventoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Form state matching Inventory schema
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    category: "",
    subcategory: "",
    materialType: "Raw Material",
    brand: "",

    // Textile Details
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

    // Pricing
    price: "",
    costPrice: "",
    originalPrice: "",
    discount: "",

    // Inventory & Stock
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

    // Physical Properties
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },

    // Tags & Metadata
    tags: [] as string[],
    season: "All Season",
    countryOfOrigin: "",
    manufacturer: "",

    // Supplier Information
    supplierName: "",
    supplierContact: {
      phone: "",
      email: "",
      address: "",
    },

    // Quality & Certifications
    qualityGrade: "",
    certifications: [] as string[],
    isSustainable: false,
    complianceStandards: [] as string[],

    // Timing & Logistics
    leadTime: "7",
    estimatedDeliveryDays: "7",
    shelfLife: "",

    // Images
    images: [] as string[],

    // Additional
    notes: "",
    internalCode: "",
    barcode: "",
    carbonFootprint: "",
    recycledContent: "",
    autoReorderEnabled: false,
    isBatchTracked: false,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tag input
  const [tagInput, setTagInput] = useState("");

  // Compliance standards input
  const [complianceInput, setComplianceInput] = useState("");

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleTextileDetailChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      textileDetails: { ...prev.textileDetails, [field]: value },
    }));
  };

  const handleSupplierContactChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      supplierContact: { ...prev.supplierContact, [field]: value },
    }));
  };

  const handleDimensionChange = (dimension: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      dimensions: { ...prev.dimensions, [dimension]: value },
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

        const mockImageUrl = `/api/placeholder/400/300?text=${encodeURIComponent(file.name)}`;
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
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Item name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.subcategory)
      newErrors.subcategory = "Subcategory is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Valid price is required";
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
      price: "",
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
      dimensions: { length: "", width: "", height: "" },
      tags: [],
      season: "All Season",
      countryOfOrigin: "",
      manufacturer: "",
      supplierName: "",
      supplierContact: { phone: "", email: "", address: "" },
      qualityGrade: "",
      certifications: [],
      isSustainable: false,
      complianceStandards: [],
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
    setCurrentStep(1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);

    try {
      const inventoryItem = {
        id: Date.now().toString(),
        ...formData,
        supplierId: "supplier1", // Would come from auth in real app
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        sku: formData.sku || `INV-${Date.now()}`,
        blockchainVerified: false,
        isVerified: false,
        isFeatured: false,
        totalConsumed: 0,
        totalReceived: parseInt(formData.quantity) || 0,
        totalRevenue: 0,
        views: 0,
        averageMonthlyConsumption: 0,
        turnoverRate: 0,
        movements: [],
        qualityChecks: [],
        reorderAlerts: [],
        storageLocations: [],
        batches: [],
        documents: [],
        alerts: [],
      };

      // Save to localStorage (in real app, this would be API call)
      const existingInventory = JSON.parse(
        localStorage.getItem("inventory_items") || "[]"
      );
      const updatedInventory = [...existingInventory, inventoryItem];
      localStorage.setItem("inventory_items", JSON.stringify(updatedInventory));

      console.log("Inventory item added:", inventoryItem);
      console.log("Blockchain transaction initiated");
      console.log("IPFS hashes for images:", formData.images);

      toast.success("Inventory item added successfully!");
      router.push("/supplier/inventory");
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="space-y-6 p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Edit
              </Button>
              <div>
                <h1 className="text-4xl font-bold">Inventory Item Preview</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Preview how your inventory item will appear
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {isLoading ? "Adding..." : "Add to Inventory"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardContent className="p-6">
                {formData.images.length > 0 ? (
                  <div className="space-y-4">
                    <img
                      src={formData.images[0]}
                      alt={formData.name}
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    {formData.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {formData.images.slice(1, 5).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`${formData.name} ${index + 2}`}
                            className="aspect-square object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2">
                    {formData.name || "Item Name"}
                  </h2>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge>{formData.category || "Category"}</Badge>
                    <Badge variant="outline">
                      {formData.subcategory || "Subcategory"}
                    </Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {formData.description || "Description..."}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Price per {formData.unit}
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${formData.price || "0.00"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Available
                      </p>
                      <p className="text-2xl font-bold">
                        {formData.quantity || "0"} {formData.unit}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                      >
                        <p className="text-xs text-gray-500 uppercase">
                          {item.label}
                        </p>
                        <p className="font-semibold">{item.value}</p>
                      </div>
                    ))}
                </div>

                {formData.certifications.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-green-50 dark:bg-green-900/20"
                        >
                          <Award className="h-3 w-3 mr-1" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-2xl font-bold">Add Inventory Item</h1>
              <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
                Add new textile materials and components to inventory
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Package className="h-3 w-3 mr-1" />
                  Inventory Management
                </Badge>
                <Badge variant="outline">
                  <Shield className="h-3 w-3 mr-1" />
                  Blockchain Tracked
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={resetForm} className="text-xs">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Form
              </Button>
              <Button
                variant="outline"
                onClick={saveAsDraft}
                className="text-xs"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => setPreviewMode(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-xs"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Step {currentStep} of {totalSteps}
              </h3>
              <span className="text-sm text-gray-500">
                {Math.round(getStepProgress())}% Complete
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2 mb-4" />
            <div className="grid grid-cols-5 gap-4">
              {[
                { step: 1, title: "Basic Info", icon: Package },
                { step: 2, title: "Textile Details", icon: Palette },
                { step: 3, title: "Stock & Pricing", icon: Activity },
                { step: 4, title: "Quality & Compliance", icon: Shield },
                { step: 5, title: "Media & Final", icon: Camera },
              ].map(({ step, title, icon: Icon }) => (
                <div
                  key={step}
                  className={`flex items-center gap-2 p-3 rounded-lg transition-all ${
                    step === currentStep
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                      : step < currentStep
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{title}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content */}
        <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl">
          <CardContent className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Basic Item Information
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Essential details about the inventory item
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="subcategory">Subcategory *</Label>
                    <Select
                      value={formData.subcategory}
                      onValueChange={(value) =>
                        handleInputChange("subcategory", value)
                      }
                      disabled={!formData.category}
                    >
                      <SelectTrigger
                        className={errors.subcategory ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.category &&
                          subcategoryMap[
                            formData.category as keyof typeof subcategoryMap
                          ]?.map((subcat) => (
                            <SelectItem key={subcat} value={subcat}>
                              {subcat}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {errors.subcategory && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.subcategory}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="materialType">Material Type</Label>
                    <Select
                      value={formData.materialType}
                      onValueChange={(value) =>
                        handleInputChange("materialType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {materialTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU / Item Code</Label>
                    <Input
                      id="sku"
                      placeholder="e.g., INV-2025-001"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Leave empty to auto-generate
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand / Manufacturer</Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Textile Solutions Inc."
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit of Measurement *</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) =>
                        handleInputChange("unit", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="supplierName">Supplier Name *</Label>
                    <Input
                      id="supplierName"
                      placeholder="e.g., ABC Textiles Ltd."
                      value={formData.supplierName}
                      onChange={(e) =>
                        handleInputChange("supplierName", e.target.value)
                      }
                      className={errors.supplierName ? "border-red-500" : ""}
                    />
                    {errors.supplierName && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.supplierName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Item Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the inventory item..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    className={
                      errors.description
                        ? "border-red-500 resize-none"
                        : "resize-none"
                    }
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600"
                  >
                    Next Step
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Textile Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Textile Details & Properties
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Specific textile characteristics and specifications
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="color">Color *</Label>
                    <Input
                      id="color"
                      placeholder="e.g., Navy Blue"
                      value={formData.textileDetails.color}
                      onChange={(e) =>
                        handleTextileDetailChange("color", e.target.value)
                      }
                      className={
                        errors["textileDetails.color"] ? "border-red-500" : ""
                      }
                    />
                    {errors["textileDetails.color"] && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors["textileDetails.color"]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorCode">Color Code</Label>
                    <Input
                      id="colorCode"
                      placeholder="e.g., #001F3F or Pantone 19-4052"
                      value={formData.textileDetails.colorCode}
                      onChange={(e) =>
                        handleTextileDetailChange("colorCode", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fabricType">Fabric Type</Label>
                    <Select
                      value={formData.textileDetails.fabricType}
                      onValueChange={(value) =>
                        handleTextileDetailChange("fabricType", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fabric type" />
                      </SelectTrigger>
                      <SelectContent>
                        {fabricTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="composition">Composition</Label>
                    <Input
                      id="composition"
                      placeholder="e.g., 100% Cotton or 65% Polyester 35% Cotton"
                      value={formData.textileDetails.composition}
                      onChange={(e) =>
                        handleTextileDetailChange("composition", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pattern">Pattern</Label>
                    <Select
                      value={formData.textileDetails.pattern}
                      onValueChange={(value) =>
                        handleTextileDetailChange("pattern", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {patterns.map((pattern) => (
                          <SelectItem key={pattern} value={pattern}>
                            {pattern}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="finish">Finish</Label>
                    <Select
                      value={formData.textileDetails.finish}
                      onValueChange={(value) =>
                        handleTextileDetailChange("finish", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select finish" />
                      </SelectTrigger>
                      <SelectContent>
                        {finishes.map((finish) => (
                          <SelectItem key={finish} value={finish}>
                            {finish}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gsm">GSM (Grams per Square Meter)</Label>
                    <Input
                      id="gsm"
                      type="number"
                      placeholder="e.g., 180"
                      value={formData.textileDetails.gsm}
                      onChange={(e) =>
                        handleTextileDetailChange("gsm", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="width">Width (cm or inches)</Label>
                    <Input
                      id="width"
                      type="number"
                      placeholder="e.g., 150"
                      value={formData.textileDetails.width}
                      onChange={(e) =>
                        handleTextileDetailChange("width", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fabricWeight">Fabric Weight</Label>
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shrinkage">Shrinkage</Label>
                    <Input
                      id="shrinkage"
                      placeholder="e.g., 2-3%"
                      value={formData.textileDetails.shrinkage}
                      onChange={(e) =>
                        handleTextileDetailChange("shrinkage", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="washability">Washability</Label>
                    <Input
                      id="washability"
                      placeholder="e.g., Machine Washable at 30°C"
                      value={formData.textileDetails.washability}
                      onChange={(e) =>
                        handleTextileDetailChange("washability", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight</Label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="weight"
                        placeholder="e.g., 2.5 kg"
                        value={formData.weight}
                        onChange={(e) =>
                          handleInputChange("weight", e.target.value)
                        }
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careInstructions">Care Instructions</Label>
                  <Textarea
                    id="careInstructions"
                    placeholder="e.g., Machine wash cold, tumble dry low, do not bleach..."
                    value={formData.textileDetails.careInstructions}
                    onChange={(e) =>
                      handleTextileDetailChange(
                        "careInstructions",
                        e.target.value
                      )
                    }
                    rows={3}
                    className="resize-none"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    Next Step
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Stock & Pricing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Stock Management & Pricing
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Inventory levels and pricing information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="price">Unit Price *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange("price", e.target.value)
                        }
                        className={`pl-8 ${errors.price ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
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
                        className="pl-8"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount">Discount %</Label>
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
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Current Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="e.g., 1000"
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange("quantity", e.target.value)
                      }
                      className={errors.quantity ? "border-red-500" : ""}
                    />
                    {errors.quantity && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      placeholder="10"
                      value={formData.minStockLevel}
                      onChange={(e) =>
                        handleInputChange("minStockLevel", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input
                      id="reorderLevel"
                      type="number"
                      placeholder="20"
                      value={formData.reorderLevel}
                      onChange={(e) =>
                        handleInputChange("reorderLevel", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                    <Input
                      id="reorderQuantity"
                      type="number"
                      placeholder="50"
                      value={formData.reorderQuantity}
                      onChange={(e) =>
                        handleInputChange("reorderQuantity", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="safetyStockLevel">Safety Stock Level</Label>
                    <Input
                      id="safetyStockLevel"
                      type="number"
                      placeholder="15"
                      value={formData.safetyStockLevel}
                      onChange={(e) =>
                        handleInputChange("safetyStockLevel", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maximumQuantity">Maximum Quantity</Label>
                    <Input
                      id="maximumQuantity"
                      type="number"
                      placeholder="e.g., 5000"
                      value={formData.maximumQuantity}
                      onChange={(e) =>
                        handleInputChange("maximumQuantity", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reservedQuantity">Reserved Quantity</Label>
                    <Input
                      id="reservedQuantity"
                      type="number"
                      placeholder="0"
                      value={formData.reservedQuantity}
                      onChange={(e) =>
                        handleInputChange("reservedQuantity", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="committedQuantity">
                      Committed Quantity
                    </Label>
                    <Input
                      id="committedQuantity"
                      type="number"
                      placeholder="0"
                      value={formData.committedQuantity}
                      onChange={(e) =>
                        handleInputChange("committedQuantity", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="damagedQuantity">Damaged Quantity</Label>
                    <Input
                      id="damagedQuantity"
                      type="number"
                      placeholder="0"
                      value={formData.damagedQuantity}
                      onChange={(e) =>
                        handleInputChange("damagedQuantity", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leadTime">Lead Time (days)</Label>
                    <Input
                      id="leadTime"
                      type="number"
                      placeholder="7"
                      value={formData.leadTime}
                      onChange={(e) =>
                        handleInputChange("leadTime", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shelfLife">
                      Shelf Life (if applicable)
                    </Label>
                    <Input
                      id="shelfLife"
                      type="number"
                      placeholder="e.g., 365 days"
                      value={formData.shelfLife}
                      onChange={(e) =>
                        handleInputChange("shelfLife", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoReorder"
                      checked={formData.autoReorderEnabled}
                      onCheckedChange={(checked) =>
                        handleInputChange("autoReorderEnabled", !!checked)
                      }
                    />
                    <Label htmlFor="autoReorder" className="cursor-pointer">
                      Enable Auto Reorder
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="batchTracked"
                      checked={formData.isBatchTracked}
                      onCheckedChange={(checked) =>
                        handleInputChange("isBatchTracked", !!checked)
                      }
                    />
                    <Label htmlFor="batchTracked" className="cursor-pointer">
                      Enable Batch Tracking
                    </Label>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    Next Step
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Quality & Compliance */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Quality & Compliance Standards
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Certifications and quality information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="qualityGrade">Quality Grade</Label>
                    <Select
                      value={formData.qualityGrade}
                      onValueChange={(value) =>
                        handleInputChange("qualityGrade", value)
                      }
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="season">Season</Label>
                    <Select
                      value={formData.season}
                      onValueChange={(value) =>
                        handleInputChange("season", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {seasons.map((season) => (
                          <SelectItem key={season} value={season}>
                            {season}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="countryOfOrigin">Country of Origin</Label>
                    <Input
                      id="countryOfOrigin"
                      placeholder="e.g., India"
                      value={formData.countryOfOrigin}
                      onChange={(e) =>
                        handleInputChange("countryOfOrigin", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      placeholder="e.g., ABC Mills Pvt Ltd"
                      value={formData.manufacturer}
                      onChange={(e) =>
                        handleInputChange("manufacturer", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      placeholder="e.g., 1234567890123"
                      value={formData.barcode}
                      onChange={(e) =>
                        handleInputChange("barcode", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="internalCode">Internal Code</Label>
                    <Input
                      id="internalCode"
                      placeholder="e.g., IC-2025-001"
                      value={formData.internalCode}
                      onChange={(e) =>
                        handleInputChange("internalCode", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Certifications
                  </Label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {certifications.map((cert) => (
                      <label
                        key={cert}
                        className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 border rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-800"
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
                        <span className="text-sm">{cert}</span>
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
                  <Label htmlFor="sustainable" className="cursor-pointer">
                    This is a sustainable/eco-friendly product
                  </Label>
                </div>

                <div className="space-y-4">
                  <Label>Compliance Standards</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., REACH Compliant"
                      value={complianceInput}
                      onChange={(e) => setComplianceInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addComplianceStandard();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addComplianceStandard}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.complianceStandards.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.complianceStandards.map((standard, index) => (
                        <Badge key={index} variant="secondary">
                          {standard}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={() => removeComplianceStandard(standard)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="carbonFootprint">
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recycledContent">Recycled Content %</Label>
                    <Input
                      id="recycledContent"
                      type="number"
                      max="100"
                      placeholder="e.g., 30"
                      value={formData.recycledContent}
                      onChange={(e) =>
                        handleInputChange("recycledContent", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Supplier Contact Information</Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplierPhone">Phone</Label>
                      <Input
                        id="supplierPhone"
                        placeholder="e.g., +1 234 567 8900"
                        value={formData.supplierContact.phone}
                        onChange={(e) =>
                          handleSupplierContactChange("phone", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supplierEmail">Email</Label>
                      <Input
                        id="supplierEmail"
                        type="email"
                        placeholder="e.g., contact@supplier.com"
                        value={formData.supplierContact.email}
                        onChange={(e) =>
                          handleSupplierContactChange("email", e.target.value)
                        }
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label htmlFor="supplierAddress">Address</Label>
                      <Textarea
                        id="supplierAddress"
                        placeholder="Full supplier address..."
                        value={formData.supplierContact.address}
                        onChange={(e) =>
                          handleSupplierContactChange("address", e.target.value)
                        }
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="bg-gradient-to-r from-orange-600 to-red-600"
                  >
                    Next Step
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Media & Final */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">
                      Media Upload & Final Details
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Add images, tags, and finalize your inventory item
                    </p>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Product Images
                  </Label>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="text-center">
                      <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                        {isUploading ? (
                          <Loader2 className="h-8 w-8 text-white animate-spin" />
                        ) : (
                          <Upload className="h-8 w-8 text-white" />
                        )}
                      </div>
                      <div className="mb-4">
                        <p className="text-lg font-semibold">
                          {isUploading
                            ? "Uploading to IPFS..."
                            : "Upload Item Images"}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Drag and drop files here, or click to browse
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
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
                        className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer ${
                          isUploading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:from-blue-700 hover:to-cyan-700"
                        }`}
                      >
                        <Camera className="h-4 w-4" />
                        Choose Images
                      </label>
                    </div>

                    {isUploading && (
                      <div className="mt-4">
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {uploadProgress}% uploaded
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div
                          key={index}
                          className="relative group aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                        >
                          <img
                            src={image}
                            alt={`Item ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          {index === 0 && (
                            <Badge className="absolute top-2 left-2 bg-blue-600 text-white text-xs">
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
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Item Tags
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag (e.g., premium, durable)"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-auto p-0"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dimensions */}
                <div className="space-y-4">
                  <Label className="flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Dimensions (Optional)
                  </Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="length" className="text-xs text-gray-500">
                        Length
                      </Label>
                      <Input
                        id="length"
                        placeholder="e.g., 100 cm"
                        value={formData.dimensions.length}
                        onChange={(e) =>
                          handleDimensionChange("length", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width" className="text-xs text-gray-500">
                        Width
                      </Label>
                      <Input
                        id="width"
                        placeholder="e.g., 50 cm"
                        value={formData.dimensions.width}
                        onChange={(e) =>
                          handleDimensionChange("width", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height" className="text-xs text-gray-500">
                        Height
                      </Label>
                      <Input
                        id="height"
                        placeholder="e.g., 20 cm"
                        value={formData.dimensions.height}
                        onChange={(e) =>
                          handleDimensionChange("height", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Internal)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information for internal use..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Summary Card */}
                <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      Inventory Item Summary
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Name</p>
                        <p className="font-semibold">
                          {formData.name || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Category
                        </p>
                        <p className="font-semibold">
                          {formData.category || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Price
                        </p>
                        <p className="font-semibold">
                          ${formData.price || "0.00"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Quantity
                        </p>
                        <p className="font-semibold">
                          {formData.quantity || "0"} {formData.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Color
                        </p>
                        <p className="font-semibold">
                          {formData.textileDetails.color || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Fabric Type
                        </p>
                        <p className="font-semibold">
                          {formData.textileDetails.fabricType || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Reorder Level
                        </p>
                        <p className="font-semibold">
                          {formData.reorderLevel || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Supplier
                        </p>
                        <p className="font-semibold">
                          {formData.supplierName || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Images
                        </p>
                        <p className="font-semibold">
                          {formData.images.length} uploaded
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Certifications
                        </p>
                        <p className="font-semibold">
                          {formData.certifications.length} selected
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Quality Grade
                        </p>
                        <p className="font-semibold">
                          {formData.qualityGrade
                            ? `Grade ${formData.qualityGrade}`
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Auto Reorder
                        </p>
                        <p className="font-semibold">
                          {formData.autoReorderEnabled ? "Enabled" : "Disabled"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewMode(true)}
                      className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      {isLoading ? "Adding..." : "Add to Inventory"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Package className="h-4 w-4 text-white" />
                </div>
                Add to Inventory
              </DialogTitle>
              <DialogDescription>
                Are you ready to add this item to the inventory? This action
                will:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Create inventory record on blockchain
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Store item images securely on IPFS
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Enable stock tracking and management
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Set up automated reorder alerts
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Once added, inventory information will be recorded on the
                  blockchain for traceability.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
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
