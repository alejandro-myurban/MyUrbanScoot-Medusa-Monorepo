// hooks/useCodFee.ts
import { sdk } from "@lib/config"
import { useState } from "react"

interface UseCodFeeProps {
  cartId: string
}

interface Cart {
  id: string
  items?: Array<{
    id: string
    title: string
    unit_price: number
    quantity: number
    metadata?: Record<string, any>
  }>
  // Añade otros campos del carrito según necesites
}

interface CodFeeResponse {
  cart: Cart
  error?: string
}

export const useCodFee = ({ cartId }: UseCodFeeProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePaymentProviderChange = async (
    paymentProvider: string
  ): Promise<Cart | null> => {
    if (!cartId) {
      setError("No hay carrito disponible")
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log(`🔄 Enviando request COD para provider: ${paymentProvider}`)
      console.log(`🔍 Cart ID: ${cartId}`)

      // Usar sdk.client.fetch para endpoints custom
      const response = await sdk.client.fetch(`/store/carts/${cartId}/cod`, {
        method: "POST",
        body: {
          payment_provider: paymentProvider,
        },
      })

      console.log("✅ Response COD:", response)
      return response.cart

    } catch (err: any) {
      console.error("❌ Error en handlePaymentProviderChange:", err)
      
      // El SDK maneja los errores de manera específica
      let errorMessage = "Error desconocido"
      
      if (err?.message) {
        errorMessage = err.message
      } else if (err?.error) {
        errorMessage = err.error
      } else if (typeof err === "string") {
        errorMessage = err
      }
      
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    handlePaymentProviderChange,
    isLoading,
    error,
  }
}