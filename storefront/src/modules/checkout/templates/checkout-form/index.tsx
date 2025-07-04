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

// Función para verificar si el carrito ya tiene una sesión de Stripe válida
const hasValidStripeSession = (cart: any): boolean => {
  if (!cart?.payment_collection?.payment_sessions) return false
  
  return cart.payment_collection.payment_sessions.some(
    (session: any) => 
      session.provider_id === "pp_stripe_stripe" && 
      session.status === "pending" &&
      session.data?.client_secret // Verificar que tiene client_secret
  )
}

// Función para verificar si necesitamos inicializar Stripe
const needsStripeInitialization = (cart: any): boolean => {
  // Si no hay payment collection, definitivamente necesitamos inicializar
  if (!cart?.payment_collection) return true
  
  // Si no hay sesión de Stripe válida, necesitamos inicializar
  if (!hasValidStripeSession(cart)) return true
  
  return false
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
  const initializationAttempted = useRef(false)

  // Auto-inicializar Stripe SOLO si realmente es necesario
  useEffect(() => {
    const initializeStripeIfNeeded = async () => {
      if (!cart || isInitializing) return

      // Verificar si realmente necesitamos inicializar
      const needsInit = needsStripeInitialization(cart)
      
      if (!needsInit) {
        console.log("✅ Stripe ya está correctamente inicializado para este carrito")
        return
      }

      // Evitar múltiples intentos simultáneos
      if (initializationAttempted.current) {
        console.log("⏳ Inicialización de Stripe ya en progreso")
        return
      }

      initializationAttempted.current = true
      setIsInitializing(true)
      
      try {
        console.log("🔄 Inicializando Stripe porque es necesario...")

        let updatedCart = cart

        // Si no hay payment collection, crearla
        if (!cart.payment_collection) {
          console.log("🔄 Creando payment collection...")
          const collectionResult = await createPaymentCollection(cart.id)
          if (collectionResult?.cart) {
            updatedCart = collectionResult.cart
          }
        }

        // Verificar nuevamente si necesitamos la sesión de Stripe
        if (!hasValidStripeSession(updatedCart)) {
          console.log("🔄 Creando sesión de Stripe...")
          await initiatePaymentSession(updatedCart, {
            provider_id: "pp_stripe_stripe",
          })
        }

        // Refrescar el carrito para obtener el estado actualizado
        const refreshedCart = await retrieveCart(cart.id)
        if (refreshedCart) {
          setCart(refreshedCart)
          console.log("✅ Stripe inicializado correctamente")
        }

      } catch (error) {
        console.error("❌ Error inicializando Stripe:", error)
        initializationAttempted.current = false // Permitir reintento en caso de error
      } finally {
        setIsInitializing(false)
      }
    }

    initializeStripeIfNeeded()
  }, [cart?.id, cart?.payment_collection, isInitializing])

  // Actualizar el carrito cuando cambie initialCart
  useEffect(() => {
    if (!isInitializing && initialCart) {
      console.log("🔄 Actualizando carrito:", {
        cartId: initialCart.id,
        hasPaymentCollection: !!initialCart.payment_collection,
        hasStripeSession: hasValidStripeSession(initialCart)
      })
      
      setCart(initialCart)
      
      // Reset del flag si el carrito cambió significativamente
      if (initialCart.id !== cart?.id) {
        initializationAttempted.current = false
      }
    }
  }, [initialCart?.id, initialCart?.payment_collection, isInitializing])

  // Reset del flag cuando el componente se monta (para debugging)
  useEffect(() => {
    console.log("🔄 CheckoutForm montado/re-montado")
    // No resetear initializationAttempted aquí para evitar re-inicializaciones
    
    return () => {
      console.log("🔄 CheckoutForm desmontado")
    }
  }, [])

  if (!cart) {
    return null
  }

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div>
      {/* Indicador de inicialización */}
      {isInitializing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-blue-700 text-sm">
            🔄 Configurando métodos de pago...
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
            onCartUpdate={setCart}
          />
        </div>
{/* 
        <div>
          <Review cart={cart} />
        </div> */}
      </div>
    </div>
  )
}