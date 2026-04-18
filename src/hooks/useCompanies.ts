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
        if (userId) {
          // Original logic: fetch by user ID (owner)
          const response = await fetch(`/api/company/check?owner_id=${encodeURIComponent(userId)}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch company information`);
          }
          
          const data = await response.json();
          
          if (data.companies?.[0]) {
            const companyData = data.companies[0];
            setCompany({
              company_id: companyData.company_id || companyData.id,
              name: companyData.name,
              owner_email: companyData.owner_email || ''
            });
          }
        } else {
          // New logic: fetch by company_id from sessionStorage (for invited members)
          const companyId = getCompanyId();
          
          if (!companyId) {
            throw new Error('No user ID or company ID found');
          }

          const response = await fetch(`/api/company/${encodeURIComponent(companyId)}`);
          
          if (!response.ok) {
            if (response.status === 404) {
              // Company not found, clear the stored company_id
              clearCompanyId();
              throw new Error('Company not found. The invitation may have been revoked.');
            }
            throw new Error(`Failed to fetch company information`);
          }
          
          const companyData = await response.json();
          
          setCompany({
            company_id: companyData.company_id || companyData.id,
            name: companyData.name,
            owner_email: companyData.owner_email || ''
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch company');
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [userId]);

  return { company, loading, error };
}