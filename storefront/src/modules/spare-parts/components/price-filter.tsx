"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import NumberFlow from '@number-flow/react'
import { StoreProduct } from "@medusajs/types"


export const PriceRangeFilter = ({
  products,
  onPriceChange,
}: {
  products: StoreProduct[]
  onPriceChange: (range: number[]) => void
}) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (products.length) {
      const prices = products
        .map((p) => p.variants?.[0]?.calculated_price?.calculated_amount ?? null)
        .filter((p): p is number => p !== null)

      if (prices.length) {
        const calculatedMin = Math.floor(Math.min(...prices))
        const calculatedMax = Math.ceil(Math.max(...prices))
        
        // Actualizar los límites dinámicos
        setMinPrice(calculatedMin)
        setMaxPrice(calculatedMax)
        
        // SIEMPRE reiniciar el rango cuando cambien los productos
        setPriceRange([calculatedMin, calculatedMax])
      }
    } else {
      // Si no hay productos, resetear todo
      setMinPrice(0)
      setMaxPrice(100)
      setPriceRange([0, 100])
    }
  }, [products])

  // Efecto separado para notificar cambios cuando se resetea el rango
  useEffect(() => {
    onPriceChange(priceRange)
  }, [minPrice, maxPrice]) // Solo cuando cambien los límites, no el rango actual

  const getPercentage = (value: number) => {
    if (maxPrice === minPrice) return 0
    return ((value - minPrice) / (maxPrice - minPrice)) * 100
  }

  const getValueFromPercentage = (percentage: number) => {
    return Math.round(minPrice + (percentage / 100) * (maxPrice - minPrice))
  }

  const handleMouseDown = (thumbIndex: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(thumbIndex)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging === null || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const newValue = getValueFromPercentage(percentage)

    setPriceRange((prev) => {
      const newRange = [...prev] as [number, number]
      if (isDragging === 0) {
        newRange[0] = Math.min(newValue, prev[1])
      } else {
        newRange[1] = Math.max(newValue, prev[0])
      }
      return newRange
    })
  }

  const handleMouseUp = () => {
    if (isDragging !== null) {
      setIsDragging(null)
      onPriceChange(priceRange)
    }
  }

  useEffect(() => {
    if (isDragging !== null) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, priceRange])

  const handleInputChange = (value: string, index: 0 | 1) => {
    const numValue = Number.parseInt(value, 10)
    if (isNaN(numValue)) return

    setPriceRange((prev) => {
      const newRange = [...prev] as [number, number]
      if (index === 0) {
        newRange[0] = Math.min(Math.max(numValue, minPrice), prev[1])
      } else {
        newRange[1] = Math.max(Math.min(numValue, maxPrice), prev[0])
      }
      return newRange
    })
  }

  const handleInputBlur = () => {
    onPriceChange(priceRange)
  }

  const minPercent = getPercentage(priceRange[0])
  const maxPercent = getPercentage(priceRange[1])

  // Si no hay productos con precios, no mostrar el filtro
  if (maxPrice === minPrice || maxPrice === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h4 className="font-medium mb-3">Precio</h4>

      <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
        <span><NumberFlow value={priceRange[0]} />€</span>
        <span><NumberFlow value={priceRange[1]} />€</span>
      </div>

      {/* Mostrar el rango total disponible */}
      <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
        <span>{minPrice}€</span>
        <span>{maxPrice}€</span>
      </div>

      <div className="relative mb-6 px-2" ref={sliderRef}>
        {/* Track de fondo */}
        <div className="h-2 bg-gray-200 rounded-full relative">
          {/* Track activo */}
          <div
            className="absolute h-2 bg-mysGreen-100 rounded-full"
            style={{
              left: `${minPercent}%`,
              width: `${maxPercent - minPercent}%`,
            }}
          />

          {/* Thumb mínimo */}
          <div
            className="absolute w-5 h-5 bg-gray-700 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-y-1.5 hover:bg-gray-800 transition-colors"
            style={{
              left: `${minPercent}%`,
              transform: `translateX(-50%) translateY(-6px)`,
              zIndex: isDragging === 0 ? 30 : 20,
            }}
            onMouseDown={handleMouseDown(0)}
          />

          {/* Thumb máximo */}
          <div
            className="absolute w-5 h-5 bg-gray-700 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-y-1.5 hover:bg-gray-800 transition-colors"
            style={{
              left: `${maxPercent}%`,
              transform: `translateX(-50%) translateY(-6px)`,
              zIndex: isDragging === 1 ? 30 : 10,
            }}
            onMouseDown={handleMouseDown(1)}
          />
        </div>
      </div>
    </div>
  )
}