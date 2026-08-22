import { createContext, useContext, useMemo, useState } from 'react'
import {
  backtestEvents,
  citizenReporters,
  flags as seedFlags,
  jurisdictions,
  jurisdictionsById,
  seedData,
  demoUsers,
} from '../data/seedData'

const AppDataContext = createContext(null)

function deriveCorroborationState(flag) {
  if (flag.source === 'citizen_report' && flag.status === 'verified') {
    return {
      corroboration_state: 'verified_fast_track',
      corroboration_count: 1,
    }
  }

  if (flag.status === 'under_review' || flag.status === 'verified') {
    return {
      corroboration_state: 'corroborated',
      corroboration_count: Math.max(flag.corroboration_count ?? 2, 2),
    }
  }

  return {
    corroboration_state: 'single_source',
    corroboration_count: 1,
  }
}

function deriveCitizenReports(flags) {
  const citizenFlags = flags.filter((flag) => flag.source === 'citizen_report')

  return citizenFlags.map((flag, index) => {
    const reporter = citizenReporters[index % citizenReporters.length]
    return {
      report_id: `report_${flag.flag_id}`,
      flag_id: flag.flag_id,
      jurisdiction_id: flag.jurisdiction_id,
      reporter_type: reporter.role,
      reporter_label: reporter.name,
      verified: reporter.verified,
      submitted_at: flag.date_detected,
      confidence_score: flag.confidence_score,
      status: flag.status,
      lat: flag.lat,
      long: flag.long,
    }
  })
}

function buildAnalytics(flags) {
  const statusCount = flags.reduce(
    (accumulator, flag) => {
      accumulator[flag.status] += 1
      return accumulator
    },
    {
      unverified: 0,
      under_review: 0,
      verified: 0,
      rejected: 0,
    },
  )

  return {
    jurisdictionsMonitored: new Set(flags.map((flag) => flag.jurisdiction_id)).size,
    totalFlags: flags.length,
    underReview: statusCount.under_review,
    verified: statusCount.verified,
    unverified: statusCount.unverified,
    rejected: statusCount.rejected,
    citizenReports: flags.filter((flag) => flag.source === 'citizen_report').length,
    satelliteSignals: flags.filter((flag) => flag.source === 'satellite').length,
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

export function AppDataProvider({ children }) {
  const [flags, setFlags] = useState(seedFlags)
  const [officers, setOfficers] = useState(createOfficersFromUsers(demoUsers))

  const updateFlagStatus = (flagId, nextStatus) => {
    setFlags((currentFlags) =>
      currentFlags.map((flag) => {
        if (flag.flag_id !== flagId) return flag

        const updatedFlag = {
          ...flag,
          status: nextStatus,
        }

        return {
          ...updatedFlag,
          ...deriveCorroborationState(updatedFlag),
        }
      }),
    )
  }

  const updateOfficerNote = (flagId, note) => {
    setFlags((currentFlags) =>
      currentFlags.map((flag) =>
        flag.flag_id === flagId
          ? {
              ...flag,
              officer_note: note,
            }
          : flag,
      ),
    )
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

  const analytics = useMemo(() => buildAnalytics(flags), [flags])
  const citizenReports = useMemo(() => deriveCitizenReports(flags), [flags])

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

  const value = useMemo(
    () => ({
      rawData: seedData,
      flags,
      jurisdictions,
      jurisdictionsById,
      users: officers,
      citizenReporters,
      citizenReports,
      backtestEvents,
      backtestSummary,
      analytics,
      updateFlagStatus,
      updateOfficerNote,
      escalateFlag,
      addOfficer,
      removeOfficer,
    }),
    [flags, citizenReports, analytics, backtestSummary, officers],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider')
  }

  return context
}
