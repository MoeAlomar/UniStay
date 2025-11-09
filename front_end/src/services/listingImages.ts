import { api } from "./api";
import type { Listing } from "./listings";

export type ListingImage = { id: string; listing?: string | number; url: string; is_primary?: boolean; created_at?: string };

// Upload images to backend (Cloudinary via Django) with progress
export async function bulkUploadImages(
  listingId: string | number,
  files: File[],
  onProgress?: (value: number) => void
): Promise<Listing> {
  const MAX_FILES = 10;
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const accepted = files.filter((f) => {
    const okType = f.type?.startsWith("image/") ?? true;
    const okSize = typeof f.size === "number" ? f.size <= MAX_SIZE : true;
    return okType && okSize;
  });

  const form = new FormData();
  form.append("listing", String(listingId));
  for (const f of accepted.slice(0, MAX_FILES)) {
    form.append("images", f);
  }

  const { data } = await api.post(`/listings/images/bulk-upload/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (evt) => {
      if (!onProgress) return;
      const total = evt.total || 1;
      const pct = Math.min(100, Math.round((evt.loaded / total) * 100));
      onProgress(pct);
    },
  });
  // Backend returns full listing with nested images
  return data as Listing;
}

export async function listImagesForListing(listingId: string | number): Promise<ListingImage[]> {
  const { data } = await api.get(`/listings/images/`, { params: { listing: listingId } });
  return data as ListingImage[];
}

export async function deleteImage(id: string) {
  await api.delete(`/listings/images/${id}/`);
}
