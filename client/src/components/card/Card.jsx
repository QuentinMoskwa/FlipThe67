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

const ACTION_VALUES = {
    freeze:        { icon: '❄', value: 'FREEZE' },
    flip3:         { icon: '×3', value: 'FLIP 3' },
    second_chance: { icon: '2ND', value: 'CHANCE' },
}

const MODIFIER_VALUES = {
    'x2':  { value: '×2' },
    '+2':  { value: '+2' },
    '+4':  { value: '+4' },
    '+6':  { value: '+6' },
    '+8':  { value: '+8' },
    '+10': { value: '+10' },
}

// ─── Normalisation des valeurs d'action ──────────────────────
// Le backend émet 'flipThree'/'secondChance'.
// Les clés internes de Card sont 'flip3'/'second_chance'.
// On normalise ici une fois pour toutes — aucun appelant n'a besoin d'un ACTION_VALUE_MAP.
const ACTION_VALUE_MAP = {
    flipThree:    'flip3',
    secondChance: 'second_chance',
}

function normalizeActionValue(card) {
    if (card?.type !== 'action') return card
    return { ...card, value: ACTION_VALUE_MAP[card.value] ?? card.value }
}

function CardFront({ card }) {
    card = normalizeActionValue(card)
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
            const info = ACTION_VALUES[card.value] ?? { icon: '?', value: card.value }
            return (
                <div className="card-action">
                    <span className="card-action-icon">{info.icon}</span>
                    <span className="card-action-value">{info.value}</span>
                </div>
            )
        }

        if (card.type === 'modifier') {
            // Correction : lookup sur card.value (clé réelle), card.value en fallback
            const info = MODIFIER_VALUES[card.value] ?? MODIFIER_VALUES[card.value] ?? { value: card.value ?? card.value }
            return (
                <div className="card-modifier">
                    <span className="card-modifier-value">{info.value}</span>
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
