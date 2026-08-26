import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useDashboardContext } from '../hooks/useDashboardContext'
import PageHeader from '../components/common/PageHeader'
import {
  formatChangeType,
  formatConfidence,
  formatCoordinates,
  formatDate,
  formatFlagCode,
} from '../utils/formatters'

function SatelliteDetectionPage() {
  const { satellitePings, flags, jurisdictionsById } = useAppData()
  const { session } = useDashboardContext()

  const flagsById = useMemo(
    () =>
      flags.reduce((accumulator, flag) => {
        accumulator[flag.flag_id] = flag
        return accumulator
      }, {}),
    [flags],
  )

  const visibleLogs = useMemo(() => {
    const logs = satellitePings
      .map((ping) => {
        const linkedFlag = ping.linked_flag_id ? flagsById[ping.linked_flag_id] : null
        const jurisdictionId = linkedFlag?.jurisdiction_id ?? null
        const jurisdiction = jurisdictionId ? jurisdictionsById[jurisdictionId] : null

        return {
          ...ping,
          linkedFlag,
          jurisdiction,
          jurisdictionId,
        }
      })
      .filter((log) => {
        if (session.role === 'admin') return true

        if (!log.jurisdictionId) return false

        if (session.role === 'district_officer') {
          const scopedJurisdictions = new Set(session.jurisdiction_ids ?? [])

          if (scopedJurisdictions.size > 0) {
            return scopedJurisdictions.has(log.jurisdictionId)
          }

          return log.jurisdiction?.district === session.district
        }

        return log.jurisdictionId === session.jurisdiction_id
      })

    return [...logs].sort(
      (logA, logB) =>
        new Date(logB.created_at ?? 0).getTime() - new Date(logA.created_at ?? 0).getTime(),
    )
  }, [satellitePings, flagsById, jurisdictionsById, session])

  const summary = useMemo(() => {
    const movedToAlerts = visibleLogs.filter((log) => Boolean(log.linked_flag_id)).length
    const waitingReview = visibleLogs.filter(
      (log) => !log.linked_flag_id && typeof log.confidence_score === 'number' && log.confidence_score >= 0.65,
    ).length

    return {
      total: visibleLogs.length,
      movedToAlerts,
      waitingReview,
      monitoringOnly: visibleLogs.length - movedToAlerts - waitingReview,
    }
  }, [visibleLogs])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Satellite Detection"
        subtitle="Track satellite detection logs and routing into alert-flag workflow"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Total Logs</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.total}</p>
        </div>

        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Moved to Alert Flags</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.movedToAlerts}</p>
        </div>

        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Awaiting Review</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.waitingReview}</p>
        </div>

        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Monitoring Only</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.monitoringOnly}</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#dce5dc] bg-[#f8fbf8] px-4 py-3 text-sm text-[#40554b]">
        When a detection is confirmed/flagged, it is routed into <strong>Alert Flags</strong> for officer action.
      </div>

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Log ID</th>
              <th className="px-4 py-3">Detection Type</th>
              <th className="px-4 py-3">Jurisdiction</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Coordinates</th>
              <th className="px-4 py-3">Detected</th>
              <th className="px-4 py-3">Routing Status</th>
              <th className="px-4 py-3">Linked Flag</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleLogs.map((log) => {
              const hasFlag = Boolean(log.linked_flag_id)
              const awaitingReview =
                !hasFlag && typeof log.confidence_score === 'number' && log.confidence_score >= 0.65

              return (
                <tr key={log.sat_id} className="border-b border-[#edf2ed] text-[#264437]">
                  <td className="px-4 py-3 font-semibold">{String(log.sat_id ?? '--').replace('sat_', 'SAT-')}</td>
                  <td className="px-4 py-3">{formatChangeType(log.signal_type)}</td>
                  <td className="px-4 py-3">{log.jurisdiction?.gram_sabha ?? 'Unlinked Detection'}</td>
                  <td className="px-4 py-3">{formatConfidence(log.confidence_score)}</td>
                  <td className="px-4 py-3">{formatCoordinates(log.latitude, log.longitude)}</td>
                  <td className="px-4 py-3">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-3">
                    {hasFlag ? (
                      <span className="inline-flex rounded-full border border-[#bfe5cb] bg-[#eaf7ef] px-2.5 py-1 text-xs font-semibold text-[#175a38]">
                        Moved to Alert Flags
                      </span>
                    ) : awaitingReview ? (
                      <span className="inline-flex rounded-full border border-[#f3d8a4] bg-[#fff7e7] px-2.5 py-1 text-xs font-semibold text-[#8f5a04]">
                        Awaiting Review
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-[#d8dee4] bg-[#f4f5f7] px-2.5 py-1 text-xs font-semibold text-[#6b7280]">
                        Monitoring Only
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {hasFlag ? formatFlagCode(log.linked_flag_id) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {hasFlag ? (
                      <Link
                        to="/alerts"
                        className="rounded-md border border-[#ccdbcc] px-2.5 py-1 text-xs font-semibold text-[#27483b] hover:bg-[#eef5ee]"
                      >
                        Open Alert Queue
                      </Link>
                    ) : (
                      <span className="text-xs text-[#74857d]">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SatelliteDetectionPage

