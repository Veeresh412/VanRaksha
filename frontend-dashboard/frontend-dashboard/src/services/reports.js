import { apiRequest, extractArray } from './api'

export async function createCitizenReport({
  token,
  photoUrl,
  description,
  tier,
  reporterTrust,
  latitude,
  longitude,
}) {
  return apiRequest({
    path: '/reports',
    method: 'POST',
    token,
    body: {
      photo_file_url: photoUrl,
      description,
      tier,
      reporter_trust: reporterTrust,
      lat: latitude,
      lng: longitude,
    },
  })
}

function mapReport(item) {
  return {
    ...item,
    report_id: `report_${item.id}`,
    jurisdiction_id: item.fra_parcel_id,
    reporter_trust: item.reporter_type
  }
}

export async function getCitizenReports({ token, page = 1, limit = 500, status, tier } = {}) {
  const payload = await apiRequest({
    path: '/reports',
    method: 'GET',
    token,
    query: {
      page,
      limit,
      status,
      tier,
    },
  })

  return extractArray(payload).map(mapReport)
}

export async function getCitizenReportById({ token, reportId }) {
  return apiRequest({
    path: `/reports/${reportId}`,
    method: 'GET',
    token,
  })
}
