import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../pages/Game.css'

function Multi_LS() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>🏆 最後倖存者 (Room: {roomId})</h1>
                <p>開發中：在大混戰中生存到最後，成為最終王者...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/multiplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Multi_LS
