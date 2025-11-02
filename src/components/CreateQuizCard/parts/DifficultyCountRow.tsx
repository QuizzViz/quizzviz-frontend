import { FC } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useUserPlan } from "@/hooks/useUserPlan";
import { getPlanLimits } from "@/config/plans";
import Link from "next/link";

const defaultDifficulty = 'Bachelors Level';

const DifficultyCountRow: FC<{
  difficulty: string;
  setDifficulty: (v: string) => void;
  count: number;
  setCount: (v: number) => void;
  maxQuestions?: number;
}> = ({ difficulty = defaultDifficulty, setDifficulty, count, setCount, maxQuestions = 100 }) => {
  const { data: userPlan } = useUserPlan();
  const planName = userPlan?.plan_name || 'Free';
  const currentPlan = getPlanLimits(planName);
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-white block">Difficulty Level</Label>
        <Select 
          value={difficulty || defaultDifficulty} 
          onValueChange={setDifficulty}
          defaultValue={defaultDifficulty}
        >
          <SelectTrigger className="bg-background/50 border border-border/50 text-foreground h-10 w-full rounded-md [&>span]:w-full [&>span]:px-3 [&>span]:py-2 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:ring-transparent">
            <SelectValue>{difficulty || defaultDifficulty}</SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-background border-border text-foreground">
            <SelectItem value="High School Level">High School level</SelectItem>
            <SelectItem value="Bachelors Level">Bachelors Level</SelectItem>
            <SelectItem value="Masters Level">Masters level</SelectItem>
            {planName === 'Free' ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <SelectItem 
                        value="PhD Level" 
                        disabled 
                        className="opacity-50 cursor-not-allowed"
                      >
                        <div className="flex items-center">
                          <span>PhD level</span>
                          <Info className="ml-2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </SelectItem>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px]">
                    <p>Upgrade to <Link href="/pricing" className=" underline font-semibold text-blue-500">Consumer Plan</Link> to access PhD level difficulty</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <SelectItem value="PhD Level">PhD level</SelectItem>
            )}
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
    max={Math.min(maxQuestions, currentPlan.maxQuestions)}
    showMaxIndicator={false}
    className="w-full"  />
</div>
    </div>
  );
};

export default DifficultyCountRow