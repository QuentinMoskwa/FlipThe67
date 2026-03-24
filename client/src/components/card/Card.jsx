import './Card.css'

const TYPE_CONFIG = {
  number: {
    bg: 'linear-gradient(135deg, #1d4ed8, #1e40af)',
    border: '#3b82f6',
    corner: '#93c5fd',
  },
  action: {
    bg: 'linear-gradient(135deg, #b45309, #92400e)',
    border: '#f59e0b',
    corner: '#fcd34d',
  },
  modifier: {
    bg: 'linear-gradient(135deg, #065f46, #064e3b)',
    border: '#10b981',
    corner: '#6ee7b7',
  },
}

const ACTION_LABELS = {
  freeze:        { icon: 'freeze', label: 'FREEZE' },
  flip3:         { icon: 'x3', label: 'FLIP 3' },
  second_chance: { icon: '2nd', label: '2ND' },
}

const MODIFIER_LABELS = {
  'x2':  { icon: '×', label: '×2' },
  '+2':  { icon: '+', label: '+2' },
  '+4':  { icon: '+', label: '+4' },
  '+6':  { icon: '+', label: '+6' },
  '+8':  { icon: '+', label: '+8' },
  '+10': { icon: '+', label: '+10' },
}

// Recto de la carte
function CardFront({ card }) {
  const cardConfig = TYPE_CONFIG[card.type] ?? TYPE_CONFIG.number

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
      const info = MODIFIER_LABELS[card.label] ?? { icon: '', label: card.label }
      return (
        <div className="card-modifier">
          <span className="card-modifier-value">{info.label}</span>
        </div>
      )
    }
  }

  return (
    <div className="card-face card-front"style={{background: cardConfig.bg,borderColor: cardConfig.border}}>
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
    <div className={`card-wrapper ${faceDown ? 'face-down' : 'face-up'}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="card-inner">
        <CardFront card={card} />
        <CardBack />
      </div>
    </div>
  )
}