import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Send, Zap, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { NumberInput } from "@/components/ui/number-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import QuizHeader from "./parts/QuizHeader";
import TopicInput from "./parts/TopicInput";
import DifficultyCountRow from "./parts/DifficultyCountRow";
import CodeTheorySlider from "./parts/CodeTheorySlider";
import GenerateButton from "./parts/GenerateButton";
import ReasoningPanel from "./parts/ReasoningPanel";
import { useCreateQuizV2 } from "./hooks/useCreateQuizV2";
import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { useQuizUsage, getUpgradeMessage, QuizUsageData } from "@/hooks/useQuizUsage";
import { useUser } from "@clerk/nextjs";

interface CreateQuizCardProps {
  maxQuestions?: number;
}

// Main container composing all sub-parts and business logic via a hook
export default function CreateQuizCard({ maxQuestions: propMaxQuestions }: CreateQuizCardProps) {
  const maxQuestions = propMaxQuestions;
  const [codePercentage, setCodePercentage] = useState(50);
  const { user } = useUser();
  const quizUsage = useQuizUsage();
  const isLoadingUsage = quizUsage?.isLoading || false;
  
  // Get plan from user's public metadata
  const planName = user?.publicMetadata?.plan as string || 'free';
  
  // For backward compatibility with existing code
  const userPlan = {
    plan_name: planName
  };

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

  // Get current plan info and usage
  const { message: upgradeMessage, upgradePlan, showUpgrade } = useMemo(() => {
    if (!planName || !quizUsage?.data) {
      return { message: '', upgradePlan: '', showUpgrade: false };
    }
    const currentMonthQuizzes = quizUsage.data?.current_month?.quiz_count || 0;
    return getUpgradeMessage(planName, currentMonthQuizzes, maxQuestions || 0);
  }, [planName, quizUsage, maxQuestions]);

  // Check if user has reached their monthly limit
  const hasReachedLimit = useMemo(() => {
    if (!planName || !quizUsage?.data) return false;
    const plan = planName.toLowerCase();
    const limits = {
      free: 2,
      consumer: 10,
      elite: 30,
      business: 30,
    } as const;
    
    const maxQuizzes = limits[plan as keyof typeof limits] || 0;
    const currentMonthQuizzes = quizUsage.data?.current_month?.quiz_count || 0;
    return currentMonthQuizzes >= maxQuizzes;
  }, [planName, quizUsage]);

  const handleGenerateWithLimit = (codePct: number) => {
    // Check plan limits first
    if (hasReachedLimit) {
      setError(upgradeMessage);
      return;
    }

    // Then check question count limit
    const effectiveMax = Math.min(maxQuestions as number);
    if (count > effectiveMax) {
      setError(`Maximum ${effectiveMax} questions allowed in your plan`);
      return;
    }

    _handleGenerate(codePct);
  };

  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

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
                <SelectTrigger className="bg-background border-border text-foreground outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
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
            <div className="space-y-1">
              <NumberInput
                value={count}
                onChange={setCount}
                min={1}
                max={maxQuestions}
                showMaxIndicator={true}
                className="w-full [&_input]:outline-none [&_input]:focus:outline-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0"
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
        <div className="pt-2 flex flex-col space-y-2">
          {planName.toLowerCase() !== 'free' && (
            isLoadingUsage ? (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">Checking your usage...</span>
              </div>
            ) : (
              quizUsage?.data?.current_month && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span>Quizzes this month: </span>
                    <span className="font-medium ml-1">
                      {quizUsage.data.current_month.quiz_count}
                      {maxQuestions ? ` / ${maxQuestions}` : ''}
                    </span>
                  </div>
                  {showUpgrade && upgradePlan && (
                    <Button variant="link" className="h-auto p-0 text-blue-500 hover:text-blue-600" asChild>
                      <Link href="/pricing">
                        Upgrade to {upgradePlan}
                      </Link>
                    </Button>
                  )}
                </div>
              )
            )
          )}

          <div className="flex justify-end">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={hasReachedLimit ? 'cursor-not-allowed' : ''}>
                    <GenerateButton
                      isBusy={isReasoning || isFetching}
                      onClick={() => handleGenerateWithLimit(codePercentage)}
                      labelBusy="Thinking..."
                      labelIdle={hasReachedLimit ? 'Limit Reached' : 'Generate'}
                      leftIconBusy={Loader2}
                      leftIconIdle={hasReachedLimit ? AlertCircle : Send}
                      className={`w-full sm:w-auto ${hasReachedLimit ? 'opacity-70' : ''}`}
                      disabled={hasReachedLimit}
                    />
                  </div>
                </TooltipTrigger>
                {hasReachedLimit && (
                  <TooltipContent className="w-64 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-yellow-100 dark:bg-yellow-900/50">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Plan Limit Reached</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            {upgradeMessage}
                          </p>
                        </div>
                      </div>
                      {upgradePlan && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="mt-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                          asChild
                        >
                          <Link href="/pricing" className="flex items-center justify-center">
                            <Zap className="h-4 w-4 mr-2" />
                            Upgrade to Consumer Plan
                          </Link>
                        </Button>
                      )}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
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