import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppData } from '../contexts/AppDataContext'
import { useDashboardContext } from '../hooks/useDashboardContext'
import MonitoringMap from '../components/map/MonitoringMap'
import ActiveAlertsFeed from '../components/alerts/ActiveAlertsFeed'
import AlertDetailDrawer from '../components/alerts/AlertDetailDrawer'
import ResolutionDonutCard from '../components/analytics/ResolutionDonutCard'
import BacktestCard from '../components/analytics/BacktestCard'
import DataOverviewCard from '../components/analytics/DataOverviewCard'
import InsightModal from '../components/common/InsightModal'
import { useAppLanguage } from '../hooks/useAppLanguage'

function DashboardPage() {
  const navigate = useNavigate()
  const { t } = useAppLanguage()
  const {
    visibleFlags,
    session,
    jurisdictionsById,
    jurisdictions,
    filters,
  } = useDashboardContext()
  const {
    analytics,
    backtestSummary,
    citizenReports,
    updateFlagStatus,
    escalateFlag,
    updateOfficerNote,
  } = useAppData()

  const [selectedFlagId, setSelectedFlagId] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeInsight, setActiveInsight] = useState(null)
  const [isInsightLoading, setIsInsightLoading] = useState(false)
  const insightTimerRef = useRef(null)

  const sortedFlags = useMemo(
    () =>
      [...visibleFlags].sort(
        (flagA, flagB) =>
          new Date(flagB.created_at).getTime() - new Date(flagA.created_at).getTime(),
      ),
    [visibleFlags],
  )

  const selectedFlag =
    sortedFlags.find((flag) => flag.flag_id === selectedFlagId) ?? sortedFlags[0] ?? null

  const selectedJurisdiction = useMemo(() => {
    if (selectedFlag) {
      return jurisdictionsById[selectedFlag.jurisdiction_id]
    }

    if (session.role === 'gram_sabha') {
      return jurisdictionsById[session.jurisdiction_id]
    }

    if (filters.jurisdiction !== 'all') {
      return jurisdictionsById[filters.jurisdiction]
    }

    return null
  }, [selectedFlag, session, jurisdictionsById, filters.jurisdiction])

  const mapSummary = useMemo(
    () => ({
      jurisdictionsMonitored: new Set(sortedFlags.map((flag) => flag.jurisdiction_id)).size,
      totalFlags: sortedFlags.length,
      underReview: sortedFlags.filter((flag) => flag.status === 'Under Review').length,
      verified: sortedFlags.filter((flag) => flag.status === 'Verified').length,
    }),
    [sortedFlags],
  )

  const linkedReportsByFlagId = useMemo(() => {
    const byFlagId = {}

    citizenReports.forEach((report) => {
      if (!report.linked_flag_id) return

      const existingReport = byFlagId[report.linked_flag_id]

      if (!existingReport) {
        byFlagId[report.linked_flag_id] = report
        return
      }

      const nextTier = Number(report.tier ?? 1)
      const currentTier = Number(existingReport.tier ?? 1)

      if (nextTier > currentTier) {
        byFlagId[report.linked_flag_id] = report
        return
      }

      const nextCreatedAt = new Date(report.created_at ?? 0).getTime()
      const currentCreatedAt = new Date(existingReport.created_at ?? 0).getTime()

      if (nextTier === currentTier && nextCreatedAt > currentCreatedAt) {
        byFlagId[report.linked_flag_id] = report
      }
    })

    return byFlagId
  }, [citizenReports])

  const sixMonthTrendBars = useMemo(
    () => [
      { month: 'Mar', heightClass: 'h-16' },
      { month: 'Apr', heightClass: 'h-24' },
      { month: 'May', heightClass: 'h-20' },
      { month: 'Jun', heightClass: 'h-28' },
      { month: 'Jul', heightClass: 'h-32' },
      { month: 'Aug', heightClass: 'h-24' },
    ],
    [],
  )

  const predictedHotZones = useMemo(() => {
    const fallbackNames = [
      'Bajaag Gram Sabha',
      'Chandpur Gram Sabha',
      'Rampur Gram Sabha',
    ]

    const jurisdictionNames = jurisdictions
      .map((jurisdiction) => jurisdiction.gram_sabha)
      .filter(Boolean)

    const names = fallbackNames.map((fallbackName, index) => jurisdictionNames[index] ?? fallbackName)

    return [
      { name: names[0], score: 88 },
      { name: names[1], score: 74 },
      { name: names[2], score: 61 },
    ]
  }, [jurisdictions])

  const handleSelectFlag = (flag) => {
    setSelectedFlagId(flag.flag_id)
    setDrawerOpen(true)
  }

  const handleVerify = (flagId) => updateFlagStatus(flagId, 'Verified')
  const handleReject = (flagId) => updateFlagStatus(flagId, 'Rejected')
  const handleUnderReview = (flagId) => updateFlagStatus(flagId, 'Under Review')
  const handleResolve = (flagId) => updateFlagStatus(flagId, 'Resolved')
  const handleEscalate = (flagId) => escalateFlag(flagId)

  const closeInsight = () => {
    if (insightTimerRef.current) {
      window.clearTimeout(insightTimerRef.current)
      insightTimerRef.current = null
    }

    setIsInsightLoading(false)
    setActiveInsight(null)
  }

  const openInsight = (insightKey) => {
    if (insightTimerRef.current) {
      window.clearTimeout(insightTimerRef.current)
    }

    setActiveInsight(insightKey)
    setIsInsightLoading(true)

    insightTimerRef.current = window.setTimeout(() => {
      setIsInsightLoading(false)
      insightTimerRef.current = null
    }, 140)
  }

  useEffect(() => {
    return () => {
      if (insightTimerRef.current) {
        window.clearTimeout(insightTimerRef.current)
      }
    }
  }, [])

  const renderInsightSkeleton = () => (
    <div className="space-y-3">
      <div className="vr-skeleton h-8 rounded-lg" />
      <div className="vr-skeleton h-40 rounded-xl" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="vr-skeleton h-24 rounded-xl" />
        <div className="vr-skeleton h-24 rounded-xl" />
        <div className="vr-skeleton h-24 rounded-xl" />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_380px] 2xl:gap-5">
        <div className="space-y-4">
          <MonitoringMap
            jurisdictions={jurisdictions}
            flags={sortedFlags}
            selectedJurisdiction={selectedJurisdiction}
            selectedFlag={selectedFlag}
            onSelectFlag={handleSelectFlag}
            role={session.role}
            mapSummary={mapSummary}
          />

          <div className="grid gap-4 lg:grid-cols-3 xl:gap-5">
            <ResolutionDonutCard
              analytics={analytics}
              onExpand={() => openInsight('resolution')}
            />
            <BacktestCard
              backtestSummary={backtestSummary}
              onExpand={() => openInsight('backtest')}
            />
            <button
              type="button"
              onClick={() => openInsight('monitored')}
              className="vr-card vr-interactive p-4 text-left"
            >
              <h3 className="text-sm font-semibold text-[#1e3b2f]">Monitored Gram Sabhas</h3>
              <p className="mt-2 text-4xl font-semibold text-[#1a352a]">{mapSummary.jurisdictionsMonitored}</p>
              <p className="mt-1 text-sm text-[#66736c]">Active jurisdictions in current filter scope</p>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[#4f6159]">
                <div className="rounded-md bg-[#f3f8f3] p-2">
                  <p className="text-[#708078]">Active Flags</p>
                  <p className="mt-0.5 text-lg font-semibold text-[#1f382e]">{mapSummary.totalFlags}</p>
                </div>
                <div className="rounded-md bg-[#f3f8f3] p-2">
                  <p className="text-[#708078]">Under Review</p>
                  <p className="mt-0.5 text-lg font-semibold text-[#1f382e]">{mapSummary.underReview}</p>
                </div>
              </div>
            </button>
          </div>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="text-base font-semibold text-[#1a362b]">{t('dashboard.longTermTitle')}</h2>
              <p className="text-xs text-[#63746b]">{t('dashboard.longTermSubtitle')}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2 xl:gap-5">
              <div className="vr-card p-4">
                <h3 className="text-sm font-semibold text-[#1e3b2f]">{t('dashboard.timelineTitle')}</h3>
                <div className="mt-4 flex items-end gap-3">
                  {sixMonthTrendBars.map((item) => (
                    <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className={`w-full max-w-[28px] rounded-t-md bg-gradient-to-t from-[#1f7a48] to-[#64b985] ${item.heightClass}`}
                      />
                      <span className="text-xs font-medium text-[#607067]">{item.month}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-[#66736c]">{t('dashboard.timelineNote')}</p>
              </div>

              <div className="vr-card p-4">
                <h3 className="text-sm font-semibold text-[#1e3b2f]">{t('dashboard.hotZonesTitle')}</h3>
                <div className="mt-3 space-y-3">
                  {predictedHotZones.map((zone) => (
                    <div key={zone.name} className="rounded-lg border border-[#e1e8e1] bg-[#fbfdfb] p-2.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <p className="font-medium text-[#234437]">{zone.name}</p>
                        <span className="text-xs font-semibold text-[#40554b]">{zone.score}%</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#6b7a73]">{t('dashboard.vulnerability')}</p>
                      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#e8efe9]">
                        <div
                          className={`h-full rounded-full ${
                            zone.score >= 85
                              ? 'bg-[#e5534b]'
                              : zone.score >= 70
                                ? 'bg-[#f0ad3d]'
                                : 'bg-[#2e9b5f]'
                          }`}
                          style={{ width: `${zone.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[88px] xl:self-start">
          <ActiveAlertsFeed
            flags={sortedFlags}
            jurisdictionsById={jurisdictionsById}
            linkedReportsByFlagId={linkedReportsByFlagId}
            onSelectFlag={handleSelectFlag}
            onVerify={handleVerify}
            onReject={handleReject}
            onViewAll={() => navigate('/alerts')}
          />
          <DataOverviewCard analytics={analytics} />
        </div>
      </div>

      <div className="rounded-lg border border-[#dde6dd] bg-[#f7faf7] px-4 py-2.5 text-xs text-[#5f6d65]">
        <p className="text-center leading-relaxed">
          Alerts represent potential land-use change signals and require authorized review.
          VanRaksha does not determine legality or ownership.
        </p>
      </div>

      <div className="rounded-lg border border-[#dde6dd] bg-[#f7faf7] px-4 py-3 text-xs text-[#6d7a74]">
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => openInsight('privacy')}
            className="font-medium transition hover:text-[#2d4b3d]"
          >
            Privacy Policy
          </button>
          <span className="text-[#a0aea7]">•</span>
          <button
            type="button"
            onClick={() => openInsight('terms')}
            className="font-medium transition hover:text-[#2d4b3d]"
          >
            Terms of Use
          </button>
          <span className="text-[#a0aea7]">•</span>
          <span>v1.0</span>
        </div>
      </div>

      {activeInsight === 'resolution' ? (
        <InsightModal title="Alert Resolution Mix" onClose={closeInsight}>
          {isInsightLoading ? renderInsightSkeleton() : <ResolutionDonutCard analytics={analytics} expanded />}
        </InsightModal>
      ) : null}

      {activeInsight === 'backtest' ? (
        <InsightModal title="Model Validation & Backtest" onClose={closeInsight}>
          {isInsightLoading ? renderInsightSkeleton() : <BacktestCard backtestSummary={backtestSummary} expanded />}
        </InsightModal>
      ) : null}

      {activeInsight === 'monitored' ? (
        <InsightModal title="Monitored Gram Sabha Summary" onClose={closeInsight}>
          {isInsightLoading ? renderInsightSkeleton() : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="vr-card p-4">
                <p className="text-xs uppercase tracking-wide text-[#708078]">Active Jurisdictions</p>
                <p className="mt-1 text-3xl font-semibold text-[#1a352a]">{mapSummary.jurisdictionsMonitored}</p>
              </div>
              <div className="vr-card p-4">
                <p className="text-xs uppercase tracking-wide text-[#708078]">Active Flags</p>
                <p className="mt-1 text-3xl font-semibold text-[#1a352a]">{mapSummary.totalFlags}</p>
              </div>
              <div className="vr-card p-4">
                <p className="text-xs uppercase tracking-wide text-[#708078]">Under Review</p>
                <p className="mt-1 text-3xl font-semibold text-[#1a352a]">{mapSummary.underReview}</p>
              </div>
            </div>
          )}
        </InsightModal>
      ) : null}

      {activeInsight === 'privacy' ? (
        <InsightModal title="Privacy Policy" onClose={closeInsight}>
          {isInsightLoading ? renderInsightSkeleton() : (
            <p className="text-sm leading-relaxed text-[#455a52]">
              VanRaksha dashboard uses seeded demo data in this prototype environment.
              Officer phone numbers and OTP values are used only for demonstration and
              are not exposed in dashboard tables.
            </p>
          )}
        </InsightModal>
      ) : null}

      {activeInsight === 'terms' ? (
        <InsightModal title="Terms of Use" onClose={closeInsight}>
          {isInsightLoading ? renderInsightSkeleton() : (
            <p className="text-sm leading-relaxed text-[#455a52]">
              This interface is a decision-support prototype for unverified land-use change
              monitoring. Signals must be reviewed by authorized officials before any action.
            </p>
          )}
        </InsightModal>
      ) : null}

      <AlertDetailDrawer
        key={selectedFlag?.flag_id ?? 'no-flag-selected'}
        open={drawerOpen}
        flag={selectedFlag}
        jurisdiction={selectedFlag ? jurisdictionsById[selectedFlag.jurisdiction_id] : null}
        linkedReport={selectedFlag ? linkedReportsByFlagId[selectedFlag.flag_id] : null}
        role={session.role}
        onClose={() => setDrawerOpen(false)}
        onUnderReview={handleUnderReview}
        onVerify={handleVerify}
        onReject={handleReject}
        onResolve={handleResolve}
        onEscalate={handleEscalate}
        onSaveOfficerNote={updateOfficerNote}
      />
    </div>
  )
}

export default DashboardPage
