'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CapacitorOAuthHandler() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!(window as any).Capacitor) return

    let cleanup: (() => void) | undefined

    async function setup() {
      const { App } = await import('@capacitor/app')
      const { Browser } = await import('@capacitor/browser')

      const handle = await App.addListener('appUrlOpen', async (event) => {
        const url = event.url
        if (!url.includes('login-callback')) return

        setLoading(true)
        await Browser.close().catch(() => {})

        try {
          const supabase = createClient()
          const parsed = new URL(url.replace(/^[^:]+:\/\/[^/]*/, 'https://dummy.local'))
          const code = parsed.searchParams.get('code')

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) {
              const plan = localStorage.getItem('capacitor_oauth_plan')
              localStorage.removeItem('capacitor_oauth_plan')
              const { data: profileData } = await supabase
                .from('profiles')
                .select('onboarding_complete')
                .single()
              if (profileData?.onboarding_complete) {
                router.replace('/dashboard')
              } else {
                router.replace(plan ? `/onboarding?plan=${plan}` : '/onboarding')
              }
              return
            }
          }
        } catch {}

        setLoading(false)
      })

      cleanup = () => handle.remove()
    }

    setup()
    return () => cleanup?.()
  }, [router])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-rose-500" />
      <p className="text-white/50 text-sm">Signing you in…</p>
    </div>
  )
}
