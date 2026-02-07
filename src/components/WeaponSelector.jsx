import './WeaponSelector.css'

const weapons = [
    { id: 'shotgun', name: '霰彈槍', icon: '🔫', color: '#e67e22' },
    { id: 'rifle', name: '步槍', icon: '🎯', color: '#3498db' },
    { id: 'sniper', name: '狙擊槍', icon: '🔭', color: '#9b59b6' }
]

function WeaponSelector({ currentWeapon, onSelect }) {
    return (
        <div className="weapon-selector">
            {weapons.map(weapon => (
                <button
                    key={weapon.id}
                    className={`weapon-btn ${currentWeapon === weapon.id ? 'active' : ''}`}
                    style={{ '--weapon-color': weapon.color }}
                    onClick={() => onSelect(weapon.id)}
                >
                    <span className="weapon-icon">{weapon.icon}</span>
                    <span className="weapon-name">{weapon.name}</span>
                </button>
            ))}
        </div>
    )
}

export default WeaponSelector
