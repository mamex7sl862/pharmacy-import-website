import { useQuery } from '@tanstack/react-query'
import api from './api'

/**
 * Fetch a site_content section from the API.
 * Falls back to the provided defaultData if the API is unavailable.
 */
export function useSiteContent(section, defaultData) {
  const { data } = useQuery({
    queryKey: ['site-content', section],
    queryFn: () => api.get(`/content/site/${section}`).then((r) => r.data),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 min cache
  })
  return data ?? defaultData
}
