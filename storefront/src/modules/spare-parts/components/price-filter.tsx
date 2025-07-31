// modules/store/components/refinement-list/price-range-filter.tsx
"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import NumberFlow from '@number-flow/react'
import { StoreProduct } from "@medusajs/types"

export const PriceRangeFilter = ({
  products,
  onPriceChange,
  initialMin,
  initialMax,
}: {
  products: StoreProduct[]
  onPriceChange: (range: number[]) => void
  initialMin?: number
  initialMax?: number
}) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(100)
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (products.length) {
      // MODIFICACIÓN CLAVE AQUÍ:
      // Recopilar TODOS los precios de las variantes de TODOS los productos
      const allProductVariantPrices: number[] = []
      products.forEach((product) => {
        product.variants?.forEach((variant) => {
          const price = variant.calculated_price?.calculated_amount
          if (typeof price === "number" && !isNaN(price)) {
            allProductVariantPrices.push(price)
          }
        })
      })

      if (allProductVariantPrices.length) {
        const calculatedMin = Math.floor(Math.min(...allProductVariantPrices))
        const calculatedMax = Math.ceil(Math.max(...allProductVariantPrices))

        setMinPrice(calculatedMin)
        setMaxPrice(calculatedMax)

        // Asegurarse de que el rango inicial esté dentro de los límites calculados
        const rangeMin = initialMin !== undefined ? Math.max(initialMin, calculatedMin) : calculatedMin
        const rangeMax = initialMax !== undefined ? Math.min(initialMax, calculatedMax) : calculatedMax

        setPriceRange([rangeMin, rangeMax])
        setIsInitialized(true)
      } else {
        // Si no se encuentran precios válidos para los productos, resetear al rango por defecto
        setMinPrice(0)
        setMaxPrice(100)
        setPriceRange([0, 100])
        setIsInitialized(true)
      }
    } else {
      // Si no hay productos, resetear al rango por defecto
      setMinPrice(0)
      setMaxPrice(100)
      setPriceRange([0, 100])
      setIsInitialized(true)
    }
  }, [products, initialMin, initialMax]) // Dependencias correctas para re-ejecutar cuando cambien

  useEffect(() => {
    if (isInitialized) {
      onPriceChange(priceRange)
    }
  }, [minPrice, maxPrice, isInitialized]) // Las dependencias deben incluir minPrice y maxPrice

  const getPercentage = (value: number) => {
    if (maxPrice === minPrice) return 0
    return ((value - minPrice) / (maxPrice - minPrice)) * 100
  }

  const getValueFromPercentage = (percentage: number) => {
    return Math.round(minPrice + (percentage / 100) * (maxPrice - minPrice))
  }

  // Función para obtener la posición X del evento (mouse o touch)
  const getClientX = (e: MouseEvent | TouchEvent): number => {
    if ('touches' in e) {
      return e.touches[0]?.clientX || 0
    }
    return e.clientX
  }

  // Manejar inicio de arrastre (mouse y touch)
  const handlePointerDown = (thumbIndex: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(thumbIndex)
  }

  // Manejar movimiento (mouse y touch)
  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (isDragging === null || !sliderRef.current) return

    const rect = sliderRef.current.getBoundingClientRect()
    const clientX = getClientX(e)
    const percentage = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
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

  // Manejar fin de arrastre (mouse y touch)
  const handlePointerUp = () => {
    if (isDragging !== null) {
      setIsDragging(null)
      onPriceChange(priceRange)
    }
  }

  useEffect(() => {
    if (isDragging !== null) {
      // Agregar eventos de mouse
      document.addEventListener("mousemove", handlePointerMove)
      document.addEventListener("mouseup", handlePointerUp)

      // Agregar eventos táctiles
      document.addEventListener("touchmove", handlePointerMove)
      document.addEventListener("touchend", handlePointerUp)

      return () => {
        // Remover eventos de mouse
        document.removeEventListener("mousemove", handlePointerMove)
        document.removeEventListener("mouseup", handlePointerUp)

        // Remover eventos táctiles
        document.removeEventListener("touchmove", handlePointerMove)
        document.removeEventListener("touchend", handlePointerUp)
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

  if (maxPrice === minPrice || maxPrice === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <h4 className="font-medium text-base mb-3">Rango de Precio</h4>

      <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
        <span><NumberFlow value={priceRange[0]} />€</span>
        <span><NumberFlow value={priceRange[1]} />€</span>
      </div>

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
            className="absolute w-5 h-5 bg-gray-900 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-y-1.5 hover:bg-gray-800 transition-colors touch-manipulation"
            style={{
              left: `${minPercent}%`,
              transform: `translateX(-50%) translateY(-6px)`,
              zIndex: isDragging === 0 ? 30 : 20,
            }}
            onMouseDown={handlePointerDown(0)}
            onTouchStart={handlePointerDown(0)}
          />

          {/* Thumb máximo */}
          <div
            className="absolute w-5 h-5 bg-gray-900 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-y-1.5 hover:bg-gray-800 transition-colors touch-manipulation"
            style={{
              left: `${maxPercent}%`,
              transform: `translateX(-50%) translateY(-6px)`,
              zIndex: isDragging === 1 ? 30 : 10,
            }}
            onMouseDown={handlePointerDown(1)}
            onTouchStart={handlePointerDown(1)}
          />
        </div>
      </div>
    </div>
  )
}