import { FC } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LucideIcon } from "lucide-react";

// Controlled input for quiz topic with a right-side icon
const TopicInput: FC<{
  topic: string;
  setTopic: (v: string) => void;
  icon: LucideIcon;
}> = ({ topic, setTopic, icon: Icon }) => {
  return (
    <div className="space-y-2">
      <Label className="text-foreground">Topic</Label>
      <div className="relative">
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. MERN Stack"
          className="bg-background border-border text-foreground placeholder:text-muted-foreground/70 pr-12 py-6 text-lg focus:border-foreground"
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          
        </div>
      </div>
    </div>
  );
};

export default TopicInput
