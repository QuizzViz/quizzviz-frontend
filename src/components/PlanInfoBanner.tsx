import Link from "next/link";
import { useUserPlan } from "@/hooks/useUserPlan";
import { getPlanLimits } from "@/config/plans";

export function PlanInfoBanner() {
  const { data: userPlan } = useUserPlan();
  const planType = userPlan?.plan_name || 'Free';
  const planLimits = getPlanLimits(planType);

  if (planType === 'Free') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <span className="font-semibold underline">Free Plan</span> with a limit of {planLimits.maxQuestions} questions per quiz and {planLimits.maxQuizzes} quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Growth Plan</Link> for 30 questions per quiz and 10 quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Scale Plan</Link> for more questions, quizzes, and team members.</p>
      </div>
    );
  }

  if (planType === 'Growth') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <span className="font-semibold underline">Growth Plan</span> with a limit of {planLimits.maxQuestions} questions per quiz and {planLimits.maxQuizzes} quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Scale Plan</Link> for more questions, quizzes, and team members.</p>
      </div>
    );
  }

  if (planType === 'Scale') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <span className="font-semibold underline">Scale Plan</span> with a limit of {planLimits.maxQuestions} questions per quiz and {planLimits.maxQuizzes} quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Enterprise Plan</Link> for unlimited quizzes and advanced features.</p>
      </div>
    );
  }

  if (planType === 'Enterprise') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <span className="font-semibold underline">Enterprise Plan</span> with access to all features including {planLimits.maxQuestions === -1 ? 'unlimited' : planLimits.maxQuestions} questions per quiz, {planLimits.maxQuizzes === -1 ? 'unlimited' : planLimits.maxQuizzes} quizzes per month, and advanced analytics.</p>
      </div>
    );
  }

  return null;
}