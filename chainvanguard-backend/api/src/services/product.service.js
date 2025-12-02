import Product from "../models/Product.js";
import User from "../models/User.js";
import redisService from "./redis.service.js";
import cloudinaryService from "./cloudinary.service.js";
import ipfsService from "./ipfs.service.js";
import fabricService from "./fabric.service.js";
import { buildPaginationResponse, generateSKU } from "../utils/helpers.js";
import {
  validateCategorySubcategory,
  validateCategorySize,
} from "../config/categories.js";
import qrService from "./qr.service.js";
import logger from "../utils/logger.js";
import notificationService from "./notification.service.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";

class ProductService {
  // ========================================
  // CREATE PRODUCT
  // ========================================

  /**
   * Create a new product
   * Flow: Validate → Upload files → Save to MongoDB → Record on Blockchain → Cache
   */
  async createProduct(productData, files, sellerId) {
    try {
      // 1. Check blockchain health FIRST
      console.log("🔍 Checking blockchain network health...");
      await fabricService.ensureBlockchainConnected();
      console.log("✅ Blockchain network is active");

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

      // 4. Upload images to Cloudinary ONLY (image hashes go to blockchain/IPFS)
      let uploadedImages = [];
      if (files && files.images) {
        console.log(`📸 Uploading ${files.images.length} images to Cloudinary...`);

        for (let i = 0; i < files.images.length; i++) {
          const file = files.images[i];

          // Upload to Cloudinary with hash generation
          const cloudinaryResult = await cloudinaryService.uploadImage(
            file.buffer,
            "products"
          );

          uploadedImages.push({
            url: cloudinaryResult.url,
            publicId: cloudinaryResult.publicId,
            imageHash: cloudinaryResult.imageHash, // ✅ SHA-256 hash for blockchain
            isMain: i === 0, // First image is main
            viewType: this._getViewType(file.originalname, i),
          });

          console.log(`✅ Image ${i + 1}: Cloudinary + Hash generated`);
        }

        console.log(`✅ Uploaded ${uploadedImages.length} images with hashes`);
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

      // 6. Generate QR code automatically
      let qrCode = "";
      let qrCodeImageUrl = "";

      console.log("🎯 Generating QR code for product...");

      try {
        // Generate unique QR code string
        qrCode = qrService.generateQRCodeString(
          seller._id.toString(),
          "product"
        );

        console.log(`✅ QR Code generated: ${qrCode}`);
      } catch (error) {
        console.error(
          "⚠️  QR generation failed (non-blocking):",
          error.message
        );
        // Don't fail product creation if QR fails
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
        currency: productData.currency || "CVT",
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

        // Shipping
        freeShipping:
          productData.freeShipping === "true" ||
          productData.freeShipping === true,
        shippingCost: parseFloat(productData.shippingCost) || 0,
        shippingDetails: productData.shippingDetails || {},
      });

      await product.save();
      console.log(`✅ Product saved to MongoDB: ${product._id}`);

      // ========================================
      // 📦 CREATE IPFS METADATA SNAPSHOT
      // ========================================
      let ipfsMetadataHash = null;
      try {
        console.log("📦 Creating IPFS metadata snapshot...");

        const productSnapshot = {
          productId: product._id.toString(),
          name: product.name,
          category: product.category,
          subcategory: product.subcategory,

          // Price at creation (snapshot)
          originalPrice: product.price,
          currency: "CVT",

          // Creator info (never changes)
          createdBy: {
            sellerId: product.sellerId.toString(),
            sellerName: product.sellerName,
            sellerRole: product.sellerRole,
            sellerWalletAddress: product.sellerWalletAddress
          },

          // Materials used (if product is made from inventory)
          materials: product.materialsUsed || [],

          // Original specifications (snapshot at creation)
          specifications: product.specifications || {},
          apparelDetails: product.apparelDetails || {},

          // Image hashes for verification
          imageHashes: uploadedImages.map(img => img.imageHash || img.ipfsHash || ""),

          // Certifications at creation
          certifications: product.certifications || [],

          // Timestamps
          createdAt: product.createdAt.toISOString()
        };

        const ipfsResult = await ipfsService.uploadJSON(
          productSnapshot,
          `product-metadata-${product._id}.json`,
          {
            entityType: 'product',
            entityId: product._id.toString()
          }
        );

        if (ipfsResult.success) {
          ipfsMetadataHash = ipfsResult.ipfsHash;
          product.metadataIpfsHash = ipfsResult.ipfsHash;
          product.metadataIpfsUrl = ipfsResult.ipfsUrl;
          await product.save();
          console.log(`✅ IPFS snapshot uploaded: ${ipfsResult.ipfsHash}`);
        }
      } catch (ipfsError) {
        console.warn("⚠️ IPFS metadata upload failed (non-critical):", ipfsError.message);
        // Continue without IPFS - blockchain will still have basic data
      }

      await notificationService.createNotification({
        userId: product.sellerId,
        userRole: seller.role,
        type: "product_created",
        category: "product",
        title: "Product Created Successfully",
        message: `Your product "${product.name}" has been created and is now live`,
        productId: product._id,
        priority: "medium",
        actionType: "view_product",
        actionUrl: `/my-products/${product._id}`,
      });

      // 9. Generate QR code image asynchronously (don't block response)
      if (product._id) {
        // Generate QR in background
        qrService
          .generateProductQR(product._id.toString(), seller._id.toString())
          .then((qrResult) => {
            if (qrResult.success) {
              console.log(
                `✅ QR code image generated for product: ${product._id}`
              );

              // Update product with QR image URL
              Product.findByIdAndUpdate(
                product._id,
                {
                  qrCodeImageUrl: qrResult.data.imageUrl,
                  $set: { qrCode: qrResult.data.code },
                },
                { new: true }
              ).catch((err) =>
                console.error("⚠️  Failed to update product with QR:", err)
              );
            }
          })
          .catch((error) => {
            console.error(
              `⚠️  QR image generation failed for ${product._id}:`,
              error.message
            );
            // Don't fail - QR can be generated later
          });
      }

      // 🆕 LOG PRODUCT CREATION
      await logger.logProduct({
        type: "product_created",
        action: `Product created: ${product.name}`,
        productId: product._id,
        userId: sellerId,
        userDetails: {
          walletAddress: seller.walletAddress,
          role: seller.role,
          name: seller.name,
        },
        status: "success",
        data: {
          name: product.name,
          category: product.category,
          price: product.price,
          sku: product.sku,
        },
        newState: product.toObject(),
      });

      // 8. Record on blockchain (REQUIRED - synchronous)
      console.log("📝 Recording product on blockchain...");
      await this.recordProductOnBlockchain(product, ipfsMetadataHash);
      console.log("✅ Product recorded on blockchain successfully");

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
        isNewArrival,
        isBestseller,
        isVerified,
        isOrganic,
        isFairTrade,
        isRecycled,
        season,
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
      if (isNewArrival !== undefined) query.isNewArrival = isNewArrival;
      if (isBestseller !== undefined) query.isBestseller = isBestseller;
      if (isVerified !== undefined) query.isVerified = isVerified;

      // Season filter
      if (season) query.season = season;

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

      const productsWithTimestamps = products.map((product) => ({
        ...product,
        images: product.images
          ? product.images.map((img) => ({
              ...img,
              url: `${img.url}?t=${Date.now()}`,
            }))
          : [],
      }));

      const response = buildPaginationResponse(
        productsWithTimestamps,
        page,
        limit,
        total
      );

      // Cache for shorter time (2 minutes)
      await redisService.set(cacheKey, response, 120);

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
      // ✅ Don't use cache for fresh data
      console.log("🔍 Fetching fresh product from database:", productId);

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

      // ✅ Add timestamp to image URLs to bust cache
      if (product.images) {
        product.images = product.images.map((img) => ({
          ...img,
          url: `${img.url}?t=${Date.now()}`,
        }));
      }

      // ✅ Cache for shorter time (1 minute instead of 10)
      await redisService.cacheProduct(productId, product, 60);

      return product;
    } catch (error) {
      console.error("❌ Get product error:", error);
      throw error;
    }
  }

