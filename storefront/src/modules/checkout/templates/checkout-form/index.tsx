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

  // Actualizar el carrito cuando cambie initialCart
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
    <div className="max-w-4xl mx-auto">
      {/* Indicador de inicialización */}
      {isInitializing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-700 text-sm">
            🔄 Inicializando métodos de pago...
          </span>
        </div>
      )}

      {/* Todas las secciones siempre visibles */}
      <div className="space-y-8">
        {/* Sección de Direcciones */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Información de Envío
          </h2>
          <Addresses cart={cart} customer={customer} />
        </div>

        {/* Sección de Métodos de Envío */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Método de Envío
          </h2>
          <Shipping 
            cart={cart} 
            availableShippingMethods={shippingMethods} 
          />
        </div>

        {/* Sección de Pago */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Información de Pago
          </h2>
          <Payment 
            cart={cart} 
            availablePaymentMethods={paymentMethods}
            onCartUpdate={setCart}
          />
        </div>

        {/* Sección de Revisión */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Resumen del Pedido
          </h2>
          <Review cart={cart} />
        </div>
      </div>
    </div>
  )
}