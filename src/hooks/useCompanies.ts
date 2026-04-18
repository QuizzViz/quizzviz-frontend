 import { useState, useEffect } from 'react';

export interface Company {
  company_id: string;
  name: string;
  owner_email: string;
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
    return sessionStorage.getItem('company_id');
  }
  return null;
};

// Helper function to clear company_id from sessionStorage
export const clearCompanyId = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('company_id');
  }
};

export function useCompanies(userId: string | undefined): UseCompaniesReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      setError(null);

      try {
        let companyFound = false;
        
        // First try: fetch by user ID (for company owners)
        if (userId) {
          const response = await fetch(`/api/company/check?owner_id=${encodeURIComponent(userId)}`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.companies?.[0]) {
              const companyData = data.companies[0];
              setCompany({
                company_id: companyData.company_id || companyData.id,
                name: companyData.name,
                owner_email: companyData.owner_email || ''
              });
              companyFound = true;
            }
          }
        }
        
        // Second try: fetch by company_id from sessionStorage (for invited members)
        if (!companyFound) {
          const companyId = getCompanyId();
          
          if (companyId) {
            const response = await fetch(`/api/company/${encodeURIComponent(companyId)}`);
            
            if (response.ok) {
              const data = await response.json();
              
              setCompany({
                company_id: data.company_id || data.id,
                name: data.name,
                owner_email: data.owner_email || ''
              });
              companyFound = true;
            } else if (response.status === 404) {
              // Company not found, clear the stored company_id
              clearCompanyId();
            }
          }
        }
        
        // If no company found after both attempts, set company to null
        if (!companyFound) {
          setCompany(null);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch company information');
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [userId]);

  return { company, loading, error };
}