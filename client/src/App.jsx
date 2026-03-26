import {useState, useEffect} from 'react'
import {useSocket} from './hooks/useSocket'
import Lobby from './components/lobby/Lobby'
import GameBoard from './components/gameBoard/GameBoard'
import RoundSummary from './components/roundSummary/RoundSummary'
import Victory from './components/victory/Victory'

export default function App() {
    const {emit, on, off} = useSocket()

    const [view, setView] = useState('lobby')
    const [gameState, setGameState] = useState(null)
    const [myId, setMyId] = useState(null)
    const [isHost, setIsHost] = useState(false)
    const [winnerIds, setWinnerIds] = useState([])
    const [roundNumber, setRoundNumber] = useState(1)

    useEffect(() => {
        const onGameStateUpdate = (gameState) => {
            setGameState(gameState)
            if (gameState.status === 'finished') return

            // Recalculer isHost à chaque update (important après reconnexion)
            if (myId) {
                setIsHost(gameState.hostId === myId)
            }

            const roundPhase = gameState.round?.phase
            if (roundPhase === 'playing') {
                setView('game')
            } else if (roundPhase === 'scoring' || roundPhase === 'ended') {
                setView('roundSummary')
            }
        }

        const onGameStarted = (gameState) => {
            setGameState(gameState)
            setRoundNumber(1)
            setView('game')
        }

        const onGameFinished = ({winners}) => {
            setWinnerIds(Array.isArray(winners) ? winners : [winners])
            setView('victory')
        }

        const onReconnectSuccess = ({gameId, playerId}) => {
            console.log('[App] Player reconnected:', {gameId, playerId})
            setMyId(playerId)
        }

        const onLeftGame = () => {
            console.log('[App] Successfully left game')
            handleLobby()
        }

        on('game-state-update', onGameStateUpdate)
        on('game-started', onGameStarted)
        on('game-finished', onGameFinished)
        on('reconnect-success', onReconnectSuccess)
        on('left-game', onLeftGame)

        return () => {
            off('game-state-update', onGameStateUpdate)
            off('game-started', onGameStarted)
            off('game-finished', onGameFinished)
            off('reconnect-success', onReconnectSuccess)
            off('left-game', onLeftGame)
        }
    }, [on, off, myId])

    const handleGameReady = ({playerId, host}) => {
        setMyId(playerId)
        setIsHost(host)
    }

    const handleContinue = () => {
        // Le host déclenche la manche suivante
        emit('next-round', {gameId: gameState?.id})
        setRoundNumber(n => n + 1)
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
                    onPlayAgain={() => emit('restart-game', { gameId: gameState.id })}
                    onLobby={handleLobby}
                />
            )}
        </>
    )
}
