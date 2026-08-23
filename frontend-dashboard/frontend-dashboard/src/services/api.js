import { API_BASE_URL, USE_SEED_DATA } from './config'

function buildUrl(path, query) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${API_BASE_URL}${normalizedPath}`)

  if (!query) return url.toString()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    url.searchParams.set(key, String(value))
  })

  return url.toString()
}

async function parseResponseBody(response) {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }

  try {
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

function normalizeApiErrorMessage(status, payload) {
  if (typeof payload === 'string' && payload.trim()) return payload
  if (payload && typeof payload === 'object') {
    if (typeof payload.detail === 'string' && payload.detail.trim()) return payload.detail
    if (typeof payload.message === 'string' && payload.message.trim()) return payload.message
    if (typeof payload.error === 'string' && payload.error.trim()) return payload.error
  }

  if (status === 401) return 'Session expired or unauthorized access.'
  if (status === 403) return 'You do not have permission for this action.'
  if (status === 404) return 'Requested record was not found.'

  return `Request failed with status ${status}`
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

export async function apiRequest(configOrSeedHandler) {
  if (typeof configOrSeedHandler === 'function') {
    if (USE_SEED_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 120))
      return configOrSeedHandler()
    }

    throw new Error('Backend integration requires a request configuration object.')
  }

  const {
    path,
    method = 'GET',
    query,
    body,
    token,
    headers = {},
    seedHandler,
  } = configOrSeedHandler

  if (USE_SEED_DATA) {
    if (!seedHandler) {
      throw new Error('Seed mode is enabled but no seed handler was provided for this request.')
    }

    await new Promise((resolve) => setTimeout(resolve, 120))
    return seedHandler()
  }

  const requestHeaders = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`
  }

  const response = await fetch(buildUrl(path, query), {
    method,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new ApiError(
      normalizeApiErrorMessage(response.status, payload),
      response.status,
      payload,
    )
  }

  return payload
}

export function extractArray(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.results)) return payload.results
  return []
}
