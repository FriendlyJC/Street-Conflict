// Utility for managing player state across pages
// Uses localStorage for persistence during page navigation

const PLAYER_STATE_KEY = 'streetconflict_player_state'

export const getPlayerState = () => {
    try {
        const stored = localStorage.getItem(PLAYER_STATE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('Failed to load player state:', e)
    }

    // Default state - host starts as referee
    return {
        id: '1',
        name: 'Player001',
        team: 'referee', // Host defaults to referee
        hasAppearance: true, // Referees don't need appearance
        isHost: true
    }
}

export const setPlayerState = (state) => {
    try {
        localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state))
    } catch (e) {
        console.error('Failed to save player state:', e)
    }
}

export const updatePlayerState = (updates) => {
    const current = getPlayerState()
    const newState = { ...current, ...updates }

    // If player joins a team, update hasAppearance based on team
    if (updates.team !== undefined) {
        // Referees don't need appearance - auto set to true
        if (updates.team === 'referee') {
            newState.hasAppearance = true
        } else if (current.team === 'referee' && updates.team !== 'referee') {
            // Switching from referee to a team - need to set appearance
            newState.hasAppearance = false
        }
    }

    setPlayerState(newState)
    return newState
}

export const clearPlayerState = () => {
    try {
        localStorage.removeItem(PLAYER_STATE_KEY)
    } catch (e) {
        console.error('Failed to clear player state:', e)
    }
}

// Check if player needs to set appearance
export const needsAppearance = (player) => {
    // Referees don't need appearance
    if (player.team === 'referee') return false
    // Team players need appearance
    return !player.hasAppearance
}
