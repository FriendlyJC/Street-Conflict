import { useState, useCallback } from 'react'

/**
 * useGPS - GPS 定位 Hook
 * 從 localStorage 讀取 GPS 位置（由 Lobby 頁面更新）
 */
export function useGPS() {
    const [playerPosition, setPlayerPosition] = useState(null)
    const [gpsError, setGpsError] = useState(null)

    // Load GPS position from localStorage (updated by Lobby)
    const loadGPSPosition = useCallback(() => {
        try {
            const storedPosition = localStorage.getItem('streetconflict_gps_position')
            if (storedPosition) {
                const positionData = JSON.parse(storedPosition)
                // Check if position is recent (within 5 seconds)
                if (Date.now() - positionData.timestamp < 5000) {
                    setPlayerPosition({
                        lat: positionData.lat,
                        lng: positionData.lng,
                        accuracy: positionData.accuracy,
                        heading: positionData.heading
                    })
                    setGpsError(null)
                } else {
                    setGpsError('GPS 位置過期')
                }
            } else {
                setGpsError('GPS 未啟動')
            }
        } catch (err) {
            console.error('Failed to load GPS position:', err)
            setGpsError('GPS 讀取失敗')
        }
    }, [])

    return {
        playerPosition,
        gpsError,
        loadGPSPosition,
        setPlayerPosition,
        setGpsError
    }
}

export default useGPS
