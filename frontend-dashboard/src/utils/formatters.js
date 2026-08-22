const statusLabelMap = {
  unverified: 'Unverified',
  under_review: 'Under Review',
  verified: 'Verified',
  rejected: 'Rejected',
}

const statusColorMap = {
  unverified: 'text-[#E5534B] bg-[#FDEBE9] border-[#F7C0BC]',
  under_review: 'text-[#A45B00] bg-[#FFF6E5] border-[#F9D596]',
  verified: 'text-[#1F7A48] bg-[#EAF7EF] border-[#BEE8CE]',
  rejected: 'text-[#6B7280] bg-[#F4F5F7] border-[#D8DEE4]',
}

const sourceLabelMap = {
  satellite: 'Satellite',
  citizen_report: 'Citizen Report',
}

const sourceColorMap = {
  satellite: 'bg-[#E6F6FA] text-[#0A7286] border-[#B9E4ED]',
  citizen_report: 'bg-[#F5F0FF] text-[#6C2BB8] border-[#DFC8FF]',
}

const changeTypeLabelMap = {
  vegetation_loss: 'Potential Vegetation Loss',
  encroachment: 'Unverified Land-use Change',
  structure_built: 'Potential Structure Change',
}

const corroborationLabelMap = {
  single_source: 'Single-source',
  corroborated: 'Corroborated',
  verified_fast_track: 'Verified reporter — fast-tracked',
}

const corroborationColorMap = {
  single_source: 'text-[#8A5700] bg-[#FFF5DE] border-[#F4D8A2]',
  corroborated: 'text-[#175A38] bg-[#EAF7EF] border-[#BFE5CB]',
  verified_fast_track: 'text-[#0E4F75] bg-[#E8F5FC] border-[#BBDFF2]',
}

export function formatStatus(status) {
  return statusLabelMap[status] ?? status
}

export function getStatusColors(status) {
  return statusColorMap[status] ?? statusColorMap.unverified
}

export function formatSource(source) {
  return sourceLabelMap[source] ?? source
}

export function getSourceColors(source) {
  return sourceColorMap[source] ?? sourceColorMap.citizen_report
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

export function formatConfidence(value) {
  if (typeof value !== 'number') return '--'
  return `${Math.round(value * 100)}%`
}

export function formatFlagCode(flagId) {
  const number = flagId.replace('flag_', '')
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
  return corroborationColorMap[corroborationState] ?? corroborationColorMap.single_source
}
