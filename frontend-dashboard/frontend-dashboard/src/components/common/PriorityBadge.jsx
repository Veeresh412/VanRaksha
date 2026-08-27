import { normalizePriorityScore } from '../../utils/priority'

const priorityStyles = {
  Critical: 'border-[#f3b1ad] bg-[#fdeceb] text-[#b34238]',
  High: 'border-[#f3d7a6] bg-[#fff6e7] text-[#9b5c08]',
  Medium: 'border-[#c7d9ec] bg-[#edf4fc] text-[#2d5e91]',
  Low: 'border-[#cbe5d3] bg-[#eef8f1] text-[#236447]',
}

function PriorityBadge({ band, score }) {
  const normalizedScore = normalizePriorityScore(score)
  const normalizedBand = band ?? 'Low'
  const styleClass = priorityStyles[normalizedBand] ?? priorityStyles.Low

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styleClass}`}>
      {normalizedBand} · {normalizedScore}/100
    </span>
  )
}

export default PriorityBadge
