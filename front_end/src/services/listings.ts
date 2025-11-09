import { api } from "./api";
import type { User } from "./auth";

export type Listing = {
  id: number;
  owner: number;
  owner_details?: User;
  id_type: string;
  owner_identification_id: string;
  deed_number: string;
  title: string;
  description: string;
  price: number;
  type: string;
  female_only: boolean;
  roommates_allowed: boolean;
  student_discount: boolean;
  status: "AVAILABLE" | "RESERVED" | "DRAFT";
  district: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area?: number | null;
  location_link: string;
  created_at: string;
  modified_at: string;
  // Nested images from backend; urls are fully-qualified and browser-ready
  images?: Array<{ id: string; url: string; is_primary?: boolean }>;
};

export async function list(params?: Record<string, any>) {
  const { data } = await api.get("/listings/", { params });
  return data as Listing[];
}

export async function search(q: string) {
  const { data } = await api.get("/listings/search", { params: { q } });
  return data as Listing[];
}

export async function details(id: string | number) {
  const { data } = await api.get(`/listings/${id}/`);
  return data as Listing;
}

export async function create(payload: Partial<Listing>) {
  const { data } = await api.post("/listings/", payload);
  return data as Listing;
}

// Update an existing listing (partial fields allowed)
export async function update(id: string | number, payload: Partial<Listing>) {
  const { data } = await api.patch(`/listings/${id}/`, payload);
  return data as Listing;
}

// Delete an existing listing
export async function remove(id: string | number) {
  await api.delete(`/listings/${id}/`);
}

export async function changeStatus(id: string | number, status: Listing["status"]) {
  const { data } = await api.post(`/listings/${id}/change-status/`, { status });
  return data as Listing;
}

export async function dashboard() {
  const { data } = await api.get("/listings/dashboard/");
  return data as { total_listings: number; reserved: number; available: number; draft: number; listings: Listing[] };
}

// Fetch sorted district display names for filters and forms
export async function districtChoices() {
  const { data } = await api.get("/listings/districts/");
  return data as string[];
}

// Fetch district options as value/label pairs for dropdowns
export async function districtOptions() {
  const { data } = await api.get("/listings/district-options/");
  return data as { value: string; label: string }[];
}
