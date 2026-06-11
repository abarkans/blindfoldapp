'use client'
import { useState, useEffect, type ReactNode } from 'react'

export default function HideInCapacitor({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if ((window as any).Capacitor) setVisible(false)
  }, [])
  if (!visible) return null
  return <>{children}</>
}
