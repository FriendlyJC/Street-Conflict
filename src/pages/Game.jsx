import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import WeaponCarousel from '../components/WeaponCarousel'
import GameMiniMap from '../components/GameMiniMap'
import MiniMapOverlay from '../components/MiniMapOverlay'
import AimingView from '../components/AimingView/AimingView'
import { useCamera, useGPS, useDeviceOrientation, useWeapon, useShooting } from '../hooks'
import './Game.css'

function Game() {
    const { roomId } = useParams()
    const navigate = useNavigate()
    const canvasRef = useRef(null)

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
        syncStreamToVideos,
        applyHardwareZoom,
        setCameraEnabled
    } = useCamera()

    const {
        playerPosition,
        gpsError,
        loadGPSPosition,
        setGpsError
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
        handleShoot: baseHandleShoot,
        takePhoto
    } = useShooting(videoRef, canvasRef)

    // Game-specific state
    const [showMiniMap, setShowMiniMap] = useState(false)
    const [zoomMethod, setZoomMethod] = useState('software')

    const toggleZoomMethod = useCallback(() => {
        setZoomMethod(prev => {
            const next = prev === 'software' ? 'hardware' : 'software'
            console.log(`MediaPipe: (Multi) 切換變焦模式至: ${next}`)
            setZoomLevel(zoomConfig.min)
            if (next === 'software') applyHardwareZoom(1.0)
            return next
        })
    }, [applyHardwareZoom, zoomConfig.min, setZoomLevel])

    // Wrap handleShoot to pass weapon type
    const handleShoot = useCallback(() => {
        baseHandleShoot(selectedWeapon)
    }, [baseHandleShoot, selectedWeapon])

    // Handle reload (placeholder for future animation)
    const handleReload = useCallback(() => {
        console.log('Reload animation triggered')
    }, [])

    // Initialize camera and GPS
    useEffect(() => {
        if (cameraEnabled) {
            startCamera()
        }

        // Load GPS position immediately
        loadGPSPosition()

        // Set up interval to check GPS position every second
        const gpsInterval = setInterval(loadGPSPosition, 1000)

        // Start orientation listener
        startOrientationListener()

        return () => {
            stopCamera()
            clearInterval(gpsInterval)
            stopOrientationListener()
        }
    }, [])

    // Restart camera when enabled
    useEffect(() => {
        if (cameraEnabled && !cameraStream) {
            startCamera()
        }
    }, [cameraEnabled, cameraStream, startCamera])

    // Restart camera when entering/exiting any aim mode to ensure video works
    useEffect(() => {
        if (cameraEnabled && cameraStream) {
            // Restart camera to ensure video elements get the stream
            const restartCamera = async () => {
                // Small delay to ensure refs are ready
                await new Promise(resolve => setTimeout(resolve, 100))
                if (videoRef.current && cameraStream) {
                    videoRef.current.srcObject = cameraStream
                }
                // Also set zoomed ref if in scope mode (for CSS method)
                if (aimMode === 'scope' && selectedWeapon !== 'sniper' && videoZoomedRef.current) {
                    videoZoomedRef.current.srcObject = cameraStream
                }
            }
            restartCamera()
        }
    }, [aimMode, cameraEnabled, cameraStream, selectedWeapon, videoRef, videoZoomedRef])

    // Handle Hardware Zoom reset and Mode Defaulting
    useEffect(() => {
        if (!aimMode) {
            applyHardwareZoom(1.0)
            setZoomMethod('software')
        } else {
            setZoomMethod('software')
        }
    }, [aimMode, applyHardwareZoom])

    // Apply hardware zoom when needed
    useEffect(() => {
        if (zoomMethod === 'hardware' && cameraEnabled) {
            applyHardwareZoom(zoomLevel)
        } else if (zoomMethod === 'software' && cameraEnabled) {
            applyHardwareZoom(1.0)
        }
    }, [zoomLevel, zoomMethod, cameraEnabled, applyHardwareZoom])

    // Canvas rendering for Scope (performance optimized)
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

            // Calculate source region (center of video, scaled by zoom)
            const effectiveZoom = zoomMethod === 'hardware' ? 1.0 : zoomLevel
            const sourceSize = Math.min(video.videoWidth, video.videoHeight) / effectiveZoom
            const sourceX = (video.videoWidth - sourceSize) / 2
            const sourceY = (video.videoHeight - sourceSize) / 2

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Draw only the needed region, scaled to canvas size
            ctx.drawImage(
                video,
                sourceX, sourceY, sourceSize, sourceSize,  // Source: small region
                0, 0, canvas.width, canvas.height          // Destination: full canvas
            )

            animationId = requestAnimationFrame(renderScope)
        }

        // Start rendering loop
        animationId = requestAnimationFrame(renderScope)

        // Cleanup
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId)
            }
        }
    }, [aimMode, zoomLevel, selectedWeapon, scopeCanvasRef, videoRef])

    return (
        <div className="game-page">
            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Shoot flash effect */}
            {shootFlash && <div className="shoot-flash" />}

            {/* Camera View */}
            <div className={`camera-container ${!cameraEnabled ? 'disabled' : ''}`}>
                {cameraEnabled ? (
                    <>
                        {/* Scope mode: Canvas rendering for all weapons (performance optimized) */}
                        {aimMode === 'scope' ? (
                            <div className={selectedWeapon === 'sniper' ? 'sniper-scope-view' : 'scope-view'}>
                                {/* Hidden video for canvas source */}
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="camera-feed-hidden"
                                />

                                {/* Background layer for non-sniper weapons */}
                                {selectedWeapon !== 'sniper' && (
                                    <video
                                        ref={videoZoomedRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="camera-feed scope-blurred"
                                    />
                                )}

                                {/* Canvas for zoomed scope view */}
                                <div className={`scope-zoom-container scope-${selectedWeapon}`}>
                                    <canvas
                                        ref={scopeCanvasRef}
                                        width={1920}
                                        height={1920}
                                        className="scope-canvas"
                                    />
                                </div>
                            </div>
                        ) : (
                            /* IronSight or no aim: single video with optional blur */
                            /* Blur when focusMode is 'scope' (default), clear when 'background' */
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`camera-feed ${focusMode === 'scope' && aimMode ? 'blurred' : ''}`}
                            />
                        )}

                        {cameraError && (
                            <div className="camera-error">
                                <span>⚠️ {cameraError}</span>
                            </div>
                        )}

                    </>
                ) : (
                    <div className="camera-off-overlay">
                        <span className="camera-off-text">鏡頭已關閉</span>
                        <span className="camera-off-hint">點擊 📸 開啟鏡頭</span>
                    </div>
                )}
            </div>

            {/* Top left controls - camera toggle */}
            <div className="top-left-controls">
                <button
                    className={`control-btn camera-toggle ${cameraEnabled ? 'active' : 'disabled'}`}
                    onClick={toggleCamera}
                    title={cameraEnabled ? '關閉相機' : '開啟相機'}
                >
                    {cameraEnabled ? '📸' : '🚫'}
                </button>
            </div>

            {/* Settings Toggle - Only when aiming (Top Right) */}
            {aimMode && (
                <div className="top-right-controls">
                    <button className={`control-btn settings-btn ${zoomMethod === 'hardware' ? 'active' : ''}`} onClick={toggleZoomMethod}>
                        {zoomMethod === 'software' ? '⚙️' : '🦾'}
                    </button>
                    <div className="zoom-method-hint">
                        {zoomMethod === 'hardware' ? '硬體變焦 (高畫質)' : '軟體變焦 (推薦)'}
                    </div>
                </div>
            )}

            {/* Real-time mini map - always available if we have GPS, even if camera is off */}
            {!aimMode && (
                <MiniMapOverlay
                    playerPosition={playerPosition}
                    onClick={() => setShowMiniMap(true)}
                />
            )}

            {/* Game HUD - Always available for training even when camera is off */}
            <>
                {/* Crosshair when not aiming */}
                {!aimMode && (
                    <div className="crosshair">
                        <div className="crosshair-dot" />
                    </div>
                )}

                {/* Aiming overlay */}
                {aimMode && (
                    <div className="aiming-overlay">
                        <AimingView
                            weapon={selectedWeapon}
                            mode={aimMode}
                            zoomLevel={zoomLevel}
                            onZoomChange={setZoomLevel}
                            zoomConfig={zoomConfig}
                            focusMode={focusMode}
                            onToggleFocus={toggleFocus}
                        />
                    </div>
                )}

                {/* Right side controls */}
                <div className="right-controls">
                    {/* Iron sight button */}
                    {zoomConfig.hasIronSight && (
                        <button
                            className={`control-btn ${aimMode === 'iron' ? 'active' : ''}`}
                            onClick={handleIronSight}
                        >
                            <span className="btn-icon">⊕</span>
                        </button>
                    )}

                    {/* Scope button */}
                    {zoomConfig.hasScope && (
                        <button
                            className={`control-btn ${aimMode === 'scope' ? 'active' : ''}`}
                            onClick={handleScope}
                        >
                            <span className="btn-icon">🔍</span>
                        </button>
                    )}

                    {/* Reload button */}
                    <button
                        className="control-btn"
                        onClick={handleReload}
                    >
                        <span className="btn-icon">R</span>
                    </button>
                </div>

                {/* Bottom controls */}
                <div className="bottom-controls">
                    {/* When not aiming - show weapon carousel */}
                    {!aimMode && (
                        <div className="weapon-section">
                            <WeaponCarousel
                                selectedWeapon={selectedWeapon}
                                onSelect={(weaponId) => {
                                    setSelectedWeapon(weaponId)
                                    setAimMode(null)
                                    setZoomLevel(1)
                                }}
                            />
                        </div>
                    )}

                    {/* When aiming - show only shoot button */}
                    {aimMode && (
                        <div className="shoot-section centered">
                            <button
                                className="shoot-btn"
                                onClick={(e) => {
                                    e.stopPropagation() // Prevent focus toggle
                                    handleShoot()
                                }}
                            >
                                <span className="shoot-btn-inner" />
                            </button>
                        </div>
                    )}
                </div>
            </>

            {/* MiniMap Modal */}
            {showMiniMap && (
                <GameMiniMap
                    onClose={() => setShowMiniMap(false)}
                    playerPosition={playerPosition ? { ...playerPosition, heading: deviceHeading !== null ? deviceHeading : playerPosition.heading } : null}
                    currentPlayerRole="player" // TODO: Get from store
                    onRequestCompass={requestCompassPermission}
                    hasHeading={deviceHeading !== null}
                />
            )}
        </div>
    )
}

export default Game
