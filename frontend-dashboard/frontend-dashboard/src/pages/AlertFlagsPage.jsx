import { useMemo, useState } from 'react'
import { useDashboardContext } from '../hooks/useDashboardContext'
import { useAppData } from '../contexts/AppDataContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import SourceBadge from '../components/common/SourceBadge'
import CorroborationBadge from '../components/common/CorroborationBadge'
import AlertDetailDrawer from '../components/alerts/AlertDetailDrawer'
import {
  formatChangeType,
  formatConfidence,
  formatDate,
  formatFlagCode,
} from '../utils/formatters'

function AlertFlagsPage() {
  const { visibleFlags, jurisdictionsById, session } = useDashboardContext()
  const { citizenReports, updateFlagStatus, escalateFlag, updateOfficerNote } = useAppData()
  const [selectedFlagId, setSelectedFlagId] = useState(null)

  const sortedFlags = useMemo(
    () =>
      [...visibleFlags].sort(
        (flagA, flagB) =>
          new Date(flagB.created_at).getTime() - new Date(flagA.created_at).getTime(),
      ),
    [visibleFlags],
  )

  const selectedFlag = sortedFlags.find((flag) => flag.flag_id === selectedFlagId) ?? null

  const linkedReportsByFlagId = useMemo(() => {
    const byFlagId = {}

    citizenReports.forEach((report) => {
      if (!report.linked_flag_id) return

      const existingReport = byFlagId[report.linked_flag_id]

      if (!existingReport || Number(report.tier ?? 1) > Number(existingReport.tier ?? 1)) {
        byFlagId[report.linked_flag_id] = report
      }
    })

    return byFlagId
  }, [citizenReports])

  return (
    <div>
      <PageHeader
        title="Alert Flags"
        subtitle="Review and manage active signals across selected jurisdictions"
      />

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Flag ID</th>
              <th className="px-4 py-3">Signal Type</th>
              <th className="px-4 py-3">Jurisdiction</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Corroboration</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Detected</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedFlags.map((flag) => (
              <tr key={flag.flag_id} className="border-b border-[#edf2ed] text-[#264437]">
                <td className="px-4 py-3 font-semibold">{formatFlagCode(flag.flag_id)}</td>
                <td className="px-4 py-3">{formatChangeType(flag.signal_type)}</td>
                <td className="px-4 py-3">{jurisdictionsById[flag.jurisdiction_id]?.gram_sabha}</td>
                <td className="px-4 py-3"><SourceBadge source={flag.source} /></td>
                <td className="px-4 py-3">
                  <CorroborationBadge
                    corroborationState={flag.corroboration_state}
                    corroborationCount={flag.corroboration_count}
                  />
                </td>
                <td className="px-4 py-3">{formatConfidence(flag.satellite_confidence)}</td>
                <td className="px-4 py-3">{formatDate(flag.created_at)}</td>
                <td className="px-4 py-3"><StatusBadge status={flag.status} /></td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setSelectedFlagId(flag.flag_id)}
                    className="rounded-md border border-[#ccdbcc] px-2.5 py-1 text-xs font-semibold text-[#27483b] hover:bg-[#eef5ee]"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AlertDetailDrawer
        key={selectedFlag?.flag_id ?? 'no-flag-selected'}
        open={Boolean(selectedFlag)}
        flag={selectedFlag}
        jurisdiction={selectedFlag ? jurisdictionsById[selectedFlag.jurisdiction_id] : null}
        linkedReport={selectedFlag ? linkedReportsByFlagId[selectedFlag.flag_id] : null}
        role={session.role}
        onClose={() => setSelectedFlagId(null)}
        onUnderReview={(flagId) => updateFlagStatus(flagId, 'Under Review')}
        onVerify={(flagId) => updateFlagStatus(flagId, 'Verified')}
        onReject={(flagId) => updateFlagStatus(flagId, 'Rejected')}
        onResolve={(flagId) => updateFlagStatus(flagId, 'Resolved')}
        onEscalate={(flagId) => escalateFlag(flagId)}
        onSaveOfficerNote={updateOfficerNote}
      />
    </div>
  )
}

export default AlertFlagsPage
