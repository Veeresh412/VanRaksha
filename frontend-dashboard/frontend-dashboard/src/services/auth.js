import {
  adminAccounts,
  districtOfficerAccounts,
  gramSabhaAccounts,
  jurisdictionsById,
} from '../data/seedData'
import { apiRequest } from './api'

const DEMO_OTP_FALLBACK = '123456'

function normalizeRole(role) {
  if (!role) return 'gram_sabha'

  const normalizedRole = String(role).trim().toLowerCase().replaceAll(' ', '_')

  if (normalizedRole === 'admin' || normalizedRole === 'state_admin' || normalizedRole === 'administrator') {
    return 'admin'
  }

  if (
    normalizedRole === 'district_officer' ||
    normalizedRole === 'district' ||
    normalizedRole === 'district_admin'
  ) {
    return 'district_officer'
  }

  return 'gram_sabha'
}

function roleLabel(role) {
  if (role === 'admin') return 'State Administrator'
  if (role === 'district_officer') return 'District Officer'
  return 'Gram Sabha Officer'
}

function findSeedAccount(phoneNumber, selectedRole) {
  const requestedRole = selectedRole ? normalizeRole(selectedRole) : null

  const admin = adminAccounts.find((account) => account.phone === phoneNumber)
  if (admin) {
    if (requestedRole && requestedRole !== 'admin') return null

    return {
      user_id: admin.user_id,
      name: admin.name,
      role: 'admin',
      jurisdiction_id: null,
      jurisdiction_ids: [],
      district: null,
      phone: admin.phone,
      otp_test_code: admin.otp_test_code ?? DEMO_OTP_FALLBACK,
    }
  }

  const districtOfficer = districtOfficerAccounts.find((account) => account.phone === phoneNumber)
  if (districtOfficer) {
    if (requestedRole && requestedRole !== 'district_officer') return null

    return {
      user_id: districtOfficer.user_id,
      name: districtOfficer.name,
      role: 'district_officer',
      jurisdiction_id: districtOfficer.jurisdiction_ids?.[0] ?? null,
      jurisdiction_ids: districtOfficer.jurisdiction_ids ?? [],
      district: districtOfficer.district ?? null,
      phone: districtOfficer.phone,
      otp_test_code: districtOfficer.otp_test_code ?? DEMO_OTP_FALLBACK,
    }
  }

  const gramSabha = gramSabhaAccounts.find((account) => account.phone === phoneNumber)
  if (!gramSabha) return null

  if (requestedRole && requestedRole !== 'gram_sabha') return null

  return {
    user_id: gramSabha.user_id,
    name: gramSabha.name,
    role: 'gram_sabha',
    jurisdiction_id: gramSabha.jurisdiction_id,
    jurisdiction_ids: [gramSabha.jurisdiction_id],
    district: null,
    phone: gramSabha.phone,
    otp_test_code: gramSabha.otp_test_code ?? DEMO_OTP_FALLBACK,
  }
}

function buildSessionFromSeedAccount(seedAccount) {
  const primaryJurisdictionId = seedAccount.jurisdiction_id ?? seedAccount.jurisdiction_ids?.[0] ?? null
  const jurisdiction = primaryJurisdictionId ? jurisdictionsById[primaryJurisdictionId] : null

  const districtName = seedAccount.district ?? jurisdiction?.district ?? null
  const jurisdictionName =
    seedAccount.role === 'admin'
      ? 'State-wide access'
      : seedAccount.role === 'district_officer'
        ? `${districtName ?? 'Assigned'} District`
        : jurisdiction?.gram_sabha ?? 'Assigned jurisdiction'

  return {
    user_id: seedAccount.user_id,
    name: seedAccount.name,
    role: seedAccount.role,
    jurisdiction_id: primaryJurisdictionId,
    jurisdiction_ids: seedAccount.jurisdiction_ids ?? (primaryJurisdictionId ? [primaryJurisdictionId] : []),
    district: districtName,
    jurisdiction_name: jurisdictionName,
    phone: seedAccount.phone,
    access_token: `seed-token-${seedAccount.user_id}`,
    token_type: 'bearer',
    otp_test_code: seedAccount.otp_test_code ?? DEMO_OTP_FALLBACK,
  }
}

function buildSessionFromSeed(phoneNumber, selectedRole) {
  const seedAccount = findSeedAccount(phoneNumber, selectedRole)
  if (!seedAccount) return null

  return buildSessionFromSeedAccount(seedAccount)
}

function buildFallbackSessionFromPhone(phoneNumber, role) {
  if (!phoneNumber) return null

  const seedAccount = findSeedAccount(phoneNumber, role)
  if (!seedAccount) return null

  return buildSessionFromSeedAccount(seedAccount)
}

function normalizeJurisdictionIds(user, payload, primaryJurisdictionId, fallbackSession) {
  if (Array.isArray(user?.jurisdiction_ids) && user.jurisdiction_ids.length) {
    return user.jurisdiction_ids
  }

  if (Array.isArray(payload?.jurisdiction_ids) && payload.jurisdiction_ids.length) {
    return payload.jurisdiction_ids
  }

  if (Array.isArray(payload?.data?.jurisdiction_ids) && payload.data.jurisdiction_ids.length) {
    return payload.data.jurisdiction_ids
  }

  if (primaryJurisdictionId) {
    return [primaryJurisdictionId]
  }

  if (fallbackSession?.jurisdiction_ids?.length) {
    return fallbackSession.jurisdiction_ids
  }

  return []
}

