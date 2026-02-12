import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../pages/Game.css'

function Multi_1v1() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>🗡️ 多人單挑 (Room: {roomId})</h1>
                <p>開發中：1 對 1 的男人決鬥...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/multiplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Multi_1v1
