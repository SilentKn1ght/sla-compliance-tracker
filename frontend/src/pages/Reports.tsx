import { useState } from 'react'
import toast from 'react-hot-toast'
import { reportsAPI } from '../services/api'

export default function Reports() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  )
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const months = Array.from({ length: 12 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    return date.toISOString().slice(0, 7)
  })

  const getMonthLabel = (monthStr: string): string => {
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  const downloadPDF = async () => {
    try {
      setIsLoading(true)
      const blob = await reportsAPI.getPDF(selectedMonth)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SLA-Report-${selectedMonth}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('PDF downloaded successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download PDF'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadCSV = async () => {
    try {
      setIsLoading(true)
      const blob = await reportsAPI.getCSV(selectedMonth)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SLA-Report-${selectedMonth}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('CSV downloaded successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download CSV'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Generate and download SLA compliance reports</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Month
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            aria-label="Select report month"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {getMonthLabel(month)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={downloadPDF}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            aria-label="Download PDF report"
          >
            {isLoading ? 'Downloading...' : '📄 Download PDF'}
          </button>
          <button
            onClick={downloadCSV}
            disabled={isLoading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
            aria-label="Download CSV report"
          >
            {isLoading ? 'Downloading...' : '📊 Download CSV'}
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition"
            aria-label="Toggle report preview"
            aria-expanded={showPreview}
          >
            {showPreview ? '👁 Hide' : '👁 Preview'}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">
            SLA Compliance Report - {getMonthLabel(selectedMonth)}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Overall Compliance
              </h3>
              <p className="text-4xl font-bold text-blue-600 mb-2">94.5%</p>
              <p className="text-sm text-blue-700">
                457 out of 483 tickets met SLA requirements
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Mean Time to Response
              </h3>
              <p className="text-4xl font-bold text-green-600 mb-2">2.3 hours</p>
              <p className="text-sm text-green-700">
                Target: 4 hours for P1, 8 hours for P2
              </p>
            </div>

            <div className="bg-purple-50 rounded-lg p-6 border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Mean Time to Resolution
              </h3>
              <p className="text-4xl font-bold text-purple-600 mb-2">12.7 hours</p>
              <p className="text-sm text-purple-700">
                Target: 24 hours for P1, 48 hours for P2
              </p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-6 border-2 border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Breached Tickets
              </h3>
              <p className="text-4xl font-bold text-yellow-600 mb-2">26</p>
              <p className="text-sm text-yellow-700">
                5.4% of total tickets (down from 6.2% last month)
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Compliance by Priority
            </h3>
            <div className="space-y-4">
              {[
                { priority: 'P1 - Critical', compliance: 92, target: 95 },
                { priority: 'P2 - High', compliance: 96, target: 90 },
                { priority: 'P3 - Medium', compliance: 98, target: 85 },
              ].map((item) => (
                <div key={item.priority}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{item.priority}</span>
                    <span className="text-sm text-gray-600">
                      {item.compliance}% (Target: {item.target}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        item.compliance >= item.target
                          ? 'bg-green-500'
                          : 'bg-yellow-500'
                      }`}
                      style={{ width: `${Math.min(item.compliance, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p>
              <strong>Report Generated:</strong> {new Date().toLocaleString()}
            </p>
            <p className="mt-2">
              This is a preview of the report. Download the PDF or CSV for complete details.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
