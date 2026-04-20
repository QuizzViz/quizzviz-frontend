import { useState, useEffect, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  dependencies: any[];
}

interface UseCachedDataOptions<T> {
  fetcher: () => Promise<T>;
  dependencies: any[];
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
}

export function useCachedData<T>({ 
  fetcher, 
  dependencies, 
  cacheKey, 
  ttl = 5 * 60 * 1000 // 5 minutes default
}: UseCachedDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use ref to persist cache across re-renders
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  useEffect(() => {
    const now = Date.now();
    const cached = cacheRef.current.get(cacheKey);
    
    // Check if we have valid cached data
    if (cached && (now - cached.timestamp) < ttl) {
      // Check if dependencies have changed
      const dependenciesChanged = JSON.stringify(dependencies) !== JSON.stringify(cached.dependencies);
      
      if (!dependenciesChanged) {
        // Use cached data
        console.log(`🎯 Using cached data for ${cacheKey}`);
        setData(cached.data);
        setLoading(false);
        setError(null);
        return;
      }
    }
    
    // Fetch fresh data
    console.log(`🔄 Fetching fresh data for ${cacheKey}`);
    setLoading(true);
    setError(null);
    
    fetcher()
      .then((freshData) => {
        // Cache the fresh data
        cacheRef.current.set(cacheKey, {
          data: freshData,
          timestamp: now,
          dependencies: [...dependencies] // Store current dependencies
        });
        
        setData(freshData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`❌ Error fetching ${cacheKey}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setLoading(false);
      });
  }, dependencies);

  // Function to manually clear cache
  const clearCache = () => {
    cacheRef.current.delete(cacheKey);
    console.log(`🗑️ Cleared cache for ${cacheKey}`);
  };

  // Function to force refresh
  const refresh = () => {
    cacheRef.current.delete(cacheKey);
    console.log(`🔄 Force refreshing ${cacheKey}`);
    setLoading(true);
    fetcher()
      .then((freshData) => {
        const now = Date.now();
        cacheRef.current.set(cacheKey, {
          data: freshData,
          timestamp: now,
          dependencies: [...dependencies]
        });
        setData(freshData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(`❌ Error refreshing ${cacheKey}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to refresh data');
        setLoading(false);
      });
  };

  return { data, loading, error, clearCache, refresh };
}

// Hook for caching multiple related data sources
export function useCachedDashboardData(userId?: string, companyId?: string, getToken?: () => Promise<string>) {
  const [members, setMembers] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const cacheRef = useRef<{
    members?: { data: any[]; timestamp: number };
    userRole?: { data: any; timestamp: number };
    company?: { data: any; timestamp: number };
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      const now = Date.now();
      const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
      
      // Check cached data
      const membersCache = cacheRef.current.members;
      const roleCache = cacheRef.current.userRole;
      const companyCache = cacheRef.current.company;
      
      let shouldFetchMembers = true;
      let shouldFetchRole = true;
      let shouldFetchCompany = true;
      
      // Check if cached data is still valid
      if (membersCache && (now - membersCache.timestamp) < CACHE_TTL) {
        shouldFetchMembers = false;
        setMembers(membersCache.data);
        console.log('🎯 Using cached members data');
      }
      
      if (roleCache && (now - roleCache.timestamp) < CACHE_TTL) {
        shouldFetchRole = false;
        setUserRole(roleCache.data);
        console.log('🎯 Using cached user role data');
      }
      
      if (companyCache && (now - companyCache.timestamp) < CACHE_TTL) {
        shouldFetchCompany = false;
        setCompany(companyCache.data);
        console.log('🎯 Using cached company data');
      }
      
      if (!shouldFetchMembers && !shouldFetchRole && !shouldFetchCompany) {
        setLoading(false);
        return;
      }
      
      // Fetch only what's needed
      const fetchPromises: Promise<any>[] = [];
      const token = getToken ? await getToken() : '';
      
      if (shouldFetchCompany && (userId || companyId)) {
        // For member users, fetch by company_id; for owners, fetch by user_id
        const companyUrl = companyId 
          ? `/api/company/${companyId}`
          : `/api/company/check?owner_id=${userId}`;
        
        fetchPromises.push(
          fetch(companyUrl)
            .then(res => res.json())
            .then(data => {
              const companyData = data.companies?.[0] || data;
              if (companyData) {
                cacheRef.current.company = {
                  data: companyData,
                  timestamp: now
                };
                setCompany(companyData);
                console.log('📦 Cached company data');
              }
            })
        );
      }
      
      if (shouldFetchRole && userId && companyId && token) {
        fetchPromises.push(
          fetch(`/api/company-members/role?user_id=${userId}&company_id=${companyId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
            cacheRef.current.userRole = {
              data,
              timestamp: now
            };
            setUserRole(data);
            console.log('📦 Cached user role data');
          })
        );
      }
      
      if (shouldFetchMembers && companyId && token) {
        fetchPromises.push(
          fetch(`/api/company-members?company_id=${companyId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => {
            cacheRef.current.members = {
              data,
              timestamp: now
            };
            setMembers(data);
            console.log('📦 Cached members data');
          })
        );
      }
      
      Promise.all(fetchPromises)
        .then(() => {
          setLoading(false);
          console.log('✅ Dashboard data cached successfully');
        })
        .catch(err => {
          console.error('❌ Error fetching dashboard data:', err);
          setLoading(false);
        });
    };

    fetchData();
  }, [userId, companyId, getToken]);

  const refreshAll = async () => {
    if (!getToken) return;
    
    console.log('🔄 Force refreshing all dashboard data');
    setLoading(true);
    
    // Clear cache
    cacheRef.current = {};
    
    // Re-fetch everything
    const fetchPromises: Promise<any>[] = [];
    const token = await getToken();
    
    if (userId || companyId) {
      // For member users, fetch by company_id; for owners, fetch by user_id
      const companyUrl = companyId 
        ? `/api/company/${companyId}`
        : `/api/company/check?owner_id=${userId}`;
      
      fetchPromises.push(
        fetch(companyUrl)
          .then(res => res.json())
          .then(data => {
            const companyData = data.companies?.[0] || data;
            if (companyData) setCompany(companyData);
          })
      );
    }
    
    if (userId && companyId) {
      fetchPromises.push(
        fetch(`/api/company-members/role?user_id=${userId}&company_id=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
          .then(data => setUserRole(data))
      );
    }
    
    if (companyId) {
      fetchPromises.push(
        fetch(`/api/company-members?company_id=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(res => res.json())
        .then(data => setMembers(data))
      );
    }
    
    try {
      await Promise.all(fetchPromises);
      console.log('✅ Dashboard data refreshed successfully');
    } catch (err) {
      console.error('❌ Error refreshing dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return { members, userRole, company, loading, refreshAll };
}
