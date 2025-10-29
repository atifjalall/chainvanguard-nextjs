import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Mock auth hook - replace with your actual implementation
const useAuth = () => ({
  user: {
    id: "supplier1",
    name: "Supplier Company",
    walletAddress: "0x123...",
  },
});

// Material specifications
const MATERIAL_TYPES = [
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
  "Nylon",
  "Rayon",
  "Spandex",
  "Blend",
  "Other",
];

const ITEM_TYPES = [
  "raw_material",
  "fabric",
  "yarn",
  "dye",
  "chemical",
  "accessory",
  "button",
  "zipper",
  "thread",
  "packaging",
  "label",
  "tag",
  "component",
  "finished_good",
  "semi_finished",
];

const CATEGORIES = [
  "Textiles",
  "Fabrics",
  "Yarns",
  "Dyes & Chemicals",
  "Trims & Accessories",
  "Packaging Materials",
  "Finished Products",
  "Components",
  "Others",
];

const UNITS = [
  "kg",
  "g",
  "lbs",
  "oz",
  "meter",
  "yard",
  "roll",
  "piece",
  "dozen",
  "box",
  "liter",
  "ml",
  "unit",
];

const WAREHOUSES = [
  "Main Warehouse",
  "Secondary Warehouse",
  "Cold Storage",
  "Quality Hold Area",
];

const GRADES = ["A", "B", "C", "Premium", "Standard", "Economy"];

