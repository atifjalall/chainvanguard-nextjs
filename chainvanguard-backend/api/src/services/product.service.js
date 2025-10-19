import Product from "../models/Product.js";
import User from "../models/User.js";
import redisService from "./redis.service.js";
import cloudinaryService from "./cloudinary.service.js";
import ipfsService from "./ipfs.service.js";
import FabricService from "./fabric.service.js";
import { buildPaginationResponse, generateSKU } from "../utils/helpers.js";
import {
  validateCategorySubcategory,
  validateCategorySize,
} from "../config/categories.js";

class ProductService {
  constructor() {
    this.fabricService = new FabricService();
  }

  // ========================================
  // CREATE PRODUCT
  // ========================================

  /**
   * Create a new product
   * Flow: Validate → Upload files → Save to MongoDB → Record on Blockchain → Cache
   */
  async createProduct(productData, files, sellerId) {
    try {
      console.log("🚀 Starting product creation...");

      // 1. Get seller details
      const seller = await User.findById(sellerId);
      if (!seller) {
        throw new Error("Seller not found");
      }

      if (!["vendor", "supplier"].includes(seller.role)) {
        throw new Error("Only vendors and suppliers can create products");
      }

      // 2. Validate category and subcategory
      if (
        !validateCategorySubcategory(
          productData.category,
          productData.subcategory
        )
      ) {
        throw new Error(
          `Invalid subcategory '${productData.subcategory}' for category '${productData.category}'`
        );
      }

      // 3. Validate size for category
      if (
        productData.apparelDetails?.size &&
        !validateCategorySize(
          productData.category,
          productData.apparelDetails.size
        )
      ) {
        throw new Error(
          `Invalid size '${productData.apparelDetails.size}' for category '${productData.category}'`
        );
      }

      // 4. Upload images to Cloudinary + IPFS
      let uploadedImages = [];
      if (files && files.images) {
        console.log(`📸 Uploading ${files.images.length} images...`);

        for (let i = 0; i < files.images.length; i++) {
          const file = files.images[i];

          // Upload to Cloudinary (primary - fast CDN)
          const cloudinaryResult = await cloudinaryService.uploadImage(
            file.buffer,
            file.originalname,
            "products"
          );

          // Upload to IPFS (verification backup)
          const ipfsResult = await ipfsService.uploadBuffer(
            file.buffer,
            file.originalname,
            {
              productName: productData.name,
              sellerId: sellerId.toString(),
              type: "product-image",
            }
          );

          uploadedImages.push({
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            ipfsHash: ipfsResult.success ? ipfsResult.ipfsHash : "",
            isMain: i === 0, // First image is main
            viewType: this._getViewType(file.originalname, i),
          });
        }

        console.log(`✅ Uploaded ${uploadedImages.length} images`);
      }

      // 5. Upload certificates to IPFS + Cloudinary
      let uploadedCertificates = [];
      if (files && files.certificates) {
        console.log(
          `📄 Uploading ${files.certificates.length} certificates...`
        );

        for (const cert of files.certificates) {
          // Upload to IPFS (primary for verification)
          const ipfsResult = await ipfsService.uploadBuffer(
            cert.buffer,
            cert.originalname,
            {
              productName: productData.name,
              sellerId: sellerId.toString(),
              type: "certificate",
            }
          );

          // Upload to Cloudinary (backup for quick access)
          const cloudinaryResult = await cloudinaryService.uploadDocument(
            cert.buffer,
            cert.originalname,
            "certificates"
          );

          if (ipfsResult.success) {
            uploadedCertificates.push({
              name: productData.certificateName || cert.originalname,
              certificateNumber: productData.certificateNumber || "",
              type: productData.certificateType || "Other",
              issueDate: productData.certificateIssueDate || null,
              expiryDate: productData.certificateExpiryDate || null,
              ipfsHash: ipfsResult.ipfsHash,
              ipfsUrl: ipfsResult.ipfsUrl,
              cloudinaryUrl: cloudinaryResult.url,
              fileSize: cert.size,
              mimeType: cert.mimetype,
            });
          }
        }

        console.log(`✅ Uploaded ${uploadedCertificates.length} certificates`);
      }

      // 6. Generate QR code (if needed)
      let qrCode = "";
      if (productData.generateQR) {
        // TODO: Generate QR code with product URL
        qrCode = `${process.env.FRONTEND_URL}/products/${productData.slug || ""}`;
      }

      // 7. Create product in MongoDB
      const product = new Product({
        // Basic Info
        name: productData.name,
        description: productData.description,
        category: productData.category,
        subcategory: productData.subcategory,
        productType: productData.productType || "Casual",
        brand: productData.brand || "",

        // Apparel Details
        apparelDetails: {
          size: productData.apparelDetails?.size,
          fit: productData.apparelDetails?.fit || "Regular Fit",
          color: productData.apparelDetails?.color,
          pattern: productData.apparelDetails?.pattern || "Solid",
          material: productData.apparelDetails?.material,
          fabricType: productData.apparelDetails?.fabricType || "",
          fabricWeight: productData.apparelDetails?.fabricWeight || "",
          fabricComposition:
            productData.apparelDetails?.fabricComposition || [],
          neckline: productData.apparelDetails?.neckline || "Crew Neck",
          sleeveLength:
            productData.apparelDetails?.sleeveLength || "Short Sleeve",
          careInstructions:
            productData.apparelDetails?.careInstructions ||
            "Machine wash cold, tumble dry low",
          washingTemperature:
            productData.apparelDetails?.washingTemperature || "30°C",
          ironingInstructions:
            productData.apparelDetails?.ironingInstructions || "Low heat",
          dryCleanOnly: productData.apparelDetails?.dryCleanOnly || false,
          measurements: productData.apparelDetails?.measurements || {},
        },

        // Seller Info
        sellerId: seller._id,
        sellerName: seller.name,
        sellerWalletAddress: seller.walletAddress,
        sellerRole: seller.role,

        // Pricing
        price: parseFloat(productData.price),
        currency: productData.currency || "USD",
        costPrice: parseFloat(productData.costPrice) || 0,
        wholesalePrice: parseFloat(productData.wholesalePrice) || 0,
        markup: parseFloat(productData.markup) || 0,

        // Inventory
        quantity: parseInt(productData.quantity),
        minStockLevel: parseInt(productData.minStockLevel) || 10,
        sku: productData.sku || undefined, // Will auto-generate in pre-save hook
        barcode: productData.barcode || "",
        unit: productData.unit || "piece",

        // Images & Documents
        images: uploadedImages,
        certificates: uploadedCertificates,

        // Manufacturing
        manufacturingDetails: {
          manufacturerId: productData.manufacturerId || "",
          manufacturerName: productData.manufacturerName || "",
          manufactureDate: productData.manufactureDate || null,
          batchNumber: productData.batchNumber || "",
          productionCountry: productData.productionCountry || "",
          productionFacility: productData.productionFacility || "",
          productionLine: productData.productionLine || "",
        },

        // Physical specs
        specifications: {
          weight: parseFloat(productData.weight) || 0,
          weightUnit: productData.weightUnit || "kg",
          packageWeight: parseFloat(productData.packageWeight) || 0,
          packageType: productData.packageType || "Poly Bag",
          dimensions: productData.dimensions || {},
        },

        // Sustainability
        sustainability: {
          isOrganic: productData.sustainability?.isOrganic || false,
          isFairTrade: productData.sustainability?.isFairTrade || false,
          isRecycled: productData.sustainability?.isRecycled || false,
          isCarbonNeutral: productData.sustainability?.isCarbonNeutral || false,
          waterSaving: productData.sustainability?.waterSaving || false,
          ethicalProduction:
            productData.sustainability?.ethicalProduction || false,
        },

        qualityGrade: productData.qualityGrade || "Standard",

        // Location
        currentLocation: productData.currentLocation || {
          facility: seller.companyName || "",
          country: seller.country || "",
        },

        supplyChainSummary: {
          totalStages: 1,
          currentStage: "Created",
          lastUpdate: new Date(),
        },

        // QR Code
        qrCode: qrCode,

        // Status
        status: "active",
        isPublished: productData.isPublished !== false,

        // SEO
        tags: productData.tags || [],
        keywords: productData.keywords || [],
        metaDescription: productData.metaDescription || "",
        season: productData.season || "All Season",
        collection: productData.collection || "",

        // Additional
        minimumOrderQuantity: parseInt(productData.minimumOrderQuantity) || 1,
        warrantyPeriod: productData.warrantyPeriod || "",
        returnPolicy: productData.returnPolicy || "30 days",
        shippingDetails: productData.shippingDetails || {},
      });

      await product.save();
      console.log(`✅ Product saved to MongoDB: ${product._id}`);

      // 8. Record on blockchain (async - don't block response)
      this.recordProductOnBlockchain(product).catch((err) => {
        console.error("⚠️  Blockchain recording failed:", err.message);
        // Don't fail the request if blockchain fails
      });

      // 9. Cache in Redis
      await redisService.cacheProduct(product._id.toString(), product);

      // 10. Invalidate product list cache
      await redisService.delPattern("products:*");

      return {
        success: true,
        product: product,
        message: "Product created successfully",
      };
    } catch (error) {
      console.error("❌ Product creation error:", error);
      throw error;
    }
  }

