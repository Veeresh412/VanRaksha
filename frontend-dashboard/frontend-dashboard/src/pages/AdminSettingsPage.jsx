import { useState } from 'react'
import PageHeader from '../components/common/PageHeader'
import { useDashboardContext } from '../hooks/useDashboardContext'
import { useAppData } from '../contexts/AppDataContext'
import { USE_SEED_DATA } from '../services/config'

function AdminSettingsPage() {
  const { session } = useDashboardContext()
  const { refreshData, clearAllData, isSyncing, syncError } = useAppData()

  const [notice, setNotice] = useState('')
  const [isClearingData, setIsClearingData] = useState(false)

  if (session.role !== 'admin') {
    return null
  }

  const handleRefresh = async () => {
    setNotice('')
    await refreshData()
    setNotice('Data sync request completed.')
  }

  const handleClearData = async () => {
    setIsClearingData(true)
    setNotice('')

    const result = await clearAllData()

    setIsClearingData(false)
    setNotice(result.success ? 'Test data cleared successfully.' : result.error)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin Settings"
        subtitle="Dashboard-level configuration placeholders for API-connected workflows"
      />

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="vr-card p-4">
          <h3 className="text-sm font-semibold text-[#1c392e]">Alert Workflow</h3>
          <p className="mt-2 text-sm text-[#66736c]">
            Configure default escalation and review routing once backend workflow endpoints are active.
          </p>
          <div className="mt-3 space-y-2 text-xs text-[#4f645b]">
            <p>• Auto-route unverified signals: Enabled</p>
            <p>• District escalation fallback: Enabled</p>
            <p>• Notification digest: Daily</p>
          </div>
        </div>

        <div className="vr-card p-4">
          <h3 className="text-sm font-semibold text-[#1c392e]">Data Sync & Test Controls</h3>
          <p className="mt-2 text-sm text-[#66736c]">
            Uses `{USE_SEED_DATA ? 'seed mode' : 'live API mode'}` based on environment configuration.
          </p>

          <div className="mt-3 space-y-2 text-xs text-[#4f645b]">
            <p>• Source mode: {USE_SEED_DATA ? 'Seed Data' : 'Live API'}</p>
            <p>• Sync status: {isSyncing ? 'Syncing...' : 'Idle'}</p>
            <p>• Endpoint: DELETE /test/clear-data</p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isSyncing}
              className="h-10 rounded-lg border border-[#cdd9cd] bg-white text-sm font-semibold text-[#24473a] transition hover:bg-[#eef5ee] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSyncing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              type="button"
              onClick={handleClearData}
              disabled={isClearingData || isSyncing}
              className="h-10 rounded-lg border border-[#f2c0bb] bg-[#fff3f1] text-sm font-semibold text-[#ab4139] transition hover:bg-[#ffe9e6] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isClearingData ? 'Clearing...' : 'Clear Test Data'}
            </button>
          </div>

          {notice ? (
            <p className="mt-3 rounded-md border border-[#d8e2d8] bg-[#f7faf7] px-3 py-2 text-xs text-[#4f645b]">
              {notice}
            </p>
          ) : null}

          {syncError ? (
            <p className="mt-2 rounded-md border border-[#f4c3be] bg-[#fef0ee] px-3 py-2 text-xs text-[#bb4b42]">
              {syncError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AdminSettingsPage
