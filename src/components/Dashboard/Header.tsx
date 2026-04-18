// src/components/Dashboard/Header.tsx
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs'; 
import { LogoWithText } from '../LogoWithText';
import UserAvatarDropdown from '../UserAvatarDropdown';
import { useCompanies } from '../../hooks/useCompanies';

export const DashboardHeader: React.FC = () => {
  const { user, isLoaded } = useUser();  

  // Check if user is company owner (has company metadata) or invited member
  const hasCompanyMetadata = !!user?.unsafeMetadata?.companyId;
  // Company owners: use user ID. Invited members: use sessionStorage (undefined)
  const { company, loading, error } = useCompanies(hasCompanyMetadata ? user?.id : undefined);

  // Show skeleton loader while loading
  if (loading) {
    return (
      <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
        <span> </span>
        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
      </header>
    );
  }

  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? '';

  return (
    <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
      <span> </span>
      <UserAvatarDropdown 
        userName={company?.name || 'Company'}
        userEmail={userEmail}
      />
    </header>
  );
};