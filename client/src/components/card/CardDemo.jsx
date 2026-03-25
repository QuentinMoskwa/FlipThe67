import { useState } from 'react'
import { Card } from './Card'

// Deck infini pour la démo
const DECK = [
  { type: 'number', value: 7 },
  { type: 'number', value: 3 },
  { type: 'number', value: 11 },
  { type: 'action', value: 'freeze' },
  { type: 'modifier', value: 'x2', label: '×2' },
  { type: 'number', value: 5 },
  { type: 'action', value: 'flip3' },
  { type: 'number', value: 9 },
]

export default function CardDemo() {
  const [hand, setHand]             = useState([])
  const [animatingCard, setAnimatingCard] = useState(null) // carte en vol
  const [deckIndex, setDeckIndex]   = useState(0)

  const drawCard = () => {
    if (animatingCard) return // empêche les clics rapides pendant l'anim

    const newCard = {
      ...DECK[deckIndex % DECK.length],
      id: `card_${Date.now()}`,
      isNew: true, // flag pour déclencher l'animation d'entrée dans la main
    }

    setDeckIndex(i => i + 1)
    setAnimatingCard(newCard)

    // Après l'animation de vol (~400ms), on place la carte dans la main
    setTimeout(() => {
      setAnimatingCard(null)
      setHand(prev => [...prev, { ...newCard, isNew: false }])

      // Retire le flag isNew après l'animation d'entrée
      setTimeout(() => {
        setHand(prev =>
          prev.map(c => c.id === newCard.id ? { ...c, isNew: false } : c)
        )
      }, 400)
    }, 420)
  }

  return (
    <div style={{
      padding: 40,
      background: '#0f172a',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      gap: 60,
    }}>
      <h2 style={{ color: '#f9fafb', margin: 0 }}>FlipThe67 - Démo pioche</h2>

      {/* ── Pioche ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <span style={{ color: '#6b7280', fontSize: 13 }}>Pioche ({DECK.length - (deckIndex % DECK.length)} restantes)</span>

        <div style={{ position: 'relative' }}>

          {/* Effet de pile - cartes décalées derrière */}
          {[8, 4].map((offset, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: -offset / 2,
              left: offset / 2,
              width: 72, height: 104,
              borderRadius: 10,
              background: '#1f2937',
              border: '2px solid #374151',
              zIndex: i,
            }} />
          ))}

          {/* Carte du dessus - cliquable */}
          <div style={{ position: 'relative', zIndex: 3 }}>
            <Card
              card={{ id: 'deck', type: 'number', value: 0 }}
              faceDown={true}
              onClick={drawCard}
            />
          </div>

          {/* Carte en vol (animation de translation) */}
          {animatingCard && (
            <div className="card-flying" style={{ position: 'absolute', top: 0, left: 0, zIndex: 100 }}>
              <Card card={animatingCard} faceDown={false} />
            </div>
          )}
        </div>
      </div>

      {/* ── Main du joueur ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <span style={{ color: '#6b7280', fontSize: 13 }}>
          Ta main ({hand.length} carte{hand.length !== 1 ? 's' : ''})
        </span>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', minHeight: 104 }}>
          {hand.map(card => (
            <div
              key={card.id}
              className={card.isNew ? 'card-enter' : ''}
            >
              <Card card={card} faceDown={false} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
