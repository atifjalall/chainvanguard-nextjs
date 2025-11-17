import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../utils/logger.js";

class GeminiService {
  constructor() {
    // Correct SDK initialization
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-2.5-flash - STABLE version with best quota
    this.modelName = "gemini-2.5-flash";
  }

  // ========================================
  // GENERATE INVENTORY DESCRIPTION
  // ========================================
  async generateInventoryDescription(inventoryData) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured in environment");
      }

      const context = this._buildInventoryContext(inventoryData);

      const prompt = `Generate a professional, detailed, and SEO-friendly description for an inventory item with the following details:

${context}

Create a comprehensive description that:
1. Starts with a clear overview of the item
2. Highlights key specifications and features
3. Mentions practical applications and use cases
4. Is informative yet concise (150-250 words)
5. Uses professional language suitable for B2B commerce
6. Naturally incorporates the category and specifications

Format the description with multiple paragraphs, using line breaks and proper spacing for readability. Separate sections logically, such as overview, specifications, and applications.`;

      // Get the model instance
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      if (!generatedText) {
        throw new Error("No content generated from Gemini");
      }

      logger.info(`Generated description for inventory: ${inventoryData.name}`);

      return {
        success: true,
        description: generatedText.trim(),
        metadata: {
          model: this.modelName,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error("Error generating inventory description:", error);

      if (
        error.message?.includes("API key") ||
        error.message?.includes("API_KEY_INVALID")
      ) {
        throw new Error(
          "Invalid API key. Visit https://aistudio.google.com/apikey"
        );
      }

      if (error.message?.includes("quota") || error.message?.includes("429")) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      }

      throw new Error(
        error.message || "Failed to generate description with Gemini"
      );
    }
  }

  // ========================================
  // BUILD CONTEXT FROM INVENTORY DATA
  // ========================================
  _buildInventoryContext(data) {
    const parts = [];

    if (data.name) parts.push(`Name: ${data.name}`);
    if (data.category) parts.push(`Category: ${data.category}`);
    if (data.subcategory) parts.push(`Subcategory: ${data.subcategory}`);
    if (data.unit) parts.push(`Unit: ${data.unit}`);
    if (data.manufacturer) parts.push(`Manufacturer: ${data.manufacturer}`);
    if (data.origin) parts.push(`Origin: ${data.origin}`);

    // Add specifications if available
    if (data.specifications && Object.keys(data.specifications).length > 0) {
      const specsText = Object.entries(data.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      parts.push(`Specifications: ${specsText}`);
    }

    return parts.join("\n");
  }

  // ========================================
  // GENERATE PRODUCT DESCRIPTION (for future use)
  // ========================================
  async generateProductDescription(productData) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured in environment");
      }

      const context = this._buildProductContext(productData);

      const prompt = `Generate a compelling product description for an e-commerce listing:

${context}

Create a description that:
1. Captures attention with a strong opening
2. Emphasizes unique selling points and benefits
3. Describes materials and craftsmanship
4. Includes relevant dimensions and specifications
5. Appeals to customer emotions and practical needs
6. Uses persuasive yet authentic language (200-300 words)

Format with multiple paragraphs, using line breaks and proper spacing for readability. Structure it into sections like introduction, features, and benefits for better visual appeal.`;

      // Get the model instance
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      if (!generatedText) {
        throw new Error("No content generated from Gemini");
      }

      logger.info(`Generated product description for: ${productData.name}`);

      return {
        success: true,
        description: generatedText.trim(),
        metadata: {
          model: this.modelName,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error("Error generating product description:", error);

      if (
        error.message?.includes("API key") ||
        error.message?.includes("API_KEY_INVALID")
      ) {
        throw new Error(
          "Invalid API key. Visit https://aistudio.google.com/apikey"
        );
      }

      if (error.message?.includes("quota") || error.message?.includes("429")) {
        throw new Error(
          "Rate limit exceeded. Please wait a moment and try again."
        );
      }

      throw new Error(
        error.message || "Failed to generate description with Gemini"
      );
    }
  }

  // ========================================
  // BUILD CONTEXT FROM PRODUCT DATA
  // ========================================
  _buildProductContext(data) {
    const parts = [];

    if (data.name) parts.push(`Product Name: ${data.name}`);
    if (data.category) parts.push(`Category: ${data.category}`);
    if (data.materials && data.materials.length > 0) {
      parts.push(`Materials: ${data.materials.join(", ")}`);
    }
    if (data.dimensions) {
      const dimText = Object.entries(data.dimensions)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      parts.push(`Dimensions: ${dimText}`);
    }
    if (data.features && data.features.length > 0) {
      parts.push(`Key Features: ${data.features.join(", ")}`);
    }
    if (data.color) parts.push(`Color: ${data.color}`);
    if (data.weight) parts.push(`Weight: ${data.weight}`);

    return parts.join("\n");
  }
}

export default new GeminiService();
