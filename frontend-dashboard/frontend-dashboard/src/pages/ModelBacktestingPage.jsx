import { useMemo } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppData } from '../contexts/AppDataContext'
import PageHeader from '../components/common/PageHeader'

function classifyEvent(event) {
  const positive = event.ground_truth !== 'no_encroachment'
  if (positive && event.model_flagged) return 'True Positive'
  if (!positive && !event.model_flagged) return 'True Negative'
  if (!positive && event.model_flagged) return 'False Positive'
  return 'False Negative'
}

function ModelBacktestingPage() {
  const { backtestEvents, backtestSummary } = useAppData()

  const chartData = useMemo(
    () => [
      { metric: 'TP', value: backtestSummary.truePositives },
      { metric: 'TN', value: backtestSummary.trueNegatives },
      { metric: 'FP', value: backtestSummary.falsePositives },
      { metric: 'FN', value: backtestSummary.falseNegatives },
    ],
    [backtestSummary],
  )

  return (
    <div className="space-y-4">
      <PageHeader
        title="Accuracy Trend"
        subtitle="Historical validation overview from seeded event records"
      />

      <div className="grid gap-3 md:grid-cols-4">
        {[
          ['Events Evaluated', backtestSummary.total],
          ['True Positives', backtestSummary.truePositives],
          ['True Negatives', backtestSummary.trueNegatives],
          ['False Positives', backtestSummary.falsePositives],
        ].map(([label, value]) => (
          <div key={label} className="vr-card p-4">
            <p className="text-xs uppercase tracking-wide text-[#708078]">{label}</p>
            <p className="mt-1 text-2xl font-semibold text-[#163227]">{value}</p>
          </div>
        ))}
      </div>

      <div className="vr-card p-4">
        <h3 className="text-sm font-semibold text-[#1e3b2f]">Validation Classification</h3>
        <div className="mt-3 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="metric" stroke="#708078" />
              <YAxis allowDecimals={false} stroke="#708078" />
              <Tooltip />
              <Bar dataKey="value" fill="#2E9B5F" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">Date Range</th>
              <th className="px-4 py-3">Known Change</th>
              <th className="px-4 py-3">Ground Truth</th>
              <th className="px-4 py-3">Model Result</th>
              <th className="px-4 py-3">Classification</th>
            </tr>
          </thead>
          <tbody>
            {backtestEvents.map((event) => (
              <tr key={event.event_id} className="border-b border-[#edf2ed] text-[#264437]">
                <td className="px-4 py-3 font-semibold">{event.event_id.toUpperCase()}</td>
                <td className="px-4 py-3">{event.district}</td>
                <td className="px-4 py-3">{event.date_range}</td>
                <td className="px-4 py-3">{event.known_change.replaceAll('_', ' ')}</td>
                <td className="px-4 py-3">{event.ground_truth.replaceAll('_', ' ')}</td>
                <td className="px-4 py-3">{event.model_flagged ? 'Flagged' : 'Not Flagged'}</td>
                <td className="px-4 py-3 font-semibold">{classifyEvent(event)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ModelBacktestingPage
