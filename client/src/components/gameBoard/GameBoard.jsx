import {useEffect, useCallback, useState} from 'react'
import {Card} from '../card/Card.jsx'
import PlayerArea from '../playerArea/PlayerArea.jsx'
import {useSocket} from '../../hooks/useSocket.js'
import './GameBoard.css'

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
    playing: 'En jeu',
    scoring: 'Scores',
    ended: 'Fin de manche',
}

// ─── Modal de ciblage ─────────────────────────────────────────
function TargetModal({card, targets, onSelect}) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: '#101828',
                border: '1px solid rgba(126,168,212,0.3)',
                borderRadius: 16, padding: '28px 32px',
                display: 'flex', flexDirection: 'column', gap: 16,
                minWidth: 280,
            }}>
                <p style={{
                    color: '#a3c2e8',
                    fontSize: '0.78rem',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    margin: 0
                }}>
                    Choisir une cible
                </p>
                <p style={{color: '#e8f0f8', fontSize: '0.9rem', margin: 0}}>
                    Carte : <strong>{card?.value}</strong>
                </p>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                    {targets.map(t => (
                        <button
                            key={t.id}
                            onClick={() => onSelect(t.id)}
                            style={{
                                padding: '10px 16px',
                                background: 'rgba(126,168,212,0.1)',
                                border: '1px solid rgba(126,168,212,0.25)',
                                borderRadius: 8,
                                color: '#e8f0f8',
                                cursor: 'pointer',
                                fontSize: '0.88rem',
                                textAlign: 'left',
                            }}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default function GameBoard({gameState, myId}) {
    const {round, players} = gameState
    const phase = round?.phase ?? 'playing'
    const playerStates = round?.playerStates ?? {}

    const {emit, on, off} = useSocket()

    const [pendingTarget, setPendingTarget] = useState(null)

    const slots = computeSlots(players, myId)
    const currentPlayer = players[round?.currentPlayerIndex ?? 0]
    const isMyTurn = currentPlayer?.id === myId
    const myState = playerStates[myId] ?? {}
    const deckCount = round?.deck?.length ?? 0

    const canAct = isMyTurn
        && phase === 'playing'
        && !myState.hasBusted
        && !myState.hasStayed
        && !pendingTarget

    // ── Listeners ───────────────────────────────────────────────
    useEffect(() => {
        const onError = ({message, reason}) => {
            console.warn('[GameBoard] action refusée :', message ?? reason)
        }

        const onActionRequiresTarget = ({card, availableTargets}) => {
            setPendingTarget({card, availableTargets})
        }

        on('error', onError)
        on('action-requires-target', onActionRequiresTarget)

        return () => {
            off('error', onError)
            off('action-requires-target', onActionRequiresTarget)
        }
    }, [on, off])

    // ── Handlers ────────────────────────────────────────────────
    const handleSlay = useCallback(() => {
        if (!canAct) return
        emit('player-action', {gameId: gameState.id, playerId: myId, action: 'slay'})
    }, [canAct, emit, gameState.id, myId])

    const handleStay = useCallback(() => {
        if (!canAct) return
        emit('player-action', {gameId: gameState.id, playerId: myId, action: 'stay'})
    }, [canAct, emit, gameState.id, myId])

    const handleSelectTarget = (targetPlayerId) => {
        emit('target-player', {gameId: gameState.id, targetPlayerId})
        setPendingTarget(null)
    }

    // ── Banner ──────────────────────────────────────────────────
    const bannerState = (myState.hasBusted || myState.hasStayed)
        ? 'state-inactive'
        : isMyTurn
            ? 'state-my-turn'
            : 'state-other-turn'

    const bannerTurnText = phase === 'playing'
        ? pendingTarget
            ? <strong>Choisissez une cible</strong>
            : myState.hasBusted
                ? 'Vous avez busté'
                : myState.hasStayed
                    ? 'Vous avez stay'
                    : isMyTurn
                        ? <strong>Votre tour</strong>
                        : <>Tour de <strong>{currentPlayer?.name ?? '…'}</strong></>
        : null

    // ── Rendu des slots ─────────────────────────────────────────
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

            {/* Modal de ciblage - affiché uniquement sur le client qui attend */}
            {pendingTarget && (
                <TargetModal
                    card={pendingTarget.card}
                    targets={pendingTarget.availableTargets}
                    onSelect={handleSelectTarget}
                />
            )}

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

            <div className="gameboard-center">

                <div className={`phase-banner ${bannerState}`}>
                    <div className="phase-banner-dot"/>
                    <span>{PHASE_LABELS[phase] ?? 'En jeu'}</span>
                    {bannerTurnText && (
                        <span className="phase-banner-turn">- {bannerTurnText}</span>
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
