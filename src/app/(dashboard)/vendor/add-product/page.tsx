/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Loader2,
  DollarSign,
  Tag,
  Ruler,
  Palette,
  Shirt,
  ArrowRight,
  ArrowLeft,
  Info,
  Sparkles,
  Calendar,
  Box,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { ProductCard } from "@/components/product/product-card";

// Categories and subcategories
const CATEGORIES = {
  Men: [
    "T-Shirts",
    "Shirts",
    "Sweaters",
    "Hoodies",
    "Jackets",
    "Coats",
    "Jeans",
    "Trousers",
    "Shorts",
    "Suits",
    "Activewear",
    "Sleepwear",
    "Swimwear",
    "Underwear",
    "Shoes",
    "Sneakers",
    "Boots",
    "Sandals",
  ],
  Women: [
    "T-Shirts",
    "Blouses",
    "Sweaters",
    "Hoodies",
    "Jackets",
    "Coats",
    "Jeans",
    "Trousers",
    "Shorts",
    "Skirts",
    "Dresses",
    "Jumpsuits",
    "Activewear",
    "Sleepwear",
    "Swimwear",
    "Underwear",
    "Shoes",
    "Sneakers",
    "Boots",
    "Sandals",
  ],
  Kids: [
    "T-Shirts",
    "Shirts",
    "Sweaters",
    "Hoodies",
    "Jackets",
    "Jeans",
    "Trousers",
    "Shorts",
    "Dresses",
    "Activewear",
    "Sleepwear",
    "Swimwear",
    "Shoes",
    "Sneakers",
    "Boots",
    "Sandals",
  ],
  Unisex: [
    "T-Shirts",
    "Hoodies",
    "Jackets",
    "Activewear",
    "Sleepwear",
    "Scarves",
    "Belts",
    "Hats",
    "Bags",
  ],
};

const PRODUCT_TYPES = [
  "Casual",
  "Formal",
  "Sports",
  "Party",
  "Traditional",
  "Workwear",
];

const CATEGORY_SIZES = {
  Men: ["S", "M", "L", "XL", "XXL", "XXXL"],
  Women: ["XXS", "XS", "S", "M", "L", "XL", "XXL"],
  Kids: ["2T", "3T", "4T", "5", "6", "7", "8", "10", "12", "14"],
  Unisex: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
};

const FIT_TYPES = ["Slim Fit", "Regular Fit", "Loose Fit", "Oversized"];
const PATTERNS = [
  "Solid",
  "Striped",
  "Checked",
  "Printed",
  "Embroidered",
  "Other",
];
const FABRIC_TYPES = [
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
];
const NECKLINES = [
  "Crew Neck",
  "V-Neck",
  "Round Neck",
  "Collar",
  "Off-Shoulder",
  "Boat Neck",
  "Turtleneck",
  "Other",
];
const SLEEVE_LENGTHS = [
  "Sleeveless",
  "Short Sleeve",
  "3/4 Sleeve",
  "Long Sleeve",
];
const SEASONS = ["Spring", "Summer", "Autumn", "Winter", "All Season"];

const MAX_DESCRIPTION_LENGTH = 500;

