import { useEffect, useMemo, useState } from 'react'
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { Info, Layers, LocateFixed, Maximize2, Minus, Plus } from 'lucide-react'
import { formatStatus } from '../../utils/formatters'

const satelliteTileUrl =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

function FlyToController({ center, zoom }) {
  const map = useMap()

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.9 })
    }
  }, [map, center, zoom])

  return null
}

function ZoomControls() {
  const map = useMap()

  const toggleFullscreen = async () => {
    const container = map.getContainer()

    if (document.fullscreenElement) {
      await document.exitFullscreen?.()
      return
    }

    await container.requestFullscreen?.()
  }

  return (
    <div className="absolute left-3 top-[126px] z-[80] flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.zoomIn()}
        className="rounded-md border border-[#dbe4db] bg-white p-2 text-[#204033] shadow-sm"
      >
        <Plus size={15} />
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        className="rounded-md border border-[#dbe4db] bg-white p-2 text-[#204033] shadow-sm"
      >
        <Minus size={15} />
      </button>
      <button
        type="button"
        onClick={() => map.flyTo(map.getCenter(), 7)}
        className="rounded-md border border-[#dbe4db] bg-white p-2 text-[#204033] shadow-sm"
      >
        <LocateFixed size={15} />
      </button>
      <button
        type="button"
        onClick={toggleFullscreen}
        className="rounded-md border border-[#dbe4db] bg-white p-2 text-[#204033] shadow-sm"
      >
        <Maximize2 size={15} />
      </button>
    </div>
  )
}

function getStatusColor(status) {
  if (status === 'Verified') return '#2E9B5F'
  if (status === 'Under Review') return '#F59E0B'
  if (status === 'Rejected') return '#74838A'
  if (status === 'Resolved') return '#0F5E40'
  return '#E5534B'
}

