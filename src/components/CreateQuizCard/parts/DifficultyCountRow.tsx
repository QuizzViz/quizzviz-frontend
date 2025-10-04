import { FC } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// Renders difficulty select and number-of-questions input side-by-side
const DifficultyCountRow: FC<{
  difficulty: string;
  setDifficulty: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  maxQuestions?: number;
}> = ({ difficulty, setDifficulty, count, setCount, maxQuestions = 100 }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-2">
        <Label className="text-foreground">Difficulty</Label>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="bg-background border-border text-foreground">
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
        <div className="flex justify-between items-center">
          <Label className="text-foreground">Number of Questions</Label>
          {maxQuestions && (
            <span className="text-xs text-muted-foreground">
              Max: {maxQuestions}
            </span>
          )}
        </div>
        <Input
          type="number"
          value={count}
          onChange={(e) => setCount(parseInt(e.target.value || "0"))}
          className="bg-background border-border text-foreground focus:border-foreground"
          min={1}
          max={maxQuestions}
          required
        />
      </div>
    </div>
  );
};

export default DifficultyCountRow