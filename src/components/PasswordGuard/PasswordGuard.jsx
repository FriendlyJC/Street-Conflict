import React, { useState, useEffect } from 'react';
import './PasswordGuard.css';

const PasswordGuard = ({ children }) => {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState('');
    const CORRECT_PASSWORD = 'cycu114';

    useEffect(() => {
        // Check if already authorized in this session
        const authStatus = sessionStorage.getItem('streetconflict_auth');
        if (authStatus === 'true') {
            setIsAuthorized(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === CORRECT_PASSWORD) {
            sessionStorage.setItem('streetconflict_auth', 'true');
            setIsAuthorized(true);
            setError('');
        } else {
            setError('密碼錯誤，請重新輸入。');
            setPassword('');
        }
    };

    if (isAuthorized) {
        return children;
    }

    return (
        <div className="password-guard-overlay">
            <div className="password-guard-content animate-fade-in">
                <div className="password-guard-header">
                    <div className="lock-icon-large">🔒</div>
                    <h1>Street Conflict</h1>
                    <p>私密封測專用入口</p>
                </div>

                <form className="password-guard-form" onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="請輸入訪問密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="password-input"
                        autoFocus
                    />
                    {error && <p className="password-error">{error}</p>}
                    <button type="submit" className="password-submit-btn">
                        進入系統
                    </button>
                </form>

                <div className="password-guard-footer">
                    <p>© 2026 Street Conflict Alpha Test</p>
                </div>
            </div>
        </div>
    );
};

export default PasswordGuard;
