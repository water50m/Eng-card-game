"use client"

import { useEffect, useRef } from "react"

interface Particle {
  x: number; y: number; vx: number; vy: number
  color: string; size: number; angle: number; spin: number; alpha: number
}

const COLORS = [
  "#7C6DFA", "#34D399", "#FBBF24", "#F87171", "#60A5FA",
  "#F472B6", "#A78BFA", "#4ADE80", "#FB923C", "#38BDF8"
]

export function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const rafRef    = useRef<number | null>(null)

  useEffect(() => {
    if (!active) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      particles.current = []
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width  = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext("2d")!

    // Spawn particles from center-top
    const cx = canvas.width / 2
    for (let i = 0; i < 120; i++) {
      particles.current.push({
        x:     cx + (Math.random() - 0.5) * 200,
        y:     canvas.height * 0.3,
        vx:    (Math.random() - 0.5) * 10,
        vy:    -Math.random() * 12 - 4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size:  Math.random() * 8 + 4,
        angle: Math.random() * Math.PI * 2,
        spin:  (Math.random() - 0.5) * 0.3,
        alpha: 1,
      })
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.current = particles.current.filter(p => p.alpha > 0.01)

      for (const p of particles.current) {
        p.x    += p.vx
        p.y    += p.vy
        p.vy   += 0.35        // gravity
        p.vx   *= 0.99        // air drag
        p.angle += p.spin
        p.alpha -= 0.012

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }

      if (particles.current.length > 0) {
        rafRef.current = requestAnimationFrame(draw)
      }
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      id="confetti-canvas"
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        zIndex:        9999,
        display:       active ? "block" : "none",
      }}
    />
  )
}
