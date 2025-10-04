import { FC } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";

// Renders difficulty select and number-of-questions input side-by-side
const DifficultyCountRow: FC<{
  difficulty: string;
  setDifficulty: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  maxQuestions?: number;
}> = ({ difficulty, setDifficulty, count, setCount, maxQuestions = 100 }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white block">Difficulty Level</Label>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="bg-background/50 border-border text-foreground h-10 w-full">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent className="bg-background border-border text-foreground">
            <SelectItem value="High School">High School level</SelectItem>
            <SelectItem value="Bachelors">Bachelors level</SelectItem>
            <SelectItem value="Masters">Masters level</SelectItem>
            <SelectItem value="PhD">PhD level</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <div className="h-[20px] flex items-center">
          <Label className="text-sm font-medium text-white">Total Questions</Label>
        </div>
        <NumberInput
          value={count}
          onChange={setCount}
          min={1}
          max={maxQuestions}
          showMaxIndicator={false}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default DifficultyCountRow