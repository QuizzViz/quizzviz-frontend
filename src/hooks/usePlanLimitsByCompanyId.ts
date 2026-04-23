import { getPlanLimits } from '@/config/plans';
import { PlanType } from './useUserPlan';
import { useCachedFetch } from './useCachedFetch';

export interface CurrentUsage {
  quizzesThisMonth: number;
  totalCandidates: number;
  teamMembers: number;
}

export interface LimitStatus {
  canCreateQuiz: boolean;
  canAddCandidate: boolean;
  canAddTeamMember: boolean;
  quizLimit: number;
  candidateLimit: number;
  teamMemberLimit: number;
  currentQuizzes: number;
  currentCandidates: number;
  currentTeamMembers: number;
  quizzesRemaining: number;
  candidatesRemaining: number;
  teamMembersRemaining: number;
  isQuizLimitReached: boolean;
  isCandidateLimitReached: boolean;
  isTeamMemberLimitReached: boolean;
}

interface CompanyData {
  id: string;
  name: string;
  plan_name?: PlanType;
  owner_email?: string;
  // Custom limits that can override plan defaults
  max_quizzes?: number;
  max_candidates?: number;
  max_team_members?: number;
  [key: string]: any;
}

/**
 * Gets plan limits for a company without requiring user authentication.
 * This fetches company information directly by companyId for external candidate quiz attempts.
 * Uses the company's actual plan and custom limits from the database instead of hardcoded values.
 */
export function usePlanLimitsByCompanyId(companyId: string, currentUsage?: CurrentUsage): LimitStatus {
  // Fetch company data from existing API endpoint
  const { data: companyData } = useCachedFetch<CompanyData>(
    ['company', companyId],
    companyId ? `/api/company/${encodeURIComponent(companyId)}` : '',
    { 
      enabled: Boolean(companyId)
    }
  );

  // Use fetched plan or default to Free
  const plan: PlanType = companyData?.plan_name || 'Free';
  
  // Check if company has custom limits that override plan defaults
  const customLimits = {
    maxQuizzes: companyData?.max_quizzes,
    maxCandidates: companyData?.max_candidates,
    maxTeamMembers: companyData?.max_team_members
  };
  
  // Get plan limits, applying any custom limits from the company data
  const planLimits = getPlanLimits(plan, customLimits);
  
  // Default usage if not provided
  const usage: CurrentUsage = currentUsage || {
    quizzesThisMonth: 0,
    totalCandidates: 0,
    teamMembers: 0
  };

  // Calculate remaining limits
  const quizzesRemaining = planLimits.maxQuizzes === -1 ? Infinity : Math.max(0, planLimits.maxQuizzes - usage.quizzesThisMonth);
  const candidatesRemaining = planLimits.maxCandidates === -1 ? Infinity : Math.max(0, planLimits.maxCandidates - usage.totalCandidates);
  const teamMembersRemaining = planLimits.maxTeamMembers === -1 ? Infinity : Math.max(0, planLimits.maxTeamMembers - usage.teamMembers);

  // Check if limits are reached
  const isQuizLimitReached = planLimits.maxQuizzes !== -1 && usage.quizzesThisMonth >= planLimits.maxQuizzes;
  const isCandidateLimitReached = planLimits.maxCandidates !== -1 && usage.totalCandidates >= planLimits.maxCandidates;
  const isTeamMemberLimitReached = planLimits.maxTeamMembers !== -1 && usage.teamMembers >= planLimits.maxTeamMembers;

  return {
    canCreateQuiz: !isQuizLimitReached,
    canAddCandidate: !isCandidateLimitReached,
    canAddTeamMember: !isTeamMemberLimitReached,
    quizLimit: planLimits.maxQuizzes,
    candidateLimit: planLimits.maxCandidates,
    teamMemberLimit: planLimits.maxTeamMembers,
    currentQuizzes: usage.quizzesThisMonth,
    currentCandidates: usage.totalCandidates,
    currentTeamMembers: usage.teamMembers,
    quizzesRemaining,
    candidatesRemaining,
    teamMembersRemaining,
    isQuizLimitReached,
    isCandidateLimitReached,
    isTeamMemberLimitReached
  };
}
