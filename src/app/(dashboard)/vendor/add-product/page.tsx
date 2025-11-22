/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useMemo } from "react";
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
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowUpTrayIcon,
  SparklesIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  CubeIcon,
  CameraIcon,
  DocumentTextIcon,
  SwatchIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  PencilSquareIcon,
  BookmarkIcon,
  PlusIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { colors, badgeColors } from "@/lib/colorConstants";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { aiApi } from "@/lib/api/ai.api";
import {
  CATEGORIES,
  PRODUCT_TYPES,
  getSizesForProduct,
  getFabricTypes,
  hasNeckline,
  hasSleeves,
  needsSize,
  categoryCodes,
  subcategoryCodes,
  FIT_TYPES,
  PATTERNS,
  NECKLINES,
  SLEEVE_LENGTHS,
  SEASONS,
} from "@/lib/categories.constants";

const RsIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    className="h-5 w-5"
  >
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="8"
      fontWeight="600"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="0.2"
      fontFamily="Arial, sans-serif"
    >
      Rs
    </text>
    <path
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
    />
  </svg>
);

const MAX_DESCRIPTION_LENGTH = 5000;

// Add this constant for consistent spacing
const FORM_SPACING = "space-y-4 md:space-y-2";
const SECTION_MARGIN = "mb-4 md:mb-6";
const NAVIGATION_MARGIN = "mt-6";
const GRID_GAP = "gap-4";
const CONTAINER_PADDING = "p-4 md:p-6";
const FIELD_GAP = "gap-6";
const LABEL_MARGIN = "mb-1";
const ERROR_MARGIN = "mt-1";
const HEADER_GAP = "gap-3";

interface ProductCardProps {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  images: string[];
  category: string;
  subcategory?: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  quantity?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  isSustainable?: boolean;
  freeShipping?: boolean;
  discount?: number;
  size?: string;
  color?: string;
  fit?: string;
  material?: string;
  pattern?: string;
  sku?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  certifications?: string[];
  onAddToCart?: (id: string) => void;
  onToggleWishlist?: (id: string) => void;
  isInWishlist?: boolean;
  variant?: "default" | "compact" | "detailed";
  showActions?: boolean;
  href?: string;
}

