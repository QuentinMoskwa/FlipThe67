import { Card } from '../card/Card'
import './PlayerArea.css'

const ACTION_VALUE_MAP = {
    flipThree:    'flip3',
    secondChance: 'second_chance',
}

function normalizeCard(card) {
    if (card.type !== 'action') return card
    return { ...card, value: ACTION_VALUE_MAP[card.value] ?? card.value }
}

function resolveStatus(playerState) {
    if (playerState.hasFlipSeven) return 'flip7'
    if (playerState.hasBusted)    return 'busted'
    if (playerState.hasStayed)    return 'stayed'
    return 'active'
}

const STATUS_LABELS = {
    active: 'Actif',
    stayed: 'Stay',
    busted: 'Bust',
    flip7:  'Flip 7 !',
}

/**
 * @param {{ id: string, name: string }} player
 * @param {Object}  playerState  - PlayerRoundState
 * @param {boolean} isCurrentTurn
 * @param {boolean} isYou
 */
export default function PlayerArea({ player, playerState, isCurrentTurn, isYou }) {
    const status     = resolveStatus(playerState)
    const isInactive = status === 'stayed' || status === 'busted'
    const cards      = playerState.cards ?? []

    const modifierCards = cards.filter(c => c.type === 'modifier' || c.type === 'action')
    const numberCards   = cards.filter(c => c.type === 'number')

    return (
        <div className={[
            'player-area',
            isCurrentTurn ? 'is-current-turn' : '',
            isInactive    ? 'is-inactive'      : '',
        ].filter(Boolean).join(' ')}>

            <div className="player-area-cards-stack">
                {cards.length === 0 ? (
                    <div className="player-area-cards-empty">
                        <span className="player-area-cards-empty-icon">🂠</span>
                    </div>
                ) : (
                    <>
                        {modifierCards.length > 0 && (
                            <div className="player-area-cards modifiers-row">
                                {modifierCards.map(card => (
                                    <Card key={card.id} card={normalizeCard(card)} faceDown={false} />
                                ))}
                            </div>
                        )}
                        <div className="player-area-cards numbers-row">
                            {numberCards.map(card => (
                                <Card key={card.id} card={normalizeCard(card)} faceDown={false} />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="player-area-info">
                <div className="player-area-avatar">
                    {player.name.charAt(0).toUpperCase()}
                </div>
                <span className={`player-area-name ${isYou ? 'is-you' : ''}`}>
                    {player.name}{isYou ? ' (Vous)' : ''}
                </span>
                <span className="player-area-round-score">
                    {playerState.roundScore ?? 0}
                </span>
                <span className={`player-area-status ${status}`}>
                    {STATUS_LABELS[status]}
                </span>
            </div>
        </div>
    )
}
