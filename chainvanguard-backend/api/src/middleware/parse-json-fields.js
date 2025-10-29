
/**
 * Middleware to parse JSON string fields from multipart form data
 *
 * When using multer with FormData, complex objects are sent as JSON strings.
 * This middleware parses them back into objects before they reach the route handler.
 */

export const parseJsonFields = (fields = []) => {
  return (req, res, next) => {
    try {
      // Parse specified fields from JSON strings to objects
      fields.forEach((field) => {
        if (req.body[field] && typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
            console.log(`Parsed ${field}:`, req.body[field]);
          } catch (error) {
            console.error(`Failed to parse ${field}:`, error);
            // Leave as string if parsing fails
          }
        }
      });

      next();
    } catch (error) {
      console.error("❌ parseJsonFields middleware error:", error);
      next(error);
    }
  };
};

export default parseJsonFields;
