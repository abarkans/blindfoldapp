'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const ALLOWED_NEXT = new Set(['/dashboard', '/onboarding'])

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

        const next = url.searchParams.get('next') ?? '/dashboard'
        const safePath = ALLOWED_NEXT.has(next) ? next : '/dashboard'
        const plan = url.searchParams.get('plan')
        const planSuffix =
          safePath === '/onboarding' && (plan === 'free' || plan === 'subscription')
            ? `?plan=${plan}`
            : ''

        router.replace(`${safePath}${planSuffix}`)
      })

      cleanup = () => listener.remove()
    }

    setup()
    return () => { cleanup?.() }
  }, [router])

  return null
}