function normalizeSessionFromApi(payload, { phoneNumber, requestedRole } = {}) {
  const token = payload?.access_token ?? payload?.token ?? payload?.data?.token
  const tokenType = payload?.token_type ?? payload?.data?.token_type ?? 'bearer'
  const user = payload?.user ?? payload?.data?.user ?? {}

  const role = normalizeRole(user.role ?? payload?.role ?? payload?.data?.role ?? requestedRole)

  const fallbackSession = buildFallbackSessionFromPhone(phoneNumber, role)

  const primaryJurisdictionId =
    user.jurisdiction_id ?? payload?.jurisdiction_id ?? payload?.data?.jurisdiction_id ?? null

  const jurisdictionIdsFromApi = normalizeJurisdictionIds(
    user,
    payload,
    primaryJurisdictionId,
    fallbackSession,
  )

  const effectivePrimaryJurisdictionId =
    primaryJurisdictionId ?? jurisdictionIdsFromApi[0] ?? fallbackSession?.jurisdiction_id ?? null

  const jurisdiction =
    effectivePrimaryJurisdictionId ? jurisdictionsById[effectivePrimaryJurisdictionId] : null

  return {
    user_id:
      user.user_id ??
      user.id ??
      user.uuid ??
      payload?.user_id ??
      payload?.data?.user_id ??
      fallbackSession?.user_id ??
      `user_${Date.now()}`,
    name:
      user.name ??
      user.full_name ??
      payload?.name ??
      fallbackSession?.name ??
      `${roleLabel(role)} Account`,
    role,
    jurisdiction_id: effectivePrimaryJurisdictionId,
    jurisdiction_ids: jurisdictionIdsFromApi,
    district:
      user.district ??
      payload?.district ??
      payload?.data?.district ??
      fallbackSession?.district ??
      jurisdiction?.district ??
      null,
    jurisdiction_name:
      user.jurisdiction_name ??
      payload?.jurisdiction_name ??
      payload?.data?.jurisdiction_name ??
      fallbackSession?.jurisdiction_name ??
      jurisdiction?.gram_sabha ??
      (role === 'admin' ? 'State-wide access' : 'Assigned jurisdiction'),
    phone:
      user.phone_number ??
      user.phone ??
      payload?.phone_number ??
      payload?.data?.phone_number ??
      fallbackSession?.phone ??
      phoneNumber ??
      null,
    access_token: token,
    token_type: tokenType,
    expires_at: payload?.expires_at ?? payload?.data?.expires_at ?? null,
  }
}

export async function requestOtpForPhone({ phone, role }) {
  const normalizedPhone = phone.trim()
  const requestedRole = role ? normalizeRole(role) : null

  if (!normalizedPhone) {
    return {
      success: false,
      error: 'Phone number is required.',
    }
  }

  try {
    const payload = await apiRequest({
      path: '/auth/request-otp',
      method: 'POST',
      body: {
        phone_number: normalizedPhone,
      },
      seedHandler: () => {
        const session = buildSessionFromSeed(normalizedPhone, requestedRole)

        if (!session) {
          return {
            success: false,
            error: 'Phone number is not authorized for the selected profile.',
          }
        }

        return {
          success: true,
          message: 'OTP sent successfully.',
          dev_otp: session.otp_test_code,
        }
      },
    })

    if (payload?.success === false) {
      return {
        success: false,
        error: payload.error ?? 'Unable to send OTP for this phone number.',
      }
    }

    return {
      success: true,
      message: payload?.message ?? 'OTP sent successfully.',
      devOtp: payload?.dev_otp ?? null,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message ?? 'Unable to send OTP right now. Please try again.',
    }
  }
}

export async function verifyOtpForPhone({ phone, otp, role }) {
  const normalizedPhone = phone.trim()
  const normalizedOtp = otp.trim()
  const requestedRole = role ? normalizeRole(role) : null

  if (!normalizedPhone) {
    return {
      success: false,
      error: 'Phone number is required.',
    }
  }

  if (!normalizedOtp) {
    return {
      success: false,
      error: 'OTP is required.',
    }
  }

  try {
    const payload = await apiRequest({
      path: '/auth/verify-otp',
      method: 'POST',
      body: {
        phone_number: normalizedPhone,
        otp: normalizedOtp,
      },
      seedHandler: () => {
        const session = buildSessionFromSeed(normalizedPhone, requestedRole)

        if (!session) {
          return {
            success: false,
            error: 'Phone number is not authorized for the selected profile.',
          }
        }

        if (normalizedOtp !== session.otp_test_code) {
          return {
            success: false,
            error: 'Invalid OTP. Please try again.',
          }
        }

        return {
          success: true,
          token: session.access_token,
          role: session.role,
          jurisdiction_id: session.jurisdiction_id,
          jurisdiction_ids: session.jurisdiction_ids,
          phone_number: session.phone,
          user: {
            user_id: session.user_id,
            name: session.name,
            role: session.role,
            jurisdiction_id: session.jurisdiction_id,
            jurisdiction_ids: session.jurisdiction_ids,
            district: session.district,
            phone_number: session.phone,
          },
        }
      },
    })

    if (payload?.success === false) {
      return {
        success: false,
        error: payload.error ?? 'OTP verification failed. Please try again.',
      }
    }

    const session = normalizeSessionFromApi(payload, {
      phoneNumber: normalizedPhone,
      requestedRole,
    })

    if (!session.access_token) {
      return {
        success: false,
        error: 'OTP verified but token is missing in response.',
      }
    }

    if (requestedRole && session.role !== requestedRole) {
      return {
        success: false,
        error: `Selected profile does not match this account. Please choose ${roleLabel(session.role)}.`,
      }
    }

    return {
      success: true,
      session,
    }
  } catch (error) {
    return {
      success: false,
      error: error.message ?? 'Unable to verify OTP right now. Please try again.',
    }
  }
}

export async function loginWithPhone({ phone, role, otp }) {
  return verifyOtpForPhone({ phone, role, otp: otp ?? '' })
}
