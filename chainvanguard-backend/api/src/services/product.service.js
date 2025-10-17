import Product from "../models/Product.js";
import User from "../models/User.js";
import redisService from "./redis.service.js";
import cloudinaryService from "./cloudinary.service.js";
import ipfsService from "./ipfs.service.js";
import FabricService from "./fabric.service.js";
import { buildPaginationResponse, generateSKU } from "../utils/helpers.js";

class ProductService {
  constructor() {
    this.fabricService = new FabricService();
  }

  /**
   * CREATE PRODUCT
   * Flow: Upload files → Save to MongoDB → Record on Blockchain → Cache
   */
  async createProduct(productData, files, sellerId) {
    try {
      // 1. Get seller details
      const seller = await User.findById(sellerId);
      if (!seller) {
        throw new Error("Seller not found");
      }

      if (!["vendor", "supplier"].includes(seller.role)) {
        throw new Error("Only vendors and suppliers can create products");
      }

      // 2. Upload images to Cloudinary
      let uploadedImages = [];
      if (files && files.images) {
        console.log(
          `📸 Uploading ${files.images.length} images to Cloudinary...`
        );
        uploadedImages = await cloudinaryService.uploadMultipleImages(
          files.images,
          "products"
        );

        // Mark first image as main
        if (uploadedImages.length > 0) {
          uploadedImages[0].isMain = true;
        }
      }

      // 3. Upload certificates to IPFS + Cloudinary (dual storage)
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
              name: cert.originalname,
              type: productData.certificateType || "certificate",
              ipfsHash: ipfsResult.ipfsHash,
              ipfsUrl: ipfsResult.ipfsUrl,
              cloudinaryUrl: cloudinaryResult.url,
              uploadedAt: new Date(),
              fileSize: cert.size,
              mimeType: cert.mimetype,
            });
          }
        }
      }

      // 4. Create product in MongoDB
      const product = new Product({
        ...productData,
        sellerId: seller._id,
        sellerName: seller.name,
        sellerWalletAddress: seller.walletAddress,
        images: uploadedImages,
        certificates: uploadedCertificates,
        sku: productData.sku || generateSKU("PRD"),
        status: "active",
      });

      await product.save();
      console.log(`✅ Product saved to MongoDB: ${product._id}`);

      // 5. Record on blockchain (async - don't wait)
      this.recordProductOnBlockchain(product).catch((err) => {
        console.error("⚠️  Blockchain recording failed:", err.message);
        // Don't fail the request if blockchain fails
      });

      // 6. Cache in Redis
      await redisService.cacheProduct(product._id.toString(), product);

      // 7. Invalidate product list cache
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

  /**
   * GET ALL PRODUCTS (with filters, search, pagination)
   */
  async getAllProducts(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        category,
        minPrice,
        maxPrice,
        status = "active",
        sellerId,
        isFeatured,
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

      if (status) query.status = status;
      if (category) query.category = category;
      if (sellerId) query.sellerId = sellerId;
      if (isFeatured !== undefined) query.isFeatured = isFeatured;

      // Price range
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      // Text search
      if (search) {
        query.$text = { $search: search };
      }

      // Count total
      const total = await Product.countDocuments(query);

      // Build sort
      const sort = {};
      sort[sortBy] = sortOrder === "asc" ? 1 : -1;

      // Execute query with pagination
      const skip = (page - 1) * limit;
      const products = await Product.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .populate("sellerId", "name email companyName")
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

  /**
   * GET SINGLE PRODUCT BY ID
   */
  async getProductById(productId) {
    try {
      // Check cache first
      const cachedProduct = await redisService.getCachedProduct(productId);
      if (cachedProduct) {
        console.log("✅ Returning cached product");

        // Increment view count (async)
        Product.findByIdAndUpdate(productId, { $inc: { views: 1 } }).catch(
          (err) => console.error("View count update failed:", err)
        );

        return cachedProduct;
      }

      // Get from MongoDB
      const product = await Product.findById(productId)
        .populate("sellerId", "name email phone companyName walletAddress")
        .lean();

      if (!product) {
        throw new Error("Product not found");
      }

      // Increment view count
      await Product.findByIdAndUpdate(productId, { $inc: { views: 1 } });

      // Cache for 10 minutes
      await redisService.cacheProduct(productId, product);

      return product;
    } catch (error) {
      console.error("❌ Get product error:", error);
      throw error;
    }
  }

  /**
   * UPDATE PRODUCT
   */
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

      // Handle new images
      if (files && files.images) {
        console.log(`📸 Uploading ${files.images.length} new images...`);
        const newImages = await cloudinaryService.uploadMultipleImages(
          files.images,
          "products"
        );

        // Add to existing images
        product.images.push(...newImages);
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
              name: cert.originalname,
              type: updateData.certificateType || "certificate",
              ipfsHash: ipfsResult.ipfsHash,
              ipfsUrl: ipfsResult.ipfsUrl,
              cloudinaryUrl: cloudinaryResult.url,
              uploadedAt: new Date(),
              fileSize: cert.size,
              mimeType: cert.mimetype,
            });
          }
        }
      }

      // Update fields
      Object.keys(updateData).forEach((key) => {
        if (
          updateData[key] !== undefined &&
          key !== "images" &&
          key !== "certificates"
        ) {
          product[key] = updateData[key];
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

      return product;
    } catch (error) {
      console.error("❌ Update product error:", error);
      throw error;
    }
  }

  /**
   * DELETE PRODUCT (soft delete)
   */
  async deleteProduct(productId, userId, userRole) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error("Product not found");
      }

      // Check ownership (unless admin/expert)
      if (
        product.sellerId.toString() !== userId.toString() &&
        !["expert", "supplier"].includes(userRole)
      ) {
        throw new Error("Unauthorized: You can only delete your own products");
      }

      // Soft delete
      product.status = "discontinued";
      await product.save();

      console.log(`✅ Product deleted (soft): ${productId}`);

      // Invalidate cache
      await redisService.invalidateProduct(productId);

      return { success: true, message: "Product deleted successfully" };
    } catch (error) {
      console.error("❌ Delete product error:", error);
      throw error;
    }
  }

  /**
   * GET PRODUCT HISTORY FROM BLOCKCHAIN
   */
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
        };
      }

      // Get from blockchain
      await this.fabricService.connect();
      const history = await this.fabricService.getProductHistory(
        product.blockchainProductId
      );
      this.fabricService.disconnect();

      return {
        success: true,
        productId: productId,
        blockchainId: product.blockchainProductId,
        history: history,
      };
    } catch (error) {
      console.error("❌ Get history error:", error);
      throw error;
    }
  }

  /**
   * RECORD PRODUCT ON BLOCKCHAIN (Async)
   */
  async recordProductOnBlockchain(product) {
    try {
      await this.fabricService.connect();

      // Only store essential data on blockchain
      const blockchainData = {
        id: product._id.toString(),
        name: product.name,
        category: product.category,
        sellerId: product.sellerId.toString(),
        sellerWallet: product.sellerWalletAddress,
        price: product.price,
        quantity: product.quantity,
        sku: product.sku,
        // Store hashes, not actual files
        imageHashes: product.images.map((img) => img.publicId),
        certificateHashes: product.certificates.map((cert) => cert.ipfsHash),
        status: product.status,
        timestamp: new Date().toISOString(),
      };

      const result = await this.fabricService.createProduct(blockchainData);

      // Update MongoDB with blockchain reference
      await Product.findByIdAndUpdate(product._id, {
        blockchainProductId: result.id || product._id.toString(),
        blockchainTxId: result.txId || "",
        blockchainVerified: true,
      });

      console.log(`✅ Product recorded on blockchain: ${product._id}`);
    } catch (error) {
      console.error("❌ Blockchain recording error:", error);
      throw error;
    } finally {
      this.fabricService.disconnect();
    }
  }

  /**
   * UPDATE PRODUCT ON BLOCKCHAIN (Async)
   */
  async updateProductOnBlockchain(product) {
    try {
      if (!product.blockchainProductId) {
        // If not on blockchain yet, record it
        return await this.recordProductOnBlockchain(product);
      }

      await this.fabricService.connect();

      await this.fabricService.updateProduct(
        product.blockchainProductId,
        product.quantity,
        product.status
      );

      console.log(`✅ Product updated on blockchain: ${product._id}`);
    } catch (error) {
      console.error("❌ Blockchain update error:", error);
      throw error;
    } finally {
      this.fabricService.disconnect();
    }
  }

  /**
   * GET SELLER'S PRODUCTS
   */
  async getSellerProducts(sellerId, filters = {}) {
    return this.getAllProducts({ ...filters, sellerId });
  }

  /**
   * SEARCH PRODUCTS
   */
  async searchProducts(searchTerm, filters = {}) {
    return this.getAllProducts({ ...filters, search: searchTerm });
  }

  /**
   * GET FEATURED PRODUCTS
   */
  async getFeaturedProducts(limit = 10) {
    try {
      const products = await Product.find({
        status: "active",
        isFeatured: true,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("sellerId", "name companyName")
        .lean();

      return products;
    } catch (error) {
      console.error("❌ Get featured products error:", error);
      throw error;
    }
  }
}

export default new ProductService();
