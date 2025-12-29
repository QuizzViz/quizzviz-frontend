import { useQuery, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';

type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  enabled?: boolean;
};

type UseCachedFetchOptions<TData, TError> = FetchOptions & 
  Omit<UseQueryOptions<TData, TError, TData, QueryKey>, 'queryKey' | 'queryFn'>;

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
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to fetch data');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (cache time)
    enabled,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: true, // Always refetch on mount
    retry: 1,
    ...queryOptions,
  });
}
