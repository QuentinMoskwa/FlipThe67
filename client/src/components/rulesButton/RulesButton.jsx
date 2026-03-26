import { useState } from 'react'
import IconButton from '../iconButton/IconButton.jsx'
import RulesModal from '../rulesModal/RulesModal.jsx'
import './RulesButton.css'

export default function RulesButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <IconButton
                onClick={() => setOpen(true)}
                title="Règles du jeu"
                className="rules-btn"
            >
                ?
            </IconButton>

            {open && <RulesModal onClose={() => setOpen(false)} />}
        </>
    )
}