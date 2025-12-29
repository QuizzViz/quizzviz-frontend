// src/components/Dashboard/Header.tsx
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs'; 
import { LogoWithText } from '../LogoWithText';
import UserAvatarDropdown from '../UserAvatarDropdown';
import { useCachedFetch } from '../../hooks/useCachedFetch';

interface CompanyInfo {
  name: string;
  owner_email: string;
}

export const DashboardHeader: React.FC = () => {
  const { isLoaded, getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();  

  const userId = user?.id ?? '';
  const companyUrl = isUserLoaded && userId ? `/api/company/check?owner_id=${encodeURIComponent(userId)}` : '';
  
  const { data, isLoading } = useCachedFetch<{ companies: CompanyInfo[] }>(
    ['company', userId],
    companyUrl,
    {
      enabled: isUserLoaded && !!userId,
      select: (data) => data,
    }
  );

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
        <LogoWithText className="h-8 text-white" />
        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
      </header>
    );
  }

  const companyInfo = data?.companies?.[0];
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? '';

  return (
    <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
      <LogoWithText className="h-8 text-white" />
      <UserAvatarDropdown 
        userName={companyInfo?.name || 'Company'}
        userEmail={userEmail}
      />
    </header>
  );
};