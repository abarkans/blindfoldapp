'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function LegalBackButton() {
  const [inCapacitor, setInCapacitor] = useState(false)
  useEffect(() => {
    if ((window as any).Capacitor) setInCapacitor(true)
  }, [])
  if (inCapacitor) {
    return (
      <>
        <button
          onClick={() => window.history.back()}
          className="fixed left-4 z-50 flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
          style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="h-12" />
      </>
    )
  }
  return (
    <button
      onClick={() => window.history.back()}
      className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}
