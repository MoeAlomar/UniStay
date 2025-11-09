import { useEffect, useMemo, useState } from "react";
import { MapPin, Heart, Share2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { isFavorite as isFavoriteLocal, toggleFavorite } from "../services/favoritesLocal";

interface PropertyCardProps {
  id: string;
  image: string;
  price: number;
  title: string;
  location: string;
  status?: string;
  femaleOnly?: boolean;
  roommatesAllowed?: boolean;
  studentDiscount?: boolean;
  onClick?: () => void;
  onFavoriteToggle?: (favorited: boolean) => void;
}

export function PropertyCard({
  id,
  image,
  price,
  title,
  location,
  status,
  femaleOnly,
  roommatesAllowed,
  studentDiscount,
  onClick,
  onFavoriteToggle,
}: PropertyCardProps) {
  const [isFav, setIsFav] = useState<boolean>(() => isFavoriteLocal(id));
  const [showShare, setShowShare] = useState(false);
  const shareUrl = useMemo(() => {
    try {
      return `${window.location.origin}/?listing=${id}`;
    } catch (_) {
      return `/?listing=${id}`;
    }
  }, [id]);

  useEffect(() => {
    setIsFav(isFavoriteLocal(id));
  }, [id]);

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={image}
          alt=""
          data-cloudinary-transform="c_fill,w_600,dpr_auto"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            className="bg-card rounded-full p-2 hover:bg-secondary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              const next = toggleFavorite(id);
              setIsFav(next);
              if (onFavoriteToggle) onFavoriteToggle(next);
            }}
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={isFav ? "w-4 h-4 text-red-600" : "w-4 h-4 text-foreground"}
              fill={isFav ? "currentColor" : "none"}
            />
          </button>
          <button
            className="bg-card rounded-full p-2 hover:bg-secondary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowShare(true);
            }}
            aria-label="Share listing"
          >
            <Share2 className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {status === "AVAILABLE" && (
            <Badge variant="success">Available</Badge>
          )}
          {status === "RESERVED" && (
            <Badge variant="danger">Reserved</Badge>
          )}
          {status === "DRAFT" && (
            <Badge variant="gray">Draft</Badge>
          )}
          {femaleOnly && (
            <Badge className="bg-purple-600 hover:bg-purple-700">
              Female Only
            </Badge>
          )}
          {roommatesAllowed && (
            <Badge variant="warning">Roommates Allowed</Badge>
          )}
          {studentDiscount && (
            <Badge className="bg-blue-600 hover:bg-blue-700">
              Student Discount
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-foreground">{title}</h3>
          <span className="text-primary whitespace-nowrap ml-2">
            {price.toLocaleString()} SAR/mo
          </span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>

        {/* Distance from campus removed as requested */}
      </CardContent>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="sm:max-w-md" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Share Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">Copy and share this link:</div>
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                onClick={async () => {
                  try { await navigator.clipboard.writeText(shareUrl); } catch (_) {}
                }}
              >
                Copy
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
