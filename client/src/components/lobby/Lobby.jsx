import {useState, useEffect, useRef, useCallback} from 'react'
import {useSocket} from '../../hooks/useSocket'
import {useCardCanvas} from '../../hooks/useCardCanvas'
import './Lobby.css'

// ─── Steps ────────────────────────────────────────────────────
// 'username' → 'menu' → 'join-form' | 'waiting'

/**
 * @param {Function} props.onGameReady  - ({ playerId, host }) → appelé quand le joueur
 *                                        a rejoint/créé une partie. Permet à App de stocker
 *                                        myId et isHost pour les vues suivantes.
 */
export default function Lobby({onGameReady}) {
    const canvasRef = useRef(null)
    useCardCanvas(canvasRef)

    const {connected, emit, on, off, savePlayerSession} = useSocket()

    const [step, setStep] = useState('username')
    const [username, setUsername] = useState('')
    const [joinCode, setJoinCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [gameCode, setGameCode] = useState(null)
    const [players, setPlayers] = useState([])
    const [isHost, setIsHost] = useState(false)
    const [myId, setMyId] = useState(null)
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')

    // ── Listener d'erreur global ───────────────────────────────
    useEffect(() => {
        const onError = ({message}) => {
            setError(message ?? 'Une erreur est survenue.')
            setStep(prev => prev === 'waiting' ? 'join-form' : prev)
            setLoading(false)
        }
        on('error', onError)
        return () => off('error', onError)
    }, [on, off])

    // ── Socket listeners (waiting room) ───────────────────────
    useEffect(() => {
        if (step !== 'waiting') return

        const onGameCreated = ({gameId, playerId}) => {
            savePlayerSession(gameId, playerId)
            setGameCode(gameId)
            setMyId(playerId)
            setIsHost(true)
            setLoading(false)
            onGameReady?.({playerId, host: true})
        }

        const onGameJoined = ({gameId, playerId}) => {
            savePlayerSession(gameId, playerId)
            setMyId(playerId)
            setLoading(false)
            onGameReady?.({playerId, host: false})
        }

        const onGameStateUpdate = (gameState) => {
            const playerList = gameState.players.map(p => ({
                id: p.id,
                name: p.name,
                isHost: p.id === gameState.hostId,
            }))
            setPlayers(playerList)
            setGameCode(prev => prev ?? gameState.id)
            
            // Recalculer isHost (important si le host a quitté et qu'un nouveau a été élu)
            if (myId) {
                setIsHost(gameState.hostId === myId)
            }
        }

        // game-started est géré dans App.jsx - pas besoin de naviguer ici

        on('game-created', onGameCreated)
        on('game-joined', onGameJoined)
        on('game-state-update', onGameStateUpdate)

        return () => {
            off('game-created', onGameCreated)
            off('game-joined', onGameJoined)
            off('game-state-update', onGameStateUpdate)
        }
    }, [step, on, off, onGameReady])

    // ── Actions ────────────────────────────────────────────────
    const confirmUsername = () => {
        const name = username.trim()
        if (!name || name.length < 2) {
            setError('Minimum 2 caractères.');
            return
        }
        setError('')
        setStep('menu')
    }

    const createGame = () => {
        setError('')
        setLoading(true)
        setIsHost(true)
        setStep('waiting')
        emit('create-game', {playerName: username})
    }

    const joinGame = () => {
        const code = joinCode.trim()
        if (code.length < 4) {
            setError('Code invalide.');
            return
        }
        setError('')
        setLoading(true)
        setIsHost(false)
        setStep('waiting')
        emit('join-game', {gameId: code, playerName: username})
    }

    const startGame = () => {
        emit('start-game', {gameId: gameCode})
    }

    const leaveGame = () => {
        emit('leave-game', {gameId: gameCode})
        setStep('menu')
        setGameCode(null)
        setPlayers([])
        setIsHost(false)
        setMyId(null)
    }

    const copyCode = useCallback(() => {
        const fallback = () => {
            const ta = document.createElement('textarea')
            ta.value = gameCode
            ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none'
            document.body.appendChild(ta)
            ta.focus()
            ta.select()
            document.execCommand('copy')
            document.body.removeChild(ta)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        }

        if (navigator.clipboard) {
            navigator.clipboard.writeText(gameCode)
                .then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) })
                .catch(fallback)
        } else {
            fallback()
        }
    }, [gameCode])

    const stepIndex = {username: 0, menu: 1, 'join-form': 1, waiting: 2}

    // ── Render ─────────────────────────────────────────────────
    return (
        <div className="lobby-root">
            <canvas ref={canvasRef} className="lobby-canvas"/>

            <div className="lobby-card">
                <div className={`connection-dot ${connected ? '' : 'offline'}`}>
                    {connected ? 'connecté' : 'hors ligne'}
                </div>

                <div className="lobby-logo">
                    <h1>FlipThe<span className="logo-accent">67</span></h1>
                    <div className="subtitle">Jeu de cartes en ligne</div>
                </div>
                <hr className="lobby-divider"/>

                <div className="step-indicator">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`step-dot ${
                            i === stepIndex[step] ? 'active' :
                                i < stepIndex[step] ? 'done' : ''
                        }`}/>
                    ))}
                </div>

                {/* ── Step 1 : username ── */}
                {step === 'username' && (
                    <div className="step-enter">
                        <label className="lobby-label">Votre pseudo</label>
                        <input
                            className="lobby-input"
                            type="text"
                            placeholder="Ex : Hector"
                            maxLength={20}
                            value={username}
                            onChange={e => {
                                setUsername(e.target.value);
                                setError('')
                            }}
                            onKeyDown={e => e.key === 'Enter' && confirmUsername()}
                            autoFocus
                        />
                        {error && <p style={{color: '#c0392b', fontSize: '0.78rem', marginTop: 6}}>{error}</p>}
                        <div className="mt-16">
                            <button
                                className="btn-primary"
                                onClick={confirmUsername}
                                disabled={username.trim().length < 2}
                            >
                                Continuer →
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 2a : menu ── */}
                {step === 'menu' && (
                    <div className="step-enter">
                        <p className="menu-greeting">Bonjour, <strong>{username}</strong> - que voulez-vous faire ?</p>
                        <div className="menu-options">
                            <div className="menu-option-card" onClick={createGame}>
                                <div className="menu-option-icon">🃏</div>
                                <div className="menu-option-text">
                                    <h3>Créer une partie</h3>
                                    <p>Générez un code et invitez vos amis</p>
                                </div>
                            </div>
                            <div className="menu-option-card" onClick={() => setStep('join-form')}>
                                <div className="menu-option-icon">🔑</div>
                                <div className="menu-option-text">
                                    <h3>Rejoindre une partie</h3>
                                    <p>Entrez le code partagé par le host</p>
                                </div>
                            </div>
                        </div>
                        <button className="btn-ghost text-center" style={{width: '100%'}}
                                onClick={() => setStep('username')}>
                            ← Changer de pseudo
                        </button>
                    </div>
                )}

                {/* ── Step 2b : join form ── */}
                {step === 'join-form' && (
                    <div className="step-enter">
                        <label className="lobby-label">Code de la partie</label>
                        <div className="join-form">
                            <input
                                className="lobby-input"
                                type="text"
                                placeholder="XXXXX"
                                value={joinCode}
                                onChange={e => {
                                    setJoinCode(e.target.value);
                                    setError('')
                                }}
                                onKeyDown={e => e.key === 'Enter' && joinGame()}
                                autoFocus
                            />
                            {error && <p style={{color: '#c0392b', fontSize: '0.78rem', margin: 0}}>{error}</p>}
                            <button className="btn-primary" onClick={joinGame} disabled={loading}>
                                {loading ? 'Connexion…' : 'Rejoindre la partie'}
                            </button>
                            <button className="btn-ghost text-center" onClick={() => {
                                setStep('menu');
                                setError('')
                            }}>
                                ← Retour
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 3 : waiting room ── */}
                {step === 'waiting' && (
                    <div className="step-enter">
                        <div className="waiting-header">
                            <h2>Logobby</h2>
                            <div className="game-code-badge" onClick={copyCode} title="Copier le code">
                                <span className="code-label">CODE</span>
                                <strong>{gameCode ?? '…'}</strong>
                                <span>{copied ? '✓' : '⎘'}</span>
                            </div>
                        </div>
                        <p className="waiting-subtitle">Partagez le code pour inviter vos amis.</p>

                        <div className="players-list">
                            {players.map(p => (
                                <div key={p.id} className="player-row">
                                    <div className="player-avatar">{p.name.charAt(0).toUpperCase()}</div>
                                    <span className="player-name">{p.name}</span>
                                    {p.isHost && <span className="player-badge host">Host</span>}
                                    {p.id === myId && !p.isHost && <span className="player-badge you">Vous</span>}
                                </div>
                            ))}
                        </div>

                        {isHost ? (
                            <button
                                className="btn-primary"
                                onClick={startGame}
                                disabled={players.length < 2}
                            >
                                {players.length < 2
                                    ? 'En attente de joueurs…'
                                    : `Démarrer (${players.length} joueurs)`}
                            </button>
                        ) : (
                            <div className="waiting-dots">
                                <div className="dot-pulse"><span/><span/><span/></div>
                                En attente du host…
                            </div>
                        )}

                        <div className="mt-8">
                            <button className="btn-secondary" onClick={leaveGame}>
                                Quitter la salle
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
