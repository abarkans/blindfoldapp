'use client'
import { ArrowLeft } from 'lucide-react'

export default function LegalBackButton() {
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