function MonitoringMap({
  jurisdictions,
  flags,
  selectedJurisdiction,
  selectedFlag,
  onSelectFlag,
  role,
  mapSummary,
}) {
  const [layersOpen, setLayersOpen] = useState(false)
  const [layers, setLayers] = useState({
    jurisdictions: true,
    flags: true,
    satellite: true,
    citizen: true,
  })

  const fallbackCenter = useMemo(() => {
    if (selectedFlag) return [selectedFlag.latitude, selectedFlag.longitude]
    if (selectedJurisdiction) return [selectedJurisdiction.latitude, selectedJurisdiction.longitude]

    if (!jurisdictions.length) return [20.5937, 78.9629]

    const avgLat =
      jurisdictions.reduce((sum, jurisdiction) => sum + jurisdiction.latitude, 0) /
      jurisdictions.length
    const avgLng =
      jurisdictions.reduce((sum, jurisdiction) => sum + jurisdiction.longitude, 0) /
      jurisdictions.length
    return [avgLat, avgLng]
  }, [selectedFlag, selectedJurisdiction, jurisdictions])

  const zoomLevel = selectedFlag ? 12 : selectedJurisdiction ? 10 : role === 'admin' ? 5 : 8

  return (
    <div className="relative h-[470px] overflow-hidden rounded-xl border border-[#d9e2d9]">
      <MapContainer
        center={fallbackCenter}
        zoom={zoomLevel}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full"
        style={{ zIndex: 0 }}
      >
        <FlyToController center={fallbackCenter} zoom={zoomLevel} />
        {layers.satellite && <TileLayer url={satelliteTileUrl} />}

        {layers.jurisdictions &&
          jurisdictions.map((jurisdiction) => {
            const jurisdictionFlags = flags.filter(
              (flag) => flag.jurisdiction_id === jurisdiction.id,
            )

            return (
              <Circle
                key={jurisdiction.id}
                center={[jurisdiction.latitude, jurisdiction.longitude]}
                radius={9500}
                pathOptions={{
                  color: '#9FD39D',
                  fillColor: '#4FAF78',
                  fillOpacity: 0.08,
                  weight: 1.2,
                }}
              >
                <Tooltip direction="top" opacity={0.95}>
                  <div className="text-xs font-medium">
                    <p>{jurisdiction.gram_sabha}</p>
                    <p>{jurisdictionFlags.length} flag(s)</p>
                  </div>
                </Tooltip>
              </Circle>
            )
          })}

        {layers.flags &&
          flags.map((flag) => {
            const isSatelliteOnly = flag.source === 'Satellite'
            const isCitizenOnly = flag.source === 'Citizen Report'
            const isCombined = flag.source === 'Combined'

            const hideSatellite = isSatelliteOnly && !layers.satellite
            const hideCitizen = isCitizenOnly && !layers.citizen
            const hideCombined = isCombined && !layers.satellite && !layers.citizen

            if (hideSatellite || hideCitizen || hideCombined) {
              return null
            }

            return (
              <CircleMarker
                key={flag.flag_id}
                center={[flag.latitude, flag.longitude]}
                radius={selectedFlag?.flag_id === flag.flag_id ? 10 : 7}
                pathOptions={{
                  color: getStatusColor(flag.status),
                  fillColor: getStatusColor(flag.status),
                  fillOpacity: 0.88,
                  weight: selectedFlag?.flag_id === flag.flag_id ? 2 : 1,
                }}
                eventHandlers={{
                  click: () => onSelectFlag(flag),
                }}
              >
                <Tooltip direction="top" opacity={0.95}>
                  <div className="text-xs">
                    <p className="font-semibold">{flag.flag_id.replace('flag_', 'FLAG-')}</p>
                    <p>{formatStatus(flag.status)}</p>
                  </div>
                </Tooltip>
              </CircleMarker>
            )
          })}

        <ZoomControls />
      </MapContainer>

      <div className="absolute left-3 top-3 z-[70] w-[calc(100%-5.5rem)] max-w-[780px] rounded-xl border border-[#d9e2d9] bg-white/95 px-3 py-3 text-xs shadow-sm sm:px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))] sm:gap-4">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-[26px] font-semibold leading-none text-[#162f25]">
              {selectedJurisdiction?.district ?? 'Coverage Overview'}
            </p>
            <p className="mt-1 text-xs text-[#68766f] sm:text-sm">
              {selectedJurisdiction
                ? `${selectedJurisdiction.state}, ${selectedJurisdiction.gram_sabha}`
                : 'VanRaksha multi-jurisdiction monitoring'}
            </p>
          </div>

          <div>
            <p className="text-2xl font-semibold text-[#162f25]">{mapSummary.jurisdictionsMonitored}</p>
            <p className="mt-1 text-[11px] leading-tight text-[#6c7973]">Gram Sabhas monitored</p>
          </div>

          <div>
            <p className="text-2xl font-semibold text-[#162f25]">{mapSummary.totalFlags}</p>
            <p className="mt-1 text-[11px] leading-tight text-[#6c7973]">Active flags</p>
          </div>

          <div>
            <p className="text-2xl font-semibold text-[#162f25]">{mapSummary.underReview}</p>
            <p className="mt-1 text-[11px] leading-tight text-[#6c7973]">Under review</p>
          </div>

          <div>
            <p className="text-2xl font-semibold text-[#162f25]">{mapSummary.verified}</p>
            <p className="mt-1 text-[11px] leading-tight text-[#6c7973]">Verified</p>
          </div>
        </div>
      </div>

      <div className="absolute right-3 top-3 z-[70]">
        <button
          type="button"
          onClick={() => setLayersOpen((isOpen) => !isOpen)}
          className="inline-flex items-center gap-1 rounded-md border border-[#d9e2d9] bg-white px-3 py-2 text-xs font-semibold text-[#214034] shadow-sm"
        >
          <Layers size={14} /> Layers
        </button>

        {layersOpen && (
          <div className="mt-2 w-40 rounded-md border border-[#dbe5db] bg-white p-2 text-xs shadow-panel">
            {Object.entries({
              jurisdictions: 'Jurisdictions',
              flags: 'Flags',
              satellite: 'Satellite Pings',
              citizen: 'Citizen Reports',
            }).map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 px-1 py-1.5 text-[#42574f]">
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={() => setLayers((currentLayers) => ({
                    ...currentLayers,
                    [key]: !currentLayers[key],
                  }))}
                  className="h-3.5 w-3.5 rounded border-[#b5c3b5]"
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="group absolute bottom-3 left-3 z-[70]">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md border border-[#d8e0d8] bg-white/95 px-2.5 py-2 text-xs font-semibold text-[#2d4c3f] shadow-sm"
        >
          <Info size={13} /> Legend
        </button>

        <div className="pointer-events-none absolute bottom-11 left-0 w-44 rounded-lg border border-[#d8e0d8] bg-white/95 p-3 text-xs text-[#43574f] opacity-0 shadow-sm transition group-hover:pointer-events-auto group-hover:opacity-100">
          <p className="mb-1 font-semibold text-[#1f3a2f]">Map Legend</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#E5534B]" /> Unverified</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#F59E0B]" /> Under Review</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#2E9B5F]" /> Verified</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#74838A]" /> Rejected</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#0F5E40]" /> Resolved</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#08A7C5]" /> Satellite signal</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-[#6C2BB8]" /> Citizen report</p>
          <p><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full border border-[#9fd39d]" /> Jurisdiction</p>
        </div>
      </div>
    </div>
  )
}

export default MonitoringMap
