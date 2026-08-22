import { apiRequest } from './api'

export async function getFlags(flags) {
  return apiRequest(() => flags)
}

export async function updateFlagStatus(flags, flagId, status) {
  return apiRequest(() =>
    flags.map((flag) =>
      flag.flag_id === flagId
        ? {
            ...flag,
            status,
          }
        : flag,
    ),
  )
}

export async function escalateFlag(flags, flagId) {
  return apiRequest(() =>
    flags.map((flag) =>
      flag.flag_id === flagId
        ? {
            ...flag,
            escalated: true,
          }
        : flag,
    ),
  )
}
