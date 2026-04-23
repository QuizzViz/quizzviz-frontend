import { PlanType, useUserPlan } from '@/hooks/useUserPlan';

export type PlanLimits = {
  maxQuestions: number;
  maxQuizzes: number;
  maxCandidates: number;
  maxTeamMembers: number;
  availableExperience: string[];
  hasAnalytics: boolean;
  candidatesPerMonth?: boolean; // For paid plans
};

type PlanLimitsMap = {
  [K in NonNullable<PlanType>]: PlanLimits;
};

export const PLAN_LIMITS: PlanLimitsMap = {
  'Free': {
    maxQuestions: 20,
    maxQuizzes: 4,
    maxCandidates: 14,
    maxTeamMembers: 2,
    availableExperience: ['0-1 years', '1-3 years'],
    hasAnalytics: false,
    candidatesPerMonth: false
  },
  'Growth': {
    maxQuestions: 50,
    maxQuizzes: 30,
    maxCandidates: 500,
    maxTeamMembers: 3,
    availableExperience: ['0-1 years', '1-3 years', '3-5 years'],
    hasAnalytics: true,
    candidatesPerMonth: true
  },
  'Scale': {
    maxQuestions: 100,
    maxQuizzes: 70,
    maxCandidates: 2000,
    maxTeamMembers: 7,
    availableExperience: ['0-1 years', '1-3 years', '3-5 years', '5+ years'],
    hasAnalytics: true,
    candidatesPerMonth: true
  },
  'Enterprise': {
    maxQuestions: 150,
    maxQuizzes: -1, // Unlimited
    maxCandidates: 6000,
    maxTeamMembers: 20,
    availableExperience: ['0-1 years', '1-3 years', '3-5 years', '5+ years'],
    hasAnalytics: true,
    candidatesPerMonth: true
  }
} as const;

// This is now a function that takes a plan type and optional custom limits, returns the limits
export const getPlanLimits = (plan: PlanType | null, customLimits?: {
  maxQuizzes?: number;
  maxCandidates?: number;
  maxQuestions?: number;
  maxTeamMembers?: number;
}): PlanLimits => {
  if (!plan) return PLAN_LIMITS['Free'];
  
  const baseLimits = PLAN_LIMITS[plan];
  
  // If no custom limits, return base limits
  if (!customLimits) return baseLimits;
  
  // Merge custom limits with base limits
  return {
    ...baseLimits,
    maxQuizzes: customLimits.maxQuizzes !== undefined ? customLimits.maxQuizzes : baseLimits.maxQuizzes,
    maxCandidates: customLimits.maxCandidates !== undefined ? customLimits.maxCandidates : baseLimits.maxCandidates,
    maxQuestions: customLimits.maxQuestions !== undefined ? customLimits.maxQuestions : baseLimits.maxQuestions,
    maxTeamMembers: customLimits.maxTeamMembers !== undefined ? customLimits.maxTeamMembers : baseLimits.maxTeamMembers,
  };
};
export type { PlanType };

