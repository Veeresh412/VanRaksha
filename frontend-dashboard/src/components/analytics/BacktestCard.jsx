import { Maximize2 } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

function BacktestCard({ backtestSummary, expanded = false, onExpand }) {
  const data = [
    { label: 'TP', value: backtestSummary.truePositives },
    { label: 'TN', value: backtestSummary.trueNegatives },
    { label: 'FP', value: backtestSummary.falsePositives },
    { label: 'FN', value: backtestSummary.falseNegatives },
  ]

  const precisionDenominator =
    backtestSummary.truePositives + backtestSummary.falsePositives
  const precision =
    precisionDenominator > 0
      ? Math.round((backtestSummary.truePositives / precisionDenominator) * 100)
      : 0

  const isExpandable = Boolean(onExpand)

  return (
    <div
      className={`vr-card p-4 ${isExpandable ? 'vr-interactive' : ''}`}
      onClick={onExpand}
      onKeyDown={(event) => {
        if (!isExpandable) return

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onExpand()
        }
      }}
      role={isExpandable ? 'button' : undefined}
      tabIndex={isExpandable ? 0 : -1}
      aria-label={isExpandable ? 'Open model backtest in expanded view' : undefined}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1e3b2f]">Model Validation & Backtest</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#eaf7ef] px-2 py-1 text-xs font-semibold text-[#1d6c43]">
            Precision {precision}%
          </span>
          {onExpand ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onExpand()
              }}
              className="rounded-md border border-[#d5ded5] p-1.5 text-[#41554d] transition hover:bg-[#f3f8f3]"
            >
              <Maximize2 size={13} />
            </button>
          ) : null}
        </div>
      </div>
      <div className={`mt-3 ${expanded ? 'h-72' : 'h-36'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4ebe4" />
            <XAxis dataKey="label" fontSize={11} stroke="#6f7c74" tickMargin={6} />
            <YAxis
              allowDecimals={false}
              fontSize={11}
              stroke="#6f7c74"
              tickCount={expanded ? 5 : 3}
              width={expanded ? 28 : 22}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#2E9B5F" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-[#66736c]">Events evaluated: {backtestSummary.total}</p>
    </div>
  )
}

export default BacktestCard
