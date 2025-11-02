import { PlanType, useUserPlan } from '@/hooks/useUserPlan';

export type PlanLimits = {
  maxQuestions: number;
  maxQuizzes: number;
  availableDifficulties: string[];
  hasAnalytics: boolean;
};

type PlanLimitsMap = {
  [K in NonNullable<PlanType>]: PlanLimits;
};

export const PLAN_LIMITS: PlanLimitsMap = {
  'Free': {
    maxQuestions: 10,
    maxQuizzes: 2,
    availableDifficulties: ['High School Level', 'Bachelors Level','Masters Level'],
    hasAnalytics: false,
  },
  'Consumer': {
    maxQuestions: 30,
    maxQuizzes: 10,
    availableDifficulties: ['High School Level', 'Bachelors Level','Masters Level','PhD Level'],
    hasAnalytics: false
  },
  'Elite': {
    maxQuestions: 100,
    maxQuizzes: 30,
    availableDifficulties: ['High School Level', 'Bachelors Level','Masters Level','PhD Level'],
    hasAnalytics: true
  },
  'Business': {
    maxQuestions: 200,
    maxQuizzes: 30,
    availableDifficulties: ['High School Level', 'Bachelors Level','Masters Level','PhD Level'],
    hasAnalytics: true
  }
} as const;

// This is now a function that takes a plan type and returns the limits
export const getPlanLimits = (plan: PlanType | null): PlanLimits => {
  if (!plan) return PLAN_LIMITS['Free'];
  return PLAN_LIMITS[plan];
};
export type { PlanType };

