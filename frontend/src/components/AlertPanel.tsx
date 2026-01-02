import type { Alert } from '../types'

interface AlertPanelProps {
  alerts?: Alert[]
}

export default function AlertPanel({ alerts }: AlertPanelProps) {
  const hasAlerts = alerts && alerts.length > 0

  if (!hasAlerts) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div className="flex items-start gap-4">
          <div className="text-4xl">✓</div>
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-1">
              All SLAs on Track
            </h3>
            <p className="text-sm text-green-700">
              No SLA breaches or at-risk tickets detected.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Active Alerts</h2>
      {alerts.map((alert) => {
        const isRisk = alert.type === 'at_risk'
        const bgColor = isRisk ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
        const textColor = isRisk ? 'text-yellow-900' : 'text-red-900'
        const borderColor = isRisk ? 'border-l-yellow-500' : 'border-l-red-500'
        const iconColor = isRisk ? '⚠' : '✕'

        return (
          <div
            key={alert.id}
            className={`${bgColor} rounded-lg shadow p-4 border-l-4 ${borderColor}`}
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl flex-shrink-0">{iconColor}</div>
              <div className="flex-1 min-w-0">
                <h3 className={`${textColor} font-semibold`}>
                  {alert.type === 'breach' ? 'SLA Breach' : 'At Risk'}
                </h3>
                <p className={`${textColor} text-sm mt-1`}>
                  <span className="font-mono">{alert.ticketNumber}</span> - {alert.title}
                </p>
                <p className={`${textColor} text-xs mt-2`}>{alert.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.priority === 'P1'
                        ? 'bg-red-200 text-red-800'
                        : alert.priority === 'P2'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                    }`}
                  >
                    {alert.priority}
                  </span>
                  <span className={`${textColor} text-xs`}>
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
