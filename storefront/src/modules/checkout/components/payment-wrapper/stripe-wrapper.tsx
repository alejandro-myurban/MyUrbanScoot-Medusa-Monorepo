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
        fontFamily: '__Archivo_8f8fd9, "Archivo", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSizeBase: '16px',
        fontWeightNormal: '400',
        fontWeightBold: '600',
      },
      rules: {
        // Hover con la clase correcta que encontraste
        '.p-PaymentAccordionButtonView:hover': {
          backgroundColor: '#f9fafb',
        },
        
        // También mantener los otros por si acaso
        '.Tab:hover': {
          backgroundColor: '#f9fafb',
        },
        
        '.AccordionItem:hover': {
          backgroundColor: '#f9fafb',
        },
        
        // Fuentes con clases específicas de Stripe
        '.p-PaymentAccordionButtonView': {
          fontFamily: '__Archivo_8f8fd9, "Archivo", sans-serif',
        },
        
        '.Label': {
          fontFamily: '__Archivo_8f8fd9, "Archivo", sans-serif',
          fontWeight: '500',
        },
        
        '.TabLabel': {
          fontFamily: '__Archivo_8f8fd9, "Archivo", sans-serif',
          fontWeight: '500',
        },
        
        '.Input': {
          fontFamily: '__Archivo_8f8fd9, "Archivo", sans-serif',
        },
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