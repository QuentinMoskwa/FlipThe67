import { useState, useEffect, useRef, useCallback } from 'react'
import { useSocket } from '../../hooks/useSocket'
import { useCardCanvas } from '../../hooks/useCardCanvas'
import './Lobby.css'

// ─── Steps ────────────────────────────────────────────────
// 'username' → 'menu' → 'join-form' | 'waiting'

export default function Lobby() {
    const canvasRef = useRef(null)
    useCardCanvas(canvasRef)

    const { connected, emit, on, off } = useSocket()

    // ── State ──────────────────────────────────────────────
    const [step,      setStep]      = useState('username')
    const [username,  setUsername]  = useState('')
    const [joinCode,  setJoinCode]  = useState('')
    const [gameCode,  setGameCode]  = useState(null)   // code de la partie rejointe/créée
    const [players,   setPlayers]   = useState([])     // [{ id, name, isHost }]
    const [isHost,    setIsHost]    = useState(false)
    const [myId,      setMyId]      = useState(null)
    const [copied,    setCopied]    = useState(false)
    const [error,     setError]     = useState('')

    // ── Socket listeners (waiting room) ───────────────────
    useEffect(() => {
        if (step !== 'waiting') return

        const onPlayerJoined = (data) => setPlayers(data.players)
        const onPlayerLeft   = (data) => setPlayers(data.players)
        const onGameStarted  = ()     => { /* TODO: naviguer vers la partie */ }

        on('lobby:playerJoined', onPlayerJoined)
        on('lobby:playerLeft',   onPlayerLeft)
        on('game:started',       onGameStarted)

        return () => {
            off('lobby:playerJoined', onPlayerJoined)
            off('lobby:playerLeft',   onPlayerLeft)
            off('game:started',       onGameStarted)
        }
    }, [step, on, off])

    // ── Actions ────────────────────────────────────────────
    const confirmUsername = () => {
        const name = username.trim()
        if (!name || name.length < 2) {
            setError('Minimum 2 caractères.')
            return
        }
        setError('')
        setStep('menu')
    }

    const createGame = () => {
        // TODO: émettre 'lobby:create' et recevoir { gameCode, playerId, players }
        // emit('lobby:create', { playerName: username })
        // on('lobby:created', ({ gameCode, playerId, players }) => { ... })

        // Mock en attendant l'event serveur
        const mockCode = Math.random().toString(36).slice(2, 6).toUpperCase()
        setGameCode(mockCode)
        setIsHost(true)
        setMyId('me')
        setPlayers([{ id: 'me', name: username, isHost: true }])
        setStep('waiting')
    }

    const joinGame = () => {
        const code = joinCode.trim().toUpperCase()
        if (code.length < 4) {
            setError('Code invalide.')
            return
        }
        setError('')

        // TODO: émettre 'lobby:join' et recevoir { gameCode, playerId, players }
        // emit('lobby:join', { playerName: username, gameCode: code })

        // Mock en attendant l'event serveur
        setGameCode(code)
        setIsHost(false)
        setMyId('me')
        setPlayers([
            { id: 'host', name: 'HostPlayer', isHost: true },
            { id: 'me',   name: username,    isHost: false },
        ])
        setStep('waiting')
    }

    const startGame = () => {
        // TODO: émettre 'game:start'
        // emit('game:start', { gameCode })
        console.log('TODO: game:start →', gameCode)
    }

    const copyCode = useCallback(() => {
        navigator.clipboard.writeText(gameCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
    }, [gameCode])

    const stepIndex = { username: 0, menu: 1, 'join-form': 1, waiting: 2 }

    // ── Render ─────────────────────────────────────────────
    return (
        <div className="lobby-root">
            <canvas ref={canvasRef} className="lobby-canvas" />

            <div className="lobby-card">
                {/* Indicateur de connexion */}
                <div className={`connection-dot ${connected ? '' : 'offline'}`}>
                    {connected ? 'connecté' : 'hors ligne'}
                </div>

                {/* Logo */}
                <div className="lobby-logo">
                    <h1>FlipThe<span className="logo-accent">67</span></h1>
                    <div className="subtitle">Jeu de cartes en ligne</div>
                </div>
                <hr className="lobby-divider" />

                {/* Step dots */}
                <div className="step-indicator">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className={`step-dot ${
                                i === stepIndex[step] ? 'active' :
                                    i <  stepIndex[step] ? 'done'   : ''
                            }`}
                        />
                    ))}
                </div>

                {/* ── Step 1 : username ────────────────────────── */}
                {step === 'username' && (
                    <div className="step-enter">
                        <label className="lobby-label">Votre pseudo</label>
                        <input
                            className="lobby-input"
                            type="text"
                            placeholder="Ex : Blackjack Bobby"
                            maxLength={20}
                            value={username}
                            onChange={e => { setUsername(e.target.value); setError('') }}
                            onKeyDown={e => e.key === 'Enter' && confirmUsername()}
                            autoFocus
                        />
                        {error && <p style={{ color: '#c0392b', fontSize: '0.78rem', marginTop: 6 }}>{error}</p>}
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

                {/* ── Step 2a : menu ───────────────────────────── */}
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
                        <button className="btn-ghost text-center" style={{ width: '100%' }}
                                onClick={() => setStep('username')}>
                            ← Changer de pseudo
                        </button>
                    </div>
                )}

                {/* ── Step 2b : join form ──────────────────────── */}
                {step === 'join-form' && (
                    <div className="step-enter">
                        <label className="lobby-label">Code de la partie</label>
                        <div className="join-form">
                            <input
                                className="lobby-input"
                                type="text"
                                placeholder="XXXX"
                                maxLength={6}
                                value={joinCode}
                                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setError('') }}
                                onKeyDown={e => e.key === 'Enter' && joinGame()}
                                autoFocus
                            />
                            {error && <p style={{ color: '#c0392b', fontSize: '0.78rem', margin: 0 }}>{error}</p>}
                            <button className="btn-primary" onClick={joinGame}>
                                Rejoindre la partie
                            </button>
                            <button className="btn-ghost text-center" onClick={() => { setStep('menu'); setError('') }}>
                                ← Retour
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step 3 : waiting room ────────────────────── */}
                {step === 'waiting' && (
                    <div className="step-enter">
                        <div className="waiting-header">
                            <h2>Salle d'attente</h2>
                            <div className="game-code-badge" onClick={copyCode} title="Copier le code">
                                <span className="code-label">CODE</span>
                                <strong>{gameCode}</strong>
                                <span>{copied ? '✓' : '⎘'}</span>
                            </div>
                        </div>
                        <p className="waiting-subtitle">
                            Partagez le code pour inviter vos amis.
                        </p>

                        {/* Liste joueurs */}
                        <div className="players-list">
                            {players.map(p => (
                                <div key={p.id} className="player-row">
                                    <div className="player-avatar">
                                        {p.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="player-name">{p.name}</span>
                                    {p.isHost && <span className="player-badge host">Host</span>}
                                    {p.id === myId && !p.isHost && <span className="player-badge you">Vous</span>}
                                </div>
                            ))}
                        </div>

                        {/* Attente ou démarrer */}
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
                                <div className="dot-pulse">
                                    <span /><span /><span />
                                </div>
                                En attente du host…
                            </div>
                        )}

                        <div className="mt-8">
                            <button className="btn-secondary" onClick={() => {
                                setStep('menu')
                                setPlayers([])
                                setGameCode(null)
                            }}>
                                Quitter la salle
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
