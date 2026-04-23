import { useQuery, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  enabled?: boolean;
};

type UseCachedFetchOptions<TData, TError> = FetchOptions & 
  Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>;

// Helper function to get auth token from cookies
const getAuthToken = () => {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, ...values] = cookie.trim().split('=');
    if (key && values.length > 0) {
      acc[key] = values.join('=');
    }
    return acc;
  }, {} as Record<string, string>);
  
  return cookies.__session || null;
};

export function useCachedFetch<TData = unknown, TError = Error>(
  queryKey: string | string[],
  url: string,
  options: UseCachedFetchOptions<TData, TError> = { method: 'GET', enabled: true }
): UseQueryResult<TData, TError> {
  const { 
    method = 'GET', 
    headers = {}, 
    body, 
    enabled = true,
    ...queryOptions 
  } = options;

  const queryKeyArray = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useQuery<TData, TError, TData, QueryKey>({
    queryKey: queryKeyArray,
    queryFn: async () => {
      // Get auth token and add to headers
      const authToken = getAuthToken();
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
      };
      
      if (authToken) {
        requestHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch data');
      }

      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes (cache time)
    enabled,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
    retry: 1,
    ...queryOptions,
  });
}
