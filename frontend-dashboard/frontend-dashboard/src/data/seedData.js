import rawData from './seed_data.json'
import { getEvidenceImageUrls, getObservationText } from '../utils/reportEvidence'

const statusMap = {
  unverified: 'Unverified',
  under_review: 'Under Review',
  verified: 'Verified',
  rejected: 'Rejected',
  resolved: 'Resolved',
}

const sourceMap = {
  citizen_report: 'Citizen Report',
  satellite: 'Satellite',
  combined: 'Combined',
}

const signalTypeMap = {
  vegetation_loss: 'Potential Vegetation Loss',
  encroachment: 'Unverified Land-use Change',
  structure_built: 'Potential Structure Change',
}

const corroborationMap = {
  single_source: 'Single-source',
  corroborated: 'Corroborated (2 reports)',
  verified_fast_track: 'Tier 3 Fast-track',
}

const defaultSignalType = 'Unverified Land-use Change'

const tierTrustMap = {
  1: 'Anonymous / Basic Citizen',
  2: 'Geo-verified / SMS-verified User',
  3: 'Verified NGO / Forest Official',
}

const observationSamples = [
  'Fresh tree stumps spotted near the stream and tractor movement after dark.',
  'New soil clearing seen beside the forest boundary; fencing poles appeared overnight.',
  'Sounds of cutting machinery heard early morning and canopy patch looks thinner today.',
  'Observed suspicious clearing and fresh vehicle tracks near community forest edge.',
]

function normalizeUnitScore(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null

  const normalizedValue = value > 1 ? value / 100 : value
  const clampedValue = Math.max(0, Math.min(1, normalizedValue))

  return Number(clampedValue.toFixed(4))
}

function toStatus(status) {
  return statusMap[status] ?? status ?? 'Unverified'
}

function toSource(source) {
  return sourceMap[source] ?? source ?? 'Citizen Report'
}

function toSignalType(source, signalType) {
  const normalizedSignalType = signalTypeMap[signalType] ?? signalType

  if (normalizedSignalType) return normalizedSignalType
  if (source === 'Citizen Report') return 'Citizen Observation'
  return defaultSignalType
}

function toCorroborationState(corroborationState) {
  return corroborationMap[corroborationState] ?? corroborationState
}

function getCorroborationCount(corroborationState) {
  if (corroborationState === 'Corroborated (2 reports)') return 2
  if (corroborationState === 'Corroborated (1 report + satellite)') return 2
  return 1
}

function deriveCorroborationState(flag) {
  if (flag.source === 'Combined') return 'Corroborated (1 report + satellite)'
  if (flag.source === 'Citizen Report' && flag.status === 'Verified') return 'Tier 3 Fast-track'
  if (flag.source === 'Citizen Report' && flag.status === 'Under Review') {
    return 'Corroborated (2 reports)'
  }
  return 'Single-source'
}

const normalizedJurisdictions = rawData.jurisdictions.map((jurisdiction) => {
  const jurisdictionId = jurisdiction.jurisdiction_id ?? jurisdiction.id
  const name = jurisdiction.name ?? jurisdiction.gram_sabha ?? `Jurisdiction ${jurisdictionId}`

  const centerLatitude = jurisdiction.latitude ?? jurisdiction.lat ?? null
  const centerLongitude = jurisdiction.longitude ?? jurisdiction.long ?? null

  const minLatitude =
    jurisdiction.min_latitude ??
    (typeof centerLatitude === 'number' ? centerLatitude - 0.05 : null)
  const maxLatitude =
    jurisdiction.max_latitude ??
    (typeof centerLatitude === 'number' ? centerLatitude + 0.05 : null)
  const minLongitude =
    jurisdiction.min_longitude ??
    (typeof centerLongitude === 'number' ? centerLongitude - 0.05 : null)
  const maxLongitude =
    jurisdiction.max_longitude ??
    (typeof centerLongitude === 'number' ? centerLongitude + 0.05 : null)

  return {
    ...jurisdiction,
    jurisdiction_id: jurisdictionId,
    id: jurisdictionId,
    name,
    gram_sabha: jurisdiction.gram_sabha ?? name,
    latitude:
      typeof centerLatitude === 'number'
        ? centerLatitude
        : typeof minLatitude === 'number' && typeof maxLatitude === 'number'
          ? (minLatitude + maxLatitude) / 2
          : null,
    longitude:
      typeof centerLongitude === 'number'
        ? centerLongitude
        : typeof minLongitude === 'number' && typeof maxLongitude === 'number'
          ? (minLongitude + maxLongitude) / 2
          : null,
    min_latitude: minLatitude,
    max_latitude: maxLatitude,
    min_longitude: minLongitude,
    max_longitude: maxLongitude,
  }
})

const jurisdictionsByIdMap = normalizedJurisdictions.reduce((accumulator, jurisdiction) => {
  accumulator[jurisdiction.jurisdiction_id] = jurisdiction
  return accumulator
}, {})

