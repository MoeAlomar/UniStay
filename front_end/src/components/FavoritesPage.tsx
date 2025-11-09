import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { PropertyCard } from "./PropertyCard";
import { getFavoriteIds } from "../services/favoritesLocal";
import { details as listingDetails, districtOptions as fetchDistrictOptions } from "../services/listings";

interface FavoritesPageProps {
  onNavigate: (page: string, propertyId?: string) => void;
}

type CardItem = {
  id: string;
  image: string;
  price: number;
  title: string;
  location: string;
  status?: string;
  femaleOnly?: boolean;
  roommatesAllowed?: boolean;
  studentDiscount?: boolean;
};

export function FavoritesPage({ onNavigate }: FavoritesPageProps) {
  const [items, setItems] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFavorites() {
    try {
      setLoading(true);
      setError(null);
      const ids = getFavoriteIds();
      if (!ids.length) {
        setItems([]);
        return;
      }
      const [opts, list] = await Promise.all([
        fetchDistrictOptions(),
        Promise.all(ids.map(async (id) => {
          try { return await listingDetails(id); } catch (_) { return null; }
        }))
      ]);
      const labelMap = Object.fromEntries(opts.map((o) => [o.value, o.label]));
      const transformed: CardItem[] = (list.filter(Boolean) as any[]).map((l: any) => {
        const placeholder = "https://images.unsplash.com/photo-1515263487990-61b07816b324?auto=format&fit=crop&w=720&q=60";
        const primary = Array.isArray(l.images) ? (l.images.find((i: any) => i.is_primary) || null) : null;
        const first = Array.isArray(l.images) && l.images.length ? l.images[0] : null;
        const imageUrl = (primary?.url || first?.url || placeholder);
        return {
          id: String(l.id),
          image: imageUrl,
          price: Number(l.price),
          title: l.title,
          location: labelMap[l.district] || l.district || "",
          status: l.status,
          femaleOnly: !!l.female_only,
          roommatesAllowed: !!l.roommates_allowed,
          studentDiscount: !!l.student_discount,
        };
      });
      setItems(transformed);
    } catch (e: any) {
      setError("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFavorites();
  }, []);

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-foreground mb-1">Favorites</h2>
            <p className="text-muted-foreground text-sm">{items.length} saved listings</p>
          </div>
          <Button variant="outline" onClick={() => onNavigate("search")}>Browse Listings</Button>
        </div>

        {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
        {loading && <div className="mb-4 text-muted-foreground text-sm">Loading...</div>}

        {!loading && items.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">No favorites yet. Tap the heart on any listing.</Card>
        )}

        {items.length > 0 && (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((property) => (
              <PropertyCard
                key={property.id}
                {...property}
                onClick={() => onNavigate("listing", property.id)}
                onFavoriteToggle={(favorited) => {
                  if (!favorited) {
                    setItems((prev) => prev.filter((it) => it.id !== property.id));
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

