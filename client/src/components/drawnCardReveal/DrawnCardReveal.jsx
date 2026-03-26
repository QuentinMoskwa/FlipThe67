import { useState, useEffect } from 'react'
import { Card } from '../card/Card.jsx'
import './DrawnCardReveal.css'

const DRAW_RESULT_CONFIG = {
    bust:      { label: 'BUST !',   color: '#e74c3c', glow: 'rgba(231,76,60,0.4)'  },
    flipSeven: { label: 'FLIP 7 !', color: '#f1c40f', glow: 'rgba(241,196,15,0.4)' },
    action:    { label: 'ACTION',   color: '#f59e0b', glow: 'rgba(245,158,11,0.3)' },
    normal:    null,
}

/**
 * Révélation animée d'une carte piochée.
 * Visible par tous les joueurs après chaque Slay.
 * Séquence : face cachée → flip → label contextuel → fade out.
 *
 * @param {{ playerName: string, card: object, result: string }} reveal
 * @param {() => void} onDismiss
 */
export default function DrawnCardReveal({ reveal, onDismiss }) {
    const [flipped, setFlipped] = useState(false)
    const [hiding,  setHiding]  = useState(false)

    useEffect(() => {
        const flipTimer = setTimeout(() => setFlipped(true), 100)
        const hideTimer = setTimeout(() => {
            setHiding(true)
            setTimeout(onDismiss, 150)
        }, 1100)
        return () => {
            clearTimeout(flipTimer)
            clearTimeout(hideTimer)
        }
    }, [onDismiss])

    const config = DRAW_RESULT_CONFIG[reveal.result] ?? null

    return (
        <div className={`card-reveal-backdrop ${hiding ? 'hiding' : ''}`}>
            <div className="card-reveal-inner">
                <p className="card-reveal-player">
                    {reveal.playerName} pioche
                </p>
                <div
                    className="card-reveal-card"
                    style={config ? { filter: `drop-shadow(0 0 18px ${config.glow})` } : undefined}
                >
                    <Card card={reveal.card} faceDown={!flipped} />
                </div>
                {config && (
                    <p className="card-reveal-label" style={{ color: config.color }}>
                        {config.label}
                    </p>
                )}
            </div>
        </div>
    )
}
