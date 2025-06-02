// @lib/constants.ts

import { CreditCard } from "@medusajs/icons"
import { Mailbox } from "lucide-react"

// Función existente para Stripe
export const isStripe = (providerId?: string): boolean => {
  return providerId?.includes("stripe") ?? false
}

// Nueva función para verificar contrareembolso
export const isCashOnDelivery = (providerId?: string): boolean => {
  return providerId === "pp_system_default"
}

// Mapa de información de métodos de pago
export const paymentInfoMap: Record<string, { title: string; icon: any }> = {
  // Stripe payment methods
  card: { title: "Tarjeta", icon: CreditCard },
  ideal: { title: "iDEAL", icon: CreditCard },
  bancontact: { title: "Bancontact", icon: CreditCard },
  giropay: { title: "Giropay", icon: CreditCard },
  
  // Sistema por defecto (contrareembolso)
  pp_system_default: { title: "Contrareembolso", icon: <Mailbox /> },
  
  // Puedes agregar más métodos aquí según necesites
}

// Providers disponibles
export const PAYMENT_PROVIDERS = {
  STRIPE: "pp_stripe_stripe",
  CASH_ON_DELIVERY: "pp_system_default",
} as const

// Información detallada de métodos de pago
export const PAYMENT_METHODS = {
  stripe: {
    id: "stripe",
    provider_id: PAYMENT_PROVIDERS.STRIPE,
    title: "Tarjeta de Crédito/Débito",
    description: "Paga con tarjeta de forma segura",
    icon: CreditCard,
    requiresPaymentElement: true,
  },
  cod: {
    id: "cod", 
    provider_id: PAYMENT_PROVIDERS.CASH_ON_DELIVERY,
    title: "Contrareembolso",
    description: "Paga al recibir tu pedido",
    icon: <Mailbox />,
    requiresPaymentElement: false,
  },
} as const