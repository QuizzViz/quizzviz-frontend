import { useState, useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/nextjs';

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
  const { getToken } = useAuth();
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add debugging to track role changes
  const previousCompanyIdRef = useRef<string | undefined>();
  const previousUserIdRef = useRef<string | undefined>();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id || !companyId) {
        console.log('Missing user ID or company ID:', { userId: user?.id, companyId });
        setUserRole(null);
        setLoading(false);
        return;
      }

      // Force refresh if user or company changed
      const userChanged = previousUserIdRef.current !== user.id;
      const companyChanged = previousCompanyIdRef.current !== companyId;
      
      if (userChanged || companyChanged) {
        console.log('User or company changed, forcing role refresh:', { 
          userChanged, 
          companyChanged, 
          previousUserId: previousUserIdRef.current, 
          newUserId: user.id,
          previousCompanyId: previousCompanyIdRef.current, 
          newCompanyId: companyId 
        });
        
        // Clear cached role when user/company changes (preserve localStorage as backup)
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('userRole');
          sessionStorage.removeItem('userCompanyId');
        }
      }

      try {
        setLoading(true);
        setError(null);

        console.log('Fetching user role:', { userId: user.id, companyId });

        const token = await getToken();
        if (!token) {
          console.error('No auth token available');
          throw new Error('No authentication token available');
        }

        const response = await fetch(
          `/api/company-members/role?user_id=${encodeURIComponent(user.id)}&company_id=${encodeURIComponent(companyId)}`,
          {
            method: 'GET',
            headers: {
              'accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        console.log('Role API response status:', response.status);
        console.log('Role API response ok:', response.ok);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Role API error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch user role');
        }

        const data: UserRole = await response.json();
        console.log('User role fetched successfully:', data);
        
        // Update refs for next comparison
        previousUserIdRef.current = user.id;
        previousCompanyIdRef.current = companyId;
        
        // Store role in both sessionStorage and localStorage for better persistence
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('userRole', JSON.stringify(data));
          sessionStorage.setItem('userCompanyId', companyId);
          localStorage.setItem('userRole', JSON.stringify(data));
          localStorage.setItem('userCompanyId', companyId);
        }

        setUserRole(data);
      } catch (error) {
        console.error('Error fetching user role:', error);
        
        // Fallback: check if there's a temporary role in sessionStorage
        if (typeof window !== 'undefined') {
          try {
            const storedRole = sessionStorage.getItem('userRole');
            const storedCompanyId = sessionStorage.getItem('userCompanyId');
            
            if (storedRole && storedCompanyId === companyId) {
              console.log('Using temporary stored role as fallback');
              const tempRole = JSON.parse(storedRole);
              setUserRole(tempRole);
              setError(null);
              setLoading(false);
              return;
            }
            
            // Additional fallback: check localStorage as well
            const localStorageRole = localStorage.getItem('userRole');
            const localStorageCompanyId = localStorage.getItem('userCompanyId');
            
            if (localStorageRole && localStorageCompanyId === companyId) {
              console.log('Using localStorage role as fallback');
              const tempRole = JSON.parse(localStorageRole);
              setUserRole(tempRole);
              // Also update sessionStorage for consistency
              sessionStorage.setItem('userRole', localStorageRole);
              sessionStorage.setItem('userCompanyId', localStorageCompanyId);
              setError(null);
              setLoading(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing stored role:', parseError);
          }
        }
        
        setError(error instanceof Error ? error.message : 'Failed to fetch user role');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user?.id, companyId]);

  // Listen for storage events to force role refresh
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('Storage event detected, forcing role refresh...');
      if (typeof window !== 'undefined') {
        // Only clear sessionStorage, keep localStorage as backup
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('userCompanyId');
      }
      // Force refetch by triggering the main effect
      setTimeout(() => {
        setUserRole(null);
      }, 50);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

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
    localStorage.removeItem('userRole');
    localStorage.removeItem('userCompanyId');
  }
};