function ProductCard({
  id,
  name,
  price,
  costPrice,
  images,
  color,
  quantity = 0,
  inStock = true,
  onAddToCart,
  onToggleWishlist,
  isInWishlist = false,
  showActions = true,
  href,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex(0);
    setImageKey((prev) => prev + 1);
  }, [images]);

  const isOutOfStock = !inStock || quantity === 0;

  const handleMouseEnter = () => {
    if (images && images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const getImageSrc = () => {
    if (!images || images.length === 0 || imageError) {
      return "/placeholder-product.png";
    }
    const imageUrl = images[currentImageIndex];
    if (!imageUrl || typeof imageUrl !== "string") {
      return "/placeholder-product.png";
    }
    return imageUrl;
  };

  const PlaceholderImage = () => (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 flex items-center justify-center">
      <CubeIcon className="h-16 w-16 text-gray-400" />
    </div>
  );

  return (
    <div className="group relative w-full">
      {/* Image Container */}
      <div className="relative bg-gray-100 w-full">
        <a href={href || `/products/${id}`} className="block">
          <div
            className="relative w-full aspect-[3/4] overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!imageError && images && images.length > 0 ? (
              <img
                key={`${imageKey}-${currentImageIndex}`}
                src={getImageSrc()}
                alt={name}
                className={`w-full h-full object-cover transition-opacity duration-300 group-hover:scale-105 transition-transform duration-500 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => {
                  setImageLoaded(true);
                  setImageError(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageLoaded(false);
                }}
              />
            ) : (
              <PlaceholderImage />
            )}

            {!imageLoaded && !imageError && images && images.length > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
            )}

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="text-xs font-medium text-gray-900 uppercase tracking-wider">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
        </a>

        {/* Plus Button - Bottom Left */}
        {showActions && !isOutOfStock && (
          <button
            className="absolute bottom-3 left-3 w-5 h-5 bg-white flex items-center justify-center opacity-100 transition-opacity duration-200 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(id);
            }}
          >
            <PlusIcon className="w-4 h-4 text-black" />
          </button>
        )}

        {/* Heart Button - Moved inline with product name */}
      </div>

      {/* Content Below Image */}
      <div className="pt-2 pb-4">
        {/* Product Name */}
        <div className="flex items-center justify-between mb-1">
          <a href={href || `/products/${id}`} className="block flex-1">
            <h3 className="text-sm font-normal text-gray-900 dark:text-white uppercase tracking-wide hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              {name}
            </h3>
          </a>
          {showActions && (
            <button
              className="flex items-center justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleWishlist?.(id);
              }}
            >
              <BookmarkIcon
                className={`w-4 h-4 transition-colors cursor-pointer ${
                  isInWishlist
                    ? "fill-black text-black"
                    : "text-gray-400 hover:text-black"
                }`}
              />
            </button>
          )}
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-normal text-gray-900 dark:text-white">
            Rs {price.toFixed(2)}
          </span>
          {costPrice && costPrice > price && (
            <span className="text-xs text-gray-400 line-through">
              Rs {costPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

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
    sku: "",
    apparelDetails: {
      size: "",
      fit: "Regular Fit",
      color: "",
      pattern: "Solid",
      material: "",
      fabricType: "",
      fabricWeight: "",
      careInstructions: "",
      neckline: "Crew Neck",
      sleeveLength: "Short Sleeve",
    },
    price: "",
    costPrice: "",
    quantity: "",
    minStockLevel: "20",
    weight: "",
    dimensions: "",
    season: "All Season",
    countryOfOrigin: "Pakistan",
    manufacturer: "",
    tags: [] as string[],
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
  const [productTypeError, setProductTypeError] = useState("");
  const [fitError, setFitError] = useState("");
  const [patternError, setPatternError] = useState("");
  const [necklineError, setNecklineError] = useState("");
  const [sleeveLengthError, setSleeveLengthError] = useState("");
  const [fabricTypeError, setFabricTypeError] = useState("");
  const [countryOfOriginError, setCountryOfOriginError] = useState("");
  const [manufacturerError, setManufacturerError] = useState("");
  const [costPriceError, setCostPriceError] = useState("");
  const [minStockLevelError, setMinStockLevelError] = useState("");
  const [seasonError, setSeasonError] = useState("");

  const [tagInput, setTagInput] = useState("");
  const [certificationInput, setCertificationInput] = useState("");

  const totalSteps = 6;

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

  // Handle category change to auto-generate SKU
  const handleCategoryChange = (value: string) => {
    updateFormData("category", value);
    updateFormData("subcategory", "");
    updateFormData("apparelDetails.size", "");
  };

  const generateDescriptionWithAI = async () => {
    if (!formData.name || !formData.category) {
      toast.error("Please fill in product name and category first");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const result = await aiApi.generateProductDescription({
        name: formData.name,
        category: formData.category,
        subcategory: formData.subcategory,
        materials: formData.apparelDetails.material
          ? [formData.apparelDetails.material]
          : undefined,
        features: formData.tags.length > 0 ? formData.tags : undefined,
        color: formData.apparelDetails.color,
        brand: formData.brand,
        specifications: {
          size: formData.apparelDetails.size,
          fit: formData.apparelDetails.fit,
          pattern: formData.apparelDetails.pattern,
          neckline: formData.apparelDetails.neckline,
          sleeveLength: formData.apparelDetails.sleeveLength,
        },
      });

      updateFormData("description", result.description);
      toast.success("Description generated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to generate description");
    } finally {
      setIsGeneratingDescription(false);
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
    setProductTypeError("");
    setFitError("");
    setPatternError("");
    setNecklineError("");
    setSleeveLengthError("");
    setFabricTypeError("");
    setCountryOfOriginError("");
    setManufacturerError("");
    setCostPriceError("");
    setMinStockLevelError("");
    setSeasonError("");

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
        if (!formData.productType) {
          setProductTypeError("Product type is required");
          toast.error("Product type is required");
          hasErrors = true;
        }
        break;
      case 2:
        if (!formData.apparelDetails.size) {
          setSizeError("Size is required");
          toast.error("Size is required");
          hasErrors = true;
        }
        if (!formData.apparelDetails.fit) {
          setFitError("Fit type is required");
          toast.error("Fit type is required");
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
        if (!formData.apparelDetails.pattern) {
          setPatternError("Pattern is required");
          toast.error("Pattern is required");
          hasErrors = true;
        }
        if (!formData.apparelDetails.neckline) {
          setNecklineError("Neckline is required");
          toast.error("Neckline is required");
          hasErrors = true;
        }
        if (!formData.apparelDetails.sleeveLength) {
          setSleeveLengthError("Sleeve length is required");
          toast.error("Sleeve length is required");
          hasErrors = true;
        }
        break;
      case 3:
        if (!formData.apparelDetails.fabricType) {
          setFabricTypeError("Fabric type is required");
          toast.error("Fabric type is required");
          hasErrors = true;
        }
        if (!formData.countryOfOrigin.trim()) {
          setCountryOfOriginError("Country of origin is required");
          toast.error("Country of origin is required");
          hasErrors = true;
        }
        if (!formData.manufacturer.trim()) {
          setManufacturerError("Manufacturer is required");
          toast.error("Manufacturer is required");
          hasErrors = true;
        }
        break;
      case 4:
        if (!formData.price || parseFloat(formData.price) <= 0) {
          setPriceError("Valid price is required");
          toast.error("Valid price is required");
          hasErrors = true;
        }
        if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
          setCostPriceError("Valid cost price is required");
          toast.error("Valid cost price is required");
          hasErrors = true;
        }
        if (!formData.quantity || parseInt(formData.quantity) <= 0) {
          setQuantityError("Valid quantity is required");
          toast.error("Valid quantity is required");
          hasErrors = true;
        }
        if (!formData.minStockLevel || parseInt(formData.minStockLevel) < 0) {
          setMinStockLevelError("Valid min stock level is required");
          toast.error("Valid min stock level is required");
          hasErrors = true;
        }
        break;
      case 5:
        if (!formData.description.trim()) {
          setDescriptionError("Description is required");
          toast.error("Description is required");
          hasErrors = true;
        } else if (formData.description.length < 10) {
          setDescriptionError("Description must be at least 10 characters");
          toast.error("Description must be at least 10 characters");
          hasErrors = true;
        }
        if (!formData.season) {
          setSeasonError("Season is required");
          toast.error("Season is required");
          hasErrors = true;
        }
        break;
      case 6:
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

  // Calculate progress based on currentStep and totalSteps
  const getProgress = () => {
    return (currentStep / totalSteps) * 100;
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
        router.push("/vendor/my-products");
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

  // Add useEffect to pre-fill manufacturer with user's full name
  useEffect(() => {
    if (user && user.name) {
      updateFormData("manufacturer", user.name);
    }
  }, [user]);

  // Add useEffect for SKU generation similar to add-inventory
  useEffect(() => {
    let sku = "";
    if (formData.category) sku += categoryCodes[formData.category] + "-";
    if (formData.subcategory)
      sku += subcategoryCodes[formData.subcategory] + "-";
    if (formData.category && formData.subcategory) {
      const randomId = Date.now().toString(36).toUpperCase().substring(0, 6);
      sku = sku.slice(0, -1) + "-" + randomId;
    }
    setFormData((prev) => ({ ...prev, sku }));
  }, [formData.category, formData.subcategory]);

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Item name is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (!formData.subcategory)
        newErrors.subcategory = "Subcategory is required";
      if (!formData.productType)
        newErrors.productType = "Product type is required";
    } else if (step === 2) {
      // Only validate size for items that need it
      if (
        formData.subcategory &&
        needsSize(formData.subcategory) &&
        !formData.apparelDetails.size
      ) {
        newErrors.size = "Size is required";
      }
      // Only validate fit for items that need size
      if (
        formData.subcategory &&
        needsSize(formData.subcategory) &&
        !formData.apparelDetails.fit
      ) {
        newErrors.fit = "Fit type is required";
      }
      if (!formData.apparelDetails.color?.trim())
        newErrors.color = "Color is required";
      if (!formData.apparelDetails.material?.trim())
        newErrors.material = "Material is required";
      if (!formData.apparelDetails.pattern)
        newErrors.pattern = "Pattern is required";
      // Only validate neckline for items that have necklines
      if (
        formData.subcategory &&
        hasNeckline(formData.subcategory) &&
        !formData.apparelDetails.neckline
      ) {
        newErrors.neckline = "Neckline is required";
      }
      // Only validate sleeve length for items that have sleeves
      if (
        formData.subcategory &&
        hasSleeves(formData.subcategory) &&
        !formData.apparelDetails.sleeveLength
      ) {
        newErrors.sleeveLength = "Sleeve length is required";
      }
    } else if (step === 3) {
      if (!formData.apparelDetails.fabricType)
        newErrors.fabricType = "Fabric type is required";
      if (!formData.countryOfOrigin.trim())
        newErrors.countryOfOrigin = "Country of origin is required";
      if (!formData.manufacturer.trim())
        newErrors.manufacturer = "Manufacturer is required";
    } else if (step === 4) {
      if (!formData.price || parseFloat(formData.price) <= 0)
        newErrors.price = "Valid price is required";
      if (!formData.costPrice || parseFloat(formData.costPrice) <= 0)
        newErrors.costPrice = "Valid cost price is required";
      if (!formData.quantity || parseInt(formData.quantity) <= 0)
        newErrors.quantity = "Valid quantity is required";
      if (!formData.minStockLevel || parseInt(formData.minStockLevel) < 0)
        newErrors.minStockLevel = "Valid min stock level is required";
    } else if (step === 5) {
      if (!formData.description.trim())
        newErrors.description = "Description is required";
      else if (formData.description.length < 10)
        newErrors.description = "Description must be at least 10 characters";
      if (!formData.season) newErrors.season = "Season is required";
    } else if (step === 6) {
      if (formData.images.length === 0)
        newErrors.images = "At least one product image is required";
    }

    return newErrors;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderApparelDetails();
      case 3:
        return renderFabricManufacturing();
      case 4:
        return renderPricingInventory();
      case 5:
        return renderDescriptionFeatures();
      case 6:
        return renderImages();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderBasicInfo = () => (
    <div className={`${FORM_SPACING} gap-6`}>
      <div>
        <Label
          htmlFor="name"
          className={`${LABEL_MARGIN} text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
        >
          Product Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => {
            updateFormData("name", e.target.value);
            if (nameError) setNameError("");
          }}
          placeholder="e.g., Premium Cotton Shirt"
          className={`text-sm h-9 md:h-10 ${colors.inputs.base.replace(
            /hover:border-blue-300|focus:border-blue-500|border-blue-300|border-blue-500/g,
            "hover:border-gray-400 focus:border-gray-400 border-gray-400"
          )} ${colors.inputs.focus} rounded-none`}
        />
        <div className={`min-h-4 ${ERROR_MARGIN}`}>
          {nameError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {nameError}
            </p>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="category"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={handleCategoryChange}
          >
            <SelectTrigger
              className={`text-sm h-9 md:h-10 w-full rounded-none ${colors.inputs.base.replace(
                /hover:border-blue-300|focus:border-blue-500|border-blue-300|border-blue-500/g,
                "hover:border-gray-400 focus:border-gray-400 border-gray-400"
              )} ${colors.inputs.focus}`}
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {Object.keys(CATEGORIES).map((cat) => (
                <SelectItem key={cat} value={cat} className="text-sm">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {categoryError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {categoryError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="subcategory"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
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
              className={`text-sm h-9 md:h-10 w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 ${
                productTypeError ? "border-red-500" : ""
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
                  (sub: string) => (
                    <SelectItem key={sub} value={sub} className="text-sm">
                      {sub}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {subcategoryError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {subcategoryError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="sku"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            SKU (Auto-generated)
          </Label>
          <Input
            id="sku"
            value={formData.sku}
            placeholder="Auto-generated"
            readOnly
            className="text-sm h-9 md:h-10 rounded-none border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
          />
        </div>

        <div>
          <Label
            htmlFor="productType"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Product Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.productType}
            onValueChange={(value) => {
              updateFormData("productType", value);
              if (productTypeError) setProductTypeError("");
            }}
          >
            <SelectTrigger
              className={`text-sm h-9 md:h-10 w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 ${
                productTypeError ? "border-red-500" : ""
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {formData.category &&
                PRODUCT_TYPES[
                  formData.category as keyof typeof PRODUCT_TYPES
                ]?.map((type: string) => (
                  <SelectItem key={type} value={type} className="text-sm">
                    {type}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {productTypeError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {productTypeError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <Label
          htmlFor="brand"
          className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
        >
          Brand
        </Label>
        <Input
          id="brand"
          value={formData.brand}
          onChange={(e) => updateFormData("brand", e.target.value)}
          placeholder="Brand name (optional)"
          className="text-sm h-9 md:h-10 rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50"
        />
      </div>
    </div>
  );

  // Step 2: Apparel Details
  const renderApparelDetails = () => (
    <div className={`${FORM_SPACING} gap-6`}>
      <div className="bg-gray-50/80 dark:bg-gray-900/30 backdrop-blur-sm border-none rounded-none p-4">
        <div className="flex items-start gap-2">
          <InformationCircleIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Required Information
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Size, Fit, Color, Material, Pattern, Neckline, and Sleeve Length
              are required fields for all apparel products
            </p>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        {formData.subcategory && needsSize(formData.subcategory) && (
          <div>
            <Label
              htmlFor="size"
              className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
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
                className={`text-sm h-9 md:h-10 w-full rounded-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all ${
                  sizeError ? "border-red-500" : ""
                } ${!formData.category ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <SelectValue
                  placeholder={
                    !formData.category
                      ? "Select category first"
                      : !formData.subcategory
                        ? "Select subcategory first"
                        : "Select size"
                  }
                />
              </SelectTrigger>
              <SelectContent className="w-full max-h-60 overflow-y-auto">
                {formData.category &&
                  formData.subcategory &&
                  getSizesForProduct(
                    formData.category,
                    formData.subcategory
                  )?.map((size: string) => (
                    <SelectItem
                      key={size}
                      value={size}
                      className="text-sm h-9 md:h-10"
                    >
                      {size}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className={`min-h-4 ${ERROR_MARGIN}`}>
              {sizeError && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  {sizeError}
                </p>
              )}
            </div>
          </div>
        )}

        {formData.subcategory && needsSize(formData.subcategory) && (
          <div>
            <Label
              htmlFor="fit"
              className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
            >
              Fit Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.apparelDetails.fit}
              onValueChange={(value) => {
                updateFormData("apparelDetails.fit", value);
                if (fitError) setFitError("");
              }}
            >
              <SelectTrigger
                className={`text-sm h-9 md:h-10 w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-900/50 ${
                  fitError ? "border-red-500" : ""
                }`}
              >
                <SelectValue placeholder="Select fit type" />
              </SelectTrigger>
              <SelectContent className="w-full">
                {formData.category &&
                  FIT_TYPES[formData.category as keyof typeof FIT_TYPES]?.map(
                    (fit: string) => (
                      <SelectItem key={fit} value={fit} className="text-sm">
                        {fit}
                      </SelectItem>
                    )
                  )}
              </SelectContent>
            </Select>
            <div className={`min-h-4 ${ERROR_MARGIN}`}>
              {fitError && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  {fitError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label
          htmlFor="color"
          className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
        >
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
          className={`text-sm h-9 md:h-10 rounded-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all ${
            colorError ? "border-red-500" : ""
          }`}
        />
        <div className={`min-h-4 ${ERROR_MARGIN}`}>
          {colorError && (
            <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {colorError}
            </p>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="material"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
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
            className={`text-sm h-9 md:h-10 rounded-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all ${
              materialError ? "border-red-500" : ""
            }`}
          />
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {materialError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {materialError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="pattern"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Pattern <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.apparelDetails.pattern}
            onValueChange={(value) => {
              updateFormData("apparelDetails.pattern", value);
              if (patternError) setPatternError("");
            }}
          >
            <SelectTrigger
              className={`text-sm h-9 md:h-10 w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-900/50 ${
                patternError ? "border-red-500" : ""
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {formData.category &&
                PATTERNS[formData.category as keyof typeof PATTERNS]?.map(
                  (pattern: string) => (
                    <SelectItem
                      key={pattern}
                      value={pattern}
                      className="text-sm"
                    >
                      {pattern}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {patternError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {patternError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        {formData.subcategory && hasNeckline(formData.subcategory) && (
          <div>
            <Label
              htmlFor="neckline"
              className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
            >
              Neckline <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.apparelDetails.neckline}
              onValueChange={(value) => {
                updateFormData("apparelDetails.neckline", value);
                if (necklineError) setNecklineError("");
              }}
            >
              <SelectTrigger
                className={`text-sm h-9 md:h-10 w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-900/50 ${
                  necklineError ? "border-red-500" : ""
                }`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-full">
                {NECKLINES.map((neckline: string) => (
                  <SelectItem
                    key={neckline}
                    value={neckline}
                    className="text-sm"
                  >
                    {neckline}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className={`min-h-4 ${ERROR_MARGIN}`}>
              {necklineError && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  {necklineError}
                </p>
              )}
            </div>
          </div>
        )}

        {formData.subcategory && hasSleeves(formData.subcategory) && (
          <div>
            <Label
              htmlFor="sleeveLength"
              className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
            >
              Sleeve Length <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.apparelDetails.sleeveLength}
              onValueChange={(value) => {
                updateFormData("apparelDetails.sleeveLength", value);
                if (sleeveLengthError) setSleeveLengthError("");
              }}
            >
              <SelectTrigger
                className={`text-sm h-9 md:h-10 w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-900/50 ${
                  sleeveLengthError ? "border-red-500" : ""
                }`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="w-full">
                {SLEEVE_LENGTHS.map((sleeve: string) => (
                  <SelectItem key={sleeve} value={sleeve} className="text-sm">
                    {sleeve}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className={`min-h-4 ${ERROR_MARGIN}`}>
              {sleeveLengthError && (
                <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <ExclamationTriangleIcon className="h-3 w-3" />
                  {sleeveLengthError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div>
        <Label
          htmlFor="careInstructions"
          className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
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
          className="min-h-[80px] text-sm h-20 md:h-24 rounded-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all"
        />
      </div>
    </div>
  );

  // Step 3: Fabric & Manufacturing
  const renderFabricManufacturing = () => (
    <div className={`${FORM_SPACING} gap-6`}>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="fabricType"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Fabric Type <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.apparelDetails.fabricType}
            onValueChange={(value) => {
              updateFormData("apparelDetails.fabricType", value);
              if (fabricTypeError) setFabricTypeError("");
            }}
          >
            <SelectTrigger
              className={`text-sm h-9 md:h-10 w-full rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-900/50 ${
                fabricTypeError ? "border-red-500" : ""
              }`}
            >
              <SelectValue placeholder="Select fabric type" />
            </SelectTrigger>
            <SelectContent className="w-full">
              {formData.category &&
                formData.subcategory &&
                getFabricTypes(formData.category, formData.subcategory)?.map(
                  (fabric: string) => (
                    <SelectItem key={fabric} value={fabric} className="text-sm">
                      {fabric}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {fabricTypeError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {fabricTypeError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="fabricWeight"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
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
            className="text-sm h-9 md:h-10 rounded-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all"
          />
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="countryOfOrigin"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Country of Origin <span className="text-red-500">*</span>
          </Label>
          <Input
            id="countryOfOrigin"
            value={formData.countryOfOrigin}
            onChange={(e) => {
              updateFormData("countryOfOrigin", e.target.value);
              if (countryOfOriginError) setCountryOfOriginError("");
            }}
            placeholder="e.g., Pakistan"
            className={`!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm ${
              countryOfOriginError ? "border-red-500" : ""
            }`}
          />
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {countryOfOriginError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {countryOfOriginError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="manufacturer"
            className={`${LABEL_MARGIN} block text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Manufacturer <span className="text-red-500">*</span>
          </Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) => {
              updateFormData("manufacturer", e.target.value);
              if (manufacturerError) setManufacturerError("");
            }}
            placeholder="Your full name"
            className={`!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm ${
              manufacturerError ? "border-red-500" : ""
            }`}
          />
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {manufacturerError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {manufacturerError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="weight"
            className={`${LABEL_MARGIN} text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
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
            className="!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>

        <div>
          <Label
            htmlFor="dimensions"
            className={`${LABEL_MARGIN} block text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Dimensions
          </Label>
          <Input
            id="dimensions"
            value={formData.dimensions}
            onChange={(e) => updateFormData("dimensions", e.target.value)}
            placeholder="e.g., 10 x 15 x 5 cm"
            className="!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
          />
        </div>
      </div>
    </div>
  );

  // Step 4: Stock & Pricing
  const renderPricingInventory = () => (
    <div className={`${FORM_SPACING} gap-6`}>
      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="price"
            className={`${LABEL_MARGIN} text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
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
            className={`!h-12 ${colors.inputs.base.replace(
              /hover:border-blue-300|focus:border-blue-500|border-blue-300|border-blue-500/g,
              "hover:border-gray-400 focus:border-gray-400 border-gray-400"
            )} ${colors.inputs.focus} text-sm`}
          />
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {priceError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {priceError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="costPrice"
            className={`${LABEL_MARGIN} block text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Cost Price <span className="text-red-500">*</span>
          </Label>
          <Input
            id="costPrice"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPrice}
            onChange={(e) => {
              updateFormData("costPrice", e.target.value);
              if (costPriceError) setCostPriceError("");
            }}
            placeholder="0.00"
            className={`!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm ${
              costPriceError ? "border-red-500" : ""
            }`}
          />
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {costPriceError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {costPriceError}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="quantity"
            className={`${LABEL_MARGIN} text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
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
            className={`!h-12 ${colors.inputs.base.replace(
              /hover:border-blue-300|focus:border-blue-500|border-blue-300|border-blue-500/g,
              "hover:border-gray-400 focus:border-gray-400 border-gray-400"
            )} ${colors.inputs.focus} text-sm`}
          />
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {quantityError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {quantityError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="minStockLevel"
            className={`${LABEL_MARGIN} block text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Min Stock Level <span className="text-red-500">*</span>
          </Label>
          <Input
            id="minStockLevel"
            type="number"
            min="0"
            value={formData.minStockLevel}
            onChange={(e) => {
              updateFormData("minStockLevel", e.target.value);
              if (minStockLevelError) setMinStockLevelError("");
            }}
            placeholder="10"
            className={`!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm ${
              minStockLevelError ? "border-red-500" : ""
            }`}
          />
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {minStockLevelError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {minStockLevelError}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Shipping Options
        </h3>

        <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-none border-none">
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
              className={`${LABEL_MARGIN} block text-sm font-medium text-gray-700 dark:text-gray-300`}
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
              className="!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );

  // Step 5: Description & Features
  const renderDescriptionFeatures = () => (
    <div className={`${FORM_SPACING} gap-6`}>
      <div>
        <Label
          htmlFor="description"
          className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Description <span className="text-red-500">*</span>
        </Label>
        <div className="relative group">
          <Textarea
            id="description"
            placeholder="Provide a detailed description of the product..."
            value={formData.description}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= MAX_DESCRIPTION_LENGTH) {
                updateFormData("description", value);
                if (descriptionError) setDescriptionError("");
              }
            }}
            maxLength={MAX_DESCRIPTION_LENGTH}
            rows={8}
            className={`text-sm resize-none bg-white dark:bg-gray-900 border rounded-none group-hover:border-black focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ${
              descriptionError
                ? "border-red-500"
                : "border-gray-200 dark:border-gray-700"
            }`}
          />
          <Button
            type="button"
            onClick={generateDescriptionWithAI}
            disabled={
              isGeneratingDescription || !formData.name || !formData.category
            }
            className="absolute top-1 right-1 h-8 px-2 bg-transparent text-gray-500 border-none rounded-none flex items-center gap-1 hover:text-black dark:hover:text-white hover:bg-transparent focus-visible:ring-0 active:bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingDescription ? (
              <>
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>
        <div className="flex justify-between items-center">
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {descriptionError ? (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {descriptionError}
              </p>
            ) : (
              <span />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {formData.description.length}/{MAX_DESCRIPTION_LENGTH} characters
          </p>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${FIELD_GAP}`}>
        <div>
          <Label
            htmlFor="season"
            className={`flex items-center gap-2 ${LABEL_MARGIN} text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Season <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.season}
            onValueChange={(value) => {
              updateFormData("season", value);
              if (seasonError) setSeasonError("");
            }}
          >
            <SelectTrigger
              className={`w-full !h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 ${
                seasonError ? "border-red-500" : ""
              }`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="w-full">
              {SEASONS.map((season: string) => (
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
          <div className={`min-h-4 ${ERROR_MARGIN}`}>
            {seasonError && (
              <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {seasonError}
              </p>
            )}
          </div>
        </div>

        <div>
          <Label
            htmlFor="tags"
            className={`flex items-center gap-2 ${LABEL_MARGIN} text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            Tags
          </Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              placeholder="Add tags (press Enter)"
              className="!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
            />
            <button
              type="button"
              onClick={addTag}
              className="flex items-center gap-2 px-4 py-2 rounded-none bg-gray-800 hover:bg-gray-700 text-sm text-white font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {formData.tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className={`${badgeColors.grey.bg} ${badgeColors.grey.border} ${badgeColors.grey.text} px-3 py-1.5 h-8 flex items-center rounded-none`}
                >
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 hover:text-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <Separator className="border-none" />

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
          Product Features
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-none border-none">
            <div>
              <Label
                htmlFor="isFeatured"
                className="text-base font-medium text-gray-900 dark:text-gray-100"
              >
                <div className="flex items-center gap-2">Featured Product</div>
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

          <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-none border-none">
            <div>
              <Label
                htmlFor="isNewArrival"
                className="text-base font-medium text-gray-900 dark:text-gray-100"
              >
                New Arrival
              </Label>
              <p className="text-sm text-muted-foreground">
                Mark as new arrival
              </p>
            </div>
            <Switch
              id="isNewArrival"
              checked={formData.isNewArrival}
              onCheckedChange={(checked: any) =>
                updateFormData("isNewArrival", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/80 dark:bg-gray-800/60 backdrop-blur-sm rounded-none border-none">
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

          <div className="flex items-center justify-between p-4 bg-green-50/80 dark:bg-green-950/30 backdrop-blur-sm rounded-none border-none">
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
      </div>

      {formData.isSustainable && (
        <div>
          <Label
            htmlFor="certifications"
            className={`flex items-center gap-2 ${LABEL_MARGIN} text-sm font-medium text-gray-700 dark:text-gray-300`}
          >
            <InformationCircleIcon className="h-4 w-4" />
            Certifications
          </Label>
          <div className="flex gap-2">
            <Input
              id="certifications"
              value={certificationInput}
              onChange={(e) => setCertificationInput(e.target.value)}
              onKeyPress={(e) =>
                e.key === "Enter" && (e.preventDefault(), addCertification())
              }
              placeholder="Add certification (press Enter)"
              className="!h-12 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black focus:border-black transition-all bg-white/50 dark:bg-gray-800/50 text-sm"
            />
            <button
              type="button"
              onClick={addCertification}
              className="flex items-center gap-2 px-4 py-2 rounded-none bg-gray-700 hover:bg-gray-800 text-sm text-white font-medium transition-colors cursor-pointer whitespace-nowrap"
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
                  className={`${badgeColors.green.bg} ${badgeColors.green.text} px-3 py-1.5 text-sm`}
                >
                  {cert}
                  <button
                    onClick={() => removeCertification(cert)}
                    className="ml-2 hover:text-red-600"
                  >
                    <TrashIcon className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Step 6: Images
  const renderImages = () => (
    <div className={`${FORM_SPACING} gap-6`}>
      <div className="bg-yellow-50/80 dark:bg-yellow-950/30 backdrop-blur-sm border-none rounded-none p-4">
        <div className="flex items-start gap-2">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
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

      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-none p-8 text-center hover:border-gray-500 dark:hover:border-gray-500 transition-colors bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm cursor-pointer">
        <input
          type="file"
          id="image-upload"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <ArrowUpTrayIcon className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
            Upload Product Images
          </p>
          <p className="text-sm text-muted-foreground">
            Click to browse or drag and drop
          </p>
        </label>
      </div>

      {formData.imagePreviews.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {formData.imagePreviews.map((preview, index) => (
            <div
              key={index}
              className="relative w-20 h-16 md:w-28 md:h-28 bg-gray-100 dark:bg-gray-800 rounded-none overflow-hidden group"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 rounded-none w-5 h-5 md:w-6 md:h-6 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-opacity"
              >
                <XMarkIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
              </button>
              {index === 0 && (
                <Badge className="absolute top-1 left-1 bg-blue-100/10 text-blue-700 text-xs rounded-none px-1 py-0 text-[10px]">
                  Main
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <div className={`min-h-4 ${ERROR_MARGIN}`}>
        {imagesError && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
            <ExclamationTriangleIcon className="h-3 w-3" />
            {imagesError}
          </p>
        )}
      </div>
    </div>
  );

  // Add this function to reset the form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      subcategory: "",
      productType: "Casual",
      brand: "",
      sku: "",
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
      weight: "",
      dimensions: "",
      season: "All Season",
      countryOfOrigin: "",
      manufacturer: "",
      tags: [],
      isFeatured: false,
      isNewArrival: false,
      isBestseller: false,
      isSustainable: false,
      certifications: [],
      freeShipping: false,
      shippingCost: "0",
      images: [],
      imagePreviews: [],
    });
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
    setTagInput("");
    setCertificationInput("");
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Memoize preview images to prevent blinking when typing
  const previewImages = useMemo(() => {
    return formData.imagePreviews.length > 0
      ? formData.imagePreviews
      : ["/placeholder-product.png"];
  }, [formData.imagePreviews]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-sm">
      {/* Breadcrumb - match add-inventory */}
      <div className={`relative z-10 ${CONTAINER_PADDING} font-sans text-sm`}>
        <Breadcrumb className={SECTION_MARGIN}>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/vendor">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Product</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div
          className={`max-w-[1800px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start transform transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
          } font-sans text-sm`}
        >
          {/* Left Column - Form Content */}
          <div
            className={`lg:col-span-12 ${showPreview ? "lg:mr-[308px]" : ""}`}
          >
            {/* Header with Preview Toggle and Reset Button */}
            <div
              className={`${SECTION_MARGIN} flex flex-col lg:flex-row items-start lg:items-center justify-between font-sans gap-4`}
            >
              <div className="space-y-2">
                <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                  Add Product
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                  Add new finished products to your marketplace
                </p>
                <div className={`flex items-center ${HEADER_GAP} mt-2`}>
                  <Badge
                    className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                  >
                    <CubeIcon
                      className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                    />
                    Product Management
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
              <div className={`flex flex-wrap items-center ${HEADER_GAP}`}>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  size="sm"
                  className={`items-center gap-2 rounded-none ${colors.buttons.outline} text-xs cursor-pointer h-8`}
                >
                  Reset
                </Button>
                <Button
                  onClick={() => setShowPreview(!showPreview)}
                  size="sm"
                  className={`hidden lg:flex items-center gap-2 px-6 py-3 rounded-none ${colors.buttons.primary} text-xs md:text-sm text-white hover:text-white font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8`}
                >
                  <EyeIcon className="h-4 w-4" />
                  {showPreview ? "Hide" : "Show"} Preview
                </Button>
              </div>
            </div>

            {/* Progress Bar - match add-inventory */}
            <Card
              className={`${SECTION_MARGIN} border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 rounded-none shadow-none`}
            >
              <CardContent className="px-4 md:px-6 py-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                    Step {currentStep} of {totalSteps}
                  </h3>
                  <span className="text-xs text-gray-500 dark:text-gray-500">
                    {Math.round(getProgress())}% Complete
                  </span>
                </div>
                <Progress
                  value={getProgress()}
                  className="h-2 mb-4 rounded-none"
                />
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { step: 1, title: "Basic Info", icon: DocumentTextIcon },
                    { step: 2, title: "Apparel Details", icon: SwatchIcon },
                    {
                      step: 3,
                      title: "Fabric & Manufacturing",
                      icon: Cog6ToothIcon,
                    },
                    {
                      step: 4,
                      title: "Stock & Pricing",
                      icon: CubeIcon,
                    },
                    {
                      step: 5,
                      title: "Description & Features",
                      icon: PencilSquareIcon,
                    },
                    { step: 6, title: "Media", icon: CameraIcon },
                  ].map(({ step, title, icon: Icon }) => {
                    const isSelected = step === currentStep;
                    const isCompleted = step < currentStep;
                    const canGoToNext =
                      step === currentStep + 1 &&
                      Object.keys(validateStep(currentStep)).length === 0;
                    const isDisabled = step > currentStep && !canGoToNext;

                    return (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          if (step < currentStep) {
                            // Can always go backwards
                            setCurrentStep(step);
                          } else if (step === currentStep + 1) {
                            // Can only go forward one step if current step is valid
                            const stepErrors = validateStep(currentStep);
                            if (Object.keys(stepErrors).length === 0) {
                              setCurrentStep(step);
                            }
                          }
                          // Otherwise, clicking does nothing (disabled state)
                        }}
                        disabled={isDisabled}
                        className={`flex items-center justify-center gap-1 md:gap-2 p-2 rounded-none text-xs md:text-sm font-medium transition-all cursor-pointer
          ${
            isSelected
              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
              : isCompleted
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                : isDisabled
                  ? "bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed"
                  : "bg-gray-50 dark:bg-gray-900 text-gray-500"
          }
          ${!isSelected && !isDisabled ? "border border-transparent hover:border-black dark:hover:border-white" : ""}
        `}
                        style={{
                          outline: "none",
                        }}
                      >
                        <Icon
                          className={`h-3 w-3 md:h-4 md:w-4 ${
                            isSelected
                              ? "text-white dark:text-gray-900"
                              : "text-gray-900 dark:text-gray-100"
                          }`}
                        />
                        <span className="text-xs font-medium hidden md:inline">
                          {title}
                        </span>
                        <span className="text-xs font-medium md:hidden">
                          {title.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Form Card */}
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-300 rounded-none shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                  {currentStep === 1 && <>Basic Information</>}
                  {currentStep === 2 && <>Apparel Details</>}
                  {currentStep === 3 && <>Fabric & Manufacturing</>}
                  {currentStep === 4 && <>Stock & Pricing</>}
                  {currentStep === 5 && <>Description & Features</>}
                  {currentStep === 6 && <>Product Images</>}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {currentStep === 1 &&
                    "Enter the core product identification details"}
                  {currentStep === 2 &&
                    "Specify size, fit, color and apparel-specific details"}
                  {currentStep === 3 &&
                    "Add fabric specifications and manufacturing information"}
                  {currentStep === 4 &&
                    "Set product prices and specify available stock levels"}
                  {currentStep === 5 &&
                    "Write the product description and highlight its key features"}
                  {currentStep === 6 &&
                    "Upload high-quality images of your product"}
                </CardDescription>
              </CardHeader>
              <CardContent>{renderStepContent()}</CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className={`flex justify-between ${NAVIGATION_MARGIN}`}>
              <Button
                onClick={handlePrevious}
                disabled={currentStep === 1 || isLoading}
                size="sm"
                className={`flex items-center gap-2 px-6 py-3 rounded-none ${colors.buttons.secondary} text-xs md:text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8`}
              >
                <ArrowLeftIcon className="h-4 w-4" />
                Previous
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  size="sm"
                  className={`flex items-center gap-2 px-6 py-3 rounded-none ${colors.buttons.primary} text-xs md:text-sm text-white font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8`}
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  size="sm"
                  className={`flex items-center gap-2 px-6 py-3 rounded-none ${colors.buttons.primary} text-xs md:text-sm text-white font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed h-8`}
                >
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      Create Product
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Live Preview (Desktop only) */}
          {showPreview && (
            <div className="fixed top-8 right-1 w-[280px]">
              <div className="">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <EyeIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                    Live Preview
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Product card preview
                  </p>
                </div>

                <div className="w-full">
                  <ProductCard
                    id="preview"
                    name={formData.name || "Product Name"}
                    description={
                      formData.description ||
                      "Product description will appear here..."
                    }
                    price={parseFloat(formData.price) || 0}
                    costPrice={parseFloat(formData.costPrice) || undefined}
                    images={previewImages}
                    category={formData.category || "Category"}
                    subcategory={formData.subcategory}
                    brand={formData.brand}
                    inStock={true}
                    quantity={parseInt(formData.quantity) || 1}
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
                    showActions={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Preview Section */}
      <div className="lg:hidden mt-8 font-sans text-sm">
        <Card className="border border-gray-200 dark:border-gray-700 rounded-none bg-white dark:bg-gray-900 backdrop-blur-xl shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-base">
              <EyeIcon className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              Product Preview
            </CardTitle>
            <CardDescription className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
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
              images={previewImages}
              category={formData.category || "Category"}
              subcategory={formData.subcategory}
              brand={formData.brand}
              inStock={true}
              quantity={parseInt(formData.quantity) || 1}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
