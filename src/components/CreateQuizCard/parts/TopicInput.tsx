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
    <div className="space-y-2">
      <Label className="text-foreground">Topic</Label>
      <div className="relative">
        <Combobox
          options={TOPICS}
          value={topic}
          onChange={setTopic}
          placeholder="Select or search for a topic..."
          className="h-14 text-lg"
          inputClassName="h-14 text-base"
          popoverClassName="w-full max-w-md"
        />
      </div>
    </div>
  );
};

export default TopicInput;
