import { apiRequest } from './api'

export async function getJurisdictions(jurisdictions) {
  return apiRequest(() => jurisdictions)
}
