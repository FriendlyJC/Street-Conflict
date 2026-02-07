import { useState } from 'react'
import './IronSight.css'

function IronSight({ weapon, zoomLevel, onZoomChange, onClose, onShoot }) {
    const [focusMode, setFocusMode] = useState('sight') // 'sight' or 'target'

    // Weapon-specific settings
    const weaponConfig = {
        rifle: {
            maxZoom: 6,
            minZoom: 1,
            sightType: 'rifle'
        },
        shotgun: {
            maxZoom: 2,
            minZoom: 1,
            sightType: 'shotgun'
        }
    }

    const config = weaponConfig[weapon] || weaponConfig.rifle

    // Calculate effective radius based on weapon and zoom
    const getEffectiveRadius = () => {
        if (weapon === 'shotgun') {
            return zoomLevel === 1 ? 120 : 80 // Large radius for shotgun
        }
        // Rifle: larger radius at 1x, smaller at higher zoom
        return Math.max(40, 120 - (zoomLevel - 1) * 16)
    }

    const handleScreenTap = () => {
        // Toggle focus mode
        setFocusMode(prev => prev === 'sight' ? 'target' : 'sight')
    }

    const effectiveRadius = getEffectiveRadius()

    return (
        <div
            className={`iron-sight-overlay ${focusMode}`}
            onClick={handleScreenTap}
        >
            {/* Close button */}
            <button
                className="sight-close-btn"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                ✕
            </button>

            {/* Iron Sight */}
            <div className={`iron-sight ${config.sightType}`}>
                {/* Effective radius circle */}
                <div
                    className="effective-radius"
                    style={{
                        width: effectiveRadius * 2,
                        height: effectiveRadius * 2
                    }}
                />

                {/* Front Post */}
                <div className="front-post" />

                {/* Rear Aperture (for rifle) */}
                {config.sightType === 'rifle' && (
                    <div className="rear-aperture" />
                )}
            </div>

            {/* Zoom Control (for rifle with scope) */}
            {weapon === 'rifle' && zoomLevel > 1 && (
                <div className="zoom-control">
                    <button
                        className="zoom-btn"
                        onClick={(e) => { e.stopPropagation(); onZoomChange(Math.max(3, zoomLevel - 1)); }}
                    >
                        −
                    </button>
                    <span className="zoom-value">{zoomLevel}x</span>
                    <button
                        className="zoom-btn"
                        onClick={(e) => { e.stopPropagation(); onZoomChange(Math.min(6, zoomLevel + 1)); }}
                    >
                        +
                    </button>
                </div>
            )}

            {/* Focus Mode Indicator */}
            <div className="focus-indicator">
                {focusMode === 'sight' ? '瞄具清晰' : '目標清晰'}
            </div>

            {/* Shoot Button */}
            <button
                className="shoot-btn"
                onClick={(e) => { e.stopPropagation(); onShoot(); }}
            >
                <span className="shoot-btn-inner" />
            </button>
        </div>
    )
}

export default IronSight
