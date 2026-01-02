import { useMemo } from 'react'
import { useMetrics } from '../hooks/useMetrics'
import { useAtRiskTickets } from '../hooks/useAtRiskTickets'
import TicketForm from '../components/TicketForm'
import MetricsCard from '../components/MetricsCard'
import SLAChart from '../components/SLAChart'
import AlertPanel from '../components/AlertPanel'

export default function Dashboard() {
  const { metrics, loading, error } = useMetrics()
  const { tickets: atRiskTickets } = useAtRiskTickets()

  // Convert at-risk tickets to alerts
  const alerts = useMemo(() => {
    return atRiskTickets.map((ticket, index) => ({
      id: `${ticket._id}-${index}`,
      type: 'at_risk' as const,
      ticketId: ticket._id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority: ticket.priority,
      message: `This ticket is approaching SLA breach. Response time: ${ticket.responseTime || 0}min, Resolution time: ${ticket.resolutionTime || 0}min`,
      timestamp: new Date().toISOString(),
    }))
  }, [atRiskTickets])

  const mttrChartData = metrics
    ? [
        { name: 'P1', value: metrics.mttrByPriority.P1 },
        { name: 'P2', value: metrics.mttrByPriority.P2 },
        { name: 'P3', value: metrics.mttrByPriority.P3 },
      ]
    : []

  const complianceChartData = metrics
    ? [
        { name: 'Compliant', value: metrics.totalTickets - metrics.breachedTickets },
        { name: 'Breached', value: metrics.breachedTickets },
      ]
    : []

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-900">
        <h2 className="text-lg font-semibold mb-2">Error Loading Dashboard</h2>
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SLA Dashboard</h1>
        <p className="text-gray-600">Monitor your team's SLA compliance and ticket metrics</p>
      </div>

      <TicketForm />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : metrics ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricsCard
              label="Overall Compliance"
              value={metrics.compliancePercentage}
              unit="%"
              status={
                metrics.compliancePercentage >= 95
                  ? 'good'
                  : metrics.compliancePercentage >= 85
                    ? 'warning'
                    : 'alert'
              }
            />
            <MetricsCard
              label="Open Tickets"
              value={metrics.openTickets}
              status="info"
            />
            <MetricsCard
              label="Mean Time to Resolve"
              value={metrics.mttr}
              unit="hours"
              status={metrics.mttr < 24 ? 'good' : 'warning'}
            />
            <MetricsCard
              label="At-Risk Tickets"
              value={metrics.atRiskCount}
              status={metrics.atRiskCount > 0 ? 'alert' : 'good'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SLAChart
              title="MTTR by Priority"
              data={mttrChartData}
              type="bar"
            />
            <SLAChart
              title="Compliance Status"
              data={complianceChartData}
              type="bar"
            />
          </div>

          <AlertPanel alerts={alerts.length > 0 ? alerts : undefined} />
        </>
      ) : null}
    </div>
  )
}
