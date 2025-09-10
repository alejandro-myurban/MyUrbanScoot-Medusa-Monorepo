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
    <div>
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={resetFilters}
          className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-2 rounded-lg border border-red-200 hover:border-red-300 transition-all duration-200 hover:bg-red-50"
        >
          Limpiar filtros
        </button>
      </div>
      <ScootersFilters
        selectedFilters={selectedFilters}
        setSelectedFilters={handleFilterChange}
        allProducts={allProducts}
      />
    </div>
  )
}

export default ScootersFiltersContainer
