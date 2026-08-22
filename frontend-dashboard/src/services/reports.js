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
      photo_url: photoUrl,
      description,
      tier,
      reporter_trust: reporterTrust,
      latitude,
      longitude,
    },
  })
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

  return extractArray(payload)
}

export async function getCitizenReportById({ token, reportId }) {
  return apiRequest({
    path: `/reports/${reportId}`,
    method: 'GET',
    token,
  })
}
