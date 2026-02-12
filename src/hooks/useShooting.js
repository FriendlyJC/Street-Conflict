import { useState, useCallback } from 'react'
import MediaPipeService from '../services/MediaPipeService'

/**
 * useShooting - 射擊邏輯 Hook (含測試除錯功能)
 */
export function useShooting(videoRef, canvasRef) {
    const [shootFlash, setShootFlash] = useState(false)

    const showShootFeedback = useCallback(() => {
        setShootFlash(true)
        setTimeout(() => setShootFlash(false), 100)
    }, [])

    const playSound = useCallback((soundName) => {
        const audio = new Audio(`/sounds/${soundName}.mp3`)
        audio.play().catch(err => console.warn(`Audio ${soundName} play failed:`, err))
    }, [])

    /**
     * 生成測試除錯圖片並存入 localStorage
     */
    const generateDebugImages = useCallback((canvas, people, hitResult, crosshairRadius) => {
        const ctx = canvas.getContext('2d')
        const width = canvas.width
        const height = canvas.height

        // --- 1. 儲存原始 Shoot ---
        localStorage.setItem('streetconflict_test_shoot', canvas.toDataURL('image/jpeg', 0.8))

        // --- 2. 製作 HumanRec (三色框：頭/軀幹/腿) ---
        const humanCanvas = document.createElement('canvas')
        humanCanvas.width = width
        humanCanvas.height = height
        const hCtx = humanCanvas.getContext('2d')
        hCtx.drawImage(canvas, 0, 0)

        people.forEach(person => {
            // 繪製頭部 (黃色)
            if (person.parts.head) {
                hCtx.strokeStyle = '#FFEB3B'
                hCtx.lineWidth = 3
                hCtx.strokeRect(person.parts.head.x, person.parts.head.y, person.parts.head.width, person.parts.head.height)
            }
            // 繪製軀幹 (紅色)
            if (person.parts.torso) {
                hCtx.strokeStyle = '#FF5252'
                hCtx.lineWidth = 4
                hCtx.strokeRect(person.parts.torso.x, person.parts.torso.y, person.parts.torso.width, person.parts.torso.height)
            }
            // 繪製腿部 (藍色)
            if (person.parts.legs) {
                hCtx.strokeStyle = '#448AFF'
                hCtx.lineWidth = 3
                hCtx.strokeRect(person.parts.legs.x, person.parts.legs.y, person.parts.legs.width, person.parts.legs.height)
            }
        })
        localStorage.setItem('streetconflict_test_human', humanCanvas.toDataURL('image/jpeg', 0.8))

        // --- 3. 製作 Result (人物框 + 螢光綠判定點) ---
        const resultCanvas = document.createElement('canvas')
        resultCanvas.width = width
        resultCanvas.height = height
        const rCtx = resultCanvas.getContext('2d')
        rCtx.drawImage(humanCanvas, 0, 0)

        // 畫出準心範圍 (輔助觀察)
        rCtx.strokeStyle = 'rgba(0, 255, 0, 0.2)'
        rCtx.beginPath()
        rCtx.arc(width / 2, height / 2, crosshairRadius * width, 0, Math.PI * 2)
        rCtx.stroke()

        // 畫出抽樣判定點
        rCtx.fillStyle = '#00FF00'
        hitResult.hitPoints.forEach(pt => {
            rCtx.beginPath()
            rCtx.arc(pt.x * width, pt.y * height, 6, 0, Math.PI * 2) // 6px 螢光綠標點
            rCtx.fill()
        })
        localStorage.setItem('streetconflict_test_result', resultCanvas.toDataURL('image/jpeg', 0.8))
    }, [])

    const handleShoot = useCallback(async ({ weapon, aimMode, zoomLevel, onHit }) => {
        if (!videoRef.current || !canvasRef.current) return

        const video = videoRef.current
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')

        playSound(weapon)
        showShootFeedback()

        // 影像擷取
        const sourceSize = Math.min(video.videoWidth, video.videoHeight) / zoomLevel
        const sourceX = (video.videoWidth - sourceSize) / 2
        const sourceY = (video.videoHeight - sourceSize) / 2

        canvas.width = 1080
        canvas.height = 1080

        ctx.drawImage(
            video,
            sourceX, sourceY, sourceSize, sourceSize,
            0, 0, canvas.width, canvas.height
        )

        // AI 辨識
        const people = MediaPipeService.detectFromImage(canvas)

        // 命中判定
        const crosshairConfig = MediaPipeService.getCrosshairConfig(weapon, aimMode)
        const hitResult = MediaPipeService.checkHit(
            { centerX: 0.5, centerY: 0.5, radius: crosshairConfig.radius },
            people,
            { samplePoints: crosshairConfig.samplePoints, hitThreshold: crosshairConfig.hitThreshold }
        )

        // 生成並儲存測試資料
        generateDebugImages(canvas, people, hitResult, crosshairConfig.radius)

        if (hitResult.hit) {
            playSound('hit')
            localStorage.setItem('streetconflict_hit_img', canvas.toDataURL('image/jpeg', 0.9))

            // 爆頭判定邏輯
            const isHeadshot = hitResult.hitPoints.some(pt => {
                const person = people[pt.personIndex]
                if (!person || !person.parts.head) return false
                const h = person.parts.head
                // 使用零件的正規化座標進行檢查
                return pt.x >= h.normalizedX && pt.x <= h.normalizedX + h.normalizedWidth &&
                    pt.y >= h.normalizedY && pt.y <= h.normalizedY + h.normalizedHeight
            })

            // 回傳命中詳細資料，讓呼叫者處理分數與特效
            if (onHit) {
                onHit({
                    isHeadshot,
                    weapon,
                    hitResult,
                    people
                })
            }
        }

        return { hitResult, people }
    }, [videoRef, canvasRef, playSound, showShootFeedback, generateDebugImages])

    return {
        shootFlash,
        handleShoot,
        playSound
    }
}

export default useShooting
