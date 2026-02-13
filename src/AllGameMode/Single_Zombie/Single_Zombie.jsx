import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../pages/Game.css'

function Single_Zombie() {
    const navigate = useNavigate()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>🧟 殭屍模式</h1>
                <p>開發中：地圖上會隨機生成武器、建造資源及殭屍...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/singleplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Single_Zombie
