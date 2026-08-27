function toCleanString(value) {
  if (typeof value !== 'string') return null

  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : null
}

function collectStringValues(value) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => toCleanString(entry))
      .filter(Boolean)
  }

  const normalizedValue = toCleanString(value)
  return normalizedValue ? [normalizedValue] : []
}

export function getObservationText(report) {
  return (
    toCleanString(report?.observation_text) ??
    toCleanString(report?.observation) ??
    toCleanString(report?.description) ??
    'Citizen-submitted observation is available for review.'
  )
}

export function getEvidenceImageUrls(report) {
  const urls = [
    ...collectStringValues(report?.evidence_urls),
    ...collectStringValues(report?.photo_urls),
    ...collectStringValues(report?.image_urls),
    ...collectStringValues(report?.media_urls),
    ...collectStringValues(report?.photos),
    ...collectStringValues(report?.photo_url),
    ...collectStringValues(report?.image_url),
    ...collectStringValues(report?.evidence_url),
  ]

  return Array.from(new Set(urls))
}

