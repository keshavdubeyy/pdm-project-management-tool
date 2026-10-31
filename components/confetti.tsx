"use client"

import * as React from "react"

const COLORS = ["#7F56D9", "#9E77ED", "#F79009", "#12B76A", "#2E90FA", "#F04438"]

type Piece = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  angle: number
  spin: number
  color: string
}

/** A short burst of confetti over the whole screen, then nothing. Drawn on a
 * canvas that ignores clicks, and skipped for anyone who has asked their
 * device for less motion. */
export function Confetti({ duration = 4500 }: { duration?: number }) {
  const ref = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const w = () => window.innerWidth
    const h = () => window.innerHeight
    const pieces: Piece[] = Array.from({ length: 160 }, (_, i) => {
      // Two cannons, one from each lower corner, firing up and inwards.
      const left = i % 2 === 0
      const aim = (left ? -60 : -120) + (Math.random() - 0.5) * 40
      const speed = 11 + Math.random() * 9
      return {
        x: left ? 0 : w(),
        y: h() * 0.9,
        vx: Math.cos((aim * Math.PI) / 180) * speed,
        vy: Math.sin((aim * Math.PI) / 180) * speed,
        size: 6 + Math.random() * 6,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
    })

    const start = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const elapsed = now - start
      ctx.clearRect(0, 0, w(), h())
      const fade = Math.max(0, Math.min(1, (duration - elapsed) / 1000))
      for (const p of pieces) {
        p.vy += 0.28 // gravity
        p.vx *= 0.992 // air drag
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (elapsed < duration) frame = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, w(), h())
    }
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", resize)
    }
  }, [duration])

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 h-svh w-full"
    />
  )
}
