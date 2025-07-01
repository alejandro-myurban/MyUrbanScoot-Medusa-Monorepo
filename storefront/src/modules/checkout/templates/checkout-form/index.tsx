"use client"

import { useEffect, useState, useRef } from "react"
import { createPaymentCollection, initiatePaymentSession, retrieveCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

interface CheckoutFormProps {
  initialCart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  initialShippingMethods: any[]
  initialPaymentMethods: any[]
}

export default function CheckoutForm({
  initialCart,
  customer,
  initialShippingMethods,
  initialPaymentMethods,
}: CheckoutFormProps) {
  const [cart, setCart] = useState(initialCart)
  const [shippingMethods] = useState(initialShippingMethods)
  const [paymentMethods] = useState(initialPaymentMethods)
  const [isInitializing, setIsInitializing] = useState(false)
  const isInitialized = useRef(false)

  // Auto-inicializar Stripe al cargar
  useEffect(() => {
    const initializeStripeAutomatically = async () => {
      if (isInitialized.current || !cart || isInitializing) return

      setIsInitializing(true)
      
      try {
        isInitialized.current = true
        console.log("🔄 Inicializando Stripe automáticamente...")

        let updatedCart = cart

        // Si no hay payment collection, crearla
        if (!cart.payment_collection) {
          console.log("🔄 Creando payment collection automáticamente...")
          const collectionResult = await createPaymentCollection(cart.id)
          if (collectionResult?.cart) {
            updatedCart = collectionResult.cart
          }
        }

        // Si no hay una sesión de Stripe activa, inicializarla
        const hasStripeSession = updatedCart.payment_collection?.payment_sessions?.some(
          (session: any) => session.provider_id === "pp_stripe_stripe" && session.status === "pending"
        )

        if (!hasStripeSession) {
          console.log("🔄 Inicializando sesión de Stripe automáticamente...")
          await initiatePaymentSession(updatedCart, {
            provider_id: "pp_stripe_stripe",
          })
        }

        // Refrescar el carrito para obtener el estado actualizado
        const refreshedCart = await retrieveCart(cart.id)
        if (refreshedCart) {
          setCart(refreshedCart)
          console.log("✅ Stripe inicializado y carrito actualizado")
        }

      } catch (error) {
        console.error("❌ Error inicializando Stripe automáticamente:", error)
        isInitialized.current = false // Permitir reintentos
      } finally {
        setIsInitializing(false)
      }
    }

    initializeStripeAutomatically()
  }, [cart?.id])

  // Actualizar el carrito cuando cambie initialCart (por ejemplo, después de modificaciones)
  useEffect(() => {
    if (!isInitializing && initialCart) {
      setCart(initialCart)
    }
  }, [initialCart, isInitializing])

  if (!cart) {
    return null
  }

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div>
      {/* Indicador de inicialización opcional */}
      {isInitializing && (
        <div className="mb-4 p-3 rounded-lg">
          <span className="text-blue-700 text-sm">
            🔄 Inicializando métodos de pago...
          </span>
        </div>
      )}

      <div className="w-full grid grid-cols-1 gap-y-8">
        <div>
          <Addresses cart={cart} customer={customer} /> 
        </div>

        <div>
          <Shipping cart={cart} availableShippingMethods={shippingMethods} />
        </div>

        <div>
          <Payment 
            cart={cart} 
            availablePaymentMethods={paymentMethods}
            onCartUpdate={setCart} // Pasar función para actualizar carrito
          />
        </div>

        <div>
          <Review cart={cart} />
        </div>
      </div>
    </div>
  )
}