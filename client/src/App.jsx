import {useState, useEffect} from 'react'
import {useSocket} from './hooks/useSocket'
import Lobby from './components/lobby/Lobby'
import GameBoard from './components/gameBoard/GameBoard'
import RoundSummary from './components/roundSummary/RoundSummary'
import Victory from './components/victory/Victory'
import './App.css'

/**
 * Machine d'états de l'application.
 *
 * Vues :
 *   'lobby'        → Lobby (pseudo, créer/rejoindre, salle d'attente)
 *   'game'         → GameBoard (plateau de jeu)
 *   'roundSummary' → RoundSummary (récap de manche)
 *   'victory'      → Victory (classement final)
 *
 * Transitions pilotées par les événements Socket.io reçus du serveur.
 */
export default function App() {
    const {emit, on, off} = useSocket()

    const [view, setView] = useState('lobby')
    const [gameState, setGameState] = useState(null)
    const [myId, setMyId] = useState(null)
    const [isHost, setIsHost] = useState(false)
    const [winnerIds, setWinnerIds] = useState([])
    const [roundNumber, setRoundNumber] = useState(1)

    // ── Listeners globaux ──────────────────────────────────────
    useEffect(() => {
        /**
         * game-state-update : reçu après chaque action.
         * On pilote la vue selon la phase du round.
         */
        const onGameStateUpdate = (gs) => {
            setGameState(gs)

            const phase = gs.round?.phase

            if (gs.status === 'finished') return // géré par game-finished

            if (phase === 'dealing' || phase === 'playing') {
                setView('game')
            } else if (phase === 'scoring' || phase === 'ended') {
                setView('roundSummary')
            }
        }

        /**
         * game-started : le host a lancé la partie.
         * On bascule directement sur le GameBoard.
         */
        const onGameStarted = (gs) => {
            setGameState(gs)
            setRoundNumber(1)
            setView('game')
        }

        /**
         * game-finished : un joueur a atteint 200 pts.
         */
        const onGameFinished = ({winners, gameState: gs}) => {
            if (gs) setGameState(gs)
            setWinnerIds(winners)
            setView('victory')
        }

        on('game-state-update', onGameStateUpdate)
        on('game-started', onGameStarted)
        on('game-finished', onGameFinished)

        return () => {
            off('game-state-update', onGameStateUpdate)
            off('game-started', onGameStarted)
            off('game-finished', onGameFinished)
        }
    }, [on, off])

    // ── Callbacks remontés depuis Lobby ────────────────────────

    /**
     * Appelé quand le joueur rejoint ou crée une partie.
     * Stocke myId et isHost pour les vues suivantes.
     */
    const handleGameReady = ({playerId, host}) => {
        setMyId(playerId)
        setIsHost(host)
    }

    // ── Actions depuis RoundSummary ────────────────────────────

    const handleContinue = () => {
        // Le host déclenche la manche suivante
        emit('next-round', {gameId: gameState?.id})
        setRoundNumber(n => n + 1)
    }

    // ── Actions depuis Victory ─────────────────────────────────

    const handlePlayAgain = () => {
        emit('restart-game', {gameId: gameState?.id})
        setRoundNumber(1)
        setWinnerIds([])
    }

    const handleLobby = () => {
        setView('lobby')
        setGameState(null)
        setMyId(null)
        setIsHost(false)
        setWinnerIds([])
        setRoundNumber(1)
    }

    // ── Rendu ──────────────────────────────────────────────────
    return (
        <>
            {view === 'lobby' && (
                <Lobby onGameReady={handleGameReady}/>
            )}

            {view === 'game' && gameState && (
                <GameBoard
                    gameState={gameState}
                    myId={myId}
                />
            )}

            {view === 'roundSummary' && gameState && (
                <RoundSummary
                    gameState={gameState}
                    isHost={isHost}
                    myId={myId}
                    roundNumber={roundNumber}
                    onContinue={handleContinue}
                />
            )}

            {view === 'victory' && gameState && (
                <Victory
                    gameState={gameState}
                    winnerIds={winnerIds}
                    myId={myId}
                    isHost={isHost}
                    onPlayAgain={handlePlayAgain}
                    onLobby={handleLobby}
                />
            )}
        </>
    )
}
