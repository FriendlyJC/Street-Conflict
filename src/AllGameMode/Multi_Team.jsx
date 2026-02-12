import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../pages/Game.css'

function Multi_Team() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>👥 團隊死戰 (Room: {roomId})</h1>
                <p>開發中：兩軍對壘，優先達到擊殺數的一方獲勝...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/multiplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Multi_Team
