import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './BoundaryDrawer.css'

// Component to handle drawing
function DrawingHandler({ isDrawing, onPointAdded }) {
    const map = useMap()

    useMapEvents({
        click(e) {
            if (isDrawing) {
                onPointAdded(e.latlng)
            }
        }
    })

    useEffect(() => {
        if (isDrawing) {
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
    }, [isDrawing, map])

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

function BoundaryDrawer({ playerPosition, onSave, onClose }) {
    const [isDrawing, setIsDrawing] = useState(false)
    const [points, setPoints] = useState([])

    const defaultPosition = playerPosition || { lat: 25.0330, lng: 121.5654 }

    const handlePointAdded = (latlng) => {
        setPoints(prev => [...prev, [latlng.lat, latlng.lng]])
    }

    const handleRemovePoint = (index) => {
        setPoints(prev => prev.filter((_, i) => i !== index))
    }

    const handleSave = () => {
        if (points.length < 3) {
            alert('至少需要 3 個點才能形成邊界！')
            return
        }
        onSave(points)
    }

    const handleClear = () => {
        setPoints([])
    }

    return (
        <div className="boundary-drawer-overlay">
            {/* Top controls */}
            <div className="boundary-controls">
                {/* Save button (left) */}
                <button
                    className="control-btn save-btn"
                    onClick={handleSave}
                    disabled={points.length < 3}
                >
                    ✓
                </button>

                {/* Title */}
                <div className="boundary-title">
                    點擊地圖設定邊界點
                    <span className="point-count">{points.length} 個點</span>
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
                        isDrawing={isDrawing}
                        onPointAdded={handlePointAdded}
                    />

                    <BoundaryPolygon points={points} />
                    <PointMarkers points={points} onRemovePoint={handleRemovePoint} />
                </MapContainer>
            </div>

            {/* Bottom controls */}
            <div className="boundary-bottom-controls">
                <button
                    className={`tool-btn pen-btn ${isDrawing ? 'active' : ''}`}
                    onClick={() => setIsDrawing(!isDrawing)}
                >
                    🖊️ {isDrawing ? '停止繪製' : '開始繪製'}
                </button>

                <button
                    className="tool-btn clear-btn"
                    onClick={handleClear}
                    disabled={points.length === 0}
                >
                    🗑️ 清除
                </button>

                <div className="instruction-text">
                    {isDrawing ? '點擊地圖添加邊界點' : '點擊畫筆啟用繪製模式'}
                </div>
            </div>
        </div>
    )
}

export default BoundaryDrawer
