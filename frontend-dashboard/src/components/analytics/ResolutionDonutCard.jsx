import { Maximize2 } from 'lucide-react'
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts'

const colors = {
  Verified: '#2E9B5F',
  'Under Review': '#F59E0B',
  Rejected: '#74838A',
  Unverified: '#E5534B',
  Resolved: '#0F5E40',
}

function ResolutionDonutCard({ analytics, expanded = false, onExpand }) {
  const data = [
    { name: 'Verified', key: 'Verified', value: analytics.verified },
    { name: 'Under Review', key: 'Under Review', value: analytics.underReview },
    { name: 'Rejected', key: 'Rejected', value: analytics.rejected },
    { name: 'Resolved', key: 'Resolved', value: analytics.resolved },
    { name: 'Unverified', key: 'Unverified', value: analytics.unverified },
  ].filter((item) => item.value > 0)

  const total = data.reduce((sum, item) => sum + item.value, 0)
  const verifiedPercentage = total > 0 ? Math.round((analytics.verified / total) * 100) : 0
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
      aria-label={isExpandable ? 'Open alert resolution chart in expanded view' : undefined}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1e3b2f]">Alert Resolution Mix</h3>
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
      <div className={`mt-3 grid items-center gap-3 ${expanded ? 'grid-cols-[280px_1fr]' : 'grid-cols-[140px_1fr]'}`}>
        <div className={`relative w-full ${expanded ? 'h-64' : 'h-32'}`}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={expanded ? 70 : 32}
                outerRadius={expanded ? 110 : 48}
                strokeWidth={0}
              >
                {data.map((entry) => (
                  <Cell key={entry.key} fill={colors[entry.key]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${expanded ? 'text-3xl' : 'text-xl'} font-semibold text-[#143126]`}>{verifiedPercentage}%</span>
            <span className={`${expanded ? 'text-sm' : 'text-[11px]'} text-[#66736c]`}>Verified</span>
          </div>
        </div>

        <div className="space-y-1 text-xs text-[#4d6158]">
          {data.map((item) => (
            <p key={item.key}>
              <span
                className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors[item.key] }}
              />
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ResolutionDonutCard
