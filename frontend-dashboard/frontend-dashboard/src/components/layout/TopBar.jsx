import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronDown, Globe, Leaf, LogOut, Menu, Search, UserRound } from 'lucide-react'
import { supportedLanguageOptions } from '../../i18n/translations'
import { useAppLanguage } from '../../hooks/useAppLanguage'

function Select({ label, value, options, onChange, disabled }) {
  return (
    <label className="relative min-w-[160px]">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="h-10 w-full appearance-none rounded-lg border border-[#d9e2d9] bg-white px-3 pr-8 text-sm font-medium text-[#1f392f] outline-none transition focus:border-[#7bb891] disabled:bg-[#f6f8f6]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-2 top-3 text-[#6e7b74]" />
    </label>
  )
}

function TopBar({
  session,
  filters,
  setFilter,
  stateOptions,
  districtOptions,
  jurisdictionOptions,
  statusOptions,
  notifications,
  showStateFilter,
  showDistrictFilter,
  onToggleSidebar,
  onLogout,
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { language, setLanguage, t } = useAppLanguage()
  const userMenuRef = useRef(null)
  const notificationRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const roleLabel =
    session.role === 'admin'
      ? 'State Administrator'
      : session.role === 'district_officer'
        ? 'District Officer'
        : 'Gram Sabha Officer'

  return (
    <header className="sticky top-0 z-[1400] overflow-visible border-b border-[#dce5dc] bg-[#f7f8f4]/95 px-4 py-3 shadow-[0_1px_0_rgba(13,40,28,0.03)] backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg border border-[#d9e2d9] bg-white p-2 text-[#224437] lg:hidden"
        >
          <Menu size={16} />
        </button>

        <div className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d9e2d9] bg-white px-3">
          <Leaf size={15} className="text-[#0f6a43]" />
          <span className="text-sm font-semibold text-[#173127]">VanRaksha</span>
        </div>

        {showStateFilter ? (
          <>
            <Select
              label="State"
              value={filters.state}
              onChange={(event) => setFilter('state', event.target.value)}
              options={stateOptions}
            />
            {showDistrictFilter ? (
              <Select
                label="District"
                value={filters.district}
                onChange={(event) => setFilter('district', event.target.value)}
                options={districtOptions}
              />
            ) : null}
          </>
        ) : null}

        {!showStateFilter && showDistrictFilter ? (
          <Select
            label="District"
            value={filters.district}
            onChange={(event) => setFilter('district', event.target.value)}
            options={districtOptions}
            disabled={session.role === 'gram_sabha'}
          />
        ) : null}

        <Select
          label="Jurisdiction"
          value={filters.jurisdiction}
          onChange={(event) => setFilter('jurisdiction', event.target.value)}
          options={jurisdictionOptions}
          disabled={session.role !== 'admin'}
        />

        <Select
          label="Status"
          value={filters.status}
          onChange={(event) => setFilter('status', event.target.value)}
          options={statusOptions}
        />

        <label className="relative min-w-[250px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-3 text-[#6e7b74]" />
          <input
            value={filters.search}
            onChange={(event) => setFilter('search', event.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
            className="h-10 w-full rounded-lg border border-[#d9e2d9] bg-white pl-9 pr-3 text-sm text-[#173127] outline-none focus:border-[#7bb891]"
          />
        </label>

        <div className="ml-auto flex items-center gap-2">
          <label className="relative min-w-[178px]">
            <span className="sr-only">Language</span>
            <Globe size={14} className="pointer-events-none absolute left-2.5 top-3 text-[#6e7b74]" />
            <select
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value)
              }}
              className="h-10 w-full appearance-none rounded-lg border border-[#d9e2d9] bg-white pl-8 pr-8 text-sm font-medium text-[#1f392f] outline-none transition focus:border-[#7bb891]"
            >
              {supportedLanguageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2 top-3 text-[#6e7b74]" />
          </label>

          <div ref={notificationRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen((currentValue) => !currentValue)}
              className="relative rounded-lg border border-[#d9e2d9] bg-white p-2 text-[#224437] transition hover:border-[#bfd2c0] hover:bg-[#f8fbf8]"
            >
              <Bell size={16} />
              <span className="absolute -right-1 -top-1 rounded-full bg-[#e5534b] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {notifications.length > 99 ? '99+' : notifications.length}
              </span>
            </button>

            {isNotificationOpen ? (
              <div className="absolute right-0 z-[1450] mt-2 w-80 origin-top-right animate-[vr-pop-in_180ms_ease-out] rounded-xl border border-[#d9e2d9] bg-white p-3 shadow-panel">
                <p className="text-sm font-semibold text-[#173127]">{t('topbar.notifications')}</p>
                <div className="vr-subtle-scrollbar mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
                  {notifications.length ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="rounded-lg border border-[#e1e8e1] bg-[#f8fbf8] p-2.5">
                        <p className="text-sm font-semibold text-[#1a3429]">{notification.title}</p>
                        <p className="text-xs text-[#607169]">{notification.subtitle}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#6f7c75]">{t('topbar.noNotifications')}</p>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((currentValue) => !currentValue)}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d9e2d9] bg-white px-3 transition hover:border-[#bfd2c0] hover:bg-[#f8fbf8]"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0e5f40] text-xs font-bold text-white">
              {session.name.charAt(0)}
            </span>
            <span className="text-left text-sm leading-tight">
              <span className="block font-semibold text-[#173127]">{session.name}</span>
              <span className="block text-xs text-[#66736c]">{roleLabel}</span>
            </span>
            <ChevronDown size={14} className="text-[#6e7b74]" />
          </button>

            {isUserMenuOpen ? (
              <div className="absolute right-0 z-[1450] mt-2 w-64 origin-top-right animate-[vr-pop-in_180ms_ease-out] rounded-xl border border-[#d9e2d9] bg-white p-3 shadow-panel">
                <div className="rounded-lg border border-[#e2e9e2] bg-[#f8fbf8] p-3">
                  <p className="text-sm font-semibold text-[#173127]">{session.name}</p>
                  <p className="mt-0.5 text-xs text-[#66736c]">{roleLabel}</p>
                  <p className="mt-0.5 text-xs text-[#66736c]">
                    {session.role === 'admin'
                      ? 'State-wide access'
                      : session.role === 'district_officer'
                        ? `${session.district} district`
                        : session.jurisdiction_name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#e5b5b2] bg-[#fff6f5] px-3 py-2 text-sm font-semibold text-[#b0463f] transition hover:bg-[#fdeeed]"
                >
                  <LogOut size={14} /> {t('topbar.logout')}
                </button>

                <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#7a867f]">
                  <UserRound size={12} /> Profile session menu
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopBar
