import { clsx } from 'clsx'
import { formatSource, getSourceColors } from '../../utils/formatters'

function SourceBadge({ source, className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        getSourceColors(source),
        className,
      )}
    >
      {formatSource(source)}
    </span>
  )
}

export default SourceBadge
