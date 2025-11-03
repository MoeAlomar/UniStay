import { MapPin, Heart } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface PropertyCardProps {
  id: string;
  image: string;
  price: number;
  title: string;
  location: string;
  distance: string;
  verified?: boolean;
  femaleOnly?: boolean;
  studentDiscount?: boolean;
  onClick?: () => void;
}

export function PropertyCard({
  image,
  price,
  title,
  location,
  distance,
  verified,
  femaleOnly,
  studentDiscount,
  onClick,
}: PropertyCardProps) {
  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        <button className="absolute top-3 right-3 bg-white rounded-full p-2 hover:bg-secondary transition-colors">
          <Heart className="w-4 h-4 text-foreground" />
        </button>
        <div className="absolute bottom-3 left-3 flex gap-2 flex-wrap">
          {verified && (
            <Badge className="bg-green-600 hover:bg-green-700">Verified</Badge>
          )}
          {femaleOnly && (
            <Badge className="bg-purple-600 hover:bg-purple-700">
              Female Only
            </Badge>
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

        <p className="text-sm text-muted-foreground">{distance} from campus</p>
      </CardContent>
    </Card>
  );
}
