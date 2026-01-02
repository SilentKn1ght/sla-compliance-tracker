import { useState, useEffect, useCallback } from 'react'
import { ticketsAPI } from '../services/api'
import type { Ticket } from '../types'

interface UseAtRiskTicketsReturn {
  tickets: Ticket[]
  loading: boolean
  refetch: () => Promise<void>
}

export const useAtRiskTickets = (): UseAtRiskTicketsReturn => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAtRiskTickets = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ticketsAPI.getAtRisk()
      setTickets(data)
    } catch (err) {
      console.error('Failed to fetch at-risk tickets:', err)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAtRiskTickets()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchAtRiskTickets, 300000)

    return () => clearInterval(interval)
  }, [fetchAtRiskTickets])

  return {
    tickets,
    loading,
    refetch: fetchAtRiskTickets,
  }
}
