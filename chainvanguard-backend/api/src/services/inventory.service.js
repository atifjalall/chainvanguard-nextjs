import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Notification from "../models/Notifications.js";
import User from "../models/User.js";
import fabricService from "./fabric.service.js";
import ipfsService from "./ipfs.service.js";
import cloudinaryService from "./cloudinary.service.js";
import qrService from "./qr.service.js";
import redisService from "./redis.service.js";
import logger from "../utils/logger.js";
import crypto from "crypto";

/**
 * Cache Key Strategy:
 * - inventory:item:{id} - Single item cache
 * - inventory:list:{supplierId}:{filters_hash} - List cache per supplier
 * - inventory:stats:{supplierId} - Stats cache per supplier
 * - inventory:analytics:{supplierId} - Analytics cache per supplier
 */

class InventoryService {
  // ========================================
  // HELPER: Generate consistent cache keys
  // ========================================
  generateListCacheKey(filters = {}, options = {}) {
    const {
      supplierId,
      category,
      subcategory,
      status,
      minPrice,
      maxPrice,
      search,
      lowStock,
    } = filters;
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    // Create a deterministic hash of filters
    const filterKey = JSON.stringify({
      supplierId,
      category,
      subcategory,
      status,
      minPrice,
      maxPrice,
      search,
      lowStock,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const hash = crypto
      .createHash("md5")
      .update(filterKey)
      .digest("hex")
      .substring(0, 8);

    return `inventory:list:${supplierId || "all"}:${hash}`;
  }

  // ========================================
  // HELPER: Invalidate all related caches
  // ========================================
  async invalidateInventoryCaches(supplierId = null, inventoryId = null) {
    try {
      const keysToDelete = [];

      // 1. Invalidate specific item cache
      if (inventoryId) {
        keysToDelete.push(`inventory:item:${inventoryId}`);
      }

      // 2. Invalidate all list caches for this supplier
      if (supplierId) {
        const listKeys = await redisService.keys(
          `inventory:list:${supplierId}:*`
        );
        keysToDelete.push(...listKeys);

        // Also invalidate 'all' lists since they include this supplier's items
        const allListKeys = await redisService.keys(`inventory:list:all:*`);
        keysToDelete.push(...allListKeys);

        // Invalidate stats and analytics
        keysToDelete.push(
          `inventory:stats:${supplierId}`,
          `inventory:analytics:${supplierId}`
        );
      }

      // 3. Invalidate global stats
      keysToDelete.push("inventory:stats:global");

      // 4. Delete all keys in parallel
      if (keysToDelete.length > 0) {
        const uniqueKeys = [...new Set(keysToDelete)];
        await Promise.all(uniqueKeys.map((key) => redisService.del(key)));
        logger.info(`✅ Invalidated ${uniqueKeys.length} cache keys`);
      }

      return true;
    } catch (error) {
      logger.error("❌ Error invalidating caches:", error);
      // Don't throw - cache invalidation failure shouldn't break operations
      return false;
    }
  }

  // ========================================
  // CREATE INVENTORY ITEM (FIXED)
  // ========================================
  async createInventoryItem(data, userId, files = {}) {
    try {
      logger.info("Creating new inventory item", { userId, name: data.name });

      // Validate supplier
      const supplier = await User.findById(userId);
      if (!supplier || supplier.role !== "supplier") {
        throw new Error("Only suppliers can create inventory items");
      }

      // Process images
      let images = [];
      if (data.images && Array.isArray(data.images) && data.images.length > 0) {
        images = data.images;
        logger.info(`✅ Using ${images.length} pre-processed images from data`);
      } else {
        logger.warn("⚠️  No images provided in inventory data");
        images = [];
      }

      // Handle documents
      let documents = [];
      if (files.documents && files.documents.length > 0) {
        try {
          for (let i = 0; i < files.documents.length; i++) {
            const doc = files.documents[i];
            const result = await cloudinaryService.uploadDocument(
              doc.buffer,
              doc.originalname,
              "inventory/documents"
            );
            documents.push({
              name:
                data.documentNames?.[i] ||
                doc.originalname ||
                `Document ${i + 1}`,
              url: result.url,
              type: data.documentTypes?.[i] || "specification",
              uploadedAt: new Date(),
            });
          }
        } catch (uploadError) {
          logger.error("❌ Document upload failed:", uploadError);
        }
      }

      // Prepare inventory data (existing code...)
      let damagedQuantity = 0;
      if (
        data.damagedQuantity !== undefined &&
        data.damagedQuantity !== null &&
        data.damagedQuantity !== ""
      ) {
        const parsed = parseInt(data.damagedQuantity);
        damagedQuantity = isNaN(parsed) ? 0 : parsed;
      }

      const inventoryData = {
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        materialType: data.materialType || "Raw Material",
        brand: data.brand || "",
        textileDetails: {
          fabricType: data.textileDetails?.fabricType || "",
          composition: data.textileDetails?.composition || "",
          gsm: data.textileDetails?.gsm
            ? parseInt(data.textileDetails.gsm)
            : undefined,
          width: data.textileDetails?.width
            ? parseInt(data.textileDetails.width)
            : undefined,
          fabricWeight: data.textileDetails?.fabricWeight || "",
          color: data.textileDetails?.color || "",
          colorCode: data.textileDetails?.colorCode || "",
          pattern: data.textileDetails?.pattern || "Solid",
          finish: data.textileDetails?.finish || "",
          careInstructions: data.textileDetails?.careInstructions || "",
          shrinkage: data.textileDetails?.shrinkage || "",
          washability: data.textileDetails?.washability || "",
        },
        pricePerUnit: parseFloat(data.pricePerUnit),
        costPrice: data.costPrice ? parseFloat(data.costPrice) : 0,
        originalPrice: data.originalPrice
          ? parseFloat(data.originalPrice)
          : undefined,
        discount: data.discount ? parseFloat(data.discount) : 0,
        quantity: parseInt(data.quantity),
        reservedQuantity: data.reservedQuantity
          ? parseInt(data.reservedQuantity)
          : 0,
        committedQuantity: data.committedQuantity
          ? parseInt(data.committedQuantity)
          : 0,
        damagedQuantity: damagedQuantity,
        minStockLevel: parseInt(data.minStockLevel || 10),
        reorderLevel: parseInt(data.reorderLevel || 20),
        reorderQuantity: parseInt(data.reorderQuantity || 50),
        maximumQuantity: data.maximumQuantity
          ? parseInt(data.maximumQuantity)
          : undefined,
        safetyStockLevel: parseInt(data.safetyStockLevel || 15),
        unit: data.unit || "pieces",
        sku: data.sku || `INV-${Date.now().toString(36).toUpperCase()}`,
        images: images,
        documents: documents,
        weight: data.weight ? parseFloat(data.weight) : undefined,
        dimensions: data.dimensions || "",
        tags: data.tags || [],
        season: data.season || "All Season",
        countryOfOrigin: data.countryOfOrigin || "",
        manufacturer: data.manufacturer || "",
        supplierId: userId,
        supplierName: supplier.name || supplier.email,
        supplierWalletAddress: supplier.walletAddress || "",
        supplierContact: {
          phone: data.supplierContact?.phone || "",
          email: data.supplierContact?.email || supplier.email || "",
          address: data.supplierContact?.address || "",
        },
        status: data.status || "active",
        isVerified: false,
        isFeatured: false,
        isSustainable: data.isSustainable || false,
        certifications: data.certifications || [],
        sustainabilityCertifications: data.sustainabilityCertifications || [],
        complianceStandards: data.complianceStandards || [],
        qualityGrade: data.qualityGrade || "",
        leadTime: data.leadTime ? parseInt(data.leadTime) : 7,
        estimatedDeliveryDays: data.estimatedDeliveryDays
          ? parseInt(data.estimatedDeliveryDays)
          : 7,
        shelfLife: data.shelfLife ? parseInt(data.shelfLife) : undefined,
        storageLocations:
          data.storageLocations ||
          (data.defaultLocation
            ? [
                {
                  warehouse: data.defaultLocation,
                  zone: "",
                  aisle: "",
                  rack: "",
                  bin: "",
                  quantityAtLocation: parseInt(data.quantity) || 0,
                  lastUpdated: new Date(),
                },
              ]
            : []),
        primaryLocation: data.defaultLocation || "",
        notes: data.notes || "",
        internalCode: data.internalCode || "",
        barcode: data.barcode || "",
        carbonFootprint: data.carbonFootprint
          ? parseFloat(data.carbonFootprint)
          : undefined,
        recycledContent: data.recycledContent
          ? parseFloat(data.recycledContent)
          : undefined,
        autoReorderEnabled: data.autoReorderEnabled || false,
        isBatchTracked: data.isBatchTracked || false,
        specifications: data.specifications || {},
        suitableFor: data.suitableFor || [],
      };

      // Batch tracking
      if (data.isBatchTracked !== false) {
        const batchNumber = `${(data.category || "INV").toUpperCase().substring(0, 3)}-${(data.name || "ITEM").toUpperCase().substring(0, 4).replace(/\s+/g, "")}-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

        // Validate manufactureDate and expiryDate
        let manufactureDate = undefined;
        let expiryDate = undefined;
        if (data.manufactureDate && !isNaN(Date.parse(data.manufactureDate))) {
          manufactureDate = new Date(data.manufactureDate);
        }
        if (data.expiryDate && !isNaN(Date.parse(data.expiryDate))) {
          expiryDate = new Date(data.expiryDate);
        } else if (data.shelfLife) {
          expiryDate = new Date(
            Date.now() + data.shelfLife * 24 * 60 * 60 * 1000
          );
        }

        inventoryData.batches = [
          {
            batchNumber: batchNumber,
            quantity: parseInt(data.quantity),
            manufactureDate: manufactureDate,
            expiryDate: expiryDate,
            receivedDate: new Date(),
            supplierName: supplier.name || supplier.email || "",
            costPerUnit: data.costPrice
              ? parseFloat(data.costPrice)
              : parseFloat(data.pricePerUnit),
            status: "available",
            blockchainBatchId: "",
          },
        ];
      } else {
        inventoryData.batches = [];
      }

      // Create inventory
      const inventory = await Inventory.create(inventoryData);
      logger.info("✅ Inventory created in database", {
        inventoryId: inventory._id,
      });

      // IPFS upload - ALL crucial data
      try {
        const ipfsMetadata = {
          // Basic Info
          inventoryId: inventory._id.toString(),
          name: inventory.name,
          description: inventory.description,
          category: inventory.category,
          subcategory: inventory.subcategory,
          materialType: inventory.materialType,
          brand: inventory.brand,

          // Textile Details (ALL fields)
          textileDetails: {
            fabricType: inventory.textileDetails?.fabricType || "",
            composition: inventory.textileDetails?.composition || "",
            gsm: inventory.textileDetails?.gsm,
            width: inventory.textileDetails?.width,
            fabricWeight: inventory.textileDetails?.fabricWeight || "",
            color: inventory.textileDetails?.color || "",
            colorCode: inventory.textileDetails?.colorCode || "",
            pattern: inventory.textileDetails?.pattern || "",
            finish: inventory.textileDetails?.finish || "",
            careInstructions: inventory.textileDetails?.careInstructions || "",
            shrinkage: inventory.textileDetails?.shrinkage || "",
            washability: inventory.textileDetails?.washability || "",
          },

          // Pricing & Quantity
          pricePerUnit: inventory.pricePerUnit,
          costPrice: inventory.costPrice,
          originalPrice: inventory.originalPrice,
          discount: inventory.discount,
          quantity: inventory.quantity,
          reservedQuantity: inventory.reservedQuantity,
          committedQuantity: inventory.committedQuantity,
          damagedQuantity: inventory.damagedQuantity,

          // Stock Management
          minStockLevel: inventory.minStockLevel,
          reorderLevel: inventory.reorderLevel,
          reorderQuantity: inventory.reorderQuantity,
          maximumQuantity: inventory.maximumQuantity,
          safetyStockLevel: inventory.safetyStockLevel,
          unit: inventory.unit,
          sku: inventory.sku,

          // Media & Documents
          images: inventory.images.map(img => ({
            url: img.url,
            isMain: img.isMain,
            viewType: img.viewType
          })),
          documents: inventory.documents.map(doc => ({
            name: doc.name,
            url: doc.url,
            type: doc.type,
            uploadedAt: doc.uploadedAt
          })),

          // Physical Properties
          weight: inventory.weight,
          dimensions: inventory.dimensions,

          // Metadata
          tags: inventory.tags,
          season: inventory.season,
          countryOfOrigin: inventory.countryOfOrigin,
          manufacturer: inventory.manufacturer,

          // Supplier Info
          supplierId: inventory.supplierId.toString(),
          supplierName: inventory.supplierName,
          supplierWalletAddress: inventory.supplierWalletAddress,
          supplierContact: {
            phone: inventory.supplierContact?.phone || "",
            email: inventory.supplierContact?.email || "",
            address: inventory.supplierContact?.address || "",
          },

          // Status & Verification
          status: inventory.status,
          isVerified: inventory.isVerified,
          isFeatured: inventory.isFeatured,

          // Sustainability & Compliance
          isSustainable: inventory.isSustainable,
          certifications: inventory.certifications || [],
          sustainabilityCertifications: inventory.sustainabilityCertifications || [],
          complianceStandards: inventory.complianceStandards || [],
          qualityGrade: inventory.qualityGrade,
          carbonFootprint: inventory.carbonFootprint,
          recycledContent: inventory.recycledContent,

          // Delivery & Storage
          leadTime: inventory.leadTime,
          estimatedDeliveryDays: inventory.estimatedDeliveryDays,
          shelfLife: inventory.shelfLife,
          storageLocations: inventory.storageLocations.map(loc => ({
            warehouse: loc.warehouse,
            zone: loc.zone,
            aisle: loc.aisle,
            rack: loc.rack,
            bin: loc.bin,
            quantityAtLocation: loc.quantityAtLocation,
            lastUpdated: loc.lastUpdated
          })),
          primaryLocation: inventory.primaryLocation,

          // Additional Info
          notes: inventory.notes,
          internalCode: inventory.internalCode,
          barcode: inventory.barcode,
          autoReorderEnabled: inventory.autoReorderEnabled,

          // Batch Tracking
          isBatchTracked: inventory.isBatchTracked,
          batches: inventory.batches.map(batch => ({
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            receivedDate: batch.receivedDate,
            supplierName: batch.supplierName,
            costPerUnit: batch.costPerUnit,
            status: batch.status
          })),

          // Specifications & Suitability
          specifications: inventory.specifications,
          suitableFor: inventory.suitableFor,

          // Timestamps
          createdAt: inventory.createdAt,
          updatedAt: inventory.updatedAt
        };

        const ipfsFileName = `inventory-metadata-${inventory._id.toString()}.json`;
        const ipfsResult = await ipfsService.uploadJSON(
          ipfsMetadata,
          ipfsFileName
        );

        if (ipfsResult.success) {
          inventory.ipfsHash = ipfsResult.ipfsHash;
          logger.info("✅ ALL inventory data uploaded to IPFS", { ipfsHash: ipfsResult.ipfsHash });
        }
      } catch (ipfsError) {
        logger.error("❌ IPFS upload error:", ipfsError);
        inventory.ipfsHash = "";
      }

      // Blockchain storage - ALL crucial data
      try {
        const blockchainData = {
          // Basic Info
          inventoryId: inventory._id.toString(),
          name: inventory.name,
          description: inventory.description,
          category: inventory.category,
          subcategory: inventory.subcategory,
          materialType: inventory.materialType,
          brand: inventory.brand,

          // Textile Details
          textileDetails: {
            fabricType: inventory.textileDetails?.fabricType || "",
            composition: inventory.textileDetails?.composition || "",
            gsm: inventory.textileDetails?.gsm,
            width: inventory.textileDetails?.width,
            fabricWeight: inventory.textileDetails?.fabricWeight || "",
            color: inventory.textileDetails?.color || "",
            colorCode: inventory.textileDetails?.colorCode || "",
            pattern: inventory.textileDetails?.pattern || "",
            finish: inventory.textileDetails?.finish || "",
            careInstructions: inventory.textileDetails?.careInstructions || "",
            shrinkage: inventory.textileDetails?.shrinkage || "",
            washability: inventory.textileDetails?.washability || "",
          },

          // Pricing & Quantity
          pricePerUnit: inventory.pricePerUnit,
          costPrice: inventory.costPrice,
          originalPrice: inventory.originalPrice,
          discount: inventory.discount,
          quantity: inventory.quantity,
          reservedQuantity: inventory.reservedQuantity,
          committedQuantity: inventory.committedQuantity,
          damagedQuantity: inventory.damagedQuantity,

          // Stock Management
          minStockLevel: inventory.minStockLevel,
          reorderLevel: inventory.reorderLevel,
          reorderQuantity: inventory.reorderQuantity,
          maximumQuantity: inventory.maximumQuantity,
          safetyStockLevel: inventory.safetyStockLevel,
          unit: inventory.unit,
          sku: inventory.sku,

          // Media URLs (storing URLs, not full data)
          images: inventory.images.map(img => img.url),
          documents: inventory.documents.map(doc => ({
            name: doc.name,
            url: doc.url,
            type: doc.type
          })),

          // Physical Properties
          weight: inventory.weight,
          dimensions: inventory.dimensions,

          // Metadata
          tags: inventory.tags,
          season: inventory.season,
          countryOfOrigin: inventory.countryOfOrigin,
          manufacturer: inventory.manufacturer,

          // Supplier Info
          supplierId: userId,
          supplierName: supplier.name || supplier.email,
          supplierWalletAddress: inventory.supplierWalletAddress,
          supplierContact: {
            phone: inventory.supplierContact?.phone || "",
            email: inventory.supplierContact?.email || "",
            address: inventory.supplierContact?.address || "",
          },

          // Status & Verification
          status: inventory.status,
          isVerified: inventory.isVerified,
          isFeatured: inventory.isFeatured,

          // Sustainability & Compliance
          isSustainable: inventory.isSustainable,
          certifications: inventory.certifications || [],
          sustainabilityCertifications: inventory.sustainabilityCertifications || [],
          complianceStandards: inventory.complianceStandards || [],
          qualityGrade: inventory.qualityGrade,
          carbonFootprint: inventory.carbonFootprint,
          recycledContent: inventory.recycledContent,

          // Delivery & Storage
          leadTime: inventory.leadTime,
          estimatedDeliveryDays: inventory.estimatedDeliveryDays,
          shelfLife: inventory.shelfLife,
          storageLocations: inventory.storageLocations.map(loc => ({
            warehouse: loc.warehouse,
            zone: loc.zone,
            aisle: loc.aisle,
            rack: loc.rack,
            bin: loc.bin,
            quantityAtLocation: loc.quantityAtLocation
          })),
          primaryLocation: inventory.primaryLocation,

          // Additional Info
          notes: inventory.notes,
          internalCode: inventory.internalCode,
          barcode: inventory.barcode,
          autoReorderEnabled: inventory.autoReorderEnabled,

          // Batch Tracking
          isBatchTracked: inventory.isBatchTracked,
          batches: inventory.batches.map(batch => ({
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            supplierName: batch.supplierName,
            costPerUnit: batch.costPerUnit,
            status: batch.status
          })),

          // Specifications & Suitability
          specifications: inventory.specifications,
          suitableFor: inventory.suitableFor,

          // IPFS Reference & Timestamp
          ipfsHash: inventory.ipfsHash || "",
          timestamp: new Date().toISOString(),
        };

        const blockchainResult = await fabricService.invoke(
          "inventory",
          "createInventoryItem",
          JSON.stringify(blockchainData)
        );

        if (typeof blockchainResult === "string") {
          inventory.blockchainInventoryId = blockchainResult;
          inventory.fabricTransactionId = blockchainResult;
        } else if (blockchainResult && blockchainResult.txId) {
          inventory.blockchainInventoryId = blockchainResult.txId;
          inventory.fabricTransactionId = blockchainResult.txId;
        }

        inventory.blockchainVerified = true;
        await inventory.save();
        logger.info("✅ ALL inventory data stored on blockchain", {
          txId: inventory.fabricTransactionId,
          ipfsHash: inventory.ipfsHash
        });
      } catch (blockchainError) {
        logger.warn("⚠️ Blockchain storage failed", {
          error: blockchainError.message,
        });
        inventory.blockchainVerified = false;
        await inventory.save();
      }

      // Generate QR code (background)
      if (inventory._id) {
        this.generateInventoryQR(inventory._id.toString(), userId).catch(
          (error) => {
            logger.error(`⚠️ QR generation failed:`, error.message);
          }
        );
      }

      // Create notification
      try {
        await this.createNotification({
          userId,
          userRole: "supplier",
          type: "stock_updated",
          category: "inventory",
          title: "Inventory Item Created",
          message: `New inventory item "${inventory.name}" has been created successfully.`,
          inventoryId: inventory._id,
          priority: "medium",
        });
      } catch (notifError) {
        logger.error("❌ Notification creation failed:", notifError);
      }

      // ✅ CRITICAL: Invalidate caches AFTER successful creation
      await this.invalidateInventoryCaches(userId, inventory._id.toString());

      logger.info("✅ Inventory item created successfully", {
        inventoryId: inventory._id,
        name: inventory.name,
        sku: inventory.sku,
      });

      return inventory;
    } catch (error) {
      logger.error("❌ Error creating inventory item:", error);
      throw error;
    }
  }

  // ========================================
  // GET ALL INVENTORY ITEMS (FIXED)
  // ========================================
  async getAllInventory(filters = {}, options = {}) {
    try {
      const {
        supplierId,
        category,
        subcategory,
        status,
        minPrice,
        maxPrice,
        search,
        lowStock,
      } = filters;

      const {
        page = 1,
        limit = 20,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      // Build query
      const query = {};

      if (supplierId) query.supplierId = supplierId;
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;

      // ✅ FIX: Always exclude discontinued items unless explicitly requested
      if (status) {
        query.status = status;
      } else {
        query.status = { $ne: "discontinued" };
      }

      if (minPrice || maxPrice) {
        query.pricePerUnit = {};
        if (minPrice) query.pricePerUnit.$gte = Number(minPrice);
        if (maxPrice) query.pricePerUnit.$lte = Number(maxPrice);
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { sku: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ];
      }

      if (lowStock === "true") {
        query.$expr = {
          $lte: [
            {
              $subtract: [
                "$quantity",
                { $add: ["$reservedQuantity", "$committedQuantity"] },
              ],
            },
            "$reorderLevel",
          ],
        };
      }

      // Generate cache key
      const cacheKey = this.generateListCacheKey(filters, options);

      // Try cache first
      const cached = await redisService.get(cacheKey);
      if (cached) {
        logger.info("✅ Returning cached inventory list", { cacheKey });
        return cached;
      }

      // Pagination
      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

      // Execute query
      const [items, total] = await Promise.all([
        Inventory.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate("supplierId", "name email companyName")
          .lean(),
        Inventory.countDocuments(query),
      ]);

      const result = {
        items,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };

      // Cache for 5 minutes (this is fine since we invalidate on changes)
      await redisService.set(cacheKey, result, 300);

      logger.info(`✅ Fetched ${items.length} inventory items from database`);

      return result;
    } catch (error) {
      logger.error("Error fetching inventory:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY BY ID (FIXED)
  // ========================================
  async getInventoryById(inventoryId) {
    try {
      const cacheKey = `inventory:item:${inventoryId}`;

      // Try cache first
      const cached = await redisService.get(cacheKey);
      if (cached) {
        logger.info("✅ Returning cached inventory item", { inventoryId });
        return cached;
      }

      const inventory = await Inventory.findById(inventoryId)
        .populate("supplierId", "name email companyName phone")
        .lean();

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Cache for 10 minutes
      await redisService.set(cacheKey, inventory, 600);

      logger.info(`✅ Fetched inventory ${inventoryId} from database`);

      return inventory;
    } catch (error) {
      logger.error("Error fetching inventory by ID:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE INVENTORY ITEM (FIXED)
  // ========================================
  async updateInventoryItem(inventoryId, userId, updates, files = {}) {
    try {
      logger.info("Updating inventory item", {
        inventoryId,
        userId,
        hasManufactureDate: !!updates.manufactureDate,
        hasExpiryDate: !!updates.expiryDate,
        manufactureDateValue: updates.manufactureDate,
        expiryDateValue: updates.expiryDate,
      });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      if (inventory.supplierId.toString() !== userId) {
        throw new Error("Unauthorized to update this inventory item");
      }

      // Handle deleting existing images
      if (updates.imagesToDelete && Array.isArray(updates.imagesToDelete)) {
        for (const imageUrl of updates.imagesToDelete) {
          const imageToDelete = inventory.images.find(
            (img) => img.url === imageUrl
          );
          if (imageToDelete) {
            // Delete from Cloudinary
            try {
              await cloudinaryService.deleteImage(imageToDelete.cloudinaryId);
            } catch (deleteError) {
              logger.warn(
                "Failed to delete image from Cloudinary:",
                deleteError
              );
            }
            // Remove from inventory
            inventory.images = inventory.images.filter(
              (img) => img.url !== imageUrl
            );
          }
        }
      }

      // Handle new image uploads
      if (files.images && files.images.length > 0) {
        const uploadResults = await cloudinaryService.uploadMultipleImages(
          files.images,
          "inventory"
        );
        const newImages = uploadResults.map((result, index) => ({
          url: result.url,
          cloudinaryId: result.publicId,
          publicId: result.publicId,
          isMain: inventory.images.length === 0 && index === 0,
          viewType:
            inventory.images.length === 0 && index === 0 ? "front" : "detail",
        }));
        inventory.images.push(...newImages);
      }

      // Handle new documents
      if (files.documents && files.documents.length > 0) {
        try {
          for (let i = 0; i < files.documents.length; i++) {
            const doc = files.documents[i];
            const result = await cloudinaryService.uploadDocument(
              doc.buffer,
              doc.originalname,
              "inventory/documents"
            );
            inventory.documents.push({
              name:
                updates.documentNames?.[i] ||
                doc.originalname ||
                `Document ${i + 1}`,
              url: result.url,
              type: updates.documentTypes?.[i] || "specification",
              uploadedAt: new Date(),
            });
          }
        } catch (uploadError) {
          logger.error("❌ Document upload failed:", uploadError);
        }
      }

      // Update fields
      Object.keys(updates).forEach((key) => {
        if (
          key !== "images" &&
          key !== "documents" &&
          key !== "documentNames" &&
          key !== "documentTypes"
        ) {
          inventory[key] = updates[key];
        }
      });

      // Explicitly update manufactureDate and expiryDate if present and valid
      if (
        updates.manufactureDate &&
        !isNaN(Date.parse(updates.manufactureDate))
      ) {
        inventory.manufactureDate = updates.manufactureDate;
      }
      if (updates.expiryDate && !isNaN(Date.parse(updates.expiryDate))) {
        inventory.expiryDate = updates.expiryDate;
      }

      // If batch-tracked, also update batch dates if needed and valid
      if (
        inventory.isBatchTracked &&
        Array.isArray(inventory.batches) &&
        inventory.batches.length > 0
      ) {
        logger.info("📅 Updating batch dates", {
          isBatchTracked: inventory.isBatchTracked,
          hasBatches: inventory.batches.length > 0,
          manufactureDate: updates.manufactureDate,
          expiryDate: updates.expiryDate,
          oldManufactureDate: inventory.batches[0].manufactureDate,
          oldExpiryDate: inventory.batches[0].expiryDate,
        });

        if (
          updates.manufactureDate &&
          !isNaN(Date.parse(updates.manufactureDate))
        ) {
          inventory.batches[0].manufactureDate = new Date(
            updates.manufactureDate
          );
          logger.info("✅ Updated manufactureDate in batch[0]", {
            newDate: inventory.batches[0].manufactureDate,
          });
        }
        if (updates.expiryDate && !isNaN(Date.parse(updates.expiryDate))) {
          inventory.batches[0].expiryDate = new Date(updates.expiryDate);
          logger.info("✅ Updated expiryDate in batch[0]", {
            newDate: inventory.batches[0].expiryDate,
          });
        }
      } else {
        logger.warn("⚠️  Cannot update batch dates", {
          isBatchTracked: inventory.isBatchTracked,
          hasBatches: inventory.batches?.length > 0,
          batchCount: inventory.batches?.length || 0,
        });
      }

      // Track quantity changes
      if (updates.quantity !== undefined) {
        const quantityDiff = updates.quantity - inventory.quantity;
        inventory.addMovement("adjustment", quantityDiff, userId, "supplier", {
          reason: updates.adjustmentReason || "Manual adjustment",
        });
      }

      await inventory.save();

      // Update IPFS - ALL crucial data
      try {
        const ipfsMetadata = {
          // Basic Info
          inventoryId: inventory._id.toString(),
          name: inventory.name,
          description: inventory.description,
          category: inventory.category,
          subcategory: inventory.subcategory,
          materialType: inventory.materialType,
          brand: inventory.brand,

          // Textile Details (ALL fields)
          textileDetails: {
            fabricType: inventory.textileDetails?.fabricType || "",
            composition: inventory.textileDetails?.composition || "",
            gsm: inventory.textileDetails?.gsm,
            width: inventory.textileDetails?.width,
            fabricWeight: inventory.textileDetails?.fabricWeight || "",
            color: inventory.textileDetails?.color || "",
            colorCode: inventory.textileDetails?.colorCode || "",
            pattern: inventory.textileDetails?.pattern || "",
            finish: inventory.textileDetails?.finish || "",
            careInstructions: inventory.textileDetails?.careInstructions || "",
            shrinkage: inventory.textileDetails?.shrinkage || "",
            washability: inventory.textileDetails?.washability || "",
          },

          // Pricing & Quantity
          pricePerUnit: inventory.pricePerUnit,
          costPrice: inventory.costPrice,
          originalPrice: inventory.originalPrice,
          discount: inventory.discount,
          quantity: inventory.quantity,
          reservedQuantity: inventory.reservedQuantity,
          committedQuantity: inventory.committedQuantity,
          damagedQuantity: inventory.damagedQuantity,

          // Stock Management
          minStockLevel: inventory.minStockLevel,
          reorderLevel: inventory.reorderLevel,
          reorderQuantity: inventory.reorderQuantity,
          maximumQuantity: inventory.maximumQuantity,
          safetyStockLevel: inventory.safetyStockLevel,
          unit: inventory.unit,
          sku: inventory.sku,

          // Media & Documents
          images: inventory.images.map(img => ({
            url: img.url,
            isMain: img.isMain,
            viewType: img.viewType
          })),
          documents: inventory.documents.map(doc => ({
            name: doc.name,
            url: doc.url,
            type: doc.type,
            uploadedAt: doc.uploadedAt
          })),

          // Physical Properties
          weight: inventory.weight,
          dimensions: inventory.dimensions,

          // Metadata
          tags: inventory.tags,
          season: inventory.season,
          countryOfOrigin: inventory.countryOfOrigin,
          manufacturer: inventory.manufacturer,

          // Supplier Info
          supplierId: inventory.supplierId.toString(),
          supplierName: inventory.supplierName,
          supplierWalletAddress: inventory.supplierWalletAddress,
          supplierContact: {
            phone: inventory.supplierContact?.phone || "",
            email: inventory.supplierContact?.email || "",
            address: inventory.supplierContact?.address || "",
          },

          // Status & Verification
          status: inventory.status,
          isVerified: inventory.isVerified,
          isFeatured: inventory.isFeatured,

          // Sustainability & Compliance
          isSustainable: inventory.isSustainable,
          certifications: inventory.certifications || [],
          sustainabilityCertifications: inventory.sustainabilityCertifications || [],
          complianceStandards: inventory.complianceStandards || [],
          qualityGrade: inventory.qualityGrade,
          carbonFootprint: inventory.carbonFootprint,
          recycledContent: inventory.recycledContent,

          // Delivery & Storage
          leadTime: inventory.leadTime,
          estimatedDeliveryDays: inventory.estimatedDeliveryDays,
          shelfLife: inventory.shelfLife,
          storageLocations: inventory.storageLocations.map(loc => ({
            warehouse: loc.warehouse,
            zone: loc.zone,
            aisle: loc.aisle,
            rack: loc.rack,
            bin: loc.bin,
            quantityAtLocation: loc.quantityAtLocation,
            lastUpdated: loc.lastUpdated
          })),
          primaryLocation: inventory.primaryLocation,

          // Additional Info
          notes: inventory.notes,
          internalCode: inventory.internalCode,
          barcode: inventory.barcode,
          autoReorderEnabled: inventory.autoReorderEnabled,

          // Batch Tracking
          isBatchTracked: inventory.isBatchTracked,
          batches: inventory.batches.map(batch => ({
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            manufactureDate: batch.manufactureDate,
            expiryDate: batch.expiryDate,
            receivedDate: batch.receivedDate,
            supplierName: batch.supplierName,
            costPerUnit: batch.costPerUnit,
            status: batch.status
          })),

          // Specifications & Suitability
          specifications: inventory.specifications,
          suitableFor: inventory.suitableFor,

          // Timestamps
          createdAt: inventory.createdAt,
          updatedAt: inventory.updatedAt
        };

        const ipfsFileName = `inventory-metadata-${inventory._id.toString()}.json`;
        const ipfsResult = await ipfsService.uploadJSON(
          ipfsMetadata,
          ipfsFileName
        );

        if (ipfsResult.success) {
          inventory.ipfsHash = ipfsResult.ipfsHash;
          await inventory.save();
          logger.info("✅ ALL inventory data updated on IPFS", { ipfsHash: ipfsResult.ipfsHash });
        }
      } catch (ipfsError) {
        logger.error("❌ IPFS update error:", ipfsError);
      }

      // Update blockchain - ALL crucial data
      const blockchainData = {
        // Basic Info
        inventoryId: inventory._id.toString(),
        name: inventory.name,
        description: inventory.description,
        category: inventory.category,
        subcategory: inventory.subcategory,
        materialType: inventory.materialType,
        brand: inventory.brand,

        // Textile Details
        textileDetails: {
          fabricType: inventory.textileDetails?.fabricType || "",
          composition: inventory.textileDetails?.composition || "",
          gsm: inventory.textileDetails?.gsm,
          width: inventory.textileDetails?.width,
          fabricWeight: inventory.textileDetails?.fabricWeight || "",
          color: inventory.textileDetails?.color || "",
          colorCode: inventory.textileDetails?.colorCode || "",
          pattern: inventory.textileDetails?.pattern || "",
          finish: inventory.textileDetails?.finish || "",
          careInstructions: inventory.textileDetails?.careInstructions || "",
          shrinkage: inventory.textileDetails?.shrinkage || "",
          washability: inventory.textileDetails?.washability || "",
        },

        // Pricing & Quantity
        pricePerUnit: inventory.pricePerUnit,
        costPrice: inventory.costPrice,
        originalPrice: inventory.originalPrice,
        discount: inventory.discount,
        quantity: inventory.quantity,
        reservedQuantity: inventory.reservedQuantity,
        committedQuantity: inventory.committedQuantity,
        damagedQuantity: inventory.damagedQuantity,

        // Stock Management
        minStockLevel: inventory.minStockLevel,
        reorderLevel: inventory.reorderLevel,
        reorderQuantity: inventory.reorderQuantity,
        maximumQuantity: inventory.maximumQuantity,
        safetyStockLevel: inventory.safetyStockLevel,
        unit: inventory.unit,
        sku: inventory.sku,

        // Media & Documents
        images: inventory.images.map(img => img.url),
        documents: inventory.documents.map(doc => ({
          name: doc.name,
          url: doc.url,
          type: doc.type
        })),

        // Physical Properties
        weight: inventory.weight,
        dimensions: inventory.dimensions,

        // Metadata
        tags: inventory.tags,
        season: inventory.season,
        countryOfOrigin: inventory.countryOfOrigin,
        manufacturer: inventory.manufacturer,

        // Supplier Info
        supplierId: inventory.supplierId.toString(),
        supplierName: inventory.supplierName,
        supplierWalletAddress: inventory.supplierWalletAddress,
        supplierContact: {
          phone: inventory.supplierContact?.phone || "",
          email: inventory.supplierContact?.email || "",
          address: inventory.supplierContact?.address || "",
        },

        // Status & Verification
        status: inventory.status,
        isVerified: inventory.isVerified,
        isFeatured: inventory.isFeatured,

        // Sustainability & Compliance
        isSustainable: inventory.isSustainable,
        certifications: inventory.certifications || [],
        sustainabilityCertifications: inventory.sustainabilityCertifications || [],
        complianceStandards: inventory.complianceStandards || [],
        qualityGrade: inventory.qualityGrade,
        carbonFootprint: inventory.carbonFootprint,
        recycledContent: inventory.recycledContent,

        // Delivery & Storage
        leadTime: inventory.leadTime,
        estimatedDeliveryDays: inventory.estimatedDeliveryDays,
        shelfLife: inventory.shelfLife,
        storageLocations: inventory.storageLocations.map(loc => ({
          warehouse: loc.warehouse,
          zone: loc.zone,
          aisle: loc.aisle,
          rack: loc.rack,
          bin: loc.bin,
          quantityAtLocation: loc.quantityAtLocation
        })),
        primaryLocation: inventory.primaryLocation,

        // Additional Info
        notes: inventory.notes,
        internalCode: inventory.internalCode,
        barcode: inventory.barcode,
        autoReorderEnabled: inventory.autoReorderEnabled,

        // Batch Tracking
        isBatchTracked: inventory.isBatchTracked,
        batches: inventory.batches.map(batch => ({
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          manufactureDate: batch.manufactureDate,
          expiryDate: batch.expiryDate,
          supplierName: batch.supplierName,
          costPerUnit: batch.costPerUnit,
          status: batch.status
        })),

        // Specifications & Suitability
        specifications: inventory.specifications,
        suitableFor: inventory.suitableFor,

        // IPFS Reference & Timestamp
        ipfsHash: inventory.ipfsHash || "",
        updatedAt: new Date().toISOString(),
      };

      await fabricService.invoke(
        "inventory",
        "updateInventoryItem",
        JSON.stringify(blockchainData)
      );

      // ✅ CRITICAL: Invalidate caches AFTER successful update
      await this.invalidateInventoryCaches(userId, inventoryId);

      logger.info("Inventory item updated successfully", { inventoryId });

      return inventory;
    } catch (error) {
      logger.error("Error updating inventory:", error);
      throw error;
    }
  }

  // ========================================
  // DELETE INVENTORY ITEM (FIXED)
  // ========================================
  async deleteInventoryItem(inventoryId, userId) {
    try {
      logger.info("🗑️  Starting delete inventory item", { inventoryId, userId });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      logger.info("📦 Found inventory item", {
        id: inventory._id,
        name: inventory.name,
        currentStatus: inventory.status,
        quantity: inventory.quantity,
        minStockLevel: inventory.minStockLevel,
      });

      if (inventory.supplierId.toString() !== userId) {
        throw new Error("Unauthorized to delete this inventory item");
      }

      if (inventory.reservedQuantity > 0 || inventory.committedQuantity > 0) {
        throw new Error(
          "Cannot delete inventory item with reserved or committed quantities"
        );
      }

      // Soft delete
      logger.info("🔄 Setting status to discontinued...");
      inventory.status = "discontinued";
      inventory.isActive = false;

      logger.info("💾 Saving inventory with new status...", {
        statusBeforeSave: inventory.status,
      });
      await inventory.save();

      logger.info("✅ Inventory saved, verifying status...");
      const verifyInventory = await Inventory.findById(inventoryId);
      logger.info("🔍 Verification result", {
        savedStatus: verifyInventory.status,
        isActive: verifyInventory.isActive,
      });

      // Update blockchain
      await fabricService.invoke(
        "inventory",
        "deleteInventoryItem",
        inventoryId
      );

      // ✅ CRITICAL: Invalidate caches AFTER successful deletion
      await this.invalidateInventoryCaches(userId, inventoryId);

      logger.info("✅ Inventory item deleted successfully", { inventoryId });

      return { message: "Inventory item deleted successfully" };
    } catch (error) {
      logger.error("❌ Error deleting inventory:", error);
      throw error;
    }
  }

  // ========================================
  // ADD STOCK (FIXED)
  // ========================================
  async addStock(inventoryId, userId, quantity, notes = "", batchData = null) {
    try {
      logger.info("Adding stock", { inventoryId, quantity });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      if (inventory.supplierId.toString() !== userId) {
        throw new Error("Unauthorized");
      }

      if (batchData) {
        inventory.batches.push({
          ...batchData,
          quantity,
          receivedDate: new Date(),
        });
      }

      inventory.addStock(quantity, userId, "supplier", notes);
      await inventory.save();

      await fabricService.invoke(
        "inventory",
        "addStock",
        inventoryId,
        quantity.toString(),
        notes
      );

      await this.createNotification({
        userId,
        userRole: "supplier",
        type: "stock_updated",
        category: "inventory",
        title: "Stock Added",
        message: `${quantity} units added to "${inventory.name}". New stock: ${inventory.quantity}`,
        inventoryId: inventory._id,
        priority: "medium",
      });

      // ✅ CRITICAL: Invalidate caches
      await this.invalidateInventoryCaches(userId, inventoryId);

      return inventory;
    } catch (error) {
      logger.error("Error adding stock:", error);
      throw error;
    }
  }

  // ========================================
  // REDUCE STOCK (FIXED)
  // ========================================
  async reduceStock(
    inventoryId,
    userId,
    quantity,
    reason = "sale",
    notes = ""
  ) {
    try {
      logger.info("Reducing stock", { inventoryId, quantity, reason });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      if (inventory.availableQuantity < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${inventory.availableQuantity}`
        );
      }

      inventory.reduceStock(quantity, userId, "supplier", reason);
      await inventory.save();

      await fabricService.invoke(
        "inventory",
        "reduceStock",
        inventoryId,
        quantity.toString(),
        reason
      );

      if (inventory.needsReorder()) {
        await this.createLowStockAlert(inventory);
      }

      // ✅ CRITICAL: Invalidate caches
      await this.invalidateInventoryCaches(userId, inventoryId);

      return inventory;
    } catch (error) {
      logger.error("Error reducing stock:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY STATS (FIXED)
  // ========================================
  async getInventoryStats(supplierId = null) {
    try {
      logger.info("Fetching inventory stats", { supplierId });

      // ✅ FIX: Always exclude discontinued items from stats
      const filter = supplierId ? { supplierId } : {};
      filter.status = { $ne: "discontinued" };

      const cacheKey = `inventory:stats:${supplierId || "global"}`;

      // Try cache first
      const cached = await redisService.get(cacheKey);
      if (cached) {
        logger.info("✅ Returning cached inventory stats");
        return cached;
      }

      // Fetch fresh data
      const inventory = await Inventory.find(filter).lean();

      const stats = {
        totalItems: inventory.length,
        totalValue: inventory.reduce(
          (sum, item) =>
            sum + (item.stockValue || item.pricePerUnit * item.quantity),
          0
        ),
        inStockItems: inventory.filter(
          (item) => item.quantity > item.minStockLevel
        ).length,
        lowStockItems: inventory.filter(
          (item) => item.quantity > 0 && item.quantity <= item.minStockLevel
        ).length,
        outOfStockItems: inventory.filter((item) => item.quantity === 0).length,
        reservedItems: inventory.filter(
          (item) => (item.reservedQuantity || 0) > 0
        ).length,
      };

      // Cache for 5 minutes (this is fine since we invalidate on changes)
      await redisService.set(cacheKey, stats, 300);

      logger.info("✅ Inventory stats calculated from fresh data", stats);

      return stats;
    } catch (error) {
      logger.error("Error fetching inventory stats:", error);
      throw error;
    }
  }
  // ========================================
  // SELL INVENTORY TO VENDOR
  // ========================================
  async sellToVendor(inventoryId, vendorId, quantity, price) {
    try {
      logger.info("Selling inventory to vendor", {
        inventoryId,
        vendorId,
        quantity,
      });

      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      const vendor = await User.findById(vendorId);
      if (!vendor || vendor.role !== "vendor") {
        throw new Error("Invalid vendor");
      }

      // Check stock
      if (inventory.availableQuantity < quantity) {
        throw new Error("Insufficient stock");
      }

      // Reduce inventory stock
      inventory.reduceStock(quantity, inventory.supplierId, "supplier", "sale");

      // Add to vendor sales tracking
      if (!inventory.vendorSales) inventory.vendorSales = [];
      inventory.vendorSales.push({
        vendorId,
        vendorName: vendor.name || vendor.email,
        quantity,
        pricePerUnit: price,
        totalAmount: quantity * price,
        saleDate: new Date(),
      });

      await inventory.save();

      // Create blockchain transaction
      const txData = {
        inventoryId: inventory._id.toString(),
        fromId: inventory.supplierId.toString(),
        fromRole: "supplier",
        toId: vendorId,
        toRole: "vendor",
        quantity,
        price,
        totalAmount: quantity * price,
        timestamp: new Date().toISOString(),
      };

      await fabricService.invoke(
        "inventory",
        "transferInventory",
        JSON.stringify(txData)
      );

      // Notify vendor
      await this.createNotification({
        userId: vendorId,
        userRole: "vendor",
        type: "stock_updated",
        category: "inventory",
        title: "Inventory Purchased",
        message: `You have purchased ${quantity} units of "${inventory.name}" from supplier.`,
        inventoryId: inventory._id,
        priority: "high",
      });

      // Notify supplier
      await this.createNotification({
        userId: inventory.supplierId,
        userRole: "supplier",
        type: "stock_updated",
        category: "inventory",
        title: "Inventory Sold",
        message: `${quantity} units of "${inventory.name}" sold to ${vendor.name || vendor.email}.`,
        inventoryId: inventory._id,
        priority: "medium",
      });

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);

      return {
        inventory,
        transaction: txData,
        message: "Inventory sold successfully",
      };
    } catch (error) {
      logger.error("Error selling inventory:", error);
      throw error;
    }
  }

  // ========================================
  // GET LOW STOCK ITEMS
  // ========================================
  async getLowStockItems(supplierId = null) {
    try {
      const items = await Inventory.getLowStockItems(supplierId);
      return items;
    } catch (error) {
      logger.error("Error fetching low stock items:", error);
      throw error;
    }
  }

  // ========================================
  // CREATE LOW STOCK ALERT
  // ========================================
  async createLowStockAlert(inventory) {
    try {
      // Create reorder alert in inventory
      const alert = inventory.createReorderAlert();
      await inventory.save();

      // Create notification for supplier
      await this.createNotification({
        userId: inventory.supplierId,
        userRole: "supplier",
        type: "low_stock",
        category: "inventory",
        title: "Low Stock Alert",
        message: `"${inventory.name}" is running low. Current stock: ${inventory.availableQuantity}, Reorder level: ${inventory.reorderLevel}`,
        inventoryId: inventory._id,
        priority: "high",
        isUrgent: true,
        actionType: "check_inventory",
        actionUrl: `/inventory/${inventory._id}`,
      });

      logger.info("Low stock alert created", { inventoryId: inventory._id });
    } catch (error) {
      logger.error("Error creating low stock alert:", error);
      throw error;
    }
  }

  // ========================================
  // ADD QUALITY CHECK
  // ========================================
  async addQualityCheck(inventoryId, userId, checkData) {
    try {
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      const user = await User.findById(userId);
      const qualityCheck = {
        ...checkData,
        inspector: userId,
        inspectorName: user.name || user.email,
        inspectionDate: new Date(),
      };

      await inventory.addQualityCheck(qualityCheck);

      // If quality check failed, create alert
      if (checkData.status === "failed") {
        await this.createNotification({
          userId: inventory.supplierId,
          userRole: "supplier",
          type: "quality_issue_detected",
          category: "inventory",
          title: "Quality Check Failed",
          message: `Quality check failed for "${inventory.name}". ${checkData.rejectedQuantity} units rejected.`,
          inventoryId: inventory._id,
          priority: "high",
        });
      }

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);

      return inventory;
    } catch (error) {
      logger.error("Error adding quality check:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY ANALYTICS
  // ========================================
  async getInventoryAnalytics(supplierId) {
    try {
      const cacheKey = `inventory:analytics:${supplierId}`;
      const cached = await redisService.get(cacheKey);
      if (cached) return cached;

      const [totalValue, itemCount, lowStockCount, movements] =
        await Promise.all([
          Inventory.getTotalValueBySupplier(supplierId),
          Inventory.countDocuments({ supplierId }),
          Inventory.getLowStockItems(supplierId).then((items) => items.length),
          Inventory.aggregate([
            { $match: { supplierId: supplierId } },
            { $unwind: "$movements" },
            {
              $group: {
                _id: "$movements.type",
                count: { $sum: 1 },
                totalQuantity: { $sum: "$movements.quantity" },
              },
            },
          ]),
        ]);

      const analytics = {
        totalValue: totalValue.totalValue,
        totalItems: itemCount,
        lowStockItems: lowStockCount,
        movements: movements.reduce((acc, m) => {
          acc[m._id] = {
            count: m.count,
            totalQuantity: m.totalQuantity,
          };
          return acc;
        }, {}),
      };

      // Cache for 15 minutes
      await redisService.set(cacheKey, analytics, 900);

      return analytics;
    } catch (error) {
      logger.error("Error fetching inventory analytics:", error);
      throw error;
    }
  }

  // ========================================
  // GET INVENTORY HISTORY FROM BLOCKCHAIN
  // ========================================
  async getInventoryHistory(inventoryId) {
    try {
      const history = await fabricService.evaluate(
        "inventory",
        "getInventoryHistory",
        inventoryId
      );

      // Handle empty or invalid responses
      if (!history) {
        return [];
      }

      // If already an array/object, return it
      if (typeof history === "object") {
        return Array.isArray(history) ? history : [history];
      }

      // If string, check if empty and parse
      if (typeof history === "string") {
        if (history.trim() === "" || history.trim() === "[]") {
          return [];
        }
        return JSON.parse(history);
      }

      return [];
    } catch (error) {
      logger.error("Error fetching inventory history:", error);

      // If item not found on blockchain, return empty array
      if (error.message && error.message.includes("not found")) {
        return [];
      }

      throw error;
    }
  }

  // ========================================
  // CREATE NOTIFICATION (Helper)
  // ========================================
  async createNotification(notificationData) {
    try {
      const notification = await Notification.create(notificationData);
      return notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      // Don't throw - notification failure shouldn't break main operation
    }
  }

  // ========================================
  // SEARCH INVENTORY
  // ========================================
  async searchInventory(searchTerm, filters = {}) {
    try {
      const query = {
        $text: { $search: searchTerm },
        ...filters,
      };

      const items = await Inventory.find(query)
        .select("name description category subcategory price quantity images")
        .limit(20)
        .lean();

      return items;
    } catch (error) {
      logger.error("Error searching inventory:", error);
      throw error;
    }
  }

  // ========================================
  // FIX 1: RESERVE QUANTITY (around line 350)
  // ========================================
  async reserveQuantity(inventoryId, quantity, userId, session) {
    try {
      const inventory = await Inventory.findById(inventoryId);

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Validate quantity
      if (quantity <= 0) {
        throw new Error("Quantity must be positive");
      }

      const availableQuantity = inventory.quantity - inventory.reservedQuantity;

      if (availableQuantity < quantity) {
        throw new Error(
          `Insufficient available quantity. Available: ${availableQuantity}, Requested: ${quantity}`
        );
      }

      // Reserve the quantity
      inventory.reservedQuantity += quantity;

      // ✅ FIXED: Properly create movement with required fields
      const movement = {
        type: "reservation",
        quantity: -quantity, // Negative because it's reserved
        previousQuantity: inventory.quantity,
        newQuantity: inventory.quantity, // Total quantity doesn't change, just reserved
        reason: `Reserved for order`,
        performedBy: userId || inventory.supplierId, // ✅ Use actual user ID
        performedByRole: "system", // ✅ Now valid after schema fix
        relatedOrderId: null, // ✅ Set to null since order doesn't exist yet
        timestamp: new Date(),
        notes: `Reserved ${quantity} units for order`,
      };

      inventory.movements.push(movement);
      await inventory.save();

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);
      await redisService.del(`inventory:list:*`);

      logger.info("Quantity reserved successfully", {
        inventoryId,
        quantity,
        userId,
      });

      return inventory;
    } catch (error) {
      logger.error("Error reserving quantity:", error);
      throw error;
    }
  }

  // ========================================
  // FIX 2: RELEASE RESERVED QUANTITY (around line 400)
  // ========================================
  async releaseReservedQuantity(inventoryId, quantity, orderId, userId) {
    try {
      const inventory = await Inventory.findById(inventoryId);

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Validate quantity
      if (quantity <= 0) {
        throw new Error("Quantity must be positive");
      }

      if (inventory.reservedQuantity < quantity) {
        throw new Error(
          `Cannot release more than reserved. Reserved: ${inventory.reservedQuantity}, Requested: ${quantity}`
        );
      }

      // Release the quantity
      inventory.reservedQuantity -= quantity;

      // ✅ FIXED: Properly create movement with required fields
      const movement = {
        type: "release",
        quantity: quantity, // Positive because it's being released
        previousQuantity: inventory.quantity,
        newQuantity: inventory.quantity, // Total quantity doesn't change
        reason: `Released from reservation`,
        performedBy: userId || inventory.supplierId, // ✅ Use actual user ID
        performedByRole: "system", // ✅ Now valid after schema fix
        relatedOrderId: mongoose.Types.ObjectId.isValid(orderId)
          ? new mongoose.Types.ObjectId(orderId)
          : null, // ✅ Convert to ObjectId or null
        timestamp: new Date(),
        notes: `Released ${quantity} units from reservation`,
      };

      inventory.movements.push(movement);
      await inventory.save();

      // Clear cache
      await redisService.del(`inventory:${inventoryId}`);
      await redisService.del(`inventory:list:*`);

      logger.info("Reserved quantity released successfully", {
        inventoryId,
        quantity,
        orderId,
        userId,
      });

      return inventory;
    } catch (error) {
      logger.error("Error releasing quantity:", error);
      throw error;
    }
  }

  async generateInventoryQR(inventoryId, userId) {
    try {
      console.log(`🎯 Generating QR for inventory: ${inventoryId}`);

      // Check if inventory exists
      const inventory = await Inventory.findById(inventoryId);
      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      // Check if QR already exists
      if (inventory.qrCode && inventory.qrCodeGenerated) {
        console.log("✅ QR code already exists");
        return {
          success: true,
          message: "QR code already exists",
          data: {
            code: inventory.qrCode,
            imageUrl: inventory.qrCodeImageUrl,
          },
        };
      }

      // Generate unique QR code string
      const qrCodeString = qrService.generateQRCodeString(
        inventoryId,
        "inventory"
      );

      // Create tracking URL
      const trackingUrl = `${
        process.env.FRONTEND_URL || "http://localhost:3001"
      }/track/inventory/${qrCodeString}`;

      // Generate QR image
      const qrImageBuffer = await qrService.generateQRImage(trackingUrl, {
        width: 512,
      });

      let ipfsResult = null;
      let cloudinaryResult = null;

      // Try IPFS upload (non-critical - can fail)
      try {
        ipfsResult = await ipfsService.uploadBuffer(
          qrImageBuffer,
          `qr-inventory-${qrCodeString}.png`,
          {
            type: "qr-code-inventory",
            inventoryId: inventoryId.toString(),
            inventoryName: inventory.name,
            supplierId: inventory.supplierId.toString(),
          }
        );
        console.log("✅ IPFS upload successful");
      } catch (ipfsError) {
        console.warn(
          "⚠️  IPFS upload failed (non-critical):",
          ipfsError.message
        );
        // Continue without IPFS - Cloudinary is enough
        ipfsResult = {
          success: false,
          ipfsHash: "",
          ipfsUrl: "",
        };
      }

      // Try Cloudinary upload (critical - must succeed)
      try {
        cloudinaryResult = await cloudinaryService.uploadImage(
          qrImageBuffer,
          `qr-inventory-${qrCodeString}`,
          "qr_codes/inventory"
        );
        console.log("✅ Cloudinary upload successful");
      } catch (cloudinaryError) {
        console.error("❌ Cloudinary upload failed:", cloudinaryError.message);
        throw new Error("Failed to store QR code image");
      }

      // Save QR record to QRCode collection
      const QRCodeModel = (await import("../models/QRCode.js")).default;

      const qrRecord = new QRCodeModel({
        code: qrCodeString,
        type: "inventory",
        entityId: inventoryId,
        entityModel: "Inventory",
        qrImageUrl: {
          ipfsHash: ipfsResult.ipfsHash || "",
          ipfsUrl: ipfsResult.ipfsUrl || "",
          cloudinaryUrl: cloudinaryResult.url,
        },
        metadata: {
          inventoryName: inventory.name,
          supplierName: inventory.supplierName,
          category: inventory.category,
          createdBy: userId,
          blockchainTxId: inventory.blockchainTxId || "",
        },
        status: "active",
      });

      await qrRecord.save();

      // Update inventory with QR code
      inventory.qrCode = qrCodeString;
      inventory.qrCodeImageUrl = cloudinaryResult.url;
      inventory.qrCodeGenerated = true;
      inventory.qrMetadata = {
        generatedAt: new Date(),
        generatedBy: userId,
        ipfsHash: ipfsResult.ipfsHash || "",
        cloudinaryUrl: cloudinaryResult.url,
        trackingUrl: trackingUrl,
      };

      await inventory.save();

      console.log(`✅ QR code generated successfully: ${qrCodeString}`);

      return {
        success: true,
        message: "QR code generated successfully",
        data: {
          code: qrCodeString,
          trackingUrl,
          imageUrl: cloudinaryResult.url,
          ipfsUrl: ipfsResult.ipfsUrl || "",
          inventoryId: inventoryId,
        },
      };
    } catch (error) {
      console.error("❌ Inventory QR generation failed:", error);
      throw error;
    }
  }

  /**
   * Scan inventory QR code
   */
  async scanInventoryQR(qrCode, scanData) {
    try {
      const { scannedBy, location, device, ipAddress, purpose, notes } =
        scanData;

      // Find inventory by QR code
      const inventory = await Inventory.findOne({ qrCode })
        .populate("supplierId", "name companyName email walletAddress")
        .populate("scanHistory.scannedBy", "name email role");

      if (!inventory) {
        throw new Error("Inventory not found for this QR code");
      }

      // Record scan
      inventory.scanHistory.push({
        scannedAt: new Date(),
        scannedBy: scannedBy || null,
        scannerRole: scanData.scannerRole || "guest",
        location,
        purpose: purpose || "tracking",
        device,
        ipAddress,
        notes,
      });

      inventory.totalScans += 1;
      inventory.lastScannedAt = new Date();
      inventory.lastScannedBy = scannedBy || null;

      await inventory.save();

      // Log to blockchain (optional - don't block on failure)
      try {
        await fabricService.invoke(
          "inventory",
          "recordInventoryScan",
          JSON.stringify({
            inventoryId: inventory._id.toString(),
            qrCode,
            scannedAt: new Date().toISOString(),
            scannedBy: scannedBy?.toString() || "guest",
            location,
            purpose,
          })
        );
      } catch (bcError) {
        console.warn(
          "⚠️  Blockchain logging failed (non-critical):",
          bcError.message
        );
      }

      return {
        success: true,
        message: "QR code scanned successfully",
        data: {
          inventory: {
            id: inventory._id,
            name: inventory.name,
            category: inventory.category,
            quantity: inventory.quantity,
            supplier: inventory.supplierId,
            qualityScore: inventory.qualityChecks?.[0]?.qualityScore || null,
            certifications: inventory.certifications,
            batches: inventory.batches,
          },
          scanInfo: {
            scanCount: inventory.totalScans,
            lastScanned: inventory.lastScannedAt,
            trackingUrl: inventory.qrMetadata?.trackingUrl,
          },
        },
      };
    } catch (error) {
      console.error("❌ Inventory QR scan failed:", error);
      throw error;
    }
  }

  /**
   * Get inventory tracking info via QR
   */
  async trackInventoryByQR(qrCode) {
    try {
      const inventory = await Inventory.findOne({ qrCode })
        .populate("supplierId", "name companyName email")
        .populate("scanHistory.scannedBy", "name role")
        .select(
          "name category quantity batches movements qualityChecks certifications supplierId createdAt qrMetadata totalScans"
        );

      if (!inventory) {
        return {
          success: false,
          message: "Inventory not found",
        };
      }

      // Get blockchain history (optional - don't fail if unavailable)
      let blockchainHistory = [];
      try {
        const bcHistory = await fabricService.query(
          "inventory",
          "getInventoryHistory",
          inventory._id.toString()
        );
        blockchainHistory = JSON.parse(bcHistory);
      } catch (error) {
        console.warn("Could not fetch blockchain history:", error.message);
      }

      return {
        success: true,
        data: {
          inventory: {
            id: inventory._id,
            name: inventory.name,
            category: inventory.category,
            currentQuantity: inventory.quantity,
            supplier: inventory.supplierId,
            createdAt: inventory.createdAt,
            totalScans: inventory.totalScans,
            qrCode: inventory.qrCode,
            qrImageUrl: inventory.qrCodeImageUrl,
          },
          batches: inventory.batches.map((b) => ({
            batchNumber: b.batchNumber,
            quantity: b.quantity,
            manufactureDate: b.manufactureDate,
            expiryDate: b.expiryDate,
            status: b.status,
          })),
          qualityChecks: inventory.qualityChecks.map((qc) => ({
            inspectionDate: qc.inspectionDate,
            status: qc.status,
            qualityScore: qc.qualityScore,
            findings: qc.findings,
          })),
          movements: inventory.movements.slice(-10).map((m) => ({
            type: m.type,
            quantity: m.quantity,
            timestamp: m.timestamp,
            performedByRole: m.performedByRole,
          })),
          certifications: inventory.certifications,
          scanHistory: inventory.scanHistory.slice(-5).map((s) => ({
            scannedAt: s.scannedAt,
            location: s.location,
            purpose: s.purpose,
          })),
          blockchainHistory: blockchainHistory.slice(-10),
        },
      };
    } catch (error) {
      console.error("❌ Track inventory failed:", error);
      throw error;
    }
  }
}

export default new InventoryService();
