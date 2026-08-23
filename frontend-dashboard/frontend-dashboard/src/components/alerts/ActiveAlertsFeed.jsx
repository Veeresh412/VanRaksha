import AlertCard from './AlertCard'

function ActiveAlertsFeed({
  flags,
  jurisdictionsById,
  linkedReportsByFlagId,
  onSelectFlag,
  onVerify,
  onReject,
  onViewAll,
  title = 'Active Alerts Feed',
}) {
  return (
    <section className="vr-card h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#153127]">{title}</h2>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-[#2a7a4a] transition hover:text-[#1f623c]"
        >
          View All
        </button>
      </div>

      <div className="vr-subtle-scrollbar max-h-[66vh] space-y-3 overflow-y-auto pr-1">
        {flags.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#d6dfd6] bg-[#fbfdfb] p-6 text-center text-sm text-[#66736c]">
            No alerts match current filters.
          </div>
        ) : (
          flags.map((flag) => (
            <AlertCard
              key={flag.flag_id}
              flag={flag}
              jurisdiction={jurisdictionsById[flag.jurisdiction_id]}
              linkedReport={linkedReportsByFlagId?.[flag.flag_id]}
              onViewDetails={() => onSelectFlag(flag)}
              onVerify={() => onVerify(flag.flag_id)}
              onReject={() => onReject(flag.flag_id)}
            />
          ))
        )}
      </div>
    </section>
  )
}

export default ActiveAlertsFeed
