import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useDeviceOrientation - 羅盤方位 Hook
 * 使用強化濾波和靜止鎖定防止震盪
 */
export function useDeviceOrientation() {
    const [deviceHeading, setDeviceHeading] = useState(null)
    const lastHeading = useRef(null)
    const lastRawHeading = useRef(null)
    const stableCount = useRef(0) // 穩定計數器
    const isLocked = useRef(false) // 靜止鎖定狀態

    // 濾波參數
    const STRONG_FILTER = 0.08  // 強濾波（靜止/慢速）
    const MEDIUM_FILTER = 0.25  // 中等濾波（中速）
    const WEAK_FILTER = 0.5     // 弱濾波（快速）
    const NOISE_THRESHOLD = 2   // 噪音閾值 2°
    const STABLE_THRESHOLD = 20 // 需要 20 次穩定讀數才鎖定
    const UNLOCK_THRESHOLD = 8  // 需要 >8° 變化才解鎖
    const LARGE_CHANGE = 15     // 大於 15° 視為快速移動

    // 計算角度差異（處理 360° 環繞）
    const angleDifference = (a, b) => {
        let diff = a - b
        if (diff > 180) diff -= 360
        if (diff < -180) diff += 360
        return diff
    }

    // 選擇濾波強度
    const getFilterWeight = (diff) => {
        const absDiff = Math.abs(diff)

        // 大幅度移動：弱濾波（快速響應）
        if (absDiff > LARGE_CHANGE) {
            stableCount.current = 0
            isLocked.current = false
            return WEAK_FILTER
        }

        // 小幅度移動：檢查是否穩定
        if (absDiff < NOISE_THRESHOLD) {
            stableCount.current = Math.min(stableCount.current + 1, STABLE_THRESHOLD + 10)

            // 達到穩定閾值：鎖定
            if (stableCount.current >= STABLE_THRESHOLD) {
                isLocked.current = true
            }
        } else {
            stableCount.current = Math.max(0, stableCount.current - 2)

            // 如果已鎖定但有中等變化，檢查是否需要解鎖
            if (isLocked.current && absDiff > UNLOCK_THRESHOLD) {
                isLocked.current = false
                stableCount.current = 0
            }
        }

        // 已穩定：強濾波
        if (stableCount.current >= STABLE_THRESHOLD) {
            return STRONG_FILTER
        }

        // 中等移動：中等濾波
        return MEDIUM_FILTER
    }

    // Handle device orientation for compass heading
    const handleOrientation = useCallback((event) => {
        // 驗證數據有效性
        if (typeof event.alpha !== 'number' || isNaN(event.alpha)) {
            return
        }

        // Fix inverse rotation
        let normalizedHeading = (360 - event.alpha) % 360

        // 檢測異常跳變（可能是傳感器錯誤）
        if (lastRawHeading.current !== null) {
            const rawDiff = Math.abs(angleDifference(normalizedHeading, lastRawHeading.current))

            // 如果原始數據突然跳變超過 100°，可能是傳感器錯誤，忽略
            if (rawDiff > 100 && stableCount.current > 5) {
                console.warn('Sensor glitch detected, ignoring reading:', rawDiff)
                return
            }
        }
        lastRawHeading.current = normalizedHeading

        // 初始化
        if (lastHeading.current === null) {
            lastHeading.current = normalizedHeading
            stableCount.current = 0
            isLocked.current = false
            setDeviceHeading(normalizedHeading)
            return
        }

        // 計算角度變化
        const diff = angleDifference(normalizedHeading, lastHeading.current)
        const absDiff = Math.abs(diff)

        // 如果已鎖定且變化很小：完全忽略更新
        if (isLocked.current && absDiff < UNLOCK_THRESHOLD) {
            return
        }

        // 如果已鎖定但變化足夠大：解鎖
        if (isLocked.current && absDiff >= UNLOCK_THRESHOLD) {
            isLocked.current = false
            stableCount.current = 0
        }

        // 選擇濾波強度
        const weight = getFilterWeight(diff)

        // 應用濾波
        let smoothedHeading = lastHeading.current + (diff * weight)
        smoothedHeading = (smoothedHeading + 360) % 360

        lastHeading.current = smoothedHeading
        setDeviceHeading(smoothedHeading)
    }, [])

    // Start listening to orientation events
    const startOrientationListener = useCallback(() => {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientationabsolute', handleOrientation, true)
            window.addEventListener('deviceorientation', handleOrientation, true)
        }
    }, [handleOrientation])

    // Stop listening to orientation events
    const stopOrientationListener = useCallback(() => {
        window.removeEventListener('deviceorientationabsolute', handleOrientation, true)
        window.removeEventListener('deviceorientation', handleOrientation, true)
        lastHeading.current = null
        lastRawHeading.current = null
        isLocked.current = false
        stableCount.current = 0
    }, [handleOrientation])

    // Manual request for compass permission
    const requestCompassPermission = useCallback(async () => {
        console.log('Requesting compass permission...')
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
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
            console.log('Compass permission not needed or not supported on this device')
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
