import './RoundSummary.css'
import {useCardCanvas} from "../../hooks/useCardCanvas.js";
import {useRef} from "react";

// ─── Helpers ──────────────────────────────────────────────

/**
 * Chip d'une carte jouée — couleur selon le type.
 */
function CardChip({ card }) {
    const label =
        card.type === 'number'   ? String(card.value) :
            card.type === 'action'   ? card.value          :
                card.value /* modifier */

    return (
        <span className={`rs-card-chip chip-${card.type}`}>
      {label}
    </span>
    )
}

/**
 * Retourne le statut d'un joueur pour la manche.
 * @returns {'bust'|'flip7'|'stayed'}
 */
function getStatus(playerState) {
    if (playerState.hasBusted)    return 'bust'
    if (playerState.hasFlipSeven) return 'flip7'
    return 'stayed'
}

const STATUS_LABELS = {
    bust:    'Bust',
    flip7:   'Flip 7 !',
    stayed:  'Stay',
}

/**
 * Trouve le joueur avec le roundScore le plus élevé (non busté).
 * En cas d'égalité, retourne tous les gagnants du round.
 *
 * @param {PlayerRoundState[]} playerStates - tableau des états de manche
 * @param {Player[]}           players
 * @returns {string[]} IDs des gagnants du round
 */
function getRoundWinnerIds(playerStates, players) {
    const eligible = playerStates.filter(ps => !ps.hasBusted)
    if (eligible.length === 0) return []

    const maxScore = Math.max(...eligible.map(ps => ps.roundScore))
    return eligible
        .filter(ps => ps.roundScore === maxScore)
        .map(ps => ps.playerId)
}

// ─── Composant principal ──────────────────────────────────

/**
 * @param {object}     props
 * @param {GameState}  props.gameState   - état global de la partie
 * @param {boolean}    props.isHost      - l'utilisateur courant est-il le host ?
 * @param {string}     props.myId        - playerId de l'utilisateur courant
 * @param {number}     props.roundNumber - numéro de la manche affichée
 * @param {Function}   props.onContinue  - callback "Manche suivante" (host uniquement)
 */
export default function RoundSummary({ gameState, isHost, myId, roundNumber, onContinue }) {
    const canvasRef = useRef(null)
    useCardCanvas(canvasRef)
    const { players, scores, round } = gameState

    const playerStates = players.map(p => ({
        player: p,
        state:  round.playerStates[p.id],
    })).sort((a, b) => b.state.roundScore - a.state.roundScore)

    const roundWinnerIds = getRoundWinnerIds(
        playerStates.map(ps => ps.state),
        players,
    )

    const roundWinnerNames = roundWinnerIds
        .map(id => players.find(p => p.id === id)?.name ?? id)
        .join(' & ')

    return (
        <div className="rs-root">
            <canvas ref={canvasRef} className="roundSummary-canvas" />
            <div className="rs-panel">

                {/* ── Header ── */}
                <div className="rs-header">
                    <div className="rs-header-left">
                        <h2>Fin de manche</h2>
                        <div className="rs-round-label">Manche {roundNumber}</div>
                    </div>

                    {roundWinnerNames && (
                        <div className="rs-round-winner">
                            <span className="rs-round-winner-label">Meilleur score</span>
                            <span className="rs-round-winner-name">{roundWinnerNames}</span>
                        </div>
                    )}
                </div>

                {/* ── Liste joueurs ── */}
                <div className="rs-players">
                    {playerStates.map(({ player, state }) => {
                        const status = getStatus(state)

                        return (
                            <div
                                key={player.id}
                                className={`rs-player-row is-${status}`}
                            >
                                {/* Avatar */}
                                <div className="rs-avatar">
                                    {player.name.charAt(0).toUpperCase()}
                                </div>

                                {/* Nom + cartes jouées */}
                                <div className="rs-player-info">
                                    <div className="rs-player-name">
                                        {player.name}
                                        {player.id === myId && (
                                            <span style={{ color: 'var(--slate-lo)', fontSize: '0.72rem', marginLeft: 6 }}>
                        (vous)
                      </span>
                                        )}
                                    </div>
                                    <div className="rs-cards-played">
                                        {state.cards.length === 0 ? (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--slate-lo)' }}>—</span>
                                        ) : (
                                            state.cards.map(card => (
                                                <CardChip key={card.id} card={card} />
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Status badge */}
                                <span className={`rs-status-badge ${status}`}>
                  {STATUS_LABELS[status]}
                </span>

                                {/* Scores */}
                                <div className="rs-scores">
                                    <div className={`rs-round-score ${state.roundScore === 0 ? 'score-zero' : ''}`}>
                                        {state.roundScore > 0 ? `+${state.roundScore}` : '0'}
                                    </div>
                                    <div className="rs-cumulative-score">
                                        {scores[player.id] ?? 0} pts
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Footer ── */}
                <div className="rs-footer">
                    <div className="rs-target-info">
                        Objectif : <span>200 pts</span>
                    </div>

                    {isHost ? (
                        <button className="rs-btn-continue" onClick={onContinue}>
                            Manche suivante →
                        </button>
                    ) : (
                        <div className="rs-host-only-hint">
                            En attente du host…
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}