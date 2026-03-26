import {useMemo} from 'react'
import './Victory.css'

// ─── Particules de fond ────────────────────────────────────

const NUMS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

function Particles() {
    const particles = useMemo(() => (
        Array.from({length: 16}, (_, i) => ({
            id: i,
            label: NUMS[Math.floor(Math.random() * NUMS.length)],
            left: `${5 + Math.random() * 90}%`,
            duration: `${6 + Math.random() * 10}s`,
            delay: `${Math.random() * 6}s`,
            size: `${12 + Math.random() * 14}px`,
        }))
    ), [])

    return (
        <div className="victory-particles">
            {particles.map(p => (
                <span
                    key={p.id}
                    className="victory-particle"
                    style={{
                        left: p.left,
                        bottom: '-30px',
                        fontSize: p.size,
                        animationDuration: p.duration,
                        animationDelay: p.delay,
                    }}
                >
          {p.label}
        </span>
            ))}
        </div>
    )
}

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
            <Particles/>

            <div className="victory-panel">

                {/* ── Hero ── */}
                <div className="victory-hero">
                    <div className="victory-crown">
                        {iAmWinner ? '★' : '◇'}
                    </div>

                    <div className="victory-title">
                        {iAmWinner ? 'Vous avez gagné !' : 'Partie terminée'}
                    </div>

                    {isTie && (
                        <div className="victory-tie-badge">Égalité</div>
                    )}

                    <div className="victory-winner-name">{winnerNames}</div>

                    <div className="victory-winner-score">
                        {winnerScore} pts
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
                                {rank === 1 ? '①' : rank === 2 ? '②' : rank === 3 ? '③' : `${rank}.`}
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
