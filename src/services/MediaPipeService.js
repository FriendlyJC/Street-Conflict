import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

/**
 * MediaPipeService - AI 人物偵測服務
 * 使用 MediaPipe Pose Landmarker 在本地端偵測人物
 * 所有處理皆在使用者設備上完成，確保隱私安全
 */
class MediaPipeService {
    constructor() {
        this.poseLandmarker = null
        this.isReady = false
        this.isInitializing = false
        this.lastDetectionTime = 0
        this.cachedResults = []
    }

    /**
     * 初始化 MediaPipe Pose Landmarker
     * @returns {Promise<boolean>} 初始化是否成功
     */
    async initialize() {
        if (this.isReady) return true
        if (this.isInitializing) return false

        this.isInitializing = true

        try {
            console.log('MediaPipe: 開始初始化...')

            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            )

            this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numPoses: 5 // 最多偵測 5 個人
            })

            this.isReady = true
            this.isInitializing = false
            console.log('MediaPipe: 初始化完成！')
            return true
        } catch (error) {
            console.error('MediaPipe: 初始化失敗', error)
            this.isInitializing = false
            return false
        }
    }

    /**
     * 從靜態影像 (Canvas 或 HTMLImageElement) 偵測人物
     * @param {HTMLCanvasElement|HTMLImageElement} imageElement - 影像元素
     * @returns {Array} 偵測到的人物及其身體部位邊界框
     */
    detectFromImage(imageElement) {
        if (!this.isReady || !imageElement) {
            console.error('MediaPipe: Service not ready or image missing')
            return []
        }

        try {
            // 當 runningMode 為 VIDEO 時，必須使用 detectForVideo 並提供時間戳
            // 使用 performance.now() 作為模擬時間戳
            const results = this.poseLandmarker.detectForVideo(imageElement, performance.now())
            return this.extractDetailedBoundingBoxes(results, imageElement)
        } catch (error) {
            console.error('MediaPipe: 單次偵測失敗', error)
            return []
        }
    }

    /**
     * 提取詳細的部位邊界框 (頭部、軀幹、腿部)
     */
    extractDetailedBoundingBoxes(results, videoElement) {
        if (!results.landmarks || results.landmarks.length === 0) {
            console.log('MediaPipe: 偵測成功但未發現人像')
            return []
        }

        const videoWidth = videoElement.videoWidth || videoElement.width || videoElement.clientWidth
        const videoHeight = videoElement.videoHeight || videoElement.height || videoElement.clientHeight

        // 可見度門檻：MediaPipe 提供 0.0 ~ 1.0 的信心度
        const VIS_THRESHOLD = 0.5

        return results.landmarks.map((landmarks) => {
            // 1. 整體邊界框 (用於初步過濾)
            const fullBody = this.getBoundingBoxFromLandmarks(landmarks, 0, 32, videoWidth, videoHeight, 0.01)

            // 2. 部位分段 (縮減 Padding 使其更精確)
            // 頭部: 0-10
            const head = this.getBoundingBoxFromLandmarks(landmarks, 0, 10, videoWidth, videoHeight, 0.02, VIS_THRESHOLD)

            // 軀幹: 肩膀(11,12) 到 臀部(23,24)
            const torsoIndices = [11, 12, 13, 14, 15, 16, 23, 24]
            const torso = this.getCustomBoundingBox(landmarks, torsoIndices, videoWidth, videoHeight, 0.02, VIS_THRESHOLD)

            // 腿部: 25-32
            const legs = this.getBoundingBoxFromLandmarks(landmarks, 25, 32, videoWidth, videoHeight, 0.02, VIS_THRESHOLD)

            return {
                ...fullBody,
                parts: { head, torso, legs }
            }
        }).filter(person => {
            // 過濾掉太小（雜訊）或完全沒有可見部位的人像
            const hasVisiblePart = person.parts.head || person.parts.torso || person.parts.legs
            return person.normalizedWidth > 0.02 && hasVisiblePart
        })
    }

    /**
     * 幫助函式：從一組連續的關鍵點計算邊界框
     */
    getBoundingBoxFromLandmarks(landmarks, start, end, width, height, padding = 0.05, visThreshold = 0) {
        let minX = 1, maxX = 0, minY = 1, maxY = 0
        let visibleCount = 0
        let totalCount = 0

        for (let i = start; i <= end; i++) {
            const lm = landmarks[i]
            if (lm) {
                totalCount++
                // 檢查關鍵點是否可靠（位於畫面內且可見度達標）
                const isVisible = (lm.visibility === undefined || lm.visibility > visThreshold)
                if (lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1 && isVisible) {
                    visibleCount++
                    if (lm.x < minX) minX = lm.x
                    if (lm.x > maxX) maxX = lm.x
                    if (lm.y < minY) minY = lm.y
                    if (lm.y > maxY) maxY = lm.y
                }
            }
        }

        // 若該區域可見關鍵點太少，判定該部位被遮擋不顯示
        if (visibleCount === 0 || (visThreshold > 0 && visibleCount / totalCount < 0.3)) return null

        // 加上邊距
        minX = Math.max(0, minX - padding)
        maxX = Math.min(1, maxX + padding)
        minY = Math.max(0, minY - padding)
        maxY = Math.min(1, maxY + padding)

        return {
            normalizedX: minX,
            normalizedY: minY,
            normalizedWidth: maxX - minX,
            normalizedHeight: maxY - minY,
            x: minX * width,
            y: minY * height,
            width: (maxX - minX) * width,
            height: (maxY - minY) * height,
            centerX: (minX + (maxX - minX) / 2) * width,
            centerY: (minY + (maxY - minY) / 2) * height
        }
    }

    /**
     * 幫助函式：從非連續的關鍵點列表計算邊界框
     */
    getCustomBoundingBox(landmarks, indices, width, height, padding = 0.05, visThreshold = 0) {
        let minX = 1, maxX = 0, minY = 1, maxY = 0
        let visibleCount = 0

        indices.forEach(i => {
            const lm = landmarks[i]
            if (lm) {
                const isVisible = (lm.visibility === undefined || lm.visibility > visThreshold)
                if (lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1 && isVisible) {
                    visibleCount++
                    if (lm.x < minX) minX = lm.x
                    if (lm.x > maxX) maxX = lm.x
                    if (lm.y < minY) minY = lm.y
                    if (lm.y > maxY) maxY = lm.y
                }
            }
        })

        if (visibleCount === 0 || (visThreshold > 0 && visibleCount / indices.length < 0.3)) return null

        minX = Math.max(0, minX - padding)
        maxX = Math.min(1, maxX + padding)
        minY = Math.max(0, minY - padding)
        maxY = Math.min(1, maxY + padding)

        return {
            normalizedX: minX,
            normalizedY: minY,
            normalizedWidth: maxX - minX,
            normalizedHeight: maxY - minY,
            x: minX * width,
            y: minY * height,
            width: (maxX - minX) * width,
            height: (maxY - minY) * height,
            centerX: (minX + (maxX - minX) / 2) * width,
            centerY: (minY + (maxY - minY) / 2) * height
        }
    }

    /**
     * 命中判定 - 隨機殺戮模式 (強化版)
     */
    checkHit(crosshair, people, config = {}) {
        const { samplePoints = 1, hitThreshold = 1 } = config

        if (!people || people.length === 0) {
            return { hit: false, hitPoints: [], personIndex: -1 }
        }

        const hitPoints = []
        let finalHitIdx = -1

        // 模擬射擊判斷
        for (let i = 0; i < samplePoints; i++) {
            const angle = Math.random() * 2 * Math.PI
            const distance = Math.sqrt(Math.random()) * crosshair.radius

            const pointX = crosshair.centerX + Math.cos(angle) * distance
            const pointY = crosshair.centerY + Math.sin(angle) * distance

            // 檢查是否射中任何人的「有效部位」
            for (let j = 0; j < people.length; j++) {
                const person = people[j]
                const p = person.parts

                // 優先判定部位，而非大包圍框
                const parts = [p.head, p.torso, p.legs].filter(part => part !== null)
                let hitAnyPart = false

                for (const part of parts) {
                    if (
                        pointX >= part.normalizedX &&
                        pointX <= part.normalizedX + part.normalizedWidth &&
                        pointY >= part.normalizedY &&
                        pointY <= part.normalizedY + part.normalizedHeight
                    ) {
                        hitAnyPart = true
                        break
                    }
                }

                if (hitAnyPart) {
                    hitPoints.push({ x: pointX, y: pointY, personIndex: j })
                    finalHitIdx = j
                    break // 該點判定命中
                }
            }
        }

        return {
            hit: hitPoints.length >= hitThreshold,
            hitPoints,
            hitCount: hitPoints.length,
            personIndex: finalHitIdx,
            totalPeople: people.length
        }
    }

    /**
     * 根據武器類型獲取準心設定 (更新版)
     * Rifle/Sniper: 單點判定 (samplePoints: 1)
     * Shotgun: 多點判定 (samplePoints: 12)
     */
    getCrosshairConfig(weapon, aimMode) {
        const configs = {
            shotgun: {
                radius: aimMode ? 0.08 : 0.12,
                samplePoints: 12, // 12 發散彈彈珠
                hitThreshold: 1
            },
            rifle: {
                radius: aimMode ? 0.03 : 0.06,
                samplePoints: 1, // 僅限單點
                hitThreshold: 1
            },
            sniper: {
                radius: aimMode === 'scope' ? 0.005 : 0.04, // 狙擊鏡半徑縮小提高難度
                samplePoints: 1, // 僅限單點
                hitThreshold: 1
            }
        }

        return configs[weapon] || configs.rifle
    }

    /**
     * 釋放資源
     */
    dispose() {
        if (this.poseLandmarker) {
            this.poseLandmarker.close()
            this.poseLandmarker = null
        }
        this.isReady = false
        this.cachedResults = []
    }
}

// 導出單例
export default new MediaPipeService()
