import { apiRequest } from './api'

export async function getDashboardAnalytics(analytics) {
  return apiRequest(() => analytics)
}
