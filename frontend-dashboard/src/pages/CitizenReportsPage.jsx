import { useMemo } from 'react'
import { BadgeCheck, Mic, ShieldCheck } from 'lucide-react'
import { useAppData } from '../contexts/AppDataContext'
import { useDashboardContext } from '../hooks/useDashboardContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import { formatConfidence, formatDate, formatFlagCode } from '../utils/formatters'
import { useAppLanguage } from '../hooks/useAppLanguage'

function CitizenReportsPage() {
  const { citizenReports, jurisdictionsById } = useAppData()
  const { session } = useDashboardContext()
  const { t } = useAppLanguage()

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
              <th className="px-4 py-3">Reporter Signal</th>
              <th className="px-4 py-3">Speech Input</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report) => {
              const authenticityPercent =
                typeof report.authenticity_score === 'number'
                  ? Math.round(report.authenticity_score <= 1 ? report.authenticity_score * 100 : report.authenticity_score)
                  : null

              const isAuthenticityVerified =
                typeof authenticityPercent === 'number' && authenticityPercent > 80

              const isVerifiedNgoReport =
                report.tier === 3 || /verified|ngo/i.test(String(report.reporter_trust ?? ''))

              return (
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
                  <td className="px-4 py-3">
                    {typeof authenticityPercent === 'number' ? (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          isAuthenticityVerified
                            ? 'border-[#bae5c8] bg-[#eaf8ef] text-[#206544]'
                            : 'border-[#f3d8a4] bg-[#fff7e7] text-[#8f5a04]'
                        }`}
                      >
                        {t('alerts.authenticity')}: {authenticityPercent}% ({isAuthenticityVerified ? t('alerts.verified') : t('alerts.potentialAi')})
                      </span>
                    ) : (
                      formatConfidence(report.authenticity_score)
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isVerifiedNgoReport ? (
                      <span className="inline-flex items-center rounded-full border border-[#deccff] bg-[#f4efff] px-2.5 py-1 text-xs font-semibold text-[#5d3faa]">
                        <BadgeCheck size={12} className="mr-1" />
                        {t('alerts.verifiedNgo')}
                      </span>
                    ) : (
                      <span className="text-xs text-[#74857d]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5d7068]">
                      <Mic size={12} /> {t('alerts.speechToText')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatDate(report.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CitizenReportsPage
