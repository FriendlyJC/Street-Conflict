import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import WeaponCarousel from '../components/WeaponCarousel'
import GameMiniMap from '../components/GameMiniMap'
import MiniMapOverlay from '../components/MiniMapOverlay'
import AimingView from '../components/AimingView/AimingView'
import AIResultPortal from '../components/AIResultPortal/AIResultPortal'
import { useCamera, useGPS, useDeviceOrientation, useWeapon, useShooting } from '../hooks'
import MediaPipeService from '../services/MediaPipeService'
import './Game.css'

function SinglePlayerGame() {
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
        toggleCamera
    } = useCamera()

    const {
        playerPosition,
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
        loadGPSPosition()
        const gpsInterval = setInterval(loadGPSPosition, 1000)
        startOrientationListener()

        return () => {
            stopCamera()
            clearInterval(gpsInterval)
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
            const restartCamera = async () => {
                await new Promise(resolve => setTimeout(resolve, 100))
                if (videoRef.current && cameraStream) {
                    videoRef.current.srcObject = cameraStream
                }
                if (aimMode === 'scope' && selectedWeapon !== 'sniper' && videoZoomedRef.current) {
                    videoZoomedRef.current.srcObject = cameraStream
                }
            }
            restartCamera()
        }
    }, [aimMode, cameraEnabled, cameraStream, selectedWeapon])

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

            const sourceSize = Math.min(video.videoWidth, video.videoHeight) / zoomLevel
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
    }, [aimMode, zoomLevel, selectedWeapon, scopeCanvasRef, videoRef])

    const handleShoot = useCallback(async () => {
        if (gameEnded || !isMediaPipeReady) return

        setShotCount(prev => prev + 1)

        await triggerShoot({
            weapon: selectedWeapon,
            aimMode: aimMode,
            zoomLevel: zoomLevel,
            onHit: (points) => {
                setHitCount(prev => prev + 1)
                setScore(prev => prev + points)
                setLastHitFeedback({ points, timestamp: Date.now() })
                setTimeout(() => setLastHitFeedback(null), 1000)
            }
        })
    }, [gameEnded, isMediaPipeReady, triggerShoot, selectedWeapon, aimMode, zoomLevel])

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
                <GameMiniMap
                    onClose={() => setShowMiniMap(false)}
                    playerPosition={playerPosition ? { ...playerPosition, heading: deviceHeading !== null ? deviceHeading : playerPosition.heading } : null}
                    currentPlayerRole="player"
                    onRequestCompass={requestCompassPermission}
                    hasHeading={deviceHeading !== null}
                />
            )}

            {/* Test Portal */}
            {showTestPortal && <AIResultPortal onClose={() => setShowTestPortal(false)} />}
        </div>
    )
}

export default SinglePlayerGame
