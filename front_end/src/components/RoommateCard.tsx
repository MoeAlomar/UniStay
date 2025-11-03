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
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-foreground">{name}, {age}</h3>
                <p className="text-sm text-muted-foreground">{university}</p>
              </div>
              <Badge variant={gender === "female" ? "default" : "secondary"}>
                {gender === "female" ? "Female" : "Male"}
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Briefcase className="w-4 h-4" />
              <span>{major}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span>{preferredArea}</span>
            </div>

            <div className="mb-4">
              <span className="text-sm text-muted-foreground">Budget: </span>
              <span className="text-primary">{budget} SAR/mo</span>
            </div>

            <Button onClick={onMessage} className="w-full">
              Send Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
