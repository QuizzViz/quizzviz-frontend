import { currentPlan, PLAN_TYPE } from "@/config/plans";

export function PlanInfoBanner() {
  if (PLAN_TYPE !== 'Free') return null;

  return (
    <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg text-sm text-blue-200">
      <p>You're on the <span className="font-semibold">Free Plan</span> with a limit of {currentPlan.maxQuestions} questions per quiz and 2 quizzes per month.</p>
      <p className="mt-1">Upgrade to <span className="font-semibold">Consumer Plan</span> for more questions and quizzes.</p>
    </div>
  );
}
