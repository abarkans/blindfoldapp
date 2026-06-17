'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { WifiOff, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'

export default function AppIntroPage() {
  const [ready, setReady] = useState(false)
  const [showOfflineToast, setShowOfflineToast] = useState(false)
  const router = useRouter()

  function navigate(path: string) {
    if (!navigator.onLine) {
      setShowOfflineToast(true)
      setTimeout(() => setShowOfflineToast(false), 4000)
      return
    }
    router.push(path)
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
      {/* Video background */}
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

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-4" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
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
          <Button size="lg" className="w-full" onClick={() => navigate('/register')}>
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
      </div>

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
