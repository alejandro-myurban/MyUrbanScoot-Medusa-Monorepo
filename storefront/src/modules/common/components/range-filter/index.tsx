"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"

// Definir la interfaz de props y exportarla
export type RangeFilterProps = {
  label: string
  range: [number, number]
  onChange: (range: [number, number]) => void
  minPossible: number // Rango mínimo posible del slider
  maxPossible: number // Rango máximo posible del slider
}

const RangeFilter: React.FC<RangeFilterProps> = ({
  label,
  range,
  onChange,
  minPossible,
  maxPossible,
}) => {
  const [minVal, setMinVal] = useState(range[0])
  const [maxVal, setMaxVal] = useState(range[1])
  const [isDragging, setIsDragging] = useState<number | null>(null) // null, 0 for min, 1 for max
  const sliderRef = useRef<HTMLDivElement>(null)

  // Sincronizar el estado interno con las props (útil cuando la URL cambia el rango)
  useEffect(() => {
    setMinVal(range[0])
    setMaxVal(range[1])
  }, [range])

  // Calcular el porcentaje de la barra de progreso
  const minPercent = ((minVal - minPossible) / (maxPossible - minPossible)) * 100
  const maxPercent = ((maxVal - minPossible) / (maxPossible - minPossible)) * 100

  const calculateValueFromPointer = useCallback((clientX: number) => {
    if (!sliderRef.current) return 0

    const sliderRect = sliderRef.current.getBoundingClientRect()
    const sliderWidth = sliderRect.width - 4; // Restar el padding horizontal (px-2 = 4px)
    const offsetX = clientX - sliderRect.left - 2; // Restar el padding izquierdo

    let percent = (offsetX / sliderWidth) * 100
    percent = Math.max(0, Math.min(100, percent)) // Clamp between 0 and 100

    const value = minPossible + (percent / 100) * (maxPossible - minPossible)
    return Math.round(value) // Redondear al entero más cercano
  }, [minPossible, maxPossible])

  const handlePointerMove = useCallback((event: PointerEvent | TouchEvent) => {
    if (isDragging === null) return

    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const newValue = calculateValueFromPointer(clientX)

    if (isDragging === 0) { // Min thumb
      const newMin = Math.min(newValue, maxVal)
      if (newMin !== minVal) {
        setMinVal(newMin)
        onChange([newMin, maxVal])
      }
    } else { // Max thumb
      const newMax = Math.max(newValue, minVal)
      if (newMax !== maxVal) {
        setMaxVal(newMax)
        onChange([minVal, newMax])
      }
    }
  }, [isDragging, calculateValueFromPointer, minVal, maxVal, onChange])

  const handlePointerUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handlePointerDown = useCallback((thumbIndex: number) => (event: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(thumbIndex)
    // Prevenir la selección de texto al arrastrar
    event.preventDefault();
  }, [])

  // Añadir y remover event listeners globales
  useEffect(() => {
    if (isDragging !== null) {
      window.addEventListener('pointermove', handlePointerMove as EventListener);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove as EventListener);
      window.addEventListener('touchend', handlePointerUp);
    } else {
      window.removeEventListener('pointermove', handlePointerMove as EventListener);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove as EventListener);
      window.removeEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove as EventListener);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove as EventListener);
      window.removeEventListener('touchend', handlePointerUp);
    }
  }, [isDragging, handlePointerMove, handlePointerUp])


  return (
    <div className="mb-6"> {/* Ajustado mb-4 a mb-6 */}
      <h4 className="font-medium text-base mb-3">{label}</h4> {/* Usamos 'label' aquí */}

      <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
        <span>{minVal}</span> {/* Mostrar el valor actual mínimo */}
        <span>{maxVal}</span> {/* Mostrar el valor actual máximo */}
      </div>

      {/* Rango total min/max (como en la imagen) */}
      <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
        <span>{minPossible}</span>
        <span>{maxPossible}</span>
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
              transform: `translateX(-50%) translateY(-6px)`, // Ajuste para centrar el thumb verticalmente
              zIndex: isDragging === 0 ? 30 : 20, // Z-index para el arrastre
            }}
            onPointerDown={handlePointerDown(0)} // Usar onPointerDown para unificar mouse/touch
          />

          {/* Thumb máximo */}
          <div
            className="absolute w-5 h-5 bg-gray-900 border-2 border-white rounded-full shadow-lg cursor-pointer transform -translate-y-1.5 hover:bg-gray-800 transition-colors touch-manipulation"
            style={{
              left: `${maxPercent}%`,
              transform: `translateX(-50%) translateY(-6px)`, // Ajuste para centrar el thumb verticalmente
              zIndex: isDragging === 1 ? 30 : 10, // Z-index para el arrastre
            }}
            onPointerDown={handlePointerDown(1)} // Usar onPointerDown para unificar mouse/touch
          />
        </div>
      </div>
    </div>
  )
}

export default RangeFilter