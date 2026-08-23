import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuth } from '../../contexts/AuthContext'
import { useAppData } from '../../contexts/AppDataContext'
import { applyDashboardFilters, applyRoleScope, listUnique } from '../../utils/filters'
import { formatStatus } from '../../utils/formatters'
import { USE_SEED_DATA } from '../../services/config'
import InsightModal from '../common/InsightModal'

const statusOptions = [
  { value: 'all', label: 'Status: All' },
  { value: 'Unverified', label: 'Status: Unverified' },
  { value: 'Under Review', label: 'Status: Under Review' },
  { value: 'Verified', label: 'Status: Verified' },
  { value: 'Rejected', label: 'Status: Rejected' },
  { value: 'Resolved', label: 'Status: Resolved' },
]

function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, logout } = useAuth()
  const {
    flags,
    jurisdictions,
    jurisdictionsById,
    analytics,
    citizenReports,
    isSyncing,
    syncError,
    refreshData,
  } = useAppData()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSidebarUtility, setActiveSidebarUtility] = useState(null)
  const isAdminLike = session.role === 'admin' || session.role === 'district_officer'

  const accessibleJurisdictions = useMemo(() => {
    if (session.role === 'gram_sabha') {
      return jurisdictions.filter((jurisdiction) => jurisdiction.id === session.jurisdiction_id)
    }

    if (session.role === 'district_officer') {
      const scopedJurisdictions = new Set(session.jurisdiction_ids ?? [])
      return jurisdictions.filter((jurisdiction) => {
        const matchDistrict = session.district
          ? jurisdiction.district === session.district
          : true

        const matchScopedJurisdiction =
          scopedJurisdictions.size > 0 ? scopedJurisdictions.has(jurisdiction.id) : true

        return matchDistrict && matchScopedJurisdiction
      })
    }

    return jurisdictions
  }, [jurisdictions, session])

  const [filters, setFilters] = useState(() => ({
    state: 'all',
    district: 'all',
    jurisdiction: isAdminLike ? 'all' : session.jurisdiction_id,
    status: 'all',
    search: '',
  }))

  const effectiveFilters = useMemo(() => {
    if (session.role === 'gram_sabha') {
      return {
        ...filters,
        state: 'all',
        district: 'all',
        jurisdiction: session.jurisdiction_id,
      }
    }

    if (session.role === 'district_officer') {
      return {
        ...filters,
        state: 'all',
        district: session.district ?? 'all',
      }
    }

    return filters
  }, [filters, session])

  const stateOptions = useMemo(
    () => [
      { value: 'all', label: 'State: All' },
      ...listUnique(accessibleJurisdictions.map((jurisdiction) => jurisdiction.state)).map(
        (state) => ({
          value: state,
          label: `State: ${state}`,
        }),
      ),
    ],
    [accessibleJurisdictions],
  )

  const districtOptions = useMemo(() => {
    const filteredByState =
      effectiveFilters.state === 'all'
        ? accessibleJurisdictions
        : accessibleJurisdictions.filter((jurisdiction) => jurisdiction.state === effectiveFilters.state)

    return [
      { value: 'all', label: 'District: All' },
      ...listUnique(filteredByState.map((jurisdiction) => jurisdiction.district)).map(
        (district) => ({
          value: district,
          label: `District: ${district}`,
        }),
      ),
    ]
  }, [accessibleJurisdictions, effectiveFilters.state])

  const jurisdictionOptions = useMemo(() => {
    const filteredJurisdictions = accessibleJurisdictions.filter((jurisdiction) => {
      const matchesState = effectiveFilters.state === 'all' || jurisdiction.state === effectiveFilters.state
      const matchesDistrict =
        effectiveFilters.district === 'all' || jurisdiction.district === effectiveFilters.district
      return matchesState && matchesDistrict
    })

    return [
      {
        value: isAdminLike ? 'all' : session.jurisdiction_id,
        label: isAdminLike ? 'Jurisdiction: All' : 'Jurisdiction: Assigned',
      },
      ...filteredJurisdictions.map((jurisdiction) => ({
        value: jurisdiction.id,
        label: jurisdiction.gram_sabha,
      })),
    ]
  }, [accessibleJurisdictions, effectiveFilters.state, effectiveFilters.district, session, isAdminLike])

  const scopedFlags = useMemo(
    () => applyRoleScope(flags, session, jurisdictionsById),
    [flags, session, jurisdictionsById],
  )

  const scopedCitizenReports = useMemo(() => {
    if (session.role === 'admin') return citizenReports

    if (session.role === 'district_officer') {
      const scopedJurisdictions = new Set(session.jurisdiction_ids ?? [])

      return citizenReports.filter((report) => {
        if (!report.jurisdiction_id) return false

        if (scopedJurisdictions.size > 0) {
          return scopedJurisdictions.has(report.jurisdiction_id)
        }

        const jurisdiction = jurisdictionsById[report.jurisdiction_id]
        return jurisdiction?.district === session.district
      })
    }

    return citizenReports.filter((report) => report.jurisdiction_id === session.jurisdiction_id)
  }, [citizenReports, session, jurisdictionsById])

  const visibleFlags = useMemo(
    () => applyDashboardFilters(scopedFlags, effectiveFilters, jurisdictionsById),
    [scopedFlags, effectiveFilters, jurisdictionsById],
  )

  const notifications = useMemo(
    () =>
      [...scopedFlags]
        .sort(
          (flagA, flagB) =>
            new Date(flagB.created_at).getTime() -
            new Date(flagA.created_at).getTime(),
        )
        .slice(0, 3)
        .map((flag) => ({
          id: `notif-${flag.flag_id}`,
          title: `${flag.flag_id.replace('flag_', 'FLAG-')} • ${formatStatus(flag.status)}`,
          subtitle: `${jurisdictionsById[flag.jurisdiction_id]?.gram_sabha ?? 'Jurisdiction'} • ${flag.created_at}`,
        })),
    [scopedFlags, jurisdictionsById],
  )

  const setFilter = (key, value) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [key]: value,
      ...(key === 'state'
        ? {
            district: 'all',
            jurisdiction: isAdminLike ? 'all' : session.jurisdiction_id,
          }
        : {}),
      ...(key === 'district'
        ? { jurisdiction: isAdminLike ? 'all' : session.jurisdiction_id }
        : {}),
    }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const liveModeEnabled = !USE_SEED_DATA

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#15221c]">
      <Sidebar
        session={session}
        analytics={{
          totalFlags: scopedFlags.length,
          citizenReports: scopedCitizenReports.length,
        }}
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenHelp={() => {
          setActiveSidebarUtility('help')
          setIsSidebarOpen(false)
        }}
        onOpenFeedback={() => {
          setActiveSidebarUtility('feedback')
          setIsSidebarOpen(false)
        }}
      />

      <div className="min-h-screen lg:pl-[236px]">
        <TopBar
          session={session}
          filters={effectiveFilters}
          setFilter={setFilter}
          stateOptions={stateOptions}
          districtOptions={districtOptions}
          jurisdictionOptions={jurisdictionOptions}
          statusOptions={statusOptions}
          notifications={notifications}
          showDistrictFilter={location.pathname !== '/dashboard'}
          showStateFilter={session.role === 'admin'}
          onToggleSidebar={() => setIsSidebarOpen((isOpen) => !isOpen)}
          onLogout={handleLogout}
        />

        <div className="px-3 pt-2 md:px-4 2xl:px-5">
          {syncError ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#f4c3be] bg-[#fef0ee] px-3 py-2 text-xs text-[#bb4b42]">
              <span>{syncError}</span>
              {liveModeEnabled ? (
                <button
                  type="button"
                  onClick={() => void refreshData()}
                  disabled={isSyncing}
                  className="rounded-md border border-[#efb3ae] bg-white px-2.5 py-1 font-semibold text-[#b0463f] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSyncing ? 'Retrying...' : 'Retry Sync'}
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#dce5dc] bg-[#f8fbf8] px-3 py-2 text-xs text-[#5d6e65]">
              <span>
                Mode: <strong>{liveModeEnabled ? 'Live API' : 'Seed Data'}</strong>
                {isSyncing ? ' • Syncing latest records...' : ''}
              </span>
              {liveModeEnabled ? (
                <button
                  type="button"
                  onClick={() => void refreshData()}
                  disabled={isSyncing}
                  className="rounded-md border border-[#d2ddd2] bg-white px-2.5 py-1 font-semibold text-[#2f4f42] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSyncing ? 'Refreshing...' : 'Refresh'}
                </button>
              ) : null}
            </div>
          )}
        </div>

        <main className="p-3 md:p-4 2xl:p-5">
          <Outlet
            context={{
              filters: effectiveFilters,
              setFilter,
              visibleFlags,
              scopedFlags,
              jurisdictionsById,
              jurisdictions: accessibleJurisdictions,
              analytics,
              session,
            }}
          />
        </main>
      </div>

      {activeSidebarUtility === 'help' ? (
        <InsightModal title="Help & Docs" onClose={() => setActiveSidebarUtility(null)}>
          <div className="space-y-4 text-sm text-[#445a51]">
            <div className="vr-card p-4">
              <p className="text-xs uppercase tracking-wide text-[#708078]">Quick Guide</p>
              <ul className="mt-2 space-y-2">
                <li>Use top filters to narrow by state, district, Gram Sabha, and status.</li>
                <li>Click any marker or alert card to open full alert details and actions.</li>
                <li>Use analytics cards to open larger charts for deep review.</li>
              </ul>
            </div>
            <div className="vr-card p-4">
              <p className="text-xs uppercase tracking-wide text-[#708078]">Role Access</p>
              <p className="mt-2">
                Admin users see state-wide dashboards. District officers see district-scoped
                records. Gram Sabha users see jurisdiction-scoped records.
              </p>
            </div>
          </div>
        </InsightModal>
      ) : null}

      {activeSidebarUtility === 'feedback' ? (
        <InsightModal title="Feedback" onClose={() => setActiveSidebarUtility(null)}>
          <div className="space-y-4 text-sm text-[#445a51]">
            <div className="vr-card p-4">
              <p className="text-xs uppercase tracking-wide text-[#708078]">Share Feedback</p>
              <p className="mt-2">
                For demo feedback, capture the page name, flag ID (if any), and expected behavior.
              </p>
            </div>

            <div className="vr-card p-4">
              <label className="text-xs font-semibold uppercase tracking-wide text-[#6a7a72]">
                Notes
              </label>
              <textarea
                readOnly
                value="Demo mode: feedback capture is enabled for presentation flow. API submission will be connected to backend in integration phase."
                className="mt-2 h-28 w-full resize-none rounded-lg border border-[#d7e0d7] bg-[#f8fbf8] p-3 text-sm text-[#4a5c54] outline-none"
              />
            </div>
          </div>
        </InsightModal>
      ) : null}
    </div>
  )
}

export default DashboardLayout
