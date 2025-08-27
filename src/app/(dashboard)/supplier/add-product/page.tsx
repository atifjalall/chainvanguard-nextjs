"use client";

import { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Product } from "@/types";
import { toast } from "sonner";

export default function SupplierAddProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Form state with supplier-specific fields
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    sku: "",
    weight: "",
    dimensions: "",
    manufacturingDate: "",
    expiryDate: "",
    images: [] as string[],
    tags: [] as string[],
    brand: "",
    model: "",
    color: "",
    material: "",
    warranty: "",
    certifications: "",
    origin: "",
    minimumOrderQuantity: "1",
    maxOrderQuantity: "",
    leadTime: "",
    shelfLife: "",
    storageConditions: "",
    complianceStandards: "",
    supplierNotes: "",
    bulkPricing: [] as Array<{tier: string, quantity: string, price: string}>,
  });

  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Supplier-specific categories
  const categories = [
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
    "Plastics & Polymers",
  ];

  const complianceStandards = [
    "ISO 9001",
    "ISO 14001", 
    "CE Marking",
    "FDA Approved",
    "RoHS Compliant",
    "REACH Compliant",
    "GMP Certified",
    "HACCP",
    "Organic Certified",
    "Fair Trade",
    "ASTM Standards",
    "ANSI Standards",
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "Valid price is required";
    }

    if (!formData.quantity || parseInt(formData.quantity) < 0) {
      newErrors.quantity = "Valid quantity is required";
    }

    if (!formData.minimumOrderQuantity || parseInt(formData.minimumOrderQuantity) <= 0) {
      newErrors.minimumOrderQuantity = "Minimum order quantity is required";
    }

    if (formData.images.length === 0) {
      newErrors.images = "At least one product image is required";
    }

    if (!formData.origin) {
      newErrors.origin = "Country of origin is required for suppliers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const imageUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Simulate IPFS upload progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 50));
          setUploadProgress(progress);
        }

        // Create temporary URL for preview (in real app, this would be IPFS hash)
        const imageUrl = URL.createObjectURL(file);
        imageUrls.push(imageUrl);
        
        console.log(`File ${file.name} would be uploaded to IPFS`);
      }

      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...imageUrls],
      }));

      toast.success(`${files.length} image(s) uploaded to IPFS successfully`);
    } catch (error) {
      toast.error("Failed to upload images to IPFS");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const generateSKU = () => {
    const category = formData.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const supplierCode = user?.name?.substring(0, 2).toUpperCase() || "SP";
    const sku = `${supplierCode}-${category}-${timestamp}`;
    setFormData((prev) => ({ ...prev, sku }));
  };

  const addBulkPricingTier = () => {
    setFormData((prev) => ({
      ...prev,
      bulkPricing: [...prev.bulkPricing, { tier: "", quantity: "", price: "" }],
    }));
  };

  const updateBulkPricingTier = (index: number, field: string, value: string) => {
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

  const saveAsDraft = () => {
    const drafts = JSON.parse(localStorage.getItem("supplier_product_drafts") || "[]");
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
        dimensions: formData.dimensions,
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        tags: formData.tags,
        brand: formData.brand,
        model: formData.model,
        color: formData.color,
        material: formData.material,
        warranty: formData.warranty,
        certifications: formData.certifications,
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
      console.log("Product would be added to Hyperledger Fabric:", product);
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

  if (previewMode) {
    return (
      <div className="space-y-6">
        {/* Preview Header */}
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
              <h1 className="text-3xl font-bold">Supply Product Preview</h1>
              <p className="text-muted-foreground">
                Preview how your product will appear to vendors
              </p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isLoading ? "Adding to Supply Chain..." : "Publish to Supply Chain"}
          </Button>
        </div>

        {/* Product Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {formData.images.length > 0 ? (
                  <>
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={formData.images[0]}
                        alt={formData.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {formData.images.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {formData.images.slice(1).map((image, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-md overflow-hidden bg-muted"
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
                  </>
                ) : (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                    <Factory className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{formData.category}</Badge>
              <h1 className="text-3xl font-bold">{formData.name || "Product Name"}</h1>
              <p className="text-2xl font-bold text-primary mt-2">
                ${formData.price || "0.00"} per unit
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Min. order: {formData.minimumOrderQuantity || 1} units
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">
                {formData.description || "No description provided"}
              </p>
            </div>

            {formData.supplierNotes && (
              <div>
                <h3 className="font-semibold mb-2">Supplier Notes</h3>
                <p className="text-muted-foreground">{formData.supplierNotes}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              {formData.sku && (
                <div>
                  <span className="font-medium">SKU:</span> {formData.sku}
                </div>
              )}
              {formData.origin && (
                <div>
                  <span className="font-medium">Origin:</span> {formData.origin}
                </div>
              )}
              {formData.leadTime && (
                <div>
                  <span className="font-medium">Lead Time:</span> {formData.leadTime}
                </div>
              )}
              {formData.certifications && (
                <div>
                  <span className="font-medium">Certifications:</span> {formData.certifications}
                </div>
              )}
            </div>

            <div>
              <span className="font-medium">Available Stock:</span> {formData.quantity || 0} units
            </div>

            {formData.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add Supply Product</h1>
            <p className="text-muted-foreground">
              Add a new product to your supply catalog for vendors
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={saveAsDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
          <Button
            variant="outline"
            onClick={() => setPreviewMode(true)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the basic details of your supply product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter supply product name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Describe your supply product, its applications, and key features..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleInputChange("category", value)}
                  >
                    <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select supply category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="brand">Brand/Manufacturer</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange("brand", e.target.value)}
                    placeholder="Product brand or manufacturer"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model/Grade</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => handleInputChange("model", e.target.value)}
                    placeholder="Model number or grade specification"
                  />
                </div>

                <div>
                  <Label htmlFor="material">Material/Composition</Label>
                  <Input
                    id="material"
                    value={formData.material}
                    onChange={(e) => handleInputChange("material", e.target.value)}
                    placeholder="Primary material or composition"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Order Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Order Requirements</CardTitle>
              <CardDescription>
                Set your supply pricing and order requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="price">Unit Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.price}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="quantity">Available Stock *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    placeholder="0"
                    className={errors.quantity ? "border-red-500" : ""}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.quantity}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="minOrder">Min. Order Qty *</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    value={formData.minimumOrderQuantity}
                    onChange={(e) => handleInputChange("minimumOrderQuantity", e.target.value)}
                    placeholder="1"
                    className={errors.minimumOrderQuantity ? "border-red-500" : ""}
                  />
                  {errors.minimumOrderQuantity && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.minimumOrderQuantity}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="maxOrder">Max Order Qty</Label>
                  <Input
                    id="maxOrder"
                    type="number"
                    value={formData.maxOrderQuantity}
                    onChange={(e) => handleInputChange("maxOrderQuantity", e.target.value)}
                    placeholder="No limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="leadTime">Lead Time</Label>
                  <Input
                    id="leadTime"
                    value={formData.leadTime}
                    onChange={(e) => handleInputChange("leadTime", e.target.value)}
                    placeholder="e.g., 5-7 business days"
                  />
                </div>

                <div>
                  <Label htmlFor="sku">Supplier SKU</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      value={formData.sku}
                      onChange={(e) => handleInputChange("sku", e.target.value)}
                      placeholder="Auto-generated if empty"
                    />
                    <Button type="button" variant="outline" onClick={generateSKU}>
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="origin">Country of Origin *</Label>
                  <Input
                    id="origin"
                    value={formData.origin}
                    onChange={(e) => handleInputChange("origin", e.target.value)}
                    placeholder="e.g., Made in USA"
                    className={errors.origin ? "border-red-500" : ""}
                  />
                  {errors.origin && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.origin}
                    </p>
                  )}
                </div>
              </div>

              {/* Bulk Pricing */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Bulk Pricing Tiers (Optional)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBulkPricingTier}>
                    Add Tier
                  </Button>
                </div>
                {formData.bulkPricing.map((tier, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-end">
                    <Input
                      placeholder="Tier name"
                      value={tier.tier}
                      onChange={(e) => updateBulkPricingTier(index, "tier", e.target.value)}
                    />
                    <Input
                      placeholder="Min quantity"
                      type="number"
                      value={tier.quantity}
                      onChange={(e) => updateBulkPricingTier(index, "quantity", e.target.value)}
                    />
                    <Input
                      placeholder="Price per unit"
                      type="number"
                      step="0.01"
                      value={tier.price}
                      onChange={(e) => updateBulkPricingTier(index, "price", e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBulkPricingTier(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Physical Properties & Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Physical Properties & Specifications</CardTitle>
              <CardDescription>
                Specify technical details and physical characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="weight">Weight/Unit</Label>
                  <Input
                    id="weight"
                    value={formData.weight}
                    onChange={(e) => handleInputChange("weight", e.target.value)}
                    placeholder="e.g., 25 kg per unit"
                  />
                </div>

                <div>
                  <Label htmlFor="dimensions">Dimensions</Label>
                  <Input
                    id="dimensions"
                    value={formData.dimensions}
                    onChange={(e) => handleInputChange("dimensions", e.target.value)}
                    placeholder="L x W x H (cm)"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Color/Finish</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => handleInputChange("color", e.target.value)}
                    placeholder="e.g., Natural, Silver"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shelfLife">Shelf Life</Label>
                  <Input
                    id="shelfLife"
                    value={formData.shelfLife}
                    onChange={(e) => handleInputChange("shelfLife", e.target.value)}
                    placeholder="e.g., 2 years from manufacture"
                  />
                </div>

                <div>
                  <Label htmlFor="storage">Storage Conditions</Label>
                  <Input
                    id="storage"
                    value={formData.storageConditions}
                    onChange={(e) => handleInputChange("storageConditions", e.target.value)}
                    placeholder="e.g., Cool, dry place"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mfgDate">Manufacturing Date</Label>
                  <Input
                    id="mfgDate"
                    type="date"
                    value={formData.manufacturingDate}
                    onChange={(e) => handleInputChange("manufacturingDate", e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="expDate">Expiry Date (if applicable)</Label>
                  <Input
                    id="expDate"
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange("expiryDate", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance & Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance & Certifications
              </CardTitle>
              <CardDescription>
                Add certifications and compliance standards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => handleInputChange("certifications", e.target.value)}
                    placeholder="e.g., ISO 9001, CE, FDA"
                  />
                </div>

                <div>
                  <Label htmlFor="compliance">Compliance Standards</Label>
                  <Select
                    value={formData.complianceStandards}
                    onValueChange={(value) => handleInputChange("complianceStandards", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select compliance standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {complianceStandards.map((standard) => (
                        <SelectItem key={standard} value={standard}>
                          {standard}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="warranty">Warranty & Guarantees</Label>
                <Input
                  id="warranty"
                  value={formData.warranty}
                  onChange={(e) => handleInputChange("warranty", e.target.value)}
                  placeholder="e.g., 2 year manufacturer warranty"
                />
              </div>

              <div>
                <Label htmlFor="supplierNotes">Supplier Notes</Label>
                <Textarea
                  id="supplierNotes"
                  value={formData.supplierNotes}
                  onChange={(e) => handleInputChange("supplierNotes", e.target.value)}
                  placeholder="Additional notes for vendors about handling, applications, or special requirements..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tags & Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Tags & Keywords</CardTitle>
              <CardDescription>
                Add tags to help vendors find your supply products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag (e.g., raw-material, bulk, wholesale)..."
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                />
                <Button type="button" onClick={addTag}>
                  Add Tag
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Product Images *
              </CardTitle>
              <CardDescription>
                Upload high-quality images to IPFS storage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="text-sm">
                    <span className="font-medium">Click to upload to IPFS</span> or drag and drop
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB each
                  </div>
                </label>
              </div>

              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading to IPFS...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {errors.images && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.images}
                </p>
              )}

              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Publish to Supply Chain</CardTitle>
              <CardDescription>
                Add product to blockchain supply chain network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding to Supply Chain...
                      </>
                    ) : (
                      <>
                        <Factory className="h-4 w-4 mr-2" />
                        Add to Supply Chain
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Supply Chain Addition</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to add this product to the supply chain? This action will:
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• Create an immutable blockchain record</li>
                        <li>• Upload images to IPFS distributed storage</li>
                        <li>• Make the product available to vendors</li>
                        <li>• Enable supply chain tracking and traceability</li>
                      </ul>
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                      Confirm & Add to Supply Chain
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Images stored on IPFS network</p>
                <p>• Product data recorded on Hyperledger Fabric</p>
                <p>• Immutable supply chain tracking enabled</p>
                <p>• Smart contract automation activated</p>
              </div>
            </CardContent>
          </Card>

          {/* Supplier Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Supplier Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Provide accurate technical specifications</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Include all relevant certifications</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Set realistic minimum order quantities</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Specify accurate lead times</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Include country of origin information</p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p>Maintain current inventory levels</p>
              </div>
            </CardContent>
          </Card>

          {/* Blockchain Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Blockchain Integration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="font-medium text-foreground">What happens when you publish:</p>
                <div className="space-y-1">
                  <p>1. Product data is hashed and stored on Hyperledger Fabric</p>
                  <p>2. Images are uploaded to IPFS with content-addressed hashing</p>
                  <p>3. Smart contracts enable automated supply chain tracking</p>
                  <p>4. Vendors can discover and order your products</p>
                  <p>5. All transactions are immutably recorded</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}