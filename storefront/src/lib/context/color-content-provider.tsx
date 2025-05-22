"use client"

import React, { createContext, useContext, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

type ColorContextType = {
  selectedColor: string
  setSelectedColor: (color: string) => void
  optionTitle: string
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export const useColorContext = () => {
  const context = useContext(ColorContext)
  if (!context) {
    throw new Error(
      "useColorContext must be used within a ColorContextProvider"
    )
  }
  return context
}

export const ColorContextProvider = ({
  children,
  initialColor = "",
  optionTitle = "",
}: {
  children: React.ReactNode
  initialColor?: string
  optionTitle?: string
}) => {
  const [selectedColor, setSelectedColor] = useState(initialColor)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Update URL when color changes
  const updateColor = (color: string) => {
    setSelectedColor(color)

    try {
      const params = new URLSearchParams(searchParams?.toString() || "")
      if (color) {
        params.set("option", color)
      } else {
        params.delete("option")
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    } catch (error) {
      console.error("Error updating URL:", error)
    }
  }

  return (
    <ColorContext.Provider
      value={{
        selectedColor,
        setSelectedColor: updateColor,
        optionTitle,
      }}
    >
      {children}
    </ColorContext.Provider>
  )
}
