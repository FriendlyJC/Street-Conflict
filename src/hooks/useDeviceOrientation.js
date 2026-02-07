import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useDeviceOrientation - 羅盤方位 Hook
 * 監聽裝置方位感應器，提供平滑後的方位角度
 */
export function useDeviceOrientation() {
    const [deviceHeading, setDeviceHeading] = useState(null)
    const lastHeading = useRef(null)
    const filterWeight = 0.2 // 濾波權重 (0-1)，越小越平滑但延遲越高

    // Handle device orientation for compass heading (Android priority)
    const handleOrientation = useCallback((event) => {
        // alpha is 0 when pointing north, increases clockwise on most Androids
        if (typeof event.alpha === 'number') {
            let currentAlpha = event.alpha

            // Fix inverse rotation: 
            // Many browsers return alpha in a way that feels inverted on maps.
            // We convert it to a value that matches our map's North-origin clockwise system.
            let normalizedHeading = (360 - currentAlpha) % 360

            // Smoothing (Low-pass filter / EMA)
            if (lastHeading.current === null) {
                lastHeading.current = normalizedHeading
            } else {
                // Logic to handle 359 -> 0 degree wrap-around smoothing
                let diff = normalizedHeading - lastHeading.current
                if (diff > 180) diff -= 360
                if (diff < -180) diff += 360

                lastHeading.current = lastHeading.current + (diff * filterWeight)
                // Normalize back to 0-360
                lastHeading.current = (lastHeading.current + 360) % 360
            }

            setDeviceHeading(lastHeading.current)
        }
    }, [])

    // Start listening to orientation events
    const startOrientationListener = useCallback(() => {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true)
            // Fallback for devices that don't support absolute
            window.addEventListener('deviceorientation', handleOrientation, true)
        }
    }, [handleOrientation])

    // Stop listening to orientation events
    const stopOrientationListener = useCallback(() => {
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
        window.removeEventListener('deviceorientation', handleOrientation, true)
    }, [handleOrientation])

    // Manual request for compass permission (required for iOS, helpful for debugging)
    const requestCompassPermission = useCallback(async () => {
        console.log('Requesting compass permission...')
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+
            try {
                const response = await DeviceOrientationEvent.requestPermission()
                if (response === 'granted') {
                    console.log('Compass permission granted')
                    return true
                }
            } catch (err) {
                console.error('Compass permission error:', err)
                return false
            }
        } else {
            // Android or others - already listening, but this helps trigger interaction
            console.log('Compass permission not needed or not supported on this device')
            // Manually trigger a check
            if (window.DeviceOrientationEvent) {
                window.dispatchEvent(new Event('deviceorientation'))
            }
            return true
        }
        return false
    }, [])

    return {
        deviceHeading,
        startOrientationListener,
        stopOrientationListener,
        requestCompassPermission
    }
}

export default useDeviceOrientation
