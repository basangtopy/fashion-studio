// Extracts the Cloudinary public_id from a secure_url
//
// Example URL:
// https://res.cloudinary.com/your-cloud/image/upload/v1234567890/styles/abc123def.jpg
//
// Extracted public_id:
// styles/abc123def
//
// The public_id is everything after /upload/vXXXXXXXXXX/ and before the file extension

export const extractPublicId = (secureUrl) => {
  try {
    // Split on '/upload/' to isolate the path after it
    const afterUpload = secureUrl.split("/upload/")[1];

    if (!afterUpload) {
      throw new Error("Not a valid Cloudinary URL");
    }

    // Remove the version segment if present (v1234567890/)
    const withoutVersion = afterUpload.replace(/^v\d+\//, "");

    // Remove the file extension (.jpg, .png, .webp etc.)
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");

    return withoutExtension; // e.g. "styles/abc123def"
  } catch {
    return null;
  }
};
