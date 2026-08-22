import { apiRequest } from './api'

export async function getCitizenReports(reports) {
  return apiRequest(() => reports)
}
