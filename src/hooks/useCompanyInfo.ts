import { useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useCachedFetch } from '@/hooks/useCachedFetch';

export interface CompanyInfo {
  id: string;
  name: string;
  owner_email?: string;
  created_at?: string;
}

export function useCompanyInfo() {
  const { user, isLoaded } = useUser();

  // Use the same approach as profile page - metadata first, then localStorage fallback
  const metadataCompanyId = user?.unsafeMetadata?.companyId;
  const localStorageCompanyId = typeof window !== 'undefined' ? localStorage.getItem('userCompanyId') : null;
  const companyId = metadataCompanyId || localStorageCompanyId || '';
  const companyName = user?.unsafeMetadata?.companyName || (typeof window !== 'undefined' ? localStorage.getItem('userCompanyName') : null) || 'Company';

  // For invited members, fetch company data by company_id to get owner email
  // For company owners, fetch by user_id
  const fetchUrl = (metadataCompanyId || localStorageCompanyId) 
    ? `/api/company/${encodeURIComponent((metadataCompanyId || localStorageCompanyId) as string)}`
    : user?.id 
    ? `/api/company/check?owner_id=${user.id}`
    : '';
    
  const { data: companyData, isLoading, error: fetchError } = useCachedFetch<{
    exists?: boolean;
    companies?: Array<{
      id?: string;
      company_id?: string;
      name: string;
      owner_email?: string;
      created_at?: string;
    }>;
    // Single company object response
    company_id?: string;
    name?: string;
    owner_email?: string;
    created_at?: string;
  }>(
    ['companyInfo', user?.id || '', (metadataCompanyId || localStorageCompanyId || '') as string],
    fetchUrl,
    { enabled: Boolean(user && isLoaded && fetchUrl) }
  );

  // Process company data - same logic as profile page
  const companyInfo = useMemo((): CompanyInfo => {
    // For invited members, use metadata/localStorage but fetch company data to get owner email
    if (metadataCompanyId || localStorageCompanyId) {
      const companyId = (metadataCompanyId || localStorageCompanyId || '') as string;
      const companyName = (user?.unsafeMetadata?.companyName || (typeof window !== 'undefined' ? localStorage.getItem('userCompanyName') : null) || 'Company') as string;
      
      // Try to get owner email from fetched data
      let ownerEmail = '';
      if (companyData) {
        if (Array.isArray(companyData.companies) && companyData.companies.length > 0) {
          ownerEmail = companyData.companies[0]?.owner_email || '';
        } else if (companyData.owner_email) {
          ownerEmail = companyData.owner_email;
        }
      }
      
      return {
        id: companyId,
        name: companyName,
        owner_email: ownerEmail,
        created_at: companyData?.created_at
      };
    }
    
    // For company owners, use fetched company data
    if (companyData?.companies?.[0]) {
      const company = companyData.companies[0];
      return {
        id: (company.company_id || company.id || '') as string,
        name: company.name as string,
        owner_email: company.owner_email || '',
        created_at: company.created_at
      };
    }
    
    // Fallback
    return {
      id: (companyId || '') as string,
      name: (companyName || 'Company') as string,
      owner_email: '',
      created_at: undefined
    };
  }, [metadataCompanyId, localStorageCompanyId, user, companyData, companyId, companyName]);

  return {
    companyInfo,
    isLoading,
    error: fetchError,
    companyId,
    companyName
  };
}
