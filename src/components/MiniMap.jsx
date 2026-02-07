import { useState, useRef, useEffect } from 'react'
import './MiniMap.css'

// Mock player data
const mockPlayers = {
    self: { id: '1', lat: 47.3769, lng: 8.5417, heading: 45, team: 'A' },
    teammates: [
        { id: '2', lat: 47.3775, lng: 8.5425, heading: 120, team: 'A' },
        { id: '3', lat: 47.3760, lng: 8.5400, heading: 270, team: 'A' }
    ],
    referees: [
        { id: '4', lat: 47.3780, lng: 8.5410, heading: 0 }
    ],
    enemies: [] // Only shown with radar item
}

// Mock boundary (simplified polygon)
const mockBoundary = [
    { lat: 47.3800, lng: 8.5380 },
    { lat: 47.3800, lng: 8.5450 },
    { lat: 47.3740, lng: 8.5450 },
    { lat: 47.3740, lng: 8.5380 }
]

function MiniMap({ onClose }) {
    const mapRef = useRef(null)
    const [scale, setScale] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [activeItem, setActiveItem] = useState(null) // 'radar', 'flash', 'airstrike'

    // Touch handling for pinch zoom and rotate
    const [touchState, setTouchState] = useState({
        touches: [],
        initialDistance: 0,
        initialAngle: 0,
        initialScale: 1,
        initialRotation: 0
    })

    const handleTouchStart = (e) => {
        if (e.touches.length === 2) {
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )
            const angle = Math.atan2(
                touch2.clientY - touch1.clientY,
                touch2.clientX - touch1.clientX
            ) * (180 / Math.PI)

            setTouchState({
                touches: Array.from(e.touches),
                initialDistance: distance,
                initialAngle: angle,
                initialScale: scale,
                initialRotation: rotation
            })
        }
    }

    const handleTouchMove = (e) => {
        if (e.touches.length === 2 && touchState.initialDistance) {
            const touch1 = e.touches[0]
            const touch2 = e.touches[1]
            const distance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            )
            const angle = Math.atan2(
                touch2.clientY - touch1.clientY,
                touch2.clientX - touch1.clientX
            ) * (180 / Math.PI)

            // Calculate new scale
            const newScale = Math.max(0.5, Math.min(3,
                touchState.initialScale * (distance / touchState.initialDistance)
            ))
            setScale(newScale)

            // Calculate new rotation
            const newRotation = touchState.initialRotation + (angle - touchState.initialAngle)
            setRotation(newRotation)
        }
    }

    const handleTouchEnd = () => {
        setTouchState({
            touches: [],
            initialDistance: 0,
            initialAngle: 0,
            initialScale: scale,
            initialRotation: rotation
        })
    }

    const handleItemDrag = (e, item) => {
        // TODO: Implement drag for flash/airstrike
        console.log('Dragging item:', item)
    }

    return (
        <div className="minimap-overlay">
            {/* Close button */}
            <button className="minimap-close-btn" onClick={onClose}>
                ✕
            </button>

            {/* Map Header */}
            <div className="map-header">
                <span>D2-C2102</span>
                <span>5K ★</span>
                <span>開晴</span>
                <span>15:33</span>
            </div>

            {/* Map Container */}
            <div
                className="map-container"
                ref={mapRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="map-content"
                    style={{
                        transform: `scale(${scale}) rotate(${rotation}deg)`
                    }}
                >
                    {/* Simplified map background - in real app, use Leaflet */}
                    <div className="map-background">
                        <div className="map-grid" />
                    </div>

                    {/* Boundary */}
                    <svg className="boundary-svg" viewBox="0 0 100 100">
                        <polygon
                            points="10,10 90,10 90,90 10,90"
                            className="boundary-polygon"
                        />
                    </svg>

                    {/* Players */}
                    {/* Self (Yellow) */}
                    <div
                        className="player-marker self"
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) rotate(${mockPlayers.self.heading}deg)`
                        }}
                    >
                        <div className="player-cone" />
                        <div className="player-dot" />
                    </div>

                    {/* Teammates (Blue) */}
                    {mockPlayers.teammates.map((player, i) => (
                        <div
                            key={player.id}
                            className="player-marker teammate"
                            style={{
                                left: `${30 + i * 20}%`,
                                top: `${40 + i * 15}%`,
                                transform: `rotate(${player.heading}deg)`
                            }}
                        >
                            <div className="player-dot" />
                        </div>
                    ))}

                    {/* Referees (Green) */}
                    {mockPlayers.referees.map((player, i) => (
                        <div
                            key={player.id}
                            className="player-marker referee"
                            style={{
                                left: `${70}%`,
                                top: `${30}%`,
                                transform: `rotate(${player.heading}deg)`
                            }}
                        >
                            <div className="player-dot" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Item Bar */}
            <div className="item-bar">
                <button
                    className={`item-btn ${activeItem === 'radar' ? 'active' : ''}`}
                    onClick={() => setActiveItem('radar')}
                >
                    <span className="item-icon">📡</span>
                    <span className="item-name">雷達</span>
                </button>
                <button
                    className={`item-btn ${activeItem === 'flash' ? 'active' : ''}`}
                    onClick={() => setActiveItem('flash')}
                >
                    <span className="item-icon">💥</span>
                    <span className="item-name">閃光</span>
                </button>
                <button
                    className={`item-btn ${activeItem === 'airstrike' ? 'active' : ''}`}
                    onClick={() => setActiveItem('airstrike')}
                >
                    <span className="item-icon">✈️</span>
                    <span className="item-name">空襲</span>
                </button>
            </div>
        </div>
    )
}

export default MiniMap
