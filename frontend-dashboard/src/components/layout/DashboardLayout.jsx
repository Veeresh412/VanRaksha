import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuth } from '../../contexts/AuthContext'
import { useAppData } from '../../contexts/AppDataContext'
import { applyDashboardFilters, applyRoleScope, listUnique } from '../../utils/filters'
import InsightModal from '../common/InsightModal'

const statusOptions = [
  { value: 'all', label: 'Status: All' },
  { value: 'unverified', label: 'Status: Unverified' },
  { value: 'under_review', label: 'Status: Under Review' },
  { value: 'verified', label: 'Status: Verified' },
  { value: 'rejected', label: 'Status: Rejected' },
]

function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, logout } = useAuth()
  const { flags, jurisdictions, jurisdictionsById, analytics } = useAppData()
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

  useEffect(() => {
    if (!isAdminLike) {
      setFilters((currentFilters) => ({
        ...currentFilters,
        state: 'all',
        district: 'all',
        jurisdiction: session.jurisdiction_id,
      }))
      return
    }

    if (session.role === 'district_officer') {
      setFilters((currentFilters) => ({
        ...currentFilters,
        state: 'all',
        district: session.district ?? 'all',
        jurisdiction: 'all',
      }))
    }
  }, [session, isAdminLike])

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
      filters.state === 'all'
        ? accessibleJurisdictions
        : accessibleJurisdictions.filter((jurisdiction) => jurisdiction.state === filters.state)

    return [
      { value: 'all', label: 'District: All' },
      ...listUnique(filteredByState.map((jurisdiction) => jurisdiction.district)).map(
        (district) => ({
          value: district,
          label: `District: ${district}`,
        }),
      ),
    ]
  }, [accessibleJurisdictions, filters.state])

  const jurisdictionOptions = useMemo(() => {
    const filteredJurisdictions = accessibleJurisdictions.filter((jurisdiction) => {
      const matchesState = filters.state === 'all' || jurisdiction.state === filters.state
      const matchesDistrict =
        filters.district === 'all' || jurisdiction.district === filters.district
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
  }, [accessibleJurisdictions, filters.state, filters.district, session, isAdminLike])

  const scopedFlags = useMemo(
    () => applyRoleScope(flags, session, jurisdictionsById),
    [flags, session, jurisdictionsById],
  )
  const visibleFlags = useMemo(
    () => applyDashboardFilters(scopedFlags, filters, jurisdictionsById),
    [scopedFlags, filters, jurisdictionsById],
  )

  const notifications = useMemo(
    () =>
      [...scopedFlags]
        .sort(
          (flagA, flagB) =>
            new Date(flagB.date_detected).getTime() -
            new Date(flagA.date_detected).getTime(),
        )
        .slice(0, 3)
        .map((flag) => ({
          id: `notif-${flag.flag_id}`,
          title: `${flag.flag_id.replace('flag_', 'FLAG-')} • ${flag.status.replace('_', ' ')}`,
          subtitle: `${jurisdictionsById[flag.jurisdiction_id]?.gram_sabha ?? 'Jurisdiction'} • ${flag.date_detected}`,
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

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-[#f7f8f4] text-[#15221c]">
      <Sidebar
        session={session}
        analytics={{
          totalFlags: scopedFlags.length,
          citizenReports: scopedFlags.filter((flag) => flag.source === 'citizen_report').length,
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
          filters={filters}
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

        <main className="p-3 md:p-4 2xl:p-5">
          <Outlet
            context={{
              filters,
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
