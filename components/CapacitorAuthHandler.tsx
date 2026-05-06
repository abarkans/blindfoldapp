'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CapacitorAuthHandler() {
  const router = useRouter()

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

        await Browser.close()

        const supabase = createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) return

        // Determine destination from actual profile state — avoids embedding
        // ?next= in the redirectTo URL (which Supabase validates strictly).
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', user.id)
          .maybeSingle()

        // plan param stored in localStorage by RegisterClient before OAuth
        const plan = localStorage.getItem('capacitor_oauth_plan') ?? null
        localStorage.removeItem('capacitor_oauth_plan')

        if (profile?.onboarding_complete) {
          router.replace('/dashboard')
        } else {
          const planSuffix = plan === 'free' || plan === 'subscription' ? `?plan=${plan}` : ''
          router.replace(`/onboarding${planSuffix}`)
        }
      })

      cleanup = () => listener.remove()
    }

    setup()
    return () => { cleanup?.() }
  }, [router])

  return null
}
