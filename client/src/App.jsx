import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import Lobby from './components/Lobby/Lobby'
import CardDemo from './components/card/CardDemo'
import GameBoard from "./components/gameBoard/GameBoard.jsx";

const DEMO_CARDS = [
  { id: '1', type: 'number',   value: 7 },
  { id: '2', type: 'number',   value: 12 },
  { id: '3', type: 'action',   value: 'freeze' },
  { id: '4', type: 'action',   value: 'flip3' },
  { id: '5', type: 'action',   value: 'second_chance' },
  { id: '6', type: 'modifier', value: 'x2',  label: '×2' },
  { id: '7', type: 'modifier', value: '+4',  label: '+4' },
]

function App() {
  return <GameBoard />
}


export default App
