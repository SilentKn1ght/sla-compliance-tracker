export interface Ticket {
  _id: string
  teamId: string
  ticketNumber: string
  title: string
  description?: string
  priority: 'P1' | 'P2' | 'P3'
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'
  createdAt: string
  firstResponseAt?: string
  resolvedAt?: string
  assignedTo?: string
  responseTime?: number
  resolutionTime?: number
  responseBreached: boolean
  resolutionBreached: boolean
}

export interface SLAMetrics {
  totalTickets: number
  resolvedTickets: number
  openTickets: number
  breachedTickets: number
  compliancePercentage: number
  atRiskCount: number
  mttr: number
  mttrByPriority: { P1: number; P2: number; P3: number }
}

export interface SLAPolicy {
  _id: string
  name: string
  p1ResponseTime: number
  p2ResponseTime: number
  p3ResponseTime: number
  p1ResolutionTime: number
  p2ResolutionTime: number
  p3ResolutionTime: number
  businessHoursOnly: boolean
  businessHours: { start: number; end: number }
}

export interface Alert {
  id: string
  type: 'breach' | 'at_risk'
  ticketId: string
  ticketNumber: string
  title: string
  priority: 'P1' | 'P2' | 'P3'
  message: string
  timestamp: string
}

export interface Team {
  _id: string
  name: string
  members: TeamMember[]
  subscriptionPlan: 'free' | 'professional' | 'enterprise'
}

export interface TeamMember {
  userId: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'member'
}

export interface DailyMetric {
  date: string
  compliance: number
  mttr: number
  breached: number
  total: number
}

export interface PriorityMetric {
  priority: 'P1' | 'P2' | 'P3'
  compliance: number
  mttr: number
  count: number
}
