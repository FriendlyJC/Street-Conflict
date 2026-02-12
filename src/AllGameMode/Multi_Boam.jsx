import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../pages/Game.css'

function Multi_Boam() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>💣 拆彈模式 (Room: {roomId})</h1>
                <p>開發中：安放炸彈 or 解除威脅...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/multiplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Multi_Boam
