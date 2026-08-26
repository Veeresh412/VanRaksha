import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  ClipboardList,
  Home,
  Leaf,
  MapPinned,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { roleLabel } from '../../utils/formatters'
import { useAppLanguage } from '../../hooks/useAppLanguage'

function Sidebar({ session, analytics, open, onClose, onOpenHelp, onOpenFeedback }) {
  const { t } = useAppLanguage()

  const adminNav = [
    { label: t('sidebar.dashboard'), path: '/dashboard', icon: Home },
    { label: t('sidebar.jurisdictions'), path: '/jurisdictions', icon: MapPinned },
    {
      label: t('sidebar.alertFlags'),
      path: '/alerts',
      icon: AlertTriangle,
      badge: analytics.totalFlags,
    },
    {
      label: t('sidebar.satelliteDetection'),
      path: '/satellite-detection',
      icon: BarChart3,
      badge: analytics.satelliteSignals,
    },
    {
      label: t('sidebar.citizenReports'),
      path: '/reports',
      icon: ClipboardList,
      badge: analytics.citizenReports,
    },
    { label: t('sidebar.accuracyTrend'), path: '/backtesting', icon: BarChart3 },
    { label: t('sidebar.adminSettings'), path: '/settings', icon: Settings },
    { label: t('sidebar.usersRoles'), path: '/users', icon: Users },
  ]

  const gramNav = [
    { label: t('sidebar.dashboard'), path: '/dashboard', icon: Home },
    { label: t('sidebar.myJurisdiction'), path: '/jurisdictions', icon: MapPinned },
    {
      label: t('sidebar.alertFlags'),
      path: '/alerts',
      icon: AlertTriangle,
      badge: analytics.totalFlags,
    },
    {
      label: t('sidebar.satelliteDetection'),
      path: '/satellite-detection',
      icon: BarChart3,
      badge: analytics.satelliteSignals,
    },
    {
      label: t('sidebar.citizenReports'),
      path: '/reports',
      icon: ClipboardList,
      badge: analytics.citizenReports,
    },
  ]

  const districtNav = [
    { label: t('sidebar.dashboard'), path: '/dashboard', icon: Home },
    { label: t('sidebar.jurisdictions'), path: '/jurisdictions', icon: MapPinned },
    {
      label: t('sidebar.alertFlags'),
      path: '/alerts',
      icon: AlertTriangle,
      badge: analytics.totalFlags,
    },
    {
      label: t('sidebar.satelliteDetection'),
      path: '/satellite-detection',
      icon: BarChart3,
      badge: analytics.satelliteSignals,
    },
    {
      label: t('sidebar.citizenReports'),
      path: '/reports',
      icon: ClipboardList,
      badge: analytics.citizenReports,
    },
    { label: t('sidebar.accuracyTrend'), path: '/backtesting', icon: BarChart3 },
  ]

  const navItems =
    session.role === 'admin'
      ? adminNav
      : session.role === 'district_officer'
        ? districtNav
        : gramNav

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[1240] bg-[#00140c]/45 backdrop-blur-[1px] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[1250] flex h-full w-[236px] flex-col bg-[#063c2a] text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-[#0e6943] p-2">
                <Leaf size={18} />
              </span>
              <div>
                <p className="text-xl font-semibold">VanRaksha</p>
                <p className="text-xs text-[#b7d7c8]">FRA Land Monitoring</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-[#d2eadf] lg:hidden"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <nav className="px-3 py-3">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-[#0f5e40] text-white'
                          : 'text-[#d5e8df] hover:bg-[#0d5238]'
                      }`
                    }
                    onClick={onClose}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon size={16} />
                      {item.label}
                    </span>
                    {item.badge ? (
                      <span className="rounded-full bg-[#2b9b5f] px-2 py-0.5 text-xs font-semibold">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mt-auto space-y-3 px-3 pb-4">
          <div className="rounded-xl border border-white/10 bg-[#0a4d35] p-3">
            <p className="text-xs text-[#a6d6bf]">Working as</p>
            <p className="mt-1 text-sm font-semibold">{roleLabel(session.role)}</p>
            <p className="text-xs text-[#d8efe5]">
              {session.role === 'admin'
                ? 'State-wide'
                : session.role === 'district_officer'
                  ? `${session.district} district`
                  : session.jurisdiction_name}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a4d35] p-3">
            <p className="text-xs text-[#a6d6bf]">System Status</p>
            <p className="mt-1 inline-flex items-center gap-1 text-sm">
              <ShieldCheck size={14} className="text-[#6be597]" /> Operational
            </p>
            <p className="text-xs text-[#d8efe5]">All services healthy</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0a4d35] p-3 text-xs text-[#d4ebe1]">
            <p className="font-semibold">Demo Environment</p>
            <p className="mt-1">Prototype mode with seeded records</p>
          </div>

          <div className="space-y-2 px-1 text-sm text-[#c8e3d7]">
            <button
              type="button"
              onClick={onOpenHelp}
              className="inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/10"
            >
              <BookOpen size={15} /> Help & Docs
            </button>
            <button
              type="button"
              onClick={onOpenFeedback}
              className="inline-flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition hover:bg-white/10"
            >
              <UserCog size={15} /> Feedback
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
