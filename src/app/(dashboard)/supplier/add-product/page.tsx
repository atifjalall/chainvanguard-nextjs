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
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Factory,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Camera,
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Building2,
  Package,
  Shield,
  Globe,
  Sparkles,
  Zap,
  CheckCircle,
  Calendar,
  Tag,
  Ruler,
  Weight,
  Truck,
  Users,
  DollarSign,
  Award,
  FileText,
  Plus,
  Minus,
  Copy,
  RotateCcw,
  Settings,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";

// Supplier-specific categories
const supplierCategories = [
  "Raw Materials",
  "Electronics Components",
  "Textiles & Fabrics",
  "Chemical Products",
  "Machinery & Equipment",
  "Automotive Parts",
  "Construction Materials",
  "Agricultural Products",
  "Medical Supplies",
  "Industrial Equipment",
  "Packaging Materials",
  "Energy & Utilities",
  "Food Ingredients",
  "Metal & Alloys",
  "Pharmaceuticals",
];

const certificationTypes = [
  "ISO 9001",
  "ISO 14001",
  "CE Marking",
  "FDA Approved",
  "ROHS Compliant",
  "FSC Certified",
  "Fair Trade",
  "Organic Certified",
  "GMP Certified",
  "HACCP Certified",
];

const originCountries = [
  "Germany",
  "United States",
  "China",
  "Japan",
  "United Kingdom",
  "France",
  "Italy",
  "Canada",
  "Australia",
  "Netherlands",
  "Switzerland",
  "South Korea",
  "India",
  "Brazil",
  "Mexico",
];

interface BulkPricingTier {
  minQuantity: string;
  maxQuantity: string;
  unitPrice: string;
  discount: string;
}