const normalizedFlags = rawData.flags.map((flag, index) => {
  const source = toSource(flag.source)
  const status = toStatus(flag.status)
  const jurisdictionId = flag.jurisdiction_id
  const jurisdiction = jurisdictionsByIdMap[jurisdictionId]
  const corroborationState =
    toCorroborationState(flag.corroboration_state) ??
    deriveCorroborationState({
      source,
      status,
    })

  const latitude = flag.latitude ?? flag.lat ?? jurisdiction?.latitude ?? null
  const longitude = flag.longitude ?? flag.long ?? jurisdiction?.longitude ?? null
  const createdAt = flag.created_at ?? flag.date_detected ?? `2026-08-${String(10 + index).padStart(2, '0')}`
  const satelliteConfidence =
    typeof flag.satellite_confidence === 'number'
      ? flag.satellite_confidence
      : typeof flag.confidence_score === 'number'
        ? flag.confidence_score
        : null

  const signalType = toSignalType(source, flag.signal_type ?? flag.change_type)

  return {
    ...flag,
    flag_id: flag.flag_id ?? `flag_${1000 + index + 1}`,
    latitude,
    longitude,
    signal_type: signalType,
    source,
    status,
    corroboration_state: corroborationState,
    corroboration_count: flag.corroboration_count ?? getCorroborationCount(corroborationState),
    satellite_confidence: satelliteConfidence,
    jurisdiction_id: jurisdictionId,
    district: flag.district ?? jurisdiction?.district ?? null,
    state: flag.state ?? jurisdiction?.state ?? null,
    officer_notes: flag.officer_notes ?? flag.officer_note ?? '',
    created_at: createdAt,
    escalated: Boolean(flag.escalated),
    lat: latitude,
    long: longitude,
    change_type: signalType,
    confidence_score: satelliteConfidence,
    date_detected: createdAt,
    officer_note: flag.officer_note ?? flag.officer_notes ?? '',
  }
})

const flagsById = normalizedFlags.reduce((accumulator, flag) => {
  accumulator[flag.flag_id] = flag
  return accumulator
}, {})

function deriveReportsFromFlags(flags) {
  let reportCounter = 1

  const linkedReports = flags
    .filter((flag) => flag.source === 'Citizen Report' || flag.source === 'Combined')
    .flatMap((flag, flagIndex) => {
      const reportCount = flag.corroboration_state === 'Corroborated (2 reports)' ? 2 : 1

      return Array.from({ length: reportCount }, (_, reportIndex) => {
        const observationText =
          observationSamples[(reportCounter + reportIndex) % observationSamples.length]

        const tier =
          flag.corroboration_state === 'Tier 3 Fast-track'
            ? 3
            : reportIndex === 0
              ? 2
              : 1
        const authenticityScore = Number(
          Math.min(0.98, (flag.satellite_confidence ?? 0.62) + reportIndex * 0.04).toFixed(2),
        )
        const report = {
          report_id: `report_${reportCounter}`,
          photo_url: null,
          evidence_urls: [],
          latitude: flag.latitude,
          longitude: flag.longitude,
          description: observationText,
          observation_text: observationText,
          tier,
          reporter_trust: tierTrustMap[tier],
          status: flag.status,
          authenticity_score: authenticityScore,
          linked_flag_id: flag.flag_id,
          jurisdiction_id: flag.jurisdiction_id,
          created_at: flag.created_at,
          reporter_label: `Reporter ${flagIndex + 1}-${reportIndex + 1}`,
        }

        reportCounter += 1
        return report
      })
    })

  const firstFlag = flags[0]
  const queuedReport = firstFlag
    ? {
        report_id: `report_${reportCounter}`,
        photo_url: null,
        evidence_urls: [],
        latitude: Number((firstFlag.latitude + 0.0012).toFixed(6)),
        longitude: Number((firstFlag.longitude + 0.001).toFixed(6)),
        description: observationSamples[reportCounter % observationSamples.length],
        observation_text: observationSamples[reportCounter % observationSamples.length],
        tier: 1,
        reporter_trust: tierTrustMap[1],
        status: 'Unverified',
        authenticity_score: 0.48,
        linked_flag_id: null,
        jurisdiction_id: firstFlag.jurisdiction_id,
        created_at: firstFlag.created_at,
        reporter_label: 'Queued Reporter',
      }
    : null

  return queuedReport ? [...linkedReports, queuedReport] : linkedReports
}

