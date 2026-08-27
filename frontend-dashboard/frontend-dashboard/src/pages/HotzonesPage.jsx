import { useState, useEffect } from 'react'
import { AlertTriangle, ShieldAlert, FileText, MapPin, RefreshCw, CheckCircle2, Info } from 'lucide-react'
import PageHeader from '../components/common/PageHeader'

function HotzonesPage() {
  const [district, setDistrict] = useState('mayurbhanj')
  const [hotzoneData, setHotzoneData] = useState(null)
  const [reportText, setReportText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'report'

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch classified hotzones JSON
      const res = await fetch(`http://localhost:8002/hotzones?district_id=${district}`)
      if (!res.ok) throw new Error(`Hotzone API status ${res.status}`)
      const data = await res.json()
      setHotzoneData(data)

      // Fetch plain text officer report
      const repRes = await fetch(`http://localhost:8002/hotzones/report?district_id=${district}&format=text`)
      if (repRes.ok) {
        const text = await repRes.text()
        setReportText(text)
      }
    } catch (err) {
      console.error('Error fetching hotzones:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [district])

  const summary = hotzoneData?.summary || {}
  const highZones = hotzoneData?.high_zones || []
  const mediumZones = hotzoneData?.medium_zones || []
  const lowZones = hotzoneData?.low_zones || []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Deforestation Hotzone Predictor"
        subtitle="Phase 2 Rule-Based Risk Scoring & Encroachment Hotzone Mapping for Mayurbhanj District"
      />

      {/* Controls & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce5dc] bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#52665b]">District Select:</label>
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-lg border border-[#c2d4c8] bg-[#f8faf8] px-3 py-1.5 text-sm font-semibold text-[#1e3b2f] focus:outline-none focus:ring-2 focus:ring-[#2b9b5f]"
          >
            <option value="mayurbhanj">Mayurbhanj (Pilot)</option>
            <option value="keonjhar">Keonjhar</option>
            <option value="sundergarh">Sundergarh</option>
            <option value="kandhamal">Kandhamal</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'overview'
                ? 'bg-[#1e3b2f] text-white shadow-sm'
                : 'bg-[#f0f4f1] text-[#2b4c3e] hover:bg-[#e2ece5]'
            }`}
          >
            Hotzone Overview
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'report'
                ? 'bg-[#1e3b2f] text-white shadow-sm'
                : 'bg-[#f0f4f1] text-[#2b4c3e] hover:bg-[#e2ece5]'
            }`}
          >
            <FileText size={14} /> Officer Report
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-[#c2d4c8] bg-white px-2.5 py-1.5 text-xs font-medium text-[#2b4c3e] hover:bg-[#f4f8f5]"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center p-8 text-sm font-semibold text-[#3b594b]">
          Analyzing GFW alerts, ISRO forest cover loss, and satellite pings...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
          <p className="font-semibold">Hotzone Predictor API Connection Error</p>
          <p className="mt-1">{error}. Ensure `hotzone/api.py` is running on port 8002.</p>
        </div>
      )}

      {!loading && !error && activeTab === 'overview' && (
        <>
          {/* Summary Stat Cards */}
          <div className="grid gap-3 md:grid-cols-4">
            <div className="vr-card p-4">
              <p className="text-xs uppercase tracking-wide text-[#708078]">Cells Analyzed</p>
              <p className="mt-1 text-2xl font-semibold text-[#163227]">{summary.total_cells_analyzed || 0}</p>
              <p className="mt-1 text-[11px] text-[#556b60]">1km² Grid Resolution</p>
            </div>
            <div className="vr-card border-l-4 border-l-red-500 p-4">
              <p className="text-xs uppercase tracking-wide text-[#708078]">High Risk Hotzones</p>
              <p className="mt-1 text-2xl font-semibold text-red-600">{summary.high_count || 0}</p>
              <p className="mt-1 text-[11px] text-[#556b60]">Risk Score ≥ 0.60</p>
            </div>
            <div className="vr-card border-l-4 border-l-amber-500 p-4">
              <p className="text-xs uppercase tracking-wide text-[#708078]">Medium Risk Hotzones</p>
              <p className="mt-1 text-2xl font-semibold text-amber-600">{summary.medium_count || 0}</p>
              <p className="mt-1 text-[11px] text-[#556b60]">Risk Score ≥ 0.35</p>
            </div>
            <div className="vr-card border-l-4 border-l-emerald-500 p-4">
              <p className="text-xs uppercase tracking-wide text-[#708078]">Low Risk Hotzones</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-600">{summary.low_count || 0}</p>
              <p className="mt-1 text-[11px] text-[#556b60]">Routine Monitoring</p>
            </div>
          </div>

          {/* High Risk Hotzones */}
          <div className="vr-card p-4">
            <div className="flex items-center gap-2 text-red-700">
              <ShieldAlert size={18} />
              <h3 className="text-base font-semibold">High Risk Encroachment Hotzones</h3>
            </div>

            {highZones.length === 0 ? (
              <p className="mt-3 text-xs text-[#52665b]">No HIGH risk zones detected in this period.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {highZones.map((zone) => (
                  <div key={zone.hotzone_id} className="rounded-xl border border-red-200 bg-red-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                          {zone.hotzone_id}
                        </span>
                        <span className="text-xs font-semibold text-[#1e3b2f]">
                          Centroid: ({zone.centroid_lat}, {zone.centroid_lng})
                        </span>
                      </div>
                      <span className="text-xs font-bold text-red-700">
                        Risk Score: {zone.avg_risk_score} / 1.0
                      </span>
                    </div>

                    <div className="mt-2 grid gap-2 text-xs md:grid-cols-2">
                      <div>
                        <span className="font-semibold text-[#52665b]">Primary Risk Driver: </span>
                        <span className="font-bold text-[#1e3b2f]">
                          {zone.dominant_factor.replaceAll('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold text-[#52665b]">Grid Cluster Size: </span>
                        <span className="font-medium text-[#1e3b2f]">{zone.cell_count} cells (~{zone.cell_count} km²)</span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs font-medium text-red-800 bg-red-100/70 p-2 rounded-lg">
                      <strong>Recommended Action:</strong> {zone.recommended_action}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Medium Risk Hotzones */}
          <div className="vr-card p-4">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} />
              <h3 className="text-base font-semibold">Medium Risk Hotzones (Monitor Closely)</h3>
            </div>

            {mediumZones.length === 0 ? (
              <p className="mt-3 text-xs text-[#52665b]">No MEDIUM risk zones detected in this period.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {mediumZones.map((zone) => (
                  <div key={zone.hotzone_id} className="flex flex-wrap items-center justify-between rounded-lg border border-amber-200 bg-amber-50/40 p-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-800">{zone.hotzone_id}</span>
                      <span className="text-[#3a5447]">({zone.centroid_lat}, {zone.centroid_lng})</span>
                    </div>
                    <div className="text-[#3a5447]">
                      Driver: <strong className="text-[#1e3b2f]">{zone.dominant_factor.replaceAll('_', ' ')}</strong>
                    </div>
                    <div className="font-bold text-amber-800">Score: {zone.avg_risk_score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {!loading && !error && activeTab === 'report' && (
        <div className="vr-card p-5">
          <div className="flex items-center justify-between border-b border-[#dce5dc] pb-3">
            <h3 className="text-base font-bold text-[#163227]">District Officer Quarterly Deforestation Report</h3>
            <span className="text-xs text-[#52665b]">Format: Plain Text</span>
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-[#092218] p-4 text-xs font-mono text-[#a3e6be] shadow-inner overflow-x-auto leading-relaxed">
            {reportText}
          </pre>
        </div>
      )}
    </div>
  )
}

export default HotzonesPage
