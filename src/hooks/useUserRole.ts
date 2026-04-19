import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export interface UserRole {
  id: string;
  user_id: string;
  company_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'INVITED';
  invite_token?: string | null;
  invited_email?: string | null;
  invite_expires_at?: string | null;
  joined_at?: string | null;
  created_at: string;
  updated_at: string;
  name?: string | null;
}

interface UseUserRoleReturn {
  userRole: UserRole | null;
  loading: boolean;
  error: string | null;
}

export function useUserRole(companyId?: string): UseUserRoleReturn {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id || !companyId) {
        console.log('Missing user ID or company ID:', { userId: user?.id, companyId });
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching user role:', { userId: user.id, companyId });

        const response = await fetch(
          `/api/company-members/role?user_id=${encodeURIComponent(user.id)}&company_id=${encodeURIComponent(companyId)}`,
          {
            method: 'GET',
            headers: {
              'accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch user role');
        }

        const data: UserRole = await response.json();
        console.log('User role fetched successfully:', data);
        
        // Store role in sessionStorage for easy access
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('userRole', JSON.stringify(data));
          sessionStorage.setItem('userCompanyId', companyId);
        }

        setUserRole(data);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch user role');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id, companyId]);

  return { userRole, loading, error };
}

// Helper function to get stored role
export const getStoredUserRole = (): UserRole | null => {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('userRole');
    return stored ? JSON.parse(stored) : null;
  }
  return null;
};

// Helper function to get stored company ID
export const getStoredUserCompanyId = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('userCompanyId');
  }
  return null;
};

// Helper function to clear stored role
export const clearStoredUserRole = () => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userCompanyId');
  }
};
