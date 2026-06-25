'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { WifiOff, X, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

const SLIDES = [
  {
    title: 'Picked for you',
    body: 'Tell the app what you’re into once. It handles the rest.',
    image: '/app-intro/slide-realplaces.png',
  },
  {
    title: 'Real places near you',
    body: 'Picked to fit where you are and what you’ll spend — not just restaurants and bars.',
    image: '/app-intro/slide-interests.png',
  },
  {
    title: 'Dates that leave a mark',
    body: 'A playful task to do together — then save the photos and look back later.',
    image: '/app-intro/slide-memories.png',
  },
]

export default function AppIntroPage() {
  const [ready, setReady] = useState(false)
  const [showOfflineToast, setShowOfflineToast] = useState(false)
  const [inCapacitor, setInCapacitor] = useState(false)
  const [showSlides, setShowSlides] = useState(false)
  const [slideIdx, setSlideIdx] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const [slideDirection, setSlideDirection] = useState(1)
  const router = useRouter()

  useEffect(() => {
    const forceCapacitor = new URLSearchParams(window.location.search).get('capacitor') === '1'
    if ((window as any).Capacitor || forceCapacitor) setInCapacitor(true)
  }, [])

  // Warm the browser cache for all slide images while the hero screen is showing,
  // so they're already loaded by the time the user taps through to them.
  useEffect(() => {
    SLIDES.forEach((slide) => {
      const img = new window.Image()
      img.src = slide.image
    })
  }, [])

  function navigate(path: string) {
    if (!navigator.onLine) {
      setShowOfflineToast(true)
      setTimeout(() => setShowOfflineToast(false), 4000)
      return
    }
    router.push(path)
  }

  function handleGetStarted() {
    if (inCapacitor) {
      setShowSlides(true)
      return
    }
    navigate('/register')
  }

  function handleSlideNext() {
    setSlideDirection(1)
    if (slideIdx < SLIDES.length - 1) setSlideIdx((i) => i + 1)
    else navigate('/register')
  }

  function handleSlideBack() {
    setSlideDirection(-1)
    setSlideIdx((i) => Math.max(0, i - 1))
  }

  function handleBack() {
    setSlideDirection(-1)
    if (slideIdx > 0) setSlideIdx((i) => i - 1)
    else setShowSlides(false)
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const timeout = new Promise<null>(res => setTimeout(() => res(null), 2000))
        const supabase = createClient()
        const sessionPromise = supabase.auth.getSession().then(r => r.data.session)
        const session = await Promise.race([sessionPromise, timeout])
        if (session) {
          if ((window as any).Capacitor) {
            const { SplashScreen } = await import('@capacitor/splash-screen')
            await SplashScreen.hide({ fadeOutDuration: 500 })
          }
          router.replace('/dashboard')
          return
        }
      } catch {}
      setReady(true)
      if ((window as any).Capacitor) {
        const { SplashScreen } = await import('@capacitor/splash-screen')
        await SplashScreen.hide({ fadeOutDuration: 500 })
      }
    }
    checkSession()
  }, [router])

  if (!ready) {
    return <div className="fixed inset-0 bg-[#0a0a0a]" />
  }

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden">
      {/* Video background — hero only, intro slides use a plain dark background */}
      {!showSlides && (
        <>
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/hero-video-poster.webp"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/hero-video.webm" type="video/webm" />
            <source src="/hero-video-small.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/80" />
        </>
      )}

      <AnimatePresence mode="wait">
        {!showSlides ? (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex flex-col h-full px-4"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Logo + tagline centered */}
            <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center">
              <Image src="/icon.png" alt="BlindfoldDate" width={80} height={80} className="object-contain" />
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-0">
                  <h1 className="text-[40px] font-bold tracking-tight text-white leading-none">Date night, decided.</h1>
                  <h2 className="text-[40px] font-bold tracking-tight leading-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #fb7185 0%, #c026d3 45%, #8b5cf6 100%)' }}>Just show up.</h2>
                </div>
                <p className="text-base text-white/70 leading-relaxed">
                  A mystery date, planned for you both.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div
              className="flex flex-col gap-3 w-full"
              style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}
            >
              <Button size="lg" className="w-full" onClick={handleGetStarted}>
                Get Started
              </Button>
              <Button variant="secondary" size="lg" className="w-full border-2 border-rose-500/60" onClick={() => navigate('/login')}>
                Sign In
              </Button>
              <p className="text-[11px] text-white/30 text-center leading-relaxed pt-1">
                By continuing, you agree to our{' '}
                <a href="/legal/terms" className="text-white/50 underline">Terms</a>
                {' '}and{' '}
                <a href="/legal/privacy" className="text-white/50 underline">Privacy Policy</a>.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="slides"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 flex flex-col h-full px-4"
            style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            {/* Back + Skip */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleBack}
                aria-label="Back"
                className="text-white/55 hover:text-white transition-colors p-1.5 -ml-1.5"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="text-sm font-medium text-white/55 hover:text-white transition-colors px-2 py-1.5"
              >
                Skip
              </button>
            </div>

            {/* Slide — drag spans the full area so swipe works anywhere, not just on the text */}
            <motion.div
              className="flex-1 relative flex items-center justify-center overflow-hidden touch-pan-y select-none"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => {
                const swipe = Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 400
                if (!swipe) return
                if (info.offset.x < 0) handleSlideNext()
                else handleSlideBack()
              }}
              style={{ alignItems: 'center' }}
            >
              <AnimatePresence mode="wait" custom={slideDirection}>
                <motion.div
                  key={slideIdx}
                  custom={slideDirection}
                  variants={{
                    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
                    center: { opacity: 1, x: 0 },
                    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="relative flex flex-col items-center gap-6 text-center px-2"
                >
                  <div className="relative w-full max-w-[360px] aspect-[4320/2956]">
                    {!imgErrors[slideIdx] ? (
                      <>
                        <Image
                          src={SLIDES[slideIdx].image}
                          alt={SLIDES[slideIdx].title}
                          fill
                          sizes="300px"
                          priority
                          className="object-contain"
                          onError={() => setImgErrors((e) => ({ ...e, [slideIdx]: true }))}
                        />
                        {/* Fade the image's bottom edge into the slide background */}
                        <div
                          className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none"
                          style={{ background: 'linear-gradient(to bottom, transparent 0%, #0a0a0a 100%)' }}
                        />
                      </>
                    ) : (
                      <div className="absolute inset-0 rounded-2xl border border-dashed border-white/15 flex items-center justify-center">
                        <p className="text-[11px] text-white/30 px-6 text-center">Missing: {SLIDES[slideIdx].image}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 max-w-xs">
                    <h2 className="text-2xl font-bold text-white leading-tight">{SLIDES[slideIdx].title}</h2>
                    <p className="text-sm text-white/65 leading-relaxed">{SLIDES[slideIdx].body}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Dots + CTA */}
            <div
              className="flex flex-col items-center gap-5 w-full"
              style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 32px))' }}
            >
              <div className="flex items-center gap-1.5">
                {SLIDES.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === slideIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
                  />
                ))}
              </div>
              <Button size="lg" className="w-full" onClick={handleSlideNext}>
                Next
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showOfflineToast && (
        <div className="absolute inset-x-4 z-20 flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-black/90 px-4 py-3 backdrop-blur-xl" style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}>
          <WifiOff className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="flex-1 text-sm text-white/80">No internet connection. Check your Wi-Fi or mobile data and try again.</p>
          <button onClick={() => setShowOfflineToast(false)} aria-label="Dismiss" className="text-white/40 hover:text-white shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
