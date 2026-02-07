import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MiniMapOverlay.css'

function MiniMapOverlay({ playerPosition, onClick }) {
    const mapRef = useRef(null)
    const mapInstanceRef = useRef(null)
    const playerMarkerRef = useRef(null)

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return

        // Initialize map
        const map = L.map(mapRef.current, {
            center: [25.0330, 121.5654], // Default Taipei
            zoom: 17,
            zoomControl: false,
            attributionControl: false,
            dragging: false,
            scrollWheelZoom: false,
            doubleClickZoom: false,
            boxZoom: false,
            keyboard: false,
            tap: false
        })

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(map)

        // Create custom player marker (yellow dot)
        const playerIcon = L.divIcon({
            className: 'player-marker-mini',
            html: '<div class="player-dot"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })

        const playerMarker = L.marker([25.0330, 121.5654], { icon: playerIcon }).addTo(map)

        mapInstanceRef.current = map
        playerMarkerRef.current = playerMarker

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove()
                mapInstanceRef.current = null
            }
        }
    }, [])

    // Update map when player position changes
    useEffect(() => {
        if (!mapInstanceRef.current || !playerMarkerRef.current || !playerPosition) return

        const { lat, lng } = playerPosition
        const newLatLng = L.latLng(lat, lng)

        // Update marker position
        playerMarkerRef.current.setLatLng(newLatLng)

        // Center map on player
        mapInstanceRef.current.setView(newLatLng, 17, { animate: true })
    }, [playerPosition])

    return (
        <div className="mini-map-overlay" onClick={onClick}>
            <div ref={mapRef} className="mini-map-container" />
            {!playerPosition && (
                <div className="mini-map-loading">
                    <span>定位中...</span>
                </div>
            )}
        </div>
    )
}

export default MiniMapOverlay
