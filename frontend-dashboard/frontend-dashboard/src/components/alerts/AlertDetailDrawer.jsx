import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet'
import { BadgeCheck, CalendarDays, MapPin, Mic, ShieldCheck, UserRound, X } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import SourceBadge from '../common/SourceBadge'
import CorroborationBadge from '../common/CorroborationBadge'
import PriorityBadge from '../common/PriorityBadge'
import {
  formatChangeType,
  formatConfidence,
  formatCoordinates,
  formatDate,
  formatFlagCode,
  formatUnitScore,
  normalizeUnitScore,
} from '../../utils/formatters'
import { useAppLanguage } from '../../hooks/useAppLanguage'

const mapTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

function DetailRow({ label, value }) {
  return (
    <div className="rounded-lg border border-[#e0e7df] bg-[#fbfdfb] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#76827b]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#234437]">{value}</p>
    </div>
  )
}

function AlertDetailDrawer({
  flag,
  jurisdiction,
  linkedReport,
  open,
  onClose,
  onUnderReview,
  onVerify,
  onReject,
  onResolve,
  onEscalate,
  onSaveOfficerNote,
  role,
}) {
  const { t } = useAppLanguage()
  const [officerNote, setOfficerNote] = useState(flag?.officer_notes ?? '')

  const normalizedSource = String(flag?.source ?? '').toLowerCase().replaceAll(' ', '_')
  const isCitizenReport = normalizedSource === 'citizen_report'

  const baseAuthenticityScore = linkedReport?.authenticity_score ?? flag?.satellite_confidence
  const authenticityScore = normalizeUnitScore(baseAuthenticityScore)

  const hasAuthenticity = isCitizenReport && typeof authenticityScore === 'number'
  const isAuthenticityVerified = hasAuthenticity && authenticityScore >= 0.8
  const isVerifiedNgoReport =
    isCitizenReport &&
    (linkedReport?.tier === 3 ||
      /verified|ngo/i.test(String(linkedReport?.reporter_trust ?? '')) ||
      /verified|ngo/i.test(String(linkedReport?.role ?? '')))

  const isUnderReview = flag?.status === 'Under Review'
  const isVerified = flag?.status === 'Verified'
  const isRejected = flag?.status === 'Rejected'
  const isResolved = flag?.status === 'Resolved'
  const noteUnchanged = (officerNote ?? '').trim() === (flag?.officer_notes ?? '').trim()

  if (!open || !flag) return null

  return (
    <div className="fixed inset-0 z-[1800] flex justify-end bg-[#0d251a]/40 backdrop-blur-[2px] animate-[vr-fade-in_180ms_ease-out]">
      <aside className="vr-subtle-scrollbar h-full w-full max-w-xl animate-[vr-slide-in-right_220ms_cubic-bezier(.2,.9,.2,1)] overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#6c7a73]">Alert Detail</p>
            <h3 className="mt-1 text-xl font-semibold text-[#143126]">{formatFlagCode(flag.flag_id)}</h3>
            <p className="mt-1 text-sm text-[#4e6158]">{formatChangeType(flag.signal_type)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#d7dfd7] p-2 text-[#41554d] transition hover:bg-[#f3f7f3]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={flag.status} />
          <SourceBadge source={flag.source} />
          <CorroborationBadge
            corroborationState={flag.corroboration_state}
            corroborationCount={flag.corroboration_count}
          />
          {typeof flag.priority_score === 'number' ? (
            <PriorityBadge band={flag.priority_band} score={flag.priority_score} />
          ) : null}
          {flag.escalated && (
            <span className="rounded-full border border-[#f9d596] bg-[#fff6e5] px-2.5 py-1 text-xs font-semibold text-[#9f5b03]">
              Escalated
            </span>
          )}

          {hasAuthenticity ? (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                isAuthenticityVerified
                  ? 'border-[#bae5c8] bg-[#eaf8ef] text-[#206544]'
                  : 'border-[#f3d8a4] bg-[#fff7e7] text-[#8f5a04]'
              }`}
            >
              {t('alerts.authenticity')}: {formatUnitScore(authenticityScore)} ({isAuthenticityVerified ? t('alerts.verified') : t('alerts.potentialAi')})
            </span>
          ) : null}

          {isVerifiedNgoReport ? (
            <span className="rounded-full border border-[#deccff] bg-[#f4efff] px-2.5 py-1 text-xs font-semibold text-[#5d3faa]">
              <BadgeCheck size={12} className="mr-1 inline" />
              {t('alerts.verifiedNgo')}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <DetailRow label="Detection Confidence" value={formatConfidence(flag.satellite_confidence)} />
          <DetailRow label="Detected" value={formatDate(flag.created_at)} />
          <DetailRow label="Jurisdiction" value={jurisdiction?.gram_sabha ?? 'Unknown'} />
          <DetailRow label="District" value={jurisdiction?.district ?? 'Unknown'} />
          <DetailRow label="State" value={jurisdiction?.state ?? 'Unknown'} />
          <DetailRow label="Coordinates" value={formatCoordinates(flag.latitude, flag.longitude)} />
        </div>

        {isCitizenReport ? (
          <div className="mt-4 rounded-lg border border-[#dfe6df] bg-[#fbfdfb] p-3">
            <h4 className="text-sm font-semibold text-[#1f3a2f]">{t('alerts.citizenNarrative')}</h4>
            <p className="mt-1 text-sm text-[#40554b]">
              {linkedReport?.description ?? t('alerts.citizenFallback')}
            </p>
            <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#5d7068]">
              <Mic size={13} /> {t('alerts.speechToText')}
            </p>
          </div>
        ) : null}

        <div className="mt-4">
          <h4 className="text-sm font-semibold text-[#1f3a2f]">Contextual Map</h4>
          <div className="mt-2 h-56 overflow-hidden rounded-lg border border-[#d8e1d8]">
            <MapContainer center={[flag.latitude, flag.longitude]} zoom={13} scrollWheelZoom>
              <TileLayer url={mapTileUrl} />
              <CircleMarker center={[flag.latitude, flag.longitude]} radius={9} pathOptions={{ color: '#E5534B', fillOpacity: 0.8 }} />
            </MapContainer>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-dashed border-[#d5dfd5] bg-[#fafdf9] p-3">
            <h4 className="text-sm font-semibold text-[#1f3a2f]">Before/After Satellite Images</h4>
            <p className="mt-2 text-xs text-[#66736c]">Placeholder: imagery will be linked by backend API.</p>
          </div>
          <div className="rounded-lg border border-dashed border-[#d5dfd5] bg-[#fafdf9] p-3">
            <h4 className="text-sm font-semibold text-[#1f3a2f]">Citizen Photos</h4>
            <p className="mt-2 text-xs text-[#66736c]">Placeholder: uploaded photos will appear here when integrated.</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e3e9e3] pt-4">
          <button
            type="button"
            onClick={() => onUnderReview(flag.flag_id)}
            disabled={isUnderReview || isResolved}
            className="inline-flex items-center gap-1 rounded-md border border-[#f0ca83] bg-[#fff6e5] px-3 py-2 text-xs font-semibold text-[#9a5502] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck size={13} /> Move to Under Review
          </button>
          <button
            type="button"
            onClick={() => onVerify(flag.flag_id)}
            disabled={isVerified || isResolved}
            className="rounded-md bg-[#0f6a43] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Verify
          </button>
          <button
            type="button"
            onClick={() => onReject(flag.flag_id)}
            disabled={isRejected || isResolved}
            className="rounded-md border border-[#e5b5b2] px-3 py-2 text-xs font-semibold text-[#b0463f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => onResolve(flag.flag_id)}
            disabled={isResolved}
            className="rounded-md border border-[#b8d8c5] px-3 py-2 text-xs font-semibold text-[#206544] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark Resolved
          </button>
          {role === 'gram_sabha' && (
            <button
              type="button"
              onClick={() => onEscalate(flag.flag_id)}
              className="inline-flex items-center gap-1 rounded-md border border-[#d3dce5] px-3 py-2 text-xs font-semibold text-[#33495f]"
            >
              <UserRound size={13} /> Escalate
            </button>
          )}
        </div>

        {(role === 'admin' || role === 'district_officer') && (
          <div className="mt-4 rounded-lg border border-[#dfe6df] bg-[#fbfdfb] p-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#6f7b74]" htmlFor="officer-note">
              Officer Note (Internal)
            </label>
            <textarea
              id="officer-note"
              value={officerNote}
              onChange={(event) => setOfficerNote(event.target.value)}
              rows={3}
              placeholder="Add internal review note for district/admin team."
              className="mt-2 w-full resize-y rounded-md border border-[#d0dbd0] px-3 py-2 text-sm text-[#254237] outline-none focus:border-[#7bb891]"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => onSaveOfficerNote(flag.flag_id, officerNote)}
                disabled={noteUnchanged}
                className="rounded-md bg-[#0f6a43] px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save Note
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 rounded-md border border-[#e2e8e2] bg-[#f8faf8] p-3 text-xs text-[#67756d]">
          <MapPin size={13} className="mr-1 inline" />
          Alerts represent potential land-use change signals and require authorized human review.
          <CalendarDays size={13} className="mx-1 inline" />
          The system supports prioritization and routing, not legal determination.
        </p>
      </aside>
    </div>
  )
}

export default AlertDetailDrawer
