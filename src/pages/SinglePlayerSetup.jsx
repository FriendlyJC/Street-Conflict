import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BoundaryDrawer from '../components/BoundaryDrawer'
import './SinglePlayerSetup.css'

function SinglePlayerSetup() {
    const navigate = useNavigate()
    const [showBoundaryDrawer, setShowBoundaryDrawer] = useState(false)
    const [customBoundary, setCustomBoundary] = useState(null)
    const [playerPosition, setPlayerPosition] = useState(null)

    const [formData, setFormData] = useState({
        gameMode: 'random_kill',
        mapSize: 'medium',
        gameTime: '15'
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

        // Get game duration
        let duration = parseInt(formData.gameTime)
        if (formData.gameTime === 'custom') {
            const customTimeInput = document.querySelector('input[name="customTime"]')
            duration = customTimeInput ? parseInt(customTimeInput.value) || 15 : 15
        }

        // Random Kill mode is ready, others are under development
        if (formData.gameMode === 'random_kill') {
            navigate('/singleplayer/game', {
                state: {
                    mode: 'randomKill',
                    mapSize: formData.mapSize,
                    duration: duration,
                    customBoundary: customBoundary
                }
            })
        } else {
            // Other modes are under development
            alert('此遊戲模式開發中，請稍後！')
        }
    }

    return (
        <div className="single-player-setup-page page">
            <h1 className="page-title">單人模式</h1>

            <form className="create-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">遊戲模式:</label>
                    <select
                        name="gameMode"
                        value={formData.gameMode}
                        onChange={handleChange}
                        className="select-field"
                    >
                        <option value="random_kill">隨機殺戮</option>
                        <option value="zombie">殭屍模式</option>
                        <option value="tower_defense">守塔模式</option>
                    </select>
                    <div className="mode-description">
                        {formData.gameMode === 'random_kill' && (
                            <p>AI會判定所有人像為目標</p>
                        )}
                        {formData.gameMode === 'zombie' && (
                            <p>地圖上會隨機生成武器、建造資源及殭屍，殭屍會自動靠近攻擊玩家，確保在殭屍末日下活下去</p>
                        )}
                        {formData.gameMode === 'tower_defense' && (
                            <p>以玩家初始中心為主塔，抵禦一波波攻擊的敵人</p>
                        )}
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">地圖大小:</label>
                    <select
                        name="mapSize"
                        value={formData.mapSize}
                        onChange={handleChange}
                        className="select-field"
                    >
                        <option value="small">小</option>
                        <option value="medium">中</option>
                        <option value="large">大</option>
                        <option value="infinite">無限</option>
                        <option value="custom">自訂義 (畫地圖)</option>
                    </select>
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
                    <label className="form-label">遊玩時間:</label>
                    <select
                        name="gameTime"
                        value={formData.gameTime}
                        onChange={handleChange}
                        className="select-field"
                    >
                        <option value="15">15 分鐘</option>
                        <option value="30">30 分鐘</option>
                        <option value="60">60 分鐘</option>
                        <option value="custom">自訂義</option>
                    </select>
                    {formData.gameTime === 'custom' && (
                        <input
                            type="number"
                            name="customTime"
                            placeholder="輸入分鐘數"
                            className="input-field mt-sm"
                            min="1"
                            max="999"
                        />
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        開始遊戲
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

export default SinglePlayerSetup
