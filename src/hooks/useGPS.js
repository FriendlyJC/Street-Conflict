import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * useGPS - GPS 定位 Hook
 * 請求 GPS 權限並持續追蹤位置
 */
export function useGPS() {
    const [playerPosition, setPlayerPosition] = useState(null)
    const [gpsError, setGpsError] = useState(null)
    const [gpsPermission, setGpsPermission] = useState(null) // 'granted', 'denied', 'unsupported'
    const watchIdRef = useRef(null)

    // Start GPS tracking with permission request
    const startGPSTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setGpsError('GPS 不支援')
            setGpsPermission('unsupported')
            return
        }

        // Request GPS permission and start continuous tracking
        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                setGpsPermission('granted')
                const positionData = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    heading: position.coords.heading || null,
                    timestamp: Date.now()
                }
                setPlayerPosition(positionData)

                // Also store in localStorage for compatibility
                localStorage.setItem('streetconflict_gps_position', JSON.stringify(positionData))
                setGpsError(null)
            },
            (err) => {
                console.error('GPS error:', err)
                setGpsPermission('denied')
                setGpsError(`GPS 錯誤: ${err.message}`)
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 1000
            }
        )
    }, [])

    // Stop GPS tracking
    const stopGPSTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current)
            watchIdRef.current = null
        }
    }, [])

    // Load GPS position from localStorage (fallback/compatibility)
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
        gpsPermission,
        startGPSTracking,
        stopGPSTracking,
        loadGPSPosition,
        setPlayerPosition,
        setGpsError
    }
}

export default useGPS
