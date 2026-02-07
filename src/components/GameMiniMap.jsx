import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './GameMiniMap.css'

// Fix Leaflet default marker issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png'
})

// Custom player icon
const createPlayerIcon = (color, isHost = false, heading = 0) => {
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

// Component to follow player position
function MapFollower({ position }) {
    const map = useMap()

    useEffect(() => {
        if (position) {
            map.setView([position.lat, position.lng], map.getZoom())
        }
    }, [position, map])

    return null
}

// Component to show player's field of view as a cone
function PlayerVisionCone({ position, heading }) {
    const map = useMap()
    const coneRef = useRef(null)

    useEffect(() => {
        if (!position || heading === null || heading === undefined) return

        // Remove previous cone
        if (coneRef.current) {
            map.removeLayer(coneRef.current)
        }

        // Calculate cone points
        const radius = 100 // 100 meters (10x original)
        const angle = 30 // 30 degrees total
        const startAngle = heading - angle / 2
        const endAngle = heading + angle / 2

        // Create arc points
        const points = [[position.lat, position.lng]] // Start from player position

        // Add arc points
        for (let i = 0; i <= 20; i++) {
            const currentAngle = startAngle + (angle * i / 20)
            const radians = (currentAngle * Math.PI) / 180

            // Calculate point at distance (approximation for small distances)
            const latOffset = (radius * Math.cos(radians)) / 111320 // 1 degree lat ≈ 111320m
            const lngOffset = (radius * Math.sin(radians)) / (111320 * Math.cos(position.lat * Math.PI / 180))

            points.push([
                position.lat + latOffset,
                position.lng + lngOffset
            ])
        }

        points.push([position.lat, position.lng]) // Close the cone

        // Create polygon
        const cone = L.polygon(points, {
            color: '#3498db',
            fillColor: '#3498db',
            fillOpacity: 0.2,
            weight: 1,
            opacity: 0.4
        })

        cone.addTo(map)
        coneRef.current = cone

        return () => {
            if (coneRef.current) {
                map.removeLayer(coneRef.current)
            }
        }
    }, [position, heading, map])

    return null
}

function GameMiniMap({ playerPosition, onClose, onRequestCompass, hasHeading }) {
    const mapRef = useRef(null)
    const [activeItem, setActiveItem] = useState(null)
    const [callingReferee, setCallingReferee] = useState(false) // 呼叫審判官狀態
    const [currentPlayerRole, setCurrentPlayerRole] = useState('player') // 'player' or 'referee'

    // Mock data for other players (will come from socket)
    const [teammates, setTeammates] = useState([])
    const [referees, setReferees] = useState([])
    const [enemies, setEnemies] = useState([]) // Only shown with radar

    // Game boundary (from room settings or default radius)
    const [customBoundary, setCustomBoundary] = useState(null)
    const [boundaryRadius, setBoundaryRadius] = useState(500) // Default 500m

    // Default position if GPS not available yet
    const defaultPosition = { lat: 25.0330, lng: 121.5654 } // Taipei
    const currentPosition = playerPosition || defaultPosition

    // Load room boundary from localStorage
    useEffect(() => {
        // TODO: Get roomId from props or context
        const roomId = window.location.pathname.split('/').pop()
        const storedBoundary = localStorage.getItem(`room_${roomId}_boundary`)

        if (storedBoundary) {
            try {
                const boundaryPoints = JSON.parse(storedBoundary)
                setCustomBoundary(boundaryPoints)
            } catch (err) {
                console.error('Failed to load custom boundary:', err)
            }
        }
    }, [])

    // Handle item usage
    const handleUseItem = (item) => {
        setActiveItem(item)

        switch (item) {
            case 'radar':
                // Show enemies for limited time
                console.log('Using radar...')
                // TODO: Request enemy positions from server
                break
            case 'flash':
                // Drag to place flashbang
                console.log('Place flashbang on map')
                break
            case 'airstrike':
                // Drag to place airstrike
                console.log('Place airstrike zone on map')
                break
        }
    }

    return (
        <div className="game-minimap-overlay">
            {/* Close button */}
            <button className="minimap-close-btn" onClick={onClose}>
                ✕
            </button>

            {/* Map Header */}
            <div className="map-header">
                <span className="room-info">房間: ABC123</span>
                <span className="player-count">玩家: 6/15</span>
                {playerPosition ? (
                    <span className="gps-status">📍 {playerPosition.accuracy?.toFixed(0)}m</span>
                ) : (
                    <span className="gps-status loading">📍 定位中...</span>
                )}
            </div>

            {/* Call Referee Button (only for combat players) */}
            {currentPlayerRole === 'player' && (
                <>
                    <button
                        className={`call-referee-btn ${callingReferee ? 'active' : ''}`}
                        onClick={() => setCallingReferee(!callingReferee)}
                        title={callingReferee ? '取消呼叫審判官' : '呼叫審判官'}
                    >
                        <span className="icon">⚠️</span>
                        <span className="text">{callingReferee ? '取消呼叫' : '呼叫審判官'}</span>
                    </button>

                    {/* Compass Button */}
                    <button
                        className={`compass-btn ${hasHeading ? 'active' : ''}`}
                        onClick={onRequestCompass}
                        title="啟動/校準羅盤"
                    >
                        <span className="icon">🧭</span>
                        <span className="text">{hasHeading ? '羅盤運作中' : '啟動羅盤'}</span>
                    </button>
                </>
            )}

            {/* Leaflet Map */}
            <div className="map-container">
                <MapContainer
                    ref={mapRef}
                    center={[currentPosition.lat, currentPosition.lng]}
                    zoom={17}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Follow player */}
                    <MapFollower position={playerPosition} />

                    {/* Player vision cone */}
                    {playerPosition && playerPosition.heading !== null && (
                        <PlayerVisionCone
                            position={playerPosition}
                            heading={playerPosition.heading}
                        />
                    )}

                    {/* Player marker (self - yellow) */}
                    {playerPosition && (
                        <>
                            <Marker
                                position={[playerPosition.lat, playerPosition.lng]}
                                icon={createPlayerIcon('#f1c40f', true, playerPosition.heading)}
                            >
                                <Popup>你的位置</Popup>
                            </Marker>

                            {/* Accuracy circle */}
                            <Circle
                                center={[playerPosition.lat, playerPosition.lng]}
                                radius={playerPosition.accuracy || 10}
                                pathOptions={{
                                    color: '#f1c40f',
                                    fillColor: '#f1c40f',
                                    fillOpacity: 0.1,
                                    weight: 1
                                }}
                            />
                        </>
                    )}

                    {/* Teammate markers (blue) */}
                    {teammates.map((player, i) => {
                        // For referee view: show calling players in red
                        const color = currentPlayerRole === 'referee' && player.callingReferee
                            ? '#e74c3c' // Red for calling players
                            : '#3498db' // Blue for normal teammates

                        return (
                            <Marker
                                key={`teammate-${i}`}
                                position={[player.lat, player.lng]}
                                icon={createPlayerIcon(color, false, player.heading)}
                            >
                                <Popup>
                                    {player.name}
                                    {currentPlayerRole === 'referee' && player.callingReferee && ' (呼叫中)'}
                                </Popup>
                            </Marker>
                        )
                    })}

                    {/* Referee markers (green) */}
                    {/* For combat players: only show when calling */}
                    {/* For referees: always show */}
                    {(currentPlayerRole === 'referee' || callingReferee) && referees.map((player, i) => (
                        <Marker
                            key={`referee-${i}`}
                            position={[player.lat, player.lng]}
                            icon={createPlayerIcon('#2ecc71')}
                        >
                            <Popup>{player.name} (審判官)</Popup>
                        </Marker>
                    ))}

                    {/* Enemy markers (red) - only when radar active */}
                    {activeItem === 'radar' && enemies.map((enemy, i) => (
                        <Marker
                            key={`enemy-${i}`}
                            position={[enemy.lat, enemy.lng]}
                            icon={createPlayerIcon('#e74c3c', false, enemy.heading)}
                        >
                            <Popup>敵人</Popup>
                        </Marker>
                    ))}

                    {/* Game boundary - custom polygon or fixed radius circle */}
                    {playerPosition && (
                        customBoundary ? (
                            // Custom boundary polygon
                            <Polygon
                                positions={customBoundary}
                                pathOptions={{
                                    color: '#e74c3c',
                                    fillColor: 'transparent',
                                    fillOpacity: 0,
                                    weight: 3,
                                    dashArray: '10, 10'
                                }}
                            />
                        ) : (
                            // Fixed radius circle
                            <Circle
                                center={[playerPosition.lat, playerPosition.lng]}
                                radius={boundaryRadius}
                                pathOptions={{
                                    color: '#e74c3c',
                                    fillColor: 'transparent',
                                    fillOpacity: 0,
                                    weight: 3,
                                    dashArray: '10, 10'
                                }}
                            />
                        )
                    )}
                </MapContainer>
            </div>

            {/* Legend */}
            <div className="map-legend">
                <div className="legend-item">
                    <span className="legend-dot self" /> 自己
                </div>
                <div className="legend-item">
                    <span className="legend-dot teammate" /> 隊友
                </div>
                <div className="legend-item">
                    <span className="legend-dot referee" /> 審判官
                </div>
                {activeItem === 'radar' && (
                    <div className="legend-item">
                        <span className="legend-dot enemy" /> 敵人
                    </div>
                )}
            </div>

            {/* Item Bar */}
            <div className="item-bar">
                <ItemButton
                    id="radar"
                    name="雷達"
                    image="/PNG/Radar.png"
                    active={activeItem === 'radar'}
                    onClick={() => handleUseItem('radar')}
                />
                <ItemButton
                    id="flash"
                    name="閃光"
                    image="/PNG/Flashbang.png"
                    active={activeItem === 'flash'}
                    onClick={() => handleUseItem('flash')}
                />
                <ItemButton
                    id="airstrike"
                    name="空襲"
                    image="/PNG/Airstrike.png"
                    active={activeItem === 'airstrike'}
                    onClick={() => handleUseItem('airstrike')}
                />
            </div>
        </div>
    )
}

// Item button component with multi-format support
function ItemButton({ id, name, image, active, onClick }) {
    const [imageSrc, setImageSrc] = useState(image)
    const [imageError, setImageError] = useState(false)
    const [formatIndex, setFormatIndex] = useState(0)

    const formats = ['png', 'jpg', 'jpeg', 'webp', 'gif']

    const tryNextFormat = () => {
        if (formatIndex >= formats.length - 1) {
            setImageError(true)
            return
        }

        const nextIndex = formatIndex + 1
        const basePath = image.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '')
        const nextSrc = `${basePath}.${formats[nextIndex]}`

        setFormatIndex(nextIndex)
        setImageSrc(nextSrc)
    }

    return (
        <button
            className={`item-btn ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            {imageError ? (
                <span className="item-placeholder">{id}</span>
            ) : (
                <img
                    src={imageSrc}
                    alt={name}
                    className="item-icon-img"
                    onError={tryNextFormat}
                />
            )}
            <span className="item-name">{name}</span>
        </button>
    )
}

export default GameMiniMap
