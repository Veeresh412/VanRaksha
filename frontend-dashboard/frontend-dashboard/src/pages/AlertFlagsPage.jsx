import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDashboardContext } from '../hooks/useDashboardContext'
import { useAppData } from '../contexts/AppDataContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import SourceBadge from '../components/common/SourceBadge'
import CorroborationBadge from '../components/common/CorroborationBadge'
import AlertDetailDrawer from '../components/alerts/AlertDetailDrawer'
import PriorityBadge from '../components/common/PriorityBadge'
import {
  formatChangeType,
  formatConfidence,
  formatDate,
  formatFlagCode,
} from '../utils/formatters'
import { compareFlagsByPriority, enrichFlagWithPriority } from '../utils/priority'

function getFlagIdentity(flagId) {
  if (flagId === null || flagId === undefined) return null

  const normalizedFlagId = String(flagId).trim()
  if (!normalizedFlagId) return null

  const numericIdMatch = normalizedFlagId.match(/^(?:flag[_-]?|FLAG-)?(\d+)$/i)

  if (numericIdMatch) {
    return `num:${Number(numericIdMatch[1])}`
  }

  return `raw:${normalizedFlagId.toLowerCase()}`
}

function isSameFlag(flagIdA, flagIdB) {
  const identityA = getFlagIdentity(flagIdA)
  const identityB = getFlagIdentity(flagIdB)

  return Boolean(identityA && identityB && identityA === identityB)
}

function AlertFlagsPage() {
  const { visibleFlags, jurisdictionsById, session } = useDashboardContext()
  const { citizenReports, updateFlagStatus, escalateFlag, updateOfficerNote } = useAppData()
  const [selectedFlagId, setSelectedFlagId] = useState(null)
  const [searchParams] = useSearchParams()
  const focusedFlagQuery = searchParams.get('focusFlag')
  const rowRefs = useRef({})

  const sortedFlags = useMemo(() => {
    const prioritizedFlags = visibleFlags.map(enrichFlagWithPriority)

    return prioritizedFlags.sort(compareFlagsByPriority)
  }, [visibleFlags])

  const selectedFlag = sortedFlags.find((flag) => flag.flag_id === selectedFlagId) ?? null

  const highlightedFlagId = useMemo(() => {
    if (!focusedFlagQuery) return null

    return sortedFlags.find((flag) => isSameFlag(flag.flag_id, focusedFlagQuery))?.flag_id ?? null
  }, [sortedFlags, focusedFlagQuery])

  useEffect(() => {
    if (!highlightedFlagId) return

    const rowNode = rowRefs.current[highlightedFlagId]

    if (!rowNode) return

    rowNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightedFlagId])

  const linkedReportsByFlagId = useMemo(() => {
    const byFlagId = {}

    citizenReports.forEach((report) => {
      if (!report.linked_flag_id) return

      if (!byFlagId[report.linked_flag_id]) {
        byFlagId[report.linked_flag_id] = []
      }

      byFlagId[report.linked_flag_id].push(report)
    })

    Object.keys(byFlagId).forEach((flagId) => {
      byFlagId[flagId].sort((reportA, reportB) => {
        const tierDelta = Number(reportB.tier ?? 1) - Number(reportA.tier ?? 1)
        if (tierDelta !== 0) return tierDelta

        return new Date(reportB.created_at ?? 0).getTime() - new Date(reportA.created_at ?? 0).getTime()
      })
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
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Detected</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedFlags.map((flag) => (
              <tr
                key={flag.flag_id}
                ref={(node) => {
                  if (node) {
                    rowRefs.current[flag.flag_id] = node
                  }
                }}
                className={`border-b border-[#edf2ed] text-[#264437] ${
                  highlightedFlagId === flag.flag_id
                    ? 'bg-[#fff8e8] shadow-[inset_3px_0_0_0_#f0ad3d]'
                    : ''
                }`}
              >
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
                <td className="px-4 py-3">
                  <PriorityBadge band={flag.priority_band} score={flag.priority_score} />
                </td>
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
        linkedReports={selectedFlag ? linkedReportsByFlagId[selectedFlag.flag_id] ?? [] : []}
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
