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

    return {
        // Refs
        videoRef,
        videoZoomedRef,
        scopeCanvasRef,
        // State
        cameraEnabled,
        cameraStream,
        cameraError,
        // Actions
        startCamera,
        stopCamera,
        toggleCamera,
        syncStreamToVideos,
        setCameraEnabled
    }
}

export default useCamera
