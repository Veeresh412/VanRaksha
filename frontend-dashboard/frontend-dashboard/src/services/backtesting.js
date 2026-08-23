import { apiRequest } from './api'

export async function getBacktestingEvents(events) {
  return apiRequest(() => events)
}
