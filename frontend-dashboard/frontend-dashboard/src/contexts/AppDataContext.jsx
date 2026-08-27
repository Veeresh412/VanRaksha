import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  backtestEvents,
  citizenReporters,
  flags as seedFlags,
  reports as seedReports,
  satellitePings,
  jurisdictions,
  jurisdictionsById,
  seedData,
  demoUsers,
} from '../data/seedData'
import { useAuth } from './AuthContext'
import { USE_SEED_DATA } from '../services/config'
import { getFlags, patchFlag } from '../services/flags'
import { getCitizenReports } from '../services/reports'
import { clearTestData } from '../services/testing'
import { normalizeUnitScore } from '../utils/formatters'

const AppDataContext = createContext(null)

const statusMap = {
  unverified: 'Unverified',
  under_review: 'Under Review',
  verified: 'Verified',
  rejected: 'Rejected',
  resolved: 'Resolved',
}

const sourceMap = {
  satellite: 'Satellite',
  citizen_report: 'Citizen Report',
  combined: 'Combined',
}

const signalTypeMap = {
  vegetation_loss: 'Potential Vegetation Loss',
  encroachment: 'Unverified Land-use Change',
  structure_built: 'Potential Structure Change',
}

const corroborationStateMap = {
  single_source: 'Single-source',
  corroborated: 'Corroborated (2 reports)',
  verified_fast_track: 'Tier 3 Fast-track',
}

const reporterTrustByTier = {
  1: 'Anonymous / Basic Citizen',
  2: 'Geo-verified / SMS-verified User',
  3: 'Verified NGO / Forest Official',
}

function toCanonicalStatus(status) {
  return statusMap[String(status ?? '').toLowerCase().replaceAll(' ', '_')] ?? status ?? 'Unverified'
}

function toCanonicalSource(source) {
  return sourceMap[String(source ?? '').toLowerCase().replaceAll(' ', '_')] ?? source ?? 'Citizen Report'
}

function toCanonicalSignalType(source, signalType) {
  const normalizedSignalType =
    signalTypeMap[String(signalType ?? '').toLowerCase().replaceAll(' ', '_')] ?? signalType

  if (normalizedSignalType) return normalizedSignalType
  if (source === 'Citizen Report') return 'Citizen Observation'
  return 'Unverified Land-use Change'
}

function toCanonicalCorroborationState(corroborationState) {
  return (
    corroborationStateMap[String(corroborationState ?? '').toLowerCase().replaceAll(' ', '_')] ??
    corroborationState ??
    null
  )
}

function inferCorroborationState(flag) {
  if (flag.source === 'Combined') return 'Corroborated (1 report + satellite)'
  if (flag.source === 'Citizen Report' && flag.status === 'Verified') return 'Tier 3 Fast-track'
  if (flag.source === 'Citizen Report' && flag.status === 'Under Review') return 'Corroborated (2 reports)'
  return 'Single-source'
}

function inferCorroborationCount(corroborationState) {
  if (
    corroborationState === 'Corroborated (2 reports)' ||
    corroborationState === 'Corroborated (1 report + satellite)'
  ) {
    return 2
  }

  return 1
}

function normalizeFlagRecord(flag, jurisdictionLookup) {
  const source = toCanonicalSource(flag.source)
  const status = toCanonicalStatus(flag.status)
  const jurisdictionId = flag.jurisdiction_id ?? flag.jurisdictionId ?? null
  const jurisdiction = jurisdictionId ? jurisdictionLookup[jurisdictionId] : null

  const latitude = flag.latitude ?? flag.lat ?? jurisdiction?.latitude ?? null
  const longitude = flag.longitude ?? flag.long ?? jurisdiction?.longitude ?? null

  const signalType = toCanonicalSignalType(source, flag.signal_type ?? flag.change_type)
  const createdAt = flag.created_at ?? flag.date_detected ?? null
  const corroborationState =
    toCanonicalCorroborationState(flag.corroboration_state) ??
    inferCorroborationState({
      source,
      status,
    })

  const satelliteConfidence =
    typeof flag.satellite_confidence === 'number'
      ? flag.satellite_confidence
      : typeof flag.confidence_score === 'number'
        ? flag.confidence_score
        : null

  const officerNotes = flag.officer_notes ?? flag.officer_note ?? ''

  return {
    ...flag,
    flag_id: flag.flag_id,
    latitude,
    longitude,
    signal_type: signalType,
    source,
    status,
    jurisdiction_id: jurisdictionId,
    district: flag.district ?? jurisdiction?.district ?? null,
    state: flag.state ?? jurisdiction?.state ?? null,
    satellite_confidence: satelliteConfidence,
    corroboration_state: corroborationState,
    corroboration_count: flag.corroboration_count ?? inferCorroborationCount(corroborationState),
    officer_notes: officerNotes,
    created_at: createdAt,
    lat: latitude,
    long: longitude,
    change_type: signalType,
    confidence_score: satelliteConfidence,
    date_detected: createdAt,
    officer_note: officerNotes,
    escalated: Boolean(flag.escalated),
  }
}

