import { useState } from "react"
import { Text } from "@medusajs/ui"

interface FreeShippingProgressProps {
  currentAmount: number
  freeShippingThreshold: number
  className?: string
}

export const FreeShippingProgress = ({
  currentAmount,
  freeShippingThreshold,
  className = "",
}: FreeShippingProgressProps) => {
  const remaining = Math.max(0, freeShippingThreshold - currentAmount)
  const progress = Math.min(100, (currentAmount / freeShippingThreshold) * 100)
  const isEligible = currentAmount >= freeShippingThreshold

  return (
    <div
      className={`bg-gray-200 rounded-lg py-4 border font-archivo ${className}`}
    >
      {/* Título */}
      <div className="text-center mb-3">
        <Text className="text-black/90 font-archivo text-base">
          ENVÍO GRATIS PEDIDOS SUPERIORES A <span className="text-black font-bold">{freeShippingThreshold.toFixed(2)}€</span>
        </Text>
      </div>

      {/* Barra de progreso */}
      <div className="relative mb-3">
        {/* Contenedor de la barra */}
        <div className="w-full h-6 bg-white rounded-lg border border-gray-400 overflow-hidden">
          {/* Progreso con patrón de rayas */}
          <div
            className="h-full transition-all duration-500 ease-out relative"
            style={{
              width: `${progress}%`,
              backgroundColor: "#f4ffcc", // Verde muy claro del mismo tono
            }}
          >
            {/* Patrón de rayas animado */}
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 8px,
                  #ceff00 8px,
                  #ceff00 16px
                )`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de estado */}
      <div className="text-center">
        {isEligible ? (
          <Text className="font-medium text-green-700 text-base  font-archivo">
            ¡ENVÍO GRATIS APLICADO! 🎉
          </Text>
        ) : (
          <Text className="text-black/90 font-archivo text-base">
            AÑADE{" "}
            <span className="font-bold text-black font-archivo">
              {remaining.toFixed(2)}€
            </span>{" "}
            MÁS PARA OBTENER EL ENVÍO GRATIS
          </Text>
        )}
      </div>
    </div>
  )
}
