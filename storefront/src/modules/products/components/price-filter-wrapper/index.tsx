"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { StoreProduct } from "@medusajs/types"
import { PriceRangeFilter } from "@modules/spare-parts/components/price-filter"

export default function PriceFilterWrapper({
  products,
}: {
  products: StoreProduct[] // Lista de todos los productos de la categoría
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Extraer minPrice y maxPrice de la URL (si existen)
  const paramMin = searchParams.get("minPrice")
  const paramMax = searchParams.get("maxPrice")

  // Convertir a números si existen en la URL
  const urlMinPrice = paramMin ? Number.parseInt(paramMin, 10) : undefined
  const urlMaxPrice = paramMax ? Number.parseInt(paramMax, 10) : undefined

  // Callback para actualizar el rango de precios y la URL
  const handlePriceChange = (newRange: number[]) => {
    const current = new URL(window.location.href)
    
    // Actualizar parámetros de URL
    current.searchParams.set("minPrice", String(newRange[0]))
    current.searchParams.set("maxPrice", String(newRange[1]))
    
    // Navegar a la nueva URL
    router.push(current.toString())
  }

  return (
    <PriceRangeFilter
      products={products}
      initialMin={urlMinPrice}  // Solo pasamos los valores de la URL
      initialMax={urlMaxPrice}  // Solo pasamos los valores de la URL
      onPriceChange={handlePriceChange}
    />
  )
}