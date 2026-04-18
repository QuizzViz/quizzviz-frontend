// src/components/Dashboard/Header.tsx
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs'; 
import { LogoWithText } from '../LogoWithText';
import UserAvatarDropdown from '../UserAvatarDropdown';
import { useCompanyInfo } from '../../hooks/useCompanyInfo';

export const DashboardHeader: React.FC = () => {
  const { user, isLoaded } = useUser();  

  // Use the same logic as profile page
  const { companyInfo, isLoading } = useCompanyInfo();

  // Show skeleton loader while loading
  if (isLoading) {
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
        userName={(companyInfo?.name as string) || 'Company'}
        userEmail={userEmail}
      />
    </header>
  );
};