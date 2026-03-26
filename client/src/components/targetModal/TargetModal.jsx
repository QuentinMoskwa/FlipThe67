import './TargetModal.css'
import { Card } from '../card/Card.jsx'

/**
 * Modal de ciblage pour les cartes Action (Freeze / FlipThree).
 * Affiché uniquement sur le client qui doit choisir une cible.
 *
 * @param {{ type: string, value: string }} card
 * @param {{ id: string, name: string }[]} targets
 * @param {(targetId: string) => void} onSelect
 */
export default function TargetModal({ card, targets, onSelect }) {
    return (
        <div className="target-modal-backdrop">
            <div className="target-modal-panel">
                <p className="target-modal-label">Choisir une cible</p>

                <div className="target-modal-card">
                    <Card card={card} faceDown={false} />
                </div>

                <div className="target-modal-targets">
                    {targets.map(t => (
                        <button
                            key={t.id}
                            className="target-modal-btn"
                            onClick={() => onSelect(t.id)}
                        >
                            <span className="target-modal-btn-avatar">
                                {t.name.charAt(0).toUpperCase()}
                            </span>
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}
