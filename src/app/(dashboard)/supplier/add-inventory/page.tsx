/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ArrowUpTrayIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
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
  CubeIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  PlusIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Loader2 } from "lucide-react";
import { useGeminiAI } from "@/hooks/use-gemini-ai";

import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { badgeColors, colors } from "@/lib/colorConstants";
import { createInventory } from "@/lib/api/inventory.api";
import { InventoryFormData } from "@/types";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const RsIcon = () => (
  <svg
    xmlns="http://www.w3.org/5000/svg"
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

const currencies = ["PKR"];

const warehouseLocations = [
  "Karachi Main Warehouse",
  "Lahore Warehouse",
  "Islamabad Warehouse",
  "Faisalabad Warehouse",
  "Sialkot Warehouse",
];

const suitableForOptions = [
  "Shirts",
  "T-Shirts",
  "Trousers",
  "Dresses",
  "Jackets",
  "Sportswear",
  "Formal Wear",
  "Casual Wear",
  "Kids Wear",
  "Home Textiles",
  "Upholstery",
];

const categoryCodes: { [key: string]: string } = {
  "Raw Material": "RM",
  Fabric: "FB",
  "Yarn & Thread": "YT",
  "Dyes & Chemicals": "DC",
  "Trims & Accessories": "TA",
  Packaging: "PK",
  "Semi-Finished": "SF",
  "Tools & Equipment": "TE",
};

const subcategoryCodes: { [key: string]: string } = {
  "Cotton Fabric": "CF",
  "Polyester Fabric": "PF",
  "Silk Fabric": "SF",
  "Wool Fabric": "WF",
  "Linen Fabric": "LF",
  "Denim Fabric": "DF",
  "Jersey Fabric": "JF",
  "Blended Fabric": "BF",
  "Cotton Yarn": "CY",
  "Polyester Yarn": "PY",
  "Sewing Thread": "ST",
  "Embroidery Thread": "ET",
  "Fabric Dye": "FD",
  Bleach: "BL",
  Softener: "SO",
  "Finishing Chemical": "FC",
  Buttons: "BT",
  Zippers: "ZP",
  Elastic: "EL",
  Lace: "LC",
  Ribbon: "RB",
  Labels: "LB",
  Tags: "TG",
  "Poly Bags": "PB",
  Hangers: "HG",
  Boxes: "BX",
  "Tissue Paper": "TP",
  "Cut Fabric": "CU",
  "Printed Fabric": "PR",
  "Dyed Fabric": "DY",
  "Stitched Panels": "SP",
  Scissors: "SC",
  Needles: "ND",
  "Measuring Tools": "MT",
  Other: "OT",
};

const materialTypeCodes: { [key: string]: string } = {
  "Raw Material": "RM",
  "Semi-Finished": "SF",
  "Finished Component": "FC",
  Accessory: "AC",
  Packaging: "PK",
  Tool: "TL",
  Consumable: "CN",
};

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
  // Basic
  name: string;
  description: string;
  category: string;
  subcategory: string;
  materialType: string;
  brand: "";

  // Textile Details
  textileDetails: {
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

  // Pricing
  pricePerUnit: string;
  costPrice: string;
  originalPrice: string;
  discount: string;
  currency: string; // ADD THIS

  // Stock
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

  // Physical
  weight: string;
  dimensions: string; // Will be converted to object

  // Metadata
  tags: string[];
  season: string;
  countryOfOrigin: string;
  manufacturer: string;

  // Supplier
  supplierName: string;
  companyName: string;
  supplierContact: {
    phone: string;
    email: string;
    address: string;
  };

  // Status & Quality
  status: string;
  isSustainable: boolean;
  certifications: string[];
  sustainabilityCertifications: string[];
  complianceStandards: string[];
  qualityGrade: string;

  // Delivery
  leadTime: string;
  estimatedDeliveryDays: string;
  shelfLife: string;

  // Images
  images: string[];
  imageFiles: File[]; // ADD THIS for actual files

  // Additional
  notes: string;
  internalCode: string;
  barcode: string;
  carbonFootprint: string;
  recycledContent: string;
  autoReorderEnabled: boolean;
  isBatchTracked: boolean;

  // Storage - ADD THESE
  warehouseLocation: string;
  storageLocations: Array<{
    warehouse: string;
    zone?: string;
    aisle?: string;
    rack?: string;
    bin?: string;
    quantityAtLocation: number;
  }>;

  // Specifications - ADD THIS
  specifications: {
    grade?: string;
    thickness?: string;
    density?: string;
    tensileStrength?: string;
    durability?: string;
    washability?: string;
    breathability?: string;
    stretchability?: string;
  };

  // Suitable For - ADD THIS
  suitableFor: string[];

  // ADD THESE:
  manufactureDate: string;
  expiryDate: string;
};

type ErrorsType = {
  [key: string]: string;
};

// Preview Card Component
const PreviewCard = ({ formData }: { formData: FormDataType }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImageIndex(0);
    setImageKey((prev) => prev + 1);
  }, [formData.images]);

  const isLowStock =
    parseInt(formData.quantity || "0") > 0 &&
    parseInt(formData.quantity || "0") < 20;

  const handleMouseEnter = () => {
    if (formData.images && formData.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setCurrentImageIndex(0);
  };

  const getImageSrc = () => {
    if (!formData.images || formData.images.length === 0 || imageError) {
      return "/placeholder-product.png";
    }
    const imageUrl = formData.images[currentImageIndex];
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
      <div className="relative bg-gray-100 w-full">
        <div className="block">
          <div
            className="relative w-full aspect-[4/5] overflow-hidden"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!imageError && formData.images && formData.images.length > 0 ? (
              <img
                key={`${imageKey}-${currentImageIndex}`}
                src={getImageSrc()}
                alt={formData.name || "Preview"}
                className={`w-full h-full object-cover transition-all duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                } group-hover:scale-105`}
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

            {!imageLoaded &&
              !imageError &&
              formData.images &&
              formData.images.length > 0 && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
              )}
          </div>
        </div>

        <button
          className="absolute bottom-3 left-3 w-5 h-5 bg-white flex items-center justify-center opacity-100 transition-opacity duration-200 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <PlusIcon className="w-4 h-4 text-black" />
        </button>
      </div>

      <div className="pt-3 pb-4">
        <div className="mb-2">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800">
            <BuildingStorefrontIcon className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {formData.companyName || "Company Name"}
            </span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {formData.name || "Item Name"}
            </h3>
          </div>
          <button
            className="flex items-center justify-center flex-shrink-0 mt-0.5"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <BookmarkIcon className="w-4 h-4 text-gray-400 hover:text-black transition-colors cursor-pointer" />
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          {formData.sku || "SKU"} • {formData.category || "Category"}
        </p>

        <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Rs {parseFloat(formData.pricePerUnit || "0").toFixed(2)}
            </span>
            <span className="text-xs text-gray-500">per {formData.unit}</span>
          </div>
          <div className="flex flex-col items-end">
            <span
              className={`text-xs font-medium ${
                isLowStock ? "text-yellow-600" : "text-gray-600"
              }`}
            >
              {formData.quantity || "0"} {formData.unit}
            </span>
            <span className="text-xs text-gray-500">available</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AddInventoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;
  const { isGenerating, generateInventoryDescription } = useGeminiAI();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const [formData, setFormData] = useState<FormDataType>({
    // Basic
    name: "",
    description: "",
    category: "",
    subcategory: "",
    materialType: "",
    brand: "",

    // Textile Details
    textileDetails: {
      fabricType: "",
      composition: "",
      gsm: "",
      width: "",
      fabricWeight: "",
      color: "",
      colorCode: "#000000",
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
    reservedQuantity: "",
    committedQuantity: "",
    damagedQuantity: "",
    minStockLevel: "10",
    reorderLevel: "20",
    reorderQuantity: "50",
    maximumQuantity: "",
    safetyStockLevel: "",
    unit: "pieces",
    sku: "",
    weight: "",
    dimensions: "",
    tags: [],
    season: "All Season",
    countryOfOrigin: "Pakistan",
    manufacturer: "",
    supplierName: "",
    companyName: "",
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
    shelfLife: "730",
    images: [],
    notes: "",
    internalCode: "",
    barcode: "",
    carbonFootprint: "",
    recycledContent: "",
    autoReorderEnabled: false,
    isBatchTracked: true,
    currency: "PKR",
    imageFiles: [],
    warehouseLocation: "",
    storageLocations: [],
    specifications: {},
    suitableFor: [],
    manufactureDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  // Add this useEffect to populate supplier fields with current user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        supplierName: user.name || prev.supplierName,
        companyName: user.companyName || prev.companyName,
        supplierContact: {
          ...prev.supplierContact,
          phone: user.phone || prev.supplierContact.phone,
          email: user.email || prev.supplierContact.email,
          // Address can be kept as is or populated if user has it
          address: user.address || prev.supplierContact.address,
        },
      }));
    }
  }, [user]);

  useEffect(() => {
    let sku = "";
    if (formData.category) sku += categoryCodes[formData.category] + "-";
    if (formData.subcategory)
      sku += subcategoryCodes[formData.subcategory] + "-";
    if (formData.materialType)
      sku += materialTypeCodes[formData.materialType] + "-";
    if (formData.category && formData.subcategory && formData.materialType) {
      const randomId = Date.now().toString(36).toUpperCase().substring(0, 6);
      sku = sku.slice(0, -1) + "-" + randomId;
    }
    setFormData((prev) => ({ ...prev, sku }));
  }, [formData.category, formData.subcategory, formData.materialType]);

  const [errors, setErrors] = useState<ErrorsType>({});
  const [tagInput, setTagInput] = useState<string>("");
  const [complianceInput, setComplianceInput] = useState<string>("");
  const [sustainabilityInput, setSustainabilityInput] = useState<string>("");

  const handleInputChange = (field: keyof FormDataType, value: any) => {
    let sanitizedValue = value;
    if (typeof value === "string") {
      // Sanitize number fields only if not empty
      if (
        value !== "" &&
        [
          "pricePerUnit",
          "costPrice",
          "quantity",
          "reorderLevel",
          "minStockLevel",
          "safetyStockLevel",
          "reservedQuantity",
          "committedQuantity",
          "damagedQuantity",
          "shelfLife",
        ].includes(field)
      ) {
        sanitizedValue = value.replace(/[^0-9.]/g, "");
        if (field === "pricePerUnit" || field === "costPrice") {
          // Allow one decimal point for prices
          const parts = sanitizedValue.split(".");
          if (parts.length > 2)
            sanitizedValue = parts[0] + "." + parts.slice(1).join("");
        } else {
          // Remove decimals for integers
          sanitizedValue = sanitizedValue.replace(/\./g, "");
        }
        // Ensure non-negative if not empty
        const num = parseFloat(sanitizedValue);
        if (isNaN(num) || num < 0) sanitizedValue = "0";
      }
    }
    setFormData((prev) => ({ ...prev, [field]: sanitizedValue }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    if (field === "pricePerUnit" || field === "costPrice") {
      const unitPrice =
        parseFloat(
          field === "pricePerUnit" ? sanitizedValue : formData.pricePerUnit
        ) || 0;
      const costPrice =
        parseFloat(
          field === "costPrice" ? sanitizedValue : formData.costPrice
        ) || 0;
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
    let sanitizedValue = value;
    if (value !== "" && (field === "gsm" || field === "width")) {
      sanitizedValue = value.replace(/[^0-9.]/g, "").replace(/\./g, ""); // Integers only
      const num = parseInt(sanitizedValue);
      if (isNaN(num) || num < 0) sanitizedValue = "0";
    }
    setFormData((prev) => ({
      ...prev,
      textileDetails: { ...prev.textileDetails, [field]: sanitizedValue },
    }));
    if (errors[`textileDetails.${field}`]) {
      setErrors((prev) => ({ ...prev, [`textileDetails.${field}`]: "" }));
    }
  };

  const handleSupplierContactChange = (
    field: keyof SupplierContact,
    value: string
  ) => {
    let sanitizedValue = value;
    if (field === "phone") {
      if (!value.startsWith("+92 ")) {
        sanitizedValue = "+92 ";
      }
      let rest = sanitizedValue.slice(4).replace(/[^0-9 ]/g, "");
      rest = rest.replace(/ {2,}/g, " ");
      rest = rest.replace(/^(\d{3})\s?(\d{0,7})/, "$1 $2").trimEnd();
      rest = rest.slice(0, 11);
      sanitizedValue = "+92 " + rest;
    }
    setFormData((prev) => ({
      ...prev,
      supplierContact: { ...prev.supplierContact, [field]: sanitizedValue },
    }));
    if (errors[`supplierContact.${field}`]) {
      setErrors((prev) => ({ ...prev, [`supplierContact.${field}`]: "" }));
    }
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

    // Limit to 10 images
    const limitedFiles = Array.from(files).slice(0, 10);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newImageFiles: File[] = [];
      const newImagePreviews: string[] = [];

      for (let i = 0; i < limitedFiles.length; i++) {
        const file = limitedFiles[i];

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 10) {
          setUploadProgress(progress);
          await new Promise((resolve) => setTimeout(resolve, 50));
        }

        // Store actual file
        newImageFiles.push(file);

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        newImagePreviews.push(previewUrl);
      }

      setFormData((prev) => ({
        ...prev,
        imageFiles: [...prev.imageFiles, ...newImageFiles],
        images: [...prev.images, ...newImagePreviews],
      }));

      toast.success(`${limitedFiles.length} image(s) uploaded successfully!`);
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
      imageFiles: prev.imageFiles.filter((_, index) => index !== indexToRemove),
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
    if (!formData.materialType)
      newErrors.materialType = "Material type is required";
    if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0)
      newErrors.pricePerUnit = "Valid price is required";
    if (!formData.costPrice || parseFloat(formData.costPrice) <= 0)
      newErrors.costPrice = "Valid cost price is required";
    if (!formData.quantity || parseInt(formData.quantity) < 0)
      newErrors.quantity = "Valid quantity is required";
    if (!formData.reorderLevel.trim())
      newErrors.reorderLevel = "Reorder level is required";
    if (!formData.minStockLevel.trim())
      newErrors.minStockLevel = "Min stock level is required";
    if (!formData.safetyStockLevel.trim())
      newErrors.safetyStockLevel = "Safety stock level is required";
    if (!formData.damagedQuantity.trim())
      newErrors.damagedQuantity = "Damaged quantity is required";
    if (!formData.shelfLife.trim())
      newErrors.shelfLife = "Shelf life is required";
    if (
      formData.autoReorderEnabled === undefined ||
      formData.autoReorderEnabled === null
    )
      newErrors.autoReorderEnabled = "Auto reorder is required";
    if (!formData.currency) newErrors.currency = "Currency is required";
    if (!formData.warehouseLocation)
      newErrors.warehouseLocation = "Warehouse location is required";
    if (!formData.qualityGrade)
      newErrors.qualityGrade = "Quality grade is required";
    if (!formData.countryOfOrigin.trim())
      newErrors.countryOfOrigin = "Country of origin is required";
    if (!formData.supplierName.trim())
      newErrors.supplierName = "Supplier name is required";
    if (!formData.supplierContact.phone.trim())
      newErrors["supplierContact.phone"] = "Phone is required";
    if (!formData.supplierContact.email.trim())
      newErrors["supplierContact.email"] = "Email is required";
    if (!formData.textileDetails.color.trim())
      newErrors["textileDetails.color"] = "Color is required";
    if (!formData.textileDetails.fabricType)
      newErrors["textileDetails.fabricType"] = "Fabric type is required";
    if (!formData.textileDetails.composition.trim())
      newErrors["textileDetails.composition"] = "Composition is required";
    if (!formData.textileDetails.pattern)
      newErrors["textileDetails.pattern"] = "Pattern is required";
    if (!formData.textileDetails.gsm.trim())
      newErrors["textileDetails.gsm"] = "GSM is required";
    if (!formData.textileDetails.width.trim())
      newErrors["textileDetails.width"] = "Width is required";
    if (!formData.textileDetails.colorCode)
      newErrors["textileDetails.colorCode"] = "Color code is required";
    if (formData.images.length === 0)
      newErrors.images = "At least one product image is required";

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
      // Basic
      name: "",
      description: "",
      category: "",
      subcategory: "",
      materialType: "",
      brand: "",
      textileDetails: {
        fabricType: "",
        composition: "",
        gsm: "",
        width: "",
        fabricWeight: "",
        color: "",
        colorCode: "#000000",
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
      reservedQuantity: "",
      committedQuantity: "",
      damagedQuantity: "",
      minStockLevel: "10",
      reorderLevel: "20",
      reorderQuantity: "50",
      maximumQuantity: "",
      safetyStockLevel: "",
      unit: "pieces",
      sku: "",
      weight: "",
      dimensions: "",
      tags: [],
      season: "All Season",
      countryOfOrigin: "Pakistan",
      manufacturer: "",
      supplierName: "",
      companyName: "",
      supplierContact: { phone: "", email: "", address: "" },
      status: "active",
      isSustainable: false,
      certifications: [],
      sustainabilityCertifications: [],
      complianceStandards: [],
      qualityGrade: "",
      leadTime: "7",
      estimatedDeliveryDays: "7",
      shelfLife: "730",
      images: [],
      notes: "",
      internalCode: "",
      barcode: "",
      carbonFootprint: "",
      recycledContent: "",
      autoReorderEnabled: false,
      isBatchTracked: true,
      currency: "PKR",
      imageFiles: [],
      warehouseLocation: "",
      storageLocations: [],
      specifications: {},
      suitableFor: [],
      manufactureDate: new Date().toISOString().split("T")[0], // Today's date
      expiryDate: "",
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
      // Prepare data for API
      const apiData: InventoryFormData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        materialType: formData.materialType,

        // ADD THESE:
        isBatchTracked: formData.isBatchTracked,
        manufactureDate:
          formData.manufactureDate &&
          !isNaN(Date.parse(formData.manufactureDate))
            ? formData.manufactureDate
            : undefined,
        expiryDate:
          formData.expiryDate && !isNaN(Date.parse(formData.expiryDate))
            ? formData.expiryDate
            : undefined,

        textileDetails: {
          fabricType: formData.textileDetails.fabricType,
          composition: formData.textileDetails.composition,
          gsm: formData.textileDetails.gsm
            ? parseInt(formData.textileDetails.gsm)
            : undefined,
          width: formData.textileDetails.width
            ? parseInt(formData.textileDetails.width)
            : undefined,
          color: formData.textileDetails.color,
          colorCode: formData.textileDetails.colorCode,
          pattern: formData.textileDetails.pattern,
          finish: formData.textileDetails.finish,
          careInstructions: formData.textileDetails.careInstructions,
          shrinkage: formData.textileDetails.shrinkage,
          washability: formData.textileDetails.washability,
          fabricWeight: formData.textileDetails.fabricWeight,
        },

        pricePerUnit: parseFloat(formData.pricePerUnit),
        costPrice: formData.costPrice
          ? parseFloat(formData.costPrice)
          : undefined,
        currency: formData.currency || "PKR",

        quantity: parseInt(formData.quantity),
        unit: formData.unit,
        minStockLevel: parseInt(formData.minStockLevel),
        reorderLevel: parseInt(formData.reorderLevel),
        reorderQuantity: parseInt(formData.reorderQuantity),

        sku: formData.sku || `SKU-${Date.now()}`,

        dimensions: formData.dimensions
          ? {
              unit: "cm",
              length: 0,
              width: 0,
              height: 0,
            }
          : undefined,

        specifications: formData.specifications,

        tags: formData.tags,
        season: formData.season,
        countryOfOrigin: formData.countryOfOrigin,

        supplierContact: {
          phone: formData.supplierContact.phone,
          email: formData.supplierContact.email,
          address: formData.supplierContact.address,
        },

        status: formData.status,
        certifications: formData.certifications,
        qualityGrade: formData.qualityGrade,

        warehouseLocation: formData.warehouseLocation,
        storageLocations: formData.storageLocations,
        suitableFor: formData.suitableFor,

        images: [], // Will be uploaded
        damagedQuantity:
          formData.damagedQuantity !== undefined &&
          formData.damagedQuantity !== null &&
          formData.damagedQuantity !== ""
            ? parseInt(formData.damagedQuantity)
            : 0,

        // ADD MISSING FIELDS:
        internalCode: formData.internalCode || undefined,
        barcode: formData.barcode || undefined,
        shelfLife: formData.shelfLife
          ? parseInt(formData.shelfLife)
          : undefined,
      };

      // Call API
      const response = await createInventory(apiData, formData.imageFiles);

      if (response.success) {
        toast.success("Inventory item added successfully!");

        // Close the confirmation dialog
        setIsConfirmOpen(false);

        // Redirect immediately after successful insertion
        router.push("/supplier/inventory");
      } else {
        throw new Error(response.message || "Failed to add inventory");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add inventory item");
      console.error("Error adding inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDescription = async () => {
    // Validate required fields before generating
    if (!formData.name || !formData.category) {
      toast.error("Please fill in Name and Category first");
      return;
    }

    // Build data from Step 1 fields
    const inventoryData = {
      name: formData.name,
      category: formData.category,
      subcategory: formData.subcategory,
      specifications: formData.specifications,
      unit: formData.unit,
      manufacturer: formData.manufacturer,
      origin: formData.countryOfOrigin,
    };

    const description = await generateInventoryDescription(inventoryData);

    if (description) {
      handleInputChange("description", description);
    }
  };

  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
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

  // Add this helper for Selects to match the prompt's usage
  const handleSelectChange = (field: keyof FormDataType, value: any) => {
    handleInputChange(field, value);
  };

  const validateStep = (step: number) => {
    const newErrors: ErrorsType = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Item name is required";
      if (!formData.category) newErrors.category = "Category is required";
      if (!formData.subcategory)
        newErrors.subcategory = "Subcategory is required";
      if (!formData.materialType)
        newErrors.materialType = "Material type is required";
      if (!formData.textileDetails.color.trim())
        newErrors["textileDetails.color"] = "Color is required";
      if (!formData.textileDetails.colorCode)
        newErrors["textileDetails.colorCode"] = "Color code is required";
    } else if (step === 2) {
      if (!formData.description.trim())
        newErrors.description = "Description is required";
      if (!formData.textileDetails.fabricType)
        newErrors["textileDetails.fabricType"] = "Fabric type is required";
      if (!formData.textileDetails.composition.trim())
        newErrors["textileDetails.composition"] = "Composition is required";
      if (!formData.textileDetails.pattern)
        newErrors["textileDetails.pattern"] = "Pattern is required";
      if (!formData.textileDetails.gsm.trim())
        newErrors["textileDetails.gsm"] = "GSM is required";
      if (!formData.textileDetails.width.trim())
        newErrors["textileDetails.width"] = "Width is required";
    } else if (step === 3) {
      if (!formData.pricePerUnit || parseFloat(formData.pricePerUnit) <= 0)
        newErrors.pricePerUnit = "Valid price is required";
      if (!formData.costPrice || parseFloat(formData.costPrice) <= 0)
        newErrors.costPrice = "Valid cost price is required";
      if (!formData.quantity || parseInt(formData.quantity) < 0)
        newErrors.quantity = "Valid quantity is required";
      if (!formData.reorderLevel.trim())
        newErrors.reorderLevel = "Reorder level is required";
      if (!formData.minStockLevel.trim())
        newErrors.minStockLevel = "Min stock level is required";
      if (!formData.safetyStockLevel.trim())
        newErrors.safetyStockLevel = "Safety stock level is required";
      if (!formData.damagedQuantity.trim())
        newErrors.damagedQuantity = "Damaged quantity is required";
      if (!formData.shelfLife.trim())
        newErrors.shelfLife = "Shelf life is required";
      if (
        formData.autoReorderEnabled === undefined ||
        formData.autoReorderEnabled === null
      )
        newErrors.autoReorderEnabled = "Auto reorder is required";
      if (!formData.currency) newErrors.currency = "Currency is required";
      if (!formData.warehouseLocation)
        newErrors.warehouseLocation = "Warehouse location is required";
      if (formData.isBatchTracked && !formData.manufactureDate)
        newErrors.manufactureDate =
          "Manufacture date is required when batch tracking is enabled";
    } else if (step === 4) {
      if (!formData.qualityGrade)
        newErrors.qualityGrade = "Quality grade is required";
      if (!formData.countryOfOrigin.trim())
        newErrors.countryOfOrigin = "Country of origin is required";
    } else if (step === 5) {
      if (!formData.supplierName.trim())
        newErrors.supplierName = "Supplier name is required";
      if (!formData.supplierContact.phone.trim())
        newErrors["supplierContact.phone"] = "Phone is required";
      else if (
        formData.supplierContact.phone.length !== 15 ||
        !/^\+92 \d{3} \d{7}$/.test(formData.supplierContact.phone)
      )
        newErrors["supplierContact.phone"] =
          "Please enter a valid phone number";
      if (!formData.supplierContact.email.trim())
        newErrors["supplierContact.email"] = "Email is required";
      else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.supplierContact.email)
      )
        newErrors["supplierContact.email"] =
          "Please enter a valid email address";
    } else if (step === 6) {
      if (formData.images.length === 0)
        newErrors.images = "At least one product image is required";
    }

    return newErrors;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="relative z-10 p-4 md:p-6">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-4 md:mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/supplier">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Add Inventory</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div
          className={`transform transition-all duration-700 mb-4 md:mb-6 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-2">
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
                Add Inventory Item
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                Add new textile materials and components to inventory
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  className={`${badgeColors.green.bg} ${badgeColors.green.border} ${badgeColors.green.text} text-xs rounded-none`}
                >
                  <CubeIcon
                    className={`h-3 w-3 mr-1 ${badgeColors.green.icon}`}
                  />
                  Inventory Management
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
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={resetForm}
                size="sm"
                className="text-xs cursor-pointer h-8 border-gray-200 dark:border-gray-700 rounded-none transition-all hover:border-black dark:hover:border-white"
              >
                <ArrowPathIcon className="h-3 w-3 mr-2" />
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPreview(!showPreview)}
                size="sm"
                className="text-xs cursor-pointer h-8 border-black dark:border-white bg-black text-white dark:bg-white dark:text-black rounded-none hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200 dark:hover:text-black transition-all"
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
          className={`grid gap-4 md:gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}
        >
          {/* Form Section with Progress Bar */}
          <div className={showPreview ? "lg:col-span-9" : "lg:col-span-12"}>
            {/* Progress Bar - Matches Form Width */}
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none mb-4 md:mb-6 shadow-none`}
            >
              <CardContent className="">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
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
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { step: 1, title: "Basic Info", icon: DocumentTextIcon },
                    { step: 2, title: "Textile Details", icon: SwatchIcon },
                    { step: 3, title: "Stock & Pricing", icon: CubeIcon },
                    { step: 4, title: "Quality", icon: ShieldCheckIcon },
                    {
                      step: 5,
                      title: "Supplier",
                      icon: BuildingStorefrontIcon,
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
                        onClick={() => {
                          if (step < currentStep) {
                            setCurrentStep(step);
                          } else if (step === currentStep + 1) {
                            const stepErrors = validateStep(currentStep);
                            if (Object.keys(stepErrors).length === 0) {
                              setCurrentStep(step);
                            }
                          }
                        }}
                        disabled={isDisabled}
                        className={`flex items-center justify-center gap-1 md:gap-2 p-2 rounded-none transition-all cursor-pointer text-xs md:text-sm
                          ${
                            isSelected
                              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                              : isCompleted
                                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                : isDisabled
                                  ? "bg-gray-50 dark:bg-gray-900 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-50 dark:bg-gray-900 text-gray-500"
                          }
                          ${
                            !isSelected && !isDisabled
                              ? "border border-transparent hover:border-black dark:hover:border-white"
                              : ""
                          }
                        `}
                        style={{
                          // Remove outline on click for consistency
                          outline: "none",
                        }}
                        type="button"
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
            <Card
              className={`${colors.cards.base} transition-all duration-300 rounded-none shadow-none`}
            >
              <CardContent className="">
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div>
                        <h3
                          className={`text-sm md:text-base font-semibold ${colors.texts.primary}`}
                        >
                          Basic Item Information
                        </h3>
                        <p
                          className={`text-xs md:text-sm ${colors.texts.secondary}`}
                        >
                          Essential details about the inventory item
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-2">
                      <div className="space-y-1">
                        <Label
                          htmlFor="name"
                          className={`text-xs md:text-sm font-medium ${colors.texts.accent}`}
                        >
                          Item Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder="e.g., Premium Cotton Fabric"
                          value={formData.name}
                          onChange={(e) =>
                            handleInputChange("name", e.target.value)
                          }
                          className={`text-sm h-9 md:h-10 ${colors.inputs.base} ${colors.inputs.focus} transition-colors duration-200 ${
                            errors.name ? `border-red-500` : ""
                          } rounded-none hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.name && (
                            <p
                              className={`text-xs ${colors.texts.error} flex items-center gap-1`}
                            >
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="space-y-1">
                          <Label
                            htmlFor="category"
                            className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Category <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) => {
                              handleInputChange("category", value);
                              handleInputChange("subcategory", "");
                            }}
                          >
                            <SelectTrigger
                              className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer hover:border-black outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ${
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
                          <div className="min-h-4">
                            {errors.category && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors.category}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="subcategory"
                            className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Subcategory <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.subcategory}
                            onValueChange={(value) =>
                              handleInputChange("subcategory", value)
                            }
                            disabled={!formData.category}
                          >
                            <SelectTrigger
                              className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer hover:border-black outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none ${
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
                          <div className="min-h-4">
                            {errors.subcategory && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors.subcategory}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Material Type{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.materialType}
                            onValueChange={(value) =>
                              handleSelectChange("materialType", value)
                            }
                          >
                            <SelectTrigger
                              className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none hover:border-black ${
                                errors.materialType ? "border-red-500" : ""
                              }`}
                            >
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
                          <div className="min-h-4">
                            {errors.materialType && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors.materialType}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="unit"
                            className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Unit <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.unit}
                            onValueChange={(value) =>
                              handleInputChange("unit", value)
                            }
                          >
                            <SelectTrigger className="text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none hover:border-black">
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

                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          SKU (Auto-generated)
                        </Label>
                        <Input
                          placeholder="Auto-generated"
                          value={formData.sku}
                          readOnly
                          className="text-sm h-9 md:h-10 bg-gray-100 dark:bg-gray-800 border rounded-none border-gray-200 dark:border-gray-700 cursor-not-allowed"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Color <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="e.g., Navy Blue"
                            value={formData.textileDetails.color}
                            onChange={(e) =>
                              handleTextileDetailChange("color", e.target.value)
                            }
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none hover:border-black focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 ${
                              errors["textileDetails.color"]
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          <div className="min-h-4">
                            {errors["textileDetails.color"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["textileDetails.color"]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label
                            htmlFor="textileDetails.colorCode"
                            className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Color Code <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="textileDetails.colorCode"
                            name="textileDetails.colorCode"
                            type="color"
                            value={
                              formData.textileDetails?.colorCode || "#000000"
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                textileDetails: {
                                  ...prev.textileDetails,
                                  colorCode: e.target.value,
                                },
                              }))
                            }
                            className={`rounded-none hover:border-black ${
                              errors["textileDetails.colorCode"]
                                ? "border-red-500"
                                : ""
                            }`}
                          />
                          <div className="min-h-4">
                            {errors["textileDetails.colorCode"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["textileDetails.colorCode"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="internalCode"
                          className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Internal Code
                        </Label>
                        <Input
                          id="internalCode"
                          value={formData.internalCode}
                          onChange={(e) =>
                            handleInputChange("internalCode", e.target.value)
                          }
                          placeholder="Optional internal tracking code"
                          className="text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="barcode"
                          className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Barcode
                        </Label>
                        <Input
                          id="barcode"
                          value={formData.barcode}
                          onChange={(e) =>
                            handleInputChange("barcode", e.target.value)
                          }
                          placeholder="Optional product barcode"
                          className="text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className={`${colors.buttons.primary} text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all`}
                      >
                        Next Step
                        <ArrowRightIcon className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Textile Details */}
                {currentStep === 2 && (
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                          Textile Details & Properties
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          Specific textile characteristics
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Fabric Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.textileDetails.fabricType}
                          onValueChange={(value) =>
                            handleTextileDetailChange("fabricType", value)
                          }
                        >
                          <SelectTrigger
                            className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white hover:border-black ${
                              errors["textileDetails.fabricType"]
                                ? "border-red-500"
                                : ""
                            }`}
                          >
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
                        <div className="min-h-4">
                          {errors["textileDetails.fabricType"] && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors["textileDetails.fabricType"]}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Composition <span className="text-red-500">*</span>
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
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none hover:border-black focus:border-black dark:focus:border-white ${
                              errors["textileDetails.composition"]
                                ? "border-red-500"
                                : ""
                            }`}
                          />
                          <div className="min-h-4">
                            {errors["textileDetails.composition"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["textileDetails.composition"]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Pattern <span className="text-red-500">*</span>
                          </Label>
                          <Select
                            value={formData.textileDetails.pattern}
                            onValueChange={(value) =>
                              handleTextileDetailChange("pattern", value)
                            }
                          >
                            <SelectTrigger
                              className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none cursor-pointer transition-colors duration-200 border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white hover:border-black ${
                                errors["textileDetails.pattern"]
                                  ? "border-red-500"
                                  : ""
                              }`}
                            >
                              <SelectValue placeholder="Select pattern" />
                            </SelectTrigger>
                            <SelectContent>
                              {patterns.map((pattern) => (
                                <SelectItem key={pattern} value={pattern}>
                                  {pattern}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <div className="min-h-4">
                            {errors["textileDetails.pattern"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["textileDetails.pattern"]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            GSM <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            placeholder="e.g., 180"
                            value={formData.textileDetails.gsm}
                            onChange={(e) =>
                              handleTextileDetailChange("gsm", e.target.value)
                            }
                            min="0"
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                              errors["textileDetails.gsm"]
                                ? "border-red-500"
                                : ""
                            } hover:border-black`}
                          />
                          <div className="min-h-4">
                            {errors["textileDetails.gsm"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["textileDetails.gsm"]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Width (cm) <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            placeholder="e.g., 150"
                            value={formData.textileDetails.width}
                            onChange={(e) =>
                              handleTextileDetailChange("width", e.target.value)
                            }
                            min="0"
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                              errors["textileDetails.width"]
                                ? "border-red-500"
                                : ""
                            } hover:border-black`}
                          />
                          <div className="min-h-4">
                            {errors["textileDetails.width"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["textileDetails.width"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="description"
                          className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Item Description{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <Textarea
                            id="description"
                            placeholder="Provide a detailed description of the inventory item..."
                            value={formData.description}
                            onChange={(e) =>
                              handleInputChange("description", e.target.value)
                            }
                            maxLength={5000}
                            rows={8}
                            className={`text-sm resize-none bg-white dark:bg-gray-900 border rounded-none group-hover:border-black hover:border-black focus:border-black dark:focus:border-white outline-none ring-0 shadow-none transition-colors duration-200 focus:ring-0 focus:outline-none focus-visible:ring-0 focus-visible:outline-none min-h-[180px] h-[180px] ${
                              errors.description
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            }`}
                          />
                          <Button
                            type="button"
                            onClick={handleGenerateDescription}
                            disabled={
                              isGenerating ||
                              !formData.name ||
                              !formData.category
                            }
                            className="absolute top-1 right-1 h-8 px-2 bg-transparent text-gray-500 border-none rounded-none flex items-center gap-1 hover:text-black hover:bg-transparent focus-visible:ring-0 active:bg-transparent cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isGenerating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <SparklesIcon className="h-4 w-4" />
                            )}
                            {isGenerating ? "Generating..." : "Generate"}
                          </Button>
                        </div>
                        <div className="flex justify-between items-center">
                          {errors.description ? (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.description}
                            </p>
                          ) : (
                            <span />
                          )}
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {formData.description.length}/5000 characters
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all hover:border-black dark:hover:border-white"
                      >
                        <ArrowLeftIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className={`${colors.buttons.primary} text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all`}
                      >
                        Next Step
                        <ArrowRightIcon className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Stock & Pricing */}
                {currentStep === 3 && (
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                          Stock Management & Pricing
                        </h3>
                        <p className="text-xs md:textsm text-gray-600 dark:text-gray-400">
                          Inventory levels and pricing
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Unit Price <span className="text-red-500">*</span>
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
                            min="0"
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                              errors.pricePerUnit
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            } hover:border-black`}
                          />
                        </div>
                        <div className="min-h-4">
                          {errors.pricePerUnit && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.pricePerUnit}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Cost Price <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.costPrice}
                            onChange={(e) =>
                              handleInputChange("costPrice", e.target.value)
                            }
                            min="0"
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                              errors.costPrice
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            } hover:border-black`}
                          />
                        </div>
                        <div className="min-h-4">
                          {errors.costPrice && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.costPrice}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Current Quantity{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="e.g., 1000"
                          value={formData.quantity}
                          onChange={(e) =>
                            handleInputChange("quantity", e.target.value)
                          }
                          min="0"
                          className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                            errors.quantity
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          } hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.quantity && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.quantity}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Reorder Level <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="20"
                          value={formData.reorderLevel}
                          onChange={(e) =>
                            handleInputChange("reorderLevel", e.target.value)
                          }
                          className="text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black"
                        />
                        <div className="min-h-4">
                          {errors.reorderLevel && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.reorderLevel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Min Stock Level{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="number"
                          placeholder="10"
                          value={formData.minStockLevel}
                          onChange={(e) =>
                            handleInputChange("minStockLevel", e.target.value)
                          }
                          min="0"
                          className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                            errors.minStockLevel
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          } hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.minStockLevel && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.minStockLevel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="safetyStockLevel"
                          className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Safety Stock Level{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="safetyStockLevel"
                          name="safetyStockLevel"
                          type="number"
                          value={formData.safetyStockLevel}
                          onChange={(e) =>
                            handleInputChange(
                              "safetyStockLevel",
                              e.target.value
                            )
                          }
                          min="0"
                          placeholder="Minimum safety stock"
                          className={`text-sm h-9 md:h-10 rounded-none ${
                            errors.safetyStockLevel ? "border-red-500" : ""
                          } hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.safetyStockLevel && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.safetyStockLevel}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="damagedQuantity"
                          className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Damaged Quantity{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="damagedQuantity"
                          name="damagedQuantity"
                          type="number"
                          value={formData.damagedQuantity}
                          onChange={(e) =>
                            handleInputChange("damagedQuantity", e.target.value)
                          }
                          min="0"
                          placeholder="0"
                          className={`text-sm h-9 md:h-10 rounded-none ${
                            errors.damagedQuantity ? "border-red-500" : ""
                          } hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.damagedQuantity && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.damagedQuantity}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Shelf Life (Days){" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="shelfLife"
                          name="shelfLife"
                          type="number"
                          value={formData.shelfLife}
                          onChange={(e) =>
                            handleInputChange("shelfLife", e.target.value)
                          }
                          min="0"
                          placeholder="e.g., 730"
                          className={`text-sm h-9 md:h-10 rounded-none ${
                            errors.shelfLife ? "border-red-500" : ""
                          } hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.shelfLife && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.shelfLife}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Auto Reorder <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.autoReorderEnabled ? "true" : "false"}
                          onValueChange={(value) =>
                            handleSelectChange(
                              "autoReorderEnabled",
                              value === "true"
                            )
                          }
                        >
                          <SelectTrigger
                            className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none ${
                              errors.autoReorderEnabled
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            } hover:border-black`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Enabled</SelectItem>
                            <SelectItem value="false">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="min-h-4">
                          {errors.autoReorderEnabled && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.autoReorderEnabled}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Batch Tracking Fields */}
                    <div className="space-y-2 mt-2 md:mt-4 p-3 md:p-4 border border-gray-200 dark:border-gray-700 rounded-none">
                      <div className="flex items-center gap-2 mb-4">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Batch Tracking
                        </Label>
                        <Badge className="bg-blue-100/10 border border-blue-200 text-blue-700 text-xs rounded-none">
                          {formData.isBatchTracked ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enable Batch Tracking
                          </Label>
                          <Select
                            value={formData.isBatchTracked ? "true" : "false"}
                            onValueChange={(value) =>
                              handleSelectChange(
                                "isBatchTracked",
                                value === "true"
                              )
                            }
                          >
                            <SelectTrigger className="text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Manufacture Date and Expiry Date remain as single columns */}
                        {formData.isBatchTracked && (
                          <>
                            <div className="space-y-1">
                              <Label
                                htmlFor="manufactureDate"
                                className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                Manufacture Date{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "text-sm h-9 md:h-10 w-full justify-start text-left font-normal bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black",
                                      !formData.manufactureDate &&
                                        "text-muted-foreground"
                                    )}
                                  >
                                    {formData.manufactureDate ? (
                                      new Date(
                                        formData.manufactureDate
                                      ).toLocaleDateString()
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={
                                      formData.manufactureDate
                                        ? new Date(formData.manufactureDate)
                                        : undefined
                                    }
                                    onSelect={(date) => {
                                      setFormData((prev) => ({
                                        ...prev,
                                        manufactureDate: date
                                          ? date.toLocaleDateString("en-CA")
                                          : "",
                                        expiryDate: "", // Reset expiry date when manufacture date changes
                                      }));
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <div className="min-h-4">
                                {errors.manufactureDate && (
                                  <p className="text-xs text-red-500 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                    {errors.manufactureDate}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label
                                htmlFor="expiryDate"
                                className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300"
                              >
                                Expiry Date (Optional)
                              </Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "text-sm h-9 md:h-10 w-full justify-start text-left font-normal bg-white dark:bg-gray-900 border rounded-none border-gray-200 dark:border-gray-700 hover:border-black",
                                      !formData.expiryDate &&
                                        "text-muted-foreground"
                                    )}
                                  >
                                    {formData.expiryDate ? (
                                      new Date(
                                        formData.expiryDate
                                      ).toLocaleDateString()
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-auto p-0"
                                  align="start"
                                >
                                  <Calendar
                                    mode="single"
                                    selected={
                                      formData.expiryDate
                                        ? new Date(formData.expiryDate)
                                        : undefined
                                    }
                                    onSelect={(date) => {
                                      // Only allow expiry date >= manufacture date
                                      if (
                                        formData.manufactureDate &&
                                        date &&
                                        new Date(date) <
                                          new Date(formData.manufactureDate)
                                      ) {
                                        toast.error(
                                          "Expiry date cannot be before manufacture date"
                                        );
                                        return;
                                      }
                                      setFormData((prev) => ({
                                        ...prev,
                                        expiryDate: date
                                          ? date.toLocaleDateString("en-CA")
                                          : "",
                                      }));
                                    }}
                                    // Optionally, set fromDate to manufactureDate for UI restriction
                                    fromDate={
                                      formData.manufactureDate
                                        ? new Date(formData.manufactureDate)
                                        : undefined
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <p className="text-xs text-gray-500 mt-1">
                                Auto-calculated from shelf life if not provided
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Currency <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.currency}
                        onValueChange={(value) =>
                          handleInputChange("currency", value)
                        }
                      >
                        <SelectTrigger
                          className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none ${
                            errors.currency
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          } hover:border-black`}
                        >
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((curr) => (
                            <SelectItem
                              key={curr}
                              value={curr}
                              className="text-sm"
                            >
                              {curr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="min-h-4">
                        {errors.currency && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                            {errors.currency}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                        Warehouse Location{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.warehouseLocation}
                        onValueChange={(value) =>
                          handleInputChange("warehouseLocation", value)
                        }
                      >
                        <SelectTrigger
                          className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none ${
                            errors.warehouseLocation
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          } hover:border-black`}
                        >
                          <SelectValue placeholder="Select warehouse location" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouseLocations.map((loc) => (
                            <SelectItem
                              key={loc}
                              value={loc}
                              className="text-sm"
                            >
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="min-h-4">
                        {errors.warehouseLocation && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                            {errors.warehouseLocation}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all hover:border-black dark:hover:border-white"
                      >
                        <ArrowLeftIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none"
                      >
                        Next Step
                        <ArrowRightIcon className="h-3 w-3 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Quality */}
                {currentStep === 4 && (
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                          Quality & Compliance
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          Certifications and quality information
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Quality Grade <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={formData.qualityGrade}
                          onValueChange={(value) =>
                            handleInputChange("qualityGrade", value)
                          }
                        >
                          <SelectTrigger
                            className={`text-sm h-9 md:h-10 w-full bg-white dark:bg-gray-900 border rounded-none ${
                              errors.qualityGrade
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            } focus:border-black dark:focus:border-white hover:border-black`}
                          >
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
                        {errors.qualityGrade && (
                          <div className="min-h-4">
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.qualityGrade}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Country of Origin{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g., Pakistan"
                          value={formData.countryOfOrigin}
                          onChange={(e) =>
                            handleInputChange("countryOfOrigin", e.target.value)
                          }
                          className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                            errors.countryOfOrigin
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          } hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.countryOfOrigin && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.countryOfOrigin}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs md:text-sm font-medium">
                        Certifications
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 md:gap-x-6 md:gap-y-3">
                        {certifications.map((cert) => (
                          <label
                            key={cert}
                            className="flex items-center gap-2 p-2 md:p-3 bg-white/50 dark:bg-gray-800/50 border rounded-none cursor-pointer hover:bg-white dark:hover:bg-gray-800 transition-colors"
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
                            <span className="text-xs md:text-sm">{cert}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all hover:border-black dark:hover:border-white"
                      >
                        <ArrowLeftIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none"
                      >
                        Next Step
                        <ArrowRightIcon className="h-3 w-3 md:h-4 md:w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 5: Supplier */}
                {currentStep === 5 && (
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                          Supplier Information
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          Supplier details and contact
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-x-6 gap-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                          Supplier Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g., ABC Textiles Ltd."
                          value={formData.supplierName}
                          onChange={(e) =>
                            handleInputChange("supplierName", e.target.value)
                          }
                          className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                            errors.supplierName
                              ? "border-red-500"
                              : "border-gray-200 dark:border-gray-700"
                          } hover:border-black`}
                        />
                        <div className="min-h-4">
                          {errors.supplierName && (
                            <p className="text-xs text-red-500 flex items-center gap-1">
                              <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                              {errors.supplierName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Phone <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            placeholder="e.g., +92 300 1234567"
                            value={formData.supplierContact.phone}
                            onChange={(e) =>
                              handleSupplierContactChange(
                                "phone",
                                e.target.value
                              )
                            }
                            type="tel"
                            required
                            maxLength={15}
                            minLength={15}
                            pattern="\+92\s\d{3}\s\d{7}"
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                              errors["supplierContact.phone"]
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            } hover:border-black`}
                          />
                          <div className="min-h-4">
                            {errors["supplierContact.phone"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["supplierContact.phone"]}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email <span className="text-red-500">*</span>
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
                            className={`text-sm h-9 md:h-10 bg-white dark:bg-gray-900 border rounded-none ${
                              errors["supplierContact.email"]
                                ? "border-red-500"
                                : "border-gray-200 dark:border-gray-700"
                            } hover:border-black`}
                          />
                          <div className="min-h-4">
                            {errors["supplierContact.email"] && (
                              <p className="text-xs text-red-500 flex items-center gap-1">
                                <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                                {errors["supplierContact.email"]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all hover:border-black dark:hover:border-white"
                      >
                        <ArrowLeftIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={nextStep}
                        size="sm"
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none"
                      >
                        Next Step
                        <ArrowRightIcon className="h-3 w-3 md:h-4 md:w-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 6: Media & Final */}
                {currentStep === 6 && (
                  <div className="space-y-2 md:space-y-4">
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                      <div>
                        <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                          Media Upload
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          Add images and finalize
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs md:text-sm font-medium">
                        Product Images <span className="text-red-500">*</span>
                      </Label>
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
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-none p-8 text-center hover:border-gray-500 dark:hover:border-gray-500 transition-colors bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm cursor-pointer mt-6">
                        <div className="text-center">
                          <div className="mb-3">
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer block"
                            >
                              <ArrowUpTrayIcon className="!h-20 !w-20 md:h-24 md:w-24 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                              <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                                Upload Product Images
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Click to browse or drag and drop
                              </p>
                            </label>
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
                        </div>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {formData.images.map((image, index) => (
                            <div
                              key={index}
                              className="relative w-20 h-16 md:w-28 md:h-28 bg-gray-100 dark:bg-gray-800 rounded-none overflow-hidden group"
                            >
                              <img
                                src={image}
                                alt={`Item ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 rounded-none w-5 h-5 md:w-6 md:h-6 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-opacity"
                                onClick={() => removeImage(index)}
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

                      {errors.images && (
                        <div className="min-h-4">
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <ExclamationTriangleIcon className="h-1.5 w-1.5" />
                            {errors.images}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between gap-2">
                      <Button
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none transition-all hover:border-black dark:hover:border-white"
                      >
                        <ArrowLeftIcon className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                        Previous
                      </Button>
                      <Button
                        onClick={() => setIsConfirmOpen(true)}
                        disabled={isLoading}
                        size="sm"
                        className={`${colors.buttons.primary} text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none`}
                      >
                        {isLoading ? (
                          <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        ) : (
                          <CheckCircleIcon className="h-3 w-3 mr-2" />
                        )}
                        {isLoading ? "Adding..." : "Add to Inventory"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Preview Section - Narrower and Separate */}
          {showPreview && (
            <div className="lg:col-span-3">
              <div className="sticky top-20">
                <PreviewCard formData={formData} />
              </div>
            </div>
          )}
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent
            className={`${colors.backgrounds.modal} ${colors.borders.primary} rounded-none shadow-none max-w-sm md:max-w-md`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-sm md:text-base font-bold flex items-center gap-3 ${colors.texts.primary}`}
              >
                <CubeIcon className="h-4 w-4" />
                Add to Inventory
              </DialogTitle>
              <DialogDescription
                className={`text-xs md:text-sm ${colors.texts.secondary}`}
              >
                Are you ready to add this item to the inventory?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className={`${badgeColors.blue.bg} rounded-none p-3 md:p-4`}>
                <ul
                  className={`space-y-2 text-xs md:text-sm ${colors.texts.primary}`}
                >
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className={`h-3 w-3 md:h-4 md:w-4 ${colors.texts.success}`}
                    />
                    Create inventory record on blockchain
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className={`h-3 w-3 md:h-4 md:w-4 ${colors.texts.success}`}
                    />
                    Store item images securely
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircleIcon
                      className={`h-3 w-3 md:h-4 md:w-4 ${colors.texts.success}`}
                    />
                    Enable stock tracking
                  </li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2 md:gap-3">
              <Button
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                size="sm"
                className={`text-xs md:text-sm cursor-pointer h-8 md:h-9 ${colors.buttons.outline} shadow-none hover:shadow-none rounded-none`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                size="sm"
                className={`${colors.buttons.primary} text-xs md:text-sm cursor-pointer h-8 md:h-9 rounded-none shadow-none hover:shadow-none`}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-3 w-3 mr-2" />
                )}
                {isLoading ? "Adding..." : "Confirm"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
