import { useState, useEffect, useCallback } from 'react'
import { metricsAPI } from '../services/api'
import type { SLAMetrics } from '../types'

interface UseMetricsReturn {
  metrics: SLAMetrics | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useMetrics = (): UseMetricsReturn => {
  const [metrics, setMetrics] = useState<SLAMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await metricsAPI.getSummary()
      setMetrics(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch metrics'
      setError(message)
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMetrics, 60000)

    return () => clearInterval(interval)
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics,
  }
}
