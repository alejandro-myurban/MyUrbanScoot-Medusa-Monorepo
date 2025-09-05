"use client"

import React from "react"
import { HttpTypes } from "@medusajs/types"
import ScootersFilters from "@/modules/common/components/scooters-filters"
import { useScootersFilters } from "./hooks/useScootersFilters"

type Props = {
  allProducts: HttpTypes.StoreProduct[]
  initialSearchParams: Record<string, string | string[] | undefined>
}

const ScootersFiltersContainer: React.FC<Props> = ({ allProducts, initialSearchParams }) => {
  const { selectedFilters, handleFilterChange, resetFilters } = useScootersFilters(initialSearchParams)

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
