import { useMemo, useState } from 'react'
import { BadgeCheck, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useDashboardContext } from '../hooks/useDashboardContext'
import PageHeader from '../components/common/PageHeader'
import StatusBadge from '../components/common/StatusBadge'
import { formatDate, formatFlagCode, formatUnitScore, normalizeUnitScore } from '../utils/formatters'
import { useAppLanguage } from '../hooks/useAppLanguage'
import { getEvidenceImageUrls, getObservationText } from '../utils/reportEvidence'

function resolveUserStatus(report) {
  const trustLabel = String(report.reporter_trust ?? '').toLowerCase()

  if (trustLabel.includes('verified') || report.tier === 3) return 'Verified User'
  if (trustLabel.includes('geo') || report.tier === 2) return 'Geo-tagged User'
  return 'Basic User'
}

function normalizeLocationStatusLabel(rawStatus, locationVerified) {
  if (typeof locationVerified === 'boolean') {
    return locationVerified ? 'Verified' : 'Unverified'
  }

  const normalizedRawStatus = String(rawStatus ?? '').toLowerCase()

  if (!normalizedRawStatus) return 'Unverified'

  if (
    normalizedRawStatus.includes('mismatch') ||
    normalizedRawStatus.includes('discrep') ||
    normalizedRawStatus.includes('outside') ||
    normalizedRawStatus.includes('disturb')
  ) {
    return 'Location Disturbance'
  }

  if (normalizedRawStatus.includes('verified') || normalizedRawStatus.includes('match')) {
    return 'Verified'
  }

  return 'Unverified'
}

function getLocationStatusStyle(locationStatus) {
  const normalizedLocationStatus = String(locationStatus ?? '').toLowerCase()

  if (normalizedLocationStatus.includes('disturb')) {
    return 'border-[#f3c5bf] bg-[#fef1ef] text-[#b34a40]'
  }

  if (normalizedLocationStatus.includes('unverified')) {
    return 'border-[#f3d8a4] bg-[#fff7e7] text-[#8f5a04]'
  }

  if (normalizedLocationStatus.includes('verified')) {
    return 'border-[#bae5c8] bg-[#eaf8ef] text-[#206544]'
  }

  return 'border-[#d4dee8] bg-[#f2f6fa] text-[#4f6174]'
}

