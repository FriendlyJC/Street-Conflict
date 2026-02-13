import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './BoundaryDrawer.css'
import { validateSpawnPointInBoundary, createZoneBounds, checkSpawnZonesOverlap, isPointInSpawnZone } from './spawnZoneUtils'

// Component to handle drawing and spawn point placement
function DrawingHandler({ mode, onPointAdded, onSpawnPointAdded, boundaryPoints }) {
    const map = useMap()

    useMapEvents({
        click(e) {
            if (mode === 'boundary') {
                onPointAdded(e.latlng)
            } else if (mode === 'spawn') {
                onSpawnPointAdded(e.latlng)
            }
        },
        contextmenu(e) {
            // Prevent default context menu
            e.originalEvent.preventDefault()
        }
    })

    useEffect(() => {
        if (mode !== 'none') {
            map.dragging.disable()
            map.scrollWheelZoom.disable()
            map.doubleClickZoom.disable()
            map.boxZoom.disable()
        } else {
            map.dragging.enable()
            map.scrollWheelZoom.enable()
            map.doubleClickZoom.enable()
            map.boxZoom.enable()
        }
    }, [mode, map])

    return null
}

// Component to render the boundary polygon
function BoundaryPolygon({ points }) {
    const map = useMap()
    const polygonRef = useRef(null)

    useEffect(() => {
        if (polygonRef.current) {
            map.removeLayer(polygonRef.current)
        }

        if (points.length >= 2) {
            const polygon = L.polygon(points, {
                color: '#e74c3c',
                fillColor: '#e74c3c',
                fillOpacity: 0.1,
                weight: 3,
                dashArray: '10, 10'
            })

            polygon.addTo(map)
            polygonRef.current = polygon
        }

        return () => {
            if (polygonRef.current) {
                map.removeLayer(polygonRef.current)
            }
        }
    }, [points, map])

    return null
}

// Component to render point markers
function PointMarkers({ points, onRemovePoint }) {
    const map = useMap()
    const markersRef = useRef([])

    useEffect(() => {
        // Remove old markers
        markersRef.current.forEach(marker => map.removeLayer(marker))
        markersRef.current = []

        // Add new markers
        points.forEach((point, index) => {
            const marker = L.circleMarker(point, {
                radius: 6,
                fillColor: '#e74c3c',
                color: '#fff',
                weight: 2,
                fillOpacity: 1
            })

            marker.on('click', () => {
                if (onRemovePoint) {
                    onRemovePoint(index)
                }
            })

            marker.addTo(map)
            markersRef.current.push(marker)
        })

        return () => {
            markersRef.current.forEach(marker => map.removeLayer(marker))
        }
    }, [points, map, onRemovePoint])

    return null
}

