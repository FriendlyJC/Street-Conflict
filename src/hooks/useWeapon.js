import { useState, useCallback } from 'react'

/**
 * useWeapon - 武器狀態管理 Hook
 * 管理武器選擇、瞄準模式、縮放倍率
 */
export function useWeapon(initialWeapon = 'rifle') {
    const [selectedWeapon, setSelectedWeapon] = useState(initialWeapon)
    const [aimMode, setAimMode] = useState(null) // null, 'iron', 'scope'
    const [zoomLevel, setZoomLevel] = useState(1)
    const [focusMode, setFocusMode] = useState('scope') // 'scope' (瞄具清晰) or 'background' (背景清晰)

    // Weapon-specific zoom settings
    const getZoomConfig = useCallback(() => {
        switch (selectedWeapon) {
            case 'shotgun':
                return { min: 2, max: 2, hasIronSight: true, hasScope: true } // Fixed 2x, no slider
            case 'rifle':
                return { min: 3, max: 6, hasIronSight: true, hasScope: true } // 3x-6x adjustable
            case 'sniper':
                return { min: 10, max: 30, hasIronSight: false, hasScope: true } // 10x-30x adjustable
            default:
                return { min: 1, max: 1, hasIronSight: true, hasScope: false }
        }
    }, [selectedWeapon])

    const zoomConfig = getZoomConfig()

    // Toggle iron sight
    const handleIronSight = useCallback(() => {
        if (aimMode === 'iron') {
            setAimMode(null)
            setZoomLevel(1)
        } else {
            setAimMode('iron')
            setZoomLevel(1)
        }
    }, [aimMode])

    // Toggle scope
    const handleScope = useCallback(() => {
        if (aimMode === 'scope') {
            setAimMode(null)
            setZoomLevel(1)
        } else {
            setAimMode('scope')
            setZoomLevel(zoomConfig.min)
        }
    }, [aimMode, zoomConfig.min])

    // Toggle focus mode (瞄具清晰 <-> 背景清晰)
    const toggleFocus = useCallback(() => {
        const newMode = focusMode === 'scope' ? 'background' : 'scope'
        console.log('Toggling focus:', focusMode, '->', newMode)
        setFocusMode(newMode)
    }, [focusMode])

    // Select weapon (and reset aim mode)
    const selectWeapon = useCallback((weaponId) => {
        setSelectedWeapon(weaponId)
        setAimMode(null)
        setZoomLevel(1)
    }, [])

    return {
        // State
        selectedWeapon,
        aimMode,
        zoomLevel,
        focusMode,
        zoomConfig,
        // Actions
        setSelectedWeapon,
        setAimMode,
        setZoomLevel,
        setFocusMode,
        handleIronSight,
        handleScope,
        toggleFocus,
        selectWeapon
    }
}

export default useWeapon
