'use client'
import { useEffect } from 'react'

export default function CapacitorRedirect() {
  useEffect(() => {
    if ((window as any).Capacitor) {
      window.location.replace('https://localhost')
    }
  }, [])
  return null
}