// Component to render spawn point markers and zones
function SpawnPointMarkers({ spawnPoints, onRemoveSpawnPoint, boundaryPoints }) {
    const map = useMap()
    const layersRef = useRef([])

    useEffect(() => {
        // Remove old layers
        layersRef.current.forEach(layer => map.removeLayer(layer))
        layersRef.current = []

        // Add new spawn points
        spawnPoints.forEach((point, index) => {
            const color = index === 0 ? '#3498db' : '#e74c3c'
            const label = index === 0 ? '藍' : '紅'

            // Create 20m×20m zone preview
            const zoneBounds = createZoneBounds({ lat: point[0], lng: point[1] })
            const zone = L.rectangle(zoneBounds, {
                color: color,
                fillColor: color,
                fillOpacity: 0.15,
                weight: 2,
                dashArray: '8, 6'
            })

            // Create marker (larger for mobile)
            const marker = L.circleMarker(point, {
                radius: 15,
                fillColor: color,
                color: '#fff',
                weight: 3,
                fillOpacity: 1
            })

            // Add label
            const icon = L.divIcon({
                className: 'spawn-point-label',
                html: `<div style="background: ${color}; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold; font-size: 12px;">${label}</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, -15]
            })
            const labelMarker = L.marker(point, { icon })

            // Click to remove (mobile-friendly)
            marker.on('click', (e) => {
                L.DomEvent.stopPropagation(e)
                if (onRemoveSpawnPoint) {
                    onRemoveSpawnPoint(index)
                }
            })

            zone.addTo(map)
            marker.addTo(map)
            labelMarker.addTo(map)

            layersRef.current.push(zone, marker, labelMarker)
        })

        return () => {
            layersRef.current.forEach(layer => map.removeLayer(layer))
        }
    }, [spawnPoints, map, onRemoveSpawnPoint, boundaryPoints])

    return null
}

function BoundaryDrawer({ playerPosition, onSave, onClose }) {
    const [mode, setMode] = useState('none') // 'none', 'boundary', 'spawn'
    const [points, setPoints] = useState([])
    const [spawnPoints, setSpawnPoints] = useState([])

    const defaultPosition = playerPosition || { lat: 25.0330, lng: 121.5654 }

    const handlePointAdded = (latlng) => {
        setPoints(prev => [...prev, [latlng.lat, latlng.lng]])
    }

    const handleRemovePoint = (index) => {
        setPoints(prev => prev.filter((_, i) => i !== index))
    }

    const handleSpawnPointAdded = (latlng) => {
        const clickPoint = { lat: latlng.lat, lng: latlng.lng }

        // Check if clicking inside an existing spawn zone to remove it
        for (let i = 0; i < spawnPoints.length; i++) {
            const spawnCenter = { lat: spawnPoints[i][0], lng: spawnPoints[i][1] }
            if (isPointInSpawnZone(clickPoint, spawnCenter)) {
                // Remove this spawn point
                handleRemoveSpawnPoint(i)
                return
            }
        }

        // Maximum 2 spawn points
        if (spawnPoints.length >= 2) {
            alert('最多只能放置 2 個重生點！')
            return
        }

        // Validate spawn point is within boundary
        const spawnCenter = { lat: latlng.lat, lng: latlng.lng }
        const isValid = validateSpawnPointInBoundary(spawnCenter, points, null, null)

        if (!isValid) {
            alert('請將重生點放置於遊戲邊界內！')
            return
        }

        // Check overlap with existing spawn point
        if (spawnPoints.length === 1) {
            const existingPoint = { lat: spawnPoints[0][0], lng: spawnPoints[0][1] }
            if (checkSpawnZonesOverlap(spawnCenter, existingPoint)) {
                alert('重生點間距離太小，不可重疊！')
                return
            }
        }

        setSpawnPoints(prev => [...prev, [latlng.lat, latlng.lng]])
    }

    const handleRemoveSpawnPoint = (index) => {
        setSpawnPoints(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        if (points.length < 3) {
            alert('至少需要 3 個點才能形成邊界！')
            return
        }

        if (spawnPoints.length !== 2) {
            alert('請設定重生點！')
            return
        }

        onSave({
            boundary: points,
            spawnPoints: spawnPoints
        })
    }

    const handleClear = () => {
        setPoints([])
        setSpawnPoints([])
        setMode('none')
    }

    const toggleBoundaryMode = () => {
        if (mode === 'boundary') {
            setMode('none')
        } else {
            setMode('boundary')
        }
    }

    const toggleSpawnMode = () => {
        if (points.length < 3) {
            alert('請先繪製邊界！')
            return
        }

        if (mode === 'spawn') {
            setMode('none')
        } else {
            setMode('spawn')
        }
    }

    return (
        <div className="boundary-drawer-overlay">
            {/* Top controls */}
            <div className="boundary-controls">
                {/* Save button (left) */}
                <button
                    className="control-btn save-btn"
                    onClick={handleSave}
                    disabled={points.length < 3 || spawnPoints.length !== 2}
                >
                    ✓
                </button>

                {/* Title */}
                <div className="boundary-title">
                    自訂地圖設定
                    <span className="point-count">
                        邊界: {points.length} 點 | 重生點: {spawnPoints.length}/2
                    </span>
                </div>

                {/* Close button (right) */}
                <button className="control-btn close-btn" onClick={onClose}>
                    ✕
                </button>
            </div>

            {/* Map */}
            <div className="boundary-map-container">
                <MapContainer
                    center={[defaultPosition.lat, defaultPosition.lng]}
                    zoom={17}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={true}
                    attributionControl={false}
                >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <DrawingHandler
                        mode={mode}
                        onPointAdded={handlePointAdded}
                        onSpawnPointAdded={handleSpawnPointAdded}
                        boundaryPoints={points}
                    />

                    <BoundaryPolygon points={points} />
                    <PointMarkers points={points} onRemovePoint={handleRemovePoint} />
                    <SpawnPointMarkers
                        spawnPoints={spawnPoints}
                        onRemoveSpawnPoint={handleRemoveSpawnPoint}
                        boundaryPoints={points}
                    />
                </MapContainer>
            </div>

            {/* Bottom controls */}
            <div className="boundary-bottom-controls">
                <button
                    className={`tool-btn pen-btn ${mode === 'boundary' ? 'active' : ''}`}
                    onClick={toggleBoundaryMode}
                >
                    🖊️ {mode === 'boundary' ? '停止繪製邊界' : '繪製邊界'}
                </button>

                <button
                    className={`tool-btn spawn-btn ${mode === 'spawn' ? 'active' : ''}`}
                    onClick={toggleSpawnMode}
                    disabled={points.length < 3}
                >
                    📍 {mode === 'spawn' ? '停止設置重生點' : '設置重生點'}
                </button>

                <button
                    className="tool-btn clear-btn"
                    onClick={handleClear}
                    disabled={points.length === 0 && spawnPoints.length === 0}
                >
                    🗑️ 清除
                </button>

                <div className="instruction-text">
                    {mode === 'boundary' && '點擊地圖添加邊界點'}
                    {mode === 'spawn' && '點擊地圖放置 | 點擊標記刪除'}
                    {mode === 'none' && '選擇工具開始設定'}
                </div>
            </div>
        </div>
    )
}

export default BoundaryDrawer
