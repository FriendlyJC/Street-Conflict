import { useNavigate } from 'react-router-dom'
import './Home.css'

function MultiplayerHome() {
    const navigate = useNavigate()

    return (
        <div className="home-page">
            {/* Background with scope overlay */}
            <div className="home-background multiplayer-bg">
                <div className="scope-overlay">
                    <div className="scope-crosshair"></div>
                </div>
            </div>

            {/* Content */}
            <div className="home-content animate-slide-up">
                <div className="home-time">
                    {new Date().toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })} {new Date().toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }).toUpperCase().replace(',', '.')}
                </div>

                <h1 className="home-title">
                    Street<br />Conflict
                </h1>

                <div className="home-buttons">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/create')}
                    >
                        創建房間
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/join')}
                    >
                        加入房間
                    </button>
                    <button
                        className="btn btn-secondary outline"
                        onClick={() => navigate('/')}
                    >
                        返回
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MultiplayerHome
