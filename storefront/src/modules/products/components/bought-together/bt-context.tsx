"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface CombinedCartContextValue {
  extras: string[]
  toggleExtra: (variantId: string) => void
  clearExtras: () => void
  customMetadata: Record<string, string>
  setCustomField: (key: string, value: string) => void
  clearCustomFields: () => void
  boughtTogetherNames: Record<string, string>
  setBoughtTogetherName: (variantId: string, name: string) => void
  boughtTogetherPrice: number
  setBoughtTogetherPrice: (price: number) => void
  clearBoughtTogetherPrice: () => void
}

const CombinedCartContext = createContext<CombinedCartContextValue | undefined>(
  undefined
)

export function CombinedCartProvider({ children }: { children: ReactNode }) {
  const [extras, setExtras] = useState<string[]>([])
  const [customMetadata, setCustomMetadata] = useState<Record<string, string>>(
    {}
  )
  // Nuevo estado para el precio de productos comprados juntos
  const [boughtTogetherPrice, setBoughtTogetherPrice] = useState<number>(0)
  const [boughtTogetherNames, setBoughtTogetherNames] = useState<
    Record<string, string>
  >({})

  const toggleExtra = (variantId: string) => {
    setExtras((prev) =>
      prev.includes(variantId)
        ? prev.filter((v) => v !== variantId)
        : [...prev, variantId]
    )
  }

  const clearExtras = () => setExtras([])

  const setCustomField = (key: string, value: string) => {
    setCustomMetadata((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const setBoughtTogetherName = (variantId: string, name: string) => {
    setBoughtTogetherNames((prev) => ({
      ...prev,
      [variantId]: name,
    }))
  }

  const clearCustomFields = () => setCustomMetadata({})

  // Nueva función para limpiar el precio de BoughtTogether
  const clearBoughtTogetherPrice = () => setBoughtTogetherPrice(0)

  return (
    <CombinedCartContext.Provider
      value={{
        extras,
        toggleExtra,
        clearExtras,
        customMetadata,
        setCustomField,
        clearCustomFields,
        boughtTogetherNames,
        setBoughtTogetherName,
        boughtTogetherPrice,
        setBoughtTogetherPrice,
        clearBoughtTogetherPrice,
      }}
    >
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
