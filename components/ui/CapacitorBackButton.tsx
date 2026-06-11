'use client'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'

export default function CapacitorBackButton() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    if ((window as any).Capacitor) setShow(true)
  }, [])
  if (!show) return null
  return (
    <button
      onClick={() => window.history.back()}
      className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm mb-6"
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </button>
  )
}