function normalizeReports(reports = []) {
  if (!reports.length) {
    return deriveReportsFromFlags(normalizedFlags)
  }

  return reports.map((report, index) => {
    const linkedFlagId = report.linked_flag_id ?? report.flag_id ?? null
    const linkedFlag = linkedFlagId ? flagsById[linkedFlagId] : null
    const tier = Number(report.tier ?? 1)
    const authenticityScore = normalizeUnitScore(
      typeof report.authenticity_score === 'number'
        ? report.authenticity_score
        : typeof report.confidence_score === 'number'
          ? report.confidence_score
          : null,
    )

    const observationText = getObservationText(report)
    const evidenceImageUrls = getEvidenceImageUrls(report)

    return {
      ...report,
      report_id: report.report_id ?? `report_${index + 1}`,
      photo_url: report.photo_url ?? evidenceImageUrls[0] ?? null,
      evidence_urls: evidenceImageUrls,
      latitude: report.latitude ?? report.lat ?? linkedFlag?.latitude ?? null,
      longitude: report.longitude ?? report.long ?? linkedFlag?.longitude ?? null,
      description: observationText,
      observation_text: observationText,
      tier,
      reporter_trust: report.reporter_trust ?? tierTrustMap[tier],
      status: toStatus(report.status ?? linkedFlag?.status),
      authenticity_score: authenticityScore,
      linked_flag_id: linkedFlagId,
      jurisdiction_id: report.jurisdiction_id ?? linkedFlag?.jurisdiction_id ?? null,
      created_at: report.created_at ?? report.submitted_at ?? linkedFlag?.created_at ?? null,
      reporter_label: report.reporter_label ?? null,
      flag_id: linkedFlagId,
      submitted_at: report.created_at ?? report.submitted_at ?? linkedFlag?.created_at ?? null,
      confidence_score: authenticityScore,
      lat: report.latitude ?? report.lat ?? linkedFlag?.latitude ?? null,
      long: report.longitude ?? report.long ?? linkedFlag?.longitude ?? null,
    }
  })
}

function deriveSatellitePingsFromFlags(flags) {
  let pingCounter = 1

  const linkedPings = flags
    .filter((flag) => flag.source === 'Satellite' || flag.source === 'Combined')
    .map((flag) => {
      const ping = {
        sat_id: `sat_${pingCounter}`,
        latitude: flag.latitude,
        longitude: flag.longitude,
        confidence_score: flag.satellite_confidence,
        signal_type:
          flag.source === 'Combined' && flag.signal_type === 'Citizen Observation'
            ? defaultSignalType
            : flag.signal_type,
        linked_flag_id: flag.flag_id,
        created_at: flag.created_at,
      }

      pingCounter += 1
      return ping
    })

  const firstFlag = flags.find((flag) => flag.source === 'Satellite') ?? flags[0]
  const queuedPing = firstFlag
    ? {
        sat_id: `sat_${pingCounter}`,
        latitude: Number((firstFlag.latitude - 0.0015).toFixed(6)),
        longitude: Number((firstFlag.longitude - 0.0011).toFixed(6)),
        confidence_score: 0.51,
        signal_type: firstFlag.signal_type === 'Citizen Observation' ? defaultSignalType : firstFlag.signal_type,
        linked_flag_id: null,
        created_at: firstFlag.created_at,
      }
    : null

  return queuedPing ? [...linkedPings, queuedPing] : linkedPings
}

function normalizeSatellitePings(satellitePings = []) {
  if (!satellitePings.length) {
    return deriveSatellitePingsFromFlags(normalizedFlags)
  }

  return satellitePings.map((satellitePing, index) => ({
    ...satellitePing,
    sat_id: satellitePing.sat_id ?? `sat_${index + 1}`,
    latitude: satellitePing.latitude ?? satellitePing.lat ?? null,
    longitude: satellitePing.longitude ?? satellitePing.long ?? null,
    confidence_score: satellitePing.confidence_score ?? null,
    signal_type: toSignalType('Satellite', satellitePing.signal_type),
    linked_flag_id: satellitePing.linked_flag_id ?? null,
    created_at: satellitePing.created_at ?? null,
  }))
}

export const jurisdictions = normalizedJurisdictions

export const jurisdictionsById = jurisdictionsByIdMap

export const flags = normalizedFlags

export const reports = normalizeReports(rawData.reports)

export const satellitePings = normalizeSatellitePings(rawData.satellite_pings)

export const seedData = {
  ...rawData,
  jurisdictions,
  flags,
  reports,
  satellite_pings: satellitePings,
}

export const adminAccounts = rawData.users.admin_accounts
export const gramSabhaAccounts = rawData.users.gram_sabha_accounts
export const citizenReporters = rawData.users.citizen_reporters

export const districtOfficerAccounts = [
  {
    user_id: 'dist_001',
    name: 'Dindori District Officer',
    role: 'district_officer',
    phone: '+91-9800000011',
    district: 'Dindori',
    jurisdiction_ids: ['jur_001'],
    otp_test_code: '123456',
  },
]

export const backtestEvents = rawData.backtest_events

export const demoUsers = [
  ...adminAccounts.map((account) => ({
    ...account,
    role: 'admin',
    access: 'state_wide',
  })),
  ...districtOfficerAccounts.map((account) => ({
    ...account,
    role: 'district_officer',
    access: account.district,
  })),
  ...gramSabhaAccounts.map((account) => ({
    ...account,
    role: 'gram_sabha',
    access: account.jurisdiction_id,
  })),
]

export function getJurisdictionName(jurisdictionId) {
  return jurisdictionsById[jurisdictionId]?.gram_sabha ?? 'Unknown jurisdiction'
}
