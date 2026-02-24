// src/lib/upload.ts
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

export const UPLOAD_BUTTON_STYLES = {
  container: "flex flex-col items-center justify-center",
  button:
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2",
  buttonLoading:
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 h-10 px-4 py-2",
  label: "text-sm text-muted-foreground mb-2",
  error: "text-sm text-destructive mt-2",
};

export const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!Object.keys(ACCEPTED_IMAGE_TYPES).includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

export function generateUniqueFileName(
  originalName: string,
  prefix: string,
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);

  return `${prefix}-${timestamp}-${random}.${extension}`;
}
