import { useMemo } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useDashboardContext } from '../hooks/useDashboardContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import { formatConfidence, formatDate, formatFlagCode } from '../utils/formatters'

function reporterTypeLabel(type) {
  if (type === 'basic') return 'Basic Reporter'
  if (type === 'geo_tagged') return 'Geo-tagged Reporter'
  return 'Verified Reporter'
}

function CitizenReportsPage() {
  const { citizenReports, jurisdictionsById } = useAppData()
  const { session } = useDashboardContext()

  const visibleReports = useMemo(() => {
    if (session.role === 'admin') return citizenReports

    return citizenReports.filter(
      (report) => report.jurisdiction_id === session.jurisdiction_id,
    )
  }, [citizenReports, session])

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
              <th className="px-4 py-3">Reporter Trust</th>
              <th className="px-4 py-3">Jurisdiction</th>
              <th className="px-4 py-3">Signal Confidence</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report) => (
              <tr key={report.report_id} className="border-b border-[#edf2ed] text-[#264437]">
                <td className="px-4 py-3 font-medium">{report.report_id.replace('report_', 'RPT-')}</td>
                <td className="px-4 py-3 font-semibold">{formatFlagCode(report.flag_id)}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#d3ddd3] px-2.5 py-1 text-xs">
                    {reporterTypeLabel(report.reporter_type)}
                    {report.verified && <ShieldCheck size={12} className="text-[#2E9B5F]" />}
                  </span>
                </td>
                <td className="px-4 py-3">{jurisdictionsById[report.jurisdiction_id]?.gram_sabha}</td>
                <td className="px-4 py-3">{formatConfidence(report.confidence_score)}</td>
                <td className="px-4 py-3">{formatDate(report.submitted_at)}</td>
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
