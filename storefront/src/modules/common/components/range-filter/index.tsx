"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"

export type RangeFilterProps = {
  label: string
  range: [number, number]
  onChange: (range: [number, number]) => void
  minPossible: number
  maxPossible: number
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
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
  const clampedMin = Math.max(minPossible, Math.min(maxPossible, range[0]))
  const clampedMax = Math.max(minPossible, Math.min(maxPossible, range[1]))
  setMinVal(clampedMin)
  setMaxVal(clampedMax)
}, [range, minPossible, maxPossible])


  // Protegemos la división para evitar NaN o overflo
  const rangeDelta = Math.max(1, maxPossible - minPossible)
  const minPercent = Math.max(0, Math.min(100, ((minVal - minPossible) / rangeDelta) * 100))
  const maxPercent = Math.max(0, Math.min(100, ((maxVal - minPossible) / rangeDelta) * 100))

  const calculateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!sliderRef.current) return 0

      const sliderRect = sliderRef.current.getBoundingClientRect()
      const sliderWidth = sliderRect.width - 4 // padding lateral (px-2 = 4px)
      const offsetX = clientX - sliderRect.left - 2

      let percent = (offsetX / sliderWidth) * 100
      percent = Math.max(0, Math.min(100, percent))

      const value = minPossible + (percent / 100) * (maxPossible - minPossible)
      return Math.round(value)
    },
    [minPossible, maxPossible]
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent | TouchEvent) => {
      if (isDragging === null) return

      const clientX = "touches" in event ? event.touches[0].clientX : event.clientX
      const newValue = calculateValueFromPointer(clientX)

      if (isDragging === 0) {
        const newMin = Math.min(newValue, maxVal)
        if (newMin !== minVal) {
          setMinVal(newMin)
          onChange([newMin, maxVal])
        }
      } else {
        const newMax = Math.max(newValue, minVal)
        if (newMax !== maxVal) {
          setMaxVal(newMax)
          onChange([minVal, newMax])
        }
      }
    },
    [isDragging, calculateValueFromPointer, minVal, maxVal, onChange]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  const handlePointerDown = useCallback(
    (thumbIndex: number) => (event: React.MouseEvent | React.TouchEvent) => {
      setIsDragging(thumbIndex)
      event.preventDefault()
    },
    []
  )

  useEffect(() => {
    if (isDragging !== null) {
      window.addEventListener("pointermove", handlePointerMove as EventListener)
      window.addEventListener("pointerup", handlePointerUp)
      window.addEventListener("touchmove", handlePointerMove as EventListener)
      window.addEventListener("touchend", handlePointerUp)
    } else {
      window.removeEventListener("pointermove", handlePointerMove as EventListener)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("touchmove", handlePointerMove as EventListener)
      window.removeEventListener("touchend", handlePointerUp)
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove as EventListener)
      window.removeEventListener("pointerup", handlePointerUp)
      window.removeEventListener("touchmove", handlePointerMove as EventListener)
      window.removeEventListener("touchend", handlePointerUp)
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  return (
    <div className="mb-6">
      <h4 className="font-medium text-base mb-3 lg:block hidden">{label}</h4>

      <div className="flex justify-between items-center mb-4 text-sm font-archivo">
        <div className="flex items-center gap-2">
          <span className="text-gray-600 lg:hidden">Rango:</span>
          <span className="font-medium text-gray-800 lg:text-gray-600 lg:font-normal">{minVal}</span>
          <span className="text-gray-400 lg:hidden">-</span>
          <span className="font-medium text-gray-800 lg:text-gray-600 lg:font-normal lg:ml-auto">{maxVal}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-2 text-xs text-gray-400">
        <span>{minPossible}</span>
        <span>{maxPossible}</span>
      </div>

      <div className="relative mb-6 px-2" ref={sliderRef}>
        {/* Track */}
        <div className="relative h-2 bg-gray-200 rounded-full w-full">
          {/* Track activo */}
          <div
            className="absolute h-2 bg-mysGreen-100 rounded-full"
            style={{
              left: `${Math.min(Math.max(minPercent, 0), 100)}%`,
              width: `${Math.min(Math.max(Math.abs(maxPercent - minPercent), 0), 100)}%`,
            }}
          />

          {/* Thumb mínima */}
          <div
            className="absolute w-5 h-5 bg-gray-900 border-2 border-white rounded-full shadow-lg cursor-pointer hover:bg-gray-800 transition-colors touch-manipulation"
            style={{
              left: `${minPercent}%`,
              transform: `translateX(-50%) translateY(-6px)`,
              zIndex: isDragging === 0 ? 30 : 20,
            }}
            onPointerDown={handlePointerDown(0)}
          />

          {/* Thumb máxima */}
          <div
            className="absolute w-5 h-5 bg-gray-900 border-2 border-white rounded-full shadow-lg cursor-pointer hover:bg-gray-800 transition-colors touch-manipulation"
            style={{
              left: `${maxPercent}%`,
              transform: `translateX(-50%) translateY(-6px)`,
              zIndex: isDragging === 1 ? 30 : 10,
            }}
            onPointerDown={handlePointerDown(1)}
          />
        </div>
      </div>

    </div>
  )
}

export default RangeFilter
