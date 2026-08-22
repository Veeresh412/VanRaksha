import { apiRequest } from './api'

export async function clearTestData({ token }) {
  return apiRequest({
    path: '/test/clear-data',
    method: 'DELETE',
    token,
  })
}
