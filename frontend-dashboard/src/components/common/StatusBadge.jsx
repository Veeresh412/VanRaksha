import { clsx } from 'clsx'
import { formatStatus, getStatusColors } from '../../utils/formatters'

function StatusBadge({ status, className = '' }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold',
        getStatusColors(status),
        className,
      )}
    >
      {formatStatus(status)}
    </span>
  )
}

export default StatusBadge
