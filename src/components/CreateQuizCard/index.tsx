import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import QuizHeader from "./parts/QuizHeader";
import TopicInput from "./parts/TopicInput";
import DifficultyCountRow from "./parts/DifficultyCountRow";
import CodeTheorySlider from "./parts/CodeTheorySlider";
import GenerateButton from "./parts/GenerateButton";
import ReasoningPanel from "./parts/ReasoningPanel";
import { useCreateQuizV2 } from "./hooks/useCreateQuizV2";
import { useState } from "react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { currentPlan } from "@/config/plans";

interface CreateQuizCardProps {
  maxQuestions?: number;
}

// Main container composing all sub-parts and business logic via a hook
export default function CreateQuizCard({ maxQuestions = currentPlan.maxQuestions }: CreateQuizCardProps) {
  const [codePercentage, setCodePercentage] = useState(50);
  
  const {
    // form
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    count,
    setCount,
    // request
    isReasoning,
    isFetching,
    error,
    setError,
    quizData,
    setQuizData,
    // progress
    steps,
    stepIcons,
    stepIndex,
    typedText,
    progress,
    // actions
    handleGenerate: _handleGenerate,
  } = useCreateQuizV2();

  const handleGenerateWithLimit = (codePct: number) => {
    const effectiveMax = Math.min(maxQuestions, currentPlan.maxQuestions);
    if (count > effectiveMax) {
      setError(`Maximum ${effectiveMax} questions allowed in your plan`);
      return;
    }
    _handleGenerate(codePct);
  };
  
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return (
    <Card className="bg-background border-border">
      <CardContent className="p-8 space-y-6">
        <QuizHeader />
        <div className="space-y-4">
          <TopicInput topic={topic} setTopic={setTopic} icon={Zap} />
          
          {/* Mobile: Stack difficulty and count separately, Desktop: Use DifficultyCountRow */}
          <div className="block sm:hidden space-y-4">
            {/* Difficulty - Mobile Only */}
            <div className="space-y-2">
              <Label className="text-foreground">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue placeholder="Select difficulty"/>
                </SelectTrigger>
                <SelectContent className="bg-background border-border text-foreground">
                  <SelectItem value="High School">High School level</SelectItem>
                  <SelectItem value="Bachelors">Bachelors level</SelectItem>
                  <SelectItem value="Masters">Masters level</SelectItem>
                  <SelectItem value="PhD">PhD level</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Number of Questions - Mobile Only */}
            <div className="space-y-1">
              <NumberInput
                value={count}
                onChange={setCount}
                min={1}
                max={maxQuestions}
                showMaxIndicator={true}
                className="w-full"
              />
            </div>
          </div>
          
          {/* Desktop: Use the original DifficultyCountRow component */}
          <div className="hidden sm:block">
            <DifficultyCountRow 
              difficulty={difficulty} 
              setDifficulty={setDifficulty} 
              count={count} 
              setCount={setCount} 
              maxQuestions={maxQuestions}
            />
          </div>
          
          <CodeTheorySlider 
            codePercentage={codePercentage} 
            onCodePercentageChange={setCodePercentage} 
          />
        </div>
        <div className="pt-2 flex justify-end">
          <GenerateButton
            isBusy={isReasoning || isFetching}
            onClick={() => handleGenerateWithLimit(codePercentage)}
            labelBusy="Thinking..."
            labelIdle="Generate"
            leftIconBusy={Loader2}
            leftIconIdle={Send}
            className="w-full sm:w-auto"
          />
        </div>
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm">
            {typeof error === 'string' ? error : error}
          </div>
        )}
        <ReasoningPanel visible={isReasoning} steps={steps} stepIcons={stepIcons} stepIndex={stepIndex} typedText={typedText} />
      </CardContent>
    </Card>
  );
}