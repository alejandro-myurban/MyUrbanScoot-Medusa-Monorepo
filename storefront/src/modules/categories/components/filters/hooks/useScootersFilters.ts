// hooks/useScootersFilters.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { defaultRanges, checkboxKeys } from "../utils/filterHelpers"

export type Range = [number, number]

export type SelectedFilters = {
  dgt: string[]
  motorType: string[]
  hydraulicBrakes: string[]
  tireSizes: string[]
  gripTypes: string[]
  tireTypes: string[]
  autonomyRange: Range
  powerRange: Range
  voltageRange: Range
  weightRange: Range
  speedRange: Range
}

export const useScootersFilters = (
  initialSearchParams: Record<string, string | string[] | undefined>
) => {
  const router = useRouter()
  const pathname = usePathname()
  const currentSearchParams = useSearchParams()

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    ...Object.fromEntries(checkboxKeys.map(key => [key, []])),
    ...defaultRanges,
  } as SelectedFilters)

  // Inicializar con parámetros de la URL
  useEffect(() => {
    const newFilters: SelectedFilters = {
      ...Object.fromEntries(
        checkboxKeys.map(key => {
          const param = initialSearchParams[key]
          const value = Array.isArray(param)
            ? param
            : typeof param === "string"
            ? [param]
            : []
          return [key, value]
        })
      ),
      ...Object.fromEntries(
        Object.entries(defaultRanges).map(([key, defaultRange]) => {
          const param = initialSearchParams[key]
          if (typeof param === "string") {
            const [min, max] = param.split(",").map(Number)
            if (!isNaN(min) && !isNaN(max)) return [key, [min, max]]
          }
          return [key, defaultRange]
        })
      ),
    } as SelectedFilters

    setSelectedFilters(newFilters)
  }, [initialSearchParams])

  // Actualizar URL
  const updateUrlParams = useCallback(
    (filters: SelectedFilters) => {
      const newSearchParams = new URLSearchParams()

      currentSearchParams.forEach((value, key) => {
        if (!(key in filters)) {
          newSearchParams.append(key, value)
        }
      })

      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (key.endsWith("Range")) {
            const defaultRange = defaultRanges[key as keyof typeof defaultRanges]
            if (JSON.stringify(value) !== JSON.stringify(defaultRange)) {
              newSearchParams.set(key, (value as [number, number]).join(","))
            } else {
              newSearchParams.delete(key)
            }
          } else {
            ;(value as string[]).forEach((v) => {
              newSearchParams.append(key, String(v))
            })
          }
        }
      })

      router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
    },
    [pathname, currentSearchParams, router]
  )

  const handleFilterChange = (filters: SelectedFilters) => {
    setSelectedFilters(filters)
    updateUrlParams(filters)
  }

  const resetFilters = useCallback(() => {
    const defaultFilters: SelectedFilters = {
      ...Object.fromEntries(checkboxKeys.map(key => [key, []])),
      ...defaultRanges,
    } as SelectedFilters

    const newSearchParams = new URLSearchParams()
    currentSearchParams.forEach((value, key) => {
      if (!(key in defaultFilters)) {
        newSearchParams.append(key, value)
      }
    })

    setSelectedFilters(defaultFilters)
    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
  }, [pathname, currentSearchParams, router])

  return {
    selectedFilters,
    handleFilterChange,
    resetFilters,
  }
}
