import { FC } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";
import { getPlanLimits } from "@/config/plans";
import Link from "next/link";

const defaultExperience = '1-3';

interface ExperienceCountRowProps {
  experience: string;
  setExperience: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  maxQuestions?: number;
  className?: string;
}

const ExperienceCountRow: FC<ExperienceCountRowProps> = ({
  experience: propExperience,
  setExperience,
  count,
  setCount,
  maxQuestions = 100,
  className = ''
}) => {
  // Ensure experience is never undefined, fallback to default
  const experience = propExperience || defaultExperience;
  const { data: userPlan } = useUserPlan();
  const planName = userPlan?.plan_name || 'Free';
  const currentPlan = getPlanLimits(planName);
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-foreground block">Experience Level</Label>
        <Select 
          value={experience || defaultExperience} 
          onValueChange={setExperience}
          defaultValue={defaultExperience}
        >
          <SelectTrigger className="bg-background/50 border border-border/50 text-foreground h-10 w-full rounded-md [&>span]:w-full [&>span]:px-3 [&>span]:py-2 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent">
            <SelectValue>{experience || defaultExperience}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border-border text-foreground">
            <SelectItem value="0-1">0-1</SelectItem>
            <SelectItem value="1-3">1-3</SelectItem>
            <SelectItem value="3-5">3-5</SelectItem>
            <SelectItem value="5+">5+</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 mt-4 sm:mt-0">
        <div className="h-[20px] flex items-center">
          <Label className="text-sm font-medium text-foreground block w-full">Total Questions</Label>
        </div>
        <NumberInput
          value={count}
          onChange={setCount}
          min={1}
          max={100} // Set fixed max to 100 questions
          showMaxIndicator={false}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default ExperienceCountRow
