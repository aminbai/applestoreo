const CLOUD_NAME = "dkwwljbmy";
const UPLOAD_PRESET = "ml_default";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image file to Cloudinary.
 * Uses unsigned upload with the configured preset.
 * Optionally pass a folder to organise assets.
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = "apple-store"
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", folder);

  const response = await fetch(CLOUDINARY_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Cloudinary আপলোড ব্যর্থ: ${err}`);
  }

  return response.json();
}

/**
 * Check whether a URL is already a Cloudinary URL
 * (avoids re-uploading images that are already on Cloudinary).
 */
export function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("res.cloudinary.com") || url.includes("cloudinary.com");
}

/**
 * Build an optimised Cloudinary delivery URL with transforms.
 */
export function getOptimizedUrl(
  url: string,
  options: { width?: number; height?: number; quality?: string } = {}
): string {
  if (!isCloudinaryUrl(url)) return url;
  const { width, height, quality = "auto" } = options;
  // Insert transforms before /upload/
  const transforms: string[] = [`q_${quality}`, "f_auto"];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push("c_fill");
  return url.replace("/upload/", `/upload/${transforms.join(",")}/`);
}
