import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { MapPin, Heart, Share2 } from "lucide-react";
import { isFavorite as isFavoriteLocal, toggleFavorite } from "../services/favoritesLocal";

export interface PropertyCardProps {
  id: string;
  image: string;
  title: string;
  location: string;
  price: number;
  distance?: string;
  status?: string; // "AVAILABLE" | "RESERVED" | "DRAFT" | ...
  femaleOnly?: boolean;
  roommatesAllowed?: boolean;
  studentDiscount?: boolean;
  onClick?: () => void;
  onFavoriteToggle?: (favorited: boolean) => void;
}

export function PropertyCard(props: PropertyCardProps) {
  const {
    id,
    image,
    title,
    location,
    price,
    distance,
    status,
    femaleOnly,
    roommatesAllowed,
    studentDiscount,
    onClick,
    onFavoriteToggle,
  } = props;

  const [isFavorite, setIsFavorite] = useState(false);

  // Initialize favorite state from local storage
  useEffect(() => {
    try {
      setIsFavorite(isFavoriteLocal(id));
    } catch (_) {}
  }, [id]);

  const shareUrl = useMemo(() => {
    try {
      const origin = window.location.origin;
      return `${origin}/?listing=${id}`;
    } catch (_) {
      return `/?listing=${id}`;
    }
  }, [id]);

  const handleFavoriteClick = () => {
    try {
      const nowFav = toggleFavorite(id);
      setIsFavorite(nowFav);
      onFavoriteToggle?.(nowFav);
    } catch (_) {}
  };

  const handleShareClick = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title,
          text: "Check out this student housing listing on Darek",
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        // you can add a toast here if you use one
      }
    } catch (_) {}
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-56 w-full">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />

        {/* Top-left badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
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

        {/* Top-right actions */}
        <div
          className="absolute top-3 right-3 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()} // prevent card click navigation
        >
          <Button
  size="icon"
  variant="secondary"
  className={`rounded-full transition-colors ${
    isFavorite ? "text-black" : "text-muted-foreground"
  }`}
  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
  onClick={handleFavoriteClick}
>
  <Heart
    className="w-4 h-4"
    strokeWidth={2}
    fill={isFavorite ? "currentColor" : "none"}
  />
</Button>

          <Button
            size="icon"
            variant="secondary"
            className="rounded-full"
            aria-label="Share listing"
            onClick={handleShareClick}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-medium text-foreground mb-1 truncate">{title}</h3>
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="truncate">{location}</span>
          {distance && (
            <span className="ml-auto text-xs text-muted-foreground">
              {distance}
            </span>
          )}
        </div>

        <div className="text-right">
          <div className="text-lg font-semibold text-red-600">
            {price.toLocaleString()} SAR
            <span className="text-xs text-muted-foreground ml-1">/mo</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