  // ========================================
  // UPDATE PRODUCT
  // ========================================
  // chainvanguard-backend/api/src/services/product.service.js

  async updateProduct(productId, updateData, files, userId) {
    try {
      // 1. Check blockchain health FIRST
      console.log("🔍 Checking blockchain network health...");
      await fabricService.ensureBlockchainConnected();
      console.log("✅ Blockchain network is active");

      console.log("🚀 Starting product update...");
      console.log("📦 Product ID:", productId);

      // ✅ FIX: Handle files object from multer.fields()
      let imagesToUpload = [];

      if (files) {
        console.log("📁 Files object received:", Object.keys(files));

        // Files come as object with 'images' and 'certificates' keys
        if (files.images && Array.isArray(files.images)) {
          imagesToUpload = files.images;
          console.log(`📸 Found ${imagesToUpload.length} images to upload`);
        }
      } else {
        console.log("ℹ️  No files received");
      }

      // Get existing product
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check ownership
      if (product.sellerId.toString() !== userId.toString()) {
        throw new Error("Unauthorized: You can only update your own products");
      }

      // ✅ Handle image removal if specified
      if (updateData.removeImages && Array.isArray(updateData.removeImages)) {
        console.log(`🗑️  Removing ${updateData.removeImages.length} images...`);

        for (const publicId of updateData.removeImages) {
          try {
            await cloudinaryService.deleteImage(publicId);
            console.log(`✅ Deleted from Cloudinary: ${publicId}`);
          } catch (err) {
            console.warn(
              `⚠️  Could not delete image from Cloudinary: ${publicId}`
            );
          }

          // Remove from product.images array
          product.images = product.images.filter(
            (img) => img.publicId !== publicId
          );
        }

        console.log(`✅ Removed images, remaining: ${product.images.length}`);
      }

      // ✅ Reset main image flag on all existing images
      product.images.forEach((img) => {
        img.isMain = false;
      });

      // ✅ Handle new images upload
      if (imagesToUpload.length > 0) {
        console.log(`📸 Uploading ${imagesToUpload.length} new images...`);

        for (let i = 0; i < imagesToUpload.length; i++) {
          const file = imagesToUpload[i];

          console.log(`Uploading image ${i + 1}/${imagesToUpload.length}:`, {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
          });

          try {
            // Upload to Cloudinary ONLY (generates SHA-256 hash)
            const cloudinaryResult = await cloudinaryService.uploadImage(
              file.buffer,
              "products"
            );

            console.log(`✅ Cloudinary upload successful:`, {
              url: cloudinaryResult.url,
              publicId: cloudinaryResult.publicId,
              imageHash: cloudinaryResult.imageHash,
            });

            // Add new image to product with hash
            product.images.push({
              url: cloudinaryResult.url,
              publicId: cloudinaryResult.publicId,
              imageHash: cloudinaryResult.imageHash, // ✅ SHA-256 hash for blockchain
              isMain: false, // Will be set below
              viewType: this._getViewType(file.originalname, i),
            });

            console.log(`✅ Image ${i + 1} added to product with hash`);
          } catch (uploadError) {
            console.error(`❌ Failed to upload image ${i + 1}:`, uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
          }
        }

        console.log(
          `✅ All ${imagesToUpload.length} images uploaded successfully`
        );
      } else {
        console.log("ℹ️  No new images to upload");
      }

      // ✅ Set the FIRST image as main (whether existing or new)
      if (product.images.length > 0) {
        product.images[0].isMain = true;
        console.log(`✅ Set main image: ${product.images[0].url}`);
      } else {
        console.warn("⚠️  Product has no images after update!");
      }

      // ✅ Clean up apparelDetails - remove empty strings from enum fields
      if (updateData.apparelDetails) {
        const cleanedApparelDetails = { ...updateData.apparelDetails };

        // Remove empty enum fields
        if (cleanedApparelDetails.fabricType === "") {
          delete cleanedApparelDetails.fabricType;
        }
        if (cleanedApparelDetails.fit === "") {
          delete cleanedApparelDetails.fit;
        }
        if (cleanedApparelDetails.pattern === "") {
          delete cleanedApparelDetails.pattern;
        }
        if (cleanedApparelDetails.neckline === "") {
          delete cleanedApparelDetails.neckline;
        }
        if (cleanedApparelDetails.sleeveLength === "") {
          delete cleanedApparelDetails.sleeveLength;
        }

        updateData.apparelDetails = cleanedApparelDetails;
      }

      // Update other fields
      const allowedUpdates = [
        "name",
        "description",
        "category",
        "subcategory",
        "productType",
        "brand",
        "price",
        "costPrice",
        "quantity",
        "minStockLevel",
        "sku",
        "weight",
        "dimensions",
        "apparelDetails",
        "tags",
        "season",
        "countryOfOrigin",
        "manufacturer",
        "isFeatured",
        "isNewArrival",
        "isBestseller",
        "isSustainable",
        "certifications",
        "freeShipping",
        "shippingCost",
        "shippingDetails",
      ];

      allowedUpdates.forEach((field) => {
        if (updateData[field] !== undefined) {
          product[field] = updateData[field];
        }
      });

      // ✅ Force update timestamp to bust cache
      product.updatedAt = new Date();

      // Save the product
      await product.save();

      console.log(`✅ Product updated successfully: ${productId}`);
      console.log(`✅ Final image count: ${product.images.length}`);

      if (updateData.price && updateData.price !== product.price) {
        // Notify customers who have this in cart or wishlist
        const carts = await Cart.find({ "items.productId": product._id });
        for (const cart of carts) {
          if (cart.userId) {
            await notificationService.createNotification({
              userId: cart.userId,
              userRole: "customer",
              type: "cart_item_price_changed",
              category: "cart",
              title: "Price Update",
              message: `The price of "${product.name}" in your cart has changed`,
              productId: product._id,
              priority: "low",
              actionType: "view_product",
              actionUrl: `/products/${product._id}`,
            });
          }
        }
      }

      // Notify for out of stock
      if (
        updateData.quantity !== undefined &&
        updateData.quantity === 0 &&
        product.quantity > 0
      ) {
        await notificationService.createNotification({
          userId: product.seller,
          userRole: "vendor",
          type: "product_out_of_stock",
          category: "product",
          title: "Product Out of Stock",
          message: `"${product.name}" is now out of stock`,
          productId: product._id,
          priority: "high",
          isUrgent: true,
        });
      }

      // Notify for back in stock
      if (updateData.quantity > 0 && product.quantity === 0) {
        // Notify wishlist users
        const wishlists = await Wishlist.find({
          "items.productId": product._id,
        });
        for (const wishlist of wishlists) {
          await notificationService.createNotification({
            userId: wishlist.userId,
            userRole: "customer",
            type: "product_back_in_stock",
            category: "product",
            title: "Back in Stock!",
            message: `"${product.name}" is back in stock. Get it before it's gone!`,
            productId: product._id,
            priority: "medium",
            actionType: "view_product",
            actionUrl: `/products/${product._id}`,
          });
        }
      }

      // Log all image URLs for debugging
      if (product.images.length > 0) {
        console.log("📸 Image URLs:");
        product.images.forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.url} (Main: ${img.isMain})`);
        });
      }

      // ✅ Aggressively clear ALL caches
      await redisService.invalidateProduct(productId);
      await redisService.delPattern("products:*");
      await redisService.delPattern("product:*");

      console.log(`✅ Cache invalidated for product: ${productId}`);

      // ❌ REMOVED: IPFS metadata upload on update
      // IPFS should only store FILES (images, PDFs), not JSON metadata
      // Product updates (price, quantity, status) are mutable and belong in MongoDB only
      // Images are on Cloudinary ✅
      // Certificates are on IPFS ✅

      // Update blockchain (DEPRECATED - product updates are mutable)
      console.log("📝 Updating product on blockchain...");
      await this.updateProductOnBlockchain(product);
      console.log("✅ Product updated on blockchain successfully");

      // ✅ Return populated product with fresh data and cache-busted URLs
      const updatedProduct = await Product.findById(productId)
        .populate("sellerId", "name email companyName walletAddress")
        .lean();

      // ✅ Add timestamp to all image URLs to bust browser cache
      if (updatedProduct && updatedProduct.images) {
        const timestamp = Date.now();
        updatedProduct.images = updatedProduct.images.map((img) => ({
          ...img,
          url: `${img.url}?t=${timestamp}`,
        }));

        console.log(
          `✅ Added cache-busting timestamp to ${updatedProduct.images.length} images`
        );
      }

      return updatedProduct;
    } catch (error) {
      console.error("❌ Update product error:", error);
      console.error("Error stack:", error.stack);
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

      const previousState = product.toObject();

      product.status = status;
      await product.save();

      console.log(`✅ Status updated for product: ${productId} → ${status}`);

      // 🆕 LOG PRODUCT STATUS CHANGE
      const user = await User.findById(userId);
      await logger.logProduct({
        type: "product_status_changed",
        action: `Product status changed: ${product.name} → ${status}`,
        productId: product._id,
        userId,
        userDetails: user
          ? {
              walletAddress: user.walletAddress,
              role: user.role,
              name: user.name,
            }
          : {},
        status: "success",
        data: { newStatus: status },
        previousState,
        newState: product.toObject(),
      });

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

        // Upload to Cloudinary ONLY (generates SHA-256 hash)
        const cloudinaryResult = await cloudinaryService.uploadImage(
          file.buffer,
          "products"
        );

        product.images.push({
          url: cloudinaryResult.url,
          publicId: cloudinaryResult.publicId,
          imageHash: cloudinaryResult.imageHash, // ✅ SHA-256 hash for blockchain
          isMain: product.images.length === 0 && i === 0,
          viewType: this._getViewType(file.originalname, i),
        });

        // 🆕 LOG PRODUCT IMAGE UPLOAD
        const user = await User.findById(userId);
        await logger.logProduct({
          type: "product_image_uploaded",
          action: `Image uploaded for product: ${product.name}`,
          productId: product._id,
          userId,
          userDetails: user
            ? {
                walletAddress: user.walletAddress,
                role: user.role,
                name: user.name,
              }
            : {},
          status: "success",
          data: {
            imageUrl: cloudinaryResult.url,
            imageHash: cloudinaryResult.imageHash,
            fileName: file.originalname,
          },
          newState: product.toObject(),
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

      const previousState = product.toObject();

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

      // 🆕 LOG PRODUCT DELETION
      const user = await User.findById(userId);
      await logger.logProduct({
        type: "product_deleted",
        action: `Product deleted: ${product.name}`,
        productId: product._id,
        userId,
        userDetails: user
          ? {
              walletAddress: user.walletAddress,
              role: user.role,
              name: user.name,
            }
          : {},
        status: "success",
        data: { hardDelete },
        previousState,
        newState: hardDelete ? null : product.toObject(),
      });

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
      let history = [];
      let blockchainError = null;

      try {
        await fabricService.connect();
        const historyData = await fabricService.getProductHistory(
          product.blockchainProductId
        );
        fabricService.disconnect();

        // fabricService.getProductHistory already returns parsed JSON
        history = Array.isArray(historyData) ? historyData : [];
      } catch (blockchainErr) {
        blockchainError =
          blockchainErr.message || "Failed to retrieve blockchain history";
        console.error("⚠️  Blockchain history unavailable:", blockchainError);
        // Continue with empty history instead of failing completely
        try {
          fabricService.disconnect();
        } catch (disconnectErr) {
          // Ignore disconnect errors
        }
      }

      return {
        success: true,
        productId: productId,
        blockchainId: product.blockchainProductId,
        totalTransactions: history.length,
        history: history,
        ...(blockchainError && {
          warning: "Blockchain history temporarily unavailable",
          error: blockchainError,
        }),
      };
    } catch (error) {
      console.error("❌ Get history error:", error);

      // Return graceful error response instead of throwing
      return {
        success: false,
        message: "Unable to retrieve product history",
        error: error.message,
        history: [],
      };
    }
  }

  // ========================================
  // BLOCKCHAIN INTEGRATION METHODS
  // ========================================

  /**
   * Record product on blockchain
   */
  async recordProductOnBlockchain(product, metadataHash = null) {
    try {
      console.log(`📝 Recording product on blockchain: ${product._id}`);

      await fabricService.connect();

      // ✅ FIX: Convert Mongoose document to plain object to avoid circular references
      const productObj = product.toObject ? product.toObject() : product;

      // ✅ FIX: Ensure productId is a string and never undefined
      const productId = String(productObj._id || productObj.id || "");

      if (!productId || productId === "undefined") {
        throw new Error(`Invalid product ID: ${productObj._id}`);
      }

      // Prepare blockchain data with ALL comprehensive data
      const blockchainData = {
        // Basic Info
        productId: productId,
        sku: productObj.sku || "",
        qrCode: productObj.qrCode || "",
        name: productObj.name || "",
        description: productObj.description || "",
        category: productObj.category || "",
        subcategory: productObj.subcategory || "",
        productType: productObj.productType || "",
        brand: productObj.brand || "",

        // Seller Info
        sellerId: String(productObj.sellerId || ""),
        sellerName: productObj.sellerName || "",
        sellerWalletAddress: productObj.sellerWalletAddress || "",
        sellerRole: productObj.sellerRole || "supplier",

        // Apparel Details (ALL fields)
        apparelDetails: {
          size: productObj.apparelDetails?.size || "",
          fit: productObj.apparelDetails?.fit || "",
          color: productObj.apparelDetails?.color || "",
          pattern: productObj.apparelDetails?.pattern || "",
          material: productObj.apparelDetails?.material || "",
          fabricType: productObj.apparelDetails?.fabricType || "",
          fabricWeight: productObj.apparelDetails?.fabricWeight || "",
          fabricComposition: productObj.apparelDetails?.fabricComposition || [],
          neckline: productObj.apparelDetails?.neckline || "",
          sleeveLength: productObj.apparelDetails?.sleeveLength || "",
          careInstructions: productObj.apparelDetails?.careInstructions || "",
          washingTemperature: productObj.apparelDetails?.washingTemperature || "",
          ironingInstructions:
            productObj.apparelDetails?.ironingInstructions || "",
          dryCleanOnly: productObj.apparelDetails?.dryCleanOnly || false,
          measurements: productObj.apparelDetails?.measurements || {},
        },

        // Pricing
        price: productObj.price || 0,
        currency: productObj.currency || "CVT",
        costPrice: productObj.costPrice || 0,
        wholesalePrice: productObj.wholesalePrice || 0,
        markup: productObj.markup || 0,

        // Inventory
        quantity: productObj.quantity || 0,
        minStockLevel: productObj.minStockLevel || 0,
        barcode: productObj.barcode || "",
        unit: productObj.unit || "piece",

        // Images (Cloudinary URLs + SHA-256 hashes for verification)
        images: (productObj.images || []).map((img) => ({
          url: img.url || "",
          imageHash: img.imageHash || img.ipfsHash || "", // ✅ SHA-256 hash (backward compatible)
          isMain: img.isMain || false,
          viewType: img.viewType || "",
        })),

        // Manufacturing Details
        manufacturingDetails: {
          manufacturerId: productObj.manufacturingDetails?.manufacturerId || "",
          manufacturerName:
            productObj.manufacturingDetails?.manufacturerName || "",
          manufactureDate:
            productObj.manufacturingDetails?.manufactureDate || null,
          batchNumber: productObj.manufacturingDetails?.batchNumber || "",
          productionCountry:
            productObj.manufacturingDetails?.productionCountry || "",
          productionFacility:
            productObj.manufacturingDetails?.productionFacility || "",
          productionLine: productObj.manufacturingDetails?.productionLine || "",
        },

        // Certificates
        certificates: (productObj.certificates || []).map((cert) => ({
          name: cert.name || "",
          type: cert.type || "Other",
          certificateNumber: cert.certificateNumber || "",
          ipfsHash: cert.ipfsHash || "",
          ipfsUrl: cert.ipfsUrl || "",
          cloudinaryUrl: cert.cloudinaryUrl || "",
          issueDate: cert.issueDate || null,
          expiryDate: cert.expiryDate || null,
        })),

        // Specifications
        specifications: {
          weight: productObj.specifications?.weight || 0,
          weightUnit: productObj.specifications?.weightUnit || "",
          packageWeight: productObj.specifications?.packageWeight || 0,
          packageType: productObj.specifications?.packageType || "",
          dimensions: productObj.specifications?.dimensions || {},
        },

        // Sustainability
        sustainability: {
          isOrganic: Boolean(productObj.sustainability?.isOrganic),
          isFairTrade: Boolean(productObj.sustainability?.isFairTrade),
          isRecycled: Boolean(productObj.sustainability?.isRecycled),
          isCarbonNeutral: Boolean(productObj.sustainability?.isCarbonNeutral),
          waterSaving: Boolean(productObj.sustainability?.waterSaving),
          ethicalProduction: Boolean(productObj.sustainability?.ethicalProduction),
        },

        qualityGrade: productObj.qualityGrade || "Standard",

        // Location
        currentLocation: {
          facility: productObj.currentLocation?.facility || "",
          country: productObj.currentLocation?.country || "",
        },

        supplyChainSummary: productObj.supplyChainSummary || {},

        // Status
        status: productObj.status || "active",
        isVerified: Boolean(productObj.isVerified),
        isPublished: Boolean(productObj.isPublished),

        // SEO & Marketing
        tags: productObj.tags || [],
        keywords: productObj.keywords || [],
        metaDescription: productObj.metaDescription || "",
        season: productObj.season || "",
        collection: productObj.collection || "",

        // Additional
        minimumOrderQuantity: productObj.minimumOrderQuantity || 1,
        warrantyPeriod: productObj.warrantyPeriod || "",
        returnPolicy: productObj.returnPolicy || "",

        // Shipping
        freeShipping: Boolean(productObj.freeShipping),
        shippingCost: productObj.shippingCost || 0,
        shippingDetails: productObj.shippingDetails || {},

        // IPFS Reference
        ipfsHash: productObj.ipfsHash || "",

        // IPFS Metadata Hash (historical snapshot)
        metadataHash: metadataHash || productObj.metadataIpfsHash || null,
      };

      console.log("📦 Blockchain data prepared:", {
        productId: blockchainData.productId,
        name: blockchainData.name,
        category: blockchainData.category,
        sellerId: blockchainData.sellerId,
        metadataHash: blockchainData.metadataHash,
      });

      // Submit to blockchain - use new event-based method
      const result = await fabricService.recordProductCreation(blockchainData);

      console.log("✅ Product creation event recorded on blockchain:", result);

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
      await fabricService.disconnect();
    }
  }

  /**
   * Update product on blockchain
   * @deprecated Product updates are mutable and should NOT be stored on blockchain
   * Product details (price, stock, description) are mutable and belong in MongoDB only
   * Only immutable events (creation, verification, ownership transfer) belong on blockchain
   */
  async updateProductOnBlockchain(product) {
    // ⚠️ DEPRECATED: Product updates are mutable data that should NOT be on blockchain
    // Product updates are now tracked in MongoDB only
    console.log(`ℹ️ Product update tracking moved to MongoDB only (not blockchain): ${product._id}`);
    return;
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

      await fabricService.connect();

      const verificationData = {
        verifiedBy: expertId.toString(),
        verifiedByName: "Blockchain Expert",
        notes: "Product verified and authenticated",
      };

      await fabricService.recordProductVerification(
        product.blockchainProductId,
        verificationData
      );

      console.log(`✅ Product verification event recorded on blockchain: ${product._id}`);
    } catch (error) {
      console.error("❌ Blockchain verification error:", error);
      throw error;
    } finally {
      fabricService.disconnect();
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
        isNewArrival: true,
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
