"use client"

import { loadStripe } from "@stripe/stripe-js"
import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import React, { useEffect, useState } from "react"
import StripeWrapper from "./stripe-wrapper"
import { HttpTypes } from "@medusajs/types"
import { isStripe } from "@lib/constants"

type PaymentWrapperProps = {
  cart: HttpTypes.StoreCart
  children: React.ReactNode
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

const PaymentWrapper: React.FC<PaymentWrapperProps> = ({ cart, children }) => {
  const [paypalError, setPaypalError] = useState<string | null>(null)
  
  const paymentSession = cart.payment_collection?.payment_sessions?.find(
    (s) => s.status === "pending"
  )

  // Verificar configuración de PayPal
  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const hasPayPalConfig = !!(paypalClientId && paypalClientId !== "test")

  // Configuración de PayPal siguiendo la documentación oficial
  const paypalOptions = {
    "client-id": paypalClientId || "",
    currency: cart?.currency_code?.toUpperCase() || "EUR",
    intent: "authorize" as const,
    components: "buttons" as const,
    // Configuraciones adicionales para debugging
    "enable-funding": "venmo,paylater" as const,
    "disable-funding": "card" as const, // Opcional: deshabilitar tarjetas
  }

  // Debug de configuración
  useEffect(() => {
    console.log("🔍 PaymentWrapper Configuration:")
    console.log("- PayPal Client ID:", paypalClientId ? "✅ Configurado" : "❌ No configurado")
    console.log("- PayPal Client ID Value:", paypalClientId)
    console.log("- Currency:", cart?.currency_code?.toUpperCase())
    console.log("- Payment Session Provider:", paymentSession?.provider_id)
    console.log("- PayPal Options:", paypalOptions)
    
    // Verificar variables de entorno
    if (!paypalClientId) {
      console.error("❌ NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurado")
      setPaypalError("PayPal Client ID no configurado")
    } else if (paypalClientId === "test") {
      console.warn("⚠️ PayPal está en modo test")
    }
  }, [paypalClientId, cart?.currency_code, paymentSession?.provider_id])

  // Determinar el contenido basado en el método de pago
  const content = (() => {
    // Si es Stripe y está configurado, usar StripeWrapper
    if (
      isStripe(paymentSession?.provider_id) &&
      paymentSession &&
      stripePromise
    ) {
      return (
        <StripeWrapper
          paymentSession={paymentSession}
          stripeKey={stripeKey}
          stripePromise={stripePromise}
        >
          {children}
        </StripeWrapper>
      )
    }

    // Para otros métodos de pago
    return <div>{children}</div>
  })()

  // Si hay error en la configuración de PayPal, mostrar error
  if (paypalError && hasPayPalConfig === false) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 mb-4">
        <p className="text-red-700 text-sm font-medium">
          ❌ Error de configuración PayPal
        </p>
        <p className="text-red-600 text-xs mt-1">
          {paypalError}
        </p>
        <p className="text-red-600 text-xs mt-1">
          Añade NEXT_PUBLIC_PAYPAL_CLIENT_ID a tu archivo .env.local
        </p>
        {content}
      </div>
    )
  }

  // Si PayPal está configurado, envolver con PayPalScriptProvider
  if (hasPayPalConfig) {
    return (
      <PayPalScriptProvider 
        options={paypalOptions}
        deferLoading={false} // Cargar inmediatamente
      >
        {content}
      </PayPalScriptProvider>
    )
  }

  // Si PayPal no está configurado, devolver solo el contenido
  console.log("⚠️ PayPal no configurado, renderizando sin PayPalScriptProvider")
  return content
}

export default PaymentWrapper