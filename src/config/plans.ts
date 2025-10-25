export type PlanType = 'Free' | 'Consumer' | 'Elite' | 'Business';

// This will be replaced with an API call later
export const PLAN_TYPE: PlanType = 'Business' ; 

export const PLAN_LIMITS = {
  Free: {
    maxQuestions: 10,
    maxQuizzes: 2,
    hasAnalytics: false,
    hasProctoring: true,
    availableDifficulties: ['High School', 'Bachelors', 'Masters']
  },
  Consumer: {
    maxQuestions: 60,
    maxQuizzes: 10,
    hasAnalytics: false,
    hasProctoring: true,
    availableDifficulties: ['High School', 'Bachelors', 'Masters', 'PhD']
  },
  Elite: {
    maxQuestions: 150,
    maxQuizzes: 30,
    hasAnalytics: false,
    hasProctoring: true,
    availableDifficulties: ['High School', 'Bachelors', 'Masters', 'PhD']
  },
  Business: {
    maxQuestions: 200,
    maxQuizzes: 30,
    hasAnalytics: true,
    hasProctoring: true,
    availableDifficulties: ['High School', 'Bachelors', 'Masters', 'PhD']
  }
} as const;

export const currentPlan = PLAN_LIMITS[PLAN_TYPE];
