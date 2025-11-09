const KEY_BASE = "favorites:listings";

function keyForUser(): string {
  try {
    const uid = localStorage.getItem("currentUserId");
    if (uid && uid.trim()) return `${KEY_BASE}:${uid}`;
  } catch (_) {}
  return `${KEY_BASE}:guest`;
}

export type FavoriteEntry = { id: string; saved_at: number };

function read(): Record<string, FavoriteEntry> {
  try {
    const key = keyForUser();
    // Backward compatible: if scoped key missing, read legacy global key
    const raw = localStorage.getItem(key) ?? localStorage.getItem(KEY_BASE);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, FavoriteEntry>;
    return {};
  } catch {
    return {};
  }
}

function write(store: Record<string, FavoriteEntry>) {
  try {
    const key = keyForUser();
    localStorage.setItem(key, JSON.stringify(store));
  } catch {}
}

export function getFavoriteIds(): string[] {
  const store = read();
  return Object.keys(store);
}

export function isFavorite(id: string | number): boolean {
  const store = read();
  return !!store[String(id)];
}

export function addFavorite(id: string | number) {
  const store = read();
  store[String(id)] = { id: String(id), saved_at: Date.now() };
  write(store);
}

export function removeFavorite(id: string | number) {
  const store = read();
  delete store[String(id)];
  write(store);
}

export function toggleFavorite(id: string | number): boolean {
  const store = read();
  const key = String(id);
  if (store[key]) {
    delete store[key];
    write(store);
    return false;
  }
  store[key] = { id: key, saved_at: Date.now() };
  write(store);
  return true;
}
