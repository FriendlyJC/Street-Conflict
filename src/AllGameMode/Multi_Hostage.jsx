import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../pages/Game.css'

function Multi_Hostage() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>🤝 人質救援 (Room: {roomId})</h1>
                <p>開發中：救援人質 or 阻止撤離...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/multiplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Multi_Hostage
