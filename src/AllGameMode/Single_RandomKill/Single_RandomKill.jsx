import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import WeaponCarousel from '../../components/WeaponCarousel'
import BigMapForAll from '../../components/BigMapForAll'
import MiniMapOverlay from '../../components/MiniMapOverlay'
import AimingView from '../../components/AimingView/AimingView'
import AIResultPortal from '../../components/AIResultPortal/AIResultPortal'
import { useCamera, useGPS, useDeviceOrientation, useWeapon, useShooting } from '../../hooks'
import MediaPipeService from '../../services/MediaPipeService'
import '../../pages/Game.css'

function Single_RandomKill() {
    const navigate = useNavigate()
    const location = useLocation()
    const canvasRef = useRef(null)

    // Get game settings from navigation state
    const gameSettings = location.state || {
        mode: 'randomKill',
        mapSize: 'infinite',
        duration: 15
    }

    // Use modular hooks
    const {
        videoRef,
        videoZoomedRef,
        scopeCanvasRef,
        cameraEnabled,
        cameraStream,
        cameraError,
        startCamera,
        stopCamera,
        toggleCamera,
        applyHardwareZoom,
        zoomMethod,
        toggleZoomMethod,
        setZoomMethod,
        syncStreamToVideos
    } = useCamera()

    const {
        playerPosition,
        gpsPermission,
        startGPSTracking,
        stopGPSTracking,
        loadGPSPosition
    } = useGPS()

    const {
        deviceHeading,
        startOrientationListener,
        stopOrientationListener,
        requestCompassPermission
    } = useDeviceOrientation()

    const {
        selectedWeapon,
        aimMode,
        zoomLevel,
        focusMode,
        zoomConfig,
        setSelectedWeapon,
        setAimMode,
        setZoomLevel,
        handleIronSight,
        handleScope,
        toggleFocus
    } = useWeapon('rifle')

    const {
        shootFlash,
        handleShoot: triggerShoot,
        playSound
    } = useShooting(videoRef, canvasRef)

    // Game-specific state
    const [showMiniMap, setShowMiniMap] = useState(false)
    const [showTestPortal, setShowTestPortal] = useState(false)
    const [isMediaPipeReady, setIsMediaPipeReady] = useState(false)
    const [score, setScore] = useState(0)
    const [hitCount, setHitCount] = useState(0)
    const [shotCount, setShotCount] = useState(0)
    const [gameTime, setGameTime] = useState(gameSettings.duration * 60)
    const [gameStarted, setGameStarted] = useState(false)
    const [gameEnded, setGameEnded] = useState(false)
    const [lastHitFeedback, setLastHitFeedback] = useState(null)

    // Handle reload
    const handleReload = useCallback(() => {
        playSound('reload')
        console.log('Reload animation triggered')
    }, [playSound])

    // Initialize MediaPipe
    useEffect(() => {
        const initMediaPipe = async () => {
            const success = await MediaPipeService.initialize()
            setIsMediaPipeReady(success)
            if (success) {
                setGameStarted(true)
            }
        }
        initMediaPipe()
    }, [])

    // Initialize camera and GPS
    useEffect(() => {
        if (cameraEnabled) {
            startCamera()
        }

        // Start GPS tracking (will request permission)
        startGPSTracking()
        startOrientationListener()

        return () => {
            stopCamera()
            stopGPSTracking()
            stopOrientationListener()
        }
    }, [])

    // Game timer
    useEffect(() => {
        if (!gameStarted || gameEnded) return

        const timer = setInterval(() => {
            setGameTime(prev => {
                if (prev <= 1) {
                    setGameEnded(true)
                    clearInterval(timer)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [gameStarted, gameEnded])

    // Restart camera on aim mode change
    useEffect(() => {
        if (cameraEnabled && cameraStream) {
            // 使用 Hook 提供的同步功能確保新掛載的元素都接到串流
            syncStreamToVideos()
        }
    }, [aimMode, cameraEnabled, cameraStream, selectedWeapon, syncStreamToVideos])

    // Handle Hardware Zoom reset and Mode Defaulting
    useEffect(() => {
        if (!aimMode) {
            // 當關閉瞄準時，確保硬體焦距回復預設
            applyHardwareZoom(1.0)
            setZoomMethod('software')
        } else {
            // 每次重新開鏡，都預設回軟體算法，避免打結
            setZoomMethod('software')
        }
    }, [aimMode, applyHardwareZoom, setZoomMethod])

    // Apply hardware zoom when needed (Sync logic remains here as it depends on both hooks)
    useEffect(() => {
        if (!cameraEnabled) return

        if (zoomMethod === 'hardware') {
            applyHardwareZoom(zoomLevel)
        } else {
            applyHardwareZoom(1.0)
        }
    }, [zoomLevel, zoomMethod, cameraEnabled, applyHardwareZoom])

    // Reset Hardware Zoom specifically when exiting aim mode
    useEffect(() => {
        if (!aimMode) {
            applyHardwareZoom(1.0)
        }
    }, [aimMode, applyHardwareZoom])

    // Canvas rendering for Scope (Visual only)
    useEffect(() => {
        if (aimMode !== 'scope' || !scopeCanvasRef.current || !videoRef.current) {
            return
        }

        const canvas = scopeCanvasRef.current
        const video = videoRef.current
        const ctx = canvas.getContext('2d')
        let animationId

        const renderScope = () => {
            if (!video.videoWidth || !video.videoHeight) {
                animationId = requestAnimationFrame(renderScope)
                return
            }

            // 如果使用硬體變焦，則軟體層級的縮放倍率應固定為 1.0
            const effectiveZoom = zoomMethod === 'hardware' ? 1.0 : zoomLevel
            const sourceSize = Math.min(video.videoWidth, video.videoHeight) / effectiveZoom
            const sourceX = (video.videoWidth - sourceSize) / 2
            const sourceY = (video.videoHeight - sourceSize) / 2

            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(
                video,
                sourceX, sourceY, sourceSize, sourceSize,
                0, 0, canvas.width, canvas.height
            )

            animationId = requestAnimationFrame(renderScope)
        }

        animationId = requestAnimationFrame(renderScope)

        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
        }
    }, [aimMode, zoomLevel, selectedWeapon, scopeCanvasRef, videoRef, zoomMethod])

    const handleToggleZoom = useCallback(() => {
        toggleZoomMethod()
        // 切換時強制回到該武器的最小倍率
        setZoomLevel(zoomConfig.min)
    }, [toggleZoomMethod, setZoomLevel, zoomConfig.min])

    const handleShoot = useCallback(async () => {
        if (gameEnded || !isMediaPipeReady) return

        setShotCount(prev => prev + 1)

        // 如果使用硬體變焦，拍照擷取時就不需要再進行軟體放大
        const effectiveZoom = zoomMethod === 'hardware' ? 1.0 : zoomLevel

        await triggerShoot({
            weapon: selectedWeapon,
            aimMode: aimMode,
            zoomLevel: effectiveZoom,
            onHit: ({ isHeadshot, weapon: hitWeapon }) => {
                setHitCount(prev => prev + 1)

                // 單人隨機殺戮模式：計分規則與特效
                const scoreMap = { sniper: 100, rifle: 50, shotgun: 30 }
                let points = scoreMap[hitWeapon] || 50

                if (isHeadshot) {
                    points *= 2
                    console.log('HEADSHOT!')
                }

                setScore(prev => prev + points)
                setLastHitFeedback({ points, timestamp: Date.now() })
                setTimeout(() => setLastHitFeedback(null), 1000)
            }
        })
    }, [gameEnded, isMediaPipeReady, triggerShoot, selectedWeapon, aimMode, zoomLevel, zoomMethod])

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    if (gameEnded) {
        const accuracy = shotCount > 0 ? Math.round((hitCount / shotCount) * 100) : 0
        return (
            <div className="game-page">
                <div className="game-end-overlay">
                    <h1>遊戲結束</h1>
                    <div className="game-stats">
                        <div className="stat-item"><span className="stat-label">總分</span><span className="stat-value">{score}</span></div>
                        <div className="stat-item"><span className="stat-label">命中</span><span className="stat-value">{hitCount}</span></div>
                        <div className="stat-item"><span className="stat-label">射擊</span><span className="stat-value">{shotCount}</span></div>
                        <div className="stat-item"><span className="stat-label">命中率</span><span className="stat-value">{accuracy}%</span></div>
                    </div>
                    <div className="game-end-actions">
                        <button className="btn btn-primary" onClick={() => window.location.reload()}>再玩一次</button>
                        <button className="btn btn-secondary" onClick={() => navigate('/singleplayer')}>返回設定</button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="game-page">
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {shootFlash && <div className="shoot-flash" />}
            {lastHitFeedback && (
                <div className="hit-feedback">
                    <span className="hit-points">+{lastHitFeedback.points}</span>
                </div>
            )}

            {/* Camera View */}
            <div className={`camera-container ${!cameraEnabled ? 'disabled' : ''}`}>
                {cameraEnabled ? (
                    <>
                        {aimMode === 'scope' ? (
                            <div className={selectedWeapon === 'sniper' ? 'sniper-scope-view' : 'scope-view'}>
                                <video ref={videoRef} autoPlay playsInline muted className="camera-feed-hidden" />
                                {selectedWeapon !== 'sniper' && (
                                    <video ref={videoZoomedRef} autoPlay playsInline muted className="camera-feed scope-blurred" />
                                )}
                                <div className={`scope-zoom-container scope-${selectedWeapon}`}>
                                    <canvas ref={scopeCanvasRef} width={1920} height={1920} className="scope-canvas" />
                                </div>
                            </div>
                        ) : (
                            <video ref={videoRef} autoPlay playsInline muted
                                className={`camera-feed ${focusMode === 'scope' && aimMode ? 'blurred' : ''}`}
                            />
                        )}
                        {cameraError && <div className="camera-error"><span>⚠️ {cameraError}</span></div>}
                    </>
                ) : (
                    <div className="camera-off-overlay">
                        <span className="camera-off-text">鏡頭已關閉</span>
                        <span className="camera-off-hint">點擊 📸 開啟鏡頭</span>
                    </div>
                )}
            </div>

            {/* HUD */}
            <div className="top-hud">
                <div className="game-timer">⏱️ {formatTime(gameTime)}</div>
                <div className="game-score">🎯 {score}</div>
            </div>

            <div className="top-left-controls">
                <button className={`control-btn camera-toggle ${cameraEnabled ? 'active' : 'disabled'}`} onClick={toggleCamera}>
                    {cameraEnabled ? '📸' : '🚫'}
                </button>
            </div>

            {/* Settings Toggle - Only when aiming (Top Right) */}
            {aimMode && (
                <div className="top-right-controls">
                    <button className={`control-btn settings-btn ${zoomMethod === 'hardware' ? 'active' : ''}`} onClick={handleToggleZoom}>
                        {zoomMethod === 'software' ? '⚙️' : '🦾'}
                    </button>
                    <div className="zoom-method-hint">
                        {zoomMethod === 'hardware' ? '硬體變焦 (高畫質)' : '軟體變焦 (推薦)'}
                    </div>
                </div>
            )}

            <div className="ai-status">
                {isMediaPipeReady ? (
                    <span className="ai-ready">🤖 AI 已就緒 (開槍觸發辨識)</span>
                ) : (
                    <span className="ai-loading">⏳ AI 模型載入中...</span>
                )}
            </div>

            {/* Test Button - Bottom Left */}
            <div className="bottom-left-controls">
                <button className="control-btn test-btn" onClick={() => setShowTestPortal(true)}>
                    Test
                </button>
            </div>

            {!aimMode && <MiniMapOverlay playerPosition={playerPosition} onClick={() => setShowMiniMap(true)} />}

            {/* Controls */}
            <>
                {!aimMode && <div className="crosshair"><div className="crosshair-dot" /></div>}
                {aimMode && (
                    <div className="aiming-overlay">
                        <AimingView
                            weapon={selectedWeapon} mode={aimMode} zoomLevel={zoomLevel}
                            onZoomChange={setZoomLevel} zoomConfig={zoomConfig}
                            focusMode={focusMode} onToggleFocus={toggleFocus}
                        />
                    </div>
                )}
                <div className="right-controls">
                    {zoomConfig.hasIronSight && (
                        <button className={`control-btn ${aimMode === 'iron' ? 'active' : ''}`} onClick={handleIronSight}>
                            <span className="btn-icon">⊕</span>
                        </button>
                    )}
                    {zoomConfig.hasScope && (
                        <button className={`control-btn ${aimMode === 'scope' ? 'active' : ''}`} onClick={handleScope}>
                            <span className="btn-icon">🔍</span>
                        </button>
                    )}
                    <button className="control-btn" onClick={handleReload}><span className="btn-icon">R</span></button>
                </div>

                <div className="bottom-controls">
                    {!aimMode && (
                        <div className="weapon-section">
                            <WeaponCarousel selectedWeapon={selectedWeapon} onSelect={(id) => { setSelectedWeapon(id); setAimMode(null); setZoomLevel(1); }} />
                        </div>
                    )}
                    {aimMode && (
                        <div className="shoot-section centered">
                            <button className="shoot-btn" onClick={(e) => { e.stopPropagation(); handleShoot(); }}>
                                <span className="shoot-btn-inner" />
                            </button>
                        </div>
                    )}
                </div>
            </>

            {showMiniMap && (
                <BigMapForAll
                    onClose={() => setShowMiniMap(false)}
                    playerPosition={playerPosition ? { ...playerPosition, heading: deviceHeading !== null ? deviceHeading : playerPosition.heading } : null}
                    onRequestCompass={requestCompassPermission}
                    hasHeading={deviceHeading !== null}
                />
            )}

            {/* Test Portal */}
            {showTestPortal && <AIResultPortal onClose={() => setShowTestPortal(false)} />}
        </div>
    )
}

export default Single_RandomKill