export default function AddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    subcategory: "",
    productType: "Casual",
    brand: "",
    apparelDetails: {
      size: "",
      fit: "Regular Fit",
      color: "",
      pattern: "Solid",
      material: "",
      fabricType: "",
      fabricWeight: "",
      careInstructions: "Machine wash cold, tumble dry low",
      neckline: "Crew Neck",
      sleeveLength: "Short Sleeve",
    },
    price: "",
    costPrice: "",
    quantity: "",
    minStockLevel: "10",
    sku: "",
    weight: "",
    dimensions: "",
    tags: [] as string[],
    season: "All Season",
    countryOfOrigin: "",
    manufacturer: "",
    isFeatured: false,
    isNewArrival: false,
    isBestseller: false,
    isSustainable: false,
    certifications: [] as string[],
    freeShipping: false,
    shippingCost: "0",
    images: [] as File[],
    imagePreviews: [] as string[],
  });

  // Individual error states
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [subcategoryError, setSubcategoryError] = useState("");
  const [sizeError, setSizeError] = useState("");
  const [colorError, setColorError] = useState("");
  const [materialError, setMaterialError] = useState("");
  const [priceError, setPriceError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [imagesError, setImagesError] = useState("");

  const [tagInput, setTagInput] = useState("");
  const [certificationInput, setCertificationInput] = useState("");

  const totalSteps = 5;

  // Update form data
  const updateFormData = (field: string, value: any) => {
    if (field.startsWith("apparelDetails.")) {
      const apparelField = field.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        apparelDetails: {
          ...prev.apparelDetails,
          [apparelField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.images.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB size limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newImages = [...formData.images, ...validFiles];
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));

    setFormData((prev) => ({
      ...prev,
      images: newImages,
      imagePreviews: [...prev.imagePreviews, ...newPreviews],
    }));

    toast.success(`${validFiles.length} image(s) added`);
  };

  // Remove image
  const removeImage = (index: number) => {
    URL.revokeObjectURL(formData.imagePreviews[index]);
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }));
    toast.info("Image removed");
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      if (formData.tags.length >= 20) {
        toast.error("Maximum 20 tags allowed");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  // Add certification
  const addCertification = () => {
    if (
      certificationInput.trim() &&
      !formData.certifications.includes(certificationInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, certificationInput.trim()],
      }));
      setCertificationInput("");
    }
  };

  // Remove certification
  const removeCertification = (cert: string) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  };

  // Handle next step
  const handleNext = () => {
    // Clear all errors
    setNameError("");
    setDescriptionError("");
    setCategoryError("");
    setSubcategoryError("");
    setSizeError("");
    setColorError("");
    setMaterialError("");
    setPriceError("");
    setQuantityError("");
    setImagesError("");

    let hasErrors = false;

    // Validate current step
    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          setNameError("Product name is required");
          toast.error("Product name is required");
          hasErrors = true;
        } else if (formData.name.length < 3) {
          setNameError("Name must be at least 3 characters");
          toast.error("Name must be at least 3 characters");
          hasErrors = true;
        }

        if (!formData.description.trim()) {
          setDescriptionError("Description is required");
          toast.error("Description is required");
          hasErrors = true;
        } else if (formData.description.length < 10) {
          setDescriptionError("Description must be at least 10 characters");
          toast.error("Description must be at least 10 characters");
          hasErrors = true;
        }

        if (!formData.category) {
          setCategoryError("Category is required");
          toast.error("Category is required");
          hasErrors = true;
        }

        if (!formData.subcategory) {
          setSubcategoryError("Subcategory is required");
          toast.error("Subcategory is required");
          hasErrors = true;
        }
        break;

      case 2:
        if (!formData.apparelDetails.size) {
          setSizeError("Size is required");
          toast.error("Size is required");
          hasErrors = true;
        }

        if (!formData.apparelDetails.color?.trim()) {
          setColorError("Color is required");
          toast.error("Color is required");
          hasErrors = true;
        }

        if (!formData.apparelDetails.material?.trim()) {
          setMaterialError("Material is required");
          toast.error("Material is required");
          hasErrors = true;
        }
        break;

      case 3:
        if (!formData.price || parseFloat(formData.price) <= 0) {
          setPriceError("Valid price is required");
          toast.error("Valid price is required");
          hasErrors = true;
        }

        if (!formData.quantity || parseInt(formData.quantity) <= 0) {
          setQuantityError("Valid quantity is required");
          toast.error("Valid quantity is required");
          hasErrors = true;
        }
        break;

      case 4:
        if (formData.images.length === 0) {
          setImagesError("At least one product image is required");
          toast.error("At least one product image is required");
          hasErrors = true;
        }
        break;
    }

    if (!hasErrors) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Calculate progress
  const getProgress = () => {
    let completed = 0;
    const total = 5;

    if (
      formData.name &&
      formData.description &&
      formData.category &&
      formData.subcategory
    )
      completed++;

    if (
      formData.apparelDetails.size &&
      formData.apparelDetails.color &&
      formData.apparelDetails.material
    )
      completed++;

    if (formData.price && formData.quantity) completed++;
    if (formData.images.length > 0) completed++;
    if (currentStep >= 5) completed++;

    return (completed / total) * 100;
  };

  // Submit form
  const handleSubmit = async () => {
    for (let step = 1; step <= totalSteps; step++) {
      if (step === 1 && !formData.name.trim()) {
        setCurrentStep(1);
        toast.error("Please complete all required fields");
        return;
      }
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("subcategory", formData.subcategory);
      formDataToSend.append("productType", formData.productType);
      if (formData.brand) formDataToSend.append("brand", formData.brand);

      formDataToSend.append(
        "apparelDetails",
        JSON.stringify({
          size: formData.apparelDetails.size,
          fit: formData.apparelDetails.fit || "Regular Fit",
          color: formData.apparelDetails.color,
          pattern: formData.apparelDetails.pattern || "Solid",
          material: formData.apparelDetails.material,
          fabricType: formData.apparelDetails.fabricType || "",
          fabricWeight: formData.apparelDetails.fabricWeight || "",
          careInstructions:
            formData.apparelDetails.careInstructions ||
            "Machine wash cold, tumble dry low",
          neckline: formData.apparelDetails.neckline || "Crew Neck",
          sleeveLength: formData.apparelDetails.sleeveLength || "Short Sleeve",
        })
      );

      formDataToSend.append("price", formData.price);
      if (formData.costPrice)
        formDataToSend.append("costPrice", formData.costPrice);
      formDataToSend.append("quantity", formData.quantity);
      formDataToSend.append("minStockLevel", formData.minStockLevel || "10");
      if (formData.sku) formDataToSend.append("sku", formData.sku);

      if (formData.weight) formDataToSend.append("weight", formData.weight);
      if (formData.dimensions)
        formDataToSend.append("dimensions", formData.dimensions);

      if (formData.tags.length > 0) {
        formData.tags.forEach((tag) => formDataToSend.append("tags[]", tag));
      }
      formDataToSend.append("season", formData.season);
      if (formData.countryOfOrigin)
        formDataToSend.append("countryOfOrigin", formData.countryOfOrigin);
      if (formData.manufacturer)
        formDataToSend.append("manufacturer", formData.manufacturer);

      formDataToSend.append("isFeatured", String(formData.isFeatured));
      formDataToSend.append("isNewArrival", String(formData.isNewArrival));
      formDataToSend.append("isBestseller", String(formData.isBestseller));

      formDataToSend.append("isSustainable", String(formData.isSustainable));
      if (formData.certifications.length > 0) {
        formData.certifications.forEach((cert) =>
          formDataToSend.append("certifications[]", cert)
        );
      }

      formDataToSend.append("freeShipping", String(formData.freeShipping));
      if (!formData.freeShipping && formData.shippingCost) {
        formDataToSend.append("shippingCost", formData.shippingCost);
      }

      formData.images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      const token =
        localStorage.getItem("chainvanguard_auth_token") ||
        localStorage.getItem("token");

      if (!token) {
        toast.error("Not authenticated. Please log in again.");
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/products`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToSend,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (data.success) {
        toast.success("Product created successfully!");
        setTimeout(() => {
          router.push("/vendor/my-products");
        }, 1000);
      } else {
        throw new Error(data.message || "Failed to create product");
      }
    } catch (error: any) {
      console.error("Product creation error:", error);
      toast.error(error.message || "Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderApparelDetails();
      case 3:
        return renderPricingInventory();
      case 4:
        return renderImages();
      case 5:
        return renderAdditionalDetails();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div>
        <Label
          htmlFor="name"
          className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <Package className="h-4 w-4" />
          Product Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => {
            updateFormData("name", e.target.value);
            if (nameError) setNameError("");
          }}
          placeholder="Enter product name"
          className={`!h-12 border ${
            nameError
              ? "border-red-500 dark:border-red-500"
              : "border-gray-200 dark:border-gray-700"
          } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm`}
        />
        {nameError && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
            <AlertTriangle className="h-3 w-3" />
            {nameError}
          </p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label
            htmlFor="description"
            className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Info className="h-4 w-4" />
            Description <span className="text-red-500">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">
            {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => {
            const value = e.target.value;
            if (value.length <= MAX_DESCRIPTION_LENGTH) {
              updateFormData("description", value);
              if (descriptionError) setDescriptionError("");
            }
          }}
          placeholder="Describe your product in detail"
          maxLength={MAX_DESCRIPTION_LENGTH}
          className={`min-h-[120px] border ${
            descriptionError
              ? "border-red-500 dark:border-red-500"
              : "border-gray-200 dark:border-gray-700"
          } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm`}
        />
        {descriptionError && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
            <AlertTriangle className="h-3 w-3" />
            {descriptionError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="category"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => {
              updateFormData("category", value);
              updateFormData("subcategory", "");
              updateFormData("apparelDetails.size", "");
              if (categoryError) setCategoryError("");
            }}
          >
            <SelectTrigger
              className={`w-full !h-12 border ${
                categoryError
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-200 dark:border-gray-700"
              } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50`}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {Object.keys(CATEGORIES).map((cat) => (
                <SelectItem key={cat} value={cat} className="cursor-pointer">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {categoryError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {categoryError}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="subcategory"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Subcategory <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.subcategory}
            onValueChange={(value) => {
              updateFormData("subcategory", value);
              if (subcategoryError) setSubcategoryError("");
            }}
            disabled={!formData.category}
          >
            <SelectTrigger
              className={`w-full !h-12 border ${
                subcategoryError
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-200 dark:border-gray-700"
              } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 ${
                !formData.category ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <SelectValue
                placeholder={
                  formData.category
                    ? "Select subcategory"
                    : "Select category first"
                }
              />
            </SelectTrigger>
            <SelectContent className="w-full">
              {formData.category &&
                CATEGORIES[formData.category as keyof typeof CATEGORIES]?.map(
                  (sub) => (
                    <SelectItem
                      key={sub}
                      value={sub}
                      className="cursor-pointer"
                    >
                      {sub}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
          {subcategoryError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {subcategoryError}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="productType"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Product Type
          </Label>
          <Select
            value={formData.productType}
            onValueChange={(value) => updateFormData("productType", value)}
          >
            <SelectTrigger className="w-full !h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {PRODUCT_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="cursor-pointer">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="brand"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Brand
          </Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => updateFormData("brand", e.target.value)}
            placeholder="Brand name (optional)"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Apparel Details
  const renderApparelDetails = () => (
    <div className="space-y-6">
      <div className="bg-blue-50/80 dark:bg-blue-950/30 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Required Information
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Size, Color, and Material are required fields for all apparel
              products
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label
            htmlFor="size"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Size <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.apparelDetails.size}
            onValueChange={(value) => {
              updateFormData("apparelDetails.size", value);
              if (sizeError) setSizeError("");
            }}
            disabled={!formData.category}
          >
            <SelectTrigger
              className={`w-full !h-12 border ${
                sizeError
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-200 dark:border-gray-700"
              } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 ${
                !formData.category ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <SelectValue
                placeholder={
                  formData.category ? "Select size" : "Select category first"
                }
              />
            </SelectTrigger>
            <SelectContent className="w-full">
              {formData.category &&
                CATEGORY_SIZES[
                  formData.category as keyof typeof CATEGORY_SIZES
                ]?.map((size) => (
                  <SelectItem
                    key={size}
                    value={size}
                    className="cursor-pointer"
                  >
                    {size}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {sizeError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {sizeError}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="fit"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Fit Type
          </Label>
          <Select
            value={formData.apparelDetails.fit}
            onValueChange={(value) =>
              updateFormData("apparelDetails.fit", value)
            }
          >
            <SelectTrigger className="w-full !h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {FIT_TYPES.map((fit) => (
                <SelectItem key={fit} value={fit} className="cursor-pointer">
                  {fit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="color"
            className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Palette className="h-4 w-4" />
            Color <span className="text-red-500">*</span>
          </Label>
          <Input
            id="color"
            value={formData.apparelDetails.color}
            onChange={(e) => {
              updateFormData("apparelDetails.color", e.target.value);
              if (colorError) setColorError("");
            }}
            placeholder="e.g., Navy Blue"
            className={`!h-12 border ${
              colorError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-200 dark:border-gray-700"
            } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm`}
          />
          {colorError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {colorError}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="material"
            className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Shirt className="h-4 w-4" />
            Material Composition <span className="text-red-500">*</span>
          </Label>
          <Input
            id="material"
            value={formData.apparelDetails.material}
            onChange={(e) => {
              updateFormData("apparelDetails.material", e.target.value);
              if (materialError) setMaterialError("");
            }}
            placeholder="e.g., 100% Cotton"
            className={`!h-12 border ${
              materialError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-200 dark:border-gray-700"
            } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm`}
          />
          {materialError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {materialError}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="pattern"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Pattern
          </Label>
          <Select
            value={formData.apparelDetails.pattern}
            onValueChange={(value) =>
              updateFormData("apparelDetails.pattern", value)
            }
          >
            <SelectTrigger className="w-full !h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {PATTERNS.map((pattern) => (
                <SelectItem
                  key={pattern}
                  value={pattern}
                  className="cursor-pointer"
                >
                  {pattern}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="fabricType"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Fabric Type
          </Label>
          <Select
            value={formData.apparelDetails.fabricType}
            onValueChange={(value) =>
              updateFormData("apparelDetails.fabricType", value)
            }
          >
            <SelectTrigger className="w-full !h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
              <SelectValue placeholder="Select fabric type" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {FABRIC_TYPES.map((fabric) => (
                <SelectItem
                  key={fabric}
                  value={fabric}
                  className="cursor-pointer"
                >
                  {fabric}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="fabricWeight"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Fabric Weight (GSM)
          </Label>
          <Input
            id="fabricWeight"
            value={formData.apparelDetails.fabricWeight}
            onChange={(e) =>
              updateFormData("apparelDetails.fabricWeight", e.target.value)
            }
            placeholder="e.g., 180 GSM"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="neckline"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Neckline
          </Label>
          <Select
            value={formData.apparelDetails.neckline}
            onValueChange={(value) =>
              updateFormData("apparelDetails.neckline", value)
            }
          >
            <SelectTrigger className="w-full !h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {NECKLINES.map((neckline) => (
                <SelectItem
                  key={neckline}
                  value={neckline}
                  className="cursor-pointer"
                >
                  {neckline}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="sleeveLength"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Sleeve Length
          </Label>
          <Select
            value={formData.apparelDetails.sleeveLength}
            onValueChange={(value) =>
              updateFormData("apparelDetails.sleeveLength", value)
            }
          >
            <SelectTrigger className="w-full !h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {SLEEVE_LENGTHS.map((sleeve) => (
                <SelectItem
                  key={sleeve}
                  value={sleeve}
                  className="cursor-pointer"
                >
                  {sleeve}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label
          htmlFor="careInstructions"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Care Instructions
        </Label>
        <Textarea
          id="careInstructions"
          value={formData.apparelDetails.careInstructions}
          onChange={(e) =>
            updateFormData("apparelDetails.careInstructions", e.target.value)
          }
          placeholder="e.g., Machine wash cold, tumble dry low"
          className="min-h-[80px] border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
        />
      </div>
    </div>
  );

  // Step 3: Pricing & Inventory
  const renderPricingInventory = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="price"
            className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <DollarSign className="h-4 w-4" />
            Selling Price <span className="text-red-500">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => {
              updateFormData("price", e.target.value);
              if (priceError) setPriceError("");
            }}
            placeholder="0.00"
            className={`!h-12 border ${
              priceError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-200 dark:border-gray-700"
            } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm`}
          />
          {priceError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {priceError}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="costPrice"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Cost Price
          </Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPrice}
            onChange={(e) => updateFormData("costPrice", e.target.value)}
            placeholder="0.00"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label
            htmlFor="quantity"
            className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Box className="h-4 w-4" />
            Quantity <span className="text-red-500">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={(e) => {
              updateFormData("quantity", e.target.value);
              if (quantityError) setQuantityError("");
            }}
            placeholder="0"
            className={`!h-12 border ${
              quantityError
                ? "border-red-500 dark:border-red-500"
                : "border-gray-200 dark:border-gray-700"
            } hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm`}
          />
          {quantityError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3 w-3" />
              {quantityError}
            </p>
          )}
        </div>

        <div>
          <Label
            htmlFor="minStockLevel"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Min Stock Level
          </Label>
          <Input
            id="minStockLevel"
            type="number"
            min="0"
            value={formData.minStockLevel}
            onChange={(e) => updateFormData("minStockLevel", e.target.value)}
            placeholder="10"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>

        <div>
          <Label
            htmlFor="sku"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            SKU
          </Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => updateFormData("sku", e.target.value)}
            placeholder="Auto-generated"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="weight"
            className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Ruler className="h-4 w-4" />
            Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            min="0"
            value={formData.weight}
            onChange={(e) => updateFormData("weight", e.target.value)}
            placeholder="0.00"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>

        <div>
          <Label
            htmlFor="dimensions"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Dimensions
          </Label>
          <Input
            id="dimensions"
            value={formData.dimensions}
            onChange={(e) => updateFormData("dimensions", e.target.value)}
            placeholder="e.g., 10 x 15 x 5 cm"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Shipping Options
        </h3>

        <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <div>
            <Label
              htmlFor="freeShipping"
              className="text-base font-medium text-gray-900 dark:text-gray-100"
            >
              Free Shipping
            </Label>
            <p className="text-sm text-muted-foreground">
              Offer free shipping for this product
            </p>
          </div>
          <Switch
            id="freeShipping"
            checked={formData.freeShipping}
            onCheckedChange={(checked: any) =>
              updateFormData("freeShipping", checked)
            }
          />
        </div>

        {!formData.freeShipping && (
          <div>
            <Label
              htmlFor="shippingCost"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Shipping Cost
            </Label>
            <Input
              id="shippingCost"
              type="number"
              step="0.01"
              min="0"
              value={formData.shippingCost}
              onChange={(e) => updateFormData("shippingCost", e.target.value)}
              placeholder="0.00"
              className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Step 4: Images
  const renderImages = () => (
    <div className="space-y-6">
      <div className="bg-yellow-50/80 dark:bg-yellow-950/30 backdrop-blur-sm border border-yellow-200/50 dark:border-yellow-800/30 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
              Image Requirements
            </p>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
              <li>At least 1 image required (maximum 5)</li>
              <li>Formats: JPG, PNG, WebP</li>
              <li>Max size: 10MB per image</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm cursor-pointer">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
            Upload Product Images
          </p>
          <p className="text-sm text-muted-foreground">
            Click to browse or drag and drop
          </p>
        </label>
      </div>

      {formData.imagePreviews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {formData.imagePreviews.map((preview, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
              {index === 0 && (
                <Badge className="absolute bottom-2 left-2 bg-blue-600">
                  Main Image
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {imagesError && (
        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          {imagesError}
        </p>
      )}
    </div>
  );

  // Step 5: Additional Details
  const renderAdditionalDetails = () => (
    <div className="space-y-6">
      <div>
        <Label
          htmlFor="tags"
          className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          <Tag className="h-4 w-4" />
          Tags
        </Label>
        <div className="flex gap-2">
          {/* Center the search icon if you use it here, otherwise ignore */}
          {/* If you use a search icon in the tag input, use: */}
          {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /> */}
          <Input
            id="tags"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTag())
            }
            placeholder="Add tags (press Enter)"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
          <button
            type="button"
            onClick={addTag}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1.5">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-2 hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label
            htmlFor="season"
            className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Calendar className="h-4 w-4" />
            Season
          </Label>
          <Select
            value={formData.season}
            onValueChange={(value) => updateFormData("season", value)}
          >
            <SelectTrigger className="w-full !h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {SEASONS.map((season) => (
                <SelectItem
                  key={season}
                  value={season}
                  className="cursor-pointer"
                >
                  {season}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label
            htmlFor="countryOfOrigin"
            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Country of Origin
          </Label>
          <Input
            id="countryOfOrigin"
            value={formData.countryOfOrigin}
            onChange={(e) => updateFormData("countryOfOrigin", e.target.value)}
            placeholder="e.g., Pakistan"
            className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>
      </div>

      <div>
        <Label
          htmlFor="manufacturer"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Manufacturer
        </Label>
        <Input
          id="manufacturer"
          value={formData.manufacturer}
          onChange={(e) => updateFormData("manufacturer", e.target.value)}
          placeholder="Manufacturer name"
          className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Product Features
        </h3>

        <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <div>
            <Label
              htmlFor="isFeatured"
              className="text-base font-medium text-gray-900 dark:text-gray-100"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Featured Product
              </div>
            </Label>
            <p className="text-sm text-muted-foreground">
              Highlight this product on homepage
            </p>
          </div>
          <Switch
            id="isFeatured"
            checked={formData.isFeatured}
            onCheckedChange={(checked: any) =>
              updateFormData("isFeatured", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <div>
            <Label
              htmlFor="isNewArrival"
              className="text-base font-medium text-gray-900 dark:text-gray-100"
            >
              New Arrival
            </Label>
            <p className="text-sm text-muted-foreground">Mark as new arrival</p>
          </div>
          <Switch
            id="isNewArrival"
            checked={formData.isNewArrival}
            onCheckedChange={(checked: any) =>
              updateFormData("isNewArrival", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50">
          <div>
            <Label
              htmlFor="isBestseller"
              className="text-base font-medium text-gray-900 dark:text-gray-100"
            >
              Bestseller
            </Label>
            <p className="text-sm text-muted-foreground">
              Mark as bestseller product
            </p>
          </div>
          <Switch
            id="isBestseller"
            checked={formData.isBestseller}
            onCheckedChange={(checked: any) =>
              updateFormData("isBestseller", checked)
            }
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-green-50/80 dark:bg-green-950/30 backdrop-blur-sm rounded-lg border border-green-200/50 dark:border-green-800/30">
          <div>
            <Label
              htmlFor="isSustainable"
              className="text-base font-medium text-gray-900 dark:text-gray-100"
            >
              Sustainable Product
            </Label>
            <p className="text-sm text-muted-foreground">
              Eco-friendly and sustainable
            </p>
          </div>
          <Switch
            id="isSustainable"
            checked={formData.isSustainable}
            onCheckedChange={(checked: any) =>
              updateFormData("isSustainable", checked)
            }
          />
        </div>
      </div>

      {formData.isSustainable && (
        <div>
          <Label
            htmlFor="certifications"
            className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <Info className="h-4 w-4" />
            Certifications
          </Label>
          <div className="flex gap-2">
            {/* Center the search icon if you use it here, otherwise ignore */}
            {/* <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /> */}
            <Input
              id="certifications"
              value={certificationInput}
              onChange={(e) => setCertificationInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCertification())
              }
              placeholder="Add certification (press Enter)"
              className="!h-12 border border-gray-200 dark:border-gray-700 hover:border-blue-300 focus:border-blue-500 transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
            />
            <button
              type="button"
              onClick={addCertification}
              className="flex items-center gap-2 px-4py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Add
            </button>
          </div>
          {formData.certifications.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.certifications.map((cert, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-green-100/80 dark:bg-green-900/30 backdrop-blur-sm"
                >
                  {cert}
                  <button
                    onClick={() => removeCertification(cert)}
                    className="ml-2 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950">
      {/* Animated Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-400/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-8 pb-8">
        <div
          className={`max-w-[1800px] mx-auto transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          }`}
        >
          {/* Header with Preview Toggle */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Add New Product
              </h1>
              <p className="text-muted-foreground">
                Create a new product listing for your blockchain marketplace
              </p>
            </div>

            {/* Toggle Preview Button - Desktop only */}
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="hidden lg:flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? "Hide" : "Show"} Preview
            </Button>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Form */}
            <div
              className={`${showPreview ? "lg:col-span-8" : "lg:col-span-12"}`}
            >
              {/* Progress Bar */}
              <Card className="mb-8 border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          Step {currentStep} of {totalSteps}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Math.round(getProgress())}% Complete
                      </span>
                    </div>

                    {/* Blue Progress Bar */}
                    <div className="relative h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getProgress()}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span
                        className={
                          currentStep >= 1 ? "text-blue-600 font-medium" : ""
                        }
                      >
                        Basic Info
                      </span>
                      <span
                        className={
                          currentStep >= 2 ? "text-blue-600 font-medium" : ""
                        }
                      >
                        Apparel
                      </span>
                      <span
                        className={
                          currentStep >= 3 ? "text-blue-600 font-medium" : ""
                        }
                      >
                        Pricing
                      </span>
                      <span
                        className={
                          currentStep >= 4 ? "text-blue-600 font-medium" : ""
                        }
                      >
                        Images
                      </span>
                      <span
                        className={
                          currentStep >= 5 ? "text-blue-600 font-medium" : ""
                        }
                      >
                        Additional
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Card */}
              <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    {currentStep === 1 && (
                      <>
                        <Package className="h-5 w-5" />
                        Basic Information
                      </>
                    )}
                    {currentStep === 2 && (
                      <>
                        <Shirt className="h-5 w-5" />
                        Apparel Details
                      </>
                    )}
                    {currentStep === 3 && (
                      <>
                        <DollarSign className="h-5 w-5" />
                        Pricing & Inventory
                      </>
                    )}
                    {currentStep === 4 && (
                      <>
                        <ImageIcon className="h-5 w-5" />
                        Product Images
                      </>
                    )}
                    {currentStep === 5 && (
                      <>
                        <Info className="h-5 w-5" />
                        Additional Details
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {currentStep === 1 &&
                      "Enter the basic information about your product"}
                    {currentStep === 2 &&
                      "Specify the apparel-specific details of your product"}
                    {currentStep === 3 &&
                      "Set pricing and manage inventory for your product"}
                    {currentStep === 4 &&
                      "Upload high-quality images of your product"}
                    {currentStep === 5 &&
                      "Add tags, features, and other details"}
                  </CardDescription>
                </CardHeader>
                <CardContent>{renderStepContent()}</CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 1 || isLoading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>

                {currentStep < totalSteps ? (
                  <button
                    onClick={handleNext}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-md bg-blue-600 hover:bg-blue-700 text-sm text-white font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-md bg-green-600 hover:bg-green-700 text-sm text-white font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Create Product
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Live Preview (Desktop only) */}
            {showPreview && (
              <div className="hidden lg:block lg:col-span-4">
                <div className="sticky top-8">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <Eye className="h-5 w-5 text-blue-600" />
                      Live Preview
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      See how your product card will look
                    </p>
                  </div>

                  <ProductCard
                    id="preview"
                    name={formData.name || "Product Name"}
                    description={
                      formData.description ||
                      "Product description will appear here..."
                    }
                    price={parseFloat(formData.price) || 0}
                    costPrice={parseFloat(formData.costPrice) || undefined}
                    images={
                      formData.imagePreviews.length > 0
                        ? formData.imagePreviews
                        : ["/placeholder-product.png"]
                    }
                    category={formData.category || "Category"}
                    subcategory={formData.subcategory}
                    brand={formData.brand}
                    inStock={true}
                    quantity={parseInt(formData.quantity) || 0}
                    isFeatured={formData.isFeatured}
                    isNewArrival={formData.isNewArrival}
                    isBestseller={formData.isBestseller}
                    isSustainable={formData.isSustainable}
                    freeShipping={formData.freeShipping}
                    size={formData.apparelDetails.size}
                    color={formData.apparelDetails.color}
                    fit={formData.apparelDetails.fit}
                    material={formData.apparelDetails.material}
                    sku={formData.sku}
                    manufacturer={formData.manufacturer}
                    countryOfOrigin={formData.countryOfOrigin}
                    certifications={formData.certifications}
                    showActions={false}
                  />

                  {/* Preview Info Card */}
                  <Card className="mt-4 border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-950/20 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 dark:text-blue-300">
                          <p className="font-medium mb-1">Preview Tips:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Fill in product details to see live updates</li>
                            <li>Upload images to see how they display</li>
                            <li>Toggle features to see badge changes</li>
                            <li>This is how customers will see your product</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Preview Section */}
          <div className="lg:hidden mt-8">
            <Card className="border border-white/20 dark:border-gray-700/30 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Product Preview
                </CardTitle>
                <CardDescription>
                  See how your product card will look to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductCard
                  id="preview-mobile"
                  name={formData.name || "Product Name"}
                  description={
                    formData.description ||
                    "Product description will appear here..."
                  }
                  price={parseFloat(formData.price) || 0}
                  costPrice={parseFloat(formData.costPrice) || undefined}
                  images={
                    formData.imagePreviews.length > 0
                      ? formData.imagePreviews
                      : ["/placeholder-product.png"]
                  }
                  category={formData.category || "Category"}
                  subcategory={formData.subcategory}
                  brand={formData.brand}
                  inStock={true}
                  quantity={parseInt(formData.quantity) || 0}
                  isFeatured={formData.isFeatured}
                  isNewArrival={formData.isNewArrival}
                  isBestseller={formData.isBestseller}
                  isSustainable={formData.isSustainable}
                  freeShipping={formData.freeShipping}
                  size={formData.apparelDetails.size}
                  color={formData.apparelDetails.color}
                  showActions={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
