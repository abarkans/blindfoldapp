'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function LegalBackButton() {
  const [inCapacitor, setInCapacitor] = useState(false)
  useEffect(() => {
    if ((window as any).Capacitor) setInCapacitor(true)
  }, [])
  return (
    <button
      onClick={() => window.history.back()}
      className={
        inCapacitor
          ? 'fixed left-4 z-50 flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm'
          : 'flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm'
      }
      style={inCapacitor ? { top: 'max(16px, env(safe-area-inset-top, 16px))' } : undefined}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}
