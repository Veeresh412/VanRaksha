import { USE_SEED_DATA } from './config'

export async function apiRequest(handler) {
  if (USE_SEED_DATA) {
    await new Promise((resolve) => setTimeout(resolve, 120))
    return handler()
  }

  throw new Error('Backend integration is not enabled yet.')
}
