import { currentPlan, PLAN_TYPE } from "@/config/plans";
import Link from "next/link";

export function PlanInfoBanner() {
  if (PLAN_TYPE !== 'Free' && PLAN_TYPE !== 'Consumer' && PLAN_TYPE !== 'Elite') return null;

  if (PLAN_TYPE === 'Free') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <Link href="/pricing" className="font-semibold underline">Free Plan</Link> with a limit of {currentPlan.maxQuestions} questions per quiz and 2 quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Consumer Plan</Link> for 60 questions per quiz and 10 quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Elite Plan</Link> for 150 questions per quiz and 30 quizzes per month.</p>
      </div>
    );
  }

  if (PLAN_TYPE === 'Consumer') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <Link href="/pricing" className="font-semibold underline">Consumer Plan</Link> with a limit of {currentPlan.maxQuestions} questions per quiz and 10 quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Elite Plan</Link> for 150 questions per quiz and 30 quizzes per month.</p>
      </div>
    );
  }

  if (PLAN_TYPE === 'Elite') {
    return (
      <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
        <p>You're on the <Link href="/pricing" className="font-semibold underline">Elite Plan</Link> with a limit of {currentPlan.maxQuestions} questions per quiz and 30 quizzes per month.</p>
        <p className="mt-2">Upgrade to <Link href="/pricing" className="font-semibold underline">Business Plan</Link> for sharing quizzes with others and analytics and other advanced features.</p>
      </div>
    );
  }

  return null;
}