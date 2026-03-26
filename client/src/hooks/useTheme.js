import { useState, useEffect } from 'react'

export const THEMES = [
    {
        id:     'ocean',
        label:  'Ocean',
        colors: ['#080e1a', '#7ea8d4', '#1a2640', '#e8f0f8'],
    },
    {
        id:     'aqua',
        label:  'Aqua',
        colors: ['#0D3446', '#176D81', '#71ADB5', '#D8DFE2'],
    },
    {
        id:     'shrek',
        label:  'Shrek',
        colors: ['#2a3028', '#778873', '#A1BC98', '#F1F3E0'],
    },
    {
        id:     'retro',
        label:  'Retro',
        colors: ['#5E0006', '#9B0F06', '#D53E0F', '#EED9B9'],
    },
]

const STORAGE_KEY = 'flip67-theme'
const DEFAULT_THEME = 'ocean'

function applyTheme(themeId) {
    document.documentElement.setAttribute('data-theme', themeId)
}

/**
 * Lit le thème depuis localStorage, l'applique sur <html>,
 * et expose un setter qui persiste + réapplique.
 *
 * @returns {{ theme: string, setTheme: (id: string) => void }}
 */
export function useTheme() {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        return THEMES.find(t => t.id === saved) ? saved : DEFAULT_THEME
    })

    // Appliquer au montage
    useEffect(() => {
        applyTheme(theme)
    }, [theme])

    const setTheme = (themeId) => {
        if (!THEMES.find(t => t.id === themeId)) return
        localStorage.setItem(STORAGE_KEY, themeId)
        setThemeState(themeId)
        applyTheme(themeId)
    }

    return { theme, setTheme }
}
