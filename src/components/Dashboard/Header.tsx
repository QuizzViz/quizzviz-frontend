// src/components/Dashboard/Header.tsx
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs'; 
import { LogoWithText } from '../LogoWithText';
import UserAvatarDropdown from '../UserAvatarDropdown';
import { useCompanies } from '../../hooks/useCompanies';

export const DashboardHeader: React.FC = () => {
  const { user, isLoaded } = useUser();  

  // Use user metadata first (like profile page), then fallback to useCompanies
  const metadataCompanyName = user?.unsafeMetadata?.companyName;
  const { company, loading, error } = useCompanies(user?.id);

  // Get company name from metadata first, then from company data
  const companyName = (metadataCompanyName as string) || (company?.name as string) || 'Company';

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
        userName={companyName || 'Company'}
        userEmail={userEmail}
      />
    </header>
  );
};