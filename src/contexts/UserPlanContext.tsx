'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserPlan, PlanType } from '@/hooks/useUserPlan';

interface UserPlanContextType {
  plan: PlanType;
  isLoading: boolean;
  error: Error | null;
  refreshPlan: () => void;
}

const UserPlanContext = createContext<UserPlanContextType | undefined>(undefined);

export function UserPlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  const { data, isLoading, error, refetch } = useUserPlan();
  const [currentPlan, setCurrentPlan] = useState<PlanType>('Free');

  // Update the global plan variable when data changes
  useEffect(() => {
    if (data?.plan_name) {
      setCurrentPlan(data.plan_name);
      // Set the global variable for backward compatibility
      globalThis.__CURRENT_PLAN__ = data.plan_name;
    } else if (user) {
      // If we have a user but no plan data, default to Free
      setCurrentPlan('Free');
      globalThis.__CURRENT_PLAN__ = 'Free';
    }
  }, [data, user]);

  const refreshPlan = () => {
    refetch();
  };

  return (
    <UserPlanContext.Provider
      value={{
        plan: currentPlan,
        isLoading,
        error: error as Error | null,
        refreshPlan,
      }}
    >
      {children}
    </UserPlanContext.Provider>
  );
}

export const useUserPlanContext = (): UserPlanContextType => {
  const context = useContext(UserPlanContext);
  if (context === undefined) {
    throw new Error('useUserPlanContext must be used within a UserPlanProvider');
  }
  return context;
};

// Declare the global variable for TypeScript
declare global {
  // eslint-disable-next-line no-var
  var __CURRENT_PLAN__: PlanType | null;
}
