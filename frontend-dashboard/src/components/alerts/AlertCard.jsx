import { Check, MapPin, ShieldAlert, X, XCircle } from 'lucide-react'
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

function AlertCard({
  flag,
  jurisdiction,
  onViewDetails,
  onVerify,
  onReject,
  compact = false,
}) {
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

      <h3 className="mt-2 text-sm font-semibold text-[#203a2f]">{formatChangeType(flag.change_type)}</h3>

      <div className="mt-2">
        <CorroborationBadge
          corroborationState={flag.corroboration_state}
          corroborationCount={flag.corroboration_count}
          className="text-[10px]"
        />
      </div>

      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <div className="space-y-1 text-xs text-[#66736c]">
          <p className="flex items-center gap-1 font-medium text-[#30493f]">
            <MapPin size={12} />
            {jurisdiction?.gram_sabha ?? 'Unknown Jurisdiction'}
          </p>
          <p>{formatCoordinates(flag.lat, flag.long)}</p>
        </div>
        <div className="text-right text-xs">
          <p className="text-[#7b8681]">Source</p>
          <SourceBadge source={flag.source} className="mt-1" />
          <p className="mt-1 font-semibold text-[#1f6e44]">{formatConfidence(flag.confidence_score)}</p>
        </div>
      </div>

      <div className="mt-2 text-xs text-[#69766f]">{formatDate(flag.date_detected)}</div>

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
