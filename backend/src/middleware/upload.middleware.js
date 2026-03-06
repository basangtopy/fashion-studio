import multer from "multer";
import AppError from "../utils/AppError.js";

// Use memory storage — files are kept as Buffers in memory
// and passed directly to Cloudinary without touching the disk
const storage = multer.memoryStorage();

// File filter — only allow image files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true); // accept the file
  } else {
    cb(
      new AppError("Only image files are allowed (JPEG, PNG, WebP, GIF)", 400),
      false, // reject the file
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max per file
    files: 10, // max 10 files per request
  },
});

// ─── Middleware exports ─────────────────────────────────────────────────────

// For routes that accept a single image
// fieldName must match the form field name the client sends
export const uploadSingle = (fieldName) => upload.single(fieldName);

// For routes that accept multiple images under the same field name
export const uploadMultiple = (fieldName, maxCount = 10) =>
  upload.array(fieldName, maxCount);

// For routes that accept images under different field names
export const uploadFields = (fields) => upload.fields(fields);
