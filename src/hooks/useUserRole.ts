import { useUser, useAuth } from '@clerk/nextjs';
import { useCachedData } from './useCachedData';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
  // HTTP status of the last failed role fetch, when available. A 404 here
  // is a definitive "no membership record for this user in this company" —
  // unlike a generic error/undefined status, which could be a transient
  // network/service failure and should NOT be treated as proof of removal.
  errorStatus: number | null;
  refresh: () => void;
  clearCache: () => void;
}

export function useUserRole(companyId?: string): UseUserRoleReturn {
  const { user } = useUser();
  const { getToken, signOut } = useAuth();
  const router = useRouter();
  // useCachedData only preserves the error message string, not the thrown
  // Error object, so track the HTTP status out-of-band via a ref set inside
  // the fetcher below.
  const errorStatusRef = useRef<number | null>(null);

  // Create cache key based on user and company
  const cacheKey = `userRole_${user?.id || 'anonymous'}_${companyId || 'no-company'}`;

  // Use the cached data hook with 10 minute TTL for role data
  const { data: userRole, loading, error, refresh, clearCache } = useCachedData<UserRole>({
    fetcher: async () => {
      if (!user?.id || !companyId) {
        throw new Error('Missing user ID or company ID');
      }


      const token = await getToken();
      if (!token) {
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        errorStatusRef.current = response.status;

        // Check if member has been deleted
        if (response.status === 410 || errorData.deleted) {

          // Clear all stored data
          clearStoredUserRole();
          clearCache();

          // Sign out the user and redirect to home
          if (signOut) {
            await signOut();
          }

          // Redirect to home page with a message
          if (typeof window !== 'undefined') {
            router.push('/?message=deleted');
          }

          // Throw a specific error to prevent further processing
          throw new Error('MEMBER_DELETED');
        }

        throw new Error(errorData.error || 'Failed to fetch user role');
      }

      errorStatusRef.current = null;
      const data: UserRole = await response.json();

      return data;
    },
    dependencies: [user?.id, companyId],
    cacheKey,
    // This gates dashboard access, so it must never serve a stale "you're
    // still an active member" result after a real membership change. A
    // persisted (localStorage) cache defeated that: on a hard refresh,
    // useCachedData would immediately hand back the pre-removal cached role
    // — its 2s-later background refresh only logs a warning on failure and
    // never updates state, so a kicked-out member's stale cache entry could
    // keep granting access indefinitely. Disabled persistence and shortened
    // the TTL so every fresh mount (hard refresh, new tab) always re-checks
    // against the server instead of trusting old data.
    ttl: 30 * 1000, // 30 seconds
    usePersistentCache: false
  });

  // Store company_id in sessionStorage for member users when role is fetched
  useEffect(() => {
    if (userRole && userRole.company_id) {
      if (typeof window !== 'undefined') {
        // Store company_id in both sessionStorage and localStorage for member users
        sessionStorage.setItem('userCompanyId', userRole.company_id);
        localStorage.setItem('userCompanyId', userRole.company_id);
      }
    }
  }, [userRole]);

  // Notify role cache manager of role changes
  useEffect(() => {
    if (userRole) {
      roleCacheManager.notifyRoleChange(userRole);
    }
  }, [userRole]);

  // Handle MEMBER_DELETED error specially - don't show it as an error to the user
  const displayError = error === 'MEMBER_DELETED' ? null : error;

  return {
    userRole,
    loading,
    error: displayError,
    errorStatus: loading ? null : errorStatusRef.current,
    refresh,
    clearCache
  };
}

// Role change detection utilities
export const detectRoleChange = (currentRole: UserRole | null, newRole: UserRole | null): boolean => {
  if (!currentRole && !newRole) return false;
  if (!currentRole || !newRole) return true;
  
  return (
    currentRole.role !== newRole.role ||
    currentRole.status !== newRole.status ||
    currentRole.company_id !== newRole.company_id
  );
};

// Global role cache management
class RoleCacheManager {
  private static instance: RoleCacheManager;
  private roleChangeListeners: Set<(newRole: UserRole | null) => void> = new Set();
  private lastKnownRole: UserRole | null = null;

  static getInstance(): RoleCacheManager {
    if (!RoleCacheManager.instance) {
      RoleCacheManager.instance = new RoleCacheManager();
    }
    return RoleCacheManager.instance;
  }

  // Notify listeners of role changes
  notifyRoleChange(newRole: UserRole | null) {
    if (detectRoleChange(this.lastKnownRole, newRole)) {
      
      this.lastKnownRole = newRole;
      
      // Invalidate all role caches
      this.invalidateAllRoleCaches();
      
      // Notify listeners
      this.roleChangeListeners.forEach(listener => listener(newRole));
    }
  }

  // Add listener for role changes
  onRoleChange(listener: (newRole: UserRole | null) => void) {
    this.roleChangeListeners.add(listener);
    return () => this.roleChangeListeners.delete(listener);
  }

  // Invalidate all role-related caches
  private invalidateAllRoleCaches() {
    if (typeof window !== 'undefined') {
      // Clear sessionStorage role data
      sessionStorage.removeItem('userRole');
      sessionStorage.removeItem('userCompanyId');
      
      // Clear localStorage role data  
      localStorage.removeItem('userRole');
      localStorage.removeItem('userCompanyId');
      
      // Clear any other role-related cache keys
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('userRole_')) {
          sessionStorage.removeItem(key);
        }
      });
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('userRole_')) {
          localStorage.removeItem(key);
        }
      });
    }
    
  }

  // Force refresh role for a specific user/company
  async forceRefreshRole(userId: string, companyId: string, getToken: () => Promise<string | null>) {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      const response = await fetch(
        `/api/company-members/role?user_id=${encodeURIComponent(userId)}&company_id=${encodeURIComponent(companyId)}`,
        {
          method: "GET",
          headers: {
            'accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const newRole: UserRole = await response.json();
        this.notifyRoleChange(newRole);
        return newRole;
      }
    } catch (error) {
      console.error('Error force refreshing role:', error);
    }
    return null;
  }
}

// Export singleton instance
export const roleCacheManager = RoleCacheManager.getInstance();

// Utility function to force refresh role data (useful after role changes)
export const refreshUserRole = async (userId: string, companyId: string, getToken: () => Promise<string | null>) => {
  return await roleCacheManager.forceRefreshRole(userId, companyId, getToken);
};

// Hook to listen for role changes
export const useRoleChangeListener = (callback: (newRole: UserRole | null) => void) => {
  useEffect(() => {
    const unsubscribe = roleCacheManager.onRoleChange(callback);
    return () => {
      // Cleanup function
      unsubscribe();
    };
  }, [callback]);
};

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
