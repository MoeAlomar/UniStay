import { MapPin, Briefcase } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface RoommateCardProps {
  id: string;
  name: string;
  age: number;
  university: string;
  major: string;
  budget: string;
  preferredArea: string;
  gender: "male" | "female";
  avatar?: string;
  onMessage?: () => void;
}

export function RoommateCard({
  name,
  age,
  university,
  major,
  budget,
  preferredArea,
  gender,
  avatar,
  onMessage,
}: RoommateCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 shrink-0">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-sm sm:text-base">
              {(() => {
                const parts = (name || "").trim().split(/\s+/).filter(Boolean);
                const f = parts[0]?.[0] || "";
                const l = parts.length > 1 ? parts[parts.length - 1]?.[0] || "" : "";
                const pair = (f + l).toUpperCase();
                return pair || "US";
              })()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1.5 sm:mb-2 gap-2">
              <div className="min-w-0">
                <h3 className="text-foreground text-sm sm:text-base truncate">{name}, {age}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{university}</p>
              </div>
              <Badge variant={gender === "female" ? "default" : "secondary"} className="text-xs py-0.5 px-1.5 sm:px-2 shrink-0">
                {gender === "female" ? "Female" : "Male"}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{major}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{preferredArea}</span>
            </div>

            <div className="mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm text-muted-foreground">Budget: </span>
              <span className="text-primary text-xs sm:text-sm font-semibold">{budget} SAR/mo</span>
            </div>

            <Button onClick={onMessage} className="w-full text-xs sm:text-sm h-8 sm:h-9">
              Send Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
