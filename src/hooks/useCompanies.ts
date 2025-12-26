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

export function useCompanies(userId: string | undefined): UseCompaniesReturn {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
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