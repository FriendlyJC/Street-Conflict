import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './JoinRoom.css'

// Mock room data - will be replaced with socket data
const mockRooms = [
    { id: 'ABC123', name: '台北戰場', players: 8, maxPlayers: 15, hasPassword: false },
    { id: 'XYZ789', name: '中山區激戰', players: 12, maxPlayers: 15, hasPassword: true },
    { id: 'DEF456', name: '公園對決', players: 5, maxPlayers: 15, hasPassword: false },
]

function JoinRoom() {
    const navigate = useNavigate()
    const [rooms, setRooms] = useState(mockRooms)
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [password, setPassword] = useState('')
    const [showPasswordModal, setShowPasswordModal] = useState(false)

    const handleJoin = (room) => {
        if (room.hasPassword) {
            setSelectedRoom(room)
            setShowPasswordModal(true)
        } else {
            navigate(`/lobby/${room.id}`)
        }
    }

    const handlePasswordSubmit = () => {
        // TODO: Verify password via socket
        navigate(`/lobby/${selectedRoom.id}`)
    }

    return (
        <div className="join-room-page page">
            <h1 className="page-title">加入房間</h1>

            <div className="room-list-header">
                <span>#序列</span>
                <span>房間名稱</span>
                <span>人數</span>
            </div>

            <div className="room-list">
                {rooms.length === 0 ? (
                    <div className="no-rooms">
                        目前沒有可加入的房間
                    </div>
                ) : (
                    rooms.map((room, index) => (
                        <div
                            key={room.id}
                            className={`room-item ${selectedRoom?.id === room.id ? 'selected' : ''}`}
                            onClick={() => setSelectedRoom(room)}
                        >
                            <span className="room-index">#{index + 1}</span>
                            <span className="room-name">
                                {room.hasPassword && <span className="lock-icon">🔒</span>}
                                {room.name}
                            </span>
                            <span className="room-players">{room.players}/{room.maxPlayers}</span>
                        </div>
                    ))
                )}
            </div>

            <div className="form-actions">
                <button
                    className="btn btn-primary"
                    onClick={() => selectedRoom && handleJoin(selectedRoom)}
                    disabled={!selectedRoom}
                >
                    加入
                </button>
                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/multiplayer')}
                >
                    返回
                </button>
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>輸入密碼</h3>
                        <input
                            type="text"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="房間密碼"
                            className="input-field"
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button
                                className="btn btn-primary btn-small"
                                onClick={handlePasswordSubmit}
                            >
                                確認
                            </button>
                            <button
                                className="btn btn-secondary btn-small"
                                onClick={() => setShowPasswordModal(false)}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default JoinRoom
