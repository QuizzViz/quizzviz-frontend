import { PlanType } from '@/hooks/useUserPlan';

export type PlanLimits = {
  maxQuestions: number;
  maxQuizzes: number;
  availableDifficulties: string[];
  hasAnalytics: boolean;
  hasBulkGenerate: boolean;
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
    hasBulkGenerate: false,
  },
  'Consumer': {
    maxQuestions: 60,
    maxQuizzes: 10,
    availableDifficulties: ['High School Level', 'Bachelors Level','Masters Level','PhD Level'],
    hasAnalytics: false,
    hasBulkGenerate: false,
  },
  'Elite': {
    maxQuestions: 150,
    maxQuizzes: 30,
    availableDifficulties: ['High School Level', 'Bachelors Level','Masters Level','PhD Level'],
    hasAnalytics: true,
    hasBulkGenerate: true,
  },
  'Business': {
    maxQuestions: 200,
    maxQuizzes: 30,
    availableDifficulties: ['High School Level', 'Bachelors Level','Masters Level','PhD Level'],
    hasAnalytics: true,
    hasBulkGenerate: true,
  }
} as const;

// This is now a function that takes a plan type and returns the limits
export const getPlanLimits = (plan: PlanType | null): PlanLimits => {
  if (!plan) return PLAN_LIMITS['Free'];
  return PLAN_LIMITS[plan];
};

// For backward compatibility with components that haven't been updated yet
declare global {
  // eslint-disable-next-line no-var
  var __CURRENT_PLAN__: PlanType | null;
}

// This will be set by the _app.tsx wrapper
export const currentPlan = (): PlanLimits => {
  if (!globalThis.__CURRENT_PLAN__) {
    console.warn('currentPlan called before plan was initialized. Defaulting to Free plan.');
    return PLAN_LIMITS['Free'];
  }
  return PLAN_LIMITS[globalThis.__CURRENT_PLAN__];
};
