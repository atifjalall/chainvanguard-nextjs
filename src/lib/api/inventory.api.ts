/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from "./client";
import {
  Inventory,
  InventoryFormData,
  InventoryListResponse,
  InventoryResponse,
  InventoryStatsResponse,
  AddStockRequest,
  ReduceStockRequest,
  ReserveStockRequest,
  TransferInventoryRequest,
  BatchData,
} from "@/types";

// CREATE INVENTORY
export async function createInventory(
  formData: InventoryFormData,
  files?: File[]
): Promise<InventoryResponse> {
  const data = new FormData();

  if (files && files.length > 0) {
    files.forEach((file) => {
      data.append("images", file);
    });
    console.log(`✅ Appending ${files.length} image files to FormData`, {
      fileNames: files.map((f) => f.name),
      fileSizes: files.map((f) => f.size),
    });
  } else {
    console.warn("⚠️  No image files to upload");
  }

  // Basic fields
  data.append("name", formData.name);
  data.append("description", formData.description);
  data.append("category", formData.category);
  data.append("subcategory", formData.subcategory);

  // Validate required fields before sending
  if (
    formData.pricePerUnit === undefined ||
    formData.pricePerUnit === null ||
    isNaN(Number(formData.pricePerUnit)) ||
    Number(formData.pricePerUnit) <= 0
  ) {
    throw new Error("Unit price is required");
  }
  data.append("pricePerUnit", formData.pricePerUnit.toString());
  data.append("currency", formData.currency);
  data.append("quantity", formData.quantity.toString());
  data.append("unit", formData.unit);
  data.append("minStockLevel", formData.minStockLevel.toString());
  data.append("reorderLevel", formData.reorderLevel.toString());
  data.append("reorderQuantity", formData.reorderQuantity.toString());
  data.append("sku", formData.sku);

  // Optional fields
  if (formData.materialType) data.append("materialType", formData.materialType);
  if (formData.costPrice)
    data.append("costPrice", formData.costPrice.toString());
  if (formData.qualityGrade) data.append("qualityGrade", formData.qualityGrade);
  if (formData.countryOfOrigin)
    data.append("countryOfOrigin", formData.countryOfOrigin);
  if (formData.season) data.append("season", formData.season);
  if (formData.status) data.append("status", formData.status);

  // ✅ WAREHOUSE LOCATION FIX
  if (formData.warehouseLocation) {
    // Send as defaultLocation (maps to primaryLocation in DB)
    data.append("defaultLocation", formData.warehouseLocation);

    // Send as storageLocations array (required structure)
    data.append(
      "storageLocations",
      JSON.stringify([
        {
          warehouse: formData.warehouseLocation,
          zone: "",
          aisle: "",
          rack: "",
          bin: "",
          quantityAtLocation: Number(formData.quantity) || 0,
          lastUpdated: new Date().toISOString(),
        },
      ])
    );
  }

  // Batch tracking fields
  if (formData.isBatchTracked !== undefined) {
    data.append("isBatchTracked", formData.isBatchTracked.toString());
  }
  if (formData.manufactureDate) {
    data.append("manufactureDate", formData.manufactureDate);
  }
  if (formData.expiryDate) {
    data.append("expiryDate", formData.expiryDate);
  }

  // Additional numeric fields
  if (formData.safetyStockLevel !== undefined) {
    data.append("safetyStockLevel", formData.safetyStockLevel.toString());
  }
  // Always append damagedQuantity, even if 0
  if (
    formData.damagedQuantity !== undefined &&
    formData.damagedQuantity !== null
  ) {
    data.append("damagedQuantity", formData.damagedQuantity.toString());
  }
  if (formData.shelfLife) {
    data.append("shelfLife", formData.shelfLife.toString());
  }
  if (formData.autoReorderEnabled !== undefined) {
    data.append("autoReorderEnabled", formData.autoReorderEnabled.toString());
  }

  // JSON objects
  if (formData.textileDetails) {
    data.append("textileDetails", JSON.stringify(formData.textileDetails));
  }
  if (formData.dimensions) {
    data.append("dimensions", JSON.stringify(formData.dimensions));
  }
  if (formData.specifications) {
    data.append("specifications", JSON.stringify(formData.specifications));
  }
  if (formData.supplierContact) {
    data.append("supplierContact", JSON.stringify(formData.supplierContact));
  }

  // Arrays
  if (formData.tags?.length) {
    data.append("tags", JSON.stringify(formData.tags));
  }
  if (formData.certifications?.length) {
    data.append("certifications", JSON.stringify(formData.certifications));
  }
  if (formData.suitableFor?.length) {
    data.append("suitableFor", JSON.stringify(formData.suitableFor));
  }

  // ❌ DO NOT append images array here - we already appended File objects above
  // The backend will process the files from req.files

  console.log("📤 Sending FormData to backend", {
    hasFiles: files && files.length > 0,
    fileCount: files?.length || 0,
    formDataKeys: Array.from(data.keys()),
  });

  return apiClient.post<InventoryResponse>("/inventory", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function getInventoryList(params?: {
  page?: number;
  limit?: number;
  category?: string;
  subcategory?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  minPrice?: number;
  maxPrice?: number;
  supplierId?: string;
}): Promise<InventoryListResponse> {
  const response = await apiClient.get<InventoryListResponse>("/inventory", {
    params,
  });
  // If response.data is paginated, return items directly for .filter() compatibility
  if ((response as any).data?.items) {
    return {
      ...response,
      data: (response as any).data.items,
      pagination: (response as any).data.pagination,
    };
  }
  return response;
}

export async function getInventoryById(id: string): Promise<InventoryResponse> {
  return apiClient.get<InventoryResponse>(`/inventory/${id}`);
}

export async function updateInventory(
  id: string,
  formData: Partial<InventoryFormData & { imagesToDelete?: string[] }>, // Add imagesToDelete
  files?: File[]
): Promise<InventoryResponse> {
  const data = new FormData();

  // Append all provided fields
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (key === "storageLocations") return;

      if (key === "imagesToDelete") {
        // Send imagesToDelete as JSON
        data.append(key, JSON.stringify(value));
        return;
      }

      if (typeof value === "object" && !Array.isArray(value)) {
        data.append(key, JSON.stringify(value));
      } else if (Array.isArray(value)) {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value.toString());
      }
    }
  });

  // Explicitly append manufactureDate and expiryDate if present (for safety)
  if (formData.manufactureDate)
    data.append("manufactureDate", formData.manufactureDate);
  if (formData.expiryDate) data.append("expiryDate", formData.expiryDate);

  if (formData.warehouseLocation) {
    data.append("defaultLocation", formData.warehouseLocation);
    const storageLocations = [
      {
        warehouse: formData.warehouseLocation,
        zone: "",
        aisle: "",
        rack: "",
        bin: "",
        quantityAtLocation: Number(formData.quantity) || 0,
        lastUpdated: new Date().toISOString(),
      },
    ];
    data.append("storageLocations", JSON.stringify(storageLocations));
  }

  // New image files
  if (files?.length) {
    files.forEach((file) => data.append("images", file));
  }

  return apiClient.put<InventoryResponse>(`/inventory/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deleteInventory(
  id: string
): Promise<{ success: boolean; message: string }> {
  return apiClient.delete(`/inventory/${id}`);
}

// STOCK MANAGEMENT
export async function addStock(
  id: string,
  request: AddStockRequest
): Promise<InventoryResponse> {
  return apiClient.post<InventoryResponse>(
    `/inventory/${id}/add-stock`,
    request
  );
}

export async function reduceStock(
  id: string,
  request: ReduceStockRequest
): Promise<InventoryResponse> {
  return apiClient.post<InventoryResponse>(
    `/inventory/${id}/reduce-stock`,
    request
  );
}

export async function reserveStock(
  id: string,
  request: ReserveStockRequest
): Promise<InventoryResponse> {
  return apiClient.post<InventoryResponse>(`/inventory/${id}/reserve`, request);
}

export async function releaseStock(
  id: string,
  quantity: number
): Promise<InventoryResponse> {
  return apiClient.post<InventoryResponse>(`/inventory/${id}/release`, {
    quantity,
  });
}

export async function transferInventory(
  id: string,
  request: TransferInventoryRequest
): Promise<InventoryResponse> {
  return apiClient.post<InventoryResponse>(
    `/inventory/${id}/transfer`,
    request
  );
}

// STATISTICS & ANALYTICS
export async function getInventoryStats(): Promise<InventoryStatsResponse> {
  return apiClient.get<InventoryStatsResponse>("/inventory/stats");
}

export async function getInventoryHistory(id: string): Promise<{
  success: boolean;
  movements: Array<{
    type: string;
    quantity: number;
    previousQuantity: number;
    newQuantity: number;
    performedBy: string;
    performedByRole: string;
    timestamp: string;
    notes?: string;
  }>;
}> {
  return apiClient.get(`/inventory/${id}/history`);
}

// QR CODE OPERATIONS
export async function generateInventoryQR(id: string): Promise<{
  success: boolean;
  qrCode: {
    qrCode: string;
    qrCodeImageUrl: string;
    ipfsHash: string;
    trackingUrl: string;
  };
  inventory: Inventory;
}> {
  return apiClient.post(`/inventory/${id}/generate-qr`);
}

export async function scanInventoryQR(
  qrCode: string,
  scanData?: {
    location?: {
      latitude?: number;
      longitude?: number;
      address?: string;
    };
    device?: string;
    purpose?: string;
    notes?: string;
  }
): Promise<{
  success: boolean;
  inventory: Inventory;
  qrData: {
    qrCode: string;
    type: string;
    inventoryId: string;
    generatedAt: string;
    trackingUrl: string;
  };
}> {
  return apiClient.post("/qr/inventory/scan", {
    qrCode,
    ...scanData,
  });
}

export async function trackInventoryByQR(qrCode: string): Promise<{
  success: boolean;
  inventory: Inventory;
  tracking: {
    totalScans: number;
    lastScanned?: string;
    scanHistory: Array<{
      scannedAt: string;
      scannedBy?: string;
      location?: any;
      device?: string;
      purpose?: string;
    }>;
  };
}> {
  return apiClient.get(`/qr/inventory/track/${qrCode}`);
}

// QUALITY CHECKS
export async function addQualityCheck(
  id: string,
  checkData: {
    batchNumber?: string;
    checkedQuantity: number;
    passedQuantity?: number;
    rejectedQuantity?: number;
    qualityScore?: number;
    findings?: string;
    defectTypes?: string[];
    status: "passed" | "failed" | "conditional";
    images?: File[];
  }
): Promise<InventoryResponse> {
  const data = new FormData();

  data.append("checkedQuantity", checkData.checkedQuantity.toString());
  data.append("status", checkData.status);

  if (checkData.batchNumber) data.append("batchNumber", checkData.batchNumber);
  if (checkData.passedQuantity)
    data.append("passedQuantity", checkData.passedQuantity.toString());
  if (checkData.rejectedQuantity)
    data.append("rejectedQuantity", checkData.rejectedQuantity.toString());
  if (checkData.qualityScore)
    data.append("qualityScore", checkData.qualityScore.toString());
  if (checkData.findings) data.append("findings", checkData.findings);
  if (checkData.defectTypes?.length) {
    data.append("defectTypes", JSON.stringify(checkData.defectTypes));
  }

  if (checkData.images?.length) {
    checkData.images.forEach((file) => data.append("images", file));
  }

  return apiClient.post<InventoryResponse>(
    `/inventory/${id}/quality-check`,
    data,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
}

// GET INVENTORY BY ID FOR DETAIL PAGE
export async function getInventoryDetail(id: string): Promise<{
  success: boolean;
  data: Inventory;
}> {
  const response = await apiClient.get<{
    success: boolean;
    data: Inventory;
  }>(`/inventory/${id}`);
  return response;
}

// INVENTORY PAGE SPECIFIC
export async function getSupplierInventory(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<InventoryListResponse> {
  const response = await apiClient.get<InventoryListResponse>("/inventory", {
    params,
  });
  if ((response as any).data?.items) {
    return {
      ...response,
      data: (response as any).data.items,
      pagination: (response as any).data.pagination,
    };
  }
  return response;
}

export async function updateInventoryQuantity(
  id: string,
  data: {
    quantity: number;
    reason?: string;
    notes?: string;
  }
): Promise<InventoryResponse> {
  return apiClient.patch<InventoryResponse>(
    `/inventory/${id}/adjust-quantity`,
    data
  );
}

// BATCH OPERATIONS
export async function getBatchDetails(
  id: string,
  batchNumber: string
): Promise<{
  success: boolean;
  batch: BatchData;
}> {
  return apiClient.get(`/inventory/${id}/batch/${batchNumber}`);
}

// EXPORT FUNCTIONS
export default {
  createInventory,
  getInventoryList,
  getInventoryById,
  updateInventory,
  deleteInventory,
  addStock,
  reduceStock,
  reserveStock,
  releaseStock,
  transferInventory,
  getInventoryStats,
  getInventoryHistory,
  generateInventoryQR,
  scanInventoryQR,
  trackInventoryByQR,
  addQualityCheck,
  getBatchDetails,
  getSupplierInventory,
  updateInventoryQuantity,
};
