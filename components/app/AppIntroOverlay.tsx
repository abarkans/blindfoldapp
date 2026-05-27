'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SLIDES = [
  {
    icon: '🔮',
    title: 'Stop Planning.',
    subtitle: 'Just Show Up.',
    body: 'Tell us your interests once. We find real nearby venues, craft your date story, and handle every detail.',
    accent: '#f43f5e',
  },
  {
    icon: '✨',
    title: 'Real Places.',
    subtitle: 'Curated for You.',
    body: 'AI picks hidden gem venues based on your vibe, budget, and location. Ratings 4.0+ only.',
    accent: '#8b5cf6',
  },
  {
    icon: '🏆',
    title: 'Level Up',
    subtitle: 'Together.',
    body: "Earn XP, unlock badges, and build your couple's date history. Every date is a new chapter.",
    accent: '#f43f5e',
  },
]

type Mode = 'none' | 'intro' | 'redirect'

export default function AppIntroOverlay() {
  const [mode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'none'
    if (!(window as any).Capacitor) return 'none'
    return localStorage.getItem('intro_seen') !== 'true' ? 'intro' : 'redirect'
  })
  const [current, setCurrent] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (mode === 'redirect') router.replace('/login')
  }, [mode, router])

  if (mode === 'none') return null
  if (mode === 'redirect') return <div className="fixed inset-0 bg-[#0a0a0a] z-[100]" />

  const slide = SLIDES[current]

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (delta > 50) setCurrent(c => Math.min(c + 1, SLIDES.length - 1))
    else if (delta < -50) setCurrent(c => Math.max(c - 1, 0))
    touchStartX.current = null
  }

  function handleGetStarted() {
    localStorage.setItem('intro_seen', 'true')
    router.push('/register')
  }

  function handleSignIn() {
    localStorage.setItem('intro_seen', 'true')
    router.push('/login')
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center select-none"
      style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div key={current} className="flex flex-col items-center text-center gap-4 flex-1 justify-center px-8 pt-12">
        <div
          className="w-24 h-24 rounded-[28px] flex items-center justify-center mb-2"
          style={{ background: `${slide.accent}18` }}
        >
          <span className="text-5xl leading-none">{slide.icon}</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-white leading-tight">{slide.title}</h1>
        <h2 className="text-3xl font-bold tracking-tight leading-tight" style={{ color: slide.accent }}>{slide.subtitle}</h2>
        <p className="text-base text-white/65 leading-relaxed max-w-[300px]">{slide.body}</p>
      </div>

      <div className="flex gap-1.5 items-center mb-6">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-[250ms]"
            style={{
              background: i === current ? slide.accent : '#ffffff22',
              width: i === current ? 24 : 8,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-[340px] px-8 flex flex-col gap-3">
        <button
          className="w-full py-[18px] rounded-full text-white text-[17px] font-semibold"
          style={{ background: slide.accent }}
          onClick={handleGetStarted}
        >
          Get Started
        </button>
        <button
          className="w-full py-4 rounded-full bg-transparent border border-white/[0.13] text-white/80 text-[17px] font-medium"
          onClick={handleSignIn}
        >
          Sign In
        </button>
      </div>
    </div>
  )
}
