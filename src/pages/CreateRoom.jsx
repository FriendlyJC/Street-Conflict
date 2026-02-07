import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BoundaryDrawer from '../components/BoundaryDrawer'
import './CreateRoom.css'

function CreateRoom() {
    const navigate = useNavigate()
    const [showBoundaryDrawer, setShowBoundaryDrawer] = useState(false)
    const [customBoundary, setCustomBoundary] = useState(null)
    const [playerPosition, setPlayerPosition] = useState(null)

    const [formData, setFormData] = useState({
        playerCount: '6v6',
        mapSize: 'medium',
        gameMode: 'infinite',
        gameTime: '15',
        password: '',
        roomName: ''
    })

    // Get player position from GPS
    useState(() => {
        const storedPosition = localStorage.getItem('streetconflict_gps_position')
        if (storedPosition) {
            try {
                const positionData = JSON.parse(storedPosition)
                setPlayerPosition({
                    lat: positionData.lat,
                    lng: positionData.lng
                })
            } catch (err) {
                console.error('Failed to load GPS position:', err)
            }
        }
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleBoundarySave = (points) => {
        setCustomBoundary(points)
        setShowBoundaryDrawer(false)
        alert(`邊界已儲存！共 ${points.length} 個點`)
    }

    const handleSubmit = (e) => {
        e.preventDefault()

        // Validate custom boundary if selected
        if (formData.mapSize === 'custom' && !customBoundary) {
            alert('請先繪製自訂邊界！')
            return
        }

        // TODO: Create room via socket with boundary data
        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()

        // Store boundary in localStorage for now (will be sent to server)
        if (customBoundary) {
            localStorage.setItem(`room_${roomId}_boundary`, JSON.stringify(customBoundary))
        }

        navigate(`/lobby/${roomId}`)
    }

    return (
        <div className="create-room-page page">
            <h1 className="page-title">創建房間</h1>

            <form className="create-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">遊玩人數:</label>
                    <select
                        name="playerCount"
                        value={formData.playerCount}
                        onChange={handleChange}
                        className="select-field"
                    >
                        <option value="3v3">3 vs 3 (+2 裁判)</option>
                        <option value="6v6">6 vs 6 (+3 裁判)</option>
                        <option value="10v10">10 vs 10 (+5 裁判)</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">地圖大小:</label>
                    <div className="map-size-info">
                        <select
                            name="mapSize"
                            value={formData.mapSize}
                            onChange={handleChange}
                            className="select-field"
                        >
                            <option value="small">小 (500m 範圍)</option>
                            <option value="medium">中 (1km 範圍)</option>
                            <option value="large">大 (2km 範圍)</option>
                            <option value="custom">自訂 (地圖手動繪製)</option>
                        </select>
                    </div>
                    {formData.mapSize === 'custom' && (
                        <div className="custom-boundary-controls">
                            <button
                                type="button"
                                className="btn btn-secondary btn-small mt-sm"
                                onClick={() => setShowBoundaryDrawer(true)}
                            >
                                {customBoundary ? '✓ 重新繪製邊界' : '繪製邊界'}
                            </button>
                            {customBoundary && (
                                <span className="boundary-status">
                                    已設定 {customBoundary.length} 個邊界點
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">遊戲模式:</label>
                    <select
                        name="gameMode"
                        value={formData.gameMode}
                        onChange={handleChange}
                        className="select-field"
                    >
                        <option value="infinite">無限模式</option>
                        <option value="survival">生存模式</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">遊戲時間:</label>
                    <select
                        name="gameTime"
                        value={formData.gameTime}
                        onChange={handleChange}
                        className="select-field"
                    >
                        <option value="10">10 分鐘</option>
                        <option value="15">15 分鐘</option>
                        <option value="20">20 分鐘</option>
                        <option value="30">30 分鐘</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">密碼: (*選填)</label>
                    <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="留空為公開房間"
                        className="input-field"
                        maxLength={16}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">房間名稱: (限10字)</label>
                    <input
                        type="text"
                        name="roomName"
                        value={formData.roomName}
                        onChange={handleChange}
                        placeholder="輸入房間名稱"
                        className="input-field"
                        maxLength={10}
                        required
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        創建
                    </button>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => navigate('/')}
                    >
                        返回
                    </button>
                </div>
            </form>

            {/* Boundary Drawer Modal */}
            {showBoundaryDrawer && (
                <BoundaryDrawer
                    playerPosition={playerPosition}
                    onSave={handleBoundarySave}
                    onClose={() => setShowBoundaryDrawer(false)}
                />
            )}
        </div>
    )
}

export default CreateRoom
