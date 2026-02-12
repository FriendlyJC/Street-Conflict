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
        roomName: '',
        gameMode: 'tdm',
        playerCount: '6v6',
        mapSize: 'medium',
        gameTime: '1R-5m',
        password: '',
        customRounds: '',
        customMinutes: ''
    })

    // 模式設定資料
    const MODE_CONFIGS = {
        tdm: {
            label: '團隊死戰',
            playerCounts: ['3v3', '6v6', '10v10'],
            gameTimes: ['1R-5m', '1R-10m', '3R-5m', '3R-10m', '5R-5m', '5R-10m', 'custom']
        },
        bomb: {
            label: '拆彈模式',
            playerCounts: ['3v3', '6v6'],
            gameTimes: ['1R-5m', '1R-10m', '3R-5m', '3R-10m', '5R-5m', '5R-10m', 'custom']
        },
        hostage: {
            label: '解救人質',
            playerCounts: ['3v3', '6v6'],
            gameTimes: ['1R-5m', '1R-10m', '3R-5m', '3R-10m', '5R-5m', '5R-10m', 'custom']
        },
        cqb: {
            label: 'CQB (無地圖)',
            playerCounts: ['3v3', '6v6', '10v10'],
            gameTimes: ['1R-5m', '1R-10m', '3R-5m', '3R-10m', '5R-5m', '5R-10m', 'custom']
        },
        duel: {
            label: '單挑模式',
            playerCounts: ['1v1'],
            gameTimes: ['1R-5m', '1R-10m', '3R-5m', '3R-10m', '5R-5m', '5R-10m', 'custom']
        },
        survivor: {
            label: '最後倖存者',
            playerCounts: ['solo-10', 'solo-25', 'duo-20', 'duo-50', 'squad-100'],
            gameTimes: {
                'solo-10': ['10m', '15m', 'custom'],
                'solo-25': ['15m', '25m', 'custom'],
                'duo-20': ['10m', '15m', 'custom'],
                'duo-50': ['20m', '30m', 'custom'],
                'squad-100': ['25m', '35m', 'custom']
            }
        }
    }

    const playerCountLabels = {
        '3v3': '3 vs 3 (+2 裁判)',
        '6v6': '6 vs 6 (+3 裁判)',
        '10v10': '10 vs 10 (+5 裁判)',
        '1v1': '1 vs 1',
        'solo-10': '單人組隊 (10人)',
        'solo-25': '單人組隊 (25人)',
        'duo-20': '雙人組隊 (20人)',
        'duo-50': '雙人組隊 (50人)',
        'squad-100': '四人組隊 (100人)'
    }

    const timeOptionLabels = (val) => {
        if (val === 'custom') return '自定義'
        if (val.includes('-')) {
            const [r, m] = val.split('-')
            return `${r.replace('R', ' 回合')}(每回合 ${m.replace('m', '')} 分鐘)`
        }
        return val.replace('m', ' 分鐘')
    }

    // 當模式改變時，重置關聯選項
    const handleModeChange = (e) => {
        const mode = e.target.value
        const config = MODE_CONFIGS[mode]
        const firstPlayerCount = config.playerCounts[0]

        let firstTime
        if (mode === 'survivor') {
            firstTime = config.gameTimes[firstPlayerCount][0]
        } else {
            firstTime = config.gameTimes[0]
        }

        setFormData(prev => ({
            ...prev,
            gameMode: mode,
            playerCount: firstPlayerCount,
            gameTime: firstTime,
            customRounds: '',
            customMinutes: ''
        }))
    }

    // 當倖存者模式的人數改變時，重置時間選項
    const handlePlayerCountChange = (e) => {
        const count = e.target.value
        setFormData(prev => {
            const updates = { playerCount: count }
            if (prev.gameMode === 'survivor') {
                updates.gameTime = MODE_CONFIGS.survivor.gameTimes[count][0]
                updates.customMinutes = ''
            }
            return { ...prev, ...updates }
        })
    }

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

        if (formData.mapSize === 'custom' && !customBoundary) {
            alert('請先繪製自訂邊界！')
            return
        }

        // 驗證自定義輸入
        if (formData.gameTime === 'custom') {
            if (formData.gameMode !== 'survivor') {
                if (!formData.customRounds || !formData.customMinutes) {
                    alert('請填寫自定義回合與分鐘！')
                    return
                }
            } else {
                if (!formData.customMinutes) {
                    alert('請填寫自定義分鐘！')
                    return
                }
            }
        }

        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase()
        if (customBoundary) {
            localStorage.setItem(`room_${roomId}_boundary`, JSON.stringify(customBoundary))
        }

        navigate(`/lobby/${roomId}`)
    }

    const currentTimes = formData.gameMode === 'survivor'
        ? MODE_CONFIGS.survivor.gameTimes[formData.playerCount]
        : MODE_CONFIGS[formData.gameMode].gameTimes

    return (
        <div className="create-room-page page">
            <h1 className="page-title">創建房間</h1>

            <form className="create-form" onSubmit={handleSubmit}>
                {/* 1. 遊戲模式 */}
                <div className="form-group">
                    <label className="form-label">遊戲模式:</label>
                    <select
                        name="gameMode"
                        value={formData.gameMode}
                        onChange={handleModeChange}
                        className="select-field"
                    >
                        {Object.entries(MODE_CONFIGS).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>

                {/* 2. 遊玩人數 */}
                <div className="form-group">
                    <label className="form-label">遊玩人數:</label>
                    <select
                        name="playerCount"
                        value={formData.playerCount}
                        onChange={handlePlayerCountChange}
                        className="select-field"
                    >
                        {MODE_CONFIGS[formData.gameMode].playerCounts.map(count => (
                            <option key={count} value={count}>{playerCountLabels[count] || count}</option>
                        ))}
                    </select>
                </div>

                {/* 3. 地圖大小 (CQB 模式隱藏) */}
                {formData.gameMode !== 'cqb' && (
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
                )}

                {/* 4. 遊戲時間 */}
                <div className="form-group">
                    <label className="form-label">遊戲時間:</label>
                    <select
                        name="gameTime"
                        value={formData.gameTime}
                        onChange={handleChange}
                        className="select-field"
                    >
                        {currentTimes.map(time => (
                            <option key={time} value={time}>{timeOptionLabels(time)}</option>
                        ))}
                    </select>

                    {/* 自定義輸入框 */}
                    {formData.gameTime === 'custom' && (
                        <div className="custom-time-inputs">
                            {formData.gameMode !== 'survivor' ? (
                                <div className="custom-input-row">
                                    <input
                                        type="number"
                                        placeholder="回合"
                                        value={formData.customRounds}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customRounds: e.target.value }))}
                                        className="input-field small-input"
                                    />
                                    <span>回合，每回合</span>
                                    <input
                                        type="number"
                                        placeholder="分鐘"
                                        value={formData.customMinutes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customMinutes: e.target.value }))}
                                        className="input-field small-input"
                                    />
                                    <span>分鐘</span>
                                </div>
                            ) : (
                                <div className="custom-input-row">
                                    <input
                                        type="number"
                                        placeholder="分鐘"
                                        value={formData.customMinutes}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customMinutes: e.target.value }))}
                                        className="input-field small-input"
                                    />
                                    <span>分鐘</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 5. 房間名稱 */}
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

                {/* 6. 密碼 */}
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
