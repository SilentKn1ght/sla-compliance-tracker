interface MetricsCardProps {
  label: string
  value: number | string
  unit?: string
  status?: 'good' | 'warning' | 'alert' | 'info'
}

const statusStyles = {
  good: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    badge: 'bg-green-100 text-green-800',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-900',
    badge: 'bg-yellow-100 text-yellow-800',
  },
  alert: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    badge: 'bg-red-100 text-red-800',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-800',
  },
}

export default function MetricsCard({
  label,
  value,
  unit = '',
  status = 'info',
}: MetricsCardProps) {
  const styles = statusStyles[status]

  const formattedValue = typeof value === 'number' ? value.toFixed(1) : value

  return (
    <div
      className={`${styles.bg} border-2 ${styles.border} rounded-lg p-6 shadow-sm hover:shadow-md transition`}
    >
      <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${styles.text}`}>
          {formattedValue}
        </span>
        {unit && <span className={`text-sm font-medium ${styles.text}`}>{unit}</span>}
      </div>
      <div className={`mt-3 inline-block px-2 py-1 rounded text-xs font-medium ${styles.badge}`}>
        {status === 'good' && '✓ On Track'}
        {status === 'warning' && '⚠ Warning'}
        {status === 'alert' && '✕ Alert'}
        {status === 'info' && 'ℹ Info'}
      </div>
    </div>
  )
}
