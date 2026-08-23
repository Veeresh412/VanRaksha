export function applyRoleScope(flags, session, jurisdictionsById) {
  if (!session) return []

  if (session.role === 'gram_sabha') {
    return flags.filter(
      (flag) =>
        flag.jurisdiction_id === session.jurisdiction_id &&
        flag.corroboration_state !== 'Single-source',
    )
  }

  if (session.role === 'district_officer') {
    const allowedJurisdictions = new Set(session.jurisdiction_ids ?? [])

    return flags.filter((flag) => {
      const jurisdiction = jurisdictionsById[flag.jurisdiction_id]

      const matchDistrict =
        session.district && jurisdiction
          ? jurisdiction.district === session.district
          : true

      const matchJurisdictionSet =
        allowedJurisdictions.size > 0
          ? allowedJurisdictions.has(flag.jurisdiction_id)
          : true

      return (
        matchDistrict &&
        matchJurisdictionSet &&
        flag.corroboration_state !== 'Single-source'
      )
    })
  }

  return flags
}

export function applyDashboardFilters(flags, filters, jurisdictionsById) {
  return flags.filter((flag) => {
    const jurisdiction = jurisdictionsById[flag.jurisdiction_id]

    const matchState =
      !filters.state ||
      filters.state === 'all' ||
      jurisdiction?.state === filters.state

    const matchDistrict =
      !filters.district ||
      filters.district === 'all' ||
      jurisdiction?.district === filters.district

    const matchJurisdiction =
      !filters.jurisdiction ||
      filters.jurisdiction === 'all' ||
      flag.jurisdiction_id === filters.jurisdiction

    const matchStatus =
      !filters.status ||
      filters.status === 'all' ||
      flag.status === filters.status

    const search = (filters.search || '').trim().toLowerCase()
    const matchSearch =
      !search ||
      flag.flag_id.toLowerCase().includes(search) ||
      jurisdiction?.gram_sabha.toLowerCase().includes(search) ||
      jurisdiction?.district.toLowerCase().includes(search)

    return (
      matchState &&
      matchDistrict &&
      matchJurisdiction &&
      matchStatus &&
      matchSearch
    )
  })
}

export function listUnique(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b))
}
