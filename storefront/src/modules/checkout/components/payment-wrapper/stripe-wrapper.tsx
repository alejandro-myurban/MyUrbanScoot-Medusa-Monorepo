"use client"

import { Stripe, StripeElementsOptions } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { HttpTypes } from "@medusajs/types"

type StripeWrapperProps = {
  paymentSession: HttpTypes.StorePaymentSession
  stripeKey?: string
  stripePromise: Promise<Stripe | null> | null
  children: React.ReactNode
}

const StripeWrapper: React.FC<StripeWrapperProps> = ({
  paymentSession,
  stripeKey,
  stripePromise,
  children,
}) => {
  const options: StripeElementsOptions = {
    clientSecret: paymentSession!.data?.client_secret as string | undefined,
    
    appearance: {
      theme: "stripe", // Opciones: "stripe", "night", "flat", "none"
      labels: "above", // Opciones: "floating" o "above"
      variables: {
        colorPrimary: "#0570de", // Color principal (botones, bordes, etc.)
        colorBackground: "#ffffff", // Fondo del formulario
        colorText: "#30313d", // Color del texto
        colorDanger: "#df1b41", // Color de errores
        fontSizeBase: "16px", // Tamaño de fuente base
        fontFamily: '"Helvetica Neue", sans-serif', // Fuente
      },
      rules: {
        ".Input": {
          backgroundColor: "#f9fafb", // Fondo de los campos de entrada
          borderColor: "#d1d5db", // Color del borde
          borderRadius: "4px", // Borde redondeado
          padding: "8px 12px", // Espaciado interno
        },
        ".Input:focus": {
          borderColor: "#0570de", // Color del borde cuando está enfocado
          boxShadow: "0 0 0 1px #0570de", // Sombra al enfocar
        },
        ".Label": {
          fontWeight: "bold", // Etiquetas en negrita
        },
        ".Error": {
          color: "#df1b41", // Color de los mensajes de error
        },
      },
    },
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
    <Elements options={options} stripe={stripePromise}>
      {children}
    </Elements>
  )
}

export default StripeWrapper
