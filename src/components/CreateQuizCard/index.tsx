import { Card, CardContent }  from "@/components/ui/card";
import { Loader2, Send, Zap }  from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import QuizHeader from "./parts/QuizHeader";
import  TopicInput  from "./parts/TopicInput";
import  DifficultyCountRow  from "./parts/DifficultyCountRow";
import  CodeTheorySlider  from "./parts/CodeTheorySlider";
import GenerateButton from "./parts/GenerateButton";
import ReasoningPanel  from "./parts/ReasoningPanel";
import  {useCreateQuiz}  from "./hooks/useCreateQuiz";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

// Main container composing all sub-parts and business logic via a hook
export default function CreateQuizCard() {
  const {
    // form
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    count,
    setCount,
    balance,
    setBalance,
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
    handleGenerate,
  } = useCreateQuiz();
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();


  return (
    <Card className="bg-card border-border">
      <CardContent className="p-8 space-y-6">
        <QuizHeader />
        <TopicInput topic={topic} setTopic={setTopic} icon={Zap} />
        
        {/* Mobile: Stack difficulty and count separately, Desktop: Use DifficultyCountRow */}
        <div className="block sm:hidden space-y-4">
          {/* Difficulty - Mobile Only */}
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
          
          {/* Number of Questions - Mobile Only */}
          <div className="space-y-2">
            <Label className="text-foreground">Number of Questions</Label>
            <Input
              type="number"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value || "0"))}
              className="bg-background border-border text-foreground focus:border-foreground"
              min={1}
              required
            />
          </div>
        </div>
        
        {/* Desktop: Use the original DifficultyCountRow component */}
        <div className="hidden sm:block">
          <DifficultyCountRow difficulty={difficulty} setDifficulty={setDifficulty} count={count} setCount={setCount} />
        </div>
        
        <CodeTheorySlider />
        <GenerateButton
          isBusy={isReasoning || isFetching}
          onClick={handleGenerate}
          labelBusy="Thinking..."
          labelIdle="Generate"
          leftIconBusy={Loader2}
          leftIconIdle={Send}
        />
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm">
            {typeof error === 'string' ? error : error}
          </div>
        )}
        <ReasoningPanel visible={isReasoning} steps={steps} stepIcons={stepIcons} stepIndex={stepIndex} typedText={typedText} progress={progress} />
      </CardContent>
    </Card>
  );
}