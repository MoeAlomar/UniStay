import { api } from "./api";

export type Listing = {
  id: number;
  owner: number;
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
  location_link: string;
  created_at: string;
  modified_at: string;
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

export async function changeStatus(id: string | number, status: Listing["status"]) {
  const { data } = await api.post(`/listings/${id}/change-status/`, { status });
  return data as Listing;
}

export async function dashboard() {
  const { data } = await api.get("/listings/dashboard/");
  return data as { total_listings: number; reserved: number; available: number; draft: number; listings: Listing[] };
}

