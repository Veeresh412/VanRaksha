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

function DashboardPage() {
  const navigate = useNavigate()
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
          new Date(flagB.date_detected).getTime() - new Date(flagA.date_detected).getTime(),
      ),
    [visibleFlags],
  )

  useEffect(() => {
    if (!sortedFlags.length) {
      setSelectedFlagId(null)
      return
    }

    if (!selectedFlagId || !sortedFlags.some((flag) => flag.flag_id === selectedFlagId)) {
      setSelectedFlagId(sortedFlags[0].flag_id)
    }
  }, [sortedFlags, selectedFlagId])

  const selectedFlag = sortedFlags.find((flag) => flag.flag_id === selectedFlagId) ?? null

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
      underReview: sortedFlags.filter((flag) => flag.status === 'under_review').length,
      verified: sortedFlags.filter((flag) => flag.status === 'verified').length,
    }),
    [sortedFlags],
  )

  const handleSelectFlag = (flag) => {
    setSelectedFlagId(flag.flag_id)
    setDrawerOpen(true)
  }

  const handleVerify = (flagId) => updateFlagStatus(flagId, 'verified')
  const handleReject = (flagId) => updateFlagStatus(flagId, 'rejected')
  const handleUnderReview = (flagId) => updateFlagStatus(flagId, 'under_review')
  const handleResolve = (flagId) => updateFlagStatus(flagId, 'verified')
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
        </div>

        <div className="space-y-4 xl:sticky xl:top-[88px] xl:self-start">
          <ActiveAlertsFeed
            flags={sortedFlags}
            jurisdictionsById={jurisdictionsById}
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
          All alerts are unverified and require human review by authorized officials. VanRaksha does
          not determine legality or ownership.
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
        open={drawerOpen}
        flag={selectedFlag}
        jurisdiction={selectedFlag ? jurisdictionsById[selectedFlag.jurisdiction_id] : null}
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
