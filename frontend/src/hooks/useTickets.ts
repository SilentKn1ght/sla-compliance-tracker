import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { ticketsAPI } from '../services/api'
import type { Ticket } from '../types'

interface UseTicketsReturn {
  tickets: Ticket[]
  loading: boolean
  error: string | null
  createTicket: (title: string, description?: string, priority?: 'P1' | 'P2' | 'P3') => Promise<void>
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export const useTickets = (): UseTicketsReturn => {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ticketsAPI.list()
      setTickets(data.tickets)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tickets'
      setError(message)
      setTickets([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createTicket = useCallback(
    async (title: string, description?: string, priority: 'P1' | 'P2' | 'P3' = 'P2') => {
      try {
        if (!title.trim()) {
          toast.error('Title is required')
          return
        }

        const newTicket = await ticketsAPI.create({
          title,
          description,
          priority,
        })

        // Optimistic update
        setTickets((prev) => [newTicket, ...prev])
        toast.success('Ticket created successfully')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create ticket'
        toast.error(message)
      }
    },
    []
  )

  const updateTicket = useCallback(async (id: string, data: Partial<Ticket>) => {
    try {
      const updated = await ticketsAPI.update(id, data)

      // Optimistic update
      setTickets((prev) =>
        prev.map((ticket) => (ticket._id === id ? updated : ticket))
      )
      toast.success('Ticket updated successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update ticket'
      toast.error(message)
    }
  }, [])

  const deleteTicket = useCallback(async (id: string) => {
    try {
      await ticketsAPI.delete(id)

      // Optimistic update
      setTickets((prev) => prev.filter((ticket) => ticket._id !== id))
      toast.success('Ticket deleted successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete ticket'
      toast.error(message)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return {
    tickets,
    loading,
    error,
    createTicket,
    updateTicket,
    deleteTicket,
    refetch: fetchTickets,
  }
}
