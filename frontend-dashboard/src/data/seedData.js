import rawData from './seed_data.json'

export const seedData = rawData

export const jurisdictions = rawData.jurisdictions.map((jurisdiction) => ({
  ...jurisdiction,
  latitude: jurisdiction.lat,
  longitude: jurisdiction.long,
}))

export const jurisdictionsById = jurisdictions.reduce((accumulator, jurisdiction) => {
  accumulator[jurisdiction.id] = jurisdiction
  return accumulator
}, {})

function deriveCorroborationFromSeed(flag) {
  if (flag.source === 'citizen_report' && flag.status === 'verified') {
    return {
      corroboration_state: 'verified_fast_track',
      corroboration_count: 1,
    }
  }

  if (flag.status === 'under_review' || flag.status === 'verified') {
    return {
      corroboration_state: 'corroborated',
      corroboration_count: 2,
    }
  }

  return {
    corroboration_state: 'single_source',
    corroboration_count: 1,
  }
}

export const flags = rawData.flags.map((flag) => ({
  ...flag,
  escalated: false,
  officer_note: '',
  ...deriveCorroborationFromSeed(flag),
}))

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
