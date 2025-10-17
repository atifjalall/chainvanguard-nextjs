import multer, { memoryStorage, MulterError } from "multer";

// Use memory storage (stores files in RAM as buffers)
const storage = memoryStorage();

// Allowed types
const DEFAULT_IMAGE_TYPES = "image/jpeg,image/png,image/jpg,image/webp";
const DEFAULT_DOC_TYPES = "application/pdf,application/msword";

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = (
    process.env.ALLOWED_IMAGE_TYPES || DEFAULT_IMAGE_TYPES
  ).split(",");
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new Error(`Invalid image type. Allowed: ${allowedTypes.join(", ")}`),
      false
    );
};

// File filter for documents
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = (
    process.env.ALLOWED_DOCUMENT_TYPES || DEFAULT_DOC_TYPES
  ).split(",");
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else
    cb(
      new Error(`Invalid document type. Allowed: ${allowedTypes.join(", ")}`),
      false
    );
};

// File filter for mixed uploads (images + docs)
const mixedFileFilter = (req, file, cb) => {
  const imageTypes = (
    process.env.ALLOWED_IMAGE_TYPES || DEFAULT_IMAGE_TYPES
  ).split(",");
  const docTypes = (
    process.env.ALLOWED_DOCUMENT_TYPES || DEFAULT_DOC_TYPES
  ).split(",");
  const allowedTypes = [...imageTypes, ...docTypes];

  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Invalid file type"), false);
};

// Max file size (default: 10MB)
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10);

// Upload configurations
const uploadImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxFileSize, files: 1 },
}).single("image");

const uploadMultipleImages = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: { fileSize: maxFileSize, files: 10 },
}).array("images", 10);

const uploadDocument = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: maxFileSize, files: 1 },
}).single("document");

const uploadMultipleDocuments = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: { fileSize: maxFileSize, files: 5 },
}).array("documents", 5);

const uploadProductFiles = multer({
  storage,
  fileFilter: mixedFileFilter,
  limits: { fileSize: maxFileSize, files: 15 },
}).fields([
  { name: "images", maxCount: 10 },
  { name: "certificates", maxCount: 5 },
]);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `File too large. Max size: ${maxFileSize / 1024 / 1024}MB`,
      });
    }

    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files uploaded.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  }

  next();
};

// ✅ Export as named exports (for ES Modules)
export {
  uploadImage,
  uploadMultipleImages,
  uploadDocument,
  uploadMultipleDocuments,
  uploadProductFiles,
  handleUploadError,
};
