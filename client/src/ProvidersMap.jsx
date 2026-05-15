import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default icon paths broken by bundlers
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// User location icon (red)
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

// Numbered provider icon
function makeNumberedIcon(number) {
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#2563EB;color:#fff;width:28px;height:28px;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      font-weight:700;font-size:13px;border:2px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

// Re-center map when user location changes
function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function ProvidersMap({ userLocation, providers, onSelectProvider }) {
  const center = [userLocation.lat, userLocation.lng]

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%', borderRadius: 12 }}
      zoomControl={true}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />

      {/* User location marker */}
      <Marker position={center} icon={userIcon}>
        <Popup>You are here</Popup>
      </Marker>

      {/* Provider markers */}
      {providers.slice(0, 8).map((provider, i) => (
        <Marker
          key={provider.id}
          position={[provider.lat, provider.lng]}
          icon={makeNumberedIcon(i + 1)}
          eventHandlers={{ click: () => onSelectProvider && onSelectProvider(provider) }}
        >
          <Popup>
            <strong>{provider.name}</strong><br />
            {provider.specialty}<br />
            {provider.distanceLabel} · {provider.priceRange}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
