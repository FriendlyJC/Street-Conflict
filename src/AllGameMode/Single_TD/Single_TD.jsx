import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../pages/Game.css'

function Single_TD() {
    const navigate = useNavigate()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>🏰 守塔模式</h1>
                <p>開發中：以此為中心抵禦波次敵人...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/singleplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Single_TD
