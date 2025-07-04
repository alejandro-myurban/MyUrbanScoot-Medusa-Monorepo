"use client"
import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"
import { createContext } from "react"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

export const StripeContext = createContext(false)

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const options: StripeElementsOptions = {
    clientSecret: paymentSession!.data?.client_secret as string | undefined,
    appearance: {
      theme: 'stripe',
      variables: {
        // La fontFamily aquí se aplica globalmente a todos los elementos
        fontFamily: '__Archivo_8f8fd9, "Archivo", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSizeBase: '16px',
        fontWeightNormal: '500',
        fontWeightBold: '600',
        // Opcional: agregar más variables de fuente para mayor control
        fontWeightMedium: '500',
        fontLineHeight: '1.5',
      },
      rules: {
        // Hover effects - usa solo las clases públicas
        '.Tab:hover': {
          backgroundColor: '#f9fafb',
        },
        
        '.AccordionItem:hover': {
          backgroundColor: '#f9fafb',
        },
        
        '.PickerItem:hover': {
          backgroundColor: '#f9fafb',
        },
        
        // NO uses clases que empiecen con 'p-' ya que son privadas
        // En su lugar, confía en que la variable fontFamily se aplique globalmente
        
        // Si necesitas estilos específicos, usa solo las clases públicas soportadas:
        '.Input': {
          fontSize: '16px', // Importante para móvil
          fontWeight: '400',
        },
        
        '.Label': {
          fontWeight: '500',
        },
        
        '.Tab': {
          fontWeight: '500',
        },
        
        '.TabLabel': {
          fontWeight: '500',
        },
        
        '.Button': {
          fontWeight: '600',
        },
        
        '.AccordionItem': {
          fontWeight: '400',
        },
        
        '.PickerItem': {
          fontWeight: '400',
        }
      }
    }
  }

  if (!stripeKey) {
    throw new Error(
      "Stripe key is missing. Set NEXT_PUBLIC_STRIPE_KEY environment variable."
    )
  }

  if (!stripePromise) {
    throw new Error(
      "Stripe promise is missing. Make sure you have provided a valid Stripe key."
    )
  }

  if (!paymentSession?.data?.client_secret) {
    throw new Error(
      "Stripe client secret is missing. Cannot initialize Stripe."
    )
  }

  return (
    <StripeContext.Provider value={true}>
      <Elements options={options} stripe={stripePromise}>
        {children}
      </Elements>
    </StripeContext.Provider>
  )
}

export default StripeWrapper