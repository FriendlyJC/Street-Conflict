import { useState, useRef, useEffect } from 'react'
import './WeaponCarousel.css'

// Weapon configuration with PNG paths
const WEAPONS = [
    { id: 'shotgun', name: '霰彈槍', image: '/PNG/Shotgun.png' },
    { id: 'rifle', name: '步槍', image: '/PNG/Rifle.png' },
    { id: 'sniper', name: '狙擊槍', image: '/PNG/Sniper.png' }
]

function WeaponCarousel({ selectedWeapon, onSelect }) {
    const containerRef = useRef(null)
    const trackRef = useRef(null)
    const [currentIndex, setCurrentIndex] = useState(
        WEAPONS.findIndex(w => w.id === selectedWeapon)
    )
    const [isDragging, setIsDragging] = useState(false)
    const [startX, setStartX] = useState(0)
    const [dragOffset, setDragOffset] = useState(0)

    const itemWidth = 100
    const gap = 20
    const itemSpacing = itemWidth + gap

    // Get weapon at virtual index (wraps around)
    const getWeaponAt = (virtualIndex) => {
        const actualIndex = ((virtualIndex % WEAPONS.length) + WEAPONS.length) % WEAPONS.length
        return WEAPONS[actualIndex]
    }

    // Generate visible items (extended for infinite scroll)
    const getVisibleItems = () => {
        const items = []
        for (let offset = -3; offset <= 3; offset++) {
            const virtualIndex = currentIndex + offset
            items.push({
                weapon: getWeaponAt(virtualIndex),
                offset,
                virtualIndex
            })
        }
        return items
    }

    const visibleItems = getVisibleItems()

    const handleStart = (clientX) => {
        setIsDragging(true)
        setStartX(clientX)
        setDragOffset(0)
    }

    const handleMove = (clientX) => {
        if (!isDragging) return
        const diff = clientX - startX
        setDragOffset(diff)
    }

    const handleEnd = () => {
        if (!isDragging) return
        setIsDragging(false)

        const threshold = itemSpacing / 2

        if (Math.abs(dragOffset) > threshold) {
            if (dragOffset > 0) {
                // Swipe right - previous weapon
                changeWeapon(-1)
            } else {
                // Swipe left - next weapon
                changeWeapon(1)
            }
        }

        setDragOffset(0)
    }

    const handleTouchStart = (e) => {
        handleStart(e.touches[0].clientX)
    }

    const handleTouchMove = (e) => {
        handleMove(e.touches[0].clientX)
    }

    const handleTouchEnd = () => {
        handleEnd()
    }

    const handleMouseDown = (e) => {
        handleStart(e.clientX)
    }

    const handleMouseMove = (e) => {
        handleMove(e.clientX)
    }

    const handleMouseUp = () => {
        handleEnd()
    }

    const changeWeapon = (direction) => {
        const newIndex = currentIndex + direction
        setCurrentIndex(newIndex)
        const weapon = getWeaponAt(newIndex)
        onSelect(weapon.id)
    }

    // Calculate opacity based on position (including drag offset)
    const getOpacity = (offset) => {
        // Calculate effective offset considering drag
        const dragOffsetInItems = -dragOffset / itemSpacing
        const effectiveOffset = offset + dragOffsetInItems
        const absOffset = Math.abs(effectiveOffset)

        if (absOffset < 0.5) return 1
        if (absOffset < 1.5) return 0.6
        if (absOffset < 2.5) return 0.3
        return 0.1
    }

    // Calculate scale based on position (including drag offset)
    const getScale = (offset) => {
        const dragOffsetInItems = -dragOffset / itemSpacing
        const effectiveOffset = offset + dragOffsetInItems
        const absOffset = Math.abs(effectiveOffset)

        if (absOffset < 0.5) return 1.3
        if (absOffset < 1.5) return 1
        return 0.8
    }

    // Calculate transform for each item
    const getItemTransform = (offset) => {
        const basePosition = offset * itemSpacing
        const position = basePosition + dragOffset
        return `translateX(${position}px) scale(${getScale(offset)})`
    }

    return (
        <div className="weapon-carousel-container">
            <div
                ref={containerRef}
                className="weapon-carousel"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => isDragging && handleMouseUp()}
            >
                <div
                    ref={trackRef}
                    className="weapon-carousel-track"
                >
                    {visibleItems.map((item, index) => (
                        <div
                            key={`${item.weapon.id}-${item.virtualIndex}`}
                            className={`weapon-carousel-item ${item.offset === 0 && dragOffset === 0 ? 'active' : ''}`}
                            style={{
                                opacity: getOpacity(item.offset),
                                transform: getItemTransform(item.offset),
                                transition: isDragging ? 'none' : 'all 0.3s ease',
                                width: itemWidth,
                                position: 'absolute',
                                left: '50%',
                                marginLeft: -(itemWidth / 2)
                            }}
                            onClick={() => {
                                if (item.offset !== 0 && !isDragging) {
                                    changeWeapon(item.offset)
                                }
                            }}
                        >
                            <WeaponImage weapon={item.weapon} />
                            <span className="weapon-name">{item.weapon.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Selection indicator */}
            <div className="carousel-indicator">
                <div className="indicator-line left" />
                <div className="indicator-center" />
                <div className="indicator-line right" />
            </div>
        </div>
    )
}

// Component to display weapon image or placeholder with format fallback
function WeaponImage({ weapon }) {
    const [imageSrc, setImageSrc] = useState(weapon.image)
    const [imageError, setImageError] = useState(false)
    const [formatIndex, setFormatIndex] = useState(0)

    const formats = ['png', 'jpg', 'jpeg', 'webp', 'gif']

    const tryNextFormat = () => {
        if (formatIndex >= formats.length - 1) {
            setImageError(true)
            return
        }

        const nextIndex = formatIndex + 1
        const basePath = weapon.image.replace(/\.(png|jpg|jpeg|webp|gif)$/i, '')
        const nextSrc = `${basePath}.${formats[nextIndex]}`

        setFormatIndex(nextIndex)
        setImageSrc(nextSrc)
    }

    if (imageError) {
        return (
            <div className="weapon-placeholder">
                <span>{weapon.id.charAt(0).toUpperCase() + weapon.id.slice(1)}</span>
            </div>
        )
    }

    return (
        <img
            src={imageSrc}
            alt={weapon.name}
            className="weapon-image"
            onError={tryNextFormat}
        />
    )
}

export default WeaponCarousel
