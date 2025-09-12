import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Send, Zap } from "lucide-react";
import { QuizHeader } from "./parts/QuizHeader";
import { TopicInput } from "./parts/TopicInput";
import { DifficultyCountRow } from "./parts/DifficultyCountRow";
import { CodeTheorySlider } from "./parts/CodeTheorySlider";
import { GenerateButton } from "./parts/GenerateButton";
import { ReasoningPanel } from "./parts/ReasoningPanel";
import { QuizView } from "./parts/QuizView";
import { useCreateQuiz } from "./hooks/useCreateQuiz";

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

  if (quizData) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 space-y-6">
          <QuizView data={quizData} onBack={() => { setQuizData(null); setError(null); }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-8 space-y-6">
        <QuizHeader />
        <TopicInput topic={topic} setTopic={setTopic} icon={Zap} />
        <DifficultyCountRow difficulty={difficulty} setDifficulty={setDifficulty} count={count} setCount={setCount} />
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
