import './Card.css'

const TYPE_CONFIG = {
    number: {
        bg: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
        border: '#3b82f6',
    },
    action: {
        bg: 'linear-gradient(135deg, #b45309, #92400e)',
        border: '#f59e0b',
    },
    // SecondChance reçoit son propre style rose
    second_chance: {
        bg: 'linear-gradient(135deg, #9d174d, #831843)',
        border: '#f472b6',
    },
    modifier: {
        bg: 'linear-gradient(135deg, #065f46, #064e3b)',
        border: '#10b981',
    },
}

const ACTION_LABELS = {
    freeze:        { icon: '❄', label: 'FREEZE' },
    flip3:         { icon: '×3', label: 'FLIP 3' },
    second_chance: { icon: '2ND', label: 'CHANCE' },
}

const MODIFIER_LABELS = {
    'x2':  { label: '×2' },
    '+2':  { label: '+2' },
    '+4':  { label: '+4' },
    '+6':  { label: '+6' },
    '+8':  { label: '+8' },
    '+10': { label: '+10' },
}

function CardFront({ card }) {
    // SecondChance a son propre style visuel
    const configKey = card.value === 'second_chance' ? 'second_chance' : card.type
    const cardConfig = TYPE_CONFIG[configKey] ?? TYPE_CONFIG.number

    const renderContent = () => {
        if (card.type === 'number') {
            return (
                <div className="card-number">
                    <span className="card-number-value">{card.value}</span>
                </div>
            )
        }

        if (card.type === 'action') {
            const info = ACTION_LABELS[card.value] ?? { icon: '?', label: card.value }
            return (
                <div className="card-action">
                    <span className="card-action-icon">{info.icon}</span>
                    <span className="card-action-label">{info.label}</span>
                </div>
            )
        }

        if (card.type === 'modifier') {
            // Correction : lookup sur card.value (clé réelle), card.label en fallback
            const info = MODIFIER_LABELS[card.value] ?? MODIFIER_LABELS[card.label] ?? { label: card.value ?? card.label }
            return (
                <div className="card-modifier">
                    <span className="card-modifier-value">{info.label}</span>
                </div>
            )
        }
    }

    return (
        <div className="card-face card-front" style={{ background: cardConfig.bg, borderColor: cardConfig.border }}>
            {renderContent()}
        </div>
    )
}

function CardBack() {
    return (
        <div className="card-face card-back">
            <div className="card-back-pattern" />
            <div className="card-back-logo">F7</div>
        </div>
    )
}

export function Card({ card, faceDown = false, onClick }) {
    return (
        <div
            className={`card-wrapper ${faceDown ? 'face-down' : 'face-up'}`}
            onClick={onClick}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="card-inner">
                <CardFront card={card} />
                <CardBack />
            </div>
        </div>
    )
}
