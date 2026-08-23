import { apiRequest, extractArray } from './api'

function mapFlag(item) {
  return {
    ...item,
    flag_id: `FLAG-${item.id}`,
    jurisdiction_id: item.fra_parcel_id,
    long: item.lng,
    date_detected: item.created_at,
    confidence_score: item.satellite_confidence || 0.0,
    change_type: item.signal_type,
    status: (item.status || 'unverified').toLowerCase().replace(' ', '_'),
    source: (item.source || 'satellite').toLowerCase().replace(' ', '_'),
    corroboration: item.corroboration_state
  }
}

export async function getFlags({ token, jurisdictionId, status, page = 1, limit = 500 } = {}) {
  const payload = await apiRequest({
    path: '/flags',
    method: 'GET',
    token,
    query: {
      fra_parcel_id: jurisdictionId,
      status,
      page,
      limit,
    },
  })

  return extractArray(payload).map(mapFlag)
}

export async function getFlagById({ token, flagId }) {
  return apiRequest({
    path: `/flags/${flagId}`,
    method: 'GET',
    token,
  })
}

export async function patchFlag({ token, flagId, status, officerNotes }) {
  const requestBody = {}

  // Map frontend status string back to backend StatusEnum string
  let mappedStatus = status
  if (status === 'unverified') mappedStatus = 'Unverified'
  if (status === 'under_review') mappedStatus = 'Under Review'
  if (status === 'verified') mappedStatus = 'Verified'
  if (status === 'rejected') mappedStatus = 'Rejected'
  if (status === 'resolved') mappedStatus = 'Resolved'

  if (status !== undefined) requestBody.status = mappedStatus
  if (officerNotes !== undefined) requestBody.officer_notes = officerNotes

  // Extract the numeric ID if flagId has the 'FLAG-' prefix
  const numericId = typeof flagId === 'string' ? flagId.replace('FLAG-', '') : flagId

  return apiRequest({
    path: `/flags/${numericId}`,
    method: 'PATCH',
    token,
    body: requestBody,
  })
}
