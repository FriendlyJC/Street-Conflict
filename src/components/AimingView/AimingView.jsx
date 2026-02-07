import { useState, useEffect } from 'react'
import './AimingView.css'

/**
 * AimingView - 瞄準介面元件
 * 顯示瞄具圖片（IronSight/Scope），支援多格式、焦距切換、縮放控制
 */
function AimingView({ weapon, mode, zoomLevel, onZoomChange, zoomConfig, focusMode, onToggleFocus }) {
    const [imageSrc, setImageSrc] = useState('')
    const [imageError, setImageError] = useState(false)
    const [formatIndex, setFormatIndex] = useState(0)

    const formats = ['png', 'jpg', 'jpeg', 'webp', 'gif']

    // Get scope image base path based on weapon, mode, and focus
    const getScopeBasePath = () => {
        let baseName = ''

        if (mode === 'scope') {
            // Scope mode: no Fuz variant
            if (weapon === 'sniper') {
                baseName = 'SniperScope'
            } else if (weapon === 'rifle') {
                baseName = 'RifleScope'
            } else if (weapon === 'shotgun') {
                baseName = 'ShotgunScope'
            }
        } else {
            // IronSight mode: support Fuz variant
            if (weapon === 'rifle') {
                baseName = 'RifleIronSight'
            } else if (weapon === 'shotgun') {
                baseName = 'ShotgunIronSight'
            } else {
                baseName = 'IronSight'
            }

            // Add 'Fuz' suffix if background is focused (IronSight is blurred)
            if (focusMode === 'background') {
                baseName += 'Fuz'
            }
        }

        return `/PNG/${baseName}`
    }

    // Determine if this is a centered scope (only sniper scope uses full-screen center)
    const isCenteredScope = mode === 'scope' && weapon === 'sniper'
    // Rifle and Shotgun are 'scope-bottom' to keep the gun on the ground

    const imageName = getScopeBasePath().split('/').pop()

    // Initialize image source
    useEffect(() => {
        const basePath = getScopeBasePath()
        setImageSrc(`${basePath}.${formats[0]}`)
        setImageError(false)
        setFormatIndex(0)
    }, [weapon, mode, focusMode])

    const tryNextFormat = () => {
        if (formatIndex >= formats.length - 1) {
            setImageError(true)
            return
        }

        const nextIndex = formatIndex + 1
        const basePath = getScopeBasePath()
        const nextSrc = `${basePath}.${formats[nextIndex]}`

        setFormatIndex(nextIndex)
        setImageSrc(nextSrc)
    }

    return (
        <div className="aiming-view" onClick={onToggleFocus}>
            {/* Zoom slider for scoped weapons - LEFT SIDE */}
            {mode === 'scope' && zoomConfig.max > zoomConfig.min && (
                <div className="zoom-control left" onClick={(e) => e.stopPropagation()}>
                    <span className="zoom-label">{zoomConfig.max}x</span>
                    <input
                        type="range"
                        min={zoomConfig.min}
                        max={zoomConfig.max}
                        step="0.1"
                        value={zoomLevel}
                        onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                        className="zoom-slider"
                        orient="vertical"
                    />
                    <span className="zoom-label">{zoomConfig.min}x</span>
                </div>
            )}

            {/* Scope overlay image or placeholder */}
            {imageError ? (
                <div className="scope-placeholder">
                    <span>{imageName}</span>
                </div>
            ) : (
                <img
                    src={imageSrc}
                    alt="Scope"
                    className={`scope-image ${isCenteredScope ? 'scope-centered' : 'scope-bottom'}`}
                    onError={tryNextFormat}
                />
            )}
        </div>
    )
}

export default AimingView
