const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? ''
const forceSeedMode = String(import.meta.env.VITE_USE_SEED_DATA ?? '').toLowerCase() === 'true'
const forceDemoLogin = String(import.meta.env.VITE_ENABLE_DEMO_LOGIN ?? '').toLowerCase() === 'true'

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '')
export const USE_SEED_DATA = forceSeedMode || !API_BASE_URL
export const ENABLE_DEMO_LOGIN = forceDemoLogin || USE_SEED_DATA
