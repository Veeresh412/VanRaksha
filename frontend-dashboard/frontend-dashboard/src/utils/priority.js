import { normalizeUnitScore } from './formatters'

const CORROBORATION_SCORE_BY_STATE = {
  'Single-source': 28,
  'Corroborated (2 reports)': 72,
  'Corroborated (1 report + satellite)': 88,
  'Tier 3 Fast-track': 84,
}

const STATUS_BONUS_BY_STATE = {
  Unverified: 12,
  'Under Review': 6,
  Verified: -8,
  Rejected: -22,
  Resolved: -30,
}

export function normalizePriorityScore(score) {
  if (typeof score !== 'number' || Number.isNaN(score)) return 0

  const normalizedScore = score <= 1 ? score * 100 : score
  return Math.max(0, Math.min(100, Math.round(normalizedScore)))
}

function getAgeScore(createdAt) {
  if (!createdAt) return 0

  const createdAtTime = new Date(createdAt).getTime()
  if (Number.isNaN(createdAtTime)) return 0

  const elapsedMs = Date.now() - createdAtTime
  const elapsedHours = Math.max(0, elapsedMs / (1000 * 60 * 60))
  const normalizedAge = Math.min(elapsedHours / 72, 1)

  return Math.round(normalizedAge * 100)
}

function getCorroborationScore(flag) {
  if (flag.corroboration_state && CORROBORATION_SCORE_BY_STATE[flag.corroboration_state]) {
    return CORROBORATION_SCORE_BY_STATE[flag.corroboration_state]
  }

  const corroborationCount = Number(flag.corroboration_count ?? 1)
  if (corroborationCount >= 2) return 72

  return 28
}

export function getPriorityBand(score) {
  const normalizedScore = normalizePriorityScore(score)

  if (normalizedScore >= 75) return 'Critical'
  if (normalizedScore >= 60) return 'High'
  if (normalizedScore >= 40) return 'Medium'
  return 'Low'
}

export function getFlagPriorityScore(flag) {
  const confidence = normalizeUnitScore(flag.satellite_confidence) ?? 0
  const confidenceScore = confidence * 100

  const corroborationScore = getCorroborationScore(flag)
  const ageScore = getAgeScore(flag.created_at)
  const escalationScore = flag.escalated ? 100 : 0
  const statusBonus = STATUS_BONUS_BY_STATE[flag.status] ?? 0

  const rawScore =
    confidenceScore * 0.4 +
    corroborationScore * 0.25 +
    ageScore * 0.25 +
    escalationScore * 0.1 +
    statusBonus

  return normalizePriorityScore(rawScore)
}

export function enrichFlagWithPriority(flag) {
  const priorityScore = getFlagPriorityScore(flag)

  return {
    ...flag,
    priority_score: priorityScore,
    priority_band: getPriorityBand(priorityScore),
  }
}

export function compareFlagsByPriority(flagA, flagB) {
  const scoreDifference =
    normalizePriorityScore(flagB.priority_score) - normalizePriorityScore(flagA.priority_score)
  if (scoreDifference !== 0) return scoreDifference

  const createdAtA = new Date(flagA.created_at ?? 0).getTime()
  const createdAtB = new Date(flagB.created_at ?? 0).getTime()

  return createdAtA - createdAtB
}
