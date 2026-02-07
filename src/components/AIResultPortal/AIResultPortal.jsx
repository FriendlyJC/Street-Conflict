import { useState, useEffect } from 'react'
import './AIResultPortal.css'

/**
 * AIResultPortal - AI 判定除錯彈窗
 * 顯示最新的 Shoot, HumanRec, Result 三張測試圖片
 */
function AIResultPortal({ onClose }) {
    const [images, setImages] = useState({
        shoot: '',
        human: '',
        result: ''
    })

    useEffect(() => {
        // 從 localStorage 讀取最新的測試圖片
        setImages({
            shoot: localStorage.getItem('streetconflict_test_shoot') || '',
            human: localStorage.getItem('streetconflict_test_human') || '',
            result: localStorage.getItem('streetconflict_test_result') || ''
        })
    }, [])

    return (
        <div className="ai-portal-overlay" onClick={onClose}>
            <div className="ai-portal-content" onClick={e => e.stopPropagation()}>
                <div className="ai-portal-header">
                    <h2>戰鬥數據分析 (Debug Mode)</h2>
                    <button className="close-portal-btn" onClick={onClose}>×</button>
                </div>

                <div className="ai-portal-grid">
                    <div className="portal-item">
                        <h3>1. Shoot (原始擷取)</h3>
                        {images.shoot ? (
                            <img src={images.shoot} alt="Shoot" />
                        ) : (
                            <div className="empty-img">尚未射擊</div>
                        )}
                    </div>

                    <div className="portal-item">
                        <h3>2. HumanRec (人像辨識)</h3>
                        {images.human ? (
                            <img src={images.human} alt="Human" />
                        ) : (
                            <div className="empty-img">尚未辨識</div>
                        )}
                    </div>

                    <div className="portal-item">
                        <h3>3. Result (命中判定)</h3>
                        {images.result ? (
                            <img src={images.result} alt="Result" />
                        ) : (
                            <div className="empty-img">尚未判定</div>
                        )}
                    </div>
                </div>

                <div className="ai-portal-footer">
                    <p>※ 黃框：頭部｜紅框：軀幹 (含手臂)｜藍框：腿部｜螢光綠點：判定點 (6px)</p>
                </div>
            </div>
        </div>
    )
}

export default AIResultPortal
