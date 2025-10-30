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
  RotateCcw,
  Shield,
  Palette,
  Activity,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";

// Categories from Inventory.js schema
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

const finishes = ["Raw", "Bleached", "Dyed", "Printed", "Coated", "Plain"];

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
  const { user } = useAuth();
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

  const [formData, setFormData] = useState({
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

  const [errors, setErrors] = useState({});
  const [tagInput, setTagInput] = useState("");
  const [complianceInput, setComplianceInput] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleTextileDetailChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      textileDetails: { ...prev.textileDetails, [field]: value },
    }));
  };

  const handleSupplierContactChange = (field, value) => {
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

  const removeTag = (tagToRemove) => {
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

  const removeComplianceStandard = (standard) => {
    setFormData((prev) => ({
      ...prev,
      complianceStandards: prev.complianceStandards.filter(
        (s) => s !== standard
      ),
    }));
  };

  const handleImageUpload = async (files) => {
    if (!files) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newImages = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        const mockImageUrl = `https://via.placeholder.com/400x300?text=${encodeURIComponent(file.name)}`;
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

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

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
      dimensions: "",
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
        ...formData,
        supplierId: user?.id || "supplier1",
        supplierWalletAddress: user?.walletAddress || "",
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(false)}
                className="flex items-center gap-2"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Edit
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Inventory Item Preview
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Preview how your inventory item will appear
                </p>
              </div>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              {isLoading ? "Adding..." : "Add to Inventory"}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
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

            <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    {formData.name || "Item Name"}
                  </h2>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="text-xs">
                      {formData.category || "Category"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {formData.subcategory || "Subcategory"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {formData.description || "Description..."}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Price per {formData.unit}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        ${formData.price || "0.00"}
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
                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
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
                    <p className="text-xs font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      Certifications
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {formData.certifications.map((cert, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="bg-green-50 dark:bg-green-900/20 text-xs"
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
        {/* Header - matching dashboard style */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Add Inventory Item
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Add new textile materials and components to inventory
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-blue-100/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm backdrop-blur-sm text-xs">
                  <Package className="h-3 w-3 mr-1" />
                  Inventory Management
                </Badge>
                <Badge
                  variant="outline"
                  className="border-blue-700 text-blue-700 bg-transparent dark:bg-blue-950 dark:text-blue-300 dark:border-blue-950 shadow-sm backdrop-blur-sm flex items-center gap-1 text-xs"
                >
                  <Shield className="h-3 w-3 mr-1 text-blue-500 dark:text-blue-300" />
                  Blockchain Tracked
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={resetForm}
                size="sm"
                className="text-xs"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={saveAsDraft}
                size="sm"
                className="text-xs"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => setPreviewMode(true)}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-xs"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar - matching dashboard card style */}
        <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Step {currentStep} of {totalSteps}
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {Math.round(getStepProgress())}% Complete
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2 mb-4" />
            <div className="grid grid-cols-5 gap-3">
              {[
                { step: 1, title: "Basic Info", icon: Package },
                { step: 2, title: "Textile Details", icon: Palette },
                { step: 3, title: "Stock & Pricing", icon: Activity },
                { step: 4, title: "Quality", icon: Shield },
                { step: 5, title: "Media", icon: Camera },
              ].map(({ step, title, icon: Icon }) => (
                <button
                  key={step}
                  onClick={() => setCurrentStep(step)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer hover:shadow-md ${
                    step === currentStep
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : step < currentStep
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{title}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Content - matching dashboard card style */}
        <Card className="border border-white/20 dark:border-gray-700/30 shadow-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Basic Item Information
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Essential details about the inventory item
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-medium">
                      Item Name *
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Premium Cotton Fabric"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className={`text-sm h-10 ${errors.name ? "border-red-500" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-xs font-medium">
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
                        className={`text-sm h-10 ${errors.category ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {inventoryCategories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-sm">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.category}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="subcategory"
                      className="text-xs font-medium"
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
                        className={`text-sm h-10 ${errors.subcategory ? "border-red-500" : ""}`}
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
                        <AlertCircle className="h-3 w-3" />
                        {errors.subcategory}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="materialType"
                      className="text-xs font-medium"
                    >
                      Material Type
                    </Label>
                    <Select
                      value={formData.materialType}
                      onValueChange={(value) =>
                        handleInputChange("materialType", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-10">
                        <SelectValue />
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
                    <Label htmlFor="sku" className="text-xs font-medium">
                      SKU / Item Code
                    </Label>
                    <Input
                      id="sku"
                      placeholder="e.g., INV-2025-001"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      className="text-sm h-10"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Leave empty to auto-generate
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand" className="text-xs font-medium">
                      Brand / Manufacturer
                    </Label>
                    <Input
                      id="brand"
                      placeholder="e.g., Textile Solutions Inc."
                      value={formData.brand}
                      onChange={(e) =>
                        handleInputChange("brand", e.target.value)
                      }
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-xs font-medium">
                      Unit of Measurement *
                    </Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(value) =>
                        handleInputChange("unit", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-10">
                        <SelectValue />
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

                  <div className="space-y-2">
                    <Label
                      htmlFor="supplierName"
                      className="text-xs font-medium"
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
                      className={`text-sm h-10 ${errors.supplierName ? "border-red-500" : ""}`}
                    />
                    {errors.supplierName && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.supplierName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs font-medium">
                    Item Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide a detailed description of the inventory item..."
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    className={`text-sm resize-none ${
                      errors.description ? "border-red-500" : ""
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Textile Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Palette className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Textile Details & Properties
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Specific textile characteristics and specifications
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-xs font-medium">
                      Color *
                    </Label>
                    <Input
                      id="color"
                      placeholder="e.g., Navy Blue"
                      value={formData.textileDetails.color}
                      onChange={(e) =>
                        handleTextileDetailChange("color", e.target.value)
                      }
                      className={`text-sm h-10 ${
                        errors["textileDetails.color"] ? "border-red-500" : ""
                      }`}
                    />
                    {errors["textileDetails.color"] && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors["textileDetails.color"]}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorCode" className="text-xs font-medium">
                      Color Code
                    </Label>
                    <Input
                      id="colorCode"
                      placeholder="e.g., #001F3F or Pantone 19-4052"
                      value={formData.textileDetails.colorCode}
                      onChange={(e) =>
                        handleTextileDetailChange("colorCode", e.target.value)
                      }
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fabricType" className="text-xs font-medium">
                      Fabric Type
                    </Label>
                    <Select
                      value={formData.textileDetails.fabricType}
                      onValueChange={(value) =>
                        handleTextileDetailChange("fabricType", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-10">
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
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pattern" className="text-xs font-medium">
                      Pattern
                    </Label>
                    <Select
                      value={formData.textileDetails.pattern}
                      onValueChange={(value) =>
                        handleTextileDetailChange("pattern", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-10">
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
                    <Label htmlFor="finish" className="text-xs font-medium">
                      Finish
                    </Label>
                    <Select
                      value={formData.textileDetails.finish}
                      onValueChange={(value) =>
                        handleTextileDetailChange("finish", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-10">
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
                    <Label htmlFor="gsm" className="text-xs font-medium">
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="width" className="text-xs font-medium">
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="fabricWeight"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shrinkage" className="text-xs font-medium">
                      Shrinkage
                    </Label>
                    <Input
                      id="shrinkage"
                      placeholder="e.g., 2-3%"
                      value={formData.textileDetails.shrinkage}
                      onChange={(e) =>
                        handleTextileDetailChange("shrinkage", e.target.value)
                      }
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="washability"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-xs font-medium">
                      Weight
                    </Label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="weight"
                        placeholder="e.g., 2.5 kg"
                        value={formData.weight}
                        onChange={(e) =>
                          handleInputChange("weight", e.target.value)
                        }
                        className="pl-10 text-sm h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="careInstructions"
                    className="text-xs font-medium"
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
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Stock & Pricing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                      Stock Management & Pricing
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Inventory levels and pricing information
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-xs font-medium">
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
                        value={formData.price}
                        onChange={(e) =>
                          handleInputChange("price", e.target.value)
                        }
                        className={`pl-8 text-sm h-10 ${errors.price ? "border-red-500" : ""}`}
                      />
                    </div>
                    {errors.price && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costPrice" className="text-xs font-medium">
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
                        className="pl-8 text-sm h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="discount" className="text-xs font-medium">
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
                      className="text-sm h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity" className="text-xs font-medium">
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
                      className={`text-sm h-10 ${errors.quantity ? "border-red-500" : ""}`}
                    />
                    {errors.quantity && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.quantity}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="minStockLevel"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="reorderLevel"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="reorderQuantity"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="safetyStockLevel"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="maximumQuantity"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leadTime" className="text-xs font-medium">
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shelfLife" className="text-xs font-medium">
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
                      className="text-sm h-10"
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
                      onCheckedChange={(checked) =>
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
                  <Button variant="outline" onClick={prevStep} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Quality & Compliance */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
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
                      className="text-xs font-medium"
                    >
                      Quality Grade
                    </Label>
                    <Select
                      value={formData.qualityGrade}
                      onValueChange={(value) =>
                        handleInputChange("qualityGrade", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-10">
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
                    <Label htmlFor="season" className="text-xs font-medium">
                      Season
                    </Label>
                    <Select
                      value={formData.season}
                      onValueChange={(value) =>
                        handleInputChange("season", value)
                      }
                    >
                      <SelectTrigger className="text-sm h-10">
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
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="manufacturer"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="barcode" className="text-xs font-medium">
                      Barcode
                    </Label>
                    <Input
                      id="barcode"
                      placeholder="e.g., 1234567890123"
                      value={formData.barcode}
                      onChange={(e) =>
                        handleInputChange("barcode", e.target.value)
                      }
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="internalCode"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    <Award className="h-4 w-4" />
                    Certifications
                  </Label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {certifications.map((cert) => (
                      <label
                        key={cert}
                        className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 border rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
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
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addComplianceStandard();
                        }
                      }}
                      className="text-sm h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addComplianceStandard}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.complianceStandards.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.complianceStandards.map((standard, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="carbonFootprint"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="recycledContent"
                      className="text-xs font-medium"
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
                      className="text-sm h-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-medium">
                    Supplier Contact Information
                  </Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="supplierPhone"
                        className="text-xs font-medium"
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
                        className="text-sm h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="supplierEmail"
                        className="text-xs font-medium"
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
                        className="text-sm h-10"
                      />
                    </div>

                    <div className="space-y-2 lg:col-span-2">
                      <Label
                        htmlFor="supplierAddress"
                        className="text-xs font-medium"
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
                        className="resize-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={prevStep} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextStep}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Next Step
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 5: Media & Final */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
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
                    <ImageIcon className="h-4 w-4" />
                    Product Images
                  </Label>

                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="text-center">
                      <div className="mx-auto h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-3">
                        {isUploading ? (
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-blue-600" />
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
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer ${
                          isUploading
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-blue-700"
                        }`}
                      >
                        <Camera className="h-4 w-4" />
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
                  <Label className="flex items-center gap-2 text-xs font-medium">
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
                      className="text-sm h-10"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      className="shrink-0"
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
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
                  <Label className="flex items-center gap-2 text-xs font-medium">
                    <Ruler className="h-4 w-4" />
                    Dimensions (Optional)
                  </Label>
                  <Input
                    placeholder="e.g., 100cm x 50cm x 20cm"
                    value={formData.dimensions}
                    onChange={(e) =>
                      handleInputChange("dimensions", e.target.value)
                    }
                    className="text-sm h-10"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-xs font-medium">
                    Additional Notes (Internal)
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information for internal use..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Summary Card - matching dashboard style */}
                <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-gray-100">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
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
                          ${formData.price || "0.00"}
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
                  <Button variant="outline" onClick={prevStep} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setPreviewMode(true)}
                      size="sm"
                      className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={isLoading}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
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

        {/* Confirmation Dialog - matching dashboard style */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-100">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                Add to Inventory
              </DialogTitle>
              <DialogDescription className="text-sm">
                Are you ready to add this item to the inventory? This action
                will:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <ul className="space-y-2 text-xs">
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
                <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
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
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
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
