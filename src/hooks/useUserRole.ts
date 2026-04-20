import { useUser, useAuth } from '@clerk/nextjs';
import { useCachedData } from './useCachedData';
import { useEffect } from 'react';

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
  refresh: () => void;
  clearCache: () => void;
}

export function useUserRole(companyId?: string): UseUserRoleReturn {
  const { user } = useUser();
  const { getToken } = useAuth();

  // Create cache key based on user and company
  const cacheKey = `userRole_${user?.id || 'anonymous'}_${companyId || 'no-company'}`;

  // Use the cached data hook with 10 minute TTL for role data
  const { data: userRole, loading, error, refresh, clearCache } = useCachedData<UserRole>({
    fetcher: async () => {
      if (!user?.id || !companyId) {
        throw new Error('Missing user ID or company ID');
      }

      console.log('🔄 Fetching fresh user role:', { userId: user.id, companyId });

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
        throw new Error(errorData.error || 'Failed to fetch user role');
      }

      const data: UserRole = await response.json();
      console.log('✅ User role fetched and cached:', data);
      
      return data;
    },
    dependencies: [user?.id, companyId],
    cacheKey,
    ttl: 10 * 60 * 1000 // 10 minutes cache for role data
  });

  // Store company_id in sessionStorage for member users when role is fetched
  useEffect(() => {
    if (userRole && userRole.company_id) {
      if (typeof window !== 'undefined') {
        // Store company_id in both sessionStorage and localStorage for member users
        sessionStorage.setItem('userCompanyId', userRole.company_id);
        localStorage.setItem('userCompanyId', userRole.company_id);
        console.log('Stored userCompanyId from role data:', userRole.company_id);
      }
    }
  }, [userRole]);

  // Notify role cache manager of role changes
  useEffect(() => {
    if (userRole) {
      roleCacheManager.notifyRoleChange(userRole);
    }
  }, [userRole]);

  return { 
    userRole, 
    loading, 
    error, 
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
      console.log('🔄 Role change detected:', {
        oldRole: this.lastKnownRole?.role,
        newRole: newRole?.role,
        oldStatus: this.lastKnownRole?.status,
        newStatus: newRole?.status
      });
      
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
    
    console.log('🗑️ All role caches invalidated due to role change');
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
