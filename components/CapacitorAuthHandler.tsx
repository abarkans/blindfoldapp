'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CapacitorAuthHandler() {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!(window as any).Capacitor) return

    let cleanup: (() => void) | null = null

    async function setup() {
      const { App } = await import('@capacitor/app')
      const { Browser } = await import('@capacitor/browser')

      const listener = await App.addListener('appUrlOpen', async (event: { url: string }) => {
        const url = new URL(event.url)
        const code = url.searchParams.get('code')
        if (!code) return

        setLoading(true)
        await Browser.close().catch(() => {})

        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) { setLoading(false); return }

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        const plan = localStorage.getItem('capacitor_oauth_plan') ?? null
        localStorage.removeItem('capacitor_oauth_plan')

        if (profile?.onboarding_complete) {
          window.location.replace('/dashboard')
        } else {
          const planSuffix = plan === 'free' || plan === 'subscription' ? `?plan=${plan}` : ''
          window.location.replace(`/onboarding${planSuffix}`)
        }
      })

      cleanup = () => listener.remove()
    }

    setup()
    return () => { cleanup?.() }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-rose-500" />
      <p className="text-white/50 text-sm">Signing you in…</p>
    </div>
  )
}
