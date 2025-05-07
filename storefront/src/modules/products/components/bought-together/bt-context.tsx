// app/context/CombinedCartContext.tsx
"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface CombinedCartContextValue {
  extras: string[]
  toggleExtra: (variantId: string) => void
  clearExtras: () => void
}

const CombinedCartContext = createContext<CombinedCartContextValue | undefined>(
  undefined
)

export function CombinedCartProvider({ children }: { children: ReactNode }) {
  const [extras, setExtras] = useState<string[]>([])

  const toggleExtra = (variantId: string) => {
    setExtras((prev) =>
      prev.includes(variantId)
        ? prev.filter((v) => v !== variantId)
        : [...prev, variantId]
    )
  }

  const clearExtras = () => setExtras([])

  return (
    <CombinedCartContext.Provider value={{ extras, toggleExtra, clearExtras }}>
      {children}
    </CombinedCartContext.Provider>
  )
}

export function useCombinedCart() {
  const ctx = useContext(CombinedCartContext)
  if (!ctx)
    throw new Error(
      "useCombinedCart debe usarse dentro de CombinedCartProvider"
    )
  return ctx
}
