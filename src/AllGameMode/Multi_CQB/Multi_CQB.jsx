import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../../pages/Game.css'

function Multi_CQB() {
    const navigate = useNavigate()
    const { roomId } = useParams()

    return (
        <div className="game-page">
            <div className="game-end-overlay">
                <h1>🏠 室內近戰 CQB (Room: {roomId})</h1>
                <p>開發中：狹小空間內的生死決戰...</p>
                <div className="game-end-actions">
                    <button className="btn btn-secondary" onClick={() => navigate('/multiplayer')}>返回</button>
                </div>
            </div>
        </div>
    )
}

export default Multi_CQB
