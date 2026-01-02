import { useState, useMemo } from 'react'
import { metricsAPI } from '../services/api'
import MetricsCard from '../components/MetricsCard'
import SLAChart from '../components/SLAChart'

export default function Analytics() {
  const [dateRange, setDateRange] = useState(30)
  const [isLoading, setIsLoading] = useState(false)

  const handleDateRangeChange = (days: number) => {
    setDateRange(days)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 500)
  }

  // Mock data for priority compliance
  const priorityMetrics = useMemo(
    () => [
      { name: 'P1', value: 92 },
      { name: 'P2', value: 96 },
      { name: 'P3', value: 98 },
    ],
    []
  )

  // Mock data for compliance trend
  const complianceTrendData = useMemo(() => {
    const data = []
    for (let i = dateRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 85 + Math.random() * 15,
      })
    }
    return data
  }, [dateRange])

  // Mock data for MTTR trend
  const mttrTrendData = useMemo(() => {
    const data = []
    for (let i = dateRange; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      data.push({
        name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: 8 + Math.random() * 4,
      })
    }
    return data
  }, [dateRange])

  // Mock data for breach distribution
  const breachDistributionData = useMemo(
    () => [
      { name: 'P1', value: 8 },
      { name: 'P2', value: 4 },
      { name: 'P3', value: 2 },
    ],
    []
  )

  // Mock engineer performance
  const engineerData = useMemo(
    () => [
      { name: 'John Smith', compliance: 98, tickets: 24 },
      { name: 'Sarah Johnson', compliance: 96, tickets: 19 },
      { name: 'Mike Davis', compliance: 92, tickets: 31 },
      { name: 'Lisa Brown', compliance: 95, tickets: 22 },
    ],
    []
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
        <p className="text-gray-600">Deep dive into SLA performance metrics and trends</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Date Range</h2>
        <div className="flex flex-wrap gap-3">
          {[7, 14, 30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => handleDateRangeChange(days)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                dateRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-label={`Show last ${days} days`}
            >
              Last {days} days
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricsCard
              label="P1 Compliance"
              value={92}
              unit="%"
              status="warning"
            />
            <MetricsCard
              label="P2 Compliance"
              value={96}
              unit="%"
              status="good"
            />
            <MetricsCard
              label="P3 Compliance"
              value={98}
              unit="%"
              status="good"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SLAChart
              title="Compliance Trend"
              data={complianceTrendData}
              type="line"
            />
            <SLAChart
              title="MTTR Trend (hours)"
              data={mttrTrendData}
              type="line"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SLAChart
              title="Breach Distribution by Priority"
              data={breachDistributionData}
              type="bar"
            />

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Engineer Performance
              </h3>
              <div className="space-y-3">
                {engineerData.map((engineer) => (
                  <div key={engineer.name} className="flex items-center justify-between pb-3 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {engineer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {engineer.tickets} tickets
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {engineer.compliance}%
                      </p>
                      <div className="w-20 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${engineer.compliance}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Worst Performing Tickets
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Ticket
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Response Time
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Resolution Time
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    { id: 'TKT-1001', response: '4h 30m', resolution: '18h 20m', status: 'Breached' },
                    { id: 'TKT-1002', response: '3h 15m', resolution: '16h 45m', status: 'Breached' },
                    { id: 'TKT-1003', response: '2h 50m', resolution: '14h 30m', status: 'On Track' },
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-blue-600">{row.id}</td>
                      <td className="px-4 py-2">{row.response}</td>
                      <td className="px-4 py-2">{row.resolution}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            row.status === 'Breached'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
