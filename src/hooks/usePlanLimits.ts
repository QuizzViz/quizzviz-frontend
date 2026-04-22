import { useUser } from '@clerk/nextjs';
import { useCompanyInfo } from './useCompanyInfo';
import { getPlanLimits } from '@/config/plans';
import { PlanType, useUserPlan } from './useUserPlan';

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

export function usePlanLimits(currentUsage?: CurrentUsage, customLimits?: {
  maxQuizzes?: number;
  maxCandidates?: number;
  maxQuestions?: number;
  maxTeamMembers?: number;
}): LimitStatus {
  const { user } = useUser();
  const { companyInfo } = useCompanyInfo();
  const { data: userPlanData } = useUserPlan();
  
  const plan = userPlanData?.plan_name || 'Free';
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

export function getLimitMessage(limitType: 'quiz' | 'candidate' | 'teamMember', plan: PlanType): string {
  const planLimits = getPlanLimits(plan);
  
  switch (limitType) {
    case 'quiz':
      if (planLimits.maxQuizzes === -1) return '';
      return `Quiz Limit Reached\n\nYou've reached your monthly limit of ${planLimits.maxQuizzes} quizzes.`;
    case 'candidate':
      if (planLimits.maxCandidates === -1) return '';
      return planLimits.candidatesPerMonth 
        ? `You've reached your monthly limit of ${planLimits.maxCandidates} candidates.`
        : `You've reached your limit of ${planLimits.maxCandidates} total candidates.`;
    case 'teamMember':
      if (planLimits.maxTeamMembers === -1) return '';
      return `You've reached your limit of ${planLimits.maxTeamMembers} team members.`;
    default:
      return '';
  }
}

export function getUpgradeCTA(plan: PlanType): { text: string; plan: string } {
  const upgradeMap = {
    'Free': { text: 'Upgrade to Growth', plan: 'Growth' },
    'Growth': { text: 'Upgrade to Scale', plan: 'Scale' },
    'Scale': { text: 'Upgrade to Enterprise', plan: 'Enterprise' },
    'Enterprise': { text: 'Contact Sales', plan: 'Enterprise' }
  };
  
  return upgradeMap[plan] || upgradeMap['Free'];
}
