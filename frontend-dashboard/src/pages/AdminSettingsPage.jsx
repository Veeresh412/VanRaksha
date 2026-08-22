import PageHeader from '../components/common/PageHeader'
import { useDashboardContext } from '../hooks/useDashboardContext'

function AdminSettingsPage() {
  const { session } = useDashboardContext()

  if (session.role !== 'admin') {
    return null
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
          <h3 className="text-sm font-semibold text-[#1c392e]">Data Refresh</h3>
          <p className="mt-2 text-sm text-[#66736c]">
            Seed-mode prototype currently runs static records. These controls are prepared for API integration.
          </p>
          <div className="mt-3 space-y-2 text-xs text-[#4f645b]">
            <p>• Source mode: Seed Data</p>
            <p>• Last sync: 22 Aug 2026</p>
            <p>• Manual refresh: Available after API hookup</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSettingsPage
