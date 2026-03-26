import { useEffect } from 'react'
import './RulesModal.css'

const RULES_SECTIONS = [
    {
        title: 'But du jeu',
        content: 'Être le premier joueur à atteindre 200 points cumulés sur plusieurs manches.',
    },
    {
        title: 'Pioche',
        content: '79 cartes numérotées (le chiffre N apparaît N fois, sauf 0 → 1 exemplaire), 6 cartes modificateur (+2 +4 +6 +8 +10 ×2), et 9 cartes action (3× Freeze, 3× Flip Three, 3× Seconde Chance).',
    },
    {
        title: 'Tour de jeu',
        items: [
            'À votre tour, choisissez Slay (piocher) ou Stay (banquer votre score).',
            'Vous pouvez piocher autant de fois que vous le souhaitez avant de Stay.',
            'Si vous piochez un doublon numéroté → Bust : votre score de manche tombe à 0.',
        ],
    },
    {
        title: 'Bust',
        content: 'Piocher une carte numérotée dont la valeur est déjà dans votre main provoque un Bust. Votre main est vidée et votre score de manche est 0.',
    },
    {
        title: 'lip 7',
        content: 'Avoir exactement 7 cartes numérotées toutes différentes en main déclenche le Flip 7. La manche se termine immédiatement et vous recevez +15 pts bonus.',
    },
    {
        title: 'Cartes Action',
        items: [
            'Freeze — Force un joueur de votre choix à Stay immédiatement.',
            'Flip Three — Force un joueur de votre choix à piocher 3 cartes.',
            'Seconde Chance — Annule votre prochain Bust (consommé automatiquement).',
        ],
    },
    {
        title: 'Cartes Modificateur',
        items: [
            '+2 / +4 / +6 / +8 / +10 — Ajoutent des points à votre score de manche.',
            '×2 — Double votre score de manche (appliqué en dernier).',
        ],
    },
    {
        title: 'Calcul du score',
        content: 'Somme des cartes numérotées + bonus Flip 7 + modificateurs additifs, puis ×2 si présent. Un joueur busté score 0.',
    },
    {
        title: 'Fin de partie',
        content: 'Dès qu\'un joueur atteint 200 pts, la manche se termine. En cas d\'égalité au sommet, une manche supplémentaire est jouée.',
    },
]

export default function RulesModal({ onClose }) {
    useEffect(() => {
        const onKeyDown = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [onClose])

    return (
        <div className="rules-overlay" onClick={onClose}>
            <div className="rules-modal" onClick={e => e.stopPropagation()}>

                <div className="rules-header">
                    <h2 className="rules-title">Règles — FlipThe<span>67</span></h2>
                    <button className="rules-close" onClick={onClose} title="Fermer">✕</button>
                </div>

                <div className="rules-body">
                    {RULES_SECTIONS.map((section, i) => (
                        <div key={i} className="rules-section">
                            <h3 className="rules-section-title">{section.title}</h3>
                            {section.content && (
                                <p className="rules-section-content">{section.content}</p>
                            )}
                            {section.items && (
                                <ul className="rules-section-list">
                                    {section.items.map((item, j) => (
                                        <li key={j}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}