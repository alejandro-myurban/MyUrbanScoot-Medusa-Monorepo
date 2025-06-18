// storefront/src/modules/checkout/components/paypal-wrapper.tsx
"use client"

import { PayPalScriptProvider } from '@paypal/react-paypal-js'
import { ReactNode } from 'react'

const paypalOptions = {
  "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
  currency: "EUR",
  intent: "capture",
}

interface PayPalWrapperProps {
  children: ReactNode
}

export default function PayPalWrapper({ children }: PayPalWrapperProps) {
  // Verificar que el client ID esté configurado
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    console.error('PayPal Client ID no está configurado')
    return <>{children}</> // Renderizar sin PayPal si no hay configuración
  }

  console.log('🟢 PayPalWrapper rendering with client ID:', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID?.substring(0, 10) + '...')

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  )
}