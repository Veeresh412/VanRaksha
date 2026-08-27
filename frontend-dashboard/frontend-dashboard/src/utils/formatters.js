const statusLabelMap = {
  unverified: 'Unverified',
  under_review: 'Under Review',
  verified: 'Verified',
  rejected: 'Rejected',
  resolved: 'Resolved',
  Unverified: 'Unverified',
  'Under Review': 'Under Review',
  Verified: 'Verified',
  Rejected: 'Rejected',
  Resolved: 'Resolved',
}

const statusColorMap = {
  Unverified: 'text-[#E5534B] bg-[#FDEBE9] border-[#F7C0BC]',
  'Under Review': 'text-[#A45B00] bg-[#FFF6E5] border-[#F9D596]',
  Verified: 'text-[#1F7A48] bg-[#EAF7EF] border-[#BEE8CE]',
  Rejected: 'text-[#6B7280] bg-[#F4F5F7] border-[#D8DEE4]',
  Resolved: 'text-[#0F5E40] bg-[#E7F5EF] border-[#B4DEC8]',
  unverified: 'text-[#E5534B] bg-[#FDEBE9] border-[#F7C0BC]',
  under_review: 'text-[#A45B00] bg-[#FFF6E5] border-[#F9D596]',
  verified: 'text-[#1F7A48] bg-[#EAF7EF] border-[#BEE8CE]',
  rejected: 'text-[#6B7280] bg-[#F4F5F7] border-[#D8DEE4]',
  resolved: 'text-[#0F5E40] bg-[#E7F5EF] border-[#B4DEC8]',
}

const sourceLabelMap = {
  Satellite: 'Satellite',
  'Citizen Report': 'Citizen Report',
  Combined: 'Combined',
  satellite: 'Satellite',
  citizen_report: 'Citizen Report',
}

const sourceColorMap = {
  Satellite: 'bg-[#E6F6FA] text-[#0A7286] border-[#B9E4ED]',
  'Citizen Report': 'bg-[#F5F0FF] text-[#6C2BB8] border-[#DFC8FF]',
  Combined: 'bg-[#FFF2E8] text-[#A04A17] border-[#F4CFB4]',
  satellite: 'bg-[#E6F6FA] text-[#0A7286] border-[#B9E4ED]',
  citizen_report: 'bg-[#F5F0FF] text-[#6C2BB8] border-[#DFC8FF]',
}

const changeTypeLabelMap = {
  'Potential Vegetation Loss': 'Potential Vegetation Loss',
  'Unverified Land-use Change': 'Unverified Land-use Change',
  'Potential Structure Change': 'Potential Structure Change',
  'Citizen Observation': 'Citizen Observation',
  vegetation_loss: 'Potential Vegetation Loss',
  encroachment: 'Unverified Land-use Change',
  structure_built: 'Potential Structure Change',
}

const corroborationLabelMap = {
  'Single-source': 'Single-source',
  'Corroborated (2 reports)': 'Corroborated (2 reports)',
  'Corroborated (1 report + satellite)': 'Corroborated (1 report + satellite)',
  'Tier 3 Fast-track': 'Tier 3 Fast-track',
  single_source: 'Single-source',
  corroborated: 'Corroborated',
  verified_fast_track: 'Verified reporter — fast-tracked',
}

const corroborationColorMap = {
  'Single-source': 'text-[#8A5700] bg-[#FFF5DE] border-[#F4D8A2]',
  'Corroborated (2 reports)': 'text-[#175A38] bg-[#EAF7EF] border-[#BFE5CB]',
  'Corroborated (1 report + satellite)': 'text-[#0E4F75] bg-[#E8F5FC] border-[#BBDFF2]',
  'Tier 3 Fast-track': 'text-[#5F3D05] bg-[#FFF5D6] border-[#F3D590]',
  single_source: 'text-[#8A5700] bg-[#FFF5DE] border-[#F4D8A2]',
  corroborated: 'text-[#175A38] bg-[#EAF7EF] border-[#BFE5CB]',
  verified_fast_track: 'text-[#0E4F75] bg-[#E8F5FC] border-[#BBDFF2]',
}

export function formatStatus(status) {
  return statusLabelMap[status] ?? status
}

export function getStatusColors(status) {
  return statusColorMap[status] ?? statusColorMap.Unverified
}

export function formatSource(source) {
  return sourceLabelMap[source] ?? source
}

export function getSourceColors(source) {
  return sourceColorMap[source] ?? sourceColorMap['Citizen Report']
}

export function formatChangeType(changeType) {
  return changeTypeLabelMap[changeType] ?? 'Potential Land-use Change'
}

export function formatDate(dateString) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function normalizeUnitScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null

  const normalizedValue = value > 1 ? value / 100 : value
  const clampedValue = Math.max(0, Math.min(1, normalizedValue))

  return Number(clampedValue.toFixed(4))
}

export function formatUnitScore(value) {
  const normalizedScore = normalizeUnitScore(value)
  if (typeof normalizedScore !== 'number') return '--'

  return `${normalizedScore.toFixed(2)} / 1.00`
}

export function formatConfidence(value) {
  const normalizedScore = normalizeUnitScore(value)
  if (typeof normalizedScore !== 'number') return '--'

  return `${Math.round(normalizedScore * 100)}%`
}

export function formatFlagCode(flagId) {
  if (!flagId) return 'FLAG-—'
  const number = String(flagId).replace('flag_', '')
  return `FLAG-${number}`
}

export function formatCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return '--'
  return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`
}

export function roleLabel(role) {
  if (role === 'admin') return 'State Administrator'
  if (role === 'district_officer') return 'District Officer'
  if (role === 'gram_sabha') return 'Gram Sabha Officer'
  return role
}

export function formatCorroborationState(corroborationState) {
  return corroborationLabelMap[corroborationState] ?? 'Single-source'
}

export function getCorroborationColors(corroborationState) {
  return corroborationColorMap[corroborationState] ?? corroborationColorMap['Single-source']
}
