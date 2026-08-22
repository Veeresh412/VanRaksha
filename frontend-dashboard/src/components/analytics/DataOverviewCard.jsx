import { Satellite, UsersRound, Radar, CalendarClock } from 'lucide-react'

function DataOverviewCard({ analytics }) {
  const rows = [
    {
      label: 'Satellite Signals Processed',
      value: analytics.satelliteSignals,
      icon: Satellite,
    },
    {
      label: 'Citizen Reports Received',
      value: analytics.citizenReports,
      icon: UsersRound,
    },
    {
      label: 'Active Signals',
      value: analytics.totalFlags,
      icon: Radar,
    },
    {
      label: 'Last Data Refresh',
      value: '22 Aug 2026',
      icon: CalendarClock,
    },
  ]

  return (
    <div className="vr-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-[#1e3b2f]">Data Overview</h3>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {rows.map((row) => {
          const Icon = row.icon
          return (
            <div
              key={row.label}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-[#e0e8e0] bg-[#f8fbf8] px-3 py-2.5"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#ecf5ee] text-[#55786a]">
                <Icon size={14} />
              </span>
              <p className="text-xs font-medium leading-snug text-[#4d6158]">{row.label}</p>
              <p className="text-sm font-semibold text-[#1d392e]">{row.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DataOverviewCard
