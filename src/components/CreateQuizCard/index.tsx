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

  // On successful generation: show toast, invalidate cache, and clear local quizData
  useEffect(() => {
    if (!quizData) return;
    // Invalidate cached quizzes so My Quizzes updates instantly
    queryClient.invalidateQueries({ queryKey: ["quizzes"] });

    const go = () => router.push("/dashboard/my-quizzes");
    const t = toast({
      title: "Quiz generated",
      description: `${quizData?.topic ?? "Your quiz"} is ready. Click to view in My Quizzes.`,
      duration: 15000,
      // Make the whole toast clickable and style it blue
      onClick: go,
      className: "cursor-pointer border-blue-600/60 bg-blue-700/30 text-blue-100 shadow-lg shadow-blue-600/30",
      action: (
        <ToastAction
          altText="View"
          onClick={go}
          className="border-blue-500/60 text-blue-100 hover:bg-blue-600/25"
        >
          View
        </ToastAction>
      ),
    });

    // clear local state so modal never renders
    setQuizData(null);
    // also clear any prior error
    setError(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizData]);

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
        
        <CodeTheorySlider balance={balance} setBalance={setBalance} />
        <GenerateButton
          isBusy={isReasoning || isFetching}
          onClick={handleGenerate}
          labelBusy="Thinking..."
          labelIdle="Generate"
          leftIconBusy={Loader2}
          leftIconIdle={Send}
        />
        {error && <div className="text-sm text-red-500">{error}</div>}
        <ReasoningPanel visible={isReasoning} steps={steps} stepIcons={stepIcons} stepIndex={stepIndex} typedText={typedText} progress={progress} />
      </CardContent>
    </Card>
  );
}