  // ========================================
  // GET ALL PRODUCTS (with advanced filters)
  // ========================================

  async getAllProducts(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        subcategory,
        productType,
        size,
        color,
        material,
        fit,
        pattern,
        brand,
        minPrice,
        maxPrice,
        status = "active",
        sellerId,
        sellerRole,
        isFeatured,
        isVerified,
        isOrganic,
        isFairTrade,
        isRecycled,
        tags,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = filters;

      // Check cache first
      const cacheKey = `products:${JSON.stringify(filters)}`;
      const cachedData = await redisService.get(cacheKey);

      if (cachedData) {
        console.log("✅ Returning cached products");
        return cachedData;
      }

      // Build query
      const query = {};

      // Status filter
      if (status) query.status = status;

      // Category filters
      if (category) query.category = category;
      if (subcategory) query.subcategory = subcategory;
      if (productType) query.productType = productType;

      // Apparel filters
      if (size) query["apparelDetails.size"] = size;
      if (color) query["apparelDetails.color"] = new RegExp(color, "i");
      if (material)
        query["apparelDetails.material"] = new RegExp(material, "i");
      if (fit) query["apparelDetails.fit"] = fit;
      if (pattern) query["apparelDetails.pattern"] = pattern;
      if (brand) query.brand = new RegExp(brand, "i");

      // Price range
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      // Seller filters
      if (sellerId) query.sellerId = sellerId;
      if (sellerRole) query.sellerRole = sellerRole;

      // Feature filters
      if (isFeatured !== undefined) query.isFeatured = isFeatured;
      if (isVerified !== undefined) query.isVerified = isVerified;

      // Sustainability filters
      if (isOrganic !== undefined)
        query["sustainability.isOrganic"] = isOrganic;
      if (isFairTrade !== undefined)
        query["sustainability.isFairTrade"] = isFairTrade;
      if (isRecycled !== undefined)
        query["sustainability.isRecycled"] = isRecycled;

      // Tags filter
      if (tags) {
        const tagsArray = Array.isArray(tags) ? tags : tags.split(",");
        query.tags = { $in: tagsArray };
      }

      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Count total
      const total = await Product.countDocuments(query);

      // Build sort
      const sort = {};
      if (search && !sortBy) {
        sort.score = { $meta: "textScore" }; // Sort by relevance for search
      } else {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const products = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("sellerId", "name email companyName walletAddress")
        .lean();

      const response = buildPaginationResponse(products, page, limit, total);

      // Cache for 5 minutes
      await redisService.set(cacheKey, response, 300);

      return response;
    } catch (error) {
      console.error("❌ Get products error:", error);
      throw error;
    }
  }

  // ========================================
  // GET SINGLE PRODUCT BY ID
  // ========================================

  async getProductById(productId, incrementView = false) {
    try {
      // Check cache first
      const cachedProduct = await redisService.getCachedProduct(productId);
      if (cachedProduct) {
        console.log("✅ Returning cached product");

        // Increment view count (async)
        if (incrementView) {
          Product.findByIdAndUpdate(productId, {
            $inc: { views: 1 },
            lastViewedAt: new Date(),
          }).catch((err) => console.error("View count update failed:", err));
        }

        return cachedProduct;
      }

      // Get from MongoDB
      const product = await Product.findById(productId)
        .populate("sellerId", "name email phone companyName walletAddress role")
        .lean();

      if (!product) {
        throw new Error("Product not found");
      }

      // Increment view count
      if (incrementView) {
        await Product.findByIdAndUpdate(productId, {
          $inc: { views: 1 },
          lastViewedAt: new Date(),
        });
        product.views += 1;
      }

      // Cache for 10 minutes
      await redisService.cacheProduct(productId, product);

      return product;
    } catch (error) {
      console.error("❌ Get product error:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE PRODUCT
  // ========================================

  async updateProduct(productId, updateData, files, userId) {
    try {
      // Get existing product
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check ownership
      if (product.sellerId.toString() !== userId.toString()) {
        throw new Error("Unauthorized: You can only update your own products");
      }

      // Validate category/subcategory if changed
      if (updateData.category && updateData.subcategory) {
        if (
          !validateCategorySubcategory(
            updateData.category,
            updateData.subcategory
          )
        ) {
          throw new Error(
            `Invalid subcategory '${updateData.subcategory}' for category '${updateData.category}'`
          );
        }
      }

      // Handle new images
      if (files && files.images) {
        console.log(`📸 Uploading ${files.images.length} new images...`);

        for (let i = 0; i < files.images.length; i++) {
          const file = files.images[i];

          const cloudinaryResult = await cloudinaryService.uploadImage(
            file.buffer,
            file.originalname,
            "products"
          );

          const ipfsResult = await ipfsService.uploadBuffer(
            file.buffer,
            file.originalname,
            { productId: productId.toString() }
          );

          product.images.push({
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            ipfsHash: ipfsResult.success ? ipfsResult.ipfsHash : "",
            isMain: product.images.length === 0 && i === 0,
            viewType: this._getViewType(file.originalname, i),
          });
        }
      }

      // Handle new certificates
      if (files && files.certificates) {
        console.log(
          `📄 Uploading ${files.certificates.length} new certificates...`
        );

        for (const cert of files.certificates) {
          const ipfsResult = await ipfsService.uploadBuffer(
            cert.buffer,
            cert.originalname,
            { productId: productId.toString() }
          );

          const cloudinaryResult = await cloudinaryService.uploadDocument(
            cert.buffer,
            cert.originalname,
            "certificates"
          );

          if (ipfsResult.success) {
            product.certificates.push({
              name: updateData.certificateName || cert.originalname,
              certificateNumber: updateData.certificateNumber || "",
              type: updateData.certificateType || "Other",
              issueDate: updateData.certificateIssueDate || null,
              expiryDate: updateData.certificateExpiryDate || null,
              ipfsHash: ipfsResult.ipfsHash,
              ipfsUrl: ipfsResult.ipfsUrl,
              cloudinaryUrl: cloudinaryResult.url,
              fileSize: cert.size,
              mimeType: cert.mimetype,
            });
          }
        }
      }

      // Update fields
      const allowedUpdates = [
        "name",
        "description",
        "category",
        "subcategory",
        "productType",
        "brand",
        "price",
        "costPrice",
        "wholesalePrice",
        "quantity",
        "minStockLevel",
        "apparelDetails",
        "manufacturingDetails",
        "specifications",
        "sustainability",
        "qualityGrade",
        "currentLocation",
        "tags",
        "keywords",
        "metaDescription",
        "season",
        "collection",
        "status",
        "isFeatured",
        "minimumOrderQuantity",
        "warrantyPeriod",
        "returnPolicy",
        "shippingDetails",
      ];

      allowedUpdates.forEach((field) => {
        if (updateData[field] !== undefined) {
          product[field] = updateData[field];
        }
      });

      await product.save();
      console.log(`✅ Product updated: ${productId}`);

      // Update blockchain (async)
      this.updateProductOnBlockchain(product).catch((err) =>
        console.error("⚠️  Blockchain update failed:", err.message)
      );

      // Invalidate cache
      await redisService.invalidateProduct(productId);
      await redisService.delPattern("products:*");

      return product;
    } catch (error) {
      console.error("❌ Update product error:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE STOCK ONLY
  // ========================================

  async updateStock(productId, quantity, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.sellerId.toString() !== userId.toString()) {
        throw new Error("Unauthorized: You can only update your own products");
      }

      product.quantity = parseInt(quantity);
      product.lastRestockedAt = new Date();
      await product.save();

      console.log(`✅ Stock updated for product: ${productId}`);

      // Invalidate cache
      await redisService.invalidateProduct(productId);

      return product;
    } catch (error) {
      console.error("❌ Update stock error:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE PRODUCT STATUS
  // ========================================

  async updateProductStatus(productId, status, userId, userRole) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check permission
      if (
        product.sellerId.toString() !== userId.toString() &&
        userRole !== "expert"
      ) {
        throw new Error("Unauthorized");
      }

      product.status = status;
      await product.save();

      console.log(`✅ Status updated for product: ${productId} → ${status}`);

      await redisService.invalidateProduct(productId);
      await redisService.delPattern("products:*");

      return product;
    } catch (error) {
      console.error("❌ Update status error:", error);
      throw error;
    }
  }

  // ========================================
  // ADD PRODUCT IMAGES
  // ========================================

  async addProductImages(productId, images, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.sellerId.toString() !== userId.toString()) {
        throw new Error("Unauthorized");
      }

      console.log(
        `📸 Adding ${images.length} images to product ${productId}...`
      );

      for (let i = 0; i < images.length; i++) {
        const file = Array.isArray(images) ? images[i] : images;

        const cloudinaryResult = await cloudinaryService.uploadImage(
          file.buffer,
          file.originalname,
          "products"
        );

        const ipfsResult = await ipfsService.uploadBuffer(
          file.buffer,
          file.originalname,
          { productId: productId.toString() }
        );

        product.images.push({
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          ipfsHash: ipfsResult.success ? ipfsResult.ipfsHash : "",
          isMain: product.images.length === 0 && i === 0,
          viewType: this._getViewType(file.originalname, i),
        });

        if (!Array.isArray(images)) break;
      }

      await product.save();

      await redisService.invalidateProduct(productId);

      return product;
    } catch (error) {
      console.error("❌ Add images error:", error);
      throw error;
    }
  }

  // ========================================
  // DELETE PRODUCT IMAGE
  // ========================================

  async deleteProductImage(productId, imageId, userId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.sellerId.toString() !== userId.toString()) {
        throw new Error("Unauthorized");
      }

      const image = product.images.id(imageId);
      if (!image) {
        throw new Error("Image not found");
      }

      // Delete from Cloudinary
      await cloudinaryService.deleteImage(image.publicId);

      // Remove from array
      product.images.pull(imageId);

      // If deleted image was main, make first image main
      if (image.isMain && product.images.length > 0) {
        product.images[0].isMain = true;
      }

      await product.save();

      await redisService.invalidateProduct(productId);

      return product;
    } catch (error) {
      console.error("❌ Delete image error:", error);
      throw error;
    }
  }

  // ========================================
  // DELETE PRODUCT
  // ========================================

  async deleteProduct(productId, userId, userRole, hardDelete = false) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check ownership (unless admin/expert)
      if (
        product.sellerId.toString() !== userId.toString() &&
        userRole !== "expert"
      ) {
        throw new Error("Unauthorized: You can only delete your own products");
      }

      if (hardDelete && userRole === "expert") {
        // Hard delete (permanent removal)
        await Product.findByIdAndDelete(productId);
        console.log(`✅ Product permanently deleted: ${productId}`);
      } else {
        // Soft delete (archive)
        product.status = "archived";
        await product.save();
        console.log(`✅ Product archived: ${productId}`);
      }

      // Invalidate cache
      await redisService.invalidateProduct(productId);
      await redisService.delPattern("products:*");

      return {
        success: true,
        message: hardDelete
          ? "Product permanently deleted"
          : "Product archived successfully",
      };
    } catch (error) {
      console.error("❌ Delete product error:", error);
      throw error;
    }
  }

  // ========================================
  // VERIFY PRODUCT (Expert only)
  // ========================================

  async verifyProduct(productId, expertId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      product.isVerified = true;
      await product.save();

      console.log(`✅ Product verified: ${productId}`);

      // Update on blockchain
      this.verifyProductOnBlockchain(product, expertId).catch((err) =>
        console.error("⚠️  Blockchain verification failed:", err.message)
      );

      await redisService.invalidateProduct(productId);

      return product;
    } catch (error) {
      console.error("❌ Verify product error:", error);
      throw error;
    }
  }

  // ========================================
  // GET PRODUCT HISTORY FROM BLOCKCHAIN
  // ========================================

  async getProductHistory(productId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      if (!product.blockchainProductId) {
        return {
          success: false,
          message: "Product not recorded on blockchain yet",
          history: [],
        };
      }

      // Get from blockchain
      await this.fabricService.connect();
      const historyJSON = await this.fabricService.getProductHistory(
        product.blockchainProductId
      );
      this.fabricService.disconnect();

      const history = JSON.parse(historyJSON);

      return {
        success: true,
        productId: productId,
        blockchainId: product.blockchainProductId,
        totalTransactions: history.length,
        history: history,
      };
    } catch (error) {
      console.error("❌ Get history error:", error);
      throw error;
    }
  }

  // ========================================
  // BLOCKCHAIN INTEGRATION METHODS
  // ========================================

  /**
   * Record product on blockchain
   */
  async recordProductOnBlockchain(product) {
    try {
      console.log(`📝 Recording product on blockchain: ${product._id}`);

      await this.fabricService.connect();

      // ✅ FIX: Ensure productId is a string and never undefined
      const productId = String(product._id || product.id || "");

      if (!productId || productId === "undefined") {
        throw new Error(`Invalid product ID: ${product._id}`);
      }

      // Prepare blockchain data with proper structure
      const blockchainData = {
        productId: productId, // ✅ Main product identifier
        sku: product.sku || "",
        qrCode: product.qrCode || "",
        name: product.name || "",
        description: product.description || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        brand: product.brand || "",

        // Seller info - ensure strings
        sellerId: String(product.sellerId || ""),
        sellerName: product.sellerName || "",
        sellerWalletAddress: product.sellerWalletAddress || "",
        sellerRole: product.sellerRole || "supplier",

        // Apparel details
        apparelDetails: {
          size: product.apparelDetails?.size || "",
          color: product.apparelDetails?.color || "",
          material: product.apparelDetails?.material || "",
          fit: product.apparelDetails?.fit || "",
          pattern: product.apparelDetails?.pattern || "",
        },

        // Manufacturing details
        manufacturingDetails: {
          manufacturerName:
            product.manufacturingDetails?.manufacturerName || "",
          manufactureDate:
            product.manufacturingDetails?.manufactureDate || null,
          batchNumber: product.manufacturingDetails?.batchNumber || "",
          productionCountry:
            product.manufacturingDetails?.productionCountry || "",
          productionFacility:
            product.manufacturingDetails?.productionFacility || "",
        },

        // Certificates - map to include only essential data
        certificates: (product.certificates || []).map((cert) => ({
          name: cert.name || "",
          type: cert.type || "Other",
          certificateNumber: cert.certificateNumber || "",
          ipfsHash: cert.ipfsHash || "",
          issueDate: cert.issueDate || null,
          expiryDate: cert.expiryDate || null,
        })),

        // Sustainability
        sustainability: {
          isOrganic: Boolean(product.sustainability?.isOrganic),
          isFairTrade: Boolean(product.sustainability?.isFairTrade),
          isRecycled: Boolean(product.sustainability?.isRecycled),
          isCarbonNeutral: Boolean(product.sustainability?.isCarbonNeutral),
        },

        // Status
        status: product.status || "active",
        isVerified: Boolean(product.isVerified),

        // IPFS hash
        ipfsHash: product.ipfsHash || "",

        // Current location
        currentLocation: {
          facility: product.currentLocation?.facility || "",
          country: product.currentLocation?.country || "",
        },
      };

      console.log("📦 Blockchain data prepared:", {
        productId: blockchainData.productId,
        name: blockchainData.name,
        category: blockchainData.category,
        sellerId: blockchainData.sellerId,
      });

      // Submit to blockchain
      const result = await this.fabricService.createProduct(blockchainData);

      console.log("✅ Product recorded on blockchain:", result);

      // Update MongoDB with blockchain reference
      await Product.findByIdAndUpdate(product._id, {
        blockchainProductId: result.productId || productId,
        blockchainTxId: result.txId || "",
        blockchainVerified: true,
      });

      console.log(`✅ MongoDB updated with blockchain reference`);

      return result;
    } catch (error) {
      console.error("❌ Blockchain recording error:", error);

      // Log more details for debugging
      console.error("Product ID:", product._id);
      console.error("Product name:", product.name);
      console.error("Error message:", error.message);

      throw error;
    } finally {
      await this.fabricService.disconnect();
    }
  }

  /**
   * Update product on blockchain
   */
  async updateProductOnBlockchain(product) {
    try {
      // Check if product exists on blockchain
      if (!product.blockchainProductId) {
        console.log(`⚠️ Product not on blockchain yet, skipping update`);
        return; // Don't create during update - let the initial create finish
      }

      console.log(`📝 Updating product on blockchain: ${product._id}`);

      await this.fabricService.connect();

      const updateData = {
        status: product.status || "active",
        isVerified: Boolean(product.isVerified),
        currentLocation: product.currentLocation || {},
        updatedBy: String(product.sellerId),
        updatedByRole: product.sellerRole || "supplier",
        supplyChainEvent: {
          stage: "updated",
          action: "Product information updated",
          performedBy: String(product.sellerId),
          performedByRole: product.sellerRole || "supplier",
          location: product.currentLocation?.facility || "",
          country: product.currentLocation?.country || "",
          details: "Product details updated in system",
        },
      };

      console.log(
        "📦 Updating blockchain product:",
        product.blockchainProductId
      );

      await this.fabricService.updateProduct(
        product.blockchainProductId,
        updateData
      );

      console.log(`✅ Product updated on blockchain: ${product._id}`);
    } catch (error) {
      console.error("❌ Blockchain update error:", error.message);
      // Don't throw - update should succeed even if blockchain fails
    } finally {
      await this.fabricService.disconnect();
    }
  }

  /**
   * Verify product on blockchain
   */
  async verifyProductOnBlockchain(product, expertId) {
    try {
      if (!product.blockchainProductId) {
        console.warn(
          "⚠️  Product not on blockchain yet, skipping verification"
        );
        return;
      }

      console.log(`✅ Verifying product on blockchain: ${product._id}`);

      await this.fabricService.connect();

      const verificationData = {
        verifiedBy: expertId.toString(),
        verifiedByName: "Blockchain Expert",
        notes: "Product verified and authenticated",
      };

      await this.fabricService.verifyProduct(
        product.blockchainProductId,
        JSON.stringify(verificationData)
      );

      console.log(`✅ Product verified on blockchain: ${product._id}`);
    } catch (error) {
      console.error("❌ Blockchain verification error:", error);
      throw error;
    } finally {
      this.fabricService.disconnect();
    }
  }

  // ========================================
  // ADDITIONAL QUERY METHODS
  // ========================================

  /**
   * Get seller's products
   */
  async getSellerProducts(sellerId, filters = {}) {
    return this.getAllProducts({ ...filters, sellerId });
  }

  /**
   * Search products with text query
   */
  async searchProducts(searchTerm, filters = {}) {
    return this.getAllProducts({ ...filters, search: searchTerm });
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit = 10, category = null) {
    try {
      const query = {
        status: "active",
        isFeatured: true,
        isPublished: true,
      };

      if (category) {
        query.category = category;
      }

      const products = await Product.find(query)
        .sort({ totalSold: -1, averageRating: -1, createdAt: -1 })
        .limit(limit)
        .populate("sellerId", "name companyName walletAddress")
        .lean();

      return products;
    } catch (error) {
      console.error("❌ Get featured products error:", error);
      throw error;
    }
  }

  /**
   * Get new arrivals
   */
  async getNewArrivals(limit = 20, category = null) {
    try {
      const query = {
        status: "active",
        isPublished: true,
      };

      if (category) {
        query.category = category;
      }

      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sellerId", "name companyName")
        .lean();

      return products;
    } catch (error) {
      console.error("❌ Get new arrivals error:", error);
      throw error;
    }
  }

  /**
   * Get trending products (most sold/viewed)
   */
  async getTrendingProducts(limit = 10, timeframe = "week") {
    try {
      // Calculate date range
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case "day":
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null; // All time
      }

      const query = {
        status: "active",
        isPublished: true,
      };

      if (startDate) {
        query.lastSoldAt = { $gte: startDate };
      }

      const products = await Product.find(query)
        .sort({ totalSold: -1, views: -1, averageRating: -1 })
        .limit(limit)
        .populate("sellerId", "name companyName")
        .lean();

      return products;
    } catch (error) {
      console.error("❌ Get trending products error:", error);
      throw error;
    }
  }

  /**
   * Get low stock products
   */
  async getLowStockProducts(sellerId = null) {
    try {
      const query = {
        status: "active",
        $expr: { $lte: ["$quantity", "$minStockLevel"] },
      };

      if (sellerId) {
        query.sellerId = sellerId;
      }

      const products = await Product.find(query)
        .sort({ quantity: 1 })
        .populate("sellerId", "name email companyName")
        .lean();

      return products;
    } catch (error) {
      console.error("❌ Get low stock products error:", error);
      throw error;
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category, filters = {}) {
    return this.getAllProducts({ ...filters, category });
  }

  /**
   * Get related products (similar category, subcategory)
   */
  async getRelatedProducts(productId, limit = 8) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      const query = {
        _id: { $ne: productId }, // Exclude current product
        status: "active",
        isPublished: true,
        $or: [
          {
            category: product.category,
            subcategory: product.subcategory,
          },
          {
            category: product.category,
            "apparelDetails.color": product.apparelDetails?.color,
          },
          {
            tags: { $in: product.tags },
          },
        ],
      };

      const relatedProducts = await Product.find(query)
        .sort({ totalSold: -1, averageRating: -1 })
        .limit(limit)
        .populate("sellerId", "name companyName")
        .lean();

      return relatedProducts;
    } catch (error) {
      console.error("❌ Get related products error:", error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  async getProductStats(sellerId = null) {
    try {
      const query = {};
      if (sellerId) {
        query.sellerId = sellerId;
      }

      const [totalProducts, activeProducts, lowStockProducts, totalValue] =
        await Promise.all([
          Product.countDocuments(query),
          Product.countDocuments({ ...query, status: "active" }),
          Product.countDocuments({
            ...query,
            status: "active",
            $expr: { $lte: ["$quantity", "$minStockLevel"] },
          }),
          Product.aggregate([
            { $match: query },
            {
              $group: {
                _id: null,
                totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
                totalRevenue: { $sum: "$totalRevenue" },
                totalSold: { $sum: "$totalSold" },
              },
            },
          ]),
        ]);

      const stats = {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        lowStockProducts,
        totalInventoryValue: totalValue[0]?.totalValue || 0,
        totalRevenue: totalValue[0]?.totalRevenue || 0,
        totalItemsSold: totalValue[0]?.totalSold || 0,
      };

      // Get category breakdown
      const categoryBreakdown = await Product.aggregate([
        { $match: query },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            totalValue: { $sum: { $multiply: ["$price", "$quantity"] } },
          },
        },
        { $sort: { count: -1 } },
      ]);

      stats.categoryBreakdown = categoryBreakdown;

      // Get top selling products
      const topSellingProducts = await Product.find(query)
        .sort({ totalSold: -1 })
        .limit(5)
        .select("name totalSold totalRevenue images")
        .lean();

      stats.topSellingProducts = topSellingProducts;

      return stats;
    } catch (error) {
      console.error("❌ Get product stats error:", error);
      throw error;
    }
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  /**
   * Determine image view type from filename
   */
  _getViewType(filename, index) {
    const lowerFilename = filename.toLowerCase();

    if (lowerFilename.includes("front")) return "front";
    if (lowerFilename.includes("back")) return "back";
    if (lowerFilename.includes("side")) return "side";
    if (lowerFilename.includes("detail")) return "detail";
    if (lowerFilename.includes("worn") || lowerFilename.includes("model"))
      return "worn";
    if (lowerFilename.includes("tag") || lowerFilename.includes("label"))
      return "tag";

    // Default: first image is front, others are detail
    return index === 0 ? "front" : "detail";
  }
}

export default new ProductService();