export default function AddInventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const totalSteps = 5;

  useEffect(() => {
    setIsVisible(true);
  }, []);

  type InventoryFormData = {
    // Basic Information
    itemName: string;
    itemCode: string;
    sku: string;
    description: string;

    // Classification
    itemType: string;
    category: string;
    subcategory: string;

    // Material Specs
    materialType: string;
    composition: string;
    weightValue: string;
    weightUnit: string;
    widthValue: string;
    widthUnit: string;
    color: string;
    colorCode: string;
    finish: string;
    pattern: string;
    grade: string;

    // Unit & Quantity
    unitOfMeasurement: string;
    totalQuantity: string;
    reservedQuantity: string;
    committedQuantity: string;

    // Reorder Management
    reorderPoint: string;
    reorderQuantity: string;
    minimumStockLevel: string;
    maximumStockLevel: string;
    safetyStockLevel: string;

    // Pricing
    costPrice: string;
    standardCost: string;
    currency: string;
    valuationMethod: string;

    // Storage
    warehouse: string;
    section: string;
    aisle: string;
    rack: string;
    bin: string;

    // Storage Conditions
    tempMin: string;
    tempMax: string;
    tempUnit: string;
    humidityMin: string;
    humidityMax: string;
    specialRequirements: string;

    // Quality & Compliance
    qualityStandards: string[];
    certifications: string[];
    isSustainable: boolean;
    isOrganic: boolean;
    isRecycled: boolean;

    // Expiry & Shelf Life
    hasExpiryDate: boolean;
    shelfLifeDays: string;

    // Metadata
    tags: string[];
    countryOfOrigin: string;
    manufacturer: string;
    hsCode: string;
    notes: string;

    // Batch Tracking
    batchTracking: boolean;
    batchNumber: string;
    batchQuantity: string;
    manufacturingDate: string;
    batchExpiryDate: string;

    // Images
    images: string[];
  };

  const [formData, setFormData] = useState<InventoryFormData>({
    // Basic Information
    itemName: "",
    itemCode: "",
    sku: "",
    description: "",

    // Classification
    itemType: "",
    category: "",
    subcategory: "",

    // Material Specs
    materialType: "",
    composition: "",
    weightValue: "",
    weightUnit: "gsm",
    widthValue: "",
    widthUnit: "inch",
    color: "",
    colorCode: "",
    finish: "",
    pattern: "",
    grade: "Standard",

    // Unit & Quantity
    unitOfMeasurement: "unit",
    totalQuantity: "",
    reservedQuantity: "0",
    committedQuantity: "0",

    // Reorder Management
    reorderPoint: "10",
    reorderQuantity: "100",
    minimumStockLevel: "5",
    maximumStockLevel: "1000",
    safetyStockLevel: "20",

    // Pricing
    costPrice: "",
    standardCost: "",
    currency: "USD",
    valuationMethod: "FIFO",

    // Storage
    warehouse: "Main Warehouse",
    section: "",
    aisle: "",
    rack: "",
    bin: "",

    // Storage Conditions
    tempMin: "",
    tempMax: "",
    tempUnit: "C",
    humidityMin: "",
    humidityMax: "",
    specialRequirements: "",

    // Quality & Compliance
    qualityStandards: [],
    certifications: [],
    isSustainable: false,
    isOrganic: false,
    isRecycled: false,

    // Expiry & Shelf Life
    hasExpiryDate: false,
    shelfLifeDays: "",

    // Metadata
    tags: [],
    countryOfOrigin: "",
    manufacturer: "",
    hsCode: "",
    notes: "",

    // Batch Tracking
    batchTracking: true,
    batchNumber: "",
    batchQuantity: "",
    manufacturingDate: "",
    batchExpiryDate: "",

    // Images
    images: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [standardInput, setStandardInput] = useState("");

  const updateFormData = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
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

  const removeTag = (tag: never) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const addCertification = () => {
    if (
      certInput.trim() &&
      !formData.certifications.includes(certInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        certifications: [...prev.certifications, certInput.trim()],
      }));
      setCertInput("");
    }
  };

  const removeCertification = (cert: never) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((c) => c !== cert),
    }));
  };

  const addQualityStandard = () => {
    if (
      standardInput.trim() &&
      !formData.qualityStandards.includes(standardInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        qualityStandards: [...prev.qualityStandards, standardInput.trim()],
      }));
      setStandardInput("");
    }
  };

  const removeQualityStandard = (standard: never) => {
    setFormData((prev) => ({
      ...prev,
      qualityStandards: prev.qualityStandards.filter((s) => s !== standard),
    }));
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.itemName.trim())
          newErrors.itemName = "Item name is required";
        if (!formData.itemCode.trim())
          newErrors.itemCode = "Item code is required";
        if (!formData.description.trim())
          newErrors.description = "Description is required";
        if (!formData.itemType) newErrors.itemType = "Item type is required";
        if (!formData.category) newErrors.category = "Category is required";
        break;
      case 2:
        if (!formData.unitOfMeasurement)
          newErrors.unitOfMeasurement = "Unit is required";
        if (
          !formData.totalQuantity ||
          parseFloat(formData.totalQuantity) <= 0
        ) {
          newErrors.totalQuantity = "Valid quantity is required";
        }
        if (!formData.costPrice || parseFloat(formData.costPrice) <= 0) {
          newErrors.costPrice = "Valid cost price is required";
        }
        break;
      case 3:
        // Storage validations are optional
        break;
      case 4:
        // Quality standards are optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);

    try {
      const inventoryData = {
        itemName: formData.itemName,
        itemCode: formData.itemCode,
        sku: formData.sku || `SKU-${Date.now()}`,
        description: formData.description,
        itemType: formData.itemType,
        category: formData.category,
        subcategory: formData.subcategory,
        materialSpecs: {
          materialType: formData.materialType,
          composition: formData.composition,
          weight: {
            value: parseFloat(formData.weightValue) || 0,
            unit: formData.weightUnit,
          },
          width: {
            value: parseFloat(formData.widthValue) || 0,
            unit: formData.widthUnit,
          },
          color: formData.color,
          colorCode: formData.colorCode,
          finish: formData.finish,
          pattern: formData.pattern,
          grade: formData.grade,
        },
        unitOfMeasurement: formData.unitOfMeasurement,
        totalQuantity: parseFloat(formData.totalQuantity),
        availableQuantity: parseFloat(formData.totalQuantity),
        reservedQuantity: parseFloat(formData.reservedQuantity) || 0,
        committedQuantity: parseFloat(formData.committedQuantity) || 0,
        reorderPoint: parseFloat(formData.reorderPoint),
        reorderQuantity: parseFloat(formData.reorderQuantity),
        minimumStockLevel: parseFloat(formData.minimumStockLevel),
        maximumStockLevel: parseFloat(formData.maximumStockLevel),
        safetyStockLevel: parseFloat(formData.safetyStockLevel),
        costPrice: parseFloat(formData.costPrice),
        averageCostPrice: parseFloat(formData.costPrice),
        standardCost: parseFloat(formData.standardCost) || 0,
        currency: formData.currency,
        valuationMethod: formData.valuationMethod,
        supplierId: user?.id,
        supplierName: user?.name,
        supplierWalletAddress: user?.walletAddress || "",
        storageLocation: {
          warehouse: formData.warehouse,
          section: formData.section,
          aisle: formData.aisle,
          rack: formData.rack,
          bin: formData.bin,
        },
        storageConditions: {
          temperature: {
            min: parseFloat(formData.tempMin) || undefined,
            max: parseFloat(formData.tempMax) || undefined,
            unit: formData.tempUnit,
          },
          humidity: {
            min: parseFloat(formData.humidityMin) || undefined,
            max: parseFloat(formData.humidityMax) || undefined,
          },
          specialRequirements: formData.specialRequirements,
        },
        batchTracking: formData.batchTracking,
        batches:
          formData.batchTracking && formData.batchNumber
            ? [
                {
                  batchNumber: formData.batchNumber,
                  quantity: parseFloat(
                    formData.batchQuantity || formData.totalQuantity
                  ),
                  remainingQuantity: parseFloat(
                    formData.batchQuantity || formData.totalQuantity
                  ),
                  manufacturingDate:
                    formData.manufacturingDate || new Date().toISOString(),
                  expiryDate: formData.batchExpiryDate || undefined,
                  costPrice: parseFloat(formData.costPrice),
                  qualityGrade: formData.grade,
                  status: "available",
                },
              ]
            : [],
        qualityStandards: formData.qualityStandards,
        certifications: formData.certifications,
        isSustainable: formData.isSustainable,
        isOrganic: formData.isOrganic,
        isRecycled: formData.isRecycled,
        hasExpiryDate: formData.hasExpiryDate,
        shelfLifeDays: formData.hasExpiryDate
          ? parseFloat(formData.shelfLifeDays)
          : undefined,
        tags: formData.tags,
        countryOfOrigin: formData.countryOfOrigin,
        manufacturer: formData.manufacturer,
        hsCode: formData.hsCode,
        notes: formData.notes,
        status: "active",
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      console.log("Inventory item created:", inventoryData);
      alert("Inventory item added successfully! (Check console for data)");

      // In production, you would make an API call here
      // await fetch('/api/inventory', { method: 'POST', body: JSON.stringify(inventoryData) });

      // router.push("/supplier/inventory");
    } catch (error) {
      console.error("Error adding inventory:", error);
      alert("Failed to add inventory item");
    } finally {
      setIsLoading(false);
    }
  };

  const getProgress = () => (currentStep / totalSteps) * 100;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInfo();
      case 2:
        return renderQuantityPricing();
      case 3:
        return renderStorageLocation();
      case 4:
        return renderQualityCompliance();
      case 5:
        return renderBatchMetadata();
      default:
        return null;
    }
  };

  // Step 1: Basic Information
  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Item Name *</label>
          <input
            type="text"
            value={formData.itemName}
            onChange={(e) => updateFormData("itemName", e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${errors.itemName ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
            placeholder="e.g., Premium Cotton Fabric"
          />
          {errors.itemName && (
            <p className="text-red-500 text-sm mt-1">{errors.itemName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Item Code *</label>
          <input
            type="text"
            value={formData.itemCode}
            onChange={(e) => updateFormData("itemCode", e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${errors.itemCode ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
            placeholder="e.g., FAB-001"
          />
          {errors.itemCode && (
            <p className="text-red-500 text-sm mt-1">{errors.itemCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">SKU</label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => updateFormData("sku", e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Auto-generated if empty"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Item Type *</label>
          <select
            value={formData.itemType}
            onChange={(e) => updateFormData("itemType", e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${errors.itemType ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select type</option>
            {ITEM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ").toUpperCase()}
              </option>
            ))}
          </select>
          {errors.itemType && (
            <p className="text-red-500 text-sm mt-1">{errors.itemType}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            value={formData.category}
            onChange={(e) => updateFormData("category", e.target.value)}
            className={`w-full px-4 py-3 rounded-lg border ${errors.category ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Subcategory</label>
          <input
            type="text"
            value={formData.subcategory}
            onChange={(e) => updateFormData("subcategory", e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description *</label>
        <textarea
          value={formData.description}
          onChange={(e) => updateFormData("description", e.target.value)}
          rows={4}
          className={`w-full px-4 py-3 rounded-lg border ${errors.description ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-blue-500`}
          placeholder="Detailed description of the inventory item..."
        />
        {errors.description && (
          <p className="text-red-500 text-sm mt-1">{errors.description}</p>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Material Specifications</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Valuation Method</label>
            <select
              value={formData.valuationMethod}
              onChange={(e) =>
                updateFormData("valuationMethod", e.target.value)
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            >
              <option value="FIFO">FIFO</option>
              <option value="LIFO">LIFO</option>
              <option value="Average">Average</option>
              <option value="Standard">Standard</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: Storage & Location
  const renderStorageLocation = () => (
    <div className="space-y-6">
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Storage Location</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="warehouse" className="block text-sm mb-2">Warehouse</label>
            <select
              id="warehouse"
              aria-label="Warehouse"
              title="Warehouse"
              value={formData.warehouse}
              onChange={(e) => updateFormData("warehouse", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
            >
              {WAREHOUSES.map((wh) => (
                <option key={wh} value={wh}>
                  {wh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Section</label>
            <input
              type="text"
              value={formData.section}
              onChange={(e) => updateFormData("section", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="e.g., A"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Aisle</label>
            <input
              type="text"
              value={formData.aisle}
              onChange={(e) => updateFormData("aisle", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="e.g., 5"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Rack</label>
            <input
              type="text"
              value={formData.rack}
              onChange={(e) => updateFormData("rack", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="e.g., R12"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Bin</label>
            <input
              type="text"
              value={formData.bin}
              onChange={(e) => updateFormData("bin", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="e.g., B3"
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Storage Conditions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-2">Min Temperature</label>
              <input
                type="number"
                value={formData.tempMin}
                onChange={(e) => updateFormData("tempMin", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                placeholder="15"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-2">Max Temperature</label>
              <input
                type="number"
                value={formData.tempMax}
                onChange={(e) => updateFormData("tempMax", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                placeholder="25"
              />
            </div>
            <div className="w-20">
              <label className="block text-sm mb-2">Unit</label>
              <select
                value={formData.tempUnit}
                onChange={(e) => updateFormData("tempUnit", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
              >
                <option value="C">°C</option>
                <option value="F">°F</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm mb-2">Min Humidity (%)</label>
              <input
                type="number"
                value={formData.humidityMin}
                onChange={(e) => updateFormData("humidityMin", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                placeholder="30"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm mb-2">Max Humidity (%)</label>
              <input
                type="number"
                value={formData.humidityMax}
                onChange={(e) => updateFormData("humidityMax", e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                placeholder="60"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm mb-2">Special Requirements</label>
            <textarea
              value={formData.specialRequirements}
              onChange={(e) =>
                updateFormData("specialRequirements", e.target.value)
              }
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="Any special storage requirements..."
            />
          </div>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Metadata</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Country of Origin</label>
            <input
              type="text"
              value={formData.countryOfOrigin}
              onChange={(e) =>
                updateFormData("countryOfOrigin", e.target.value)
              }
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="e.g., Pakistan"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">Manufacturer</label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => updateFormData("manufacturer", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="Manufacturer name"
            />
          </div>

          <div>
            <label className="block text-sm mb-2">HS Code</label>
            <input
              type="text"
              value={formData.hsCode}
              onChange={(e) => updateFormData("hsCode", e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300"
              placeholder="e.g., 5208.31.00"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 4: Quality & Compliance
  const renderQualityCompliance = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isSustainable}
            onChange={(e) => updateFormData("isSustainable", e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
          <span>Sustainable</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isOrganic}
            onChange={(e) => updateFormData("isOrganic", e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
          <span>Organic</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isRecycled}
            onChange={(e) => updateFormData("isRecycled", e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
          />
          <span>Recycled</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Quality Standards
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={standardInput}
            onChange={(e) => setStandardInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addQualityStandard())
            }
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
            placeholder="Add quality standard (press Enter)"
          />
          <button
            type="button"
            onClick={addQualityStandard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        {formData.qualityStandards.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.qualityStandards.map((std, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {std}
                <button
                  onClick={() => removeQualityStandard(std)}
                  className="text-blue-600 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Certifications</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addCertification())
            }
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
            placeholder="Add certification (press Enter)"
          />
          <button
            type="button"
            onClick={addCertification}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Add
          </button>
        </div>
        {formData.certifications.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.certifications.map((cert, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
              >
                {cert}
                <button
                  onClick={() => removeCertification(cert)}
                  className="text-green-600 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Expiry & Shelf Life</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.hasExpiryDate}
              onChange={(e) =>
                updateFormData("hasExpiryDate", e.target.checked)
              }
              className="w-5 h-5 rounded border-gray-300"
            />
            <span>This item has an expiry date</span>
          </label>

          {formData.hasExpiryDate && (
            <div>
              <label className="block text-sm mb-2">Shelf Life (Days)</label>
              <input
                type="number"
                value={formData.shelfLifeDays}
                onChange={(e) =>
                  updateFormData("shelfLifeDays", e.target.value)
                }
                className="w-full px-4 py-2 rounded-lg border border-gray-300"
                placeholder="365"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Step 5: Batch & Metadata
  const renderBatchMetadata = () => (
    <div className="space-y-6">
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Batch Tracking</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.batchTracking}
              onChange={(e) =>
                updateFormData("batchTracking", e.target.checked)
              }
              className="w-5 h-5 rounded border-gray-300"
            />
            <span>Enable batch tracking for this item</span>
          </label>

          {formData.batchTracking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm mb-2">Batch Number</label>
                <input
                  type="text"
                  value={formData.batchNumber}
                  onChange={(e) =>
                    updateFormData("batchNumber", e.target.value)
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  placeholder="e.g., BATCH-2025-001"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Batch Quantity</label>
                <input
                  type="number"
                  value={formData.batchQuantity}
                  onChange={(e) =>
                    updateFormData("batchQuantity", e.target.value)
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  placeholder="Same as total quantity"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Manufacturing Date</label>
                <input
                  type="date"
                  value={formData.manufacturingDate}
                  onChange={(e) =>
                    updateFormData("manufacturingDate", e.target.value)
                  }
                  className="w-full px-4 py-2 rounded-lg border border-gray-300"
                />
              </div>

              {formData.hasExpiryDate && (
                <div>
                  <label className="block text-sm mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.batchExpiryDate}
                    onChange={(e) =>
                      updateFormData("batchExpiryDate", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTag())
            }
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300"
            placeholder="Add tag (press Enter)"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Add
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-purple-600 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => updateFormData("notes", e.target.value)}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-gray-300"
          placeholder="Any additional notes about this inventory item..."
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h4 className="font-semibold mb-4 text-lg">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Item Name</p>
            <p className="font-semibold">{formData.itemName || "Not set"}</p>
          </div>
          <div>
            <p className="text-gray-600">Item Code</p>
            <p className="font-semibold">{formData.itemCode || "Not set"}</p>
          </div>
          <div>
            <p className="text-gray-600">Category</p>
            <p className="font-semibold">{formData.category || "Not set"}</p>
          </div>
          <div>
            <p className="text-gray-600">Type</p>
            <p className="font-semibold">
              {formData.itemType
                ? formData.itemType.replace(/_/g, " ").toUpperCase()
                : "Not set"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Quantity</p>
            <p className="font-semibold">
              {formData.totalQuantity || "0"} {formData.unitOfMeasurement}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Cost Price</p>
            <p className="font-semibold">
              {formData.currency} {formData.costPrice || "0.00"}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Warehouse</p>
            <p className="font-semibold">{formData.warehouse}</p>
          </div>
          <div>
            <p className="text-gray-600">Material</p>
            <p className="font-semibold">
              {formData.materialType || "Not specified"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-950 dark:via-blue-950 dark:to-cyan-950 p-6">
      <div
        className={`max-w-5xl mx-auto transform transition-all duration-700 ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Add Inventory Item
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add a new item to your inventory management system
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Step {currentStep} of {totalSteps}
            </h3>
            <span className="text-sm text-gray-500">
              {Math.round(getProgress())}% Complete
            </span>
          </div>
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-600 transition-all duration-500"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-3">
            <span
              className={currentStep >= 1 ? "text-blue-600 font-medium" : ""}
            >
              Basic Info
            </span>
            <span
              className={currentStep >= 2 ? "text-blue-600 font-medium" : ""}
            >
              Quantity
            </span>
            <span
              className={currentStep >= 3 ? "text-blue-600 font-medium" : ""}
            >
              Storage
            </span>
            <span
              className={currentStep >= 4 ? "text-blue-600 font-medium" : ""}
            >
              Quality
            </span>
            <span
              className={currentStep >= 5 ? "text-blue-600 font-medium" : ""}
            >
              Batch
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-xl mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
          >
            ← Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium shadow-lg transition-all"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "✓ Add to Inventory"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function renderQuantityPricing() {
    throw new Error("Function not implemented.");
}

