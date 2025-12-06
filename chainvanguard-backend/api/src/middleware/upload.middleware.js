import multer, { memoryStorage, MulterError } from "multer";

// ========================================
// CONFIGURATION
// ========================================

// Use memory storage (stores files in RAM as buffers)
const storage = memoryStorage();

// Allowed file types
const DEFAULT_IMAGE_TYPES =
  "image/jpeg,image/png,image/jpg,image/webp,image/gif";
const DEFAULT_DOC_TYPES =
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// Max file sizes
const MAX_IMAGE_SIZE = parseInt(process.env.MAX_IMAGE_SIZE || "10485760", 10);
const MAX_DOCUMENT_SIZE = parseInt(
  process.env.MAX_DOCUMENT_SIZE || "20971520",
  10
);

// ========================================
// FILE FILTERS
// ========================================

/**
 * File filter for images only
 */
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_IMAGE_TYPES || DEFAULT_IMAGE_TYPES)
    .split(",")
    .map((type) => type.trim());

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid image type: ${file.mimetype}. Allowed types: ${allowedTypes.join(", ")}`
      ),
      false
    );
  }
};

/**
 * File filter for documents only
 */
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = (process.env.ALLOWED_DOCUMENT_TYPES || DEFAULT_DOC_TYPES)
    .split(",")
    .map((type) => type.trim());

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid document type: ${file.mimetype}. Allowed types: ${allowedTypes.join(", ")}`
      ),
      false
    );
  }
};

/**
 * File filter for mixed uploads (images + documents)
 */
const mixedFileFilter = (req, file, cb) => {
  const imageTypes = (process.env.ALLOWED_IMAGE_TYPES || DEFAULT_IMAGE_TYPES)
    .split(",")
    .map((type) => type.trim());

  const docTypes = (process.env.ALLOWED_DOCUMENT_TYPES || DEFAULT_DOC_TYPES)
    .split(",")
    .map((type) => type.trim());

  const allowedTypes = [...imageTypes, ...docTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. File must be an image or document.`
      ),
      false
    );
  }
};

// ========================================
// UPLOAD CONFIGURATIONS
// ========================================

/**
 * Single image upload
 * Field name: 'image'
 * Max size: 10MB (default)
 */
const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
}).single("image");

/**
 * Multiple images upload
 * Field name: 'images'
 * Max files: 10
 * Max size per file: 10MB (default)
 */
const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 10,
  },
}).array("images", 10);

/**
 * Single document upload
 * Field name: 'document'
 * Max size: 20MB (default)
 */
const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 1,
  },
}).single("document");

/**
 * Multiple documents upload
 * Field name: 'documents'
 * Max files: 5
 * Max size per file: 20MB (default)
 */
const uploadMultipleDocuments = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 5,
  },
}).array("documents", 5);

/**
 * Product files upload (images + certificates)
 * Fields:
 *   - 'images' (max 10 files, 10MB each)
 *   - 'certificates' (max 5 files, 20MB each)
 * Total max files: 15
 */
const uploadProductFiles = multer({
  storage,
  fileFilter: mixedFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE, // Use larger size for certificates
    files: 15,
  },
}).fields([
  { name: "images", maxCount: 10 },
  { name: "certificates", maxCount: 5 },
]);

/**
 * User profile upload (avatar + documents)
 * Fields:
 *   - 'avatar' (1 image)
 *   - 'documents' (max 3 documents)
 */
const uploadUserFiles = multer({
  storage,
  fileFilter: mixedFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 4,
  },
}).fields([
  { name: "avatar", maxCount: 1 },
  { name: "documents", maxCount: 3 },
]);

/**
 * Any field upload (flexible)
 * Accepts any field names
 * Max 20 files total
 */
const uploadAny = multer({
  storage,
  fileFilter: mixedFileFilter,
  limits: {
    fileSize: MAX_DOCUMENT_SIZE,
    files: 20,
  },
}).any();

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

/**
 * Handle multer upload errors
 * Must be used after upload middleware in route
 */
const handleUploadError = (err, req, res, next) => {
  // Handle Multer-specific errors
  if (err instanceof MulterError) {
    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({
          success: false,
          error: "FILE_TOO_LARGE",
          message: `File too large. Maximum size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB for images, ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB for documents`,
          field: err.field,
        });

      case "LIMIT_FILE_COUNT":
        return res.status(400).json({
          success: false,
          error: "TOO_MANY_FILES",
          message: "Too many files uploaded. Please check the file limits.",
          field: err.field,
        });

      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({
          success: false,
          error: "UNEXPECTED_FIELD",
          message: `Unexpected field: ${err.field}`,
          field: err.field,
        });

      case "LIMIT_PART_COUNT":
        return res.status(400).json({
          success: false,
          error: "TOO_MANY_PARTS",
          message: "Too many parts in the multipart form",
        });

      case "LIMIT_FIELD_KEY":
        return res.status(400).json({
          success: false,
          error: "FIELD_NAME_TOO_LONG",
          message: "Field name is too long",
        });

      case "LIMIT_FIELD_VALUE":
        return res.status(400).json({
          success: false,
          error: "FIELD_VALUE_TOO_LONG",
          message: "Field value is too long",
        });

      case "LIMIT_FIELD_COUNT":
        return res.status(400).json({
          success: false,
          error: "TOO_MANY_FIELDS",
          message: "Too many fields in the form",
        });

      default:
        return res.status(400).json({
          success: false,
          error: "UPLOAD_ERROR",
          message: err.message || "File upload error",
        });
    }
  }

  // Handle custom validation errors (from file filters)
  if (err) {
    return res.status(400).json({
      success: false,
      error: "INVALID_FILE",
      message: err.message || "Invalid file uploaded",
    });
  }

  // No error, continue
  next();
};

/**
 * Validate uploaded files (optional extra validation)
 * Use after upload middleware for additional checks
 */
const validateUploadedFiles = (req, res, next) => {
  try {
    // Check if any files were uploaded
    if (!req.file && !req.files) {
      return res.status(400).json({
        success: false,
        error: "NO_FILES",
        message: "No files were uploaded",
      });
    }

    // Validate single file
    if (req.file) {
      if (!req.file.buffer || req.file.buffer.length === 0) {
        return res.status(400).json({
          success: false,
          error: "EMPTY_FILE",
          message: "Uploaded file is empty",
        });
      }
    }

    // Validate multiple files
    if (req.files) {
      const files = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();

      for (const file of files) {
        if (!file.buffer || file.buffer.length === 0) {
          return res.status(400).json({
            success: false,
            error: "EMPTY_FILE",
            message: `File ${file.originalname} is empty`,
          });
        }
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "VALIDATION_ERROR",
      message: error.message,
    });
  }
};

// ========================================
// EXPORTS
// ========================================

export {
  // Single uploads
  uploadImage,
  uploadDocument,

  // Multiple uploads
  uploadMultipleImages,
  uploadMultipleDocuments,

  // Field-specific uploads
  uploadProductFiles,
  uploadUserFiles,
  uploadAny,

  // Error handling
  handleUploadError,
  validateUploadedFiles,

  // Configurations (for reference)
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
};
