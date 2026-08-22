import { apiRequest, extractArray } from './api'

export async function getFlags({ token, jurisdictionId, status, page = 1, limit = 500 } = {}) {
  const payload = await apiRequest({
    path: '/flags',
    method: 'GET',
    token,
    query: {
      jurisdiction_id: jurisdictionId,
      status,
      page,
      limit,
    },
  })

  return extractArray(payload)
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

  if (status !== undefined) requestBody.status = status
  if (officerNotes !== undefined) requestBody.officer_notes = officerNotes

  return apiRequest({
    path: `/flags/${flagId}`,
    method: 'PATCH',
    token,
    body: requestBody,
  })
}
