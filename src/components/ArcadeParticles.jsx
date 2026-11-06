import { useEffect, useRef } from 'react'

export default function ArcadeParticles() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const handleResize = () => {
      if (!canvas) return
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    // Particles: Fireflies (glowing gold/amber) + Falling Cherry Petals (soft pink/ivory)
    const fireflies = Array.from({ length: 28 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      radius: 1.2 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      alpha: 0.2 + Math.random() * 0.65,
      glowSpeed: 0.015 + Math.random() * 0.025,
      color: Math.random() > 0.4 ? '250, 204, 21' : '110, 231, 183', // warm gold or emerald spark
    }))

    const petals = Array.from({ length: 22 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 4 + Math.random() * 6,
      vx: 0.3 + Math.random() * 0.6,
      vy: 0.5 + Math.random() * 0.9,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.03,
      alpha: 0.25 + Math.random() * 0.5,
    }))

    const render = () => {
      ctx.clearRect(0, 0, w, h)

      // 1. Render Fireflies
      fireflies.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.alpha += Math.sin(Date.now() * p.glowSpeed) * 0.012

        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const a = Math.max(0.1, Math.min(0.85, p.alpha))
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 4)
        grad.addColorStop(0, `rgba(${p.color}, ${a})`)
        grad.addColorStop(0.4, `rgba(${p.color}, ${a * 0.4})`)
        grad.addColorStop(1, `rgba(${p.color}, 0)`)

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 4, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, a + 0.3)})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius * 0.7, 0, Math.PI * 2)
        ctx.fill()
      })

      // 2. Render Petals
      petals.forEach((petal) => {
        petal.x += petal.vx
        petal.y += petal.vy
        petal.angle += petal.spin

        if (petal.y > h + 20) {
          petal.y = -20
          petal.x = Math.random() * w
        }
        if (petal.x > w + 20) {
          petal.x = -20
        }

        ctx.save()
        ctx.translate(petal.x, petal.y)
        ctx.rotate(petal.angle)

        ctx.fillStyle = `rgba(254, 205, 211, ${petal.alpha})` // rose/cherry petal
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(petal.size, petal.size * 0.6, 0, petal.size * 1.8)
        ctx.quadraticCurveTo(-petal.size, petal.size * 0.6, 0, 0)
        ctx.fill()

        ctx.restore()
      })

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="arcade-ambient-particles"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}

