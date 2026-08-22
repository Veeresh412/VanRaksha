import { apiRequest } from './api'

export async function createSatellitePing({
  token,
  latitude,
  longitude,
  confidenceScore,
  signalType,
}) {
  return apiRequest({
    path: '/satellite-pings',
    method: 'POST',
    token,
    body: {
      latitude,
      longitude,
      confidence_score: confidenceScore,
      signal_type: signalType,
    },
  })
}
