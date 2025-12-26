// src/components/Dashboard/Header.tsx
import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs'; 
import { LogoWithText } from '../LogoWithText';
import UserAvatarDropdown from '../UserAvatarDropdown';


interface CompanyInfo {
  name: string;
  owner_email: string;
}

export const DashboardHeader: React.FC = () => {
  const { isLoaded, getToken } = useAuth();
    const { user, isLoaded: isUserLoaded } = useUser();  

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded || !user?.id) {
      setIsLoading(false);
      return;
    }

    const fetchCompanyInfo = async () => {
      try {
        const token = await getToken();
        const response = await fetch(
          `/api/company/check?owner_id=${encodeURIComponent(user.id)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
           console.log(`Company Name : ${data.companies[0].name}`)

          if (data.companies && data.companies.length > 0) {
            setCompanyInfo({
              name: data.companies[0].name,
              owner_email: data.companies[0].owner_email
            });
          }
        }
      } catch (error) {
        console.error('Error fetching company info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyInfo();
  }, [isLoaded, user?.id, getToken]);

  // Show skeleton loader while loading
  if (isLoading) {
    return (
      <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
        <LogoWithText className="h-8 text-white" />
        <div className="w-10 h-10 rounded-full bg-gray-700 animate-pulse" />
      </header>
    );
  }

  return (
    <header className="px-6 py-4 border-b border-black bg-black flex items-center justify-between">
      <LogoWithText className="h-8 text-white" />
      <UserAvatarDropdown 
        userName={companyInfo?.name || "Company"}
        userEmail={user?.emailAddresses?.[0]?.emailAddress}
      />
    </header>
  );
};