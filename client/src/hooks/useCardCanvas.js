import { useEffect } from 'react'

export function useCardCanvas(canvasRef) {
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')

        const resize = () => {
            canvas.width  = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const NUMS = ['6','7']
        const COUNT = 22

        const particles = Array.from({ length: COUNT }, () => ({
            x:        Math.random() * window.innerWidth,
            y:        Math.random() * window.innerHeight,
            size:     60 + Math.random() * 20,
            speed:    0.12 + Math.random() * 0.25,
            drift:    (Math.random() - 0.5) * 0.12,
            rot:      Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.004,
            opacity:  0.08 + Math.random() * 0.06,
            label:    NUMS[Math.floor(Math.random() * NUMS.length)],
        }))

        let raf
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach(p => {
                ctx.save()
                ctx.translate(p.x, p.y)
                ctx.rotate(p.rot)
                ctx.globalAlpha = p.opacity
                ctx.font = `600 ${p.size}px 'DM Mono', monospace`
                ctx.fillStyle = '#7ea8d4'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'middle'
                ctx.fillText(p.label, 0, 0)
                ctx.restore()

                p.y   -= p.speed
                p.x   += p.drift
                p.rot += p.rotSpeed

                if (p.y < -40) {
                    p.y = canvas.height + 40
                    p.x = Math.random() * canvas.width
                }
                if (p.x < -40 || p.x > canvas.width + 40) {
                    p.x = Math.random() * canvas.width
                }
            })

            raf = requestAnimationFrame(draw)
        }

        draw()
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener('resize', resize)
        }
    }, [canvasRef])
}