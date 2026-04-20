 import { useState, useEffect } from 'react';

export interface Company {
  company_id: string;
  name: string;
  owner_email: string;
  owner_id?: string;
}

interface UseCompaniesReturn {
  company: Company | null;
  loading: boolean;
  error: string | null;
}

// Helper function to store company_id in sessionStorage
export const storeCompanyId = (companyId: string) => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('company_id', companyId);
  }
};

// Helper function to get company_id from sessionStorage
export const getCompanyId = (): string | null => {
  if (typeof window !== 'undefined') {
    // Try userCompanyId first (for member users), then company_id (for owners)
    return sessionStorage.getItem('userCompanyId') || sessionStorage.getItem('company_id');
  }
  return null;
};

// Helper function to clear company_id from sessionStorage
export const clearCompanyId = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('company_id');
  }
};

export function useCompanies(userId?: string): UseCompaniesReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchCompany outside useEffect so it can be called from multiple effects
  const fetchCompany = async () => {
    console.log('useCompanies: Starting fetch with userId:', userId);
    setLoading(true);
    setError(null);

    let companyFound = false;
    try {
      // First try: fetch by user ID (for company owners)
      if (userId) {
        console.log('useCompanies: Trying fetch by user ID:', userId);
        const response = await fetch(`/api/company/check?owner_id=${encodeURIComponent(userId)}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('useCompanies: User ID fetch response:', data);
          
          if (data.companies?.[0]) {
            const companyData = data.companies[0];
            setCompany({
              company_id: companyData.company_id || companyData.id,
              name: companyData.name,
              owner_email: companyData.owner_email || '',
              owner_id: companyData.owner_id
            });
            companyFound = true;
            console.log('useCompanies: Company found via user ID');
          }
        } else {
          console.log('useCompanies: User ID fetch failed:', response.status);
        }
      }
      
      // Second try: fetch by company_id from sessionStorage (for invited members)
      if (!companyFound) {
        const companyId = getCompanyId();
        console.log('useCompanies: Trying fetch by company ID from sessionStorage:', companyId);
        
        if (companyId) {
          const response = await fetch(`/api/company/${encodeURIComponent(companyId)}`);
          console.log('useCompanies: Making API call to:', `/api/company/${encodeURIComponent(companyId)}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('useCompanies: Company ID fetch response:', data);
            
            setCompany({
              company_id: data.company_id || data.id,
              name: data.name,
              owner_email: data.owner_email || '',
              owner_id: data.owner_id
            });
            companyFound = true;
            console.log('useCompanies: Company found via sessionStorage company ID');
          } else {
            console.log('useCompanies: Company ID fetch failed:', response.status);
            if (response.status === 404) {
              // Company not found, clear the stored company_id
              clearCompanyId();
            }
          }
        } else {
          console.log('useCompanies: No company ID found in sessionStorage');
        }
      }
      
      // If no company found after both attempts, set company to null
      if (!companyFound) {
        console.log('useCompanies: No company found after all attempts');
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch company');
      setCompany(null);
    } finally {
      setLoading(false);
      console.log('useCompanies: Fetch completed, company:', companyFound ? 'found' : 'not found');
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [userId]);

  // Additional effect to re-fetch when sessionStorage company_id changes (for member users)
  useEffect(() => {
    const currentCompanyId = getCompanyId();
    if (currentCompanyId && !company) {
      console.log('useCompanies: Company ID detected in sessionStorage, re-fetching company:', currentCompanyId);
      fetchCompany();
    }
  }, [company, getCompanyId]);

  return { company, loading, error };
}