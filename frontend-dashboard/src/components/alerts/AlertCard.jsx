import { BadgeCheck, Check, MapPin, Mic, ShieldAlert, X, XCircle } from 'lucide-react'
import StatusBadge from '../common/StatusBadge'
import SourceBadge from '../common/SourceBadge'
import CorroborationBadge from '../common/CorroborationBadge'
import {
  formatChangeType,
  formatConfidence,
  formatCoordinates,
  formatDate,
  formatFlagCode,
} from '../../utils/formatters'
import { useAppLanguage } from '../../hooks/useAppLanguage'

function AlertCard({
  flag,
  jurisdiction,
  linkedReport,
  onViewDetails,
  onVerify,
  onReject,
  compact = false,
}) {
  const { t } = useAppLanguage()

  const normalizedSource = String(flag.source ?? '').toLowerCase().replaceAll(' ', '_')
  const isCitizenReport = normalizedSource === 'citizen_report'

  const baseAuthenticityScore = linkedReport?.authenticity_score ?? flag.satellite_confidence
  const authenticityScorePercent =
    typeof baseAuthenticityScore === 'number'
      ? Math.round(baseAuthenticityScore <= 1 ? baseAuthenticityScore * 100 : baseAuthenticityScore)
      : null

  const hasAuthenticity = isCitizenReport && typeof authenticityScorePercent === 'number'
  const isAuthenticityVerified = hasAuthenticity && authenticityScorePercent > 80
  const isVerifiedNgoReport =
    isCitizenReport &&
    (linkedReport?.tier === 3 ||
      /verified|ngo/i.test(String(linkedReport?.reporter_trust ?? '')) ||
      /verified|ngo/i.test(String(linkedReport?.role ?? '')))

  const citizenDescription =
    linkedReport?.description ?? t('alerts.citizenFallback')

  return (
    <article className="vr-interactive rounded-xl border border-[#e0e8e0] bg-white p-3 shadow-[0_1px_2px_rgba(13,40,28,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-[#1a3329]">{formatFlagCode(flag.flag_id)}</div>
        <div className="flex items-center gap-2">
          <StatusBadge status={flag.status} className="px-2 py-0.5 text-[10px]" />
          <button type="button" className="text-[#9ca7a1] transition hover:text-[#6f7c74]">
            <XCircle size={13} />
          </button>
        </div>
      </div>

      <h3 className="mt-2 text-sm font-semibold text-[#203a2f]">{formatChangeType(flag.signal_type)}</h3>

      <div className="mt-2">
        <CorroborationBadge
          corroborationState={flag.corroboration_state}
          corroborationCount={flag.corroboration_count}
          className="text-[10px]"
        />
      </div>

      {(hasAuthenticity || isVerifiedNgoReport) ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {hasAuthenticity ? (
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                isAuthenticityVerified
                  ? 'border-[#bae5c8] bg-[#eaf8ef] text-[#206544]'
                  : 'border-[#f3d8a4] bg-[#fff7e7] text-[#8f5a04]'
              }`}
            >
              {t('alerts.authenticity')}: {authenticityScorePercent}% ({isAuthenticityVerified ? t('alerts.verified') : t('alerts.potentialAi')})
            </span>
          ) : null}

          {isVerifiedNgoReport ? (
            <span className="rounded-full border border-[#deccff] bg-[#f4efff] px-2 py-0.5 text-[10px] font-semibold text-[#5d3faa]">
              <BadgeCheck size={11} className="mr-1 inline" />
              {t('alerts.verifiedNgo')}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1 text-xs text-[#66736c]">
          <p className="flex items-center gap-1 font-medium text-[#30493f]">
            <MapPin size={12} />
            {jurisdiction?.gram_sabha ?? 'Unknown Jurisdiction'}
          </p>
          <p>{formatCoordinates(flag.latitude, flag.longitude)}</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-[#7b8681]">Source</p>
          <SourceBadge source={flag.source} className="mt-1" />
          <p className="mt-1 font-semibold text-[#1f6e44]">{formatConfidence(flag.satellite_confidence)}</p>
        </div>
      </div>

      {isCitizenReport ? (
        <div className="mt-2 rounded-lg border border-[#e2e9e2] bg-[#f9fcf9] px-2.5 py-2">
          <p className="text-xs text-[#465b51]">{citizenDescription}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#5d7068]">
            <Mic size={12} /> {t('alerts.speechToText')}
          </p>
        </div>
      ) : null}

      <div className="mt-2 text-xs text-[#69766f]">{formatDate(flag.created_at)}</div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="rounded-md border border-[#cdd9cd] px-2.5 py-1.5 text-xs font-semibold text-[#234638] transition hover:bg-[#eff5ef]"
        >
          View Details
        </button>

        {!compact ? (
          <>
            <button
              type="button"
              onClick={onVerify}
              className="inline-flex items-center gap-1 rounded-md bg-[#0f6a43] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#095636]"
            >
              <Check size={12} /> Verify
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center gap-1 rounded-md border border-[#e5b5b2] px-2.5 py-1.5 text-xs font-semibold text-[#b0463f] transition hover:bg-[#fdf0ef]"
            >
              <X size={12} /> Reject
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#f8fbf8] px-2 py-1 text-xs text-[#5e6a63]">
            <ShieldAlert size={12} /> Review Queue
          </span>
        )}
      </div>
    </article>
  )
}

export default AlertCard
