import { FC } from "react";
import { Label } from "@/components/ui/label";
import type { LucideIcon } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { TOPICS } from "@/constants/topics";

// Controlled combobox for quiz topic selection
const TopicInput: FC<{
  topic: string;
  setTopic: (v: string) => void;
  icon: LucideIcon;
}> = ({ topic, setTopic, icon: Icon }) => {
  return (
    <div className="space-y-2 w-full">
      <Label className="text-foreground">Topic</Label>
      <div className="relative w-full">
        <Combobox
          options={TOPICS}
          value={topic}
          onChange={setTopic}
          placeholder="Search or select a topic..."
          className="w-full h-14 text-base"
          inputClassName="h-10 text-sm"
          popoverClassName="w-full max-w-none"
        />
      </div>
    </div>
  );
};

export default TopicInput;