export default function SupplierAddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Form state with supplier-specific fields
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    sku: "",

    // Product Details
    brand: "",
    model: "",
    weight: "",
    dimensions: {
      length: "",
      width: "",
      height: "",
    },
    color: "",
    material: "",

    // Supply Chain Info
    manufacturingDate: "",
    expiryDate: "",
    origin: "",
    minimumOrderQuantity: "",
    leadTime: "",
    shelfLife: "",

    // Compliance & Quality
    certifications: [] as string[],
    qualityGrade: "",
    complianceStandards: [] as string[],
    hazardousClassification: "",

    // Pricing & Terms
    currency: "USD",
    bulkPricing: [] as BulkPricingTier[],
    paymentTerms: "",
    warrantyPeriod: "",

    // Additional
    tags: [] as string[],
    images: [] as string[],
    documents: [] as string[],
    notes: "",
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tag input
  const [tagInput, setTagInput] = useState("");

  // Compliance standards
  const [complianceInput, setComplianceInput] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
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

  const addBulkPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: [
        ...prev.bulkPricing,
        {
          minQuantity: "",
          maxQuantity: "",
          unitPrice: "",
          discount: "",
        },
      ],
    }));
  };

  const updateBulkPricingTier = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: prev.bulkPricing.map((tier, i) =>
        i === index ? { ...tier, [field]: value } : tier
      ),
    }));
  };

  const removeBulkPricingTier = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: prev.bulkPricing.filter((_, i) => i !== index),
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

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // In real implementation, upload to IPFS
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

    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price || parseFloat(formData.price) <= 0)
      newErrors.price = "Valid price is required";
    if (!formData.quantity || parseInt(formData.quantity) <= 0)
      newErrors.quantity = "Valid quantity is required";
    if (
      !formData.minimumOrderQuantity ||
      parseInt(formData.minimumOrderQuantity) <= 0
    ) {
      newErrors.minimumOrderQuantity = "Minimum order quantity is required";
    }
    if (!formData.origin) newErrors.origin = "Country of origin is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveAsDraft = () => {
    const drafts = JSON.parse(
      localStorage.getItem("supplier_product_drafts") || "[]"
    );
    const draft = {
      id: `draft_${Date.now()}`,
      ...formData,
      status: "draft",
      createdAt: new Date().toISOString(),
    };
    drafts.push(draft);
    localStorage.setItem("supplier_product_drafts", JSON.stringify(drafts));
    toast.success("Product saved as draft");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      price: "",
      quantity: "",
      sku: "",
      brand: "",
      model: "",
      weight: "",
      dimensions: { length: "", width: "", height: "" },
      color: "",
      material: "",
      manufacturingDate: "",
      expiryDate: "",
      origin: "",
      minimumOrderQuantity: "",
      leadTime: "",
      shelfLife: "",
      certifications: [],
      qualityGrade: "",
      complianceStandards: [],
      hazardousClassification: "",
      currency: "USD",
      bulkPricing: [],
      paymentTerms: "",
      warrantyPeriod: "",
      tags: [],
      images: [],
      documents: [],
      notes: "",
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
      const product: Product = {
        id: Date.now().toString(),
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        images: formData.images,
        supplierId: user?.id || "supplier1",
        supplierName: user?.name || "Supplier",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "active",
        sku: formData.sku || `SKU-${Date.now()}`,
        weight: formData.weight,
        // Convert dimensions object to string
        dimensions:
          formData.dimensions.length ||
          formData.dimensions.width ||
          formData.dimensions.height
            ? `${formData.dimensions.length || ""}x${formData.dimensions.width || ""}x${formData.dimensions.height || ""}`
            : undefined,
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        tags: formData.tags,
        brand: formData.brand,
        model: formData.model,
        color: formData.color,
        material: formData.material,
        warranty: formData.warrantyPeriod,
        // Convert certifications array to string
        certifications:
          formData.certifications.length > 0
            ? formData.certifications.join(", ")
            : undefined,
        origin: formData.origin,
        minimumOrderQuantity: parseInt(formData.minimumOrderQuantity),
      };

      // Save to localStorage (in real app, this would be blockchain + IPFS)
      const existingProducts = JSON.parse(
        localStorage.getItem(`supplier_${user?.id}_products`) || "[]"
      );
      const updatedProducts = [...existingProducts, product];
      localStorage.setItem(
        `supplier_${user?.id}_products`,
        JSON.stringify(updatedProducts)
      );

      // Simulate blockchain transaction with smart contract
      console.log("Product added to Hyperledger Fabric:", product);
      console.log("IPFS hashes for images:", formData.images);

      toast.success("Product added to supply chain successfully!");
      router.push("/supplier/products");
    } catch (error) {
      toast.error("Failed to add product");
      console.error("Error adding product:", error);
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
          {/* Preview Header */}
          <div
            className={`transform transition-all duration-700 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(false)}
                  className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Edit
                </Button>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                    Supply Product Preview
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
                    Preview how your product will appear to vendors
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                      <Factory className="h-3 w-3 mr-1" />
                      Supply Chain Ready
                    </Badge>
                    <Badge variant="outline" className="border-gray-300">
                      <Shield className="h-3 w-3 mr-1" />
                      Blockchain Secured
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                {isLoading
                  ? "Adding to Supply Chain..."
                  : "Publish to Supply Chain"}
              </Button>
            </div>
          </div>

          {/* Product Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Images */}
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-2xl">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {formData.images.length > 0 ? (
                    <div className="grid gap-4">
                      <div className="aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                        <img
                          src={formData.images[0]}
                          alt={formData.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {formData.images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {formData.images.slice(1, 5).map((image, index) => (
                            <div
                              key={index}
                              className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900"
                            >
                              <img
                                src={image}
                                alt={`${formData.name} ${index + 2}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No images uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-2xl">
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {formData.name || "Product Name"}
                    </h2>
                    <div className="flex items-center gap-2 mb-4">
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                        {formData.category || "Category"}
                      </Badge>
                      {formData.origin && (
                        <Badge variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          {formData.origin}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {formData.description ||
                        "Product description will appear here..."}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Price per unit
                        </p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          ${formData.price || "0.00"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Available
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {formData.quantity || "0"} units
                        </p>
                      </div>
                    </div>
                    {formData.minimumOrderQuantity && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Minimum Order:{" "}
                          <span className="font-semibold">
                            {formData.minimumOrderQuantity} units
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Product Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "SKU", value: formData.sku },
                      { label: "Brand", value: formData.brand },
                      { label: "Model", value: formData.model },
                      { label: "Weight", value: formData.weight },
                      { label: "Material", value: formData.material },
                      { label: "Lead Time", value: formData.leadTime },
                    ]
                      .filter((item) => item.value)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                        >
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {item.label}
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {item.value}
                          </p>
                        </div>
                      ))}
                  </div>

                  {/* Certifications */}
                  {formData.certifications.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Certifications
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.certifications.map((cert, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                          >
                            <Award className="h-3 w-3 mr-1" />
                            {cert}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {formData.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Tags
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-gray-100 dark:bg-gray-800"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div
          className={`transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                Add New Supply Product
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg mt-2">
                Create a new product for your supply chain network
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  <Factory className="h-3 w-3 mr-1" />
                  Supply Chain
                </Badge>
                <Badge variant="outline" className="border-gray-300">
                  <Shield className="h-3 w-3 mr-1" />
                  Blockchain Secured
                </Badge>
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                  <Zap className="h-3 w-3 mr-1" />
                  IPFS Storage
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={resetForm}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Form
              </Button>
              <Button
                variant="outline"
                onClick={saveAsDraft}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-900"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button
                onClick={() => setPreviewMode(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Product
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className={`transform transition-all duration-700 delay-100 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Step {currentStep} of {totalSteps}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Math.round(getStepProgress())}% Complete
                </span>
              </div>
              <Progress value={getStepProgress()} className="h-2 mb-4" />
              <div className="grid grid-cols-4 gap-4">
                {[
                  { step: 1, title: "Basic Info", icon: Package },
                  { step: 2, title: "Details", icon: Settings },
                  { step: 3, title: "Compliance", icon: Shield },
                  { step: 4, title: "Media & Final", icon: Camera },
                ].map(({ step, title, icon: Icon }) => (
                  <div
                    key={step}
                    className={`flex items-center gap-2 p-3 rounded-lg transition-all duration-300 ${
                      step === currentStep
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                        : step < currentStep
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{title}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Content */}
        <div
          className={`transform transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Card className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-0 shadow-2xl">
            <CardContent className="p-6">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                      <Package className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Basic Product Information
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Enter the essential details about your product
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Product Name *
                      </Label>
                      <Input
                        id="name"
                        placeholder="e.g., Premium Steel Components"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 ${
                          errors.name ? "border-red-500" : ""
                        }`}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="category"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Category *
                      </Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          handleInputChange("category", value)
                        }
                      >
                        <SelectTrigger
                          className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 ${
                            errors.category ? "border-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.category}
                        </p>
                      )}
                    </div>

                    {/* SKU */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="sku"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        SKU / Product Code
                      </Label>
                      <Input
                        id="sku"
                        placeholder="e.g., SUP-2025-001"
                        value={formData.sku}
                        onChange={(e) =>
                          handleInputChange("sku", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Leave empty to auto-generate
                      </p>
                    </div>

                    {/* Brand */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="brand"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Brand / Manufacturer
                      </Label>
                      <Input
                        id="brand"
                        placeholder="e.g., Industrial Solutions Inc."
                        value={formData.brand}
                        onChange={(e) =>
                          handleInputChange("brand", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="price"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Unit Price (USD) *
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={formData.price}
                          onChange={(e) =>
                            handleInputChange("price", e.target.value)
                          }
                          className={`pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 ${
                            errors.price ? "border-red-500" : ""
                          }`}
                        />
                      </div>
                      {errors.price && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.price}
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="quantity"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Available Quantity *
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        placeholder="e.g., 1000"
                        value={formData.quantity}
                        onChange={(e) =>
                          handleInputChange("quantity", e.target.value)
                        }
                        className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 ${
                          errors.quantity ? "border-red-500" : ""
                        }`}
                      />
                      {errors.quantity && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.quantity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Product Description *
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Provide a detailed description of your product, including specifications, applications, and key features..."
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange("description", e.target.value)
                      }
                      rows={4}
                      className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 resize-none ${
                        errors.description ? "border-red-500" : ""
                      }`}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-end">
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Next Step
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Product Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Product Details & Specifications
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Add detailed specifications and characteristics
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Model */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="model"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Model Number
                      </Label>
                      <Input
                        id="model"
                        placeholder="e.g., Pro-X1000"
                        value={formData.model}
                        onChange={(e) =>
                          handleInputChange("model", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    {/* Weight */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="weight"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
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
                          className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    {/* Material */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="material"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Material / Composition
                      </Label>
                      <Input
                        id="material"
                        placeholder="e.g., Stainless Steel 316L"
                        value={formData.material}
                        onChange={(e) =>
                          handleInputChange("material", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="color"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Color / Finish
                      </Label>
                      <Input
                        id="color"
                        placeholder="e.g., Brushed Silver"
                        value={formData.color}
                        onChange={(e) =>
                          handleInputChange("color", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    {/* Country of Origin */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="origin"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Country of Origin *
                      </Label>
                      <Select
                        value={formData.origin}
                        onValueChange={(value) =>
                          handleInputChange("origin", value)
                        }
                      >
                        <SelectTrigger
                          className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 ${
                            errors.origin ? "border-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {originCountries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.origin && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.origin}
                        </p>
                      )}
                    </div>

                    {/* Minimum Order Quantity */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="moq"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Minimum Order Quantity *
                      </Label>
                      <Input
                        id="moq"
                        type="number"
                        placeholder="e.g., 100"
                        value={formData.minimumOrderQuantity}
                        onChange={(e) =>
                          handleInputChange(
                            "minimumOrderQuantity",
                            e.target.value
                          )
                        }
                        className={`bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 ${
                          errors.minimumOrderQuantity ? "border-red-500" : ""
                        }`}
                      />
                      {errors.minimumOrderQuantity && (
                        <p className="text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.minimumOrderQuantity}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Dimensions */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Dimensions (Optional)
                    </Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="length"
                          className="text-xs text-gray-500 dark:text-gray-400"
                        >
                          Length
                        </Label>
                        <Input
                          id="length"
                          placeholder="e.g., 10 cm"
                          value={formData.dimensions.length}
                          onChange={(e) =>
                            handleDimensionChange("length", e.target.value)
                          }
                          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="width"
                          className="text-xs text-gray-500 dark:text-gray-400"
                        >
                          Width
                        </Label>
                        <Input
                          id="width"
                          placeholder="e.g., 5 cm"
                          value={formData.dimensions.width}
                          onChange={(e) =>
                            handleDimensionChange("width", e.target.value)
                          }
                          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="height"
                          className="text-xs text-gray-500 dark:text-gray-400"
                        >
                          Height
                        </Label>
                        <Input
                          id="height"
                          placeholder="e.g., 2 cm"
                          value={formData.dimensions.height}
                          onChange={(e) =>
                            handleDimensionChange("height", e.target.value)
                          }
                          className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lead Time and Shelf Life */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="leadTime"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Lead Time
                      </Label>
                      <Input
                        id="leadTime"
                        placeholder="e.g., 2-3 weeks"
                        value={formData.leadTime}
                        onChange={(e) =>
                          handleInputChange("leadTime", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="shelfLife"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Shelf Life (if applicable)
                      </Label>
                      <Input
                        id="shelfLife"
                        placeholder="e.g., 2 years"
                        value={formData.shelfLife}
                        onChange={(e) =>
                          handleInputChange("shelfLife", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  </div>

                  {/* Manufacturing and Expiry Dates */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="manufacturingDate"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Manufacturing Date
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="manufacturingDate"
                          type="date"
                          value={formData.manufacturingDate}
                          onChange={(e) =>
                            handleInputChange(
                              "manufacturingDate",
                              e.target.value
                            )
                          }
                          className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="expiryDate"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Expiry Date (if applicable)
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="expiryDate"
                          type="date"
                          value={formData.expiryDate}
                          onChange={(e) =>
                            handleInputChange("expiryDate", e.target.value)
                          }
                          className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Next Step
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Compliance & Quality */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Compliance & Quality Standards
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Add certifications and compliance information
                      </p>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Certifications
                    </Label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {certificationTypes.map((cert) => (
                        <label
                          key={cert}
                          className="flex items-center gap-2 p-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.certifications.includes(cert)}
                            onChange={(e) => {
                              if (e.target.checked) {
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
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {cert}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Quality Grade */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="qualityGrade"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Quality Grade
                      </Label>
                      <Select
                        value={formData.qualityGrade}
                        onValueChange={(value) =>
                          handleInputChange("qualityGrade", value)
                        }
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select quality grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">Premium Grade</SelectItem>
                          <SelectItem value="industrial">
                            Industrial Grade
                          </SelectItem>
                          <SelectItem value="commercial">
                            Commercial Grade
                          </SelectItem>
                          <SelectItem value="standard">
                            Standard Grade
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="hazardous"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Hazardous Classification
                      </Label>
                      <Select
                        value={formData.hazardousClassification}
                        onValueChange={(value) =>
                          handleInputChange("hazardousClassification", value)
                        }
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select classification" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="non-hazardous">
                            Non-Hazardous
                          </SelectItem>
                          <SelectItem value="flammable">Flammable</SelectItem>
                          <SelectItem value="corrosive">Corrosive</SelectItem>
                          <SelectItem value="toxic">Toxic</SelectItem>
                          <SelectItem value="explosive">Explosive</SelectItem>
                          <SelectItem value="oxidizing">Oxidizing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Compliance Standards */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Additional Compliance Standards
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
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addComplianceStandard}
                        className="shrink-0"
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
                            className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          >
                            {standard}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-auto p-0 text-blue-700 dark:text-blue-300 hover:text-red-500"
                              onClick={() => removeComplianceStandard(standard)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Warranty and Payment Terms */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="warranty"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Warranty Period
                      </Label>
                      <Input
                        id="warranty"
                        placeholder="e.g., 12 months"
                        value={formData.warrantyPeriod}
                        onChange={(e) =>
                          handleInputChange("warrantyPeriod", e.target.value)
                        }
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="paymentTerms"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Payment Terms
                      </Label>
                      <Select
                        value={formData.paymentTerms}
                        onValueChange={(value) =>
                          handleInputChange("paymentTerms", value)
                        }
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600">
                          <SelectValue placeholder="Select payment terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="net-30">Net 30 Days</SelectItem>
                          <SelectItem value="net-15">Net 15 Days</SelectItem>
                          <SelectItem value="cod">Cash on Delivery</SelectItem>
                          <SelectItem value="advance">50% Advance</SelectItem>
                          <SelectItem value="lc">Letter of Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Bulk Pricing */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bulk Pricing Tiers (Optional)
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addBulkPricingTier}
                        className="text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Tier
                      </Button>
                    </div>
                    {formData.bulkPricing.map((tier, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pricing Tier {index + 1}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBulkPricingTier(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">
                              Min Qty
                            </Label>
                            <Input
                              type="number"
                              placeholder="100"
                              value={tier.minQuantity}
                              onChange={(e) =>
                                updateBulkPricingTier(
                                  index,
                                  "minQuantity",
                                  e.target.value
                                )
                              }
                              className="bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">
                              Max Qty
                            </Label>
                            <Input
                              type="number"
                              placeholder="499"
                              value={tier.maxQuantity}
                              onChange={(e) =>
                                updateBulkPricingTier(
                                  index,
                                  "maxQuantity",
                                  e.target.value
                                )
                              }
                              className="bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">
                              Unit Price
                            </Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="9.99"
                              value={tier.unitPrice}
                              onChange={(e) =>
                                updateBulkPricingTier(
                                  index,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              className="bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">
                              Discount %
                            </Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="10"
                              value={tier.discount}
                              onChange={(e) =>
                                updateBulkPricingTier(
                                  index,
                                  "discount",
                                  e.target.value
                                )
                              }
                              className="bg-white dark:bg-gray-800 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={nextStep}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Next Step
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Media & Final */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
                      <Camera className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Media Upload & Final Details
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Add images, tags, and finalize your product listing
                      </p>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Product Images
                    </Label>

                    {/* Upload Area */}
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
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {isUploading
                              ? "Uploading to IPFS..."
                              : "Upload Product Images"}
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
                              alt={`Product ${index + 1}`}
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
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Product Tags
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a tag (e.g., durable, lightweight)"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600"
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
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="ml-1 h-auto p-0 text-purple-700 dark:text-purple-300 hover:text-red-500"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="notes"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Additional Notes (Internal)
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Any additional information for internal use..."
                      value={formData.notes}
                      onChange={(e) =>
                        handleInputChange("notes", e.target.value)
                      }
                      rows={3}
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-600 resize-none"
                    />
                  </div>

                  {/* Summary Card */}
                  <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                        Product Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            Name
                          </p>
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
                            {formData.quantity || "0"} units
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
                            Origin
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formData.origin || "Not set"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">
                            MOQ
                          </p>
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            {formData.minimumOrderQuantity || "Not set"}
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
                      </div>
                    </CardContent>
                  </Card>

                  {/* Navigation */}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setPreviewMode(true)}
                        className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={() => setIsConfirmOpen(true)}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {isLoading ? "Publishing..." : "Publish Product"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Factory className="h-4 w-4 text-white" />
                </div>
                Publish to Supply Chain
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Are you ready to publish this product to the blockchain supply
                chain network? This action will:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Create immutable product record on Hyperledger Fabric
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Store product images securely on IPFS
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Make product available to verified vendors
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Enable supply chain traceability and transparency
                  </li>
                </ul>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Once published, product information cannot be deleted from the
                  blockchain, only updated.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Publishing..." : "Confirm & Publish"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
