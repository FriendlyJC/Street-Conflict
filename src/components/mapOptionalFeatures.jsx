import { Rectangle, Marker, Popup } from 'react-leaflet'
import './mapOptionalFeatures.css'

// 需要從 BigMapForAll 導出 createPlayerIcon
// 暫時在這裡重新定義，稍後整合
const createPlayerIcon = (color, isHost = false, heading = 0) => {
    const L = window.L
    return L.divIcon({
        className: 'player-marker-icon',
        html: `
      <div class="player-marker" style="background: ${color}; border-color: ${isHost ? '#e67e22' : 'white'}; transform: rotate(${heading}deg)">
        <div class="player-marker-arrow" style="border-bottom-color: ${color}"></div>
      </div>
    `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    })
}

// 1. 呼叫審判官按鈕
export function RefereeCallButton({ callingReferee, onToggle }) {
    return (
        <button
            className={`call-referee-btn ${callingReferee ? 'active' : ''}`}
            onClick={onToggle}
            title={callingReferee ? '取消呼叫審判官' : '呼叫審判官'}
        >
            <span className="icon">⚠️</span>
            <span className="text">{callingReferee ? '取消呼叫' : '呼叫審判官'}</span>
        </button>
    )
}

// 2. 重生區塊渲染（需在 MapContainer 內使用）
export function SpawnZones({ zones }) {
    if (!zones) return null

    return zones.map((zone, i) => (
        <Rectangle
            key={`zone-${i}`}
            bounds={zone.bounds}
            pathOptions={{
                color: zone.color,
                fillColor: zone.color,
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '8, 6'
            }}
        />
    ))
}

// 3. 敵人標記（雷達功能，需在 MapContainer 內使用）
export function EnemyMarkers({ enemies, active }) {
    if (!active || !enemies) return null

    return enemies.map((enemy, i) => (
        <Marker
            key={`enemy-${i}`}
            position={[enemy.lat, enemy.lng]}
            icon={createPlayerIcon('#e74c3c', false, enemy.heading)}
        >
            <Popup>敵人</Popup>
        </Marker>
    ))
}
