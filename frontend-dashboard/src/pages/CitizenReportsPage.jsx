import { useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useDashboardContext } from '../hooks/useDashboardContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import { formatConfidence, formatDate, formatFlagCode } from '../utils/formatters'

function CitizenReportsPage() {
  const { citizenReports, jurisdictionsById } = useAppData()
  const { session } = useDashboardContext()

  const visibleReports = useMemo(() => {
    if (session.role === 'admin') return citizenReports

    if (session.role === 'district_officer') {
      const scopedJurisdictions = new Set(session.jurisdiction_ids ?? [])

      return citizenReports.filter((report) => {
        if (!report.jurisdiction_id) return false

        if (scopedJurisdictions.size > 0) {
          return scopedJurisdictions.has(report.jurisdiction_id)
        }

        const jurisdiction = jurisdictionsById[report.jurisdiction_id]
        return jurisdiction?.district === session.district
      })
    }

    return citizenReports.filter(
      (report) => report.jurisdiction_id === session.jurisdiction_id,
    )
  }, [citizenReports, session, jurisdictionsById])

  return (
    <div>
      <PageHeader
        title="Citizen Reports"
        subtitle="Monitor incoming report signals and trust-level metadata"
      />

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Report ID</th>
              <th className="px-4 py-3">Linked Flag</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Reporter Trust</th>
              <th className="px-4 py-3">Jurisdiction</th>
              <th className="px-4 py-3">Authenticity</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report) => (
              <tr key={report.report_id} className="border-b border-[#edf2ed] text-[#264437]">
                <td className="px-4 py-3 font-medium">{report.report_id.replace('report_', 'RPT-')}</td>
                <td className="px-4 py-3 font-semibold">
                  {report.linked_flag_id ? formatFlagCode(report.linked_flag_id) : 'Unlinked'}
                </td>
                <td className="px-4 py-3">Tier {report.tier}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#d3ddd3] px-2.5 py-1 text-xs">
                    {report.reporter_trust}
                    {report.tier === 3 && <ShieldCheck size={12} className="text-[#2E9B5F]" />}
                  </span>
                </td>
                <td className="px-4 py-3">{jurisdictionsById[report.jurisdiction_id]?.gram_sabha}</td>
                <td className="px-4 py-3">{formatConfidence(report.authenticity_score)}</td>
                <td className="px-4 py-3">{formatDate(report.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CitizenReportsPage
