import { clsx } from 'clsx'
import {
  formatCorroborationState,
  getCorroborationColors,
} from '../../utils/formatters'

function CorroborationBadge({
  corroborationState,
  corroborationCount,
  className = '',
}) {
  const label = formatCorroborationState(corroborationState)
  const displayLabel =
    corroborationState === 'corroborated'
      ? `${label} (${corroborationCount ?? 0} reports)`
      : label

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        getCorroborationColors(corroborationState),
        className,
      )}
    >
      {displayLabel}
    </span>
  )
}

export default CorroborationBadge
