import {useEffect, useCallback} from 'react'
import {Card} from '../card/Card.jsx'
import PlayerArea from '../playerArea/PlayerArea.jsx'
import {useSocket} from '../../hooks/useSocket.js'
import './GameBoard.css'

// ─── Placement des joueurs ────────────────────────────────────
function computeSlots(players, myId) {
    const me = players.find(p => p.id === myId)
    const others = players.filter(p => p.id !== myId)
    const slots = {top: null, right: null, bottom: me ?? null, left: null}

    if (others.length === 1) {
        slots.top = others[0]
    } else if (others.length === 2) {
        slots.top = others[0];
        slots.right = others[1]
    } else if (others.length >= 3) {
        slots.top = others[0];
        slots.left = others[1];
        slots.right = others[2]
    }

    return slots
}

const PHASE_LABELS = {
    dealing: 'Distribution',
    waiting: 'En attente',
    scoring: 'Scores',
    ended: 'Fin de manche',
}

// ─── GameBoard ────────────────────────────────────────────────

/**
 * @param {object}    props
 * @param {GameState} props.gameState - état complet reçu du serveur via game-state-update
 * @param {string}    props.myId      - playerId du joueur local (géré par App)
 */
export default function GameBoard({gameState, myId}) {
    const {phase, round, players} = gameState
    const playerStates = round?.playerStates ?? {}

    const {emit, on, off} = useSocket()

    const slots = computeSlots(players, myId)
    const currentPlayer = players[round?.currentPlayerIndex ?? 0]
    const isMyTurn = currentPlayer?.id === myId
    const myState = playerStates[myId] ?? {}
    const deckCount = round?.deck?.length ?? 0

    const canAct = isMyTurn
        && phase === 'playing'
        && !myState.hasBusted
        && !myState.hasStayed

    // ── Handlers Socket.io ─────────────────────────────────────
    const handleSlay = useCallback(() => {
        if (!canAct) return
        emit('player-slay', {
            gameId: gameState.id,
            playerId: myId,
            // targetPlayerId : à implémenter quand l'interface de ciblage sera prête
        })
    }, [canAct, emit, gameState.id, myId])

    const handleStay = useCallback(() => {
        if (!canAct) return
        emit('player-stay', {
            gameId: gameState.id,
            playerId: myId,
        })
    }, [canAct, emit, gameState.id, myId])

    // Écoute des erreurs serveur (action hors-tour, etc.)
    useEffect(() => {
        const onError = ({message, reason}) => {
            console.warn('[GameBoard] action refusée :', message ?? reason)
        }
        on('error', onError)
        return () => off('error', onError)
    }, [on, off])

    // ── Banner ─────────────────────────────────────────────────
    const bannerState = (myState.hasBusted || myState.hasStayed)
        ? 'state-inactive'
        : isMyTurn
            ? 'state-my-turn'
            : 'state-other-turn'

    const bannerTurnText = phase === 'playing'
        ? myState.hasBusted
            ? 'Vous avez busté'
            : myState.hasStayed
                ? 'Vous avez stay'
                : isMyTurn
                    ? <strong>Votre tour</strong>
                    : <>Tour de <strong>{currentPlayer?.name ?? '…'}</strong></>
        : null

    // ── Rendu des slots ────────────────────────────────────────
    const renderSlot = (position) => {
        const player = slots[position]
        if (!player) return null
        const pState = playerStates[player.id] ?? {}

        if (position === 'bottom') {
            return (
                <div className="player-slot player-slot-bottom">
                    <div className="player-area-wrapper">
                        <PlayerArea
                            player={player}
                            playerState={pState}
                            isCurrentTurn={currentPlayer?.id === player.id}
                            isYou={true}
                        />
                        <div className="action-buttons-col">
                            <button
                                className="btn-action-square slay"
                                onClick={handleSlay}
                                disabled={!canAct}
                            >
                                Slay
                            </button>
                            <button
                                className="btn-action-square stay"
                                onClick={handleStay}
                                disabled={!canAct}
                            >
                                Stay
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return (
            <div className={`player-slot player-slot-${position}`}>
                <PlayerArea
                    player={player}
                    playerState={pState}
                    isCurrentTurn={currentPlayer?.id === player.id}
                    isYou={player.id === myId}
                />
            </div>
        )
    }

    return (
        <div className="gameboard-root">

            {/* ── Score de manche ── */}
            <div className="scores-panel">
                <div className="scores-title">Manche en cours</div>
                {players.map(p => (
                    <div key={p.id} className="score-row">
                        <span className={`score-name ${p.id === myId ? 'is-you' : ''}`}>
                            {p.name}{p.id === myId ? ' ★' : ''}
                        </span>
                        <span className="score-value">
                            {playerStates[p.id]?.roundScore ?? 0}
                        </span>
                    </div>
                ))}
            </div>

            {renderSlot('top')}
            {renderSlot('left')}
            {renderSlot('right')}
            {renderSlot('bottom')}

            {/* ── Zone centrale ── */}
            <div className="gameboard-center">

                <div className={`phase-banner ${bannerState}`}>
                    <div className="phase-banner-dot"/>
                    <span>{PHASE_LABELS[phase] ?? 'En jeu'}</span>
                    {bannerTurnText && (
                        <span className="phase-banner-turn">— {bannerTurnText}</span>
                    )}
                </div>

                <div className="deck-area">
                    <span className="deck-label">Dealer</span>
                    <div className="deck-stack" onClick={canAct ? handleSlay : undefined}>
                        <div className="deck-stack-shadow"/>
                        <div className="deck-stack-shadow"/>
                        <div className="deck-top-card">
                            <Card
                                card={{id: 'deck', type: 'number', value: 0}}
                                faceDown={true}
                            />
                        </div>
                    </div>
                    <span className="deck-count">{deckCount} cartes</span>
                </div>
            </div>
        </div>
    )
}
