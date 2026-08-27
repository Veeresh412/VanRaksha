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

function SatellitePingsPage() {
  const { satellitePings, flags, jurisdictionsById } = useAppData()
  const { session } = useDashboardContext()

  const flagsById = useMemo(() => {
    return flags.reduce((accumulator, flag) => {
      accumulator[flag.flag_id] = flag
      return accumulator
    }, {})
  }, [flags])

  const visiblePings = useMemo(() => {
    const logs = satellitePings
      .map((ping) => {
        const latitude = ping.latitude ?? ping.lat ?? null
        const longitude = ping.longitude ?? ping.lng ?? ping.long ?? null
        const createdAt = ping.created_at ?? ping.detected_at ?? ping.timestamp ?? null
        const confidenceScore = ping.confidence_score ?? ping.confidence ?? null
        const signalType = ping.signal_type ?? ping.signalType ?? null

        const linkedFlag = ping.linked_flag_id ? flagsById[ping.linked_flag_id] : null
        const jurisdictionId =
          ping.jurisdiction_id ??
          linkedFlag?.jurisdiction_id ??
          null
        const jurisdiction = jurisdictionId ? jurisdictionsById[jurisdictionId] : null

        return {
          ...ping,
          latitude,
          longitude,
          created_at: createdAt,
          confidence_score: confidenceScore,
          signal_type: signalType,
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
    const linkedToAlert = visiblePings.filter((ping) => Boolean(ping.linked_flag_id)).length
    const suppressed = visiblePings.filter((ping) => ping.suppressed === true).length

    return {
      total: visiblePings.length,
      linkedToAlert,
      suppressed,
      queueOnly: visiblePings.length - linkedToAlert - suppressed,
    }
  }, [visiblePings])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Satellite Pings"
        subtitle="View every satellite ping and routing/suppression state"
      />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Total Pings</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.total}</p>
        </div>

        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Linked to Alert Flags</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.linkedToAlert}</p>
        </div>

        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Suppressed</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.suppressed}</p>
        </div>

        <div className="vr-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#708078]">Queue Only</p>
          <p className="mt-1 text-2xl font-semibold text-[#163227]">{Math.max(0, summary.queueOnly)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-[#dce5dc] bg-[#f8fbf8] px-4 py-3 text-sm text-[#40554b]">
        Backend integrations can populate fields like <code>suppressed</code>, <code>suppression_reason</code>,
        <code>signal_type</code>, and <code>linked_flag_id</code> directly per ping.
      </div>

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Ping ID</th>
              <th className="px-4 py-3">Signal Type</th>
              <th className="px-4 py-3">Jurisdiction</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Coordinates</th>
              <th className="px-4 py-3">Detected</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Linked Flag</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visiblePings.map((ping, index) => {
              const pingId = ping.sat_id ?? ping.id ?? `sat_${index + 1}`
              const hasLinkedFlag = Boolean(ping.linked_flag_id)

              return (
                <tr key={pingId} className="border-b border-[#edf2ed] text-[#264437]">
                  <td className="px-4 py-3 font-semibold">{String(pingId).replace('sat_', 'SAT-')}</td>
                  <td className="px-4 py-3">{formatChangeType(ping.signal_type)}</td>
                  <td className="px-4 py-3">{ping.jurisdiction?.gram_sabha ?? 'Unlinked Detection'}</td>
                  <td className="px-4 py-3">{formatConfidence(ping.confidence_score)}</td>
                  <td className="px-4 py-3">{formatCoordinates(ping.latitude, ping.longitude)}</td>
                  <td className="px-4 py-3">{formatDate(ping.created_at)}</td>
                  <td className="px-4 py-3">
                    {ping.suppressed ? (
                      <span className="inline-flex rounded-full border border-[#f3d8a4] bg-[#fff7e7] px-2.5 py-1 text-xs font-semibold text-[#8f5a04]">
                        Suppressed
                      </span>
                    ) : hasLinkedFlag ? (
                      <span className="inline-flex rounded-full border border-[#bfe5cb] bg-[#eaf7ef] px-2.5 py-1 text-xs font-semibold text-[#175a38]">
                        Routed to Alert
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-[#d8dee4] bg-[#f4f5f7] px-2.5 py-1 text-xs font-semibold text-[#6b7280]">
                        Monitoring
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {hasLinkedFlag ? formatFlagCode(ping.linked_flag_id) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {hasLinkedFlag ? (
                      <Link
                        to={`/alerts?focusFlag=${encodeURIComponent(String(ping.linked_flag_id))}`}
                        className="rounded-md border border-[#ccdbcc] px-2.5 py-1 text-xs font-semibold text-[#27483b] hover:bg-[#eef5ee]"
                      >
                        Open Flag
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

export default SatellitePingsPage
