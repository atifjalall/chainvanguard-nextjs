import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../utils/logger.js";

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = "gemini-2.5-flash";
  }

  // ========================================
  // GENERATE PRODUCT DESCRIPTION
  // ========================================
  async generateProductDescription(productData) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const prompt = this._buildProductPrompt(productData);
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      if (!generatedText) {
        throw new Error("No content generated");
      }

      logger.info(`Generated product description: ${productData.name}`);

      return {
        success: true,
        description: generatedText.trim(),
        metadata: {
          model: this.modelName,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error("Gemini product generation error:", error);

      if (error.message?.includes("API key")) {
        throw new Error(
          "Invalid API key. Get one at https://aistudio.google.com/apikey"
        );
      }

      if (error.message?.includes("quota") || error.message?.includes("429")) {
        throw new Error("Rate limit exceeded. Try again in a moment.");
      }

      throw new Error(error.message || "Failed to generate description");
    }
  }

  // ========================================
  // BUILD PRODUCT PROMPT (NO MARKDOWN)
  // ========================================
  _buildProductPrompt(data) {
    const context = this._buildProductContext(data);

    return `Generate a compelling, SEO-optimized product description for e-commerce:

${context}

CRITICAL FORMATTING REQUIREMENTS:
- Write in PLAIN TEXT ONLY - absolutely NO markdown formatting
- NO asterisks (*), NO bullet points, NO bold text, NO special characters
- NO headers with # symbols
- NO lists with dashes or bullets
- Use ONLY plain paragraphs separated by double line breaks
- Write naturally as if describing the product to a customer in person

CONTENT REQUIREMENTS:
1. Start with an engaging opening that captures attention
2. Highlight unique selling points and customer benefits
3. Describe materials, dimensions, and key specifications naturally within sentences
4. Use persuasive yet authentic language
5. Write 200-300 words total
6. Professional tone suitable for ${data.category || "retail"} products
7. Include specifications naturally in the text, not as a separate list

STRUCTURE (but write as flowing paragraphs, NOT sections with headers):
- Begin with an introduction paragraph about the product's appeal
- Follow with a paragraph about materials, comfort, and quality
- Add a paragraph about fit, style versatility, and practical benefits
- End with key specifications woven naturally into a final paragraph

Remember: Write ONLY in plain, natural paragraphs. NO special formatting characters whatsoever.`;
  }

  // ========================================
  // BUILD PRODUCT CONTEXT
  // ========================================
  _buildProductContext(data) {
    const parts = [];

    if (data.name) parts.push(`Product: ${data.name}`);
    if (data.category) parts.push(`Category: ${data.category}`);
    if (data.subcategory) parts.push(`Subcategory: ${data.subcategory}`);

    if (data.materials?.length > 0) {
      parts.push(`Materials: ${data.materials.join(", ")}`);
    }

    if (data.dimensions) {
      const dims = Object.entries(data.dimensions)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      parts.push(`Dimensions: ${dims}`);
    }

    if (data.features?.length > 0) {
      parts.push(`Features: ${data.features.join(", ")}`);
    }

    if (data.specifications && Object.keys(data.specifications).length > 0) {
      const specs = Object.entries(data.specifications)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      parts.push(`Specifications: ${specs}`);
    }

    if (data.color) parts.push(`Color: ${data.color}`);
    if (data.weight) parts.push(`Weight: ${data.weight}`);
    if (data.brand) parts.push(`Brand: ${data.brand}`);
    if (data.warranty) parts.push(`Warranty: ${data.warranty}`);

    return parts.join("\n");
  }

  // ========================================
  // GENERATE INVENTORY DESCRIPTION
  // ========================================
  async generateInventoryDescription(inventoryData) {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured");
      }

      const prompt = this._buildInventoryPrompt(inventoryData);
      const model = this.genAI.getGenerativeModel({ model: this.modelName });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const generatedText = response.text();

      if (!generatedText) {
        throw new Error("No content generated");
      }

      logger.info(`Generated inventory description: ${inventoryData.name}`);

      return {
        success: true,
        description: generatedText.trim(),
        metadata: {
          model: this.modelName,
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error("Gemini inventory generation error:", error);

      if (error.message?.includes("API key")) {
        throw new Error(
          "Invalid API key. Get one at https://aistudio.google.com/apikey"
        );
      }

      if (error.message?.includes("quota") || error.message?.includes("429")) {
        throw new Error("Rate limit exceeded. Try again in a moment.");
      }

      throw new Error(error.message || "Failed to generate description");
    }
  }

  // ========================================
  // BUILD INVENTORY PROMPT (NO MARKDOWN)
  // ========================================
  _buildInventoryPrompt(data) {
    const context = this._buildInventoryContext(data);

    return `Generate a professional B2B inventory item description:

${context}

CRITICAL FORMATTING REQUIREMENTS:
- Write in PLAIN TEXT ONLY - absolutely NO markdown formatting
- NO asterisks (*), NO bullet points, NO bold text, NO special characters
- NO headers with # symbols
- NO lists with dashes or bullets
- Use ONLY plain paragraphs separated by double line breaks
- Write naturally as if describing the item to a business client

CONTENT REQUIREMENTS:
1. Start with a clear, concise overview of the item
2. Highlight key specifications and technical details naturally within sentences
3. Mention practical applications and use cases
4. Use professional B2B language
5. Write 150-250 words total
6. Naturally incorporate category and specifications into the text
7. SEO-friendly with natural keyword integration

STRUCTURE (but write as flowing paragraphs, NOT sections with headers):
- Begin with an introduction paragraph describing what the item is
- Follow with a paragraph about specifications and technical details
- End with a paragraph about applications, use cases, and benefits

Remember: Write ONLY in plain, natural paragraphs. NO special formatting characters whatsoever.`;
  }

  // ========================================
  // BUILD INVENTORY CONTEXT
  // ========================================
  _buildInventoryContext(data) {
    const parts = [];

    if (data.name) parts.push(`Item Name: ${data.name}`);
    if (data.category) parts.push(`Category: ${data.category}`);
    if (data.subcategory) parts.push(`Subcategory: ${data.subcategory}`);
    if (data.unit) parts.push(`Unit of Measure: ${data.unit}`);
    if (data.manufacturer) parts.push(`Manufacturer: ${data.manufacturer}`);
    if (data.origin) parts.push(`Origin: ${data.origin}`);

    if (data.specifications && Object.keys(data.specifications).length > 0) {
      const specs = Object.entries(data.specifications)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      parts.push(`Specifications: ${specs}`);
    }

    return parts.join("\n");
  }
}

export default new GeminiService();
