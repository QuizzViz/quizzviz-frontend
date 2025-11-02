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
        <p>You're on the <Link href="/pricing" className="font-semibold underline">Free Plan</Link> with a limit of {planLimits.maxQuestions} questions per quiz and {planLimits.maxQuizzes} quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Consumer Plan</Link> for 30 questions per quiz and 10 quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Elite Plan</Link> for 100 questions per quiz and 30 quizzes per month.</p>
      </div>
    );
  }

  if (planType === 'Consumer') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <Link href="/pricing" className="font-semibold underline">Consumer Plan</Link> with a limit of {planLimits.maxQuestions} questions per quiz and {planLimits.maxQuizzes} quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Elite Plan</Link> for 100 questions per quiz and 30 quizzes per month.</p>
      </div>
    );
  }

  if (planType === 'Elite') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <Link href="/pricing" className="font-semibold underline">Elite Plan</Link> with a limit of {planLimits.maxQuestions} questions per quiz and {planLimits.maxQuizzes} quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Business Plan</Link> for sharing quizzes with others,analytics and other advanced features.</p>
      </div>
    );
  }

  if (planType === 'Business') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <Link href="/pricing" className="font-semibold underline">Business Plan</Link> with access to all features including {planLimits.maxQuestions} questions per quiz, {planLimits.maxQuizzes} quizzes per month, and sharing quizzes with others.</p>
      </div>
    );
  }

  return null;
}