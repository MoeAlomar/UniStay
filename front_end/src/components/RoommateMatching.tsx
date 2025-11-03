import { useState } from "react";
import { RoommateCard } from "./RoommateCard";
import { Card, CardContent } from "./ui/card";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Slider } from "./ui/slider";
import { SlidersHorizontal } from "lucide-react";

interface RoommateMatchingProps {
  onNavigate: (page: string) => void;
}

const mockRoommates = [
  {
    id: "1",
    name: "Fatima Al-Saud",
    age: 21,
    university: "King Saud University",
    major: "Computer Science",
    budget: "1,500-2,000",
    preferredArea: "Al Malqa, Riyadh",
    gender: "female" as const,
  },
  {
    id: "2",
    name: "Noor Abdullah",
    age: 20,
    university: "Princess Nourah University",
    major: "Business Administration",
    budget: "1,200-1,800",
    preferredArea: "Olaya, Riyadh",
    gender: "female" as const,
  },
  {
    id: "3",
    name: "Layla Mohammed",
    age: 22,
    university: "King Saud University",
    major: "Medicine",
    budget: "2,000-2,500",
    preferredArea: "Al Yasmin, Riyadh",
    gender: "female" as const,
  },
  {
    id: "4",
    name: "Omar Hassan",
    age: 23,
    university: "King Saud University",
    major: "Engineering",
    budget: "1,800-2,200",
    preferredArea: "Al Nakheel, Riyadh",
    gender: "male" as const,
  },
  {
    id: "5",
    name: "Khalid Ahmed",
    age: 21,
    university: "Imam University",
    major: "Information Technology",
    budget: "1,500-2,000",
    preferredArea: "King Saud University Area",
    gender: "male" as const,
  },
  {
    id: "6",
    name: "Sarah Ali",
    age: 19,
    university: "Princess Nourah University",
    major: "Architecture",
    budget: "1,000-1,500",
    preferredArea: "Diplomatic Quarter",
    gender: "female" as const,
  },
];

export function RoommateMatching({ onNavigate }: RoommateMatchingProps) {
  const [budgetRange, setBudgetRange] = useState([1000, 3000]);
  const [selectedGender, setSelectedGender] = useState<string>("any");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("any");

  const filteredRoommates = mockRoommates.filter((roommate) => {
    if (selectedGender !== "any" && roommate.gender !== selectedGender) {
      return false;
    }
    if (
      selectedUniversity !== "any" &&
      !roommate.university.includes(selectedUniversity)
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="mb-2 text-foreground">Find Your Perfect Roommate</h1>
          <p className="text-muted-foreground">
            Connect with students looking to share accommodation
          </p>
        </div>

        <div className="flex gap-6">
          {/* Filter Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h3 className="text-foreground">Filters</h3>
                </div>

                {/* Budget Range */}
                <div className="mb-6">
                  <Label className="mb-3 block">
                    Budget Range: {budgetRange[0]} - {budgetRange[1]} SAR
                  </Label>
                  <Slider
                    min={0}
                    max={5000}
                    step={100}
                    value={budgetRange}
                    onValueChange={setBudgetRange}
                    className="mb-2"
                  />
                </div>

                {/* Gender Preference */}
                <div className="mb-6">
                  <Label className="mb-3 block">Gender Preference</Label>
                  <Select value={selectedGender} onValueChange={setSelectedGender}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* University */}
                <div className="mb-6">
                  <Label className="mb-3 block">University</Label>
                  <Select
                    value={selectedUniversity}
                    onValueChange={setSelectedUniversity}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any University</SelectItem>
                      <SelectItem value="King Saud">King Saud University</SelectItem>
                      <SelectItem value="Princess Nourah">
                        Princess Nourah University
                      </SelectItem>
                      <SelectItem value="Imam">Imam University</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Preferred Area */}
                <div className="mb-6">
                  <Label className="mb-3 block">Preferred Area</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="al-malqa">Al Malqa</SelectItem>
                      <SelectItem value="olaya">Olaya</SelectItem>
                      <SelectItem value="al-yasmin">Al Yasmin</SelectItem>
                      <SelectItem value="al-nakheel">Al Nakheel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roommate Cards */}
          <div className="flex-1">
            <div className="mb-6">
              <p className="text-muted-foreground text-sm">
                {filteredRoommates.length} potential roommates found
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {filteredRoommates.map((roommate) => (
                <RoommateCard
                  key={roommate.id}
                  {...roommate}
                  onMessage={() => onNavigate("messages")}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
