import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from './api'

/**
 * Fetch a site_content section from the API.
 * Falls back to the provided defaultData if the API is unavailable.
 * staleTime: 0 — always refetch so admin changes appear immediately.
 */
export function useSiteContent(section, defaultData) {
  const { data } = useQuery({
    queryKey: ['site-content', section],
    queryFn: () => api.get(`/content/site/${section}`).then((r) => r.data),
    retry: false,
    staleTime: 0,           // always fresh
    gcTime: 1000 * 60 * 2,  // keep in memory 2 min
  })

  // If defaultData is an array, only use API data if it's also a non-empty array
  if (Array.isArray(defaultData)) {
    return (Array.isArray(data) && data.length > 0) ? data : defaultData
  }

  // For objects, use API data only if it has keys
  if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length > 0) {
    return data
  }

  return defaultData
}

/**
 * Call this after saving in admin to immediately refresh all pages.
 */
export function useInvalidateSiteContent() {
  const qc = useQueryClient()
  return (section) => {
    qc.invalidateQueries({ queryKey: ['site-content', section] })
    qc.invalidateQueries({ queryKey: ['site-content'] }) // invalidate all sections
  }
}
