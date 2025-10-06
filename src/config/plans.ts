export type PlanType = 'Free' | 'Consumer' | 'Business';

// This will be replaced with an API call later
export const PLAN_TYPE: PlanType = 'Business' ; // 'free' | 'consumer' | 'business'

export const PLAN_LIMITS = {
  Free: {
    maxQuestions: 10,
    hasAnalytics: false,
    hasProctoring: false,
    availableDifficulties: ['High School', 'Bachelors', 'Masters']
  },
  Consumer: {
    maxQuestions: 60,
    hasAnalytics: false,
    hasProctoring: false,
    availableDifficulties: ['High School', 'Bachelors', 'Masters', 'PhD']
  },
  Business: {
    maxQuestions: 1000,
    hasAnalytics: true,
    hasProctoring: true,
    availableDifficulties: ['High School', 'Bachelors', 'Masters', 'PhD']
  }
} as const;

export const currentPlan = PLAN_LIMITS[PLAN_TYPE];
