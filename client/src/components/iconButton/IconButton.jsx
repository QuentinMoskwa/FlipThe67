import './IconButton.css'

/**
 * Bouton icône générique — position fixe configurable.
 * Utilisé par ThemePicker, RulesButton, etc.
 *
 * @param {ReactNode}  children   - contenu de l'icône
 * @param {Function}   onClick
 * @param {string}     title      - tooltip accessible
 * @param {boolean}    active     - surbrillance si true
 * @param {string}     className  - classes additionnelles
 */
export default function IconButton({ children, onClick, title, active = false, className = '', ...rest }) {
    return (
        <button
            className={`icon-btn ${active ? 'is-active' : ''} ${className}`.trim()}
            onClick={onClick}
            title={title}
            aria-expanded={rest['aria-expanded']}
        >
            {children}
        </button>
    )
}
