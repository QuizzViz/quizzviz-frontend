// This will be replaced with an API call later
export const PLAN_TYPE = 'Consumer'; // 'Consumer' | 'Business'

export const PLAN_LIMITS = {
  Consumer: {
    maxQuestions: 60,
    hasAnalytics: false,
    hasProctoring: false
  },
  Business: {
    maxQuestions: 1000, // or whatever your business limit is
    hasAnalytics: true,
    hasProctoring: true
  }
} as const;

export const currentPlan = PLAN_LIMITS[PLAN_TYPE];
