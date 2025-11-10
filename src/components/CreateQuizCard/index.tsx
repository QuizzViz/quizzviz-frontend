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
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/router";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { useUserPlan } from "@/hooks/useUserPlan";
import { getPlanLimits, PLAN_LIMITS } from "@/config/plans";
import { useQuizUsage, getUpgradeMessage } from "@/hooks/useQuizUsage";
import { useUser } from "@clerk/nextjs";

interface CreateQuizCardProps {
  maxQuestions?: number;
}

// Main container composing all sub-parts and business logic via a hook
export default function CreateQuizCard({ maxQuestions: propMaxQuestions }: CreateQuizCardProps) {
  const maxQuestions = propMaxQuestions;
  const [codePercentage, setCodePercentage] = useState(50);
  
  // Get user data
  const { user, isLoaded: isUserLoaded } = useUser();
  const { data: userPlan, isLoading: isLoadingPlan } = useUserPlan();
  const planName = userPlan?.plan_name || 'Free';
  const planLimits = getPlanLimits(planName);
  
  // Get quiz usage data
  const quizUsage = useQuizUsage();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const isLoadingUsage = quizUsage?.isLoading || isLoadingPlan || !isUserLoaded;
  
  // Get current plan info and usage
  const planInfo = useMemo(() => {
    if (!planName || !quizUsage?.data?.current_month) {
      return { 
        message: '', 
        upgradePlan: '', 
        showUpgrade: false, 
        hasReachedLimit: false, 
        userLimit: planLimits.maxQuizzes,
        currentMonthQuizzes: 0,
        remainingQuizzes: planLimits.maxQuizzes
      };
    }
    
    // const currentMonthQuizzes = quizUsage.data.current_month.quiz_count || 0;
    const currentMonthQuizzes = 10;
    const userLimit = planLimits.maxQuizzes;
    const isLimitReached = currentMonthQuizzes >= userLimit;
    const remainingQuizzes = Math.max(0, userLimit - currentMonthQuizzes);
    
    // Get upgrade message based on current plan
    const { message, upgradePlan, showUpgrade } = getUpgradeMessage(
      planName, 
      currentMonthQuizzes, 
      userLimit
    );
    
    return { 
      message, 
      upgradePlan, 
      showUpgrade, 
      hasReachedLimit: isLimitReached, 
      userLimit, 
      currentMonthQuizzes, 
      remainingQuizzes 
    };
  }, [planName, quizUsage?.data?.current_month, planLimits]);

  // Handle data refresh on mount and periodically
  useEffect(() => {
    let isMounted = true;
    
    const refetchAllData = async () => {
      if (!user) return;
      
      try {
        // Force reload user data
        await user.reload();
        
        // Invalidate and refetch quiz usage
        await queryClient.invalidateQueries({ 
          queryKey: ['quiz-usage'],
          refetchType: 'active',
        });
        
        if (quizUsage?.refetch) {
          await quizUsage.refetch();
        }
        
        if (isMounted && process.env.NODE_ENV !== 'production') {
          console.log('Data refreshed:', {
            planName,
            // quizCount: quizUsage?.data?.current_month?.quiz_count || 10,
            quizCount: 10,
            limit: planLimits.maxQuizzes
          });
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error refreshing data:', error);
        }
      }
    };
    
    // Initial fetch
    refetchAllData();
    
    // Set up periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(refetchAllData, 5 * 60 * 1000);
    
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [user, queryClient, planName, quizUsage, planLimits.maxQuizzes]);

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
    // Check plan limits first
    if (planInfo.hasReachedLimit) {
      setError(planInfo.message);
      return;
    }
    
    // Check if requested count exceeds remaining quota
    if (count > planInfo.remainingQuizzes) {
      setError(`You can only generate ${planInfo.remainingQuizzes} more quiz${planInfo.remainingQuizzes === 1 ? '' : 'es'} this month on your ${planName} plan.`);
      return;
    }
    
    // Check question count limit
    const effectiveMax = maxQuestions || 10;
    if (count > effectiveMax) {
      setError(`Maximum ${effectiveMax} questions allowed per quiz`);
      return;
    }

    _handleGenerate(codePct);
  };

  return (
    <Card className="bg-background border-border">
      <CardContent className="p-8 space-y-6">
        <QuizHeader />
        <div className="space-y-4">
          <TopicInput topic={topic} setTopic={setTopic} icon={Zap} />

          {/* Mobile: Stack difficulty and count separately */}
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
                      {planInfo.currentMonthQuizzes} / {planInfo.userLimit}
                    </span>
                  </div>
                  {planInfo.showUpgrade && planInfo.upgradePlan && (
                    <Button variant="link" className="h-auto p-0 text-blue-500 hover:text-blue-600" asChild>
                      <Link href="/pricing">
                        Upgrade to {planInfo.upgradePlan}
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
                  <div>
                    <Button
                      className={`bg-foreground hover:bg-muted-foreground text-background transition-all duration-300 px-5 py-2 rounded-lg shadow-md flex items-center ${
                        planInfo.hasReachedLimit ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      disabled={planInfo.hasReachedLimit}
                      onClick={() => handleGenerateWithLimit(codePercentage)}
                    >
                      {planInfo.hasReachedLimit ? (
                        <>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Limit Reached
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {planInfo.hasReachedLimit && (
                  <TooltipContent className="w-64 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Plan Limit Reached</p>
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {planInfo.message}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Link 
                          href="/pricing" 
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {planInfo.upgradePlan ? `Upgrade to ${planInfo.upgradePlan} Plan` : 'Upgrade Plan'}
                        </Link>
                      </div>
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <ReasoningPanel 
          visible={isReasoning} 
          steps={steps} 
          stepIcons={stepIcons} 
          stepIndex={stepIndex} 
          typedText={typedText} 
        />
      </CardContent>
    </Card>
  );
}