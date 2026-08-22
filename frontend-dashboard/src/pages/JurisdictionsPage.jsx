import { useMemo } from 'react'
import { useDashboardContext } from '../hooks/useDashboardContext'
import PageHeader from '../components/common/PageHeader'

function JurisdictionsPage() {
  const { jurisdictions, scopedFlags, session } = useDashboardContext()

  const jurisdictionRows = useMemo(
    () =>
      jurisdictions.map((jurisdiction) => {
        const jurisdictionFlags = scopedFlags.filter(
          (flag) => flag.jurisdiction_id === jurisdiction.id,
        )

        return {
          ...jurisdiction,
          totalFlags: jurisdictionFlags.length,
          underReview: jurisdictionFlags.filter((flag) => flag.status === 'under_review').length,
          verified: jurisdictionFlags.filter((flag) => flag.status === 'verified').length,
        }
      }),
    [jurisdictions, scopedFlags],
  )

  return (
    <div>
      <PageHeader
        title={session.role === 'admin' ? 'Jurisdictions' : 'My Jurisdiction'}
        subtitle="Browse monitoring jurisdictions and associated alert load"
      />

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Gram Sabha</th>
              <th className="px-4 py-3">District</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Coordinates</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Under Review</th>
              <th className="px-4 py-3">Verified</th>
            </tr>
          </thead>
          <tbody>
            {jurisdictionRows.map((jurisdiction) => (
              <tr key={jurisdiction.id} className="border-b border-[#edf2ed] text-[#264437]">
                <td className="px-4 py-3 font-medium">{jurisdiction.gram_sabha}</td>
                <td className="px-4 py-3">{jurisdiction.district}</td>
                <td className="px-4 py-3">{jurisdiction.state}</td>
                <td className="px-4 py-3">{jurisdiction.latitude.toFixed(4)}, {jurisdiction.longitude.toFixed(4)}</td>
                <td className="px-4 py-3 font-semibold">{jurisdiction.totalFlags}</td>
                <td className="px-4 py-3">{jurisdiction.underReview}</td>
                <td className="px-4 py-3">{jurisdiction.verified}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default JurisdictionsPage
