"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import ScootersFilters from "../../common/components/scooters-filters"

type Range = [number, number]

type SelectedFilters = {
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

type Props = {
  allProducts: HttpTypes.StoreProduct[]
  initialSearchParams: Record<string, string | string[] | undefined>
}

// Definir rangos iniciales
const defaultRanges: Record<keyof Pick<SelectedFilters,
  "autonomyRange" | "powerRange" | "voltageRange" | "weightRange" | "speedRange">, Range> = {
  autonomyRange: [0, 200],
  powerRange: [0, 5000],
  voltageRange: [0, 100],
  weightRange: [0, 100],
  speedRange: [0, 120],
}

const checkboxKeys: Array<keyof Omit<SelectedFilters,
  "autonomyRange" | "powerRange" | "voltageRange" | "weightRange" | "speedRange">> = [
  "dgt",
  "motorType",
  "hydraulicBrakes",
  "tireSizes",
  "gripTypes",
  "tireTypes",
]

const ScootersFiltersContainer: React.FC<Props> = ({
  allProducts,
  initialSearchParams,
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const currentSearchParams = useSearchParams()

  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    ...Object.fromEntries(checkboxKeys.map(key => [key, []])),
    ...defaultRanges,
  } as SelectedFilters)

  useEffect(() => {
    const newFilters: SelectedFilters = {
      ...Object.fromEntries(checkboxKeys.map(key => {
        const param = initialSearchParams[key]
        const value = Array.isArray(param)
          ? param
          : typeof param === "string"
          ? [param]
          : []
        return [key, value]
      })),
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

  const updateUrlParams = useCallback((filters: SelectedFilters) => {
    const newSearchParams = new URLSearchParams()

    currentSearchParams.forEach((value, key) => {
      if (!(key in filters)) {
        newSearchParams.append(key, value)
      }
    })

    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (key.endsWith("Range")) {
          // Rangos: "min,max"
          const defaultRange = defaultRanges[key as keyof typeof defaultRanges]
          if (JSON.stringify(value) !== JSON.stringify(defaultRange)) {
            newSearchParams.set(key, (value as [number, number]).join(","))
          } else {
            newSearchParams.delete(key)
          }
        } else {
          // Checkboxes: agregar cada string como parámetro
          (value as string[]).forEach((v) => {
            newSearchParams.append(key, String(v))
          })
        }
      }
    })

    router.replace(`${pathname}?${newSearchParams.toString()}`, { scroll: false })
  }, [pathname, currentSearchParams, router])

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

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <button
          onClick={resetFilters}
          className="text-sm text-ui-fg-interactive hover:underline"
        >
          Limpiar filtros
        </button>
      </div>
      <ScootersFilters
        selectedFilters={selectedFilters}
        setSelectedFilters={handleFilterChange}
        allProducts={allProducts}
      />
    </>
  )
}

export default ScootersFiltersContainer
