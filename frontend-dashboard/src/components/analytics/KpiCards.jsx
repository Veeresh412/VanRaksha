import { AlertTriangle, CheckCircle2, MapPinned, Radar, ShieldAlert, Users } from 'lucide-react'

const statConfig = [
  {
    key: 'jurisdictionsMonitored',
    label: 'Jurisdictions Monitored',
    icon: MapPinned,
    color: 'text-[#206c44] bg-[#eaf7ef]',
  },
  {
    key: 'totalFlags',
    label: 'Total Flags',
    icon: AlertTriangle,
    color: 'text-[#9a5502] bg-[#fff6e5]',
  },
  {
    key: 'underReview',
    label: 'Under Review',
    icon: ShieldAlert,
    color: 'text-[#9a5502] bg-[#fff6e5]',
  },
  {
    key: 'verified',
    label: 'Verified',
    icon: CheckCircle2,
    color: 'text-[#206c44] bg-[#eaf7ef]',
  },
  {
    key: 'citizenReports',
    label: 'Citizen Reports',
    icon: Users,
    color: 'text-[#5b2ba0] bg-[#f5f0ff]',
  },
  {
    key: 'satelliteSignals',
    label: 'Satellite Signals',
    icon: Radar,
    color: 'text-[#0a7286] bg-[#e6f6fa]',
  },
]

function KpiCards({ analytics }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {statConfig.map((stat) => {
        const Icon = stat.icon
        return (
          <div key={stat.key} className="vr-card p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#78847d]">{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold text-[#153127]">{analytics[stat.key]}</p>
              </div>
              <span className={`rounded-lg p-2 ${stat.color}`}>
                <Icon size={16} />
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default KpiCards
