import { useState, useRef, useCallback } from 'react'

/**
 * useCamera - 相機控制 Hook
 * 管理手機相機的開關、串流、以及多個 video 元素的同步
 */
export function useCamera() {
    const videoRef = useRef(null)
    const videoZoomedRef = useRef(null) // For scope zoomed layer (CSS method)
    const scopeCanvasRef = useRef(null) // For scope canvas rendering (performance optimized)

    const [cameraEnabled, setCameraEnabled] = useState(true)
    const [cameraStream, setCameraStream] = useState(null)
    const [cameraError, setCameraError] = useState(null)
    const [zoomMethod, setZoomMethod] = useState('software') // 'software' | 'hardware'

    // Start camera
    const startCamera = useCallback(async () => {
        // Stop any existing tracks first
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
        }

        try {
            // Priority: Try exact environment camera first
            let stream
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { exact: 'environment' },
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                })
            } catch (e) {
                console.warn('Exact environment camera failed, falling back to basic environment mode')
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                })
            }

            if (videoRef.current) {
                videoRef.current.srcObject = stream
            }
            if (videoZoomedRef.current) {
                videoZoomedRef.current.srcObject = stream
            }
            setCameraStream(stream)
            setCameraError(null)
        } catch (err) {
            console.error('Camera error:', err)
            setCameraError('無法開啟相機')
        }
    }, [])

    // Stop camera
    const stopCamera = useCallback(() => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop())
            setCameraStream(null)
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
        if (videoZoomedRef.current) {
            videoZoomedRef.current.srcObject = null
        }
    }, [cameraStream])

    // Toggle camera
    const toggleCamera = useCallback(() => {
        if (cameraEnabled) {
            stopCamera()
            setCameraEnabled(false)
        } else {
            setCameraEnabled(true)
            startCamera()
        }
    }, [cameraEnabled, stopCamera, startCamera])

    /**
     * 套用硬體變焦 (Hardware Zoom)
     * @param {number} zoomValue - 變焦倍率 (例如 1.0, 3.0, 10.0)
     * @returns {Promise<boolean>} 是否套用成功
     */
    const applyHardwareZoom = useCallback(async (zoomValue) => {
        if (!cameraStream) return false

        const track = cameraStream.getVideoTracks()[0]
        if (!track) return false

        try {
            const capabilities = track.getCapabilities()
            if (!capabilities.zoom) {
                console.warn('Camera: 當前相機硬體不支援變焦')
                return false
            }

            // 限制在硬體支援範圍內
            const min = capabilities.zoom.min || 1
            const max = capabilities.zoom.max || 1
            const clampedZoom = Math.min(Math.max(zoomValue, min), max)

            console.log(`Camera: 嘗試套用硬體變焦: ${clampedZoom}x (範圍: ${min}-${max})`)
            await track.applyConstraints({
                advanced: [{ zoom: clampedZoom }]
            })
            return true
        } catch (err) {
            console.error('Camera: 硬體變焦套用失敗', err)
            return false
        }
    }, [cameraStream])

    // Sync stream to video elements (call when refs change)
    const syncStreamToVideos = useCallback(() => {
        if (cameraStream) {
            if (videoRef.current) {
                videoRef.current.srcObject = cameraStream
            }
            if (videoZoomedRef.current) {
                videoZoomedRef.current.srcObject = cameraStream
            }
        }
    }, [cameraStream])

    // Toggle zoom method
    const toggleZoomMethod = useCallback((defaultMinZoom = 1) => {
        setZoomMethod(prev => {
            const next = prev === 'software' ? 'hardware' : 'software'
            console.log(`Camera: 切換變焦模式至: ${next}`)

            // Note: Caller should sync zoomLevel to defaultMinZoom
            if (next === 'software') {
                applyHardwareZoom(1.0)
            }
            return next
        })
    }, [applyHardwareZoom])

    return {
        // Refs
        videoRef,
        videoZoomedRef,
        scopeCanvasRef,
        // State
        cameraEnabled,
        cameraStream,
        cameraError,
        zoomMethod,
        // Actions
        startCamera,
        stopCamera,
        toggleCamera,
        syncStreamToVideos,
        applyHardwareZoom,
        setCameraEnabled,
        setZoomMethod,
        toggleZoomMethod
    }
}

export default useCamera
