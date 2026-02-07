import { useState } from 'react'
import './SniperScope.css'

function SniperScope({ zoomLevel, onZoomChange, onClose, onShoot }) {
    const [isDragging, setIsDragging] = useState(false)

    const handleSliderChange = (e) => {
        const value = parseFloat(e.target.value)
        onZoomChange(value)
    }

    // Calculate effective radius based on zoom
    // Higher zoom = smaller effective radius (more precision needed)
    const effectiveRadius = Math.max(30, 150 - (zoomLevel - 10) * 5)

    return (
        <div className="sniper-scope-overlay">
            {/* Zoom indicator */}
            <div className="zoom-display">
                {zoomLevel}x
            </div>

            {/* Close button */}
            <button className="scope-close-btn" onClick={onClose}>
                ✕
            </button>

            {/* Scope View */}
            <div className="scope-view">
                {/* Effective hit radius circle */}
                <div
                    className="effective-radius"
                    style={{
                        width: effectiveRadius * 2,
                        height: effectiveRadius * 2
                    }}
                />

                {/* Crosshair */}
                <div className="scope-crosshair">
                    <div className="crosshair-h" />
                    <div className="crosshair-v" />
                    <div className="crosshair-dot" />
                </div>

                {/* Scope ring */}
                <div className="scope-ring" />
            </div>

            {/* Zoom Slider */}
            <div className="zoom-slider-container">
                <span className="zoom-label">30x</span>
                <input
                    type="range"
                    min="10"
                    max="30"
                    step="1"
                    value={zoomLevel}
                    onChange={handleSliderChange}
                    className="zoom-slider"
                    orient="vertical"
                />
                <span className="zoom-label">10x</span>
            </div>

            {/* Shoot Button */}
            <button className="shoot-btn" onClick={onShoot}>
                <span className="shoot-btn-inner" />
            </button>
        </div>
    )
}

export default SniperScope