function EvidenceLightbox({ imageUrl, onClose }) {
  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[2100] flex items-center justify-center bg-[#0a1d14]/70 p-4 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-[#d9e3d9] bg-white"
        onClick={(event) => event.stopPropagation()}
        role="presentation"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-md border border-[#d8e1d8] bg-white/95 p-2 text-[#2a4337]"
          aria-label="Close image preview"
        >
          <X size={16} />
        </button>

        <img
          src={imageUrl}
          alt="Citizen uploaded evidence"
          className="max-h-[82vh] w-full bg-[#f7faf7] object-contain"
        />
      </div>
    </div>
  )
}

function CitizenReportsPage() {
  const { citizenReports, jurisdictionsById } = useAppData()
  const { session } = useDashboardContext()
  const { t } = useAppLanguage()
  const [selectedReport, setSelectedReport] = useState(null)
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState(null)

  const visibleReports = useMemo(() => {
    if (session.role === 'admin') return citizenReports

    if (session.role === 'district_officer') {
      const scopedJurisdictions = new Set(session.jurisdiction_ids ?? [])

      return citizenReports.filter((report) => {
        if (!report.jurisdiction_id) return false

        if (scopedJurisdictions.size > 0) {
          return scopedJurisdictions.has(report.jurisdiction_id)
        }

        const jurisdiction = jurisdictionsById[report.jurisdiction_id]
        return jurisdiction?.district === session.district
      })
    }

    return citizenReports.filter(
      (report) => report.jurisdiction_id === session.jurisdiction_id,
    )
  }, [citizenReports, session, jurisdictionsById])

  const selectedReportObservation = getObservationText(selectedReport)
  const selectedReportEvidence = getEvidenceImageUrls(selectedReport)
  const selectedReportUserIdentity =
    selectedReport?.reporter_id ?? selectedReport?.user_id ?? selectedReport?.reporter_label ?? '--'

  return (
    <div>
      <PageHeader
        title="Citizen Reports"
        subtitle="Monitor incoming report signals and review full evidence inside details"
      />

      <div className="vr-card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#dce5dc] bg-[#f7faf7] text-xs uppercase tracking-wide text-[#708078]">
            <tr>
              <th className="px-4 py-3">Report ID</th>
              <th className="px-4 py-3">Linked Flag</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">User Status</th>
              <th className="px-4 py-3">Location Status</th>
              <th className="px-4 py-3">Jurisdiction</th>
              <th className="px-4 py-3">Authenticity</th>
              <th className="px-4 py-3">Reporter Signal</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {visibleReports.map((report) => {
              const jurisdiction = jurisdictionsById[report.jurisdiction_id]
              const userStatus = resolveUserStatus(report)

              const locationStatus = normalizeLocationStatusLabel(
                report.location_status ??
                  report.location_verification_status ??
                  report.geo_status ??
                  report.gps_status,
                report.location_verified ?? report.geo_verified,
              )

              const authenticityScore = normalizeUnitScore(report.authenticity_score)
              const isAuthenticityVerified =
                typeof authenticityScore === 'number' && authenticityScore >= 0.8

              const isVerifiedNgoReport =
                report.tier === 3 || /verified|ngo/i.test(String(report.reporter_trust ?? ''))

              return (
                <tr key={report.report_id} className="border-b border-[#edf2ed] text-[#264437]">
                  <td className="px-4 py-3 font-medium">{report.report_id.replace('report_', 'RPT-')}</td>
                  <td className="px-4 py-3 font-semibold">
                    {report.linked_flag_id ? (
                      <Link
                        to={`/alerts?focusFlag=${encodeURIComponent(String(report.linked_flag_id))}`}
                        className="text-[#1f6e44] underline decoration-[#8cbfa1] underline-offset-2 transition hover:text-[#155435]"
                      >
                        {formatFlagCode(report.linked_flag_id)}
                      </Link>
                    ) : (
                      'Unlinked'
                    )}
                  </td>
                  <td className="px-4 py-3">Tier {report.tier}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#d3ddd3] px-2.5 py-1 text-xs">
                      {userStatus}
                      {report.tier === 3 && <ShieldCheck size={12} className="text-[#2E9B5F]" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getLocationStatusStyle(locationStatus)}`}
                    >
                      {locationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">{jurisdiction?.gram_sabha}</td>
                  <td className="px-4 py-3">
                    {typeof authenticityScore === 'number' ? (
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          isAuthenticityVerified
                            ? 'border-[#bae5c8] bg-[#eaf8ef] text-[#206544]'
                            : 'border-[#f3d8a4] bg-[#fff7e7] text-[#8f5a04]'
                        }`}
                      >
                        {t('alerts.authenticity')}: {formatUnitScore(authenticityScore)} ({isAuthenticityVerified ? t('alerts.verified') : t('alerts.potentialAi')})
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isVerifiedNgoReport ? (
                      <span className="inline-flex items-center rounded-full border border-[#deccff] bg-[#f4efff] px-2.5 py-1 text-xs font-semibold text-[#5d3faa]">
                        <BadgeCheck size={12} className="mr-1" />
                        {t('alerts.verifiedNgo')}
                      </span>
                    ) : (
                      <span className="text-xs text-[#74857d]">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatDate(report.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(report)}
                      className="rounded-md border border-[#ccdbcc] px-2.5 py-1 text-xs font-semibold text-[#27483b] hover:bg-[#eef5ee]"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#0b1f15]/55 p-4 backdrop-blur-[1px]"
          onClick={() => setSelectedReport(null)}
          role="presentation"
        >
          <section
            className="w-full max-w-4xl rounded-xl border border-[#dbe6db] bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6c7a73]">Citizen Report Detail</p>
                <h3 className="mt-1 text-xl font-semibold text-[#143126]">
                  {selectedReport.report_id.replace('report_', 'RPT-')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-md border border-[#d7dfd7] p-2 text-[#41554d] transition hover:bg-[#f3f7f3]"
                aria-label="Close report details"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <div className="rounded-lg border border-[#e0e7df] bg-[#fbfdfb] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#76827b]">Linked Flag</p>
                <p className="mt-1 text-sm font-medium text-[#234437]">
                  {selectedReport.linked_flag_id ? formatFlagCode(selectedReport.linked_flag_id) : 'Unlinked'}
                </p>
              </div>
              <div className="rounded-lg border border-[#e0e7df] bg-[#fbfdfb] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#76827b]">Reporter</p>
                <p className="mt-1 text-sm font-medium text-[#234437]">{selectedReportUserIdentity}</p>
              </div>
              <div className="rounded-lg border border-[#e0e7df] bg-[#fbfdfb] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#76827b]">User Status</p>
                <p className="mt-1 text-sm font-medium text-[#234437]">{resolveUserStatus(selectedReport)}</p>
              </div>
              <div className="rounded-lg border border-[#e0e7df] bg-[#fbfdfb] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#76827b]">Reporter Trust</p>
                <p className="mt-1 text-sm font-medium text-[#234437]">{selectedReport.reporter_trust ?? '--'}</p>
              </div>
              <div className="rounded-lg border border-[#e0e7df] bg-[#fbfdfb] p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#76827b]">Submitted</p>
                <p className="mt-1 text-sm font-medium text-[#234437]">{formatDate(selectedReport.created_at)}</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#dfe6df] bg-[#fbfdfb] p-3">
              <h4 className="text-sm font-semibold text-[#1f3a2f]">Observation</h4>
              <p className="mt-2 text-sm text-[#40554b]">{selectedReportObservation}</p>
            </div>

            <div className="mt-4 rounded-lg border border-[#dfe6df] bg-[#fbfdfb] p-3">
              <h4 className="text-sm font-semibold text-[#1f3a2f]">Uploaded Evidence</h4>

              {selectedReportEvidence.length > 0 ? (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {selectedReportEvidence.map((imageUrl, index) => (
                    <button
                      key={`${selectedReport.report_id}-${imageUrl}`}
                      type="button"
                      onClick={() => setSelectedEvidenceUrl(imageUrl)}
                      className="overflow-hidden rounded-lg border border-[#d6e1d6] text-left"
                    >
                      <img
                        src={imageUrl}
                        alt={`Citizen evidence ${index + 1}`}
                        className="h-36 w-full bg-[#f7faf7] object-cover"
                      />
                      <span className="inline-block px-3 py-2 text-xs font-semibold text-[#2d4a3d]">
                        Open image {index + 1}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#66736c]">
                  No image uploaded yet. Backend can attach evidence using fields like <code>evidence_urls</code>,
                  <code>photo_urls</code>, <code>image_urls</code>, or <code>photo_url</code>.
                </p>
              )}
            </div>
          </section>
        </div>
      )}

      <EvidenceLightbox
        imageUrl={selectedEvidenceUrl}
        onClose={() => setSelectedEvidenceUrl(null)}
      />
    </div>
  )
}

export default CitizenReportsPage
