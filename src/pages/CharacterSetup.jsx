import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPlayerState, updatePlayerState } from '../utils/playerState'
import './CharacterSetup.css'

function CharacterSetup() {
    const navigate = useNavigate()
    const { roomId } = useParams()
    const fileInputRef = useRef(null)

    // Load current player state
    const [playerState, setPlayerState] = useState(() => getPlayerState())

    const [mode, setMode] = useState('photo') // 'photo' or 'description'
    const [photo, setPhoto] = useState(null)
    const [formData, setFormData] = useState({
        // Clothing
        clothingStyle: '',
        clothingColor: '',
        clothingPattern: '',
        // Pants
        pantsStyle: '',
        pantsColor: '',
        // Accessories
        hasHat: false,
        hatColor: '',
        hasGloves: false,
        hairstyle: ''
    })

    // Redirect if player is referee (they don't need appearance)
    useEffect(() => {
        if (playerState.team === 'referee') {
            alert('審判官不需要設定外觀！')
            navigate(`/lobby/${roomId}`)
        }
    }, [playerState.team, roomId, navigate])

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setPhoto(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleSubmit = () => {
        // Mark player as having set their appearance
        const newState = updatePlayerState({
            hasAppearance: true,
            appearanceData: mode === 'photo'
                ? { type: 'photo', photo, ...formData }
                : { type: 'description', ...formData }
        })
        setPlayerState(newState)

        // Navigate back to lobby
        navigate(`/lobby/${roomId}`)
    }

    // Don't render if referee
    if (playerState.team === 'referee') {
        return null
    }

    return (
        <div className="character-setup-page page">
            <h1 className="page-title">設定外觀</h1>

            {/* Show current team */}
            <div className="current-team-info">
                目前隊伍: <strong>{playerState.team === 'teamA' ? '隊伍A' : '隊伍B'}</strong>
            </div>

            {/* Mode Tabs */}
            <div className="mode-tabs">
                <button
                    className={`mode-tab ${mode === 'photo' ? 'active' : ''}`}
                    onClick={() => setMode('photo')}
                >
                    快速精確
                </button>
                <button
                    className={`mode-tab ${mode === 'description' ? 'active' : ''}`}
                    onClick={() => setMode('description')}
                >
                    絕對隱私
                </button>
            </div>

            {/* Photo Mode */}
            {mode === 'photo' && (
                <div className="setup-content">
                    <div
                        className="photo-upload-area"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {photo ? (
                            <img src={photo} alt="預覽" className="photo-preview" />
                        ) : (
                            <div className="upload-placeholder">
                                <span className="upload-icon">📷</span>
                                <span>上傳照片</span>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handlePhotoUpload}
                            hidden
                        />
                    </div>

                    <div className="supplement-section">
                        <h3>補充特徵：</h3>
                        <div className="checkbox-group">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    name="hasHat"
                                    checked={formData.hasHat}
                                    onChange={handleChange}
                                />
                                <span>帽子: V/X</span>
                            </label>
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    name="hasGloves"
                                    checked={formData.hasGloves}
                                    onChange={handleChange}
                                />
                                <span>手錶: V/X</span>
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="form-label">髮型:</label>
                            <input
                                type="text"
                                name="hairstyle"
                                value={formData.hairstyle}
                                onChange={handleChange}
                                placeholder="輸入髮型描述"
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Description Mode */}
            {mode === 'description' && (
                <div className="setup-content">
                    <div className="privacy-notice">
                        <span className="notice-icon">⚠️</span>
                        <span>*死亡後無法申訴</span>
                    </div>

                    <div className="description-form">
                        <h3>特徵說明：</h3>

                        <div className="form-section">
                            <h4>衣服:</h4>
                            <div className="form-group">
                                <label className="form-label">-(款式)</label>
                                <input
                                    type="text"
                                    name="clothingStyle"
                                    value={formData.clothingStyle}
                                    onChange={handleChange}
                                    placeholder="例：T恤、外套"
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">-(顏色)</label>
                                <input
                                    type="text"
                                    name="clothingColor"
                                    value={formData.clothingColor}
                                    onChange={handleChange}
                                    placeholder="例：黑色、深藍"
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">-(花紋)</label>
                                <input
                                    type="text"
                                    name="clothingPattern"
                                    value={formData.clothingPattern}
                                    onChange={handleChange}
                                    placeholder="例：條紋、素色"
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <h4>褲子:</h4>
                            <div className="form-group">
                                <label className="form-label">-(款式)</label>
                                <input
                                    type="text"
                                    name="pantsStyle"
                                    value={formData.pantsStyle}
                                    onChange={handleChange}
                                    placeholder="例：牛仔褲、運動褲"
                                    className="input-field"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">-(顏色)</label>
                                <input
                                    type="text"
                                    name="pantsColor"
                                    value={formData.pantsColor}
                                    onChange={handleChange}
                                    placeholder="例：黑色"
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <label className="checkbox-item">
                                <input
                                    type="checkbox"
                                    name="hasHat"
                                    checked={formData.hasHat}
                                    onChange={handleChange}
                                />
                                <span>帽子: V/X</span>
                            </label>
                            {formData.hasHat && (
                                <div className="form-group">
                                    <label className="form-label">-(顏色)</label>
                                    <input
                                        type="text"
                                        name="hatColor"
                                        value={formData.hatColor}
                                        onChange={handleChange}
                                        placeholder="帽子顏色"
                                        className="input-field"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">髮型:</label>
                            <input
                                type="text"
                                name="hairstyle"
                                value={formData.hairstyle}
                                onChange={handleChange}
                                placeholder="輸入髮型描述"
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="form-actions">
                <button className="btn btn-secondary" onClick={() => navigate(`/lobby/${roomId}`)}>
                    返回
                </button>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                >
                    確定創建
                </button>
            </div>
        </div>
    )
}

export default CharacterSetup
