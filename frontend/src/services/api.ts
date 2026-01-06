import axios, { AxiosInstance } from 'axios'
import type { Ticket, SLAMetrics, SLAPolicy, DailyMetric } from '../types'

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const metricsAPI = {
  getSummary: async (): Promise<SLAMetrics> => {
    const response = await api.get('/metrics')
    return response.data
  },

  getDailyTrend: async (days: number = 30): Promise<DailyMetric[]> => {
    const response = await api.get('/metrics/trend', {
      params: { days },
    })
    return response.data
  },
}

export const ticketsAPI = {
  list: async (filters?: {
    status?: string
    priority?: string
    page?: number
    limit?: number
  }): Promise<{ tickets: Ticket[]; total: number }> => {
    const response = await api.get('/tickets', { params: filters })
    return response.data
  },

  create: async (data: {
    title: string
    description?: string
    priority: 'P1' | 'P2' | 'P3'
  }): Promise<Ticket> => {
    const response = await api.post('/tickets', data)
    return response.data
  },

  update: async (
    id: string,
    data: Partial<Ticket>
  ): Promise<Ticket> => {
    const response = await api.patch(`/tickets/${id}`, data)
    return response.data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tickets/${id}`)
  },

  getAtRisk: async (): Promise<Ticket[]> => {
    const response = await api.get('/tickets/at-risk')
    return response.data
  },
}

export const policiesAPI = {
  list: async (): Promise<SLAPolicy[]> => {
    const response = await api.get('/policies')
    return response.data
  },

  get: async (id: string): Promise<SLAPolicy> => {
    const response = await api.get(`/policies/${id}`)
    return response.data
  },

  create: async (data: Omit<SLAPolicy, '_id'>): Promise<SLAPolicy> => {
    const response = await api.post('/policies', data)
    return response.data
  },

  update: async (id: string, data: Partial<SLAPolicy>): Promise<SLAPolicy> => {
    const response = await api.patch(`/policies/${id}`, data)
    return response.data
  },
}

export const reportsAPI = {
  getMonthly: async (month: string): Promise<SLAMetrics> => {
    const response = await api.get('/reports/monthly', {
      params: { month },
    })
    return response.data
  },

  getCSV: async (month: string): Promise<Blob> => {
    const response = await api.get('/reports/csv', {
      params: { month },
      responseType: 'blob',
    })
    return response.data
  },

  getPDF: async (month: string): Promise<Blob> => {
    const response = await api.get('/reports/pdf', {
      params: { month },
      responseType: 'blob',
    })
    return response.data
  },
}

export default api
