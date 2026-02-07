import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPlayerState, updatePlayerState, needsAppearance } from '../utils/playerState'
import './Lobby.css'

function Lobby() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    // Load player state from localStorage
    const [currentPlayer, setCurrentPlayer] = useState(() => getPlayerState())

    // Other players in the room (will be populated via socket in future)
    const [otherPlayers, setOtherPlayers] = useState([])

    // Permission states
    const [cameraPermission, setCameraPermission] = useState(null)
    const [gpsPermission, setGpsPermission] = useState(null)
    const previewVideoRef = useRef(null)

    // Request permissions on mount
    useEffect(() => {
        const requestPermissions = async () => {
            // Request camera permission with preview
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                    audio: false
                })

                // Show preview briefly to trigger permission on mobile
                if (previewVideoRef.current) {
                    previewVideoRef.current.srcObject = stream
                    previewVideoRef.current.play()

                    // Stop after 1 second
                    setTimeout(() => {
                        stream.getTracks().forEach(track => track.stop())
                        if (previewVideoRef.current) {
                            previewVideoRef.current.srcObject = null
                        }
                    }, 1000)
                } else {
                    // Stop immediately if no preview element
                    stream.getTracks().forEach(track => track.stop())
                }

                setCameraPermission('granted')
            } catch (err) {
                console.error('Camera permission denied:', err)
                setCameraPermission('denied')
            }

            // Request GPS permission and start continuous tracking
            if (navigator.geolocation) {
                const watchId = navigator.geolocation.watchPosition(
                    (position) => {
                        setGpsPermission('granted')
                        // Store position in localStorage for use in Game
                        const positionData = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                            accuracy: position.coords.accuracy,
                            heading: position.coords.heading || 0,
                            timestamp: Date.now()
                        }
                        localStorage.setItem('streetconflict_gps_position', JSON.stringify(positionData))
                        console.log('GPS position updated:', positionData)
                    },
                    (err) => {
                        console.error('GPS error:', err)
                        setGpsPermission('denied')
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 1000
                    }
                )

                // Store watchId for cleanup
                return () => {
                    if (watchId) {
                        navigator.geolocation.clearWatch(watchId)
                    }
                }
            } else {
                setGpsPermission('unsupported')
            }
        }

        requestPermissions()
    }, [])

    // Sync state changes to localStorage
    useEffect(() => {
        // Save any state changes
    }, [currentPlayer])

    // Get players by team
    const getTeamPlayers = (team) => {
        const allPlayers = [currentPlayer, ...otherPlayers]
        return allPlayers.filter(p => p.team === team)
    }

    const referees = getTeamPlayers('referee')
    const teamA = getTeamPlayers('teamA')
    const teamB = getTeamPlayers('teamB')

    // Check if all current players are ready
    const allPlayersReady = () => {
        const allPlayers = [currentPlayer, ...otherPlayers]
        const playersInTeam = allPlayers.filter(p => p.team !== null)
        if (playersInTeam.length === 0) return false

        return playersInTeam.every(p => {
            // Referees are always ready (no appearance needed)
            if (p.team === 'referee') return true
            // Team players need to have set their appearance
            return p.hasAppearance
        })
    }

    const handleJoinTeam = (team) => {
        const newState = updatePlayerState({ team })
        setCurrentPlayer(newState)
    }

    const handleSetupAppearance = () => {
        // Only allow if player is in a team that needs appearance
        if (currentPlayer.team === 'referee') {
            alert('審判官不需要設定外觀！')
            return
        }
        if (!currentPlayer.team) {
            alert('請先選擇隊伍！')
            return
        }
        navigate(`/setup/${roomId}`)
    }

    const handleStartGame = () => {
        if (allPlayersReady()) {
            navigate(`/game/${roomId}`)
        }
    }

    // Check if current player is ready
    const isPlayerReady = (player) => {
        if (player.team === 'referee') return true
        return player.hasAppearance
    }

    return (
        <div className="lobby-page page">
            {/* Hidden video for permission preview */}
            <video
                ref={previewVideoRef}
                autoPlay
                playsInline
                muted
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '1px',
                    height: '1px',
                    opacity: 0,
                    pointerEvents: 'none'
                }}
            />

            <h1 className="page-title">玩家列表</h1>

            {/* Referees Section */}
            <div className="team-section">
                <div className="team-header">
                    <span className="team-name referee">審判官:</span>
                    <button
                        className="btn btn-small btn-join"
                        onClick={() => handleJoinTeam('referee')}
                        disabled={currentPlayer.team === 'referee'}
                    >
                        加入審判官
                    </button>
                </div>
                <div className="player-list">
                    {referees.map(player => (
                        <PlayerItem
                            key={player.id}
                            player={player}
                            isCurrentPlayer={player.id === currentPlayer.id}
                            isReady={isPlayerReady(player)}
                        />
                    ))}
                    {referees.length === 0 && (
                        <div className="empty-slot"># (空位)</div>
                    )}
                </div>
            </div>

            {/* Team A Section */}
            <div className="team-section">
                <div className="team-header">
                    <span className="team-name team-a">隊伍A:</span>
                    <button
                        className="btn btn-small btn-join"
                        onClick={() => handleJoinTeam('teamA')}
                        disabled={currentPlayer.team === 'teamA'}
                    >
                        加入隊伍A
                    </button>
                </div>
                <div className="player-list">
                    {teamA.map(player => (
                        <PlayerItem
                            key={player.id}
                            player={player}
                            isCurrentPlayer={player.id === currentPlayer.id}
                            isReady={isPlayerReady(player)}
                        />
                    ))}
                    {teamA.length === 0 && (
                        <div className="empty-slot"># (空位)</div>
                    )}
                </div>
            </div>

            {/* Team B Section */}
            <div className="team-section">
                <div className="team-header">
                    <span className="team-name team-b">隊伍B:</span>
                    <button
                        className="btn btn-small btn-join"
                        onClick={() => handleJoinTeam('teamB')}
                        disabled={currentPlayer.team === 'teamB'}
                    >
                        加入隊伍B
                    </button>
                </div>
                <div className="player-list">
                    {teamB.map(player => (
                        <PlayerItem
                            key={player.id}
                            player={player}
                            isCurrentPlayer={player.id === currentPlayer.id}
                            isReady={isPlayerReady(player)}
                        />
                    ))}
                    {teamB.length === 0 && (
                        <div className="empty-slot"># (空位)</div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="lobby-actions">
                {currentPlayer.team !== 'referee' && (
                    <button
                        className="btn btn-primary"
                        onClick={handleSetupAppearance}
                        disabled={!currentPlayer.team}
                    >
                        設定外觀
                    </button>
                )}
                <button
                    className="btn btn-primary"
                    onClick={handleStartGame}
                    disabled={!allPlayersReady()}
                >
                    開始遊戲
                </button>
            </div>
        </div>
    )
}

function PlayerItem({ player, isCurrentPlayer, isReady }) {
    return (
        <div className={`player-item ${isCurrentPlayer ? 'current' : ''}`}>
            <span className="player-name">
                # {player.name}
                {player.isHost && <span className="host-badge">(房主)</span>}
            </span>
            <span className={`player-status ${isReady ? 'ready' : 'not-ready'}`}>
                {player.team === 'referee'
                    ? '(V審判官)'
                    : isReady
                        ? '(V已準備)'
                        : '(X尚未設定外觀)'}
            </span>
        </div>
    )
}

export default Lobby
