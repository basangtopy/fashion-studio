import { v2 as cloudinary } from "cloudinary";
import { extractPublicId } from "../utils/cloudinaryPublicId.js";

// Configure Cloudinary using environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Upload a single file buffer ───────────────────────────────────────────
// buffer:  the raw file data from multer (req.file.buffer)
// folder:  the Cloudinary folder to organise uploads e.g. 'styles', 'portfolio'
// options: any additional Cloudinary upload options
export const uploadImage = (buffer, folder, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    // Write the buffer to the upload stream
    uploadStream.end(buffer);
  });
};

// ─── Upload multiple file buffers ──────────────────────────────────────────
// files: array of multer file objects (req.files)
export const uploadMultipleImages = async (files, folder) => {
  const uploadPromises = files.map((file) => uploadImage(file.buffer, folder));
  // Upload all files in parallel
  return Promise.all(uploadPromises);
};

// ─── Delete multiple images by their secure URLs ───────────────────────────
// Takes an array of Cloudinary secure_urls (as stored in the database)
// Extracts public_ids and deletes them from Cloudinary
// Failures are logged but don't throw — a missing image shouldn't
// block the database update from completing
export const deleteImages = async (imageUrls) => {
  const results = await Promise.allSettled(
    imageUrls.map((url) => {
      const publicId = extractPublicId(url);
      if (!publicId) return Promise.resolve({ skipped: true, url });
      return cloudinary.uploader.destroy(publicId);
    }),
  );

  // Log any failures but don't throw
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `Failed to delete image ${imageUrls[index]}:`,
        result.reason,
      );
    }
  });

  return results;
};

export default cloudinary;
