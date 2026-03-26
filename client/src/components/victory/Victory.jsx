import {useMemo, useRef} from 'react'
import './Victory.css'
import {useCardCanvas} from "../../hooks/useCardCanvas.js";

// ─── Helpers ───────────────────────────────────────────────

/**
 * Construit le classement trié par score décroissant.
 * Gère les ex-aequo.
 *
 * @param {Player[]} players
 * @param {Record<string,number>} scores
 * @param {string[]} winnerIds
 * @returns {{ player, score, rank, isWinner }[]}
 */
function buildLeaderboard(players, scores, winnerIds) {
    const sorted = [...players].sort(
        (a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0)
    )

    let rank = 1
    return sorted.map((player, i) => {
        if (i > 0 && scores[sorted[i].id] < scores[sorted[i - 1].id]) {
            rank = i + 1
        }
        return {
            player,
            score: scores[player.id] ?? 0,
            rank,
            isWinner: winnerIds.includes(player.id),
        }
    })
}

// ─── Composant principal ───────────────────────────────────

/**
 * @param {object}    props
 * @param {GameState} props.gameState   - état final de la partie
 * @param {string[]}  props.winnerIds   - IDs des gagnants (ex-aequo possible)
 * @param {string}    props.myId        - playerId de l'utilisateur courant
 * @param {boolean}   props.isHost      - l'utilisateur courant est-il le host ?
 * @param {Function}  props.onPlayAgain - callback "Rejouer" (host uniquement)
 * @param {Function}  props.onLobby     - callback "Retour au lobby"
 */
export default function Victory({gameState, winnerIds, myId, isHost, onPlayAgain, onLobby}) {
    const canvasRef = useRef(null)
    useCardCanvas(canvasRef)
    const {players, scores} = gameState

    const leaderboard = useMemo(
        () => buildLeaderboard(players, scores, winnerIds),
        [players, scores, winnerIds]
    )

    const winnerNames = winnerIds
        .map(id => players.find(p => p.id === id)?.name ?? id)
        .join(' & ')

    const winnerScore = scores[winnerIds[0]] ?? 0
    const isTie = winnerIds.length > 1
    const iAmWinner = winnerIds.includes(myId)

    return (
        <div className="victory-root">
            <canvas ref={canvasRef} className="victory-canvas" />
            <div className="victory-panel">

                {/* ── Hero ── */}
                <div className="victory-hero">

                    <div className="victory-crown">
                        <span className="hand flipped">🫴</span>
                        {iAmWinner ? '😏' : '🤪'}
                        <span className="hand">🫴</span>
                    </div>

                    <div className="victory-winner-name">{winnerNames}</div>

                    {isTie && (
                        <div className="victory-tie-badge">Égalité</div>
                    )}

                    <div className="victory-winner-score">
                        {winnerScore} pts
                    </div>

                    <div className="victory-title">
                        {iAmWinner ? 'Vous avez gagné !' : 'Vous avez perdu !'}
                    </div>
                </div>

                {/* ── Classement ── */}
                <div className="victory-leaderboard">
                    <div className="victory-lb-title">Classement final</div>

                    {leaderboard.map(({player, score, rank, isWinner}) => (
                        <div
                            key={player.id}
                            className={`victory-lb-row ${isWinner ? 'is-winner' : ''}`}
                        >
                            <div className={`victory-lb-rank rank-${rank}`}>
                                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`}
                            </div>

                            <div className={`victory-lb-name ${player.id === myId ? 'is-me' : ''}`}>
                                {player.name}
                                {player.id === myId && (
                                    <span style={{color: 'var(--slate-lo)', fontSize: '0.7rem', marginLeft: 6}}>
                    (vous)
                  </span>
                                )}
                            </div>

                            <div className={`victory-lb-score ${isWinner ? 'is-winner-score' : ''}`}>
                                {score}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Footer ── */}
                <div className="victory-footer">
                    {isHost && (
                        <button className="victory-btn-again" onClick={onPlayAgain}>
                            Rejouer
                        </button>
                    )}
                    <button className="victory-btn-lobby" onClick={onLobby}>
                        Retour au logoby
                    </button>
                </div>

            </div>
        </div>
    )
}
