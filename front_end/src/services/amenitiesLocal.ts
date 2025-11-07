export type Amenity = { title: string; symbol: string };

const KEY = "listingAmenities";

function readStore(): Record<string, Amenity[]> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, Amenity[]>;
    return {};
  } catch (_) {
    return {};
  }
}

function writeStore(store: Record<string, Amenity[]>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch (_) {}
}

export function getAmenitiesForListing(id: string | number): Amenity[] {
  const store = readStore();
  return store[String(id)] || [];
}

export function setAmenitiesForListing(id: string | number, amenities: Amenity[]) {
  const store = readStore();
  store[String(id)] = amenities;
  writeStore(store);
}

export function removeAmenitiesForListing(id: string | number) {
  const store = readStore();
  delete store[String(id)];
  writeStore(store);
}

