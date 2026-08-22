import {
  adminAccounts,
  districtOfficerAccounts,
  gramSabhaAccounts,
  jurisdictionsById,
} from '../data/seedData'
import { apiRequest } from './api'

function resolveUserByPhoneAndRole(phoneNumber, selectedRole) {
  if (selectedRole === 'admin') {
    const admin = adminAccounts.find((account) => account.phone === phoneNumber)
    return admin
      ? {
          account: admin,
          role: 'admin',
        }
      : null
  }

  if (selectedRole === 'district_officer') {
    const districtOfficer = districtOfficerAccounts.find(
      (account) => account.phone === phoneNumber,
    )

    return districtOfficer
      ? {
          account: districtOfficer,
          role: 'district_officer',
        }
      : null
  }

  if (selectedRole === 'gram_sabha') {
    const gramSabha = gramSabhaAccounts.find((account) => account.phone === phoneNumber)

    return gramSabha
      ? {
          account: gramSabha,
          role: 'gram_sabha',
        }
      : null
  }

  return null
}

export async function requestOtp({ phone, role }) {
  return apiRequest(() => {
    const normalizedPhone = phone.trim()
    const user = resolveUserByPhoneAndRole(normalizedPhone, role)

    if (!user) {
      return {
        success: false,
        error: 'Phone number does not match the selected profile type.',
      }
    }

    return {
      success: true,
      message: 'OTP sent successfully for demo verification.',
    }
  })
}

export async function verifyOtp({ phone, otp, role }) {
  return apiRequest(() => {
    const normalizedPhone = phone.trim()
    const normalizedOtp = otp.trim()

    const user = resolveUserByPhoneAndRole(normalizedPhone, role)

    if (!user) {
      return {
        success: false,
        error: 'Phone number does not match the selected profile type.',
      }
    }

    if (normalizedOtp !== '123456') {
      return {
        success: false,
        error: 'Invalid OTP. Please try again.',
      }
    }

    if (user.role === 'admin') {
      return {
        success: true,
        session: {
          user_id: user.account.user_id,
          name: user.account.name,
          role: 'admin',
          jurisdiction_id: null,
          jurisdiction_ids: [],
          district: null,
          jurisdiction_name: 'State-wide access',
          phone: user.account.phone,
        },
      }
    }

    if (user.role === 'district_officer') {
      return {
        success: true,
        session: {
          user_id: user.account.user_id,
          name: user.account.name,
          role: 'district_officer',
          jurisdiction_id: null,
          jurisdiction_ids: user.account.jurisdiction_ids,
          district: user.account.district,
          jurisdiction_name: `${user.account.district} District`,
          phone: user.account.phone,
        },
      }
    }

    const jurisdiction = jurisdictionsById[user.account.jurisdiction_id]
    return {
      success: true,
      session: {
        user_id: user.account.user_id,
        name: user.account.name,
        role: 'gram_sabha',
        jurisdiction_id: user.account.jurisdiction_id,
        jurisdiction_ids: [user.account.jurisdiction_id],
        district: jurisdiction?.district ?? null,
        jurisdiction_name: jurisdiction?.gram_sabha ?? 'Assigned jurisdiction',
        phone: user.account.phone,
      },
    }
  })
}
