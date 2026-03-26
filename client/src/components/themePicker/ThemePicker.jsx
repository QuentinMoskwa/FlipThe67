import { useState, useEffect, useRef } from 'react'
import { THEMES } from '../../hooks/useTheme'
import IconButton from '../iconButton/IconButton.jsx'
import './ThemePicker.css'

/**
 * Bouton fixe en haut à gauche qui ouvre un popover de sélection de thème.
 * Composant autonome — il utilise useTheme en interne pour lire/écrire.
 *
 * @param {{ theme: string, setTheme: (id: string) => void }} props
 */
export default function ThemePicker({ theme, setTheme }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    // Fermer en cliquant en dehors
    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div className="theme-picker" ref={ref}>
            <IconButton
                onClick={() => setOpen(o => !o)}
                title="Changer le thème"
                active={open}
                aria-expanded={open}
            >
                <span className="theme-picker-icon">
                    {THEMES.find(t => t.id === theme)?.colors.map((c, i) => (
                        <span key={i} className="theme-picker-dot" style={{ background: c }} />
                    ))}
                </span>
            </IconButton>

            {open && (
                <div className="theme-picker-popover">
                    <p className="theme-picker-title">Thème</p>
                    <div className="theme-picker-grid">
                        {THEMES.map(t => (
                            <button
                                key={t.id}
                                className={`theme-picker-option ${t.id === theme ? 'is-active' : ''}`}
                                onClick={() => { setTheme(t.id); setOpen(false) }}
                            >
                                {/* Aperçu 4 couleurs */}
                                <span className="theme-option-swatch">
                                    {t.colors.map((c, i) => (
                                        <span key={i} style={{ background: c, flex: 1 }} />
                                    ))}
                                </span>
                                <span className="theme-option-label">{t.label}</span>
                                {t.id === theme && (
                                    <span className="theme-option-check">✓</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