function normalizeReportRecord(report, flagsById) {
  const linkedFlagId = report.linked_flag_id ?? report.flag_id ?? null
  const linkedFlag = linkedFlagId ? flagsById[linkedFlagId] : null

  const tier = Number(report.tier ?? 1)
  const status = toCanonicalStatus(report.status ?? linkedFlag?.status)

  const latitude = report.latitude ?? report.lat ?? linkedFlag?.latitude ?? null
  const longitude = report.longitude ?? report.long ?? linkedFlag?.longitude ?? null
  const createdAt = report.created_at ?? report.submitted_at ?? linkedFlag?.created_at ?? null

  const authenticityScore =
    normalizeUnitScore(
      typeof report.authenticity_score === 'number'
        ? report.authenticity_score
        : typeof report.confidence_score === 'number'
          ? report.confidence_score
          : null,
    )

  return {
    ...report,
    report_id: report.report_id,
    photo_url: report.photo_url ?? null,
    latitude,
    longitude,
    description: report.description ?? 'Citizen-submitted report',
    tier,
    reporter_trust: report.reporter_trust ?? reporterTrustByTier[tier] ?? reporterTrustByTier[1],
    status,
    authenticity_score: authenticityScore,
    linked_flag_id: linkedFlagId,
    jurisdiction_id: report.jurisdiction_id ?? linkedFlag?.jurisdiction_id ?? null,
    created_at: createdAt,
    flag_id: linkedFlagId,
    submitted_at: createdAt,
    confidence_score: authenticityScore,
    lat: latitude,
    long: longitude,
  }
}

function deriveCorroborationState(flag) {
  if (flag.source === 'Combined') {
    return {
      corroboration_state: 'Corroborated (1 report + satellite)',
      corroboration_count: 2,
    }
  }

  if (flag.source === 'Citizen Report' && flag.status === 'Verified') {
    return {
      corroboration_state: 'Tier 3 Fast-track',
      corroboration_count: 1,
    }
  }

  if (flag.source === 'Citizen Report' && flag.status === 'Under Review') {
    return {
      corroboration_state: 'Corroborated (2 reports)',
      corroboration_count: 2,
    }
  }

  return {
    corroboration_state: 'Single-source',
    corroboration_count: 1,
  }
}

function buildAnalytics(flags, reports, inferredPingCount) {
  const statusCount = flags.reduce(
    (accumulator, flag) => {
      if (typeof accumulator[flag.status] !== 'number') {
        accumulator[flag.status] = 0
      }

      accumulator[flag.status] += 1
      return accumulator
    },
    {
      Unverified: 0,
      'Under Review': 0,
      Verified: 0,
      Rejected: 0,
      Resolved: 0,
    },
  )

  return {
    jurisdictionsMonitored: new Set(flags.map((flag) => flag.jurisdiction_id)).size,
    totalFlags: flags.length,
    underReview: statusCount['Under Review'],
    verified: statusCount.Verified,
    unverified: statusCount.Unverified,
    rejected: statusCount.Rejected,
    resolved: statusCount.Resolved,
    citizenReports: reports.length,
    satelliteSignals: inferredPingCount,
  }
}

function createOfficersFromUsers(users) {
  return users.map((user) => ({
    officer_id: `officer_${user.user_id}`,
    user_id: user.user_id,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    jurisdiction_id: user.jurisdiction_id ?? null,
    jurisdiction_ids: user.jurisdiction_ids ?? [],
    district: user.district ?? null,
  }))
}

function buildFlagsLookup(flags) {
  return flags.reduce((accumulator, flag) => {
    accumulator[flag.flag_id] = flag
    return accumulator
  }, {})
}

function extractRecord(payload) {
  if (!payload || typeof payload !== 'object') return null
  if (payload.data && typeof payload.data === 'object') return payload.data
  if (payload.flag && typeof payload.flag === 'object') return payload.flag
  return payload
}

export function AppDataProvider({ children }) {
  const { session, isAuthenticated } = useAuth()
  const accessToken = session?.access_token ?? null

  const [flags, setFlags] = useState(seedFlags)
  const [reports, setReports] = useState(seedReports)
  const [officers, setOfficers] = useState(createOfficersFromUsers(demoUsers))
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const hydrateFromApi = useCallback(async () => {
    if (USE_SEED_DATA || !accessToken) return

    setIsSyncing(true)

    try {
      const [flagRecords, reportRecords] = await Promise.all([
        getFlags({
          token: accessToken,
          page: 1,
          limit: 500,
        }),
        getCitizenReports({
          token: accessToken,
          page: 1,
          limit: 500,
        }),
      ])

      const normalizedFlags = flagRecords.map((flag) => normalizeFlagRecord(flag, jurisdictionsById))
      const flagsById = buildFlagsLookup(normalizedFlags)
      const normalizedReports = reportRecords.map((report) => normalizeReportRecord(report, flagsById))

      setFlags(normalizedFlags)
      setReports(normalizedReports)
      setSyncError('')
    } catch (error) {
      setSyncError(error.message ?? 'Failed to load live data. Showing latest cached records.')
    } finally {
      setIsSyncing(false)
    }
  }, [accessToken])

  useEffect(() => {
    if (!isAuthenticated || USE_SEED_DATA || !accessToken) return

    void hydrateFromApi()
  }, [isAuthenticated, accessToken, hydrateFromApi])

  const activeFlags = isAuthenticated ? flags : seedFlags
  const activeReports = isAuthenticated ? reports : seedReports
  const effectiveSyncError = isAuthenticated ? syncError : ''
  const effectiveIsSyncing = isAuthenticated ? isSyncing : false

  const updateFlagStatus = async (flagId, nextStatus) => {
    const normalizedStatus = toCanonicalStatus(nextStatus)

    if (USE_SEED_DATA || !accessToken) {
      setFlags((currentFlags) =>
        currentFlags.map((flag) => {
          if (flag.flag_id !== flagId) return flag

          const updatedFlag = {
            ...flag,
            status: normalizedStatus,
          }

          return {
            ...updatedFlag,
            ...deriveCorroborationState(updatedFlag),
          }
        }),
      )

      return
    }

    try {
      const payload = await patchFlag({
        token: accessToken,
        flagId,
        status: normalizedStatus,
      })

      const patchedRecord = extractRecord(payload)

      setFlags((currentFlags) =>
        currentFlags.map((flag) => {
          if (flag.flag_id !== flagId) return flag

          if (!patchedRecord || typeof patchedRecord !== 'object') {
            const updatedFlag = {
              ...flag,
              status: normalizedStatus,
            }

            return {
              ...updatedFlag,
              ...deriveCorroborationState(updatedFlag),
            }
          }

          return normalizeFlagRecord(
            {
              ...flag,
              ...patchedRecord,
            },
            jurisdictionsById,
          )
        }),
      )

      setSyncError('')
    } catch (error) {
      setSyncError(error.message ?? 'Failed to update flag status.')
    }
  }

  const updateOfficerNote = async (flagId, note) => {
    if (USE_SEED_DATA || !accessToken) {
      setFlags((currentFlags) =>
        currentFlags.map((flag) =>
          flag.flag_id === flagId
            ? {
                ...flag,
                officer_notes: note,
                officer_note: note,
              }
            : flag,
        ),
      )

      return
    }

    const existingFlag = flags.find((flag) => flag.flag_id === flagId)

    if (!existingFlag) return

    try {
      const payload = await patchFlag({
        token: accessToken,
        flagId,
        status: existingFlag.status,
        officerNotes: note,
      })

      const patchedRecord = extractRecord(payload)

      setFlags((currentFlags) =>
        currentFlags.map((flag) =>
          flag.flag_id === flagId
            ? normalizeFlagRecord(
                {
                  ...flag,
                  ...(patchedRecord && typeof patchedRecord === 'object' ? patchedRecord : {}),
                  officer_notes: note,
                },
                jurisdictionsById,
              )
            : flag,
        ),
      )

      setSyncError('')
    } catch (error) {
      setSyncError(error.message ?? 'Failed to save officer note.')
    }
  }

  const escalateFlag = (flagId) => {
    setFlags((currentFlags) =>
      currentFlags.map((flag) =>
        flag.flag_id === flagId
          ? {
              ...flag,
              escalated: true,
            }
          : flag,
      ),
    )
  }

  const addOfficer = ({ name, phone_number, jurisdiction_id, role }) => {
    const officerId = `officer_custom_${Date.now()}`

    setOfficers((currentOfficers) => [
      ...currentOfficers,
      {
        officer_id: officerId,
        user_id: officerId,
        name,
        role,
        phone: phone_number,
        jurisdiction_id,
        jurisdiction_ids: jurisdiction_id ? [jurisdiction_id] : [],
        district: jurisdiction_id ? jurisdictionsById[jurisdiction_id]?.district ?? null : null,
      },
    ])
  }

  const removeOfficer = (officerId) => {
    setOfficers((currentOfficers) =>
      currentOfficers.filter((officer) => officer.officer_id !== officerId),
    )
  }

  const clearAllData = async () => {
    if (USE_SEED_DATA || !accessToken) {
      setFlags([])
      setReports([])
      setSyncError('')
      return {
        success: true,
      }
    }

    try {
      await clearTestData({ token: accessToken })
      await hydrateFromApi()
      setSyncError('')
      return {
        success: true,
      }
    } catch (error) {
      const message = error.message ?? 'Failed to clear test data.'
      setSyncError(message)
      return {
        success: false,
        error: message,
      }
    }
  }

  const inferredPingCount = USE_SEED_DATA
    ? satellitePings.length
    : activeFlags.filter((flag) => flag.source === 'Satellite' || flag.source === 'Combined').length

  const analytics = useMemo(
    () => buildAnalytics(activeFlags, activeReports, inferredPingCount),
    [activeFlags, activeReports, inferredPingCount],
  )

  const citizenReports = useMemo(() => activeReports, [activeReports])

  const backtestSummary = useMemo(() => {
    const total = backtestEvents.length
    let truePositives = 0
    let trueNegatives = 0
    let falsePositives = 0
    let falseNegatives = 0

    backtestEvents.forEach((event) => {
      const positiveGroundTruth = event.ground_truth !== 'no_encroachment'
      const flagged = event.model_flagged

      if (positiveGroundTruth && flagged) truePositives += 1
      if (!positiveGroundTruth && !flagged) trueNegatives += 1
      if (!positiveGroundTruth && flagged) falsePositives += 1
      if (positiveGroundTruth && !flagged) falseNegatives += 1
    })

    return {
      total,
      truePositives,
      trueNegatives,
      falsePositives,
      falseNegatives,
    }
  }, [])

  const value = {
    rawData: seedData,
    flags: activeFlags,
    jurisdictions,
    jurisdictionsById,
    users: officers,
    citizenReporters,
    citizenReports,
    satellitePings,
    backtestEvents,
    backtestSummary,
    analytics,
    isSyncing: effectiveIsSyncing,
    syncError: effectiveSyncError,
    refreshData: hydrateFromApi,
    updateFlagStatus,
    updateOfficerNote,
    escalateFlag,
    addOfficer,
    removeOfficer,
    clearAllData,
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider')
  }

  return context
}
