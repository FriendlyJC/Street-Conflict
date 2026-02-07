import { useNavigate } from 'react-router-dom'
import './ModeSelection.css'

function ModeSelection() {
    const navigate = useNavigate()

    const handleGoogleLogin = () => {
        // TODO: Implement Google OAuth login
        alert('Google 登入功能開發中')
    }

    return (
        <div className="mode-selection-page">
            {/* Google Login Button - Top Left */}
            <button className="google-login-btn" onClick={handleGoogleLogin}>
                <span className="google-icon">G</span>
                Google 登入
            </button>

            {/* Background with scope overlay */}
            <div className="home-background">
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
                        onClick={() => navigate('/multiplayer')}
                    >
                        多人模式
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => navigate('/singleplayer')}
                    >
                        單人模式
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ModeSelection